// Reads AMM pools straight from each chain and performs add/remove liquidity
// through each DEX's own Uniswap V2 router with the user's wallet.
import { ethers } from 'ethers';
import { LP_CHAINS, LP_KNOWN_TOKENS, LP_PRICE_SOURCES, type LpChain, type LpDex } from '../config/liquidityPools';

const FACTORY_ABI = [
  'function allPairsLength() view returns (uint256)',
  'function allPairs(uint256) view returns (address)',
  'function getPair(address,address) view returns (address)',
];
const PAIR_ABI = [
  'function token0() view returns (address)',
  'function token1() view returns (address)',
  'function getReserves() view returns (uint112,uint112,uint32)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
];
const ERC20_ABI = [
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address,address) view returns (uint256)',
  'function approve(address,uint256) returns (bool)',
];
const ROUTER_ABI = [
  'function addLiquidity(address,address,uint256,uint256,uint256,uint256,address,uint256) returns (uint256,uint256,uint256)',
  'function addLiquidityETH(address,uint256,uint256,uint256,address,uint256) payable returns (uint256,uint256,uint256)',
  'function removeLiquidity(address,address,uint256,uint256,uint256,address,uint256) returns (uint256,uint256)',
  'function removeLiquidityETH(address,uint256,uint256,uint256,address,uint256) returns (uint256,uint256)',
];

const ZERO = '0x0000000000000000000000000000000000000000';
/** Checksum-agnostic: ethers rejects a mixed-case address with a bad checksum. */
const addr = (a: string) => ethers.getAddress(a.toLowerCase());

export interface LpToken {
  address: string;
  symbol: string;
  label: string;
  decimals: number;
  priceKey?: string;
}

export interface LpPool {
  chain: LpChain;
  dex: LpDex;
  address: string;
  token0: LpToken;
  token1: LpToken;
  reserve0: bigint;
  reserve1: bigint;
  totalSupply: bigint;
  userLp: bigint;
}

const providers = new Map<number, ethers.JsonRpcProvider>();
export function readProvider(chain: LpChain): ethers.JsonRpcProvider {
  let p = providers.get(chain.chainId);
  if (!p) {
    p = new ethers.JsonRpcProvider(chain.rpc, chain.chainId, { staticNetwork: true, batchMaxCount: 50 });
    providers.set(chain.chainId, p);
  }
  return p;
}

const tokenCache = new Map<string, LpToken>();
async function tokenInfo(chain: LpChain, address: string): Promise<LpToken> {
  const key = `${chain.chainId}:${address.toLowerCase()}`;
  const hit = tokenCache.get(key);
  if (hit) return hit;
  const c = new ethers.Contract(address, ERC20_ABI, readProvider(chain));
  const [symbol, decimals] = await Promise.all([
    c.symbol().catch(() => '???'),
    c.decimals().then(Number).catch(() => 18),
  ]);
  const known = LP_KNOWN_TOKENS[address.toLowerCase()];
  const info: LpToken = { address, symbol, decimals, label: known?.label ?? symbol, priceKey: known?.priceKey };
  tokenCache.set(key, info);
  return info;
}

async function pairAddresses(chain: LpChain, dex: LpDex): Promise<string[]> {
  const factory = new ethers.Contract(addr(dex.factory), FACTORY_ABI, readProvider(chain));
  const found = new Set<string>((dex.pairs ?? []).map(addr));
  if (dex.enumerate) {
    const n = Number(await factory.allPairsLength());
    const all = await Promise.all(Array.from({ length: n }, (_, i) => factory.allPairs(i) as Promise<string>));
    all.forEach((a) => found.add(addr(a)));
  }
  if (dex.probe?.length) {
    const probed = await Promise.all(dex.probe.map(([a, b]) => factory.getPair(addr(a), addr(b)).catch(() => ZERO) as Promise<string>));
    probed.filter((a) => a !== ZERO).forEach((a) => found.add(addr(a)));
  }
  return [...found];
}

async function readPool(chain: LpChain, dex: LpDex, address: string, user: string | null): Promise<LpPool> {
  const pair = new ethers.Contract(address, PAIR_ABI, readProvider(chain));
  const [t0, t1, reserves, totalSupply, userLp] = await Promise.all([
    pair.token0() as Promise<string>,
    pair.token1() as Promise<string>,
    pair.getReserves(),
    pair.totalSupply() as Promise<bigint>,
    user ? (pair.balanceOf(user) as Promise<bigint>).catch(() => 0n) : Promise.resolve(0n),
  ]);
  const [token0, token1] = await Promise.all([tokenInfo(chain, t0), tokenInfo(chain, t1)]);
  return { chain, dex, address, token0, token1, reserve0: reserves[0], reserve1: reserves[1], totalSupply, userLp };
}

