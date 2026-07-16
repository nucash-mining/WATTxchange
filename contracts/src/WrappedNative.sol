// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/// @title WrappedNative — canonical WETH9-style wrapper for a chain's native coin
/// @notice Deployed once per EVM chain (wALT on Altcoinchain, wWTX on WATTx,
///         wETH on Ethereum, ...). Fully collateralized by construction: every
///         wrapped unit is backed by exactly one native unit held by this
///         contract, and the ONLY way supply is created or destroyed is
///         deposit/withdraw by the holder themselves. No owner, no admin mint,
///         no upgradability — there is no privileged party to compromise.
contract WrappedNative {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Deposit(address indexed to, uint256 value);
    event Withdrawal(address indexed from, uint256 value);

    error InsufficientBalance();
    error InsufficientAllowance();
    error NativeSendFailed();

    constructor(string memory name_, string memory symbol_) {
        name = name_;
        symbol = symbol_;
    }

    receive() external payable {
        deposit();
    }

    function deposit() public payable {
        balanceOf[msg.sender] += msg.value;
        totalSupply += msg.value;
        emit Deposit(msg.sender, msg.value);
        emit Transfer(address(0), msg.sender, msg.value);
    }

    function withdraw(uint256 value) external {
        uint256 bal = balanceOf[msg.sender];
        if (bal < value) revert InsufficientBalance();
        // effects before interaction — native send cannot re-enter into an
        // inconsistent state
        balanceOf[msg.sender] = bal - value;
        totalSupply -= value;
        emit Withdrawal(msg.sender, value);
        emit Transfer(msg.sender, address(0), value);
        (bool ok, ) = msg.sender.call{value: value}("");
        if (!ok) revert NativeSendFailed();
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
}
