// Every EVM chain the DEX can trade on: wallet network parameters, a public RPC for reads,
// and the swap routers WATTxchange calls directly.
//
// Router addresses are never trusted on their own: before any approval the swap code
// checks on-chain that router.factory() is the factory that created the pool being
// traded. A wrong or stale address here therefore fails safe (no approval is sent).

export interface EvmChain {
  chainId: number;
  name: string;
  slug: string;              // Uniswap/PancakeSwap URL chain name
  rpc: string;
  native: { name: string; symbol: string; decimals: number };
  wrappedNative: string;
  explorer: string;
}

export const EVM_CHAINS: Record<number, EvmChain> = {
  1: { chainId: 1, name: 'Ethereum', slug: 'ethereum', rpc: 'https://ethereum-rpc.publicnode.com', native: { name: 'Ether', symbol: 'ETH', decimals: 18 }, wrappedNative: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', explorer: 'https://etherscan.io' },
  56: { chainId: 56, name: 'BNB Chain', slug: 'bnb', rpc: 'https://bsc-rpc.publicnode.com', native: { name: 'BNB', symbol: 'BNB', decimals: 18 }, wrappedNative: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', explorer: 'https://bscscan.com' },
  137: { chainId: 137, name: 'Polygon', slug: 'polygon', rpc: 'https://polygon-bor-rpc.publicnode.com', native: { name: 'POL', symbol: 'POL', decimals: 18 }, wrappedNative: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', explorer: 'https://polygonscan.com' },
  42161: { chainId: 42161, name: 'Arbitrum', slug: 'arbitrum', rpc: 'https://arbitrum-one-rpc.publicnode.com', native: { name: 'Ether', symbol: 'ETH', decimals: 18 }, wrappedNative: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', explorer: 'https://arbiscan.io' },
  8453: { chainId: 8453, name: 'Base', slug: 'base', rpc: 'https://base-rpc.publicnode.com', native: { name: 'Ether', symbol: 'ETH', decimals: 18 }, wrappedNative: '0x4200000000000000000000000000000000000006', explorer: 'https://basescan.org' },
  10: { chainId: 10, name: 'Optimism', slug: 'optimism', rpc: 'https://optimism-rpc.publicnode.com', native: { name: 'Ether', symbol: 'ETH', decimals: 18 }, wrappedNative: '0x4200000000000000000000000000000000000006', explorer: 'https://optimistic.etherscan.io' },
  43114: { chainId: 43114, name: 'Avalanche', slug: 'avalanche', rpc: 'https://avalanche-c-chain-rpc.publicnode.com', native: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 }, wrappedNative: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7', explorer: 'https://snowtrace.io' },
  146: { chainId: 146, name: 'Sonic', slug: 'sonic', rpc: 'https://rpc.soniclabs.com', native: { name: 'Sonic', symbol: 'S', decimals: 18 }, wrappedNative: '0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38', explorer: 'https://sonicscan.org' },
  2330: { chainId: 2330, name: 'Altcoinchain', slug: 'altcoinchain', rpc: 'https://rpc.wattxchange.app', native: { name: 'Altcoin', symbol: 'ALT', decimals: 18 }, wrappedNative: '0x48721ADeFE5b97101722c0866c2AffCE797C32b6', explorer: 'https://alt-exp.wattxchange.app' },
};

/** Uniswap V2-style routers (swapExactTokensForTokens / ETH variants), by family and chain. */
export const V2_ROUTERS: Record<string, Record<number, string>> = {
  Uniswap: {
    1: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    56: '0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24',
    137: '0xedf6066a2b290c185783862c7f4776a2c8077ad1',
    42161: '0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24',
    8453: '0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24',
    10: '0x4a7b5da61326a6379179b40d00f57e5bbdc962c2',
    43114: '0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24',
  },
  PancakeSwap: {
    56: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
    42161: '0x8cFe327CEc66d1C090Dd72bd0FF11d690C33a2Eb',
    8453: '0x8cFe327CEc66d1C090Dd72bd0FF11d690C33a2Eb',
  },
  QuickSwap: { 137: '0xa5E0829CaCED8fFDD4De3c43696c57F7D7A678ff' },
  SwapinDEX: { 2330: '0xae168Ce47cebca9abbC5107a58df0532f1afa4d6' },
};

/** Uniswap v3 SwapRouter02 + QuoterV2, by chain. */
export const UNISWAP_V3: Record<number, { router: string; quoter: string }> = {
  1: { router: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45', quoter: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e' },
  137: { router: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45', quoter: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e' },
  42161: { router: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45', quoter: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e' },
  10: { router: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45', quoter: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e' },
  8453: { router: '0x2626664c2603336E57B271c5C0b26F421741e481', quoter: '0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a' },
  56: { router: '0xB971eF87ede563556b2ED4b1C0b0019111Dd85d2', quoter: '0x78D78E420Da98ad378D7799bE8f4AF69033EB077' },
  43114: { router: '0xbb00FF08d01D300023C629E8fFfFcb65A5a578cE', quoter: '0xbe0F5544EC67e9B3b2D979aaA43f18Fd87E6257F' },
};

export const addChainParams = (c: EvmChain) => ({
  chainId: `0x${c.chainId.toString(16)}`,
  chainName: c.name,
  nativeCurrency: c.native,
  rpcUrls: [c.rpc],
  blockExplorerUrls: [c.explorer],
});