export interface ChainLoad {
  chain: LpChain;
  pools: LpPool[];
  error?: string;
}

/** Every pool on one chain. Never throws: a dead RPC reports as `error`. */
export async function loadChainPools(chain: LpChain, user: string | null): Promise<ChainLoad> {
  try {
    const perDex = await Promise.all(chain.dexes.map(async (dex) => {
      const addrs = await pairAddresses(chain, dex);
      return Promise.all(addrs.map((a) => readPool(chain, dex, a, user)));
    }));
    return { chain, pools: perDex.flat() };
  } catch (err) {
    return { chain, pools: [], error: err instanceof Error ? err.message : String(err) };
  }
}

export const loadAllPools = (user: string | null) => Promise.all(LP_CHAINS.map((c) => loadChainPools(c, user)));

// ---------------------------------------------------------------- prices ----

/** USD prices keyed by `priceKey`. Missing sources simply leave gaps. */
export async function loadPrices(): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  const [bridge, stats] = await Promise.all([
    fetch(LP_PRICE_SOURCES.bridge).then((r) => r.json()).catch(() => null),
    fetch(LP_PRICE_SOURCES.stats).then((r) => r.json()).catch(() => null),
  ]);
  for (const k of ['USDC', 'USDT']) {
    const p = stats?.coins?.[k]?.price;
    if (typeof p === 'number') out[k] = p;
  }
  if (bridge?.usd) {
    for (const [k, v] of Object.entries(bridge.usd)) if (typeof v === 'number') out[k] = v;
    const v1 = (bridge.sources?.WATT ?? []).find((s: { src?: string }) => /WATTv1\/WPOL/i.test(s.src ?? ''));
    if (typeof v1?.usd === 'number') out.WATT_V1 = v1.usd;
  }
  return out;
}

export const units = (raw: bigint, decimals: number) => Number(ethers.formatUnits(raw, decimals));

/**
 * USD price per token address, starting from known tokens and then walking
 * pools: a token paired with a priced token gets the price implied by that
 * pool's reserves (deepest pool wins). Implied prices are flagged.
 */
export function priceTokens(pools: LpPool[], feeds: Record<string, number>) {
  const prices = new Map<string, { usd: number; implied: boolean; depthUsd: number }>();
  const key = (p: LpPool, t: LpToken) => `${p.chain.chainId}:${t.address.toLowerCase()}`;
  for (const p of pools) {
    for (const t of [p.token0, p.token1]) {
      const usd = t.priceKey ? feeds[t.priceKey] : undefined;
      if (usd != null) prices.set(key(p, t), { usd, implied: false, depthUsd: Infinity });
    }
  }
  for (let pass = 0; pass < 2; pass++) {
    for (const p of pools) {
      const r0 = units(p.reserve0, p.token0.decimals);
      const r1 = units(p.reserve1, p.token1.decimals);
      if (!(r0 > 0 && r1 > 0)) continue;
      const k0 = key(p, p.token0), k1 = key(p, p.token1);
      const a = prices.get(k0), b = prices.get(k1);
      if (a && (!b || (b.implied && b.depthUsd < r0 * a.usd))) prices.set(k1, { usd: (r0 * a.usd) / r1, implied: true, depthUsd: r0 * a.usd });
      else if (b && (!a || (a.implied && a.depthUsd < r1 * b.usd))) prices.set(k0, { usd: (r1 * b.usd) / r0, implied: true, depthUsd: r1 * b.usd });
    }
  }
  return {
    get: (p: LpPool, t: LpToken) => prices.get(key(p, t)),
    tvl(p: LpPool): number | null {
      const a = prices.get(key(p, p.token0)), b = prices.get(key(p, p.token1));
      const v0 = a ? units(p.reserve0, p.token0.decimals) * a.usd : null;
      const v1 = b ? units(p.reserve1, p.token1.decimals) * b.usd : null;
      if (v0 != null && v1 != null) return v0 + v1;
      if (v0 != null) return v0 * 2;
      if (v1 != null) return v1 * 2;
      return null;
    },
  };
}

// --------------------------------------------------------------- wallet ----

type Eip1193 = { request: (a: { method: string; params?: unknown[] }) => Promise<unknown> };
const injected = (): Eip1193 | null => (window as unknown as { ethereum?: Eip1193 }).ethereum ?? null;

