// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title WATTxBridgePool
 * @notice Cross-chain bridge pool for WATT tokens between WATTx, Polygon, and Altcoinchain
 * @dev All WATT on Polygon and Altcoinchain are backed by WATTx locked on the WATTx mainnet
 *
 * Chain IDs:
 * - WATTx: 8889
 * - Polygon: 137
 * - Altcoinchain: 2330
 *
 * Token Addresses:
 * - WATTx: Native WATT (address(0) or wrapped)
 * - Polygon: 0xE960d5076cd3169C343Ee287A2c3380A222e5839
 * - Altcoinchain: 0x6645143e49B3a15d8F205658903a55E520444698
 */
contract WATTxBridgePool is ReentrancyGuard, Pausable, AccessControl {
    using SafeERC20 for IERC20;

    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // The WATT token on this chain
    IERC20 public immutable wattToken;

    // Chain ID of this deployment
    uint256 public immutable chainId;

    // Is this the WATTx mainnet (the backing chain)?
    bool public immutable isMainnet;

    // Supported destination chains
    mapping(uint256 => bool) public supportedChains;

    // Bridge fee in basis points (100 = 1%)
    uint256 public bridgeFee = 10; // 0.1% default

    // Minimum bridge amount
    uint256 public minBridgeAmount = 0.001 ether;

    // Maximum bridge amount per transaction
    uint256 public maxBridgeAmount = 1000000 ether;

    // Nonce for unique transfer IDs
    uint256 public nonce;

    // Processed transfer IDs to prevent replay
    mapping(bytes32 => bool) public processedTransfers;

    // Pending releases awaiting liquidity
    struct PendingRelease {
        address recipient;
        uint256 amount;
        uint256 sourceChain;
        uint256 timestamp;
        bool processed;
    }
    mapping(bytes32 => PendingRelease) public pendingReleases;
    bytes32[] public pendingReleaseIds;

    // Total locked/bridged amounts for accounting
    uint256 public totalLocked;
    uint256 public totalReleased;
    uint256 public totalFeesCollected;

    // Events
    event BridgeInitiated(
        bytes32 indexed transferId,
        address indexed sender,
        address indexed recipient,
        uint256 amount,
        uint256 fee,
        uint256 sourceChain,
        uint256 destChain,
        uint256 timestamp
    );

    event BridgeCompleted(
        bytes32 indexed transferId,
        address indexed recipient,
        uint256 amount,
        uint256 sourceChain,
        uint256 destChain,
        uint256 timestamp
    );

    event BridgePending(
        bytes32 indexed transferId,
        address indexed recipient,
        uint256 amount,
        uint256 sourceChain,
        string reason
    );

    event LiquidityAdded(address indexed provider, uint256 amount);
    event LiquidityRemoved(address indexed provider, uint256 amount);
    event FeesWithdrawn(address indexed recipient, uint256 amount);
    event ChainSupported(uint256 chainId, bool supported);

    constructor(
        address _wattToken,
        uint256 _chainId,
        bool _isMainnet
    ) {
        require(_wattToken != address(0), "Invalid token address");

        wattToken = IERC20(_wattToken);
        chainId = _chainId;
        isMainnet = _isMainnet;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(RELAYER_ROLE, msg.sender);

        // Set up supported chains
        supportedChains[8889] = true;  // WATTx
        supportedChains[137] = true;   // Polygon
        supportedChains[2330] = true;  // Altcoinchain
    }

    /**
     * @notice Bridge WATT tokens to another chain
     * @param destChain The destination chain ID
     * @param recipient The recipient address on the destination chain
     * @param amount The amount to bridge
     */
    function bridge(
        uint256 destChain,
        address recipient,
        uint256 amount
    ) external nonReentrant whenNotPaused {
        require(supportedChains[destChain], "Unsupported destination chain");
        require(destChain != chainId, "Cannot bridge to same chain");
        require(recipient != address(0), "Invalid recipient");
        require(amount >= minBridgeAmount, "Amount below minimum");
        require(amount <= maxBridgeAmount, "Amount above maximum");

        // Calculate fee
        uint256 fee = (amount * bridgeFee) / 10000;
        uint256 netAmount = amount - fee;

        // Transfer tokens from sender to this contract (lock)
        wattToken.safeTransferFrom(msg.sender, address(this), amount);

        // Update accounting
        totalLocked += amount;
        totalFeesCollected += fee;

        // Generate unique transfer ID
        bytes32 transferId = keccak256(
            abi.encodePacked(
                chainId,
                destChain,
                msg.sender,
                recipient,
                netAmount,
                nonce++,
                block.timestamp
            )
        );

        emit BridgeInitiated(
            transferId,
            msg.sender,
            recipient,
            netAmount,
            fee,
            chainId,
            destChain,
            block.timestamp
        );
    }

    /**
     * @notice Release tokens to recipient (called by relayer)
     * @param transferId The unique transfer ID from the source chain
     * @param recipient The recipient address
     * @param amount The amount to release
     * @param sourceChain The source chain ID
     */
    function release(
        bytes32 transferId,
        address recipient,
        uint256 amount,
        uint256 sourceChain
    ) external nonReentrant onlyRole(RELAYER_ROLE) {
        require(!processedTransfers[transferId], "Transfer already processed");
        require(supportedChains[sourceChain], "Unsupported source chain");
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Invalid amount");

        // Check if we have enough liquidity
        uint256 availableLiquidity = getAvailableLiquidity();

        if (availableLiquidity >= amount) {
            // We have liquidity, release immediately
            processedTransfers[transferId] = true;
            totalReleased += amount;

            wattToken.safeTransfer(recipient, amount);

            emit BridgeCompleted(
                transferId,
                recipient,
                amount,
                sourceChain,
                chainId,
                block.timestamp
            );
        } else {
            // Not enough liquidity, queue for later
            pendingReleases[transferId] = PendingRelease({
                recipient: recipient,
                amount: amount,
                sourceChain: sourceChain,
                timestamp: block.timestamp,
                processed: false
            });
            pendingReleaseIds.push(transferId);

            emit BridgePending(
                transferId,
                recipient,
                amount,
                sourceChain,
                "Insufficient liquidity"
            );
        }
    }

    /**
     * @notice Process pending releases when liquidity is available
     * @param maxToProcess Maximum number of pending releases to process
     */
    function processPendingReleases(uint256 maxToProcess) external nonReentrant {
        uint256 processed = 0;
        uint256 availableLiquidity = getAvailableLiquidity();

        for (uint256 i = 0; i < pendingReleaseIds.length && processed < maxToProcess; i++) {
            bytes32 transferId = pendingReleaseIds[i];
            PendingRelease storage pending = pendingReleases[transferId];

            if (!pending.processed && pending.amount <= availableLiquidity) {
                pending.processed = true;
                processedTransfers[transferId] = true;
                totalReleased += pending.amount;
                availableLiquidity -= pending.amount;

                wattToken.safeTransfer(pending.recipient, pending.amount);

                emit BridgeCompleted(
                    transferId,
                    pending.recipient,
                    pending.amount,
                    pending.sourceChain,
                    chainId,
                    block.timestamp
                );

                processed++;
            }
        }
    }

    /**
     * @notice Add liquidity to the bridge pool
     * @param amount The amount of WATT to add
     */
    function addLiquidity(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");

        wattToken.safeTransferFrom(msg.sender, address(this), amount);

        emit LiquidityAdded(msg.sender, amount);

        // Try to process pending releases
        processPendingReleases(10);
    }

    /**
     * @notice Remove liquidity from the bridge pool (admin only)
     * @param amount The amount to remove
     * @param recipient The recipient address
     */
    function removeLiquidity(
        uint256 amount,
        address recipient
    ) external nonReentrant onlyRole(ADMIN_ROLE) {
        require(amount > 0, "Amount must be greater than 0");
        require(recipient != address(0), "Invalid recipient");

        uint256 available = getAvailableLiquidity();
        require(amount <= available, "Insufficient available liquidity");

        wattToken.safeTransfer(recipient, amount);

        emit LiquidityRemoved(recipient, amount);
    }

    /**
     * @notice Withdraw collected fees (admin only)
     * @param recipient The recipient address
     */
    function withdrawFees(address recipient) external onlyRole(ADMIN_ROLE) {
        require(recipient != address(0), "Invalid recipient");

        uint256 fees = totalFeesCollected;
        require(fees > 0, "No fees to withdraw");

        // Reset before transfer to prevent reentrancy
        totalFeesCollected = 0;

        wattToken.safeTransfer(recipient, fees);

        emit FeesWithdrawn(recipient, fees);
    }

    /**
     * @notice Get available liquidity for releases
     */
    function getAvailableLiquidity() public view returns (uint256) {
        uint256 balance = wattToken.balanceOf(address(this));
        // Available = balance - fees (fees are kept separate)
        if (balance > totalFeesCollected) {
            return balance - totalFeesCollected;
        }
        return 0;
    }

    /**
     * @notice Get pool statistics
     */
    function getPoolStats() external view returns (
        uint256 _totalLocked,
        uint256 _totalReleased,
        uint256 _totalFees,
        uint256 _availableLiquidity,
        uint256 _pendingCount
    ) {
        _totalLocked = totalLocked;
        _totalReleased = totalReleased;
        _totalFees = totalFeesCollected;
        _availableLiquidity = getAvailableLiquidity();

        // Count unprocessed pending releases
        for (uint256 i = 0; i < pendingReleaseIds.length; i++) {
            if (!pendingReleases[pendingReleaseIds[i]].processed) {
                _pendingCount++;
            }
        }
    }

    /**
     * @notice Get pending release details
     */
    function getPendingRelease(bytes32 transferId) external view returns (
        address recipient,
        uint256 amount,
        uint256 sourceChain,
        uint256 timestamp,
        bool processed
    ) {
        PendingRelease memory pending = pendingReleases[transferId];
        return (
            pending.recipient,
            pending.amount,
            pending.sourceChain,
            pending.timestamp,
            pending.processed
        );
    }

    // Admin functions
    function setBridgeFee(uint256 _fee) external onlyRole(ADMIN_ROLE) {
        require(_fee <= 500, "Fee too high"); // Max 5%
        bridgeFee = _fee;
    }

    function setMinBridgeAmount(uint256 _min) external onlyRole(ADMIN_ROLE) {
        minBridgeAmount = _min;
    }

    function setMaxBridgeAmount(uint256 _max) external onlyRole(ADMIN_ROLE) {
        maxBridgeAmount = _max;
    }

    function setSupportedChain(uint256 _chainId, bool _supported) external onlyRole(ADMIN_ROLE) {
        supportedChains[_chainId] = _supported;
        emit ChainSupported(_chainId, _supported);
    }

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    function addRelayer(address relayer) external onlyRole(ADMIN_ROLE) {
        grantRole(RELAYER_ROLE, relayer);
    }

    function removeRelayer(address relayer) external onlyRole(ADMIN_ROLE) {
        revokeRole(RELAYER_ROLE, relayer);
    }
}
