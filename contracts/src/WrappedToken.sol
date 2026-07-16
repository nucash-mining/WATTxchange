// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/// @title WrappedToken — fully-collateralized 1:1 wrapper for any ERC-20
/// @notice `wrap` pulls the underlying token in and mints wrapped units equal
///         to what was ACTUALLY received (balance-delta, so fee-on-transfer
///         and rebasing-down tokens can never create unbacked supply);
///         `unwrap` burns and pays the underlying back out. The invariant
///         `underlying.balanceOf(this) >= totalSupply` holds at all times.
///         No owner, no admin mint, no upgradability, no hooks.
contract WrappedToken {
    string public name;
    string public symbol;
    uint8 public immutable decimals;
    address public immutable underlying;

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Wrap(address indexed account, uint256 value);
    event Unwrap(address indexed account, uint256 value);

    error ZeroValue();
    error ZeroAddress();
    error InsufficientBalance();
    error InsufficientAllowance();
    error TransferFailed();
    error Reentered();

    uint256 private _entered = 1;
    modifier nonReentrant() {
        if (_entered != 1) revert Reentered();
        _entered = 2;
        _;
        _entered = 1;
    }

    constructor(address underlying_, string memory name_, string memory symbol_, uint8 decimals_) {
        if (underlying_ == address(0)) revert ZeroAddress();
        underlying = underlying_;
        name = name_;
        symbol = symbol_;
        decimals = decimals_;
    }

    /// @notice Deposit `value` underlying, receive wrapped 1:1 with the amount
    ///         actually transferred in. Caller must approve first.
    function wrap(uint256 value) external nonReentrant returns (uint256 minted) {
        if (value == 0) revert ZeroValue();
        uint256 before = _underlyingBalance();
        _safeTransferFrom(underlying, msg.sender, address(this), value);
        minted = _underlyingBalance() - before;
        if (minted == 0) revert ZeroValue();
        balanceOf[msg.sender] += minted;
        totalSupply += minted;
        emit Wrap(msg.sender, minted);
        emit Transfer(address(0), msg.sender, minted);
    }

    /// @notice Burn `value` wrapped and receive the underlying back.
    function unwrap(uint256 value) external nonReentrant {
        if (value == 0) revert ZeroValue();
        uint256 bal = balanceOf[msg.sender];
        if (bal < value) revert InsufficientBalance();
        // effects before interaction
        balanceOf[msg.sender] = bal - value;
        totalSupply -= value;
        emit Unwrap(msg.sender, value);
        emit Transfer(msg.sender, address(0), value);
        _safeTransfer(underlying, msg.sender, value);
    }

    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transfer(address to, uint256 value) external returns (bool) {
        return _transfer(msg.sender, to, value);
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            if (allowed < value) revert InsufficientAllowance();
            allowance[from][msg.sender] = allowed - value;
        }
        return _transfer(from, to, value);
    }

    function _transfer(address from, address to, uint256 value) internal returns (bool) {
        uint256 bal = balanceOf[from];
        if (bal < value) revert InsufficientBalance();
        unchecked {
            balanceOf[from] = bal - value;
            balanceOf[to] += value;
        }
        emit Transfer(from, to, value);
        return true;
    }

    function _underlyingBalance() internal view returns (uint256) {
        (bool ok, bytes memory data) =
            underlying.staticcall(abi.encodeWithSignature("balanceOf(address)", address(this)));
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
