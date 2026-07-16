// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {WrappedNative} from "./WrappedNative.sol";
import {WrappedToken} from "./WrappedToken.sol";

/// @title WrappedTokenFactory — deterministic wrapped-coin deployment on every EVM chain
/// @notice One factory, deployed at the same address on every EVM network
///         (Ethereum, BSC, Polygon, ..., Altcoinchain, WATTx) via a
///         deterministic-deployment proxy, mints:
///           * exactly one WrappedNative for the chain's own coin, and
///           * one WrappedToken per underlying ERC-20, at a CREATE2 address
///             derived only from the underlying — so the wrapped address for
///             any coin is knowable on ANY chain before it is deployed.
///         Anyone may call deploy; the factory holds no funds and has no
///         owner. Wrapper metadata is read from the underlying with graceful
///         fallbacks so nonstandard tokens still wrap.
contract WrappedTokenFactory {
    event WrappedNativeDeployed(address wrapper);
    event WrappedTokenDeployed(address indexed underlying, address wrapper);

    error AlreadyDeployed();
    error ZeroAddress();

    address public wrappedNative;
    /// underlying => wrapper
    mapping(address => address) public wrapperOf;

    /// @notice Deploy the chain's canonical native wrapper. `name_`/`symbol_`
    ///         name the chain's coin (e.g. "Wrapped WTX", "wWTX"). Only the
    ///         first deployment succeeds — later calls revert — so the first
    ///         deploy on each chain fixes that chain's canonical wrapper.
    function deployWrappedNative(string calldata name_, string calldata symbol_)
        external
        returns (address wrapper)
    {
        if (wrappedNative != address(0)) revert AlreadyDeployed();
        wrapper = address(new WrappedNative{salt: keccak256("WATTxchange.WrappedNative.v1")}(name_, symbol_));
        wrappedNative = wrapper;
        emit WrappedNativeDeployed(wrapper);
    }

    /// @notice Deploy (or return) the canonical wrapper for `underlying`.
    function deployWrapper(address underlying) external returns (address wrapper) {
        if (underlying == address(0)) revert ZeroAddress();
        wrapper = wrapperOf[underlying];
        if (wrapper != address(0)) return wrapper;

        (string memory uName, string memory uSymbol, uint8 uDecimals) = _metadata(underlying);
        wrapper = address(
            new WrappedToken{salt: _salt(underlying)}(
                underlying,
                string(abi.encodePacked("Wrapped ", uName)),
                string(abi.encodePacked("w", uSymbol)),
                uDecimals
            )
        );
        wrapperOf[underlying] = wrapper;
        emit WrappedTokenDeployed(underlying, wrapper);
    }

    function _salt(address underlying) internal pure returns (bytes32) {
        return keccak256(abi.encode("WATTxchange.WrappedToken.v1", underlying));
    }

    function _metadata(address token)
        internal
        view
        returns (string memory name_, string memory symbol_, uint8 decimals_)
    {
        name_ = _readString(token, abi.encodeWithSignature("name()"), "Token");
        symbol_ = _readString(token, abi.encodeWithSignature("symbol()"), "TOKEN");
        (bool ok, bytes memory data) = token.staticcall(abi.encodeWithSignature("decimals()"));
        decimals_ = (ok && data.length >= 32) ? abi.decode(data, (uint8)) : 18;
    }

    function _readString(address token, bytes memory callData, string memory fallback_)
        internal
        view
        returns (string memory)
    {
        (bool ok, bytes memory data) = token.staticcall(callData);
        if (!ok || data.length == 0) return fallback_;
        // standard string return
        if (data.length >= 64) {
            return abi.decode(data, (string));
        }
        // bytes32-style (MKR-era) metadata
        if (data.length == 32) {
            bytes32 raw = abi.decode(data, (bytes32));
            uint256 len = 0;
            while (len < 32 && raw[len] != 0) len++;
            bytes memory out = new bytes(len);
            for (uint256 i = 0; i < len; i++) out[i] = raw[i];
            return string(out);
        }
        return fallback_;
    }
}
