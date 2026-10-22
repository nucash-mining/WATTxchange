// Liquidity pools across every chain WATTxchange has AMM liquidity on.
//
// Factories marked `enumerate` are listed in full straight from the chain
// (allPairsLength/allPairs), so a pair created tomorrow shows up without a code
// change. Shared factories with thousands of unrelated pairs (QuickSwap) list
// only the pairs named here, plus `probe` pairs that appear once someone seeds them.

export interface LpDex {
  id: string;
  name: string;
  factory: string;
  router: string;
  /** List every pair the factory holds. */
  enumerate: boolean;
  /** Pairs to always show (shared factories). */
  pairs?: string[];
  /** Token pairs to look up with getPair; shown only once the pair exists. */
  probe?: [string, string][];
  /** Swap fee in basis points (informational). */
  feeBps: number;
  /** The router's WETH(), when it differs from the chain's usual wrapped coin. */
  wrappedNative?: string;
  note?: string;
}

export interface LpV3Pool {
  name: string;
  address: string;
  feeBps: number;
  manageUrl: string;
}

export interface LpChain {
  chainId: number;
  name: string;
  rpc: string;
  /** RPC that serves historical state (for charts), if `rpc` does not. */
  historyRpc?: string;
  /** Max blocks per eth_getLogs on `historyRpc`, if the RPC caps it. */
  logRangeLimit?: number;
  nativeSymbol: string;
  wrappedNative: string;
  explorer: string;
  dexes: LpDex[];
  v3Pools?: LpV3Pool[];
  /** wallet_addEthereumChain params, for wallets that do not know the chain yet. */
  addChain: {
    chainName: string;
    nativeCurrency: { name: string; symbol: string; decimals: number };
    rpcUrls: string[];
    blockExplorerUrls: string[];
  };
}

const POLYGON = {
  WPOL: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
  USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
  WATT_V1: '0xE960d5076cd3169C343Ee287A2c3380A222e5839',
  WATT_V2: '0x387693eCEC037C61943404F03c097d2ADA15ae3f',
  ALT_OFT: '0x8d4c8180b12c2b43ee63ac5050e8d0acece440ba',
};

export const LP_CHAINS: LpChain[] = [
  {
    chainId: 2330,
    name: 'Altcoinchain',
    rpc: 'https://rpc.wattxchange.app',
    nativeSymbol: 'ALT',
    wrappedNative: '0x48721ADeFE5b97101722c0866c2AffCE797C32b6',
    explorer: 'https://alt-exp.wattxchange.app',
    dexes: [
      {
        id: 'swapin',
        name: 'SwapinDEX',
        factory: '0x347aAc6D939f98854110Ff48dC5B7beB52D86445',
        router: '0xae168Ce47cebca9abbC5107a58df0532f1afa4d6',
        enumerate: true,
        feeBps: 30,
      },
      {
        id: 'wattxchange-amm',
        name: 'WATTxchange AMM',
        factory: '0xa572E25e571a1c12b52F21afDE288F1645Ff2350',
        router: '0x24992c1d117cc8a40bA14783B840C0d23344987c',
        enumerate: true,
        feeBps: 30,
        wrappedNative: '0x344821733702748cf3Fa076477e2C7e406d05ae9', // this router's own WALT
        note: 'WATTxchange-owned Uniswap V2 deployment. No pairs seeded yet.',
      },
    ],
    addChain: {
      chainName: 'Altcoinchain',
      nativeCurrency: { name: 'Altcoin', symbol: 'ALT', decimals: 18 },
      rpcUrls: ['https://rpc.wattxchange.app'],
      blockExplorerUrls: ['https://alt-exp.wattxchange.app'],
    },
  },
  {
    chainId: 137,
    name: 'Polygon',
    rpc: 'https://polygon-bor-rpc.publicnode.com',
    // publicnode refuses historical calls without a token; Tenderly's public
    // gateway serves archive state and multi-million-block log ranges.
    historyRpc: 'https://polygon.gateway.tenderly.co',
    logRangeLimit: 2_000_000,
    nativeSymbol: 'POL',
    wrappedNative: POLYGON.WPOL,
    explorer: 'https://polygonscan.com',
    dexes: [
      {
        id: 'quickswap',
        name: 'QuickSwap',
        factory: '0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32',
        router: '0xa5E0829CaCED8fFDD4De3c43696c57F7D7A678ff',
        enumerate: false,
        pairs: [
          '0x823a6484055282395752fc1deF0F83f14d55B0eE', // WATT v2 / WPOL
          '0xEC54584a6DA0c4E4d8029F47Da4D361CC2279Bef', // WATT v1 / WPOL
        ],
        probe: [
          [POLYGON.ALT_OFT, POLYGON.WPOL],
          [POLYGON.ALT_OFT, POLYGON.USDC],
          [POLYGON.ALT_OFT, POLYGON.WATT_V2],
          [POLYGON.WATT_V2, POLYGON.USDC],
        ],
        feeBps: 30,
      },
    ],
    v3Pools: [
      {
        name: 'WATT v1 / WPOL 0.3%',
        address: '0x3cBdD5CD48de0a0e61378A421BA7F9F15720e32E',
        feeBps: 30,
        manageUrl: 'https://app.uniswap.org/positions?chain=polygon',
      },
    ],
    addChain: {
      chainName: 'Polygon',
      nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
      rpcUrls: ['https://polygon-bor-rpc.publicnode.com'],
      blockExplorerUrls: ['https://polygonscan.com'],
    },
  },
];

/** Chains we checked that have no AMM yet, shown so their absence is explicit. */
export const LP_CHAINS_WITHOUT_AMM = [
  { name: 'WATTx', note: 'No AMM is deployed on the WATTx EVM yet. WTX trades through the WATT⇄WTX desk and atomic swaps.' },
];

/**
 * Display names and USD price keys for tokens we know, by lowercase address.
 * Only these are priced from the price feeds: pricing by symbol would let any
 * token that calls itself "USDC" be worth a dollar.
 */
export const LP_KNOWN_TOKENS: Record<string, { label: string; priceKey?: string }> = {
  // Altcoinchain
  '0x48721adefe5b97101722c0866c2affce797c32b6': { label: 'wALT', priceKey: 'ALT' },
  '0x6645143e49b3a15d8f205658903a55e520444698': { label: 'WATT v1', priceKey: 'WATT_V1' },
  '0xb7635e386283cae6fb1a710f19caa8220bef630d': { label: 'WATT v2', priceKey: 'WATT' },
  '0xd350ecd60912913cc15d312ef38adeca909ecdd5': { label: 'AltPepe' },
  // Polygon
  [POLYGON.WPOL.toLowerCase()]: { label: 'WPOL', priceKey: 'POL' },
  [POLYGON.USDC.toLowerCase()]: { label: 'USDC.e', priceKey: 'USDC' },
  [POLYGON.WATT_V1.toLowerCase()]: { label: 'WATT v1', priceKey: 'WATT_V1' },
  [POLYGON.WATT_V2.toLowerCase()]: { label: 'WATT v2', priceKey: 'WATT' },
  [POLYGON.ALT_OFT.toLowerCase()]: { label: 'ALT', priceKey: 'ALT' },
};

/** On-chain USD prices (bridge aggregator) and the market feed for stablecoins. */
export const LP_PRICE_SOURCES = {
  bridge: 'https://bridge.wattxchange.app/api/prices',
  stats: 'https://stats.wattxchange.app:3345/api/prices',
};
