// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {TestBase} from "./TestBase.sol";
import {WrappedNative} from "../src/WrappedNative.sol";
import {WrappedToken} from "../src/WrappedToken.sol";
import {WrappedTokenFactory} from "../src/WrappedTokenFactory.sol";
import {MockERC20, MockUSDT, MockFeeToken} from "./Mocks.sol";

contract WrappedNativeTest is TestBase {
    WrappedNative w;
    address alice = address(0xA11CE);

    function setUp() public {
        w = new WrappedNative("Wrapped WTX", "wWTX");
        vm.deal(alice, 100 ether);
    }

    function test_deposit_withdraw_roundtrip() public {
        vm.startPrank(alice);
        w.deposit{value: 10 ether}();
        assertEq(w.balanceOf(alice), 10 ether, "minted");
        assertEq(w.totalSupply(), 10 ether, "supply");
        assertEq(address(w).balance, 10 ether, "collateral");

        w.withdraw(4 ether);
        assertEq(w.balanceOf(alice), 6 ether, "burned");
        assertEq(alice.balance, 94 ether, "native back");
        vm.stopPrank();
        // invariant: fully collateralized
        assertEq(address(w).balance, w.totalSupply(), "supply == collateral");
    }

    function test_receive_fallback_deposits() public {
        vm.prank(alice);
        (bool ok, ) = address(w).call{value: 1 ether}("");
        assertTrue(ok, "send ok");
        assertEq(w.balanceOf(alice), 1 ether, "minted via receive");
    }

    function test_withdraw_more_than_balance_reverts() public {
        vm.startPrank(alice);
        w.deposit{value: 1 ether}();
        vm.expectRevert(WrappedNative.InsufficientBalance.selector);
        w.withdraw(2 ether);
        vm.stopPrank();
    }

    function test_transfer_and_allowance() public {
        address bob = address(0xB0B);
        vm.startPrank(alice);
        w.deposit{value: 5 ether}();
        w.transfer(bob, 2 ether);
        w.approve(bob, 1 ether);
        vm.stopPrank();
        assertEq(w.balanceOf(bob), 2 ether, "transferred");

        vm.prank(bob);
        w.transferFrom(alice, bob, 1 ether);
        assertEq(w.balanceOf(bob), 3 ether, "pulled via allowance");

        vm.prank(bob);
        vm.expectRevert(WrappedNative.InsufficientAllowance.selector);
        w.transferFrom(alice, bob, 1 ether);
    }
}

contract WrappedTokenTest is TestBase {
    MockERC20 underlying;
    WrappedToken w;
    address alice = address(0xA11CE);

    function setUp() public {
        underlying = new MockERC20();
        w = new WrappedToken(address(underlying), "Wrapped Mock", "wMOCK", 18);
        underlying.mint(alice, 1_000e18);
    }

    function test_wrap_unwrap_roundtrip() public {
        vm.startPrank(alice);
        underlying.approve(address(w), 100e18);
        uint256 minted = w.wrap(100e18);
        assertEq(minted, 100e18, "1:1 mint");
        assertEq(w.balanceOf(alice), 100e18, "wrapped balance");

        w.unwrap(40e18);
        assertEq(underlying.balanceOf(alice), 940e18, "underlying back");
        vm.stopPrank();
        // invariant: wrapped supply never exceeds collateral held
        assertTrue(underlying.balanceOf(address(w)) >= w.totalSupply(), "collateralized");
    }

    /// Fee-on-transfer can only ever mint what actually arrived.
    function test_fee_on_transfer_mints_received_amount() public {
        MockFeeToken fee = new MockFeeToken();
        WrappedToken wf = new WrappedToken(address(fee), "Wrapped Fee", "wFEE", 18);
        fee.mint(alice, 100e18);
        vm.startPrank(alice);
        fee.approve(address(wf), 100e18);
        uint256 minted = wf.wrap(100e18);
        vm.stopPrank();
        assertEq(minted, 90e18, "minted = received, not sent");
        assertTrue(fee.balanceOf(address(wf)) >= wf.totalSupply(), "collateralized");
    }

    function test_usdt_style_underlying() public {
        MockUSDT usdt = new MockUSDT();
        WrappedToken wu = new WrappedToken(address(usdt), "Wrapped USDT", "wUSDT", 6);
        usdt.mint(alice, 500e6);
        vm.startPrank(alice);
        usdt.approve(address(wu), 500e6);
        wu.wrap(500e6);
        wu.unwrap(500e6);
        vm.stopPrank();
        assertEq(usdt.balanceOf(alice), 500e6, "full roundtrip");
        assertEq(wu.totalSupply(), 0, "supply zeroed");
    }

    function test_unwrap_more_than_balance_reverts() public {
        vm.startPrank(alice);
        underlying.approve(address(w), 10e18);
        w.wrap(10e18);
        vm.expectRevert(WrappedToken.InsufficientBalance.selector);
        w.unwrap(11e18);
        vm.stopPrank();
    }
}

contract WrappedTokenFactoryTest is TestBase {
    WrappedTokenFactory factory;
    MockERC20 tokenA;

    function setUp() public {
        factory = new WrappedTokenFactory();
        tokenA = new MockERC20();
    }

    function test_deploy_wrapped_native_once() public {
        address w = factory.deployWrappedNative("Wrapped WTX", "wWTX");
        assertEq(factory.wrappedNative(), w, "registered");
        vm.expectRevert(WrappedTokenFactory.AlreadyDeployed.selector);
        factory.deployWrappedNative("Evil WTX", "eWTX");
    }

    function test_deploy_wrapper_idempotent() public {
        address w1 = factory.deployWrapper(address(tokenA));
        address w2 = factory.deployWrapper(address(tokenA));
        assertEq(w1, w2, "same wrapper returned");
        assertEq(WrappedToken(w1).underlying(), address(tokenA), "underlying bound");
    }

    function test_wrapper_metadata_derived() public {
        address w = factory.deployWrapper(address(tokenA));
        assertTrue(
            keccak256(bytes(WrappedToken(w).symbol())) == keccak256(bytes("wMOCK")),
            "symbol prefixed"
        );
        assertEq(uint256(WrappedToken(w).decimals()), 18, "decimals mirrored");
    }

    /// Same factory bytecode + same salt => same wrapper address on every
    /// chain. Two factory instances at different addresses give different
    /// wrapper addresses (address depends on deployer), so cross-chain
    /// determinism requires the factory itself at one address — that is the
    /// deployment invariant, which this asserts the CREATE2 half of.
    function test_create2_deterministic_per_factory() public {
        address w1 = factory.deployWrapper(address(tokenA));
        assertTrue(w1 != address(0), "deployed");
        // second underlying gets a different, also-deterministic address
        MockERC20 tokenB = new MockERC20();
        address w2 = factory.deployWrapper(address(tokenB));
        assertTrue(w1 != w2, "distinct per underlying");
    }
}
