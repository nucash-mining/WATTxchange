// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title MiningRigConfigurator
 * @dev Manages NFT mining rig configurations and WATT consumption
 */
contract MiningRigConfigurator is ReentrancyGuard, Ownable {
    IERC1155 public nftContract;
    IERC20 public wattToken;
    IERC20 public nuToken;
    
    // WATT consumption destination
    address public constant WATT_DESTINATION = 0x7069C4CEC0972D2f5FA8E6886e438656D6e6f23b;
    
    struct Component {
        uint256 tokenId;
        ComponentType componentType;
        uint256 hashRateBonus; // Percentage
        uint256 powerConsumption; // Watts
        bool isRequired;
    }
    
    struct MiningRig {
        uint256 rigId;
        address owner;
        uint256[] componentTokenIds;
        uint256 totalHashRate; // MH/s
        uint256 totalPowerConsumption; // Watts
        uint256 wattPerBlock;
        bool isActive;
        uint256 poolId;
        uint256 accumulatedNU;
        uint256 lastClaimBlock;
        uint256 wattBalance;
        bool isPoolOperator;
    }
    
    enum ComponentType {
        PC_CASE,      // Required: Free Mint Gaming PC
        PROCESSOR,    // Required: XL1 Processor
        GPU           // Optional: TX120 or GP50 (1-2 total)
    }
    
    mapping(uint256 => Component) public components;
    mapping(uint256 => MiningRig) public rigs;
    mapping(address => uint256[]) public userRigs;
    mapping(address => bool) public poolOperators;
    mapping(address => uint256) public operatorWattDeposits;
    
    uint256 public rigCounter;
    uint256 public constant BASE_HASH_RATE = 100; // 100 MH/s base
    uint256 public constant POOL_OPERATOR_DEPOSIT = 100000 * 10**18; // 100,000 WATT
    uint256 public currentBlock;
    
    // Cross-chain communication
    address public nuChainValidator;
    mapping(uint256 => uint256) public blockRewards; // block => total NU rewards
    
    event RigConfigured(uint256 indexed rigId, address indexed owner, uint256[] components, uint256 hashRate, uint256 wattPerBlock);
    event RigStartedMining(uint256 indexed rigId, uint256 poolId);
    event RigStoppedMining(uint256 indexed rigId);
    event WattConsumed(uint256 indexed rigId, uint256 amount, uint256 blockNumber);
    event RewardsClaimed(address indexed miner, uint256 nuAmount, uint256 wattConsumed);
    event PoolOperatorRegistered(address indexed operator, uint256 wattLocked);
    event HashPowerSubmitted(uint256 blockNumber, uint256 totalHashPower, address[] miners);
    
    constructor(address _nftContract, address _wattToken, address _nuToken) {
        nftContract = IERC1155(_nftContract);
        wattToken = IERC20(_wattToken);
        nuToken = IERC20(_nuToken);
        
        _initializeComponents();
    }
    
    function _initializeComponents() internal {
        // Free Mint Gaming PC - Token ID 1 (Required)
        components[1] = Component({
            tokenId: 1,
            componentType: ComponentType.PC_CASE,
            hashRateBonus: 0,
            powerConsumption: 50, // Base power
            isRequired: true
        });
        
        // XL1 Processor - Token ID 3 (Required)
        components[3] = Component({
            tokenId: 3,
            componentType: ComponentType.PROCESSOR,
            hashRateBonus: 25,
            powerConsumption: 125,
            isRequired: true
        });
        
        // TX120 GPU - Token ID 4
        components[4] = Component({
            tokenId: 4,
            componentType: ComponentType.GPU,
            hashRateBonus: 150,
            powerConsumption: 320,
            isRequired: false
        });
        
        // GP50 GPU - Token ID 5
        components[5] = Component({
            tokenId: 5,
            componentType: ComponentType.GPU,
            hashRateBonus: 200,
            powerConsumption: 450,
            isRequired: false
        });
    }
    
    function configureRig(uint256[] memory _componentTokenIds) external nonReentrant returns (uint256) {
        require(_componentTokenIds.length >= 2, "Need at least PC case and processor");
        require(_componentTokenIds.length <= 4, "Too many components");
        
        // Verify ownership and validate configuration
        _validateRigConfiguration(_componentTokenIds);
        
        // Calculate rig performance
        (uint256 hashRate, uint256 powerConsumption) = _calculateRigPerformance(_componentTokenIds);
        uint256 wattPerBlock = _calculateWattPerBlock(powerConsumption);
        
        rigCounter++;
        rigs[rigCounter] = MiningRig({
            rigId: rigCounter,
            owner: msg.sender,
            componentTokenIds: _componentTokenIds,
            totalHashRate: hashRate,
            totalPowerConsumption: powerConsumption,
            wattPerBlock: wattPerBlock,
            isActive: false,
            poolId: 0,
            accumulatedNU: 0,
            lastClaimBlock: currentBlock,
            wattBalance: 0,
            isPoolOperator: poolOperators[msg.sender]
        });
        
        userRigs[msg.sender].push(rigCounter);
        
        // Lock NFTs in contract
        for (uint256 i = 0; i < _componentTokenIds.length; i++) {
            nftContract.safeTransferFrom(msg.sender, address(this), _componentTokenIds[i], 1, "");
        }
        
        emit RigConfigured(rigCounter, msg.sender, _componentTokenIds, hashRate, wattPerBlock);
        return rigCounter;
    }
    
    function _validateRigConfiguration(uint256[] memory _componentTokenIds) internal view {
        bool hasPcCase = false;
        bool hasProcessor = false;
        uint256 gpuCount = 0;
        
        for (uint256 i = 0; i < _componentTokenIds.length; i++) {
            uint256 tokenId = _componentTokenIds[i];
            require(nftContract.balanceOf(msg.sender, tokenId) > 0, "Don't own component");
            
            ComponentType compType = components[tokenId].componentType;
            
            if (compType == ComponentType.PC_CASE) {
                require(!hasPcCase, "Multiple PC cases not allowed");
                require(tokenId == 1, "Must use Free Mint Gaming PC");
                hasPcCase = true;
            } else if (compType == ComponentType.PROCESSOR) {
                require(!hasProcessor, "Multiple processors not allowed");
                require(tokenId == 3, "Must use XL1 Processor");
                hasProcessor = true;
            } else if (compType == ComponentType.GPU) {
                require(tokenId == 4 || tokenId == 5, "Invalid GPU type");
                gpuCount++;
                require(gpuCount <= 2, "Maximum 2 GPUs allowed");
            }
        }
        
        require(hasPcCase, "Free Mint Gaming PC required");
        require(hasProcessor, "XL1 Processor required");
        require(gpuCount >= 1, "At least 1 GPU required (TX120 or GP50)");
    }
    
    function _calculateRigPerformance(uint256[] memory _componentTokenIds) internal view returns (uint256 hashRate, uint256 powerConsumption) {
        hashRate = BASE_HASH_RATE;
        powerConsumption = 0;
        
        for (uint256 i = 0; i < _componentTokenIds.length; i++) {
            Component memory comp = components[_componentTokenIds[i]];
            
            // Add component bonuses
            hashRate += (hashRate * comp.hashRateBonus) / 100;
            powerConsumption += comp.powerConsumption;
        }
    }
    
    function _calculateWattPerBlock(uint256 powerConsumption) internal pure returns (uint256) {
        // WATT consumption per block based on power consumption
        // Assuming 1 block per second, convert watts to WATT tokens
        return powerConsumption * 713633138247230; // Wei per watt per block
    }
    
    function registerPoolOperator() external nonReentrant {
        require(!poolOperators[msg.sender], "Already registered");
        require(wattToken.transferFrom(msg.sender, address(this), POOL_OPERATOR_DEPOSIT), "WATT transfer failed");
        
        poolOperators[msg.sender] = true;
        operatorWattDeposits[msg.sender] = POOL_OPERATOR_DEPOSIT;
        
        emit PoolOperatorRegistered(msg.sender, POOL_OPERATOR_DEPOSIT);
    }
    
    function startMining(uint256 _rigId, uint256 _poolId) external nonReentrant {
        require(rigs[_rigId].owner == msg.sender, "Not rig owner");
        require(!rigs[_rigId].isActive, "Already mining");
        
        MiningRig storage rig = rigs[_rigId];
        
        // Pool operators don't need WATT balance
        if (!rig.isPoolOperator) {
            require(rig.wattBalance >= rig.wattPerBlock, "Insufficient WATT balance");
        }
        
        rig.isActive = true;
        rig.poolId = _poolId;
        
        emit RigStartedMining(_rigId, _poolId);
    }
    
    function stopMining(uint256 _rigId) external nonReentrant {
        require(rigs[_rigId].owner == msg.sender, "Not rig owner");
        require(rigs[_rigId].isActive, "Not mining");
        
        rigs[_rigId].isActive = false;
        rigs[_rigId].poolId = 0;
        
        emit RigStoppedMining(_rigId);
    }
    
    function depositWatt(uint256 _rigId, uint256 _amount) external nonReentrant {
        require(rigs[_rigId].owner == msg.sender, "Not rig owner");
        require(wattToken.transferFrom(msg.sender, address(this), _amount), "WATT transfer failed");
        
        rigs[_rigId].wattBalance += _amount;
    }
    
    function processBlock() external onlyOwner {
        currentBlock++;
        
        address[] memory activeMiners = new address[](rigCounter);
        uint256[] memory hashPowers = new uint256[](rigCounter);
        uint256 totalNetworkHashPower = 0;
        uint256 activeMinerCount = 0;
        
        // Process each active rig
        for (uint256 i = 1; i <= rigCounter; i++) {
            MiningRig storage rig = rigs[i];
            
            if (rig.isActive) {
                // Consume WATT if not pool operator
                if (!rig.isPoolOperator) {
                    if (rig.wattBalance >= rig.wattPerBlock) {
                        rig.wattBalance -= rig.wattPerBlock;
                        emit WattConsumed(i, rig.wattPerBlock, currentBlock);
                    } else {
                        // Insufficient WATT - stop mining
                        rig.isActive = false;
                        emit RigStoppedMining(i);
                        continue;
                    }
                }
                
                // Add to network hash power
                activeMiners[activeMinerCount] = rig.owner;
                hashPowers[activeMinerCount] = rig.totalHashRate;
                totalNetworkHashPower += rig.totalHashRate;
                activeMinerCount++;
            }
        }
        
        // Submit hash power data to nuChain
        if (totalNetworkHashPower > 0) {
            // Resize arrays to actual size
            address[] memory finalMiners = new address[](activeMinerCount);
            uint256[] memory finalHashPowers = new uint256[](activeMinerCount);
            
            for (uint256 i = 0; i < activeMinerCount; i++) {
                finalMiners[i] = activeMiners[i];
                finalHashPowers[i] = hashPowers[i];
            }
            
            emit HashPowerSubmitted(currentBlock, totalNetworkHashPower, finalMiners);
            
            // In production, this would call nuChain contract
            _submitToNuChain(currentBlock, totalNetworkHashPower, finalMiners, finalHashPowers);
        }
    }
    
    function _submitToNuChain(
        uint256 blockNumber,
        uint256 totalHashPower,
        address[] memory miners,
        uint256[] memory hashPowers
    ) internal {
        // This would be a cross-chain call to nuChain L2
        // For now, we'll emit an event that the validator can listen to
        
        // Calculate NU rewards for this block (simplified)
        uint256 blockReward = 50 * 10**18; // 50 NU per block
        blockRewards[blockNumber] = blockReward;
        
        // Distribute rewards proportionally
        for (uint256 i = 0; i < miners.length; i++) {
            uint256 minerReward = (blockReward * hashPowers[i]) / totalHashPower;
            
            // Find miner's rigs and accumulate rewards
            uint256[] memory minerRigs = userRigs[miners[i]];
            for (uint256 j = 0; j < minerRigs.length; j++) {
                if (rigs[minerRigs[j]].isActive) {
                    rigs[minerRigs[j]].accumulatedNU += minerReward / minerRigs.length;
                }
            }
        }
    }
    
    function claimRewards(uint256 _rigId) external nonReentrant {
        require(rigs[_rigId].owner == msg.sender, "Not rig owner");
        
        MiningRig storage rig = rigs[_rigId];
        require(rig.accumulatedNU > 0, "No rewards to claim");
        
        uint256 rewardAmount = rig.accumulatedNU;
        uint256 wattConsumed = (currentBlock - rig.lastClaimBlock) * rig.wattPerBlock;
        
        // Reset accumulated rewards
        rig.accumulatedNU = 0;
        rig.lastClaimBlock = currentBlock;
        
        // Send consumed WATT to destination address
        if (wattConsumed > 0 && !rig.isPoolOperator) {
            wattToken.transfer(WATT_DESTINATION, wattConsumed);
        }
        
        // Transfer NU rewards to miner
        nuToken.transfer(msg.sender, rewardAmount);
        
        emit RewardsClaimed(msg.sender, rewardAmount, wattConsumed);
    }
    
    function estimateWattUsagePerDay(uint256[] memory _componentTokenIds) external view returns (uint256) {
        (, uint256 powerConsumption) = _calculateRigPerformance(_componentTokenIds);
        uint256 wattPerBlock = _calculateWattPerBlock(powerConsumption);
        
        // Assuming 86400 blocks per day (1 block per second)
        return wattPerBlock * 86400;
    }
    
    function getRigInfo(uint256 _rigId) external view returns (MiningRig memory) {
        return rigs[_rigId];
    }
    
    function getUserRigs(address _user) external view returns (uint256[] memory) {
        return userRigs[_user];
    }
    
    function setNuChainValidator(address _validator) external onlyOwner {
        nuChainValidator = _validator;
    }
    
    // Required for ERC1155 receiver
    function onERC1155Received(address, address, uint256, uint256, bytes calldata) external pure returns (bytes4) {
        return this.onERC1155Received.selector;
    }
    
    function onERC1155BatchReceived(address, address, uint256[] calldata, uint256[] calldata, bytes calldata) external pure returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }
}