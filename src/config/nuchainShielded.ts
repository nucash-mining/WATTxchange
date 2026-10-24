// nuChain private swaps (ShieldedPool) — mainnet nuchain_28277-1, deployed 2026-10-24.
export const SHIELDED = {
  chainId: 28277,
  rpc: 'https://evm-nu.wattxchange.app',
  relayer: (import.meta.env.VITE_ZK_RELAYER as string | undefined) || 'https://zk-nu.wattxchange.app',
  pool: '0x2904cbf7bF9Ec865ee1584c201e3D96a0F7BbbFb',
  pair: '0xC6d720d866Fe74dcd073caeA704d25F638623B9c',
  wnu: '0xb69c77075Ba083a975D52c7759B79926509ee7ee',
  wwtx: '0x65b935838679E2b75231a59F118655ea981e1999',
  deployBlock: 71769,
  relayerFeeBps: 30n,
  // fixed deposit sizes (each size is its own anonymity set)
  sizes: {
    NU: ['1', '10', '100', '1000'],
    wWTX: ['0.1', '1', '10'],
  },
  decimals: { NU: 18, wWTX: 8 },
  wasm: `${import.meta.env.BASE_URL}zk/spend.wasm`,
  zkey: `${import.meta.env.BASE_URL}zk/spend_final.zkey`,
  snarkjs: `${import.meta.env.BASE_URL}zk/snarkjs.min.js`,
} as const;

export const NUCHAIN_ADD_NETWORK = {
  chainId: '0x6e75', // 28277
  chainName: 'nuChain',
  nativeCurrency: { name: 'NU', symbol: 'NU', decimals: 18 },
  rpcUrls: ['https://evm-nu.wattxchange.app'],
  blockExplorerUrls: ['https://nu-exp.wattxchange.app'],
};
