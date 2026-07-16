// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {WrappedTokenFactory} from "../src/WrappedTokenFactory.sol";
import {HTLCVault} from "../src/HTLCVault.sol";

interface VmDeploy {
    function startBroadcast() external;
    function stopBroadcast() external;
}

/// Deploys the bridge pair (factory + vault) on the connected chain.
/// Run per chain:
///   forge script script/Deploy.s.sol --rpc-url <chain> --broadcast \
///     --private-key $DEPLOYER_KEY --legacy
/// Use the SAME fresh deployer account with the SAME nonce (0,1) on every
/// chain so both contracts land at identical addresses everywhere — that is
/// what makes wrapped-token addresses predictable cross-chain.
contract Deploy {
    VmDeploy constant vm = VmDeploy(address(uint160(uint256(keccak256("hevm cheat code")))));

    function run() external returns (address factory, address vault) {
        vm.startBroadcast();
        factory = address(new WrappedTokenFactory());
        vault = address(new HTLCVault());
        vm.stopBroadcast();
    }
}
