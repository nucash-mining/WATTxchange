// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract NuChainValidator is ReentrancyGuard, Ownable {
    IERC20 public nuToken;
    
    struct Validator {
        address validatorAddress;
        uint256 stakedAmount;
        uint256 commission; // Basis points (100 = 1%)
        uint256 uptime;
        uint256 lastBlockTime;
        uint256 totalBlocks;
        uint256 delegatedAmount;
        bool isActive;
        bool isJailed;
        uint256 jailTime;
    }
    
    struct Delegator {
        uint256 amount;
        uint256 rewards;
        uint256 lastClaimTime;
    }
    
    mapping(address => Validator) public validators;
    mapping(address => mapping(address => Delegator)) public delegations; // delegator => validator => delegation
    mapping(address => uint256) public validatorRewards;
    
    address[] public validatorList;
    uint256 public constant MIN_VALIDATOR_STAKE = 100000 * 10**18; // 100,000 NU
    uint256 public constant MIN_DELEGATION = 1000 * 10**18; // 1,000 NU
    uint256 public constant UNBONDING_PERIOD = 21 days;
    uint256 public constant JAIL_PERIOD = 7 days;
    uint256 public constant BASE_APY = 850; // 8.5% in basis points
    
    event ValidatorRegistered(address indexed validator, uint256 stake);
    event ValidatorJailed(address indexed validator, uint256 jailTime);
    event ValidatorUnjailed(address indexed validator);
    event Delegated(address indexed delegator, address indexed validator, uint256 amount);
    event Undelegated(address indexed delegator, address indexed validator, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event BlockProduced(address indexed validator, uint256 blockNumber, uint256 timestamp);
    
    constructor(address _nuToken) {
        nuToken = IERC20(_nuToken);
    }
    
    function registerValidator(uint256 _stake, uint256 _commission) external nonReentrant {
        require(_stake >= MIN_VALIDATOR_STAKE, "Insufficient stake");
        require(_commission <= 1000, "Commission too high"); // Max 10%
        require(!validators[msg.sender].isActive, "Already registered");
        
        nuToken.transferFrom(msg.sender, address(this), _stake);
        
        validators[msg.sender] = Validator({
            validatorAddress: msg.sender,
            stakedAmount: _stake,
            commission: _commission,
            uptime: 10000, // 100% in basis points
            lastBlockTime: block.timestamp,
            totalBlocks: 0,
            delegatedAmount: 0,
            isActive: true,
            isJailed: false,
            jailTime: 0
        });
        
        validatorList.push(msg.sender);
        emit ValidatorRegistered(msg.sender, _stake);
    }
    
    function delegate(address _validator, uint256 _amount) external nonReentrant {
        require(_amount >= MIN_DELEGATION, "Amount too small");
        require(validators[_validator].isActive, "Validator not active");
        require(!validators[_validator].isJailed, "Validator jailed");
        
        nuToken.transferFrom(msg.sender, address(this), _amount);
        
        delegations[msg.sender][_validator].amount += _amount;
        delegations[msg.sender][_validator].lastClaimTime = block.timestamp;
        validators[_validator].delegatedAmount += _amount;
        
        emit Delegated(msg.sender, _validator, _amount);
    }
    
    function undelegate(address _validator, uint256 _amount) external nonReentrant {
        require(delegations[msg.sender][_validator].amount >= _amount, "Insufficient delegation");
        
        delegations[msg.sender][_validator].amount -= _amount;
        validators[_validator].delegatedAmount -= _amount;
        
        // In production, this would start unbonding period
        nuToken.transfer(msg.sender, _amount);
        
        emit Undelegated(msg.sender, _validator, _amount);
    }
    
    function produceBlock(address _validator) external onlyOwner {
        require(validators[_validator].isActive, "Validator not active");
        require(!validators[_validator].isJailed, "Validator jailed");
        
        validators[_validator].totalBlocks++;
        validators[_validator].lastBlockTime = block.timestamp;
        
        // Calculate and distribute rewards
        uint256 blockReward = calculateBlockReward(_validator);
        validatorRewards[_validator] += blockReward;
        
        emit BlockProduced(_validator, validators[_validator].totalBlocks, block.timestamp);
    }
    
    function calculateBlockReward(address _validator) public view returns (uint256) {
        uint256 totalStake = validators[_validator].stakedAmount + validators[_validator].delegatedAmount;
        uint256 baseReward = (totalStake * BASE_APY) / (10000 * 365 * 24 * 60 * 60); // Per second
        return baseReward;
    }
    
    function calculateDelegatorRewards(address _delegator, address _validator) public view returns (uint256) {
        Delegator memory delegation = delegations[_delegator][_validator];
        if (delegation.amount == 0) return 0;
        
        uint256 timeStaked = block.timestamp - delegation.lastClaimTime;
        uint256 totalStake = validators[_validator].stakedAmount + validators[_validator].delegatedAmount;
        uint256 delegatorShare = (delegation.amount * 10000) / totalStake;
        uint256 validatorCommission = validators[_validator].commission;
        
        uint256 grossRewards = (delegation.amount * BASE_APY * timeStaked) / (10000 * 365 * 24 * 60 * 60);
        uint256 commission = (grossRewards * validatorCommission) / 10000;
        
        return grossRewards - commission;
    }
    
    function claimRewards(address _validator) external nonReentrant {
        uint256 rewards = calculateDelegatorRewards(msg.sender, _validator);
        require(rewards > 0, "No rewards to claim");
        
        delegations[msg.sender][_validator].lastClaimTime = block.timestamp;
        delegations[msg.sender][_validator].rewards += rewards;
        
        nuToken.transfer(msg.sender, rewards);
        emit RewardsClaimed(msg.sender, rewards);
    }
    
    function jailValidator(address _validator) external onlyOwner {
        validators[_validator].isJailed = true;
        validators[_validator].jailTime = block.timestamp + JAIL_PERIOD;
        emit ValidatorJailed(_validator, validators[_validator].jailTime);
    }
    
    function unjailValidator(address _validator) external {
        require(validators[_validator].isJailed, "Not jailed");
        require(block.timestamp >= validators[_validator].jailTime, "Jail period not over");
        require(msg.sender == _validator, "Only validator can unjail");
        
        validators[_validator].isJailed = false;
        validators[_validator].jailTime = 0;
        emit ValidatorUnjailed(_validator);
    }
    
    function getValidatorInfo(address _validator) external view returns (Validator memory) {
        return validators[_validator];
    }
    
    function getValidatorCount() external view returns (uint256) {
        return validatorList.length;
    }
    
    function getTotalStaked() external view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < validatorList.length; i++) {
            address validator = validatorList[i];
            total += validators[validator].stakedAmount + validators[validator].delegatedAmount;
        }
        return total;
    }
}