/** Make sure the wallet is on `chain`, adding the network if the wallet lacks it. */
export async function ensureChain(chain: LpChain): Promise<ethers.JsonRpcSigner> {
  const eth = injected();
  if (!eth) throw new Error('No wallet found. Install MetaMask or open this page in your wallet’s browser.');
  await eth.request({ method: 'eth_requestAccounts' });
  const hex = `0x${chain.chainId.toString(16)}`;
  const current = await eth.request({ method: 'eth_chainId' }) as string;
  if (parseInt(current, 16) !== chain.chainId) {
    try {
      await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: hex }] });
    } catch (err) {
      if ((err as { code?: number })?.code !== 4902) throw err;
      await eth.request({ method: 'wallet_addEthereumChain', params: [{ chainId: hex, ...chain.addChain }] });
    }
  }
  const provider = new ethers.BrowserProvider(eth as ethers.Eip1193Provider);
  const net = await provider.getNetwork();
  if (Number(net.chainId) !== chain.chainId) throw new Error(`Switch your wallet to ${chain.name} and try again.`);
  return provider.getSigner();
}

export async function walletBalances(pool: LpPool, user: string) {
  const pv = readProvider(pool.chain);
  const bal = (t: LpToken) => new ethers.Contract(t.address, ERC20_ABI, pv).balanceOf(user) as Promise<bigint>;
  const [b0, b1, native] = await Promise.all([bal(pool.token0), bal(pool.token1), pv.getBalance(user)]);
  return { b0, b1, native };
}

const deadline = () => Math.floor(Date.now() / 1000) + 20 * 60;
const minOut = (v: bigint, slippageBps: number) => (v * BigInt(10_000 - slippageBps)) / 10_000n;

async function approveIfNeeded(signer: ethers.JsonRpcSigner, token: string, spender: string, amount: bigint, onStep: (s: string) => void, label: string) {
  const c = new ethers.Contract(token, ERC20_ABI, signer);
  const owner = await signer.getAddress();
  const allowance: bigint = await c.allowance(owner, spender);
  if (allowance >= amount) return;
  onStep(`Approve ${label} in your wallet…`);
  const tx = await c.approve(spender, amount);
  onStep(`Waiting for ${label} approval to confirm…`);
  await tx.wait();
}

export const wrappedNativeOf = (pool: LpPool) => (pool.dex.wrappedNative ?? pool.chain.wrappedNative).toLowerCase();
const isNative = (pool: LpPool, t: LpToken) => t.address.toLowerCase() === wrappedNativeOf(pool);

/**
 * Add liquidity. If one side is the wrapped native coin and `useNative` is set,
 * that side is paid in the native coin (addLiquidityETH).
 */
export async function addLiquidity(opts: {
  pool: LpPool; amount0: bigint; amount1: bigint; useNative: boolean; slippageBps: number; onStep: (s: string) => void;
}): Promise<string> {
  const { pool, amount0, amount1, useNative, slippageBps, onStep } = opts;
  onStep(`Connecting to ${pool.chain.name}…`);
  const signer = await ensureChain(pool.chain);
  const to = await signer.getAddress();
  const router = new ethers.Contract(addr(pool.dex.router), ROUTER_ABI, signer);
  const nativeSide = useNative ? (isNative(pool, pool.token0) ? 0 : isNative(pool, pool.token1) ? 1 : -1) : -1;

  let tx;
  if (nativeSide >= 0) {
    const token = nativeSide === 0 ? pool.token1 : pool.token0;
    const tokenAmt = nativeSide === 0 ? amount1 : amount0;
    const nativeAmt = nativeSide === 0 ? amount0 : amount1;
    await approveIfNeeded(signer, token.address, addr(pool.dex.router), tokenAmt, onStep, token.label);
    onStep('Confirm adding liquidity in your wallet…');
    tx = await router.addLiquidityETH(token.address, tokenAmt, minOut(tokenAmt, slippageBps), minOut(nativeAmt, slippageBps), to, deadline(), { value: nativeAmt });
  } else {
    await approveIfNeeded(signer, pool.token0.address, addr(pool.dex.router), amount0, onStep, pool.token0.label);
    await approveIfNeeded(signer, pool.token1.address, addr(pool.dex.router), amount1, onStep, pool.token1.label);
    onStep('Confirm adding liquidity in your wallet…');
    tx = await router.addLiquidity(pool.token0.address, pool.token1.address, amount0, amount1, minOut(amount0, slippageBps), minOut(amount1, slippageBps), to, deadline());
  }
  onStep('Waiting for confirmation…');
  await tx.wait();
  return tx.hash as string;
}

