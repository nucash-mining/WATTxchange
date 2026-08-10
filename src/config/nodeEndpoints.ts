/**
 * nodeEndpoints.ts — Central registry of WATTxchange full-node infrastructure.
 *
 * All coins are run as full nodes on the WATTxchange Oracle Cloud server.
 * This is the single source of truth for "node-to-node" connectivity: native
 * RPC, ElectrumX, websocket and explorer endpoints per coin. mm2/kdf, the
 * rpcNodeService, and the DeFi Hub all resolve hosts through here.
 *
 * Every value is overridable at build time via Vite env vars
 * (VITE_<SYMBOL>_RPC, VITE_<SYMBOL>_ELECTRUM, ...) so deployments can point at
 * a different server without code changes. Defaults below were sourced from the
 * live WATTxchange node configs (Oracle host 129.80.40.193 + *.wattxchange.app).
 */

/** Oracle Cloud host running the WATTxchange full-node fleet. */
export const ORACLE_HOST =
  import.meta.env?.VITE_ORACLE_HOST || '129.80.40.193';

export type CoinProtocol = 'UTXO' | 'QTUM' | 'ETH' | 'ERC20' | 'XMR';

export interface ElectrumEndpoint {
  url: string;
  protocol: 'TCP' | 'SSL' | 'WSS';
}

export interface NodeEndpoint {
  /** Ticker as used across the app (matches rpcNodeService symbols). */
  symbol: string;
  /** Human-readable coin name. */
  name: string;
  /** Family of the chain — drives how mm2 and the wallet talk to it. */
  protocol: CoinProtocol;
  /** Native daemon JSON-RPC endpoint (host:port) — the actual full node. */
  nativeRpc?: string;
  /** ElectrumX servers (preferred transport for mm2 UTXO swaps). */
  electrum?: ElectrumEndpoint[];
  /**
   * Whether an ElectrumX server is actually live for this coin. UTXO coins are
   * only tradeable on the mm2 DeFi Hub when this is true. Coins listed here with
   * `electrumReady: false` have their endpoint reserved but still need the
   * server stood up — see electrumx/README.md.
   */
  electrumReady?: boolean;
  /** EVM JSON-RPC (for ETH/ERC20-family chains such as Altcoinchain). */
  evmRpc?: string;
  /** EVM websocket RPC. */
  evmWs?: string;
  /** Block explorer base URL. */
  explorer?: string;
  /** True when the live infrastructure for this coin runs a TESTNET chain. */
  testnet?: boolean;
}

const importMetaEnv: Record<string, string | undefined> = import.meta.env || {};

const env = (key: string): string | undefined => importMetaEnv[key];

/**
 * Per-coin endpoint defaults, sourced from the live WATTxchange node fleet.
 * Override any field with VITE_<SYMBOL>_<FIELD> at build time.
 */
