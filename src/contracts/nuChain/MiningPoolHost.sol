// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title MiningPoolHost
 * @dev Manages mining pool hosting with 100,000 WATT stake requirement
 */
contract MiningPoolHost is ReentrancyGuard, Ownable {
    IERC20 public wattToken;
    IERC20 public nuToken;
    
    struct MiningPool {
        uint256 poolId;
        address host;
        string name;
        uint256 wattLocked;
        uint256 totalHashRate;
        uint256 activeRigs;
        uint256 accumulatedRewards;
        uint256 lastClaimBlock;
        bool isActive;
        uint256 createdAt;
    }
    
    struct PoolMiner {
        address minerAddress;
        uint256 rigId;
        uint256 hashRate;
        uint256 joinedAt;
        bool isActive;
    }
    
    mapping(uint256 => MiningPool) public pools;
    mapping(uint256 => mapping(address => PoolMiner)) public poolMiners;
    mapping(uint256 => address[]) public poolMinersList;
    mapping(address => uint256[]) public hostPools;
    
    uint256 public poolCounter;
    uint256 public constant MIN_WATT_STAKE = 100000 * 10**18; // 100,000 WATT
    uint256 public currentBlock;
    
    // WATT consumption destination
    address public constant WATT_DESTINATION = 0x7069C4CEC0972D2f5FA8E6886e438656D6e6f23b;
    
    event PoolCreated(uint256 indexed poolId, address indexed host, string name, uint256 wattLocked);
    event MinerJoinedPool(uint256 indexed poolId, address indexed miner, uint256 rigId, uint256 hashRate);
    event MinerLeftPool(uint256 indexed poolId, address indexed miner);
    event PoolRewardsClaimed(uint256 indexed poolId, address indexed host, uint256 nuAmount, uint256 wattConsumed);
    event HashPowerUpdated(uint256 indexed poolId, uint256 totalHashRate, uint256 activeRigs);
    
    constructor(address _wattToken, address _nuToken) {
        wattToken = IERC20(_wattToken);
        nuToken = IERC20(_nuToken);
    }
    
    function createPool(string memory _name) external nonReentrant returns (uint256) {
        require(bytes(_name).length > 0, "Pool name required");
        require(wattToken.transferFrom(msg.sender, address(this), MIN_WATT_STAKE), "WATT transfer failed");
        
        poolCounter++;
        pools[poolCounter] = MiningPool({
            poolId: poolCounter,
            host: msg.sender,
            name: _name,
            wattLocked: MIN_WATT_STAKE,
            totalHashRate: 0,
            activeRigs: 0,
            accumulatedRewards: 0,
            lastClaimBlock: currentBlock,
            isActive: true,
            createdAt: block.timestamp
        });
        
        hostPools[msg.sender].push(poolCounter);
        
        emit PoolCreated(poolCounter, msg.sender, _name, MIN_WATT_STAKE);
        return poolCounter;
    }
    
    function joinPool(uint256 _poolId, uint256 _rigId, uint256 _hashRate) external nonReentrant {
        require(pools[_poolId].isActive, "Pool not active");
        require(_hashRate > 0, "Invalid hash rate");
        require(!poolMiners[_poolId][msg.sender].isActive, "Already in pool");
        
        poolMiners[_poolId][msg.sender] = PoolMiner({
            minerAddress: msg.sender,
            rigId: _rigId,
            hashRate: _hashRate,
            joinedAt: block.timestamp,
            isActive: true
        });
        
        pools[_poolId].totalHashRate += _hashRate;
        pools[_poolId].activeRigs++;
        poolMinersList[_poolId].push(msg.sender);
        
        emit MinerJoinedPool(_poolId, msg.sender, _rigId, _hashRate);
        emit HashPowerUpdated(_poolId, pools[_poolId].totalHashRate, pools[_poolId].activeRigs);
    }
    
    function leavePool(uint256 _poolId) external nonReentrant {
        require(poolMiners[_poolId][msg.sender].isActive, "Not in pool");
        
        PoolMiner storage miner = poolMiners[_poolId][msg.sender];
        
        pools[_poolId].totalHashRate -= miner.hashRate;
        pools[_poolId].activeRigs--;
        miner.isActive = false;
        
        // Remove from miners list
        address[] storage minersList = poolMinersList[_poolId];
        for (uint256 i = 0; i < minersList.length; i++) {
            if (minersList[i] == msg.sender) {
                minersList[i] = minersList[minersList.length - 1];
                minersList.pop();
                break;
            }
        }
        
        emit MinerLeftPool(_poolId, msg.sender);
        emit HashPowerUpdated(_poolId, pools[_poolId].totalHashRate, pools[_poolId].activeRigs);
    }
    
    function distributePoolRewards(uint256 _poolId, uint256 _totalRewards) external onlyOwner {
        require(pools[_poolId].isActive, "Pool not active");
        
        pools[_poolId].accumulatedRewards += _totalRewards;
    }
    
    function claimPoolRewards(uint256 _poolId) external nonReentrant {
        require(pools[_poolId].host == msg.sender, "Not pool host");
        
        MiningPool storage pool = pools[_poolId];
        require(pool.accumulatedRewards > 0, "No rewards to claim");
        
        uint256 rewardAmount = pool.accumulatedRewards;
        uint256 wattConsumed = (currentBlock - pool.lastClaimBlock) * pool.totalHashRate;
        
        // Reset accumulated rewards
        pool.accumulatedRewards = 0;
        pool.lastClaimBlock = currentBlock;
        
        // Send consumed WATT to destination address
        if (wattConsumed > 0) {
            wattToken.transfer(WATT_DESTINATION, wattConsumed);
        }
        
        // Transfer NU rewards to pool host
        nuToken.transfer(msg.sender, rewardAmount);
        
        emit PoolRewardsClaimed(_poolId, msg.sender, rewardAmount, wattConsumed);
    }
    
    function getPoolInfo(uint256 _poolId) external view returns (MiningPool memory) {
        return pools[_poolId];
    }
    
    function getPoolMiners(uint256 _poolId) external view returns (address[] memory) {
        return poolMinersList[_poolId];
    }
    
    function updateBlock() external onlyOwner {
        currentBlock++;
    }
}