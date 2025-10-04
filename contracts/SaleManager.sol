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
    struct Sale {
        uint256 eventId;
        uint256 price;
        uint256 cap;
        uint256 sold;
        uint64 start;
        uint64 end;
        uint32 perWalletCap;
        uint32 cooldownBlocks;
        bool active;
    }
    
    // Anti-bot mechanisms
    mapping(uint256 => mapping(address => uint256)) public mintedBy;
    mapping(uint256 => mapping(address => uint256)) public lastMintBlock;
    
    // State variables
    TicketNFT public ticketNFT;
    mapping(uint256 => Sale) public sales;
    mapping(uint256 => mapping(address => bool)) public refunded;
    
    uint256 public totalProceeds;
    
    // Events
    event SaleCreated(uint256 indexed eventId, uint256 price, uint256 cap, uint64 start, uint64 end);
    event Minted(address indexed buyer, uint256 indexed eventId, uint256 amount, uint256 totalCost);
    event CheckedIn(uint256 indexed tokenId, address indexed user);
    event RefundProcessed(uint256 indexed eventId, uint256 indexed tokenId, address indexed user);
    event Withdrawn(address indexed to, uint256 amount);
    
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
     * @param start Sale start time
     * @param end Sale end time
     * @param perWalletCap Maximum tickets per wallet
     * @param cooldownBlocks Cooldown blocks between mints
     */
    function createSale(
        uint256 eventId,
        uint256 price,
        uint256 cap,
        uint64 start,
        uint64 end,
        uint32 perWalletCap,
        uint32 cooldownBlocks
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(!sales[eventId].active, "Sale already exists");
        require(price > 0, "Price must be greater than 0");
        require(cap > 0, "Cap must be greater than 0");
        require(start < end, "Invalid time range");
        require(perWalletCap > 0, "Invalid wallet cap");
        
        sales[eventId] = Sale({
            eventId: eventId,
            price: price,
            cap: cap,
            sold: 0,
            start: start,
            end: end,
            perWalletCap: perWalletCap,
            cooldownBlocks: cooldownBlocks,
            active: true
        });
        
        emit SaleCreated(eventId, price, cap, start, end);
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
        Sale storage sale = sales[eventId];
        require(sale.active, "Sale not active");
        require(block.timestamp >= sale.start, "Sale not started");
        require(block.timestamp <= sale.end, "Sale ended");
        require(amount > 0, "Amount must be greater than 0");
        require(sale.sold + amount <= sale.cap, "Exceeds sale cap");
        
        // Anti-bot protection
        require(
            mintedBy[eventId][msg.sender] + amount <= sale.perWalletCap,
            "Exceeds wallet cap"
        );
        require(
            block.number > lastMintBlock[eventId][msg.sender] + sale.cooldownBlocks,
            "Cooldown period not passed"
        );
        
        uint256 totalCost = sale.price * amount;
        require(msg.value >= totalCost, "Insufficient payment");
        
        // Update state
        sales[eventId].sold += amount;
        mintedBy[eventId][msg.sender] += amount;
        lastMintBlock[eventId][msg.sender] = block.number;
        totalProceeds += totalCost;
        
        // Generate seat serials and mint tickets
        uint256[] memory serials = new uint256[](amount);
        for (uint256 i = 0; i < amount; i++) {
            serials[i] = sale.sold - amount + i + 1;
        }
        
        // Mint tickets
        ticketNFT.mintTo(msg.sender, eventId, serials);
        
        // Refund excess payment
        if (msg.value > totalCost) {
            payable(msg.sender).sendValue(msg.value - totalCost);
        }
        
        emit Minted(msg.sender, eventId, amount, totalCost);
    }
    
    /**
     * @dev Check-in a ticket
     * @param tokenId Token identifier
     */
    function checkIn(uint256 tokenId) external onlyRole(VERIFIER_ROLE) {
        ticketNFT.checkIn(tokenId);
        emit CheckedIn(tokenId, msg.sender);
    }
    
    /**
     * @dev Process refund for cancelled event (V1 - no-op, V2 will implement)
     * @param eventId Event identifier
     * @param tokenId Token identifier
     */
    function refund(uint256 eventId, uint256 tokenId) external nonReentrant {
        // V1 implementation - no-op for now
        // V2 will implement full refund logic
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
        
        emit Withdrawn(to, amount);
    }
    
    
    /**
     * @dev End sale early
     * @param eventId Event identifier
     */
    function endSale(uint256 eventId) external onlyRole(DEFAULT_ADMIN_ROLE) {
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
     * @return Sale struct
     */
    function getSaleInfo(uint256 eventId) external view returns (Sale memory) {
        return sales[eventId];
    }
    
    /**
     * @dev Get bot protection settings
     * @param eventId Event identifier
     * @return perWalletCap Maximum tickets per wallet
     * @return cooldownBlocks Cooldown blocks
     */
    function getBotProtection(uint256 eventId) external view returns (uint32 perWalletCap, uint32 cooldownBlocks) {
        return (sales[eventId].perWalletCap, sales[eventId].cooldownBlocks);
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
        Sale memory sale = sales[eventId];
        
        if (!sale.active) {
            return (false, "Sale not active");
        }
        if (block.timestamp < sale.start) {
            return (false, "Sale not started");
        }
        if (block.timestamp > sale.end) {
            return (false, "Sale ended");
        }
        if (sale.sold + amount > sale.cap) {
            return (false, "Exceeds sale cap");
        }
        if (mintedBy[eventId][user] + amount > sale.perWalletCap) {
            return (false, "Exceeds wallet cap");
        }
        if (block.number <= lastMintBlock[eventId][user] + sale.cooldownBlocks) {
            return (false, "Cooldown period not passed");
        }
        
        return (true, "");
    }
}
