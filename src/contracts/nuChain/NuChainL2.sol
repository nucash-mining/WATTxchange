// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title NuChainL2
 * @dev zkRollup L2 chain for cross-chain mining coordination
 */
contract NuChainL2 is ReentrancyGuard, Ownable {
    ERC20 public nuToken;
    
    struct ChainData {
        string chainName;
        uint256 chainId;
        address validatorContract;
        uint256 totalHashPower;
        uint256 lastBlockSubmitted;
        bool isActive;
    }
    
    struct BlockSubmission {
        uint256 blockNumber;
        uint256 polygonHashPower;
        uint256 altcoinchainHashPower;
        uint256 totalRewards;
        uint256 timestamp;
        bool processed;
    }
    
    struct MinerRewards {
        address minerAddress;
        uint256 accumulatedNU;
        uint256 lastClaimBlock;
        uint256 totalHashPower;
    }
    
    mapping(uint256 => ChainData) public supportedChains; // chainId => ChainData
    mapping(uint256 => BlockSubmission) public blockSubmissions; // blockNumber => submission
    mapping(address => MinerRewards) public minerRewards;
    mapping(address => bool) public authorizedValidators;
    
    uint256 public currentL2Block;
    uint256 public constant BLOCK_REWARD = 50 * 10**18; // 50 NU per block
    uint256[] public supportedChainIds;
    
    event ChainRegistered(uint256 indexed chainId, string chainName, address validator);
    event BlockSubmitted(uint256 indexed blockNumber, uint256 polygonHashPower, uint256 altcoinchainHashPower);
    event RewardsDistributed(uint256 indexed blockNumber, uint256 totalRewards, uint256 polygonShare, uint256 altcoinchainShare);
    event MinerRewardUpdated(address indexed miner, uint256 nuAmount, uint256 blockNumber);
    event CrossChainMessage(uint256 indexed targetChain, bytes data);
    
    modifier onlyValidator() {
        require(authorizedValidators[msg.sender], "Not authorized validator");
        _;
    }
    
    constructor(address _nuToken) {
        nuToken = ERC20(_nuToken);
        
        // Register supported chains
        _registerChain(137, "Polygon", address(0)); // Polygon
        _registerChain(2330, "Altcoinchain", address(0)); // Altcoinchain
    }
    
    function _registerChain(uint256 _chainId, string memory _chainName, address _validator) internal {
        supportedChains[_chainId] = ChainData({
            chainName: _chainName,
            chainId: _chainId,
            validatorContract: _validator,
            totalHashPower: 0,
            lastBlockSubmitted: 0,
            isActive: true
        });
        
        supportedChainIds.push(_chainId);
        emit ChainRegistered(_chainId, _chainName, _validator);
    }
    
    function submitHashPowerData(
        uint256 _blockNumber,
        uint256 _polygonHashPower,
        uint256 _altcoinchainHashPower
    ) external onlyValidator nonReentrant {
        require(_blockNumber > currentL2Block, "Block already processed");
        require(_polygonHashPower > 0 || _altcoinchainHashPower > 0, "No hash power submitted");
        
        currentL2Block = _blockNumber;
        
        blockSubmissions[_blockNumber] = BlockSubmission({
            blockNumber: _blockNumber,
            polygonHashPower: _polygonHashPower,
            altcoinchainHashPower: _altcoinchainHashPower,
            totalRewards: BLOCK_REWARD,
            timestamp: block.timestamp,
            processed: false
        });
        
        emit BlockSubmitted(_blockNumber, _polygonHashPower, _altcoinchainHashPower);
        
        // Process rewards distribution
        _distributeBlockRewards(_blockNumber);
    }
    
    function _distributeBlockRewards(uint256 _blockNumber) internal {
        BlockSubmission storage submission = blockSubmissions[_blockNumber];
        require(!submission.processed, "Already processed");
        
        uint256 totalHashPower = submission.polygonHashPower + submission.altcoinchainHashPower;
        require(totalHashPower > 0, "No hash power to distribute");
        
        // Calculate chain shares based on hash power
        uint256 polygonShare = (BLOCK_REWARD * submission.polygonHashPower) / totalHashPower;
        uint256 altcoinchainShare = BLOCK_REWARD - polygonShare;
        
        // Calculate rewards based on hashpower share and current UTXO reward
        uint256 rewardsPerBlock = (utxoChain.currentReward * hashpowerShare) / 1e18;
        
        return blocksSinceLastClaim * rewardsPerBlock;
    }
    
    // ============ VALIDATOR MANAGEMENT ============
    
    /**
     * @dev Register as a validator
     * @param stakeAmount WATT tokens to stake
     */
    function registerValidator(uint256 stakeAmount) external nonReentrant {
        require(stakeAmount >= minimumStake, "Insufficient stake amount");
        require(!validators[msg.sender].isActive, "Already a validator");
        require(
            getActiveValidatorCount() < validatorSlots,
            "Validator slots full"
        );
        
        // Transfer WATT tokens
        require(
            wattToken.transferFrom(msg.sender, address(this), stakeAmount),
            "WATT transfer failed"
        );
        
        // Register validator
        validators[msg.sender] = Validator({
            validator: msg.sender,
            stake: stakeAmount,
            lastValidationBlock: 0,
            totalValidations: 0,
            isActive: true,
            reputation: 0
        });
        
        totalStaked += stakeAmount;
        
        emit ValidatorRegistered(msg.sender, stakeAmount);
    }
    
    /**
     * @dev Unregister as a validator
     */
    function unregisterValidator() external nonReentrant {
        require(validators[msg.sender].isActive, "Not a validator");
        
        // Return staked tokens
        require(
            wattToken.transfer(msg.sender, validators[msg.sender].stake),
            "WATT transfer failed"
        );
        
        totalStaked -= validators[msg.sender].stake;
        validators[msg.sender].isActive = false;
        
        emit ValidatorUnregistered(msg.sender);
    }
    
    // ============ CROSS-CHAIN VALIDATION ============
    
    /**
     * @dev Receive validation proof from Sonic blockchain
     * @param blockNumber Block number being validated
     * @param validationProof Proof from Sonic blockchain
     */
    function receiveSonicValidation(
        uint256 blockNumber,
        bytes32 validationProof
    ) external {
        require(msg.sender == sonicValidator, "Only Sonic validator");
        require(blockNumber <= currentBlockNumber, "Block does not exist");
        
        sonicValidations[blockNumber] = SonicValidation({
            validationProof: validationProof,
            blockNumber: blockNumber,
            validator: msg.sender,
            timestamp: block.timestamp,
            isValid: true
        });
        
        validatedBlocks[validationProof] = true;
        
        emit SonicValidationReceived(blockNumber, validationProof);
    }
    
    // ============ UTXO SIDE-CHAIN ============
    
    /**
     * @dev Process UTXO side-chain with Bitcoin halving mechanics
     */
    function processUTXOSideChain() internal {
        utxoChain.blockHeight++;
        
        // In production, this would use a cross-chain bridge like Axelar or LayerZero
        // For now, we emit events that validators can listen to
    }
    
    function updateMinerRewards(
        address _miner,
        uint256 _nuAmount,
        uint256 _hashPower
    ) external onlyValidator {
        minerRewards[_miner].accumulatedNU += _nuAmount;
        minerRewards[_miner].totalHashPower = _hashPower;
        minerRewards[_miner].lastClaimBlock = currentL2Block;
        
        emit MinerRewardUpdated(_miner, _nuAmount, currentL2Block);
    }
    
    function addValidator(address _validator) external onlyOwner {
        authorizedValidators[_validator] = true;
    }
    
    function removeValidator(address _validator) external onlyOwner {
        authorizedValidators[_validator] = false;
    }
    
    function getChainData(uint256 _chainId) external view returns (ChainData memory) {
        return supportedChains[_chainId];
    }
    
    function getBlockSubmission(uint256 _blockNumber) external view returns (BlockSubmission memory) {
        return blockSubmissions[_blockNumber];
    }
    
    function getMinerRewards(address _miner) external view returns (MinerRewards memory) {
        return minerRewards[_miner];
    }
    
    function getSupportedChains() external view returns (uint256[] memory) {
        return supportedChainIds;
    }
}