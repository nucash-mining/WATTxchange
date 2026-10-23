// nuChain omnichain bridge registry (source of truth:
// ~/alt-layerzero-bridge/deployments/{chains,omnichain}.json). nuChain is the hub:
// every other chain connects only to nuChain, over a self-hosted LayerZero V2 mesh
// (eid == chain id). Solana uses a separate gateway + relay.

export const NUCHAIN = {
  name: 'nuChain',
  cosmosChainId: 'nuchain_28277-1',
  evmChainId: 28277,
  bech32Prefix: 'nu',
  nativeDenom: 'anu',
  nativeSymbol: 'NU',
  rpc: 'https://rpc-nu.wattxchange.app',
  rest: 'https://api-nu.wattxchange.app',
  evmRpc: 'https://evm-nu.wattxchange.app',
  explorer: 'https://nu-exp.wattxchange.app',
};

export const HUB = {
  endpoint: '0xE2d9d84a4f05aabD057C4a96dF14Df6a8bc56d7A',
  multisig: '0x8f1D4324d4A3a773BAD20Db67c82c8F3b27d93CD',
  tokens: {
    WTX: '0x065d1C37F5CcAb8722ECB8E977F066aA33409Fc6', // escrow for wWTX
    WATT: '0x064bbeFF89c195E7F7c4Afe8432ECd4f505246fe',
    ALT: '0x3a88375d88cA84c50e82665dCe2b18523eCdCAc1',
  },
  wWTX: '0x65b935838679E2b75231a59F118655ea981e1999',
  solanaGateway: '0x60802b643775268FaF1462fE40D1A451b07c6758',
};

// Emission: no pre-mine. 50 NU per block, halving every 210,000 blocks (21M cap),
// minted into the MiningPot and claimed with equihash 144,5 (zhash) work merged-mined
// with BitcoinZ and WATTx (zk-proof mining to follow). Unclaimed rewards roll over.
export const MINING = {
  pot: '0x0000000000000000000000000000000000004E55',
  zhashVerifier: '0x0000000000000000000000000000000000004E56',
  initialReward: 50,
  halvingInterval: 210_000,
  maxSupply: 21_000_000,
};

export type LaneStatus = 'live' | 'pending-connect' | 'pending-deploy' | 'pending-funding';

export interface BridgeChain {
  id: string;
  name: string;
  status: LaneStatus;
  note?: string;
  tokens?: Partial<Record<'WTX' | 'WATT' | 'ALT', string>>;
}

export const BRIDGE_CHAINS: BridgeChain[] = [
  { id: '2330', name: 'Altcoinchain', status: 'pending-connect', note: 'WATT + native ALT home chain',
    tokens: { WATT: '0x8ce709Af081031eA9e3C0E5E59b20E9c4A823894', ALT: '0x435779bFa6959072Ea321f18Fcd2e98F68441294' } },
  { id: '137', name: 'Polygon', status: 'pending-funding', note: 'WATT home chain',
    tokens: { WATT: '0xBE9Fb3ee29C01d604F522765726C5A59573A77e4', ALT: '0x8d4c8180b12c2b43ee63ac5050e8d0acece440ba' } },
  { id: '1', name: 'Ethereum', status: 'pending-deploy' },
  { id: '56', name: 'BNB Chain', status: 'pending-deploy' },
  { id: '42161', name: 'Arbitrum', status: 'pending-deploy' },
  { id: '10', name: 'Optimism', status: 'pending-deploy' },
  { id: '8453', name: 'Base', status: 'pending-deploy' },
  { id: '43114', name: 'Avalanche', status: 'pending-deploy' },
  { id: 'solana', name: 'Solana', status: 'pending-funding', note: 'SPL tokens via nuChain gateway' },
];

export const TOKEN_HOMES: { symbol: 'WTX' | 'WATT' | 'ALT'; home: string }[] = [
  { symbol: 'WTX', home: 'WATTx L1, locked into wWTX on nuChain' },
  { symbol: 'WATT', home: 'Burn-and-mint on Altcoinchain and Polygon' },
  { symbol: 'ALT', home: 'Native ALT lockbox on Altcoinchain' },
];

// Keplr "suggest chain" config (works once rpc-nu / api-nu are publicly routed).
export const KEPLR_CHAIN_INFO = {
  chainId: NUCHAIN.cosmosChainId,
  chainName: 'nuChain',
  rpc: NUCHAIN.rpc,
  rest: NUCHAIN.rest,
  bip44: { coinType: 60 },
  bech32Config: {
    bech32PrefixAccAddr: NUCHAIN.bech32Prefix,
    bech32PrefixAccPub: `${NUCHAIN.bech32Prefix}pub`,
    bech32PrefixValAddr: `${NUCHAIN.bech32Prefix}valoper`,
    bech32PrefixValPub: `${NUCHAIN.bech32Prefix}valoperpub`,
    bech32PrefixConsAddr: `${NUCHAIN.bech32Prefix}valcons`,
    bech32PrefixConsPub: `${NUCHAIN.bech32Prefix}valconspub`,
  },
  currencies: [{ coinDenom: NUCHAIN.nativeSymbol, coinMinimalDenom: NUCHAIN.nativeDenom, coinDecimals: 18 }],
  feeCurrencies: [{
    coinDenom: NUCHAIN.nativeSymbol, coinMinimalDenom: NUCHAIN.nativeDenom, coinDecimals: 18,
    gasPriceStep: { low: 0, average: 0, high: 0.000000001 },
  }],
  stakeCurrency: { coinDenom: NUCHAIN.nativeSymbol, coinMinimalDenom: NUCHAIN.nativeDenom, coinDecimals: 18 },
  features: ['eth-address-gen', 'eth-key-sign'],
};
