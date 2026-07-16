// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/// @title HTLCVault — hashlocked-timelocked atomic-swap vault
/// @notice The cross-chain leg of the WATTxchange bridge. The same contract is
///         deployed (at the same CREATE2 address) on every EVM chain including
///         WATTx; a cross-chain transfer is two locks under one
///         `sha256(preimage)` hashlock — claiming one side reveals the
///         preimage on-chain, which lets the counterparty claim the other side
///         before their (shorter) timelock expires. SHA-256 is used instead of
///         keccak so the identical hashlock works in Bitcoin-script HTLCs and
///         Solana programs, making swaps portable to non-EVM legs (BTC, LTC,
///         SOL, ...).
///
///         Trust model: there is NO custodian, NO validator set, NO oracle,
///         NO owner and NO upgrade path. Funds in a lock can move exactly two
///         ways — to the recipient with the preimage before the timeout, or
///         back to the sender after it. Safety rests on those two code paths
///         alone.
///
///         `asset == address(0)` locks the chain's native coin; any other
///         address locks that ERC-20 (caller approves first). ERC-20 locks
///         record the balance-delta actually received, so fee-on-transfer
///         tokens cannot make the vault insolvent.
contract HTLCVault {
    enum Stage { INVALID, LOCKED, CLAIMED, REFUNDED }

    struct Lock {
        address payable sender;    // funds this leg; may refund after timeout
        address payable recipient; // claims with the preimage before timeout
        bytes32 hashlock;          // sha256(preimage)
        uint256 timeout;           // unix seconds
        address asset;             // address(0) = native coin, else ERC-20
        uint256 value;             // amount actually held for this lock
    }

    /// Inclusive bounds on lock duration: long enough that the counterparty
    /// can always observe the reveal and react, short enough that a refused
    /// swap doesn't strand funds for long.
    uint256 public constant MIN_DURATION = 1 hours;
    uint256 public constant MAX_DURATION = 30 days;

    mapping(bytes32 => Stage) public stageOf;
    mapping(bytes32 => Lock) public locks;
    mapping(bytes32 => bytes32) public preimages; // swapID => revealed preimage

    event Locked(
        bytes32 indexed swapID,
        address indexed sender,
        address indexed recipient,
        bytes32 hashlock,
        uint256 timeout,
        address asset,
        uint256 value
    );
    event Claimed(bytes32 indexed swapID, bytes32 preimage);
    event Refunded(bytes32 indexed swapID);

    error ZeroValue();
    error ZeroAddress();
    error InvalidTimeout();
    error SwapAlreadyExists();
    error InvalidSwap();
    error NotRecipient();
    error NotSender();
    error TooLateToClaim();
    error TooEarlyToRefund();
    error InvalidPreimage();
    error BadNativeValue();
    error TransferFailed();
    error Reentered();

    uint256 private _entered = 1;
    modifier nonReentrant() {
        if (_entered != 1) revert Reentered();
        _entered = 2;
        _;
        _entered = 1;
    }

    /// @notice Deterministic ID: binds every parameter, the chain and this
    ///         contract, so a lock can never be replayed on another chain or
    ///         collide with a different swap's parameters.
    function swapID(
        address sender,
        address recipient,
        bytes32 hashlock,
        uint256 timeout,
        address asset,
        uint256 value,
        uint256 nonce
    ) public view returns (bytes32) {
        return keccak256(
            abi.encode(block.chainid, address(this), sender, recipient, hashlock, timeout, asset, value, nonce)
        );
    }

    /// @notice Lock funds under `hashlock` for `recipient` until `timeout`.
    ///         Native: send the amount as msg.value with asset = address(0).
    ///         ERC-20: approve first; the recorded lock value is the balance
    ///         delta actually received.
    function lock(
        address payable recipient,
        bytes32 hashlock,
        uint256 timeout,
        address asset,
        uint256 value,
        uint256 nonce
    ) external payable nonReentrant returns (bytes32 id) {
        if (recipient == address(0)) revert ZeroAddress();
        if (hashlock == bytes32(0)) revert InvalidPreimage();
        if (timeout < block.timestamp + MIN_DURATION || timeout > block.timestamp + MAX_DURATION) {
            revert InvalidTimeout();
        }

        uint256 received;
        if (asset == address(0)) {
            if (msg.value == 0 || msg.value != value) revert BadNativeValue();
            received = msg.value;
        } else {
            if (msg.value != 0) revert BadNativeValue();
            if (value == 0) revert ZeroValue();
            uint256 before = _erc20Balance(asset);
            _safeTransferFrom(asset, msg.sender, address(this), value);
            received = _erc20Balance(asset) - before;
            if (received == 0) revert ZeroValue();
        }

        id = swapID(msg.sender, recipient, hashlock, timeout, asset, received, nonce);
        if (stageOf[id] != Stage.INVALID) revert SwapAlreadyExists();

        stageOf[id] = Stage.LOCKED;
        locks[id] = Lock({
            sender: payable(msg.sender),
            recipient: recipient,
            hashlock: hashlock,
            timeout: timeout,
            asset: asset,
            value: received
        });
        emit Locked(id, msg.sender, recipient, hashlock, timeout, asset, received);
    }

    /// @notice Recipient claims with the preimage before the timeout. The
    ///         preimage becomes public (event + mapping) — that reveal is what
    ///         unlocks the counterparty leg on the other chain.
    function claim(bytes32 id, bytes32 preimage) external nonReentrant {
        if (stageOf[id] != Stage.LOCKED) revert InvalidSwap();
        Lock memory l = locks[id];
        if (msg.sender != l.recipient) revert NotRecipient();
        if (block.timestamp >= l.timeout) revert TooLateToClaim();
        if (sha256(abi.encodePacked(preimage)) != l.hashlock) revert InvalidPreimage();

        // effects before interaction
        stageOf[id] = Stage.CLAIMED;
        preimages[id] = preimage;
        emit Claimed(id, preimage);

        _payout(l.asset, l.recipient, l.value);
    }

    /// @notice Sender takes the funds back once the timeout has passed.
    function refund(bytes32 id) external nonReentrant {
        if (stageOf[id] != Stage.LOCKED) revert InvalidSwap();
        Lock memory l = locks[id];
        if (msg.sender != l.sender) revert NotSender();
        if (block.timestamp < l.timeout) revert TooEarlyToRefund();

        // effects before interaction
        stageOf[id] = Stage.REFUNDED;
        emit Refunded(id);

        _payout(l.asset, l.sender, l.value);
    }

    function getLock(bytes32 id) external view returns (Lock memory) {
        return locks[id];
    }

    function _payout(address asset, address payable to, uint256 value) internal {
        if (asset == address(0)) {
            (bool ok, ) = to.call{value: value}("");
            if (!ok) revert TransferFailed();
        } else {
            _safeTransfer(asset, to, value);
        }
    }

    function _erc20Balance(address token) internal view returns (uint256) {
        (bool ok, bytes memory data) =
            token.staticcall(abi.encodeWithSignature("balanceOf(address)", address(this)));
        if (!ok || data.length < 32) revert TransferFailed();
        return abi.decode(data, (uint256));
    }

    /// USDT-style tokens return no bool; treat empty return as success,
    /// explicit `false` as failure.
    function _safeTransfer(address token, address to, uint256 value) internal {
        (bool ok, bytes memory data) =
            token.call(abi.encodeWithSignature("transfer(address,uint256)", to, value));
        if (!ok || (data.length >= 32 && !abi.decode(data, (bool)))) revert TransferFailed();
    }

    function _safeTransferFrom(address token, address from, address to, uint256 value) internal {
        (bool ok, bytes memory data) =
            token.call(abi.encodeWithSignature("transferFrom(address,address,uint256)", from, to, value));
        if (!ok || (data.length >= 32 && !abi.decode(data, (bool)))) revert TransferFailed();
    }
}
