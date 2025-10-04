// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./TicketNFT.sol";

/**
 * @title SaleManager
 * @dev Manages ticket sales, pricing, and anti-bot mechanisms
 * @notice Handles fair distribution and prevents gas wars
 */
contract SaleManager is AccessControl, Pausable, ReentrancyGuard {
    using Address for address payable;
    
    // Role definitions
    bytes32 public constant ORGANIZER_ROLE = keccak256("ORGANIZER_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    
    // Sale information
    struct SaleInfo {
        uint256 eventId;
        uint256 price;
        uint256 cap;
        uint256 sold;
        bool active;
        uint256 startTime;
        uint256 endTime;
    }
    
    // Anti-bot mechanisms
    struct BotProtection {
        uint256 perWalletCap;
        uint256 cooldownBlocks;
        mapping(address => uint256) mintedBy;
        mapping(address => uint256) lastMintBlock;
    }
    
    // State variables
    TicketNFT public ticketNFT;
    mapping(uint256 => SaleInfo) public sales;
    mapping(uint256 => BotProtection) public botProtection;
    mapping(uint256 => mapping(address => bool)) public refunded;
    
    uint256 public totalProceeds;
    uint256 public constant DEFAULT_WALLET_CAP = 5;
    uint256 public constant DEFAULT_COOLDOWN = 1;
    
    // Events
    event SaleCreated(uint256 indexed eventId, uint256 price, uint256 cap);
    event TicketPurchased(address indexed buyer, uint256 indexed eventId, uint256 amount, uint256 totalCost);
    event TicketCheckedIn(uint256 indexed tokenId, address indexed user);
    event RefundProcessed(uint256 indexed eventId, uint256 indexed tokenId, address indexed user);
    event ProceedsWithdrawn(address indexed to, uint256 amount);
    
    constructor(address _ticketNFT) {
        ticketNFT = TicketNFT(_ticketNFT);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ORGANIZER_ROLE, msg.sender);
    }
    
    /**
     * @dev Create a new sale
     * @param eventId Event identifier
     * @param price Price per ticket in wei
     * @param cap Maximum tickets to sell
     * @param startTime Sale start time
     * @param endTime Sale end time
     */
    function createSale(
        uint256 eventId,
        uint256 price,
        uint256 cap,
        uint256 startTime,
        uint256 endTime
    ) external onlyRole(ORGANIZER_ROLE) {
        require(!sales[eventId].active, "Sale already exists");
        require(price > 0, "Price must be greater than 0");
        require(cap > 0, "Cap must be greater than 0");
        require(startTime < endTime, "Invalid time range");
        
        sales[eventId] = SaleInfo({
            eventId: eventId,
            price: price,
            cap: cap,
            sold: 0,
            active: true,
            startTime: startTime,
            endTime: endTime
        });
        
        // Set default anti-bot protection
        botProtection[eventId].perWalletCap = DEFAULT_WALLET_CAP;
        botProtection[eventId].cooldownBlocks = DEFAULT_COOLDOWN;
        
        emit SaleCreated(eventId, price, cap);
    }
    
    /**
     * @dev Purchase tickets
     * @param eventId Event identifier
     * @param amount Number of tickets to purchase
     */
    function mint(uint256 eventId, uint256 amount) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
    {
        SaleInfo storage sale = sales[eventId];
        require(sale.active, "Sale not active");
        require(block.timestamp >= sale.startTime, "Sale not started");
        require(block.timestamp <= sale.endTime, "Sale ended");
        require(amount > 0, "Amount must be greater than 0");
        require(sale.sold + amount <= sale.cap, "Exceeds sale cap");
        
        // Anti-bot protection
        BotProtection storage protection = botProtection[eventId];
        require(
            protection.mintedBy[msg.sender] + amount <= protection.perWalletCap,
            "Exceeds wallet cap"
        );
        require(
            block.number > protection.lastMintBlock[msg.sender] + protection.cooldownBlocks,
            "Cooldown period not passed"
        );
        
        uint256 totalCost = sale.price * amount;
        require(msg.value >= totalCost, "Insufficient payment");
        
        // Update state
        sale.sold += amount;
        protection.mintedBy[msg.sender] += amount;
        protection.lastMintBlock[msg.sender] = block.number;
        totalProceeds += totalCost;
        
        // Generate seat serials and mint tickets
        uint256[] memory serials = new uint256[](amount);
        for (uint256 i = 0; i < amount; i++) {
            serials[i] = sale.sold - amount + i + 1;
        }
        
        // Mint tickets (this will call TicketNFT.mintTo)
        ticketNFT.mintTo(msg.sender, eventId, serials);
        
        // Refund excess payment
        if (msg.value > totalCost) {
            payable(msg.sender).sendValue(msg.value - totalCost);
        }
        
        emit TicketPurchased(msg.sender, eventId, amount, totalCost);
    }
    
    /**
     * @dev Check-in a ticket
     * @param tokenId Token identifier
     */
    function checkIn(uint256 tokenId) external onlyRole(VERIFIER_ROLE) {
        ticketNFT.checkIn(tokenId);
        emit TicketCheckedIn(tokenId, msg.sender);
    }
    
    /**
     * @dev Process refund for cancelled event
     * @param eventId Event identifier
     * @param tokenId Token identifier
     */
    function refund(uint256 eventId, uint256 tokenId) external nonReentrant {
        require(!sales[eventId].active, "Sale still active");
        require(!refunded[eventId][msg.sender], "Already refunded");
        
        // Verify ownership
        require(ticketNFT.balanceOf(msg.sender, tokenId) > 0, "Not ticket owner");
        
        // Mark as refunded
        refunded[eventId][msg.sender] = true;
        
        // Calculate refund amount
        uint256 refundAmount = sales[eventId].price;
        require(address(this).balance >= refundAmount, "Insufficient contract balance");
        
        // Process refund
        payable(msg.sender).sendValue(refundAmount);
        
        emit RefundProcessed(eventId, tokenId, msg.sender);
    }
    
    /**
     * @dev Withdraw proceeds
     * @param to Recipient address
     */
    function withdrawProceeds(address payable to) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(to != address(0), "Invalid recipient");
        require(address(this).balance > 0, "No proceeds to withdraw");
        
        uint256 amount = address(this).balance;
        to.sendValue(amount);
        
        emit ProceedsWithdrawn(to, amount);
    }
    
    /**
     * @dev Update anti-bot protection settings
     * @param eventId Event identifier
     * @param perWalletCap Maximum tickets per wallet
     * @param cooldownBlocks Cooldown blocks between mints
     */
    function updateBotProtection(
        uint256 eventId,
        uint256 perWalletCap,
        uint256 cooldownBlocks
    ) external onlyRole(ORGANIZER_ROLE) {
        require(sales[eventId].active, "Sale does not exist");
        require(perWalletCap > 0, "Invalid wallet cap");
        
        botProtection[eventId].perWalletCap = perWalletCap;
        botProtection[eventId].cooldownBlocks = cooldownBlocks;
    }
    
    /**
     * @dev End sale early
     * @param eventId Event identifier
     */
    function endSale(uint256 eventId) external onlyRole(ORGANIZER_ROLE) {
        require(sales[eventId].active, "Sale not active");
        sales[eventId].active = false;
    }
    
    /**
     * @dev Pause contract
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause contract
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Get sale information
     * @param eventId Event identifier
     * @return SaleInfo struct
     */
    function getSaleInfo(uint256 eventId) external view returns (SaleInfo memory) {
        return sales[eventId];
    }
    
    /**
     * @dev Get bot protection settings
     * @param eventId Event identifier
     * @return perWalletCap Maximum tickets per wallet
     * @return cooldownBlocks Cooldown blocks
     */
    function getBotProtection(uint256 eventId) external view returns (uint256 perWalletCap, uint256 cooldownBlocks) {
        return (botProtection[eventId].perWalletCap, botProtection[eventId].cooldownBlocks);
    }
    
    /**
     * @dev Check if user can mint
     * @param eventId Event identifier
     * @param user User address
     * @param amount Amount to mint
     * @return canMintResult Whether user can mint
     * @return reason Reason if cannot mint
     */
    function canMint(uint256 eventId, address user, uint256 amount) external view returns (bool canMintResult, string memory reason) {
        SaleInfo memory sale = sales[eventId];
        uint256 perWalletCap = botProtection[eventId].perWalletCap;
        uint256 cooldownBlocks = botProtection[eventId].cooldownBlocks;
        
        if (!sale.active) {
            return (false, "Sale not active");
        }
        if (block.timestamp < sale.startTime) {
            return (false, "Sale not started");
        }
        if (block.timestamp > sale.endTime) {
            return (false, "Sale ended");
        }
        if (sale.sold + amount > sale.cap) {
            return (false, "Exceeds sale cap");
        }
        if (botProtection[eventId].mintedBy[user] + amount > perWalletCap) {
            return (false, "Exceeds wallet cap");
        }
        if (block.number <= botProtection[eventId].lastMintBlock[user] + cooldownBlocks) {
            return (false, "Cooldown period not passed");
        }
        
        return (true, "");
    }
}
