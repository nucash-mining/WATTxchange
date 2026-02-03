// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CrossChainValidator
 * @dev Validates hash power across chains and submits to nuChain L2
 */
contract CrossChainValidator is ReentrancyGuard, Ownable {
    struct ChainHashPower {
        uint256 chainId;
        uint256 totalHashPower;
        uint256 activeRigs;
        uint256 lastUpdate;
        address[] activeMiners;
        uint256[] minerHashPowers;
    }
    
    struct ValidationSubmission {
        uint256 blockNumber;
        uint256 polygonHashPower;
        uint256 altcoinchainHashPower;
        uint256 timestamp;
        address validator;
        bool submitted;
    }
    
    mapping(uint256 => ChainHashPower) public chainHashPower; // chainId => hash power data
    mapping(uint256 => ValidationSubmission) public validationSubmissions; // blockNumber => submission
    mapping(address => bool) public authorizedValidators;
    
    address public nuChainL2Contract;
    uint256 public currentValidationBlock;
    
    event HashPowerReceived(uint256 indexed chainId, uint256 totalHashPower, uint256 activeRigs);
    event ValidationSubmitted(uint256 indexed blockNumber, uint256 polygonHashPower, uint256 altcoinchainHashPower);
    event ValidatorAuthorized(address indexed validator);
    event NuChainUpdated(address indexed newContract);
    
    modifier onlyAuthorizedValidator() {
        require(authorizedValidators[msg.sender], "Not authorized validator");
        _;
    }
    
    constructor() {
        authorizedValidators[msg.sender] = true;
    }
    
    function receiveHashPowerData(
        uint256 _chainId,
        uint256 _totalHashPower,
        uint256 _activeRigs,
        address[] memory _activeMiners,
        uint256[] memory _minerHashPowers
    ) external onlyAuthorizedValidator {
        require(_activeMiners.length == _minerHashPowers.length, "Array length mismatch");
        
        chainHashPower[_chainId] = ChainHashPower({
            chainId: _chainId,
            totalHashPower: _totalHashPower,
            activeRigs: _activeRigs,
            lastUpdate: block.timestamp,
            activeMiners: _activeMiners,
            minerHashPowers: _minerHashPowers
        });
        
        emit HashPowerReceived(_chainId, _totalHashPower, _activeRigs);
        
        // Check if we have data from both chains to submit
        _checkAndSubmitValidation();
    }
    
    function _checkAndSubmitValidation() internal {
        uint256 polygonHashPower = chainHashPower[137].totalHashPower;
        uint256 altcoinchainHashPower = chainHashPower[2330].totalHashPower;
        
        // Only submit if we have recent data from both chains
        bool polygonRecent = block.timestamp - chainHashPower[137].lastUpdate < 300; // 5 minutes
        bool altcoinchainRecent = block.timestamp - chainHashPower[2330].lastUpdate < 300; // 5 minutes
        
        if (polygonRecent && altcoinchainRecent && nuChainL2Contract != address(0)) {
            currentValidationBlock++;
            
            validationSubmissions[currentValidationBlock] = ValidationSubmission({
                blockNumber: currentValidationBlock,
                polygonHashPower: polygonHashPower,
                altcoinchainHashPower: altcoinchainHashPower,
                timestamp: block.timestamp,
                validator: msg.sender,
                submitted: false
            });
            
            // Submit to nuChain L2
            _submitToNuChain(currentValidationBlock, polygonHashPower, altcoinchainHashPower);
        }
    }
    
    function _submitToNuChain(
        uint256 _blockNumber,
        uint256 _polygonHashPower,
        uint256 _altcoinchainHashPower
    ) internal {
        // In production, this would make a cross-chain call to nuChain L2
        // For now, we'll emit an event and mark as submitted
        
        validationSubmissions[_blockNumber].submitted = true;
        
        emit ValidationSubmitted(_blockNumber, _polygonHashPower, _altcoinchainHashPower);
        
        // This would be replaced with actual cross-chain call:
        // INuChainL2(nuChainL2Contract).submitHashPowerData(_blockNumber, _polygonHashPower, _altcoinchainHashPower);
    }
    
    function setNuChainL2Contract(address _contract) external onlyOwner {
        nuChainL2Contract = _contract;
        emit NuChainUpdated(_contract);
    }
    
    function addValidator(address _validator) external onlyOwner {
        authorizedValidators[_validator] = true;
        emit ValidatorAuthorized(_validator);
    }
    
    function removeValidator(address _validator) external onlyOwner {
        authorizedValidators[_validator] = false;
    }
    
    function getChainHashPower(uint256 _chainId) external view returns (ChainHashPower memory) {
        return chainHashPower[_chainId];
    }
    
    function getValidationSubmission(uint256 _blockNumber) external view returns (ValidationSubmission memory) {
        return validationSubmissions[_blockNumber];
    }
    
    function getCurrentNetworkHashPower() external view returns (uint256 polygon, uint256 altcoinchain, uint256 total) {
        polygon = chainHashPower[137].totalHashPower;
        altcoinchain = chainHashPower[2330].totalHashPower;
        total = polygon + altcoinchain;
    }
}