/** Remove `lpAmount` of the user's LP tokens. */
export async function removeLiquidity(opts: {
  pool: LpPool; lpAmount: bigint; receiveNative: boolean; slippageBps: number; onStep: (s: string) => void;
}): Promise<string> {
  const { pool, lpAmount, receiveNative, slippageBps, onStep } = opts;
  onStep(`Connecting to ${pool.chain.name}…`);
  const signer = await ensureChain(pool.chain);
  const to = await signer.getAddress();
  const router = new ethers.Contract(addr(pool.dex.router), ROUTER_ABI, signer);
  const out0 = (lpAmount * pool.reserve0) / pool.totalSupply;
  const out1 = (lpAmount * pool.reserve1) / pool.totalSupply;
  await approveIfNeeded(signer, pool.address, addr(pool.dex.router), lpAmount, onStep, 'LP tokens');
  onStep('Confirm removing liquidity in your wallet…');
  const nativeSide = receiveNative ? (isNative(pool, pool.token0) ? 0 : isNative(pool, pool.token1) ? 1 : -1) : -1;
  let tx;
  if (nativeSide >= 0) {
    const token = nativeSide === 0 ? pool.token1 : pool.token0;
    const tokenOut = nativeSide === 0 ? out1 : out0;
    const nativeOut = nativeSide === 0 ? out0 : out1;
    tx = await router.removeLiquidityETH(token.address, lpAmount, minOut(tokenOut, slippageBps), minOut(nativeOut, slippageBps), to, deadline());
  } else {
    tx = await router.removeLiquidity(pool.token0.address, pool.token1.address, lpAmount, minOut(out0, slippageBps), minOut(out1, slippageBps), to, deadline());
  }
  onStep('Waiting for confirmation…');
  await tx.wait();
  return tx.hash as string;
}

export const poolHasNativeSide = (pool: LpPool) => isNative(pool, pool.token0) || isNative(pool, pool.token1);
export const explorerTx = (chain: LpChain, hash: string) => `${chain.explorer}/tx/${hash}`;
export const explorerAddress = (chain: LpChain, addr: string) => `${chain.explorer}/address/${addr}`;

// --------------------------------------------------------------- history ----

export type HistoryRange = '1D' | '7D' | '30D' | '90D';
export const RANGE_SECONDS: Record<HistoryRange, number> = { '1D': 86_400, '7D': 604_800, '30D': 2_592_000, '90D': 7_776_000 };

const historyProviders = new Map<number, ethers.JsonRpcProvider>();
function historyProvider(chain: LpChain) {
  if (!chain.historyRpc) return readProvider(chain);
  let p = historyProviders.get(chain.chainId);
  if (!p) {
    p = new ethers.JsonRpcProvider(chain.historyRpc, chain.chainId, { staticNetwork: true, batchMaxCount: 10 });
    historyProviders.set(chain.chainId, p);
  }
  return p;
}

const SYNC_TOPIC = ethers.id('Sync(uint112,uint112)');
const SWAP_TOPIC = ethers.id('Swap(address,uint256,uint256,uint256,uint256,address)');
const MAX_LOG_REQUESTS = 200;

/** Whether `range` can be charted from swap logs on this chain without hundreds of requests. */
export function rangeSupported(chain: LpChain, range: HistoryRange) {
  if (!chain.logRangeLimit) return true;
  const blocks = RANGE_SECONDS[range] / (chain.chainId === 137 ? 2 : 1);
  return blocks / chain.logRangeLimit <= MAX_LOG_REQUESTS;
}

/** One price change (Sync) with the swap volume that caused it, in token units. */
export interface PoolTick { time: number; reserve0: number; reserve1: number; vol0: number; vol1: number }

/**
 * Every price change in the pool over `range`, from its Sync and Swap logs.
 * `price` is token1 per token0. `open` is the price when the range began.
 */
