// nuChain omnichain bridge registry (source of truth:
// ~/alt-layerzero-bridge/deployments/{chains,omnichain}.json). nuChain is the hub:
// every other chain connects only to nuChain, over a self-hosted LayerZero V2 mesh
// (eid == chain id). Solana uses a separate gateway + relay.

export const NUCHAIN = {
  name: 'nuChain',
  cosmosChainId: '9001',
  evmChainId: 28277,
  bech32Prefix: 'cosmos', // nu1 prefix is a planned relaunch item
  nativeDenom: 'atest',
  nativeSymbol: 'TEST',
  rpc: 'https://rpc-nu.wattxchange.app',
  rest: 'https://api-nu.wattxchange.app',
  evmRpc: 'https://evm-nu.wattxchange.app',
  explorer: 'https://nu-exp.wattxchange.app',
};

export const HUB = {
  endpoint: '0x53F807E5ff81974642F84A78E725e8cDc756a9CE',
  multisig: '0x0846CfF2F9E9a8AcCe0eB9C1059EDfeB84dE3F97',
  tokens: {
    WTX: '0x37071D5dDA373c018F65123C1D870f30f654D629', // escrow for wWTX
    WATT: '0x980EaB17a6Ce46C0C60fc53b57b96558262a95f2',
    ALT: '0xf1e6a69E57158966b5761808B27BFCde5682901E',
  },
  wWTX: '0x3D641a2791533B4A0000345eA8d509d01E1ec301',
  solanaGateway: '0xc8B21BA219e67966c97F0FDAd602252DAD648770',
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
