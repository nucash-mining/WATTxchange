// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title UTXOSwapHelper
 * @dev Helper contract for UTXO-based atomic swaps
 * This contract helps track and verify UTXO-based swaps (BTC, LTC, XMR, GHOST, TROLL, HTH)
 */
contract UTXOSwapHelper is ReentrancyGuard, Ownable {
    // Swap statuses
    enum SwapStatus { INVALID, PENDING, CONFIRMED, COMPLETED, EXPIRED, CANCELLED }
    
    // Supported UTXO chains
    enum UTXOChain { BTC, LTC, XMR, GHOST, TROLL, HTH }
    
    // Swap struct
    struct UTXOSwap {
        bytes32 id;
        address evmParticipant;
        UTXOChain utxoChain;
        string utxoAddress;
        uint256 utxoAmount;
        string depositAddress;
        bytes32 hashLock;
        uint256 timelock;
        SwapStatus status;
        string txId;
        bytes32 secretKey;
    }
    
    // Mapping of swap id to UTXOSwap struct
    mapping(bytes32 => UTXOSwap) public utxoSwaps;
    
    // Events
    event UTXOSwapCreated(
        bytes32 indexed id,
        address indexed evmParticipant,
        UTXOChain utxoChain,
        string utxoAddress,
        uint256 utxoAmount,
        string depositAddress,
        bytes32 hashLock,
        uint256 timelock
    );
    
    event UTXOSwapConfirmed(
        bytes32 indexed id,
        string txId
    );
    
    event UTXOSwapCompleted(
        bytes32 indexed id,
        bytes32 secretKey
    );
    
    event UTXOSwapExpired(
        bytes32 indexed id
    );
    
    event UTXOSwapCancelled(
        bytes32 indexed id
    );
    
    // Oracles that can confirm UTXO transactions
    mapping(address => bool) public oracles;
    
    modifier onlyOracle() {
        require(oracles[msg.sender], "Caller is not an oracle");
        _;
    }
    
    constructor() {
        // Add deployer as initial oracle
        oracles[msg.sender] = true;
    }
    
    /**
     * @dev Adds or removes an oracle
     * @param _oracle Oracle address
     * @param _isOracle Whether the address should be an oracle
     */
    function setOracle(address _oracle, bool _isOracle) external onlyOwner {
        oracles[_oracle] = _isOracle;
    }
    
    /**
     * @dev Creates a new UTXO swap
     * @param _id Unique swap identifier
     * @param _utxoChain UTXO chain enum
     * @param _utxoAddress UTXO address of the participant
     * @param _utxoAmount Amount of UTXO coins
     * @param _depositAddress Deposit address for the UTXO coins
     * @param _hashLock Hash of the secret key
     * @param _timelock Unix timestamp when the swap expires
     */
    function createUTXOSwap(
        bytes32 _id,
        UTXOChain _utxoChain,
        string memory _utxoAddress,
        uint256 _utxoAmount,
        string memory _depositAddress,
        bytes32 _hashLock,
        uint256 _timelock
    ) external nonReentrant {
        require(_utxoAmount > 0, "Amount must be greater than zero");
        require(_timelock > block.timestamp, "Timelock must be in the future");
        require(bytes(_utxoAddress).length > 0, "UTXO address cannot be empty");
        require(bytes(_depositAddress).length > 0, "Deposit address cannot be empty");
        require(utxoSwaps[_id].status == SwapStatus.INVALID, "Swap already exists");
        
        // Create swap
        utxoSwaps[_id] = UTXOSwap({
            id: _id,
            evmParticipant: msg.sender,
            utxoChain: _utxoChain,
            utxoAddress: _utxoAddress,
            utxoAmount: _utxoAmount,
            depositAddress: _depositAddress,
            hashLock: _hashLock,
            timelock: _timelock,
            status: SwapStatus.PENDING,
            txId: "",
            secretKey: bytes32(0)
        });
        
        emit UTXOSwapCreated(
            _id,
            msg.sender,
            _utxoChain,
            _utxoAddress,
            _utxoAmount,
            _depositAddress,
            _hashLock,
            _timelock
        );
    }
    
    /**
     * @dev Confirms a UTXO swap (called by oracle)
     * @param _id Swap identifier
     * @param _txId UTXO transaction ID
     */
    function confirmUTXOSwap(bytes32 _id, string memory _txId) external onlyOracle nonReentrant {
        UTXOSwap storage swap = utxoSwaps[_id];
        
        require(swap.status == SwapStatus.PENDING, "Swap is not pending");
        require(block.timestamp < swap.timelock, "Swap has expired");
        require(bytes(_txId).length > 0, "Transaction ID cannot be empty");
        
        swap.status = SwapStatus.CONFIRMED;
        swap.txId = _txId;
        
        emit UTXOSwapConfirmed(_id, _txId);
    }
    
    /**
     * @dev Completes a UTXO swap by revealing the secret key
     * @param _id Swap identifier
     * @param _secretKey Secret key that hashes to the hashLock
     */
    function completeUTXOSwap(bytes32 _id, bytes32 _secretKey) external nonReentrant {
        UTXOSwap storage swap = utxoSwaps[_id];
        
        require(swap.status == SwapStatus.CONFIRMED, "Swap is not confirmed");
        require(block.timestamp < swap.timelock, "Swap has expired");
        require(sha256(abi.encodePacked(_secretKey)) == swap.hashLock, "Invalid secret key");
        
        swap.status = SwapStatus.COMPLETED;
        swap.secretKey = _secretKey;
        
        emit UTXOSwapCompleted(_id, _secretKey);
    }
    
    /**
     * @dev Marks a UTXO swap as expired
     * @param _id Swap identifier
     */
    function expireUTXOSwap(bytes32 _id) external nonReentrant {
        UTXOSwap storage swap = utxoSwaps[_id];
        
        require(swap.status == SwapStatus.PENDING || swap.status == SwapStatus.CONFIRMED, "Swap cannot be expired");
        require(block.timestamp >= swap.timelock, "Swap has not expired yet");
        
        swap.status = SwapStatus.EXPIRED;
        
        emit UTXOSwapExpired(_id);
    }
    
    /**
     * @dev Cancels a UTXO swap (only callable by the EVM participant)
     * @param _id Swap identifier
     */
    function cancelUTXOSwap(bytes32 _id) external nonReentrant {
        UTXOSwap storage swap = utxoSwaps[_id];
        
        require(swap.status == SwapStatus.PENDING, "Swap cannot be cancelled");
        require(msg.sender == swap.evmParticipant, "Only EVM participant can cancel");
        
        swap.status = SwapStatus.CANCELLED;
        
        emit UTXOSwapCancelled(_id);
    }
    
    /**
     * @dev Gets UTXO swap details
     * @param _id Swap identifier
     * @return UTXOSwap details
     */
    function getUTXOSwap(bytes32 _id) external view returns (UTXOSwap memory) {
        return utxoSwaps[_id];
    }
    
    /**
     * @dev Generates a swap id based on parameters
     * @param _evmParticipant EVM participant address
     * @param _utxoChain UTXO chain enum
     * @param _utxoAddress UTXO address
     * @param _utxoAmount UTXO amount
     * @param _depositAddress Deposit address
     * @param _hashLock Hash lock
     * @param _timelock Time lock
     * @return bytes32 Swap ID
     */
    function generateUTXOSwapId(
        address _evmParticipant,
        UTXOChain _utxoChain,
        string memory _utxoAddress,
        uint256 _utxoAmount,
        string memory _depositAddress,
        bytes32 _hashLock,
        uint256 _timelock
    ) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(
            _evmParticipant,
            uint8(_utxoChain),
            _utxoAddress,
            _utxoAmount,
            _depositAddress,
            _hashLock,
            _timelock
        ));
    }
    
    /**
     * @dev Verifies if a secret key matches a hash lock
     * @param _secretKey Secret key
     * @param _hashLock Hash lock
     * @return bool True if the secret key matches the hash lock
     */
    function verifySecretKey(bytes32 _secretKey, bytes32 _hashLock) external pure returns (bool) {
        return sha256(abi.encodePacked(_secretKey)) == _hashLock;
    }
    
    /**
     * @dev Generates a hash lock from a secret key
     * @param _secretKey Secret key
     * @return bytes32 Hash lock
     */
    function generateHashLock(bytes32 _secretKey) external pure returns (bytes32) {
        return sha256(abi.encodePacked(_secretKey));
    }
}