export async function loadPoolTrades(pool: LpPool, range: HistoryRange): Promise<{ open: { reserve0: number; reserve1: number } | null; ticks: PoolTick[]; from: number; to: number }> {
  const pv = historyProvider(pool.chain);
  const head = await pv.getBlock('latest');
  if (!head) throw new Error('could not read the latest block');
  const probe = await pv.getBlock(Math.max(1, head.number - 10_000));
  const blockTime = probe ? Math.max(0.2, (head.timestamp - probe.timestamp) / (head.number - probe.number)) : 2;
  const fromBlock = Math.max(1, head.number - Math.round(RANGE_SECONDS[range] / blockTime));

  // Block timestamps by interpolating between real anchor blocks: exact enough
  // for candles and avoids one getBlock per trade.
  const anchorsAt = Array.from({ length: 9 }, (_, i) => Math.round(fromBlock + ((head.number - fromBlock) * i) / 8));
  const anchors = (await Promise.all(anchorsAt.map((b) => pv.getBlock(b).catch(() => null))))
    .filter((b): b is ethers.Block => !!b).map((b) => [b.number, b.timestamp] as const);
  const timeOf = (n: number) => {
    for (let i = 1; i < anchors.length; i++) {
      const [b0, t0] = anchors[i - 1], [b1, t1] = anchors[i];
      if (n <= b1) return Math.round(t0 + ((n - b0) * (t1 - t0)) / Math.max(1, b1 - b0));
    }
    return head.timestamp;
  };

  const chunk = pool.chain.logRangeLimit ? pool.chain.logRangeLimit - 1 : head.number - fromBlock;
  const ranges: [number, number][] = [];
  for (let b = fromBlock; b <= head.number; b += chunk + 1) ranges.push([b, Math.min(head.number, b + chunk)]);
  if (ranges.length > MAX_LOG_REQUESTS) throw new Error(`${range} is too long to chart on ${pool.chain.name}; pick a shorter range`);

  const target = addr(pool.address);
  const [logsPerRange, openReserves] = await Promise.all([
    Promise.all(ranges.map(([a, b]) => pv.getLogs({ address: target, topics: [[SYNC_TOPIC, SWAP_TOPIC]], fromBlock: a, toBlock: b }))),
    new ethers.Contract(target, PAIR_ABI, pv).getReserves({ blockTag: fromBlock }).catch(() => null),
  ]);
  const logs = logsPerRange.flat().sort((a, b) => (a.blockNumber - b.blockNumber) || (a.index - b.index));

  const d0 = pool.token0.decimals, d1 = pool.token1.decimals;
  const coder = ethers.AbiCoder.defaultAbiCoder();
  const ticks: PoolTick[] = [];
  let pendingVol0 = 0, pendingVol1 = 0;
  for (const log of logs) {
    if (log.topics[0] === SWAP_TOPIC) {
      // In a V2 swap the Sync comes first, so this volume belongs to the last tick.
      const [a0In, a1In, a0Out, a1Out] = coder.decode(['uint256', 'uint256', 'uint256', 'uint256'], log.data) as unknown as bigint[];
      const v0 = units(a0In + a0Out, d0), v1 = units(a1In + a1Out, d1);
      const last = ticks[ticks.length - 1];
      if (last && last.time === timeOf(log.blockNumber)) { last.vol0 += v0; last.vol1 += v1; } else { pendingVol0 += v0; pendingVol1 += v1; }
      continue;
    }
    const [r0, r1] = coder.decode(['uint112', 'uint112'], log.data) as unknown as bigint[];
    const x0 = units(r0, d0), x1 = units(r1, d1);
    if (!(x0 > 0 && x1 > 0)) continue;
    ticks.push({ time: timeOf(log.blockNumber), reserve0: x0, reserve1: x1, vol0: pendingVol0, vol1: pendingVol1 });
    pendingVol0 = pendingVol1 = 0;
  }
  let open: { reserve0: number; reserve1: number } | null = null;
  if (openReserves) {
    const x0 = units(openReserves[0], d0), x1 = units(openReserves[1], d1);
    if (x0 > 0 && x1 > 0) open = { reserve0: x0, reserve1: x1 };
  }
  return { open, ticks, from: timeOf(fromBlock), to: head.timestamp };
}

/** Full history from the pool-history indexer, or null if it is unreachable / does not know the pool. */
export const POOL_HISTORY_API = 'https://pools-api.wattxchange.app';
export async function loadIndexedHistory(pool: LpPool): Promise<{ ticks: PoolTick[]; complete: boolean } | null> {
  try {
    const res = await fetch(`${POOL_HISTORY_API}/pools/${pool.chain.chainId}/${pool.address.toLowerCase()}`, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) return null;
    const body = await res.json() as { ticks: [number, number, number, number, number][]; complete: boolean };
    return {
      complete: body.complete,
      ticks: body.ticks.map(([time, reserve0, reserve1, vol0, vol1]) => ({ time, reserve0, reserve1, vol0, vol1 })),
    };
  } catch {
    return null;
  }
}
