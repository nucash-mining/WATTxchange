// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MiningRigContract is ReentrancyGuard, Ownable {
    IERC1155 public nftContract;
    IERC20 public wattToken;
    
    struct Component {
        uint256 tokenId;
        ComponentType componentType;
        uint256 hashRateBonus; // Percentage
        uint256 powerConsumption; // Watts
        uint256 rarityMultiplier; // Basis points
    }
    
    struct MiningRig {
        uint256 rigId;
        address owner;
        uint256[] componentTokenIds;
        uint256 totalHashRate; // MH/s
        uint256 totalPowerConsumption; // Watts
        uint256 efficiency; // MH/W * 1000
        bool hasGenesisBadge;
        uint256 createdAt;
        bool isActive;
        uint256 poolId;
        uint256 totalEarnings;
        uint256 wattDeposited;
        uint256 wattPerHour;
        uint256 endTime;
    }
    
    enum ComponentType {
        PC_CASE,      // Required base
        PROCESSOR,    // Required
        GPU,          // Optional, up to 2
        BOOST_ITEM    // Genesis Badge
    }
    
    mapping(uint256 => Component) public components;
    mapping(uint256 => MiningRig) public rigs;
    mapping(address => uint256[]) public userRigs;
    mapping(address => bool) public poolOperators;
    mapping(address => uint256) public operatorWattDeposits;
    
    uint256 public rigCounter;
    uint256 public constant BASE_HASH_RATE = 100; // 100 MH/s base
    uint256 public constant POOL_OPERATOR_DEPOSIT = 100000 * 10**18; // 100,000 WATT
    
    // Component definitions (Token ID => Component data)
    mapping(uint256 => bool) public validComponents;
    
    event RigConfigured(uint256 indexed rigId, address indexed owner, uint256[] components);
    event RigStartedMining(uint256 indexed rigId, uint256 poolId);
    event RigStoppedMining(uint256 indexed rigId);
    event ComponentAdded(uint256 tokenId, ComponentType componentType);
    event WattDeposited(uint256 indexed rigId, uint256 amount, uint256 endTime);
    event PoolOperatorRegistered(address indexed operator, string poolDomain);
    
    constructor(address _nftContract, address _wattToken) {
        nftContract = IERC1155(_nftContract);
        wattToken = IERC20(_wattToken);
        
        // Initialize component definitions
        _initializeComponents();
    }
    
    function _initializeComponents() internal {
        // PC Case NFT (Free Mint) - Token ID 1
        components[1] = Component({
            tokenId: 1,
            componentType: ComponentType.PC_CASE,
            hashRateBonus: 0,
            powerConsumption: 0,
            rarityMultiplier: 1000 // 1x multiplier
        });
        validComponents[1] = true;
        
        // XL1 Processor - Token ID 3
        components[3] = Component({
            tokenId: 3,
            componentType: ComponentType.PROCESSOR,
            hashRateBonus: 25,
            powerConsumption: 125,
            rarityMultiplier: 1250 // 1.25x multiplier
        });
        validComponents[3] = true;
        
        // TX120 GPU - Token ID 4
        components[4] = Component({
            tokenId: 4,
            componentType: ComponentType.GPU,
            hashRateBonus: 150,
            powerConsumption: 320,
            rarityMultiplier: 1500 // 1.5x multiplier
        });
        validComponents[4] = true;
        
        // GP50 GPU - Token ID 5
        components[5] = Component({
            tokenId: 5,
            componentType: ComponentType.GPU,
            hashRateBonus: 200,
            powerConsumption: 450,
            rarityMultiplier: 2000 // 2x multiplier
        });
        validComponents[5] = true;
        
        // Genesis Badge - Token ID 2
        components[2] = Component({
            tokenId: 2,
            componentType: ComponentType.BOOST_ITEM,
            hashRateBonus: 50, // 50% boost to all components
            powerConsumption: 0, // Percentage increase handled separately
            rarityMultiplier: 1500 // 1.5x multiplier
        });
        validComponents[2] = true;
    }
    
    function configureRig(uint256[] memory _componentTokenIds) external nonReentrant returns (uint256) {
        require(_componentTokenIds.length >= 2, "Need at least PC case and processor");
        require(_componentTokenIds.length <= 5, "Too many components");
        
        // Verify ownership of all components
        for (uint256 i = 0; i < _componentTokenIds.length; i++) {
            require(validComponents[_componentTokenIds[i]], "Invalid component");
            require(nftContract.balanceOf(msg.sender, _componentTokenIds[i]) > 0, "Don't own component");
        }
        
        // Validate rig configuration
        (bool isValid, string memory error) = _validateRigConfiguration(_componentTokenIds);
        require(isValid, error);
        
        // Calculate rig performance
        (uint256 hashRate, uint256 powerConsumption, bool hasGenesisBadge) = _calculateRigPerformance(_componentTokenIds);
        
        rigCounter++;
        rigs[rigCounter] = MiningRig({
            rigId: rigCounter,
            owner: msg.sender,
            componentTokenIds: _componentTokenIds,
            totalHashRate: hashRate,
            totalPowerConsumption: powerConsumption,
            efficiency: (hashRate * 1000) / powerConsumption,
            hasGenesisBadge: hasGenesisBadge,
            createdAt: block.timestamp,
            isActive: false,
            poolId: 0,
            totalEarnings: 0,
            wattDeposited: 0,
            wattPerHour: calculateWattPerHour(powerConsumption),
            endTime: 0
        });
        
        userRigs[msg.sender].push(rigCounter);
        
        // Lock NFTs in contract
        for (uint256 i = 0; i < _componentTokenIds.length; i++) {
            nftContract.safeTransferFrom(msg.sender, address(this), _componentTokenIds[i], 1, "");
        }
        
        emit RigConfigured(rigCounter, msg.sender, _componentTokenIds);
        return rigCounter;
    }
    
    function _validateRigConfiguration(uint256[] memory _componentTokenIds) internal view returns (bool, string memory) {
        bool hasPcCase = false;
        bool hasProcessor = false;
        uint256 gpuCount = 0;
        uint256 boostCount = 0;
        
        for (uint256 i = 0; i < _componentTokenIds.length; i++) {
            ComponentType compType = components[_componentTokenIds[i]].componentType;
            
            if (compType == ComponentType.PC_CASE) {
                if (hasPcCase) return (false, "Multiple PC cases");
                hasPcCase = true;
            } else if (compType == ComponentType.PROCESSOR) {
                if (hasProcessor) return (false, "Multiple processors");
                hasProcessor = true;
            } else if (compType == ComponentType.GPU) {
                gpuCount++;
                if (gpuCount > 2) return (false, "Too many GPUs");
            } else if (compType == ComponentType.BOOST_ITEM) {
                boostCount++;
                if (boostCount > 1) return (false, "Multiple boost items");
            }
        }
        
        if (!hasPcCase) return (false, "PC case required");
        if (!hasProcessor) return (false, "Processor required");
        
        return (true, "");
    }
    
    function _calculateRigPerformance(uint256[] memory _componentTokenIds) internal view returns (uint256 hashRate, uint256 powerConsumption, bool hasGenesisBadge) {
        hashRate = BASE_HASH_RATE;
        powerConsumption = 50; // Base power consumption
        hasGenesisBadge = false;
        
        // First pass: calculate base performance
        for (uint256 i = 0; i < _componentTokenIds.length; i++) {
            Component memory comp = components[_componentTokenIds[i]];
            
            if (comp.componentType == ComponentType.BOOST_ITEM) {
                hasGenesisBadge = true;
                continue;
            }
            
            // Add component bonuses
            hashRate += (hashRate * comp.hashRateBonus) / 100;
            powerConsumption += comp.powerConsumption;
        }
        
        // Second pass: apply Genesis Badge if present
        if (hasGenesisBadge) {
            hashRate += (hashRate * 50) / 100; // 50% boost to total
            powerConsumption += (powerConsumption * 25) / 100; // 25% power increase
        }
    }
    
    function calculateWattPerHour(uint256 powerConsumption) public pure returns (uint256) {
        // Convert power consumption in watts to WATT tokens per hour
        // Using the specified rate: 713633.13824723 WATT/hour
        return powerConsumption * 713633138247230;
    }
    
    function depositWatt(uint256 _rigId, uint256 _amount) external nonReentrant {
        require(rigs[_rigId].owner == msg.sender, "Not rig owner");
        
        MiningRig storage rig = rigs[_rigId];
        
        // Transfer WATT tokens to contract
        require(wattToken.transferFrom(msg.sender, address(this), _amount), "WATT transfer failed");
        
        // Calculate how many hours this deposit will power the rig
        uint256 hoursAdded = (_amount * 1e18) / rig.wattPerHour;
        
        // Update rig data
        rig.wattDeposited += _amount;
        
        // If rig is not active, set end time from now
        // If rig is active, add to existing end time
        if (!rig.isActive || rig.endTime < block.timestamp) {
            rig.endTime = block.timestamp + (hoursAdded * 3600);
            rig.isActive = true;
        } else {
            rig.endTime += (hoursAdded * 3600);
        }
        
        emit WattDeposited(_rigId, _amount, rig.endTime);
    }
    
    function startMining(uint256 _rigId, uint256 _poolId) external nonReentrant {
        require(rigs[_rigId].owner == msg.sender, "Not rig owner");
        
        MiningRig storage rig = rigs[_rigId];
        
        // Check if pool operator or has enough WATT deposited
        bool isPoolOperator = poolOperators[msg.sender];
        
        if (!isPoolOperator) {
            require(rig.endTime > block.timestamp, "Insufficient WATT deposited");
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
    
    function dismantleRig(uint256 _rigId) external nonReentrant {
        require(rigs[_rigId].owner == msg.sender, "Not rig owner");
        require(!rigs[_rigId].isActive, "Stop mining first");
        
        MiningRig storage rig = rigs[_rigId];
        
        // Return NFTs to owner
        for (uint256 i = 0; i < rig.componentTokenIds.length; i++) {
            nftContract.safeTransferFrom(address(this), msg.sender, rig.componentTokenIds[i], 1, "");
        }
        
        // Return any remaining WATT based on time left
        if (rig.endTime > block.timestamp) {
            uint256 secondsLeft = rig.endTime - block.timestamp;
            uint256 hoursLeft = secondsLeft / 3600;
            uint256 wattToReturn = (hoursLeft * rig.wattPerHour) / 1e18;
            
            if (wattToReturn > 0) {
                require(wattToken.transfer(msg.sender, wattToReturn), "WATT return failed");
            }
        }
        
        // Clear rig data
        delete rigs[_rigId];
        
        // Remove from user's rigs
        uint256[] storage userRigList = userRigs[msg.sender];
        for (uint256 i = 0; i < userRigList.length; i++) {
            if (userRigList[i] == _rigId) {
                userRigList[i] = userRigList[userRigList.length - 1];
                userRigList.pop();
                break;
            }
        }
    }
    
    function registerPoolOperator(string calldata _poolDomain, string calldata _appAddress) external nonReentrant {
        require(!poolOperators[msg.sender], "Already registered");
        
        // Transfer WATT tokens to contract
        require(wattToken.transferFrom(msg.sender, address(this), POOL_OPERATOR_DEPOSIT), "WATT transfer failed");
        
        poolOperators[msg.sender] = true;
        operatorWattDeposits[msg.sender] = POOL_OPERATOR_DEPOSIT;
        
        emit PoolOperatorRegistered(msg.sender, _poolDomain);
    }
    
    function unregisterPoolOperator() external nonReentrant {
        require(poolOperators[msg.sender], "Not a pool operator");
        
        uint256 deposit = operatorWattDeposits[msg.sender];
        
        poolOperators[msg.sender] = false;
        operatorWattDeposits[msg.sender] = 0;
        
        // Return deposit
        require(wattToken.transfer(msg.sender, deposit), "WATT return failed");
    }
    
    function getRigInfo(uint256 _rigId) external view returns (MiningRig memory) {
        return rigs[_rigId];
    }
    
    function getUserRigs(address _user) external view returns (uint256[] memory) {
        return userRigs[_user];
    }
    
    function getComponentInfo(uint256 _tokenId) external view returns (Component memory) {
        return components[_tokenId];
    }
    
    function addEarnings(uint256 _rigId, uint256 _amount) external onlyOwner {
        rigs[_rigId].totalEarnings += _amount;
    }
    
    function addComponent(
        uint256 _tokenId,
        ComponentType _type,
        uint256 _hashRateBonus,
        uint256 _powerConsumption,
        uint256 _rarityMultiplier
    ) external onlyOwner {
        components[_tokenId] = Component({
            tokenId: _tokenId,
            componentType: _type,
            hashRateBonus: _hashRateBonus,
            powerConsumption: _powerConsumption,
            rarityMultiplier: _rarityMultiplier
        });
        validComponents[_tokenId] = true;
        
        emit ComponentAdded(_tokenId, _type);
    }
    
    function isPoolOperator(address _operator) external view returns (bool) {
        return poolOperators[_operator];
    }
    
    function getRigStatus(uint256 _rigId) external view returns (
        bool isActive,
        uint256 endTime,
        uint256 timeLeft,
        uint256 wattPerHour
    ) {
        MiningRig memory rig = rigs[_rigId];
        
        isActive = rig.isActive;
        endTime = rig.endTime;
        timeLeft = rig.endTime > block.timestamp ? rig.endTime - block.timestamp : 0;
        wattPerHour = rig.wattPerHour;
    }
    
    // Required for ERC1155 receiver
    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes calldata
    ) external pure returns (bytes4) {
        return this.onERC1155Received.selector;
    }
    
    function onERC1155BatchReceived(
        address,
        address,
        uint256[] calldata,
        uint256[] calldata,
        bytes calldata
    ) external pure returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }
}