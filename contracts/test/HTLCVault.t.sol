// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {TestBase} from "./TestBase.sol";
import {HTLCVault} from "../src/HTLCVault.sol";
import {MockERC20, MockUSDT, MockFeeToken, MockFalseToken, ReentrantClaimer, ReentrantRefunder} from "./Mocks.sol";

contract HTLCVaultTest is TestBase {
    HTLCVault vault;
    MockERC20 token;

    address alice = address(0xA11CE);
    address payable bob = payable(address(0xB0B));

    bytes32 constant PREIMAGE = keccak256("the swap secret");
    bytes32 HASHLOCK;

    function setUp() public {
        vault = new HTLCVault();
        token = new MockERC20();
        HASHLOCK = sha256(abi.encodePacked(PREIMAGE));
        vm.deal(alice, 100 ether);
        token.mint(alice, 1_000e18);
    }

    function _lockNative(uint256 amount, uint256 timeout, uint256 nonce) internal returns (bytes32 id) {
        vm.prank(alice);
        id = vault.lock{value: amount}(bob, HASHLOCK, timeout, address(0), amount, nonce);
    }

    // ---- happy paths ----

    function test_native_lock_claim() public {
        uint256 timeout = block.timestamp + 2 hours;
        bytes32 id = _lockNative(5 ether, timeout, 1);
        assertTrue(vault.stageOf(id) == HTLCVault.Stage.LOCKED, "locked");

        uint256 bobBefore = bob.balance;
        vm.prank(bob);
        vault.claim(id, PREIMAGE);
        assertEq(bob.balance, bobBefore + 5 ether, "bob paid");
        assertTrue(vault.stageOf(id) == HTLCVault.Stage.CLAIMED, "claimed");
        assertEq(vault.preimages(id), PREIMAGE, "preimage published");
    }

    function test_native_refund_after_timeout() public {
        uint256 timeout = block.timestamp + 2 hours;
        bytes32 id = _lockNative(5 ether, timeout, 1);

        vm.warp(timeout);
        uint256 aliceBefore = alice.balance;
        vm.prank(alice);
        vault.refund(id);
        assertEq(alice.balance, aliceBefore + 5 ether, "alice refunded");
        assertTrue(vault.stageOf(id) == HTLCVault.Stage.REFUNDED, "refunded");
    }

    function test_erc20_lock_claim() public {
        uint256 timeout = block.timestamp + 2 hours;
        vm.startPrank(alice);
        token.approve(address(vault), 100e18);
        bytes32 id = vault.lock(bob, HASHLOCK, timeout, address(token), 100e18, 7);
        vm.stopPrank();

        vm.prank(bob);
        vault.claim(id, PREIMAGE);
        assertEq(token.balanceOf(bob), 100e18, "bob got tokens");
    }

    function test_usdt_style_token() public {
        MockUSDT usdt = new MockUSDT();
        usdt.mint(alice, 100e6);
        uint256 timeout = block.timestamp + 2 hours;
        vm.startPrank(alice);
        usdt.approve(address(vault), 100e6);
        bytes32 id = vault.lock(bob, HASHLOCK, timeout, address(usdt), 100e6, 1);
        vm.stopPrank();

        vm.prank(bob);
        vault.claim(id, PREIMAGE);
        assertEq(usdt.balanceOf(bob), 100e6, "bob got usdt");
    }

    /// Fee-on-transfer: the lock records what arrived, so claim pays exactly
    /// that and the vault can never go insolvent.
    function test_fee_on_transfer_records_delta() public {
        MockFeeToken fee = new MockFeeToken();
        fee.mint(alice, 100e18);
        uint256 timeout = block.timestamp + 2 hours;
        vm.startPrank(alice);
        fee.approve(address(vault), 100e18);
        bytes32 id = vault.lock(bob, HASHLOCK, timeout, address(fee), 100e18, 1);
        vm.stopPrank();

        HTLCVault.Lock memory l = vault.getLock(id);
        assertEq(l.value, 90e18, "recorded received amount, not sent amount");
    }

    // ---- attack / failure paths ----

    function test_claim_wrong_preimage_reverts() public {
        bytes32 id = _lockNative(1 ether, block.timestamp + 2 hours, 1);
        vm.prank(bob);
        vm.expectRevert(HTLCVault.InvalidPreimage.selector);
        vault.claim(id, keccak256("wrong"));
    }

    function test_claim_by_non_recipient_reverts() public {
        bytes32 id = _lockNative(1 ether, block.timestamp + 2 hours, 1);
        vm.prank(alice);
        vm.expectRevert(HTLCVault.NotRecipient.selector);
        vault.claim(id, PREIMAGE);
    }

    function test_claim_after_timeout_reverts() public {
        uint256 timeout = block.timestamp + 2 hours;
        bytes32 id = _lockNative(1 ether, timeout, 1);
        vm.warp(timeout);
        vm.prank(bob);
        vm.expectRevert(HTLCVault.TooLateToClaim.selector);
        vault.claim(id, PREIMAGE);
    }

    function test_refund_before_timeout_reverts() public {
        bytes32 id = _lockNative(1 ether, block.timestamp + 2 hours, 1);
        vm.prank(alice);
        vm.expectRevert(HTLCVault.TooEarlyToRefund.selector);
        vault.refund(id);
    }

    function test_refund_by_non_sender_reverts() public {
        uint256 timeout = block.timestamp + 2 hours;
        bytes32 id = _lockNative(1 ether, timeout, 1);
        vm.warp(timeout);
        vm.prank(bob);
        vm.expectRevert(HTLCVault.NotSender.selector);
        vault.refund(id);
    }

    function test_double_claim_reverts() public {
        bytes32 id = _lockNative(1 ether, block.timestamp + 2 hours, 1);
        vm.prank(bob);
        vault.claim(id, PREIMAGE);
        vm.prank(bob);
        vm.expectRevert(HTLCVault.InvalidSwap.selector);
        vault.claim(id, PREIMAGE);
    }

    function test_claim_then_refund_reverts() public {
        uint256 timeout = block.timestamp + 2 hours;
        bytes32 id = _lockNative(1 ether, timeout, 1);
        vm.prank(bob);
        vault.claim(id, PREIMAGE);
        vm.warp(timeout);
        vm.prank(alice);
        vm.expectRevert(HTLCVault.InvalidSwap.selector);
        vault.refund(id);
    }

    function test_duplicate_lock_same_params_reverts() public {
        uint256 timeout = block.timestamp + 2 hours;
        _lockNative(1 ether, timeout, 42);
        vm.prank(alice);
        vm.expectRevert(HTLCVault.SwapAlreadyExists.selector);
        vault.lock{value: 1 ether}(bob, HASHLOCK, timeout, address(0), 1 ether, 42);
    }

    function test_timeout_bounds() public {
        vm.prank(alice);
        vm.expectRevert(HTLCVault.InvalidTimeout.selector);
        vault.lock{value: 1 ether}(bob, HASHLOCK, block.timestamp + 30 minutes, address(0), 1 ether, 1);

        vm.prank(alice);
        vm.expectRevert(HTLCVault.InvalidTimeout.selector);
        vault.lock{value: 1 ether}(bob, HASHLOCK, block.timestamp + 31 days, address(0), 1 ether, 2);
    }

    function test_native_value_mismatch_reverts() public {
        vm.prank(alice);
        vm.expectRevert(HTLCVault.BadNativeValue.selector);
        vault.lock{value: 1 ether}(bob, HASHLOCK, block.timestamp + 2 hours, address(0), 2 ether, 1);
    }

    function test_native_sent_with_erc20_lock_reverts() public {
        vm.startPrank(alice);
        token.approve(address(vault), 1e18);
        vm.expectRevert(HTLCVault.BadNativeValue.selector);
        vault.lock{value: 1 ether}(bob, HASHLOCK, block.timestamp + 2 hours, address(token), 1e18, 1);
        vm.stopPrank();
    }

    function test_false_returning_token_reverts() public {
        MockFalseToken bad = new MockFalseToken();
        vm.prank(alice);
        vm.expectRevert(HTLCVault.TransferFailed.selector);
        vault.lock(bob, HASHLOCK, block.timestamp + 2 hours, address(bad), 1e18, 1);
    }

    /// Claim reentry: the inner claim() must revert; funds are paid exactly once.
    function test_reentrant_claim_cannot_double_pay() public {
        ReentrantClaimer attacker = new ReentrantClaimer(address(vault));
        uint256 timeout = block.timestamp + 2 hours;
        vm.prank(alice);
        bytes32 id = vault.lock{value: 3 ether}(
            payable(address(attacker)), HASHLOCK, timeout, address(0), 3 ether, 1
        );
        attacker.setTarget(id, PREIMAGE);
        attacker.doClaim();
        assertEq(address(attacker).balance, 3 ether, "paid exactly once");
        assertTrue(attacker.reentered() == 1, "reentry attempted and failed");
        assertEq(address(vault).balance, 0, "vault drained only of this lock");
    }

    /// Refund reentry: same guarantee on the refund path.
    function test_reentrant_refund_cannot_double_pay() public {
        ReentrantRefunder attacker = new ReentrantRefunder(address(vault));
        uint256 timeout = block.timestamp + 2 hours;
        bytes32 id = attacker.doLock{value: 3 ether}(bob, HASHLOCK, timeout, 1);
        assertTrue(id != bytes32(0), "locked");

        vm.warp(timeout);
        attacker.doRefund();
        assertEq(address(attacker).balance, 3 ether, "refunded exactly once");
        assertTrue(attacker.reentered() == 1, "reentry attempted and failed");
    }

    /// Two vaults on two "chains" (simulated): claiming leg B reveals the
    /// preimage that unlocks leg A — the full atomic-swap round trip.
    function test_cross_chain_swap_roundtrip() public {
        HTLCVault chainA = new HTLCVault(); // e.g. WATTx
        HTLCVault chainB = new HTLCVault(); // e.g. Ethereum
        vm.deal(bob, 10 ether);

        // Alice (initiator, knows preimage) locks on A for Bob, long timeout.
        vm.prank(alice);
        bytes32 idA = chainA.lock{value: 5 ether}(
            bob, HASHLOCK, block.timestamp + 24 hours, address(0), 5 ether, 1
        );
        // Bob locks on B for Alice, SHORTER timeout.
        vm.prank(bob);
        bytes32 idB = chainB.lock{value: 5 ether}(
            payable(alice), HASHLOCK, block.timestamp + 12 hours, address(0), 5 ether, 1
        );

        // Alice claims B — this publishes the preimage.
        vm.prank(alice);
        chainB.claim(idB, PREIMAGE);
        bytes32 revealed = chainB.preimages(idB);
        assertEq(revealed, PREIMAGE, "preimage now public");

        // Bob uses the revealed preimage to claim A before his deadline.
        vm.prank(bob);
        chainA.claim(idA, revealed);
        assertTrue(chainA.stageOf(idA) == HTLCVault.Stage.CLAIMED, "leg A claimed");
        assertTrue(chainB.stageOf(idB) == HTLCVault.Stage.CLAIMED, "leg B claimed");
    }
}
