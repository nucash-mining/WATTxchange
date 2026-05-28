// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title wXMR - Wrapped Monero Token
 * @dev ERC-20 token representing Monero on Altcoinchain
 * Each wXMR token is backed 1:1 by real XMR held in the bridge wallet
 */
contract wXMR is ERC20, Ownable, Pausable, ReentrancyGuard {
    // Bridge contract that can mint/burn tokens
    address public bridge;
    
    // Maximum supply (can be updated by owner for security)
    uint256 public maxSupply;
    
    // Events
    event BridgeUpdated(address indexed oldBridge, address indexed newBridge);
    event MaxSupplyUpdated(uint256 oldMaxSupply, uint256 newMaxSupply);
    
    constructor(
        string memory name,
        string memory symbol,
        uint256 _maxSupply
    ) ERC20(name, symbol) {
        maxSupply = _maxSupply;
        _transferOwnership(msg.sender);
    }
    
    /**
     * @dev Set the bridge contract address
     * @param _bridge Address of the Monero bridge contract
     */
    function setBridge(address _bridge) external onlyOwner {
        require(_bridge != address(0), "Bridge cannot be zero address");
        address oldBridge = bridge;
        bridge = _bridge;
        emit BridgeUpdated(oldBridge, _bridge);
    }
    
    /**
     * @dev Update maximum supply for security
     * @param _maxSupply New maximum supply
     */
    function setMaxSupply(uint256 _maxSupply) external onlyOwner {
        require(_maxSupply >= totalSupply(), "Max supply cannot be less than current supply");
        uint256 oldMaxSupply = maxSupply;
        maxSupply = _maxSupply;
        emit MaxSupplyUpdated(oldMaxSupply, _maxSupply);
    }
    
    /**
     * @dev Mint wXMR tokens (only bridge can call)
     * @param to Address to mint tokens to
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external {
        require(msg.sender == bridge, "Only bridge can mint");
        require(totalSupply() + amount <= maxSupply, "Would exceed max supply");
        _mint(to, amount);
    }
    
    /**
     * @dev Burn wXMR tokens (only bridge can call)
     * @param from Address to burn tokens from
     * @param amount Amount to burn
     */
    function burn(address from, uint256 amount) external {
        require(msg.sender == bridge, "Only bridge can burn");
        _burn(from, amount);
    }
    
    /**
     * @dev Pause token transfers in emergency
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause token transfers
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Override transfer functions to include pausable
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }
}
