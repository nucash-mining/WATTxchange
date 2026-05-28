// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title NUToken
 * @dev Native token for nuChain L2 with Bitcoin-style supply mechanics
 */
contract NUToken is ERC20, Ownable, Pausable {
    uint256 public constant MAX_SUPPLY = 21000000 * 10**18; // 21M NU tokens
    
    // Mining and minting permissions
    mapping(address => bool) public miners;
    mapping(address => bool) public minters;
    
    // Supply tracking
    uint256 public totalMined;
    uint256 public totalBurned;
    
    // Events
    event MinerAdded(address indexed miner);
    event MinerRemoved(address indexed miner);
    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);
    event TokensMined(address indexed miner, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);
    
    modifier onlyMiner() {
        require(miners[msg.sender], "Not authorized miner");
        _;
    }
    
    modifier onlyMinter() {
        require(minters[msg.sender], "Not authorized minter");
        _;
    }
    
    constructor() ERC20("NU Token", "NU") {
        // Add deployer as initial miner and minter
        miners[msg.sender] = true;
        minters[msg.sender] = true;
    }
    
    /**
     * @dev Mint NU tokens (only by authorized miners)
     * @param to Address to mint tokens to
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external onlyMiner whenNotPaused {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        
        _mint(to, amount);
        totalMined += amount;
            
        emit TokensMined(to, amount);
    }
    
    /**
     * @dev Burn NU tokens
     * @param amount Amount to burn
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
        totalBurned += amount;
        
        emit TokensBurned(msg.sender, amount);
    }
    
    /**
     * @dev Burn NU tokens from a specific address (with allowance)
     * @param from Address to burn from
     * @param amount Amount to burn
     */
    function burnFrom(address from, uint256 amount) external {
        _spendAllowance(from, msg.sender, amount);
        _burn(from, amount);
        totalBurned += amount;
        
        emit TokensBurned(from, amount);
    }
    
    /**
     * @dev Add authorized miner
     * @param miner Address to add as miner
     */
    function addMiner(address miner) external onlyOwner {
        miners[miner] = true;
        emit MinerAdded(miner);
    }
    
    /**
     * @dev Remove authorized miner
     * @param miner Address to remove as miner
     */
    function removeMiner(address miner) external onlyOwner {
        miners[miner] = false;
        emit MinerRemoved(miner);
    }
    
    /**
     * @dev Add authorized minter
     * @param minter Address to add as minter
     */
    function addMinter(address minter) external onlyOwner {
        minters[minter] = true;
        emit MinterAdded(minter);
    }
    
    /**
     * @dev Remove authorized minter
     * @param minter Address to remove as minter
     */
    function removeMinter(address minter) external onlyOwner {
        minters[minter] = false;
        emit MinterRemoved(minter);
    }
    
    /**
     * @dev Get circulating supply (total supply minus burned)
     */
    function circulatingSupply() external view returns (uint256) {
        return totalSupply() - totalBurned;
    }
    
    /**
     * @dev Pause token transfers
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
     * @dev Override transfer to add pause functionality
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }
}