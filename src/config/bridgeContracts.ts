// WATTxchange trust-minimized bridge — per-chain deployment addresses.
// Contracts live in contracts/src (WrappedTokenFactory + HTLCVault); deploy
// with contracts/script/Deploy.s.sol using the same fresh deployer account
// (nonces 0/1) on every chain so the addresses match everywhere.
//
// null = not deployed on that chain yet. The UI must treat a null vault as
// "bridge unavailable" for that chain, never fall back to a custodial path.

export interface BridgeDeployment {
  chainId: number;
  name: string;
  rpcUrl: string;
  nativeSymbol: string;
  factory: string | null;   // WrappedTokenFactory
  vault: string | null;     // HTLCVault
}

export const BRIDGE_DEPLOYMENTS: BridgeDeployment[] = [
  // Deployed 2026-07-17 by bridge deployer 0xE731A3d4D7C5cb642B5041392a4Eb6E966Dba11a (nonces 0/1).
  { chainId: 2330, name: 'Altcoinchain', rpcUrl: 'https://rpc.wattxchange.app', nativeSymbol: 'ALT', factory: '0x80938eB385FA99861B56aE447E5a611A88700eE3', vault: '0x54117CAd2835B3D5B499f3acA03B1Ff643Af1955' },
  // WATTx EVM chainId matches its AuxPoW chain_id (22356) — verify against the
  // node's eth_chainId before deploying.
  { chainId: 22356, name: 'WATTx', rpcUrl: 'http://127.0.0.1:13889', nativeSymbol: 'WTX', factory: null, vault: null },
  { chainId: 1, name: 'Ethereum', rpcUrl: 'https://ethereum.publicnode.com', nativeSymbol: 'ETH', factory: null, vault: null },
  { chainId: 56, name: 'BSC', rpcUrl: 'https://bsc-dataseed.binance.org', nativeSymbol: 'BNB', factory: null, vault: null },
  // Deployed 2026-08-09 by the same deployer (nonces 0/1) — addresses match ALT.
  { chainId: 137, name: 'Polygon', rpcUrl: 'https://polygon-bor-rpc.publicnode.com', nativeSymbol: 'POL', factory: '0x80938eB385FA99861B56aE447E5a611A88700eE3', vault: '0x54117CAd2835B3D5B499f3acA03B1Ff643Af1955' },
  { chainId: 250, name: 'Fantom', rpcUrl: 'https://rpc.ftm.tools', nativeSymbol: 'FTM', factory: null, vault: null },
  { chainId: 43114, name: 'Avalanche', rpcUrl: 'https://api.avax.network/ext/bc/C/rpc', nativeSymbol: 'AVAX', factory: null, vault: null },
  { chainId: 42161, name: 'Arbitrum', rpcUrl: 'https://arb1.arbitrum.io/rpc', nativeSymbol: 'ETH', factory: null, vault: null },
  { chainId: 10, name: 'Optimism', rpcUrl: 'https://mainnet.optimism.io', nativeSymbol: 'ETH', factory: null, vault: null },
  { chainId: 8453, name: 'Base', rpcUrl: 'https://mainnet.base.org', nativeSymbol: 'ETH', factory: null, vault: null },
  { chainId: 800001, name: 'OctaSpace', rpcUrl: 'https://rpc.octa.space', nativeSymbol: 'OCTA', factory: null, vault: null },
  { chainId: 1987, name: 'EGEM', rpcUrl: 'https://jsonrpc.egem.io/custom', nativeSymbol: 'EGEM', factory: null, vault: null },
  { chainId: 2000, name: 'DOGEchain', rpcUrl: 'https://rpc.dogechain.dog', nativeSymbol: 'WDOGE', factory: null, vault: null },
  { chainId: 7070, name: 'PlanQ', rpcUrl: 'https://evm-rpc.planq.network', nativeSymbol: 'PLQ', factory: null, vault: null },
  { chainId: 1234, name: 'EGAZ', rpcUrl: 'https://mainnet.egaz.co', nativeSymbol: 'EGAZ', factory: null, vault: null },
  { chainId: 1773, name: 'PartyChain', rpcUrl: 'https://rpc.partychain.io', nativeSymbol: 'GRAMS', factory: null, vault: null },
  { chainId: 1313114, name: 'ETHO', rpcUrl: 'https://rpc.ethoprotocol.com', nativeSymbol: 'ETHO', factory: null, vault: null },
];

export function bridgeDeployment(chainId: number): BridgeDeployment | null {
  return BRIDGE_DEPLOYMENTS.find((d) => d.chainId === chainId) ?? null;
}

export const HTLC_VAULT_ABI = [
  'function lock(address recipient, bytes32 hashlock, uint256 timeout, address asset, uint256 value, uint256 nonce) payable returns (bytes32)',
  'function claim(bytes32 id, bytes32 preimage)',
  'function refund(bytes32 id)',
  'function stageOf(bytes32) view returns (uint8)',
  'function preimages(bytes32) view returns (bytes32)',
  'function getLock(bytes32) view returns (tuple(address sender, address recipient, bytes32 hashlock, uint256 timeout, address asset, uint256 value))',
  'function swapID(address sender, address recipient, bytes32 hashlock, uint256 timeout, address asset, uint256 value, uint256 nonce) view returns (bytes32)',
  'event Locked(bytes32 indexed swapID, address indexed sender, address indexed recipient, bytes32 hashlock, uint256 timeout, address asset, uint256 value)',
  'event Claimed(bytes32 indexed swapID, bytes32 preimage)',
  'event Refunded(bytes32 indexed swapID)',
];

export const WRAPPED_FACTORY_ABI = [
  'function wrappedNative() view returns (address)',
  'function wrapperOf(address underlying) view returns (address)',
  'function deployWrappedNative(string name_, string symbol_) returns (address)',
  'function deployWrapper(address underlying) returns (address)',
  'event WrappedNativeDeployed(address wrapper)',
  'event WrappedTokenDeployed(address indexed underlying, address wrapper)',
];

export const WRAPPED_TOKEN_ABI = [
  'function wrap(uint256 value) returns (uint256)',
  'function unwrap(uint256 value)',
  'function underlying() view returns (address)',
  'function balanceOf(address) view returns (uint256)',
  'function approve(address spender, uint256 value) returns (bool)',
  'function totalSupply() view returns (uint256)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
];
