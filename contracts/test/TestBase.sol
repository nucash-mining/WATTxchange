// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/// Minimal self-contained forge test base (no forge-std dependency).
interface Vm {
    function prank(address) external;
    function startPrank(address) external;
    function stopPrank() external;
    function deal(address, uint256) external;
    function warp(uint256) external;
    function expectRevert(bytes4) external;
    function expectRevert() external;
}

abstract contract TestBase {
    Vm internal constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    function assertEq(uint256 a, uint256 b, string memory m) internal pure {
        require(a == b, m);
    }

    function assertEq(address a, address b, string memory m) internal pure {
        require(a == b, m);
    }

    function assertEq(bytes32 a, bytes32 b, string memory m) internal pure {
        require(a == b, m);
    }

    function assertTrue(bool v, string memory m) internal pure {
        require(v, m);
    }
}
