// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title NuChainCore
 * @dev Core contract for nuChain L2 - zkSync fork with Sonic Labs integration
 * Implements Bitcoin-style halving schedule for NU token rewards
 */
contract NuChainCore is ReentrancyGuard, Ownable {
    // NU Token contract
    ERC20 public nuToken;
    
    // WATT Token contract (for powering mining hardware)
    ERC20 public wattToken;
    
    // Mining Game NFT contract
    address public nftMiningContract;
    
    // Bitcoin-style halving parameters
    uint256 public constant INITIAL_BLOCK_REWARD = 50 * 10**18; // 50 NU
    uint256 public constant HALVING_INTERVAL = 210000; // Same as Bitcoin
    uint256 public constant MAX_SUPPLY = 21000000 * 10**18; // 21M NU tokens
    
    // Block and mining tracking
    uint256 public currentBlock;
    uint256 public totalSupply;
    mapping(address => uint256) public minerRewards;
    mapping(uint256 => address) public blockMiners; // block number => miner address
    
    // Mining pools
    struct MiningPool {
        address operator;
        uint256 wattLocked;
        uint256 totalHashRate;
        uint256 activeMiners;
        bool isActive;
    }
    
    mapping(uint256 => MiningPool) public miningPools;
    uint256 public poolCounter;
    
    // Events
    event BlockMined(uint256 indexed blockNumber, address indexed miner, uint256 reward);
    event MiningPoolCreated(uint256 indexed poolId, address indexed operator, uint256 wattLocked);
    event MinerJoinedPool(uint256 indexed poolId, address indexed miner, uint256 hashRate);
    event WATTConsumed(address indexed miner, uint256 amount, uint256 blockNumber);
    event NUTokensMinted(address indexed recipient, uint256 amount, uint256 blockNumber);
    
    constructor(address _nuToken, address _wattToken) {
        nuToken = ERC20(_nuToken);
        wattToken = ERC20(_wattToken);
        currentBlock = 1;
    }
    
    /**
     * @dev Calculate block reward based on Bitcoin halving schedule
     * @param blockNumber The block number to calculate reward for
     * @return The reward amount in NU tokens
     */
    function calculateBlockReward(uint256 blockNumber) public pure returns (uint256) {
        if (blockNumber == 0) return 0;
        
        uint256 halvingCount = (blockNumber - 1) / HALVING_INTERVAL;
        
        // Prevent overflow by limiting halving count
        if (halvingCount >= 64) return 0;
        
        return INITIAL_BLOCK_REWARD >> halvingCount; // Equivalent to division by 2^halvingCount
    }
    
    /**
     * @dev Mine a new block (called by zkSync operator)
     * @param miner The address of the miner
     * @param wattConsumed Amount of WATT tokens consumed for mining
     */
    function mineBlock(address miner, uint256 wattConsumed) external onlyOwner nonReentrant {
        require(miner != address(0), "Invalid miner address");
        require(wattConsumed > 0, "WATT consumption required");
        
        // Burn WATT tokens for mining
        require(wattToken.transferFrom(miner, address(0), wattConsumed), "WATT burn failed");
        
        // Calculate block reward
        uint256 reward = calculateBlockReward(currentBlock);
        
        // Check if we've reached max supply
        if (totalSupply + reward > MAX_SUPPLY) {
            reward = MAX_SUPPLY - totalSupply;
        }
        
        if (reward > 0) {
            // Mint NU tokens to miner
            totalSupply += reward;
            minerRewards[miner] += reward;
            
            // Record block miner
            blockMiners[currentBlock] = miner;
            
            emit BlockMined(currentBlock, miner, reward);
            emit WATTConsumed(miner, wattConsumed, currentBlock);
            emit NUTokensMinted(miner, reward, currentBlock);
        }
        
        currentBlock++;
    }
    
    /**
     * @dev Create a mining pool
     * @param wattAmount Amount of WATT tokens to lock
     */
    function createMiningPool(uint256 wattAmount) external nonReentrant {
        require(wattAmount >= 100000 * 10**18, "Minimum 100,000 WATT required");
        
        // Lock WATT tokens
        require(wattToken.transferFrom(msg.sender, address(this), wattAmount), "WATT transfer failed");
        
        poolCounter++;
        miningPools[poolCounter] = MiningPool({
            operator: msg.sender,
            wattLocked: wattAmount,
            totalHashRate: 0,
            activeMiners: 0,
            isActive: true
        });
        
        emit MiningPoolCreated(poolCounter, msg.sender, wattAmount);
    }
    
    /**
     * @dev Join a mining pool
     * @param poolId The pool to join
     * @param hashRate The miner's hash rate contribution
     */
    function joinMiningPool(uint256 poolId, uint256 hashRate) external {
        require(miningPools[poolId].isActive, "Pool not active");
        require(hashRate > 0, "Invalid hash rate");
        
        MiningPool storage pool = miningPools[poolId];
        pool.totalHashRate += hashRate;
        pool.activeMiners++;
        
        emit MinerJoinedPool(poolId, msg.sender, hashRate);
    }
    
    /**
     * @dev Get current block reward
     */
    function getCurrentBlockReward() external view returns (uint256) {
        return calculateBlockReward(currentBlock);
    }
    
    /**
     * @dev Get mining statistics
     */
    function getMiningStats() external view returns (
        uint256 _currentBlock,
        uint256 _totalSupply,
        uint256 _currentReward,
        uint256 _nextHalving
    ) {
        _currentBlock = currentBlock;
        _totalSupply = totalSupply;
        _currentReward = calculateBlockReward(currentBlock);
        _nextHalving = ((currentBlock / HALVING_INTERVAL) + 1) * HALVING_INTERVAL;
    }
    
    /**
     * @dev Claim accumulated NU rewards
     */
    function claimRewards() external nonReentrant {
        uint256 amount = minerRewards[msg.sender];
        require(amount > 0, "No rewards to claim");
        
        minerRewards[msg.sender] = 0;
        require(nuToken.transfer(msg.sender, amount), "NU transfer failed");
    }
    
    /**
     * @dev Set NFT mining contract address
     */
    function setNFTMiningContract(address _nftContract) external onlyOwner {
        nftMiningContract = _nftContract;
    }
    
    /**
     * @dev Emergency functions
     */
    function pause() external onlyOwner {
        // Implement pause functionality
    }
    
    function unpause() external onlyOwner {
        // Implement unpause functionality
    }
}