export const NODE_ENDPOINTS: Record<string, NodeEndpoint> = {
  WTX: {
    symbol: 'WTX',
    name: 'WATTx',
    protocol: 'QTUM',
    // WATTx MAINNET (genesis 0000b7a5960e…, verified against wattxd). Address
    // bytes in mm2Coins.data.json are mainnet (pubtype 73 / p2sh 75 / wif 128).
    nativeRpc: env('VITE_WTX_RPC') || `${ORACLE_HOST}:3889`,
    // Live mainnet wattx-electrumx (Qtum ElectrumX 1.16.0), WSS via Cloudflare tunnel.
    electrum: [
      { url: env('VITE_WTX_ELECTRUM_WSS') || 'electrum-wtx.wattxchange.app:443', protocol: 'WSS' }
    ],
    electrumReady: true,
    explorer: env('VITE_WTX_EXPLORER') || 'https://wtx-explorer.wattxchange.app'
  },
  RTM: {
    symbol: 'RTM',
    name: 'Raptoreum',
    protocol: 'UTXO',
    nativeRpc: env('VITE_RTM_RPC') || `${ORACLE_HOST}:9998`,
    // ElectrumX target — stand up via electrumx/ (Raptoreum fork) then flip ready.
    electrum: [{ url: env('VITE_RTM_ELECTRUM') || 'rtm-electrum.wattxchange.app:50032', protocol: 'SSL' }],
    electrumReady: false,
    explorer: env('VITE_RTM_EXPLORER') || 'https://explorer.raptoreum.com'
  },
  GHOST: {
    symbol: 'GHOST',
    name: 'Ghost',
    protocol: 'UTXO',
    nativeRpc: env('VITE_GHOST_RPC') || `${ORACLE_HOST}:51725`,
    electrum: [{ url: env('VITE_GHOST_ELECTRUM') || 'ghost-electrum.wattxchange.app:50042', protocol: 'SSL' }],
    electrumReady: false,
    explorer: env('VITE_GHOST_EXPLORER') || 'https://explorer.ghostbyjohnmcafee.com'
  },
  TROLL: {
    symbol: 'TROLL',
    name: 'Trollcoin',
    protocol: 'UTXO',
    nativeRpc: env('VITE_TROLL_RPC') || `${ORACLE_HOST}:9666`,
    electrum: [{ url: env('VITE_TROLL_ELECTRUM') || 'troll-electrum.wattxchange.app:50012', protocol: 'SSL' }],
    electrumReady: false,
  },
  HTH: {
    symbol: 'HTH',
    name: 'Help The Homeless Coin',
    protocol: 'UTXO',
    nativeRpc: env('VITE_HTH_RPC') || `${ORACLE_HOST}:13777`,
    // Live hth-electrumx on the WATTxchange node server: WSS via Cloudflare
    // tunnel (browser) + public SSL via the Oracle relay (mm2 native).
    electrum: [
      { url: env('VITE_HTH_ELECTRUM_WSS') || 'electrum-hth.wattxchange.app:443', protocol: 'WSS' },
      { url: env('VITE_HTH_ELECTRUM') || 'electrumx.hth.foundation:50002', protocol: 'SSL' }
    ],
    electrumReady: true,
    explorer: env('VITE_HTH_EXPLORER') || 'https://hth-explorer.wattxchange.app'
  },
  FLOP: {
    symbol: 'FLOP',
    name: 'Flopcoin',
    protocol: 'UTXO',
    nativeRpc: env('VITE_FLOP_RPC') || `${ORACLE_HOST}:32552`,
    electrum: [
      { url: env('VITE_FLOP_ELECTRUM') || 'flop-electrum.wattxchange.app:50001', protocol: 'TCP' }
    ],
    electrumReady: true,
    explorer: env('VITE_FLOP_EXPLORER') || 'https://flop-explorer.wattxchange.app'
  },
  BITN: {
    symbol: 'BITN',
    name: 'Bitnet',
    protocol: 'QTUM',
    // Live bitnet-electrumx (qtum-electrumx fork) on the WATTxchange node server.
    electrum: [
      { url: env('VITE_BITN_ELECTRUM_WSS') || 'electrum-bitn.wattxchange.app:443', protocol: 'WSS' }
    ],
    electrumReady: true
  },
  BTCZ: {
    symbol: 'BTCZ',
    name: 'BitcoinZ',
    protocol: 'UTXO',
    // Live btcz-electrumx on the WATTxchange node server.
    electrum: [
      { url: env('VITE_BTCZ_ELECTRUM_WSS') || 'electrum-btcz.wattxchange.app:443', protocol: 'WSS' }
    ],
    electrumReady: true,
    explorer: env('VITE_BTCZ_EXPLORER') || 'https://explorer.btcz.rocks'
  },
  XMR: {
    symbol: 'XMR',
    name: 'Monero',
    protocol: 'XMR',
    // monerod restricted RPC on the WATTxchange node server (HTTPS via tunnel).
    // Monero has no ElectrumX — wallets talk to this restricted daemon RPC.
    nativeRpc: env('VITE_XMR_RPC') || 'https://xmr.wattxchange.app',
    explorer: env('VITE_XMR_EXPLORER') || 'https://xmrchain.net'
  },
  ALT: {
    symbol: 'ALT',
    name: 'Altcoinchain',
    protocol: 'ETH',
    evmRpc: env('VITE_ALT_RPC') || 'https://rpc.wattxchange.app',
    evmWs: env('VITE_ALT_WS') || 'wss://alt-ws.wattxchange.app',
    explorer: env('VITE_ALT_EXPLORER') || 'https://alt-explorer.wattxchange.app'
  },

  // Major reference coins — public Electrum infrastructure by default.
  BTC: {
    symbol: 'BTC',
    name: 'Bitcoin',
    protocol: 'UTXO',
    electrum: [
      { url: 'electrum.blockstream.info:50002', protocol: 'SSL' },
      { url: 'electrum3.bluewallet.io:50002', protocol: 'SSL' }
    ],
    electrumReady: true,
    explorer: 'https://blockstream.info'
  },
  LTC: {
    symbol: 'LTC',
    name: 'Litecoin',
    protocol: 'UTXO',
    // Own ltc-electrumx (WSS via tunnel; daemon may lag while initial sync
    // completes) with public Electrum infrastructure as fallback.
    electrum: [
      { url: env('VITE_LTC_ELECTRUM_WSS') || 'electrum-ltc.wattxchange.app:443', protocol: 'WSS' },
      { url: 'electrum-ltc.bysh.me:50002', protocol: 'SSL' }
    ],
    electrumReady: true,
    explorer: 'https://litecoinspace.org'
  },
  DOGE: {
    symbol: 'DOGE',
    name: 'Dogecoin',
    protocol: 'UTXO',
    electrum: [{ url: 'electrum1.cipig.net:10060', protocol: 'TCP' }],
    electrumReady: true,
    explorer: 'https://dogechain.info'
  }
};

/** Resolve a coin's endpoint record (case-insensitive). */
export function getEndpoint(symbol: string): NodeEndpoint | undefined {
  return NODE_ENDPOINTS[symbol.toUpperCase()];
}

/** Coins that have an ElectrumX endpoint declared (may not be live yet). */
export function coinsWithElectrum(): string[] {
  return Object.values(NODE_ENDPOINTS)
    .filter((e) => e.electrum && e.electrum.length > 0)
    .map((e) => e.symbol);
}

/**
 * Coins actually tradeable on the mm2 DeFi Hub right now: EVM coins, plus UTXO
 * coins whose ElectrumX server is live (`electrumReady`).
 */
export function tradeableCoins(): string[] {
  return Object.values(NODE_ENDPOINTS)
    .filter((e) => e.protocol === 'ETH' || e.protocol === 'ERC20' || e.electrumReady)
    .map((e) => e.symbol);
}

/** UTXO coins whose ElectrumX still needs standing up (see electrumx/README.md). */
export function pendingElectrumCoins(): string[] {
  return Object.values(NODE_ENDPOINTS)
    .filter(
      (e) =>
        e.protocol !== 'ETH' &&
        e.protocol !== 'ERC20' &&
        e.protocol !== 'XMR' && // Monero has no ElectrumX by design
        !e.electrumReady
    )
    .map((e) => e.symbol);
}
