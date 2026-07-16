# WATTxchange bridge contracts

Trust-minimized wrapped coins + cross-chain atomic-swap bridge. Built to have
**no privileged party at all**: no owner, no admin mint, no upgradability, no
oracle, no validator set. The attack surface is exactly the lock/claim/refund
and wrap/unwrap code paths, all covered by tests.

## Contracts

| Contract | Purpose |
|---|---|
| `WrappedNative.sol` | WETH9-style wrapper for each chain's native coin (wALT, wWTX, wETH, …). Supply == native collateral held, always. |
| `WrappedToken.sol` | 1:1 collateral-backed wrapper for any ERC-20. Mints only the balance-delta actually received (fee-on-transfer safe). |
| `WrappedTokenFactory.sol` | Deploys the above deterministically (CREATE2) so every coin's wrapped address is knowable on every EVM chain, including WATTx. Anyone may deploy; factory holds no funds. |
| `HTLCVault.sol` | The bridge. SHA-256 hashlocked, timelocked vault; a cross-chain transfer is two locks under one hashlock — claim one side and the revealed preimage unlocks the other. SHA-256 (not keccak) so the identical hashlock works in Bitcoin-script HTLCs and the Solana HTLC program (`src/solana/` in the app). |

## Why this design can't be rugged

- Wrapped supply is created only by depositing collateral into the same
  contract that redeems it; there is no mint function for anyone to abuse.
- Bridge funds move only (a) to the named recipient with the preimage before
  the timeout, or (b) back to the sender after it. No third path exists.
- Nothing is upgradeable and nothing has an owner, so no key compromise or
  malicious upgrade can change the rules.
- Fee-on-transfer / non-standard (USDT-style) tokens are handled by
  balance-delta accounting and raw-call return checks, so accounting can't be
  poisoned by weird tokens.

Honest caveat: "unhackable" does not exist. This is the trust-minimized end of
the design space (the same model as Bitcoin atomic swaps), and the residual
risks are protocol-level: users must claim before their timelock expires
(watchtower/UI responsibility), and both legs must use sane timeouts
(initiator's longer than responder's). Get an external audit before mainnet
liquidity.

## Build / test

```sh
~/.foundry/bin/forge test   # 32 tests
```

`evm_version = paris` — ALT (2330) and WATTx are pre-Shanghai (no PUSH0), and
identical bytecode everywhere keeps CREATE2 addresses identical everywhere.

## Deploy (per chain, same fresh deployer, nonces 0/1)

```sh
~/.foundry/bin/forge script script/Deploy.s.sol \
  --rpc-url https://rpc.wattxchange.app --broadcast \
  --private-key $DEPLOYER_KEY --legacy
```

Then fill the per-chain addresses into `src/config/bridgeContracts.ts`.
