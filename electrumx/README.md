# WATTxchange ElectrumX fleet

ElectrumX servers for the WATTxchange UTXO coins. The mm2 (Komodo DeFi
Framework) engine that powers the DeFi Hub's atomic swaps talks to coins over
the **Electrum protocol**, not their native JSON-RPC — so every tradeable UTXO
coin needs an ElectrumX server in front of its full node.

| Coin  | Status        | Electrum endpoint (target)            | Notes |
|-------|---------------|---------------------------------------|-------|
| WTX   | ✅ running    | `electrum.wattxchange.app:50001/50002`| QTUM-electrumx fork (see `../../WATTx/wattx-electrumx-server`) |
| FLOP  | ✅ running    | `flop-electrum.wattxchange.app:50001` | |
| TROLL | ⬜ this repo  | `troll-electrum.wattxchange.app:50011/50012` | standard ElectrumX + custom coin class |
| HTH   | ⬜ this repo  | `hth-electrum.wattxchange.app:50021/50022`   | standard ElectrumX + custom coin class |
| RTM   | ⬜ this repo  | `rtm-electrum.wattxchange.app:50031/50032`   | **Raptoreum fork** (special/DIP2 tx) |
| GHOST | ⬜ this repo  | `ghost-electrum.wattxchange.app:50041/50042` | **Particl fork** (cold-staking/CT outputs) |

## Why four different setups

ElectrumX must deserialize every transaction in every block. TROLL and HTH are
legacy Bitcoin-derived chains, so vanilla ElectrumX + a custom *coin class*
(address bytes + genesis hash) works — those classes live in
[`custom_coins.py`](./custom_coins.py) and are verified from each coin's
`chainparams.cpp`. RTM and GHOST have non-standard transaction formats, so they
need their coin-specific ElectrumX forks (wired in `rtm/` and `ghost/`).

## Prerequisites (per coin, on the Oracle box)

1. **Full node running** with:
   ```
   server=1
   txindex=1
   rpcuser=<user>
   rpcpassword=<pass>
   rpcallowip=172.16.0.0/12      # docker bridge, or this host's subnet
   rpcbind=0.0.0.0               # so the container can reach it
   ```
   Raptoreum additionally: `addressindex=1`, `spentindex=1`.
2. Docker + docker compose.
3. DNS: point `‹coin›-electrum.wattxchange.app` at this server.
4. Firewall: open the host ports in `docker-compose.yml` (50011/12, 50021/22, …).

## 1. Confirm chain params from the live node

For RTM, GHOST (and FLOP) the address bytes in `custom_coins.py` /
`src/config/mm2Coins.ts` are marked **UNVERIFIED**. Confirm them straight from
the running daemon:

```bash
./derive-params.sh <rpcuser> <rpcpass> 127.0.0.1 9998      # RTM example
```

It prints `GENESIS_HASH`, `pubtype`, `p2shtype`, `wiftype`. Plug those into the
coin class (and flip `verified: true` in `mm2Coins.ts`).

## 2. Configure credentials

Edit each `env/‹coin›.env` and set the real `DAEMON_URL`
(`http://user:pass@host.docker.internal:rpcport/`).

## 3. Build + sync (one coin at a time on first run)

```bash
docker compose up -d --build troll-electrumx
docker compose logs -f troll-electrumx     # watch initial index build
```

Initial sync reads the whole chain; let one finish (or settle) before starting
the next so you don't thrash disk I/O. Then bring up the rest:

```bash
docker compose up -d --build hth-electrumx rtm-electrumx ghost-electrumx
```

## 4. Verify it serves

```bash
# Should return a JSON server.version response:
echo '{"id":0,"method":"server.version","params":["t",["1.4","1.4"]]}' \
  | timeout 5 ncat --ssl ‹coin›-electrum.wattxchange.app 50012
```

## 5. Wire into the app

Endpoints are declared in [`../src/config/nodeEndpoints.ts`](../src/config/nodeEndpoints.ts)
and consumed by `src/config/mm2Coins.ts`. Once a coin's ElectrumX is live, set
its `electrum` entry (host:port + protocol) there and the DeFi Hub will offer it
for trading. The mm2 daemon launcher (`scripts/start-mm2.sh`) reads the same
config to build kdf's `coins` file.

## SSL

`entrypoint.sh` auto-generates a self-signed cert on first boot. For clients
that pin/validate, mount a real cert into `/data/ssl/server.{crt,key}` (e.g.
Let's Encrypt for the `*-electrum.wattxchange.app` names) via a volume.
