# In-browser kdf (Komodo DeFi Framework) engine

WATTxchange.app runs the GleecBTC/Komodo **kdf v3.0.0-beta WASM** build directly
in the browser, so atomic swaps are non-custodial — private keys and swap state
never leave the page. This replaces the old design that POSTed to a native kdf
daemon at `http://127.0.0.1:7783` (which only worked if the visitor happened to
run kdf locally).

## Files

- `kdflib.js`, `kdflib_bg.wasm`, `snippets/` — the wasm-pack bundle, straight from
  [GLEECBTC/komodo-defi-framework release v3.0.0-beta](https://github.com/GLEECBTC/komodo-defi-framework/releases/tag/v3.0.0-beta) (`kdf_d56a7bc-wasm.zip`).
- `kdflib.d.ts` — minimal hand-written types (the shipped `.d.ts` contains
  wasm-bindgen test symbols with `::` that are invalid TypeScript).
- `kdfClient.ts` — thin transport: `bootKdf(conf)` → poll to `RpcIsUp`,
  `kdfRpc(payload)`, `kdfVersion()`.

`src/services/mm2Service.ts` routes every RPC through `kdfClient` in the browser
(`useWasm`), or POSTs to a native daemon when `VITE_MM2_NATIVE=true`.

## Verified working (2026-08-08)

Loaded live in the app: the 35 MB wasm instantiates, all 12 WATTxchange coins
(incl. WTX testnet) parse into the engine, and kdf boots through version →
keypair → database init. Two boot requirements were discovered and fixed/handled:

1. **Password policy** — `rpc_password` must have upper/lower/digit/special, 8+
   chars. `generateUserpass()` now produces a compliant secret.
2. **P2P bootstrap** — a browser WASM node **cannot be a seed** (no inbound P2P),
   so it must bootstrap off a reachable seed node. This is the one remaining
   step to a live orderbook (below).

## The one remaining step: run a seed node

kdf's P2P orderbook network only exists if there's a seed node. Stand up **one**
native kdf seed on the WATTxchange node server (legion/Oracle), then point the
browser at it:

1. On the server, run native kdf with:
   ```json
   { "gui":"WATTxchange-seed", "netid":42, "i_am_seed":true,
     "rpc_password":"<strong>", "passphrase":"<seed>",
     "coins":[ ... same coins file ... ] }
   ```
   Expose its libp2p WSS port publicly (Cloudflare tunnel, like the electrum
   relays) as e.g. `wss://kdf-seed.wattxchange.app`.
2. Build the frontend with:
   ```
   VITE_MM2_NETID=42
   VITE_MM2_SEEDNODES=/dns/kdf-seed.wattxchange.app/tcp/443/wss/p2p/<PeerId>
   ```
3. Browsers now bootstrap off the seed, reach `RpcIsUp`, and orderbooks populate
   over the WSS Electrum relays already configured in `nodeEndpoints.ts`.

That same seed node is what makes WATTx-native liquidity (WTX/HTH pairs) possible
— it is your own network, independent of Komodo's shared one.

## Revenue (DONE 2026-08-09 — fee patched to our key)

The taker dex fee (1/777 of volume, ~0.13%) is hardcoded to a pubkey in the kdf
source. Our build patches `DEX_FEE_ADDR_PUBKEY`/`DEX_BURN_ADDR_PUBKEY`
(mm2src/common/common.rs) to the WATTxchange fee key, so every taker fee on our
netid-42 network pays us. Source: `~/Documents/kdf-src` (GLEECBTC kdf
v3.0.0-beta d56a7bc + commit f57562c). Fee privkey: `DEX_FEE_PRIVATE_KEY` in
the repo-root `.env` (git-ignored); per-chain fee addresses:
`~/wattx-kdf-seed/FEE-ADDRESSES.txt`. The wasm bundle here and the seed-node
binary MUST both come from that patched source or fee validation will
disagree between peers. Seed deploy bundle + runbook: `~/wattx-kdf-seed/`.
