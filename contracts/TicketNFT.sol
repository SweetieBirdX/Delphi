// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title TicketNFT
 * @dev ERC-1155 based NFT ticketing system for Monad blockchain
 * @notice Each ticket is represented as an NFT with unique seat serials
 * @notice tokenId = (eventId << 128) | seatSerial
 */
contract TicketNFT is ERC1155, AccessControl, Pausable, ReentrancyGuard {
    // Role definitions
    bytes32 public constant ORGANIZER_ROLE = keccak256("ORGANIZER_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    
    // Event tracking
    struct EventInfo {
        string name;
        string description;
        uint256 date;
        string location;
        bool active;
    }
    
    // On-chain metadata storage
    mapping(uint256 => string) private _eventNames;
    mapping(uint256 => bytes) private _metadataBlobs;
    
    // State variables
    mapping(uint256 => EventInfo) public events;
    mapping(uint256 => mapping(uint256 => bool)) public usedTickets;
    mapping(uint256 => uint256) public eventTicketCount;
    
    // Events
    event EventCreated(uint256 indexed eventId, string name, uint256 date);
    event Minted(uint256 indexed eventId, uint256 indexed seatSerial, address indexed to);
    event TicketUsed(uint256 indexed tokenId, address indexed user);
    
    constructor() ERC1155("") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ORGANIZER_ROLE, msg.sender);
    }
    
    /**
     * @dev Pack eventId and seatSerial into tokenId
     * @param eventId Event identifier (128 bits)
     * @param seatSerial Seat serial number (128 bits)
     * @return tokenId Packed token identifier
     */
    function packId(uint128 eventId, uint128 seatSerial) public pure returns (uint256) {
        return (uint256(eventId) << 128) | uint256(seatSerial);
    }
    
    /**
     * @dev Unpack tokenId into eventId and seatSerial
     * @param tokenId Packed token identifier
     * @return eventId Event identifier
     * @return seatSerial Seat serial number
     */
    function unpackId(uint256 tokenId) public pure returns (uint128 eventId, uint128 seatSerial) {
        eventId = uint128(tokenId >> 128);
        seatSerial = uint128(tokenId & 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF);
    }
    
    /**
     * @dev Create a new event
     * @param eventId Unique event identifier
     * @param name Event name
     * @param description Event description
     * @param date Event date (timestamp)
     * @param location Event location
     */
    function createEvent(
        uint256 eventId,
        string memory name,
        string memory description,
        uint256 date,
        string memory location
    ) external onlyRole(ORGANIZER_ROLE) {
        require(!events[eventId].active, "Event already exists");
        
        events[eventId] = EventInfo({
            name: name,
            description: description,
            date: date,
            location: location,
            active: true
        });
        
        emit EventCreated(eventId, name, date);
    }
    
    /**
     * @dev Mint tickets for an event
     * @param to Recipient address
     * @param eventId Event identifier
     * @param serials Array of seat serial numbers
     */
    function mintTo(
        address to,
        uint256 eventId,
        uint256[] calldata serials
    ) external onlyRole(ORGANIZER_ROLE) whenNotPaused {
        require(events[eventId].active, "Event does not exist");
        require(serials.length > 0, "No serials provided");
        
        uint256[] memory amounts = new uint256[](serials.length);
        uint256[] memory tokenIds = new uint256[](serials.length);
        
        for (uint256 i = 0; i < serials.length; i++) {
            require(serials[i] > 0, "Invalid serial number");
            uint256 tokenId = packId(uint128(eventId), uint128(serials[i]));
            tokenIds[i] = tokenId;
            amounts[i] = 1;
            
            // Emit individual mint event
            emit Minted(eventId, serials[i], to);
        }
        
        _mintBatch(to, tokenIds, amounts, "");
        
        eventTicketCount[eventId] += serials.length;
    }
    
    /**
     * @dev Check-in a ticket (mark as used)
     * @param tokenId Token identifier
     */
    function checkIn(uint256 tokenId) external onlyRole(VERIFIER_ROLE) {
        (uint128 eventId, uint128 seatSerial) = unpackId(tokenId);
        
        require(!usedTickets[eventId][seatSerial], "Ticket already used");
        
        usedTickets[eventId][seatSerial] = true;
        emit TicketUsed(tokenId, msg.sender);
    }
    
    /**
     * @dev Get token URI for metadata
     * @param id Token identifier
     * @return JSON metadata string
     */
    function uri(uint256 id) public view override returns (string memory) {
        (uint128 eventId, uint128 seatSerial) = unpackId(id);
        
        require(events[eventId].active, "Event does not exist");
        
        // Generate on-chain JSON metadata
        string memory json = string(abi.encodePacked(
            '{"name":"',
            events[eventId].name,
            ' - Seat #',
            _uint2str(seatSerial),
            '","description":"',
            events[eventId].description,
            '","image":"data:image/svg+xml;base64,',
            _generateSVG(eventId, seatSerial),
            '","attributes":[{"trait_type":"Event","value":"',
            events[eventId].name,
            '"},{"trait_type":"Date","value":"',
            _uint2str(events[eventId].date),
            '"},{"trait_type":"Location","value":"',
            events[eventId].location,
            '"},{"trait_type":"Seat","value":"',
            _uint2str(seatSerial),
            '"},{"trait_type":"Event ID","value":"',
            _uint2str(eventId),
            '"}]}'
        ));
        
        return string(abi.encodePacked(
            'data:application/json;base64,',
            _encodeBase64(bytes(json))
        ));
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
    
    // Internal helper functions
    function _generateSVG(uint256 eventId, uint256 seatSerial) internal view returns (string memory) {
        return _encodeBase64(abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200">',
            '<rect width="400" height="200" fill="#1a1a1a"/>',
            '<text x="200" y="50" text-anchor="middle" fill="white" font-family="Arial" font-size="24">',
            events[eventId].name,
            '</text>',
            '<text x="200" y="100" text-anchor="middle" fill="#888" font-family="Arial" font-size="16">',
            'Seat #',
            _uint2str(seatSerial),
            '</text>',
            '<text x="200" y="150" text-anchor="middle" fill="#666" font-family="Arial" font-size="12">',
            events[eventId].location,
            '</text>',
            '</svg>'
        ));
    }
    
    function _encodeBase64(bytes memory data) internal pure returns (string memory) {
        if (data.length == 0) return "";
        
        string memory table = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        
        uint256 encodedLen = 4 * ((data.length + 2) / 3);
        string memory result = new string(encodedLen + 32);
        
        assembly {
            let tablePtr := add(table, 1)
            let resultPtr := add(result, 32)
            
            for {
                let i := 0
            } lt(i, mload(data)) {
                i := add(i, 3)
            } {
                let input := and(mload(add(data, add(32, i))), 0xffffff)
                
                let out := mload(add(tablePtr, and(shr(250, input), 0x3F)))
                out := shl(8, out)
                out := add(out, and(mload(add(tablePtr, and(shr(244, input), 0x3F))), 0xFF))
                out := shl(8, out)
                out := add(out, and(mload(add(tablePtr, and(shr(238, input), 0x3F))), 0xFF))
                out := shl(8, out)
                out := add(out, and(mload(add(tablePtr, and(shr(232, input), 0x3F))), 0xFF))
                
                mstore(add(resultPtr, i), out)
            }
            
            switch mod(mload(data), 3)
            case 1 {
                mstore(sub(resultPtr, 2), shl(240, 0x3d3d))
            }
            case 2 {
                mstore(sub(resultPtr, 1), shl(248, 0x3d))
            }
        }
        
        return result;
    }
    
    function _uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }
    
    // Required overrides
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
