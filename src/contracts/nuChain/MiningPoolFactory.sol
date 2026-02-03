// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MiningPoolFactory is ReentrancyGuard, Ownable {
    IERC20 public wattToken;
    IERC20 public nuToken;
    
    struct MiningPool {
        uint256 poolId;
        address host;
        string name;
        uint256 wattLocked;
        uint256 createdAt;
        uint256 lastHeartbeat;
        uint256 totalMiners;
        uint256 totalHashRate;
        uint256 feePercentage; // Basis points
        uint256 minPayout;
        bool isActive;
        uint256 uptime;
        uint256 blocksConnected;
        uint256 totalBlocks;
    }
    
    struct Miner {
        address minerAddress;
        uint256 rigId;
        uint256 hashRate;
        uint256 joinedAt;
        uint256 totalEarnings;
        uint256 pendingRewards;
        bool isActive;
    }
    
    mapping(uint256 => MiningPool) public pools;
    mapping(uint256 => mapping(address => Miner)) public poolMiners; // poolId => miner => data
    mapping(address => uint256[]) public hostPools; // host => poolIds
    mapping(uint256 => address[]) public poolMinersList; // poolId => miners array
    
    uint256 public poolCounter;
    uint256 public constant MIN_WATT_LOCK = 100000 * 10**18; // 100,000 WATT
    uint256 public constant HEARTBEAT_INTERVAL = 300; // 5 minutes
    uint256 public constant MIN_UPTIME = 9500; // 95% in basis points
    
    event PoolCreated(uint256 indexed poolId, address indexed host, string name, uint256 wattLocked);
    event MinerJoined(uint256 indexed poolId, address indexed miner, uint256 rigId, uint256 hashRate);
    event MinerLeft(uint256 indexed poolId, address indexed miner);
    event RewardsDistributed(uint256 indexed poolId, uint256 totalRewards);
    event PoolHeartbeat(uint256 indexed poolId, uint256 timestamp, bool isOnline);
    event PoolDeactivated(uint256 indexed poolId, string reason);
    
    constructor(address _wattToken, address _nuToken) {
        wattToken = IERC20(_wattToken);
        nuToken = IERC20(_nuToken);
    }
    
    function createPool(
        string memory _name,
        uint256 _wattAmount,
        uint256 _feePercentage,
        uint256 _minPayout
    ) external nonReentrant {
        require(_wattAmount >= MIN_WATT_LOCK, "Insufficient WATT lock");
        require(_feePercentage <= 500, "Fee too high"); // Max 5%
        require(bytes(_name).length > 0, "Name required");
        
        wattToken.transferFrom(msg.sender, address(this), _wattAmount);
        
        poolCounter++;
        pools[poolCounter] = MiningPool({
            poolId: poolCounter,
            host: msg.sender,
            name: _name,
            wattLocked: _wattAmount,
            createdAt: block.timestamp,
            lastHeartbeat: block.timestamp,
            totalMiners: 0,
            totalHashRate: 0,
            feePercentage: _feePercentage,
            minPayout: _minPayout,
            isActive: true,
            uptime: 10000, // 100%
            blocksConnected: 0,
            totalBlocks: 0
        });
        
        hostPools[msg.sender].push(poolCounter);
        emit PoolCreated(poolCounter, msg.sender, _name, _wattAmount);
    }
    
    function joinPool(uint256 _poolId, uint256 _rigId, uint256 _hashRate) external nonReentrant {
        require(pools[_poolId].isActive, "Pool not active");
        require(_hashRate > 0, "Invalid hash rate");
        require(!poolMiners[_poolId][msg.sender].isActive, "Already in pool");
        
        poolMiners[_poolId][msg.sender] = Miner({
            minerAddress: msg.sender,
            rigId: _rigId,
            hashRate: _hashRate,
            joinedAt: block.timestamp,
            totalEarnings: 0,
            pendingRewards: 0,
            isActive: true
        });
        
        pools[_poolId].totalMiners++;
        pools[_poolId].totalHashRate += _hashRate;
        poolMinersList[_poolId].push(msg.sender);
        
        emit MinerJoined(_poolId, msg.sender, _rigId, _hashRate);
    }
    
    function leavePool(uint256 _poolId) external nonReentrant {
        require(poolMiners[_poolId][msg.sender].isActive, "Not in pool");
        
        Miner storage miner = poolMiners[_poolId][msg.sender];
        
        // Pay out pending rewards
        if (miner.pendingRewards > 0) {
            nuToken.transfer(msg.sender, miner.pendingRewards);
            miner.totalEarnings += miner.pendingRewards;
            miner.pendingRewards = 0;
        }
        
        pools[_poolId].totalMiners--;
        pools[_poolId].totalHashRate -= miner.hashRate;
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
        
        emit MinerLeft(_poolId, msg.sender);
    }
    
    function sendHeartbeat(uint256 _poolId) external {
        require(pools[_poolId].host == msg.sender, "Not pool host");
        require(pools[_poolId].isActive, "Pool not active");
        
        pools[_poolId].lastHeartbeat = block.timestamp;
        pools[_poolId].blocksConnected++;
        pools[_poolId].totalBlocks++;
        
        // Calculate uptime
        uint256 timeSinceCreation = block.timestamp - pools[_poolId].createdAt;
        uint256 expectedHeartbeats = timeSinceCreation / HEARTBEAT_INTERVAL;
        if (expectedHeartbeats > 0) {
            pools[_poolId].uptime = (pools[_poolId].blocksConnected * 10000) / expectedHeartbeats;
        }
        
        emit PoolHeartbeat(_poolId, block.timestamp, true);
    }
    
    function distributeRewards(uint256 _poolId, uint256 _totalRewards) external onlyOwner {
        require(pools[_poolId].isActive, "Pool not active");
        require(_totalRewards > 0, "No rewards to distribute");
        
        MiningPool storage pool = pools[_poolId];
        uint256 hostFee = (_totalRewards * pool.feePercentage) / 10000;
        uint256 minerRewards = _totalRewards - hostFee;
        
        // Pay host fee
        if (hostFee > 0) {
            nuToken.transfer(pool.host, hostFee);
        }
        
        // Distribute to miners based on hash rate
        address[] memory miners = poolMinersList[_poolId];
        for (uint256 i = 0; i < miners.length; i++) {
            address minerAddr = miners[i];
            Miner storage miner = poolMiners[_poolId][minerAddr];
            
            if (miner.isActive && pool.totalHashRate > 0) {
                uint256 minerShare = (minerRewards * miner.hashRate) / pool.totalHashRate;
                miner.pendingRewards += minerShare;
                
                // Auto-payout if above minimum
                if (miner.pendingRewards >= pool.minPayout) {
                    nuToken.transfer(minerAddr, miner.pendingRewards);
                    miner.totalEarnings += miner.pendingRewards;
                    miner.pendingRewards = 0;
                }
            }
        }
        
        emit RewardsDistributed(_poolId, _totalRewards);
    }
    
    function checkPoolHealth(uint256 _poolId) external view returns (bool isHealthy, string memory reason) {
        MiningPool memory pool = pools[_poolId];
        
        if (!pool.isActive) {
            return (false, "Pool deactivated");
        }
        
        if (block.timestamp - pool.lastHeartbeat > HEARTBEAT_INTERVAL * 2) {
            return (false, "No heartbeat");
        }
        
        if (pool.uptime < MIN_UPTIME) {
            return (false, "Low uptime");
        }
        
        return (true, "Healthy");
    }
    
    function deactivatePool(uint256 _poolId, string memory _reason) external onlyOwner {
        pools[_poolId].isActive = false;
        
        // Return locked WATT to host
        wattToken.transfer(pools[_poolId].host, pools[_poolId].wattLocked);
        
        emit PoolDeactivated(_poolId, _reason);
    }
    
    function getPoolInfo(uint256 _poolId) external view returns (MiningPool memory) {
        return pools[_poolId];
    }
    
    function getPoolMiners(uint256 _poolId) external view returns (address[] memory) {
        return poolMinersList[_poolId];
    }
    
    function getMinerInfo(uint256 _poolId, address _miner) external view returns (Miner memory) {
        return poolMiners[_poolId][_miner];
    }
    
    function getHostPools(address _host) external view returns (uint256[] memory) {
        return hostPools[_host];
    }
    
    function claimRewards(uint256 _poolId) external nonReentrant {
        Miner storage miner = poolMiners[_poolId][msg.sender];
        require(miner.isActive, "Not active miner");
        require(miner.pendingRewards > 0, "No rewards to claim");
        
        uint256 rewards = miner.pendingRewards;
        miner.pendingRewards = 0;
        miner.totalEarnings += rewards;
        
        nuToken.transfer(msg.sender, rewards);
    }
}