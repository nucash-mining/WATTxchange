// Altcoinchain (chainId 2330) — WATTxchange DEX contract deployment.
// Deployed 2026-07-09 from deployer 0x06E09E9929DCa5755AeFdA0e397102840c884B81.
// EVM note: ALT is pre-Shanghai (no PUSH0); contracts compiled with evm_version=paris.

export const ALTCOINCHAIN = {
  chainId: 2330,
  chainIdHex: '0x91a',
  name: 'Altcoinchain',
  nativeCurrency: { name: 'Altcoin', symbol: 'ALT', decimals: 18 },
  // Public read-only RPC via Cloudflare Tunnel (no open home-network ports;
  // admin/personal/miner/debug methods filtered out server-side).
  rpcUrls: ['https://rpc.wattxchange.app'],
  blockExplorerUrls: [] as string[],
} as const;

// Cross-chain / swap / staking contracts (live on ALT 2330).
export const DEX_CONTRACTS = {
  wXMR: '0x871E4aae98B5e2D0C9D188E00d46687d351d9d41',
  MoneroBridge: '0x49315BD860D9A9C8E0484DA3C17fD808A015Ab22',
  CrossChainValidator: '0x2FCf780Da2Bb461E972ad6a0BE13Eaf0605eA06b',
  UTXOSwapHelper: '0x85742BC78c37f7E13b983d7a983Cb4d0a4F95Eed',
  AtomicSwap: '0x28070173D385eDe7F611eDD4F7b4b0d7b532e0b4',
  AtomicSwapOrderBook: '0xFf37414f2921E17C18d7123d03a66e4938c428d5',
  HTLCEscrow: '0x549c59C272AF723F4ad3136c6695cafCa64b67C0',
  AxelarBridge: '0xbB581C94D91f2c863D52d8d51b4f1194d1C49F1F', // dormant (gateway unset)
  WTXStakingPool: '0xd74067fce3276C129e229EaD0A38d5C618cB81FE',
} as const;

// AMM (Uniswap V2 / SwapinDEX) — filled in after the V2 deploy (WALT, Factory, Router).
// NOTE: this is OUR fresh redeploy — zero pairs / zero liquidity so far. Kept for
// future WATTxchange-controlled pairs (we own feeToSetter).
export const AMM_V2 = {
  version: 'v2' as const,
  WALT: '0x344821733702748cf3Fa076477e2C7e406d05ae9', // Wrapped ALT (WETH-equivalent)
  UniswapV2Factory: '0xa572E25e571a1c12b52F21afDE288F1645Ff2350',
  UniswapV2Router02: '0x24992c1d117cc8a40bA14783B840C0d23344987c',
  initCodeHash: '0x41999c61015490867178acc0ed8c63ffbe94e56d642d69384e3da4cfa8989984',
} as const;

// ORIGINAL SwapinDEX deployment (the founder's) — verified live on-chain 2026-07-10:
// the factory holds 24 pairs and the pools below hold real reserves (e.g. WATT/wALT
// ~131k wALT / ~172k WATT). Router.factory() and Router.WETH() bindings verified.
// This is the ACTIVE trading venue until our AMM_V2 pairs are seeded.
export const SWAPIN_LIVE = {
  wALT: '0x48721ADeFE5b97101722c0866c2AffCE797C32b6',
  UniswapV2Factory: '0x347aAc6D939f98854110Ff48dC5B7beB52D86445',
  UniswapV2Router02: '0xae168Ce47cebca9abbC5107a58df0532f1afa4d6',
  multicall: '0x426b13031851947ce04C51670a6E9C622B18aa3C',
} as const;

// ERC-20 tokens on ALT 2330 (WATT verified on-chain: symbol/decimals/supply).
export const ALT_TOKENS = {
  wALT: SWAPIN_LIVE.wALT,
  WATT: '0x6645143e49B3a15d8F205658903a55E520444698',
  AltPEPE: '0xd350ecd60912913cc15d312ef38adeca909ecdd5',
  AltPEPI: '0xbb1f8b3a73a0b5084af9a95e748f9d84ddba6e88',
  SCAM: '0x75b37574c2317ccba905e2c628d949710627c20a',
  SWAPD: '0x67e7ebda5cba73f5830538b03e678a1b45517dd7',
  MALT: '0xaf5d066eb3e4147325d3ed23f94bc925fbf3b9ef',
} as const;
export type AltTokenSymbol = keyof typeof ALT_TOKENS | 'ALT';

// Verified on-chain 2026-07-10 (decimals()): MALT is 9, everything else 18.
export const ALT_TOKEN_DECIMALS: Record<AltTokenSymbol, number> = {
  ALT: 18,
  wALT: 18,
  WATT: 18,
  AltPEPE: 18,
  AltPEPI: 18,
  SCAM: 18,
  SWAPD: 18,
  MALT: 9,
};

// Known original-deployment pair addresses (factory.getPair is the source of
// truth; these just seed the pools list without an extra round-trip each).
export const SWAPIN_POOLS: Record<string, string> = {
  'AltPEPE/AltPEPI': '0x284F01A8AB6542e8E257f289A2c4E851C7ebc82E',
  'AltPEPE/wALT': '0xB1297e255933E6c11bc72D6De2c911e4a05A18d8',
  'SCAM/wALT': '0x4d40fa6da5495f74f61af89008035062a0f66730',
  'SWAPD/wALT': '0x044e22b6276424d0b6e014Fd9E259D03C7b031bb',
  'MALT/wALT': '0xb9707EBc943AD698852dca99dAB8C973e1CD6BD8',
  'WATT/wALT': '0xb2F8e147d6a2570b19d1731401DDD5A4F62e2C33',
  'AltPEPE/WATT': '0xdC1f931aeFba25d1ad442c7235D9AEbAf51C9D01',
};

// UI version selector — v3 slots in after the block-7M Fusaka/PUSH0 upgrade.
export const AMM_VERSIONS = ['v2'] as const;
export type AmmVersion = (typeof AMM_VERSIONS)[number];
