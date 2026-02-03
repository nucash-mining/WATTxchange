// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./wXMR.sol";

/**
 * @title MoneroBridge
 * @dev Secure bridge between Monero and Altcoinchain
 * Manages wXMR minting/burning with 1:1 XMR backing
 */
contract MoneroBridge is ReentrancyGuard, Pausable, Ownable {
    using ECDSA for bytes32;
    
    // wXMR token contract
    wXMR public wXMRToken;
    
    // Bridge node operator (can process withdrawals)
    address public bridgeOperator;
    
    // Minimum and maximum deposit/withdrawal amounts
    uint256 public minDeposit = 0.001 ether; // 0.001 XMR minimum
    uint256 public maxDeposit = 100 ether;   // 100 XMR maximum per transaction
    uint256 public minWithdrawal = 0.001 ether;
    uint256 public maxWithdrawal = 100 ether;
    
    // Security parameters
    uint256 public constant DEPOSIT_CONFIRMATIONS = 10; // Monero confirmations required
    uint256 public constant WITHDRAWAL_DELAY = 1 hours; // Delay before withdrawal can be processed
    
    // Deposit tracking
    struct Deposit {
        address user;
        uint256 amount;
        uint256 timestamp;
        uint256 confirmations;
        bool processed;
        string moneroTxHash;
    }
    
    // Withdrawal tracking
    struct Withdrawal {
        address user;
        uint256 amount;
        uint256 timestamp;
        uint256 unlockTime;
        bool processed;
        string moneroAddress;
        string moneroTxHash;
    }
    
    // Mappings
    mapping(bytes32 => Deposit) public deposits;
    mapping(bytes32 => Withdrawal) public withdrawals;
    mapping(address => uint256) public userDepositCount;
    mapping(address => uint256) public userWithdrawalCount;
    
    // Total XMR backing (should always equal wXMR total supply)
    uint256 public totalXMRBacking;
    
    // Events
    event DepositInitiated(
        bytes32 indexed depositId,
        address indexed user,
        uint256 amount,
        string moneroTxHash
    );
    
    event DepositConfirmed(
        bytes32 indexed depositId,
        address indexed user,
        uint256 amount
    );
    
    event WithdrawalRequested(
        bytes32 indexed withdrawalId,
        address indexed user,
        uint256 amount,
        string moneroAddress
    );
    
    event WithdrawalProcessed(
        bytes32 indexed withdrawalId,
        address indexed user,
        uint256 amount,
        string moneroTxHash
    );
    
    event BridgeOperatorUpdated(address indexed oldOperator, address indexed newOperator);
    event LimitsUpdated(uint256 minDeposit, uint256 maxDeposit, uint256 minWithdrawal, uint256 maxWithdrawal);
    
    constructor(address _wXMRToken) {
        wXMRToken = wXMR(_wXMRToken);
        bridgeOperator = msg.sender;
        _transferOwnership(msg.sender);
    }
    
    /**
     * @dev Set bridge operator address
     * @param _bridgeOperator New bridge operator
     */
    function setBridgeOperator(address _bridgeOperator) external onlyOwner {
        require(_bridgeOperator != address(0), "Bridge operator cannot be zero address");
        address oldOperator = bridgeOperator;
        bridgeOperator = _bridgeOperator;
        emit BridgeOperatorUpdated(oldOperator, _bridgeOperator);
    }
    
    /**
     * @dev Update deposit/withdrawal limits
     */
    function setLimits(
        uint256 _minDeposit,
        uint256 _maxDeposit,
        uint256 _minWithdrawal,
        uint256 _maxWithdrawal
    ) external onlyOwner {
        require(_minDeposit <= _maxDeposit, "Invalid deposit limits");
        require(_minWithdrawal <= _maxWithdrawal, "Invalid withdrawal limits");
        
        minDeposit = _minDeposit;
        maxDeposit = _maxDeposit;
        minWithdrawal = _minWithdrawal;
        maxWithdrawal = _maxWithdrawal;
        
        emit LimitsUpdated(_minDeposit, _maxDeposit, _minWithdrawal, _maxWithdrawal);
    }
    
    /**
     * @dev Initiate a deposit (called by bridge operator when XMR is received)
     * @param user Address to mint wXMR to
     * @param amount Amount of XMR deposited (in wei)
     * @param moneroTxHash Monero transaction hash
     * @return depositId Unique deposit identifier
     */
    function initiateDeposit(
        address user,
        uint256 amount,
        string calldata moneroTxHash
    ) external onlyBridgeOperator returns (bytes32 depositId) {
        require(amount >= minDeposit && amount <= maxDeposit, "Amount outside limits");
        require(user != address(0), "Invalid user address");
        
        depositId = keccak256(abi.encodePacked(
            user,
            amount,
            moneroTxHash,
            block.timestamp,
            userDepositCount[user]
        ));
        
        require(deposits[depositId].user == address(0), "Deposit already exists");
        
        deposits[depositId] = Deposit({
            user: user,
            amount: amount,
            timestamp: block.timestamp,
            confirmations: 0,
            processed: false,
            moneroTxHash: moneroTxHash
        });
        
        userDepositCount[user]++;
        
        emit DepositInitiated(depositId, user, amount, moneroTxHash);
    }
    
    /**
     * @dev Confirm a deposit after sufficient Monero confirmations
     * @param depositId Deposit identifier
     */
    function confirmDeposit(bytes32 depositId) external onlyBridgeOperator {
        Deposit storage deposit = deposits[depositId];
        require(deposit.user != address(0), "Deposit does not exist");
        require(!deposit.processed, "Deposit already processed");
        require(deposit.confirmations >= DEPOSIT_CONFIRMATIONS, "Insufficient confirmations");
        
        deposit.processed = true;
        totalXMRBacking += deposit.amount;
        
        // Mint wXMR tokens to user
        wXMRToken.mint(deposit.user, deposit.amount);
        
        emit DepositConfirmed(depositId, deposit.user, deposit.amount);
    }
    
    /**
     * @dev Update deposit confirmations (called by bridge operator)
     * @param depositId Deposit identifier
     * @param confirmations Current confirmation count
     */
    function updateDepositConfirmations(bytes32 depositId, uint256 confirmations) external onlyBridgeOperator {
        Deposit storage deposit = deposits[depositId];
        require(deposit.user != address(0), "Deposit does not exist");
        require(!deposit.processed, "Deposit already processed");
        
        deposit.confirmations = confirmations;
    }
    
    /**
     * @dev Request withdrawal of XMR
     * @param amount Amount of wXMR to burn
     * @param moneroAddress Monero address to send XMR to
     * @return withdrawalId Unique withdrawal identifier
     */
    function requestWithdrawal(
        uint256 amount,
        string calldata moneroAddress
    ) external whenNotPaused nonReentrant returns (bytes32 withdrawalId) {
        require(amount >= minWithdrawal && amount <= maxWithdrawal, "Amount outside limits");
        require(wXMRToken.balanceOf(msg.sender) >= amount, "Insufficient wXMR balance");
        require(bytes(moneroAddress).length > 0, "Invalid Monero address");
        
        withdrawalId = keccak256(abi.encodePacked(
            msg.sender,
            amount,
            moneroAddress,
            block.timestamp,
            userWithdrawalCount[msg.sender]
        ));
        
        require(withdrawals[withdrawalId].user == address(0), "Withdrawal already exists");
        
        withdrawals[withdrawalId] = Withdrawal({
            user: msg.sender,
            amount: amount,
            timestamp: block.timestamp,
            unlockTime: block.timestamp + WITHDRAWAL_DELAY,
            processed: false,
            moneroAddress: moneroAddress,
            moneroTxHash: ""
        });
        
        userWithdrawalCount[msg.sender]++;
        
        // Burn wXMR tokens immediately
        wXMRToken.burn(msg.sender, amount);
        totalXMRBacking -= amount;
        
        emit WithdrawalRequested(withdrawalId, msg.sender, amount, moneroAddress);
    }
    
    /**
     * @dev Process withdrawal (called by bridge operator after sending XMR)
     * @param withdrawalId Withdrawal identifier
     * @param moneroTxHash Monero transaction hash
     */
    function processWithdrawal(
        bytes32 withdrawalId,
        string calldata moneroTxHash
    ) external onlyBridgeOperator {
        Withdrawal storage withdrawal = withdrawals[withdrawalId];
        require(withdrawal.user != address(0), "Withdrawal does not exist");
        require(!withdrawal.processed, "Withdrawal already processed");
        require(block.timestamp >= withdrawal.unlockTime, "Withdrawal not yet unlocked");
        
        withdrawal.processed = true;
        withdrawal.moneroTxHash = moneroTxHash;
        
        emit WithdrawalProcessed(withdrawalId, withdrawal.user, withdrawal.amount, moneroTxHash);
    }
    
    /**
     * @dev Emergency pause
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Get deposit details
     */
    function getDeposit(bytes32 depositId) external view returns (Deposit memory) {
        return deposits[depositId];
    }
    
    /**
     * @dev Get withdrawal details
     */
    function getWithdrawal(bytes32 withdrawalId) external view returns (Withdrawal memory) {
        return withdrawals[withdrawalId];
    }
    
    /**
     * @dev Check if bridge is properly backed
     */
    function isProperlyBacked() external view returns (bool) {
        return totalXMRBacking == wXMRToken.totalSupply();
    }
    
    /**
     * @dev Get backing ratio (should always be 1.0)
     */
    function getBackingRatio() external view returns (uint256) {
        uint256 supply = wXMRToken.totalSupply();
        if (supply == 0) return 1e18; // 1.0 if no supply
        return (totalXMRBacking * 1e18) / supply;
    }
    
    modifier onlyBridgeOperator() {
        require(msg.sender == bridgeOperator, "Only bridge operator");
        _;
    }
}
