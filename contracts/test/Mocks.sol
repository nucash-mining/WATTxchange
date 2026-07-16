// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/// Plain well-behaved ERC-20.
contract MockERC20 {
    string public name = "Mock";
    string public symbol = "MOCK";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 v) external {
        balanceOf[to] += v;
        totalSupply += v;
    }

    function approve(address s, uint256 v) external returns (bool) {
        allowance[msg.sender][s] = v;
        return true;
    }

    function transfer(address to, uint256 v) public virtual returns (bool) {
        require(balanceOf[msg.sender] >= v, "bal");
        balanceOf[msg.sender] -= v;
        balanceOf[to] += v;
        return true;
    }

    function transferFrom(address f, address to, uint256 v) public virtual returns (bool) {
        require(allowance[f][msg.sender] >= v, "allow");
        require(balanceOf[f] >= v, "bal");
        allowance[f][msg.sender] -= v;
        balanceOf[f] -= v;
        balanceOf[to] += v;
        return true;
    }
}

/// USDT-style: no bool returns.
contract MockUSDT {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 v) external { balanceOf[to] += v; }
    function approve(address s, uint256 v) external { allowance[msg.sender][s] = v; }

    function transfer(address to, uint256 v) external {
        require(balanceOf[msg.sender] >= v, "bal");
        balanceOf[msg.sender] -= v;
        balanceOf[to] += v;
    }

    function transferFrom(address f, address to, uint256 v) external {
        require(allowance[f][msg.sender] >= v, "allow");
        require(balanceOf[f] >= v, "bal");
        allowance[f][msg.sender] -= v;
        balanceOf[f] -= v;
        balanceOf[to] += v;
    }
}

/// Takes a 10% fee on every transfer — used to prove balance-delta accounting.
contract MockFeeToken is MockERC20 {
    function transfer(address to, uint256 v) public override returns (bool) {
        require(balanceOf[msg.sender] >= v, "bal");
        balanceOf[msg.sender] -= v;
        uint256 fee = v / 10;
        balanceOf[to] += v - fee;
        totalSupply -= fee;
        return true;
    }

    function transferFrom(address f, address to, uint256 v) public override returns (bool) {
        require(allowance[f][msg.sender] >= v, "allow");
        require(balanceOf[f] >= v, "bal");
        allowance[f][msg.sender] -= v;
        balanceOf[f] -= v;
        uint256 fee = v / 10;
        balanceOf[to] += v - fee;
        totalSupply -= fee;
        return true;
    }
}

/// Returns false instead of reverting.
contract MockFalseToken {
    function transfer(address, uint256) external pure returns (bool) { return false; }
    function transferFrom(address, address, uint256) external pure returns (bool) { return false; }
    function balanceOf(address) external pure returns (uint256) { return 0; }
}

interface IHTLCVault {
    function claim(bytes32 id, bytes32 preimage) external;
    function refund(bytes32 id) external;
    function lock(
        address payable recipient,
        bytes32 hashlock,
        uint256 timeout,
        address asset,
        uint256 value,
        uint256 nonce
    ) external payable returns (bytes32);
}

/// Recipient that re-enters claim() from its receive hook.
contract ReentrantClaimer {
    IHTLCVault public vault;
    bytes32 public id;
    bytes32 public preimage;
    uint256 public reentered;

    constructor(address vault_) { vault = IHTLCVault(vault_); }
    function setTarget(bytes32 id_, bytes32 preimage_) external { id = id_; preimage = preimage_; }
    function doClaim() external { vault.claim(id, preimage); }

    receive() external payable {
        if (reentered == 0) {
            reentered = 1;
            // must revert inside the vault (state already CLAIMED + guard)
            try vault.claim(id, preimage) { reentered = 2; } catch {}
        }
    }
}

/// Sender that re-enters refund() from its receive hook.
contract ReentrantRefunder {
    IHTLCVault public vault;
    bytes32 public id;
    uint256 public reentered;

    constructor(address vault_) { vault = IHTLCVault(vault_); }

    function doLock(
        address payable recipient,
        bytes32 hashlock,
        uint256 timeout,
        uint256 nonce
    ) external payable returns (bytes32 id_) {
        id_ = vault.lock{value: msg.value}(recipient, hashlock, timeout, address(0), msg.value, nonce);
        id = id_;
    }

    function doRefund() external { vault.refund(id); }

    receive() external payable {
        if (reentered == 0) {
            reentered = 1;
            try vault.refund(id) { reentered = 2; } catch {}
        }
    }
}
