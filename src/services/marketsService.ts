// All DEX markets (pools-api aggregator), candles, quotes, and in-app swaps.
//
// Every market trades here, in-app:
//  - v2 / Uniswap v3 pools: straight to the venue's own router. Before any approval the
//    router is checked on-chain against the pool (router.factory() == pool.factory()).
//  - other EVM pools (Uniswap v4, PancakeSwap v3/Infinity, QuickSwap v3/v4, …): KyberSwap
//    aggregator, best route across that chain's DEXs (see aggregators.ts).
//  - Hyperliquid spot/perps: hyperliquid.ts.   - THORChain: aggregators.ts.
import { ethers } from 'ethers';
import { EVM_CHAINS, V2_ROUTERS, UNISWAP_V3, addChainParams, type EvmChain } from '../config/evmChains';
import { kyberSupports, kyberQuote, kyberSwap, NATIVE } from './aggregators';

export const MARKETS_API = 'https://pools-api.wattxchange.app';

export interface MarketToken { symbol: string; address?: string; decimals?: number; name?: string; chain?: string }
export interface Market {
  id: string;
  source: 'own' | 'gecko' | 'hyperliquid' | 'thorchain';
  chain: string;
  chainId: number | null;
  network?: string;
  venue: string;
  family: string;
  version: string;
  venueLabel: string;
  pool: string;
  name: string;
  base: MarketToken;
  quote: MarketToken;
  price: number | null;
  priceUsd: number | null;
  liquidityUsd: number | null;
  volume24hUsd: number | null;
  change24h: number | null;
  fee?: string | null;
  coin?: string;
  quoteCoin?: string;          // Hyperliquid cross pairs: the perp on the short leg
  suspect?: boolean;           // fake-looking volume / dust liquidity: hidden unless asked for
  inverted?: boolean;          // shown flipped vs the pool's own order (candles are inverted to match)
}
export interface Candle { time: number; open: number; high: number; low: number; close: number; volume: number }

export async function fetchMarkets(): Promise<{ markets: Market[]; updatedAt: number }> {
  const res = await fetch(`${MARKETS_API}/markets`, { signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`markets: HTTP ${res.status}`);
  const body = await res.json() as { markets: Market[]; updatedAt: number };
  const markets = body.markets.map((m) => orient(suspicious(m) ? { ...m, suspect: true } : m));
  return { ...body, markets: [...markets, ...hlPairs(markets)] };
}

// What a pair is priced IN: stablecoins first, then each chain's native coin. A pool that
// lists one of these first (e.g. wALT/WATT) is shown the trader's way round (WATT/ALT).
const STABLE = /^(USDC|USDC\.E|USDBC|USDT|USDT0|USD₮0|DAI|USDX|BUSD|USDS|FDUSD|USDE)$/i;
const NATIVE_OF: Record<number, string> = Object.fromEntries(Object.values(EVM_CHAINS).map((c) => [c.chainId, c.wrappedNative.toLowerCase()]));
const quoteRank = (m: Market, t: MarketToken) =>
  STABLE.test(t.symbol) ? 2 : (m.chainId && t.address?.toLowerCase() === NATIVE_OF[m.chainId]) ? 1 : 0;
function orient(m: Market): Market {
  if (m.source !== 'own' && m.source !== 'gecko') return m;
  const chain = m.chainId ? EVM_CHAINS[m.chainId] : undefined;
  const native = (t: MarketToken) => (chain && t.address?.toLowerCase() === chain.wrappedNative.toLowerCase() ? { ...t, symbol: chain.native.symbol } : t);
  if (quoteRank(m, m.base) <= quoteRank(m, m.quote)) return { ...m, base: native(m.base), quote: native(m.quote) };
  const price = m.price ? 1 / m.price : null;
  return {
    ...m, inverted: true, base: native(m.quote), quote: native(m.base), name: `${m.quote.symbol} / ${m.base.symbol}`,
    price, priceUsd: m.priceUsd != null && m.price ? m.priceUsd / m.price : null,
    change24h: m.change24h != null && m.change24h > -100 ? (1 / (1 + m.change24h / 100) - 1) * 100 : m.change24h,
  };
}

/**
 * Drop pools whose numbers can't be real: a -100% day, near-zero liquidity, or 24h volume
 * hundreds of times the pool's liquidity (wash trading). Our own venues and perps
 * (where "liquidity" is open interest) are never dropped.
 */
export function suspicious(m: Market): boolean {
  if (m.source === 'own' || m.family === 'Hyperliquid' || m.family === 'THORChain') return false;
  if (m.change24h != null && m.change24h <= -99) return true;
  const liq = m.liquidityUsd, vol = m.volume24hUsd ?? 0;
  if (liq == null) return false;
  if (liq < 1_000) return true;
  return vol > 25_000 && vol / liq > 60;
}

/** Cross pairs built from two Hyperliquid perps (e.g. XMR/BTC = long XMR, short BTC). */
export const PAIR_QUOTES = ['BTC', 'ETH', 'SOL', 'HYPE'];
function hlPairs(markets: Market[]): Market[] {
  const perps = markets.filter((m) => m.family === 'Hyperliquid' && m.version === 'Perps' && m.price);
  const by = new Map(perps.map((m) => [m.coin ?? m.base.symbol, m]));
  const bases = [...perps].sort((a, b) => (b.volume24hUsd ?? 0) - (a.volume24hUsd ?? 0)).slice(0, 80);
  const out: Market[] = [];
  for (const q of PAIR_QUOTES) {
    const qm = by.get(q); if (!qm?.price) continue;
    for (const b of bases) {
      const coin = b.coin ?? b.base.symbol;
      if (coin === q || !b.price) continue;
      const ch = b.change24h != null && qm.change24h != null ? ((1 + b.change24h / 100) / (1 + qm.change24h / 100) - 1) * 100 : null;
      out.push({
        id: `hlpair:${coin}:${q}`, source: 'hyperliquid', chain: 'Hyperliquid', chainId: null, venue: 'hyperliquid', family: 'Hyperliquid',
        version: 'Pair', venueLabel: 'Hyperliquid Pair (perps)', pool: `${coin}/${q}`, name: `${coin} / ${q}`,
        base: { symbol: coin }, quote: { symbol: q }, price: b.price / qm.price, priceUsd: b.priceUsd ?? b.price,
        liquidityUsd: Math.min(b.liquidityUsd ?? 0, qm.liquidityUsd ?? 0) || null,
        volume24hUsd: Math.min(b.volume24hUsd ?? 0, qm.volume24hUsd ?? 0) || null, change24h: ch, coin, quoteCoin: q,
      });
    }
  }
  return out;
}

/** Candles ending before `before` (unix s); page back with before = oldest candle's time.
 *  `invert` flips them for markets shown the other way round from the pool. */
export async function fetchCandles(id: string, tf: string, before = 0, invert = false): Promise<Candle[]> {
  const res = await fetch(`${MARKETS_API}/candles?id=${encodeURIComponent(id)}&tf=${tf}${before ? `&before=${before}` : ''}`, { signal: AbortSignal.timeout(30_000) });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? `candles: HTTP ${res.status}`);
  const c: Candle[] = body.candles;
  if (!invert) return c;
  const inv = (x: number) => (x > 0 ? 1 / x : 0);
  return c.map((k) => ({ time: k.time, open: inv(k.open), high: inv(k.low), low: inv(k.high), close: inv(k.close), volume: k.volume }));
}

// ----------------------------------------------------------- trade routing ----

export type TradeRoute =
  | { kind: 'v2'; chain: EvmChain; router: string }
  | { kind: 'v3'; chain: EvmChain; router: string; quoter: string; fee: number }
  | { kind: 'agg'; chain: EvmChain }
  | { kind: 'hl'; spot: boolean }
  | { kind: 'hlpair' }
  | { kind: 'thor' }
  | { kind: 'none'; reason: string };

const isEvmAddress = (a?: string) => !!a && /^0x[0-9a-fA-F]{40}$/.test(a);

/** Block-explorer page for an EVM pool (informational only; trading stays in-app). */
export function poolUrl(m: Market): string | null {
  const chain = m.chainId ? EVM_CHAINS[m.chainId] : undefined;
  return chain && isEvmAddress(m.pool) ? `${chain.explorer}/address/${m.pool}` : null;
}

/** Explorer links for every contract behind a market: pool, base token, quote token. */
export function contractLinks(m: Market): { label: string; address: string; url: string }[] {
  const chain = m.chainId ? EVM_CHAINS[m.chainId] : undefined;
  if (!chain) return [];
  const out: { label: string; address: string; url: string }[] = [];
  if (isEvmAddress(m.pool)) out.push({ label: 'Pool', address: m.pool, url: `${chain.explorer}/address/${m.pool}` });
  else if (/^0x[0-9a-fA-F]{64}$/.test(m.pool)) out.push({ label: 'Pool ID', address: m.pool, url: `${chain.explorer}/address/${m.pool}` });
  for (const t of [m.base, m.quote]) if (isEvmAddress(t.address)) out.push({ label: t.symbol, address: t.address!, url: `${chain.explorer}/token/${t.address}` });
  return out;
}

export function routeFor(m: Market): TradeRoute {
  if (m.family === 'Hyperliquid' && m.version === 'Pair') return { kind: 'hlpair' };
  if (m.family === 'Hyperliquid') return { kind: 'hl', spot: m.version === 'Spot' };
  if (m.family === 'THORChain') return { kind: 'thor' };
  const chain = m.chainId ? EVM_CHAINS[m.chainId] : undefined;
  if (!chain || !isEvmAddress(m.base.address) || !isEvmAddress(m.quote.address)) {
    return { kind: 'none', reason: `${m.venueLabel} has no tradable token contracts listed for this pair.` };
  }
  if (m.version === 'v2') {
    const router = V2_ROUTERS[m.family]?.[chain.chainId];
    if (router) return { kind: 'v2', chain, router };
  }
  if (m.family === 'Uniswap' && m.version === 'v3' && UNISWAP_V3[chain.chainId]) {
    const fee = Math.round(Number(m.fee ?? '0.3') * 10_000);
    return { kind: 'v3', chain, ...UNISWAP_V3[chain.chainId], fee };
  }
  if (kyberSupports(chain.chainId)) return { kind: 'agg', chain };
  return { kind: 'none', reason: `No swap route on ${chain.name} for this pool yet.` };
}

const ERC20 = [
  'function decimals() view returns (uint8)', 'function balanceOf(address) view returns (uint256)',
  'function allowance(address,address) view returns (uint256)', 'function approve(address,uint256) returns (bool)',
];
const PAIR = ['function factory() view returns (address)'];
const V2_ROUTER = [
  'function factory() view returns (address)', 'function WETH() view returns (address)',
  'function getAmountsOut(uint256,address[]) view returns (uint256[])',
  'function swapExactTokensForTokensSupportingFeeOnTransferTokens(uint256,uint256,address[],address,uint256)',
  'function swapExactETHForTokensSupportingFeeOnTransferTokens(uint256,address[],address,uint256) payable',
  'function swapExactTokensForETHSupportingFeeOnTransferTokens(uint256,uint256,address[],address,uint256)',
];
const V3_ROUTER = [
  'function factory() view returns (address)',
  'function exactInputSingle((address tokenIn,address tokenOut,uint24 fee,address recipient,uint256 amountIn,uint256 amountOutMinimum,uint160 sqrtPriceLimitX96)) payable returns (uint256)',
];
const V3_QUOTER = ['function quoteExactInputSingle((address tokenIn,address tokenOut,uint256 amountIn,uint24 fee,uint160 sqrtPriceLimitX96)) returns (uint256,uint160,uint32,uint256)'];

const readers = new Map<number, ethers.JsonRpcProvider>();
const reader = (c: EvmChain) => {
  if (!readers.has(c.chainId)) readers.set(c.chainId, new ethers.JsonRpcProvider(c.rpc, c.chainId, { staticNetwork: true }));
  return readers.get(c.chainId)!;
};
const addr = (a: string) => ethers.getAddress(a.toLowerCase());

const decimalsCache = new Map<string, number>();
export async function decimalsOf(c: EvmChain, token: string) {
  const k = `${c.chainId}:${token.toLowerCase()}`;
  if (!decimalsCache.has(k)) decimalsCache.set(k, Number(await new ethers.Contract(addr(token), ERC20, reader(c)).decimals()));
  return decimalsCache.get(k)!;
}

const verified = new Map<string, boolean>();
/** The router really belongs to the pool's own factory. */
async function verifyRouter(route: TradeRoute & { kind: 'v2' | 'v3' }, pool: string) {
  const k = `${route.chain.chainId}:${route.router}:${pool}`;
  if (verified.has(k)) return verified.get(k)!;
  const pv = reader(route.chain);
  const [poolFactory, routerFactory] = await Promise.all([
    new ethers.Contract(addr(pool), PAIR, pv).factory().catch(() => null),
    new ethers.Contract(addr(route.router), V2_ROUTER, pv).factory().catch(() => null),
  ]);
  const ok = Boolean(poolFactory && routerFactory && poolFactory.toLowerCase() === routerFactory.toLowerCase());
  verified.set(k, ok);
  return ok;
}

export interface Quote {
  amountOut: bigint; decimalsOut: number; decimalsIn: number; via?: string[];
  path?: string[];      // v2: the token path that won (direct or through a hop token)
  useAgg?: boolean;     // the KyberSwap aggregator beat every direct/hop route on this chain
}

/** Hop tokens for two-step routes on each chain (wrapped native is always tried too). */
const HOPS: Record<number, string[]> = {
  2330: ['0x6645143e49B3a15d8F205658903a55E520444698', '0xB7635E386283CAE6FB1A710f19CaA8220beF630D', '0x3e6fde898ae42bec26ef8eaf4751f20241a16c44', '0xd350ecd60912913cc15d312ef38adeca909ecdd5'],
  137: ['0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', '0x387693eCEC037C61943404F03c097d2ADA15ae3f'],
  1: ['0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', '0xdAC17F958D2ee523a2206206994597C13D831ec7'],
  56: ['0x55d398326f99059fF775485246999027B3197955', '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d'],
  42161: ['0xaf88d065e77c8cC2239327C5EDb3A432268e5831', '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9'],
  8453: ['0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'],
  10: ['0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85'],
  43114: ['0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E'],
};
const symbolCache = new Map<string, string>();
async function symbolOf(c: EvmChain, t: string) {
  const k = `${c.chainId}:${t.toLowerCase()}`;
  if (!symbolCache.has(k)) {
    const sym = await new ethers.Contract(addr(t), ['function symbol() view returns (string)'], reader(c)).symbol().catch(() => t.slice(0, 6));
    symbolCache.set(k, String(sym));
  }
  return symbolCache.get(k)!;
}
/** Kyber uses 0xEeee… for the native coin. */
const aggToken = (c: EvmChain, t: string, useNative: boolean) => (useNative && t.toLowerCase() === c.wrappedNative.toLowerCase() ? NATIVE : addr(t));

/** sell=true: spend base, receive quote. sell=false: spend quote, receive base. */
export type EvmRoute = TradeRoute & { kind: 'v2' | 'v3' | 'agg' };
export const isEvmRoute = (r: TradeRoute): r is EvmRoute => r.kind === 'v2' || r.kind === 'v3' || r.kind === 'agg';

export async function quote(m: Market, route: TradeRoute, sell: boolean, amountIn: string, useNative = false): Promise<Quote> {
  if (!isEvmRoute(route)) throw new Error('Not an EVM route.');
  const tokenIn = sell ? m.base.address! : m.quote.address!;
  const tokenOut = sell ? m.quote.address! : m.base.address!;
  const [decimalsIn, decimalsOut] = await Promise.all([decimalsOf(route.chain, tokenIn), decimalsOf(route.chain, tokenOut)]);
  const raw = ethers.parseUnits(amountIn || '0', decimalsIn);
  if (raw === 0n) return { amountOut: 0n, decimalsIn, decimalsOut };
  const kyber = kyberSupports(route.chain.chainId)
    ? kyberQuote(route.chain.chainId, aggToken(route.chain, tokenIn, useNative), aggToken(route.chain, tokenOut, useNative), raw).catch(() => null)
    : Promise.resolve(null);
  if (route.kind === 'agg') {
    const k = await kyber;
    if (!k) throw new Error('No route found for this pair.');
    return { amountOut: k.amountOut, decimalsIn, decimalsOut, via: k.dexes, useAgg: true };
  }
  let best: Quote | null = null;
  if (route.kind === 'v2') {
    // best of: the pool directly, or two hops through the chain's main tokens (same router/factory)
    const r = new ethers.Contract(addr(route.router), V2_ROUTER, reader(route.chain));
    const hops = [route.chain.wrappedNative, ...(HOPS[route.chain.chainId] ?? [])]
      .filter((h, i, a) => a.findIndex((x) => x.toLowerCase() === h.toLowerCase()) === i)
      .filter((h) => h.toLowerCase() !== tokenIn.toLowerCase() && h.toLowerCase() !== tokenOut.toLowerCase());
    const paths = [[tokenIn, tokenOut], ...hops.map((h) => [tokenIn, h, tokenOut])].map((p) => p.map(addr));
    const outs = await Promise.all(paths.map((p) => r.getAmountsOut(raw, p).then((a: bigint[]) => a[a.length - 1]).catch(() => 0n)));
    let bi = -1;
    outs.forEach((o, i) => { if (o > 0n && (bi < 0 || o > outs[bi])) bi = i; });
    if (bi >= 0) {
      const path = paths[bi];
      const via = path.length > 2 ? [`${m.venueLabel} via ${await symbolOf(route.chain, path[1])}`] : [m.venueLabel];
      best = { amountOut: outs[bi], decimalsIn, decimalsOut, path, via };
    }
  } else {
    const q = new ethers.Contract(addr(route.quoter), V3_QUOTER, reader(route.chain));
    const out = await q.quoteExactInputSingle.staticCall({ tokenIn: addr(tokenIn), tokenOut: addr(tokenOut), amountIn: raw, fee: route.fee, sqrtPriceLimitX96: 0 })
      .then((r: bigint[]) => r[0]).catch(() => 0n);
    if (out > 0n) best = { amountOut: out, decimalsIn, decimalsOut, via: [m.venueLabel] };
  }
  // the aggregator searches every DEX on the chain; take it when it pays more
  const k = await kyber;
  if (k && (!best || k.amountOut > best.amountOut)) return { amountOut: k.amountOut, decimalsIn, decimalsOut, via: k.dexes, useAgg: true };
  if (!best) throw new Error('No liquidity for this amount.');
  return best;
}

type Eip1193 = { request: (a: { method: string; params?: unknown[] }) => Promise<unknown> };
// Every wallet extension announces itself via EIP-6963; with several installed,
// window.ethereum is just whichever one won the race to claim it.
const announced: { info: { name: string; rdns: string }; provider: Eip1193 }[] = [];
if (typeof window !== 'undefined') {
  window.addEventListener('eip6963:announceProvider', ((e: CustomEvent) => {
    const d = e.detail as { info: { name: string; rdns: string }; provider: Eip1193 };
    if (d?.provider && !announced.some((a) => a.provider === d.provider)) announced.push(d);
  }) as EventListener);
  window.dispatchEvent(new Event('eip6963:requestProvider'));
}
let chosen: Eip1193 | null = null;
const injected = (): Eip1193 | null => chosen ?? (window as unknown as { ethereum?: Eip1193 }).ethereum ?? announced[0]?.provider ?? null;
/** Pick the wallet that is actually connected to this site (falls back to window.ethereum). */
async function activeWallet(): Promise<Eip1193 | null> {
  if (chosen) return chosen;
  const def = (window as unknown as { ethereum?: Eip1193 }).ethereum ?? null;
  const all = [...(def ? [def] : []), ...announced.map((a) => a.provider).filter((p) => p !== def)];
  for (const p of all) {
    try { const a = await p.request({ method: 'eth_accounts' }) as string[]; if (a?.length) { chosen = p; return p; } } catch { /* next */ }
  }
  return def ?? all[0] ?? null;
}
const chainOf = async (eth: Eip1193) => parseInt(String(await eth.request({ method: 'eth_chainId' })), 16);

/** Connect a wallet and put it on `chain` (adding the network if the wallet lacks it). */
/** The connected wallet's current chain (null if no wallet), and a listener for switches. */
export async function walletChainId(): Promise<number | null> {
  const eth = await activeWallet(); if (!eth) return null;
  try { return await chainOf(eth); } catch { return null; }
}
export function onWalletChain(cb: (chainId: number) => void): () => void {
  let off = false; let detach: (() => void) | null = null;
  activeWallet().then((eth) => {
    const e = eth as unknown as { on?: (ev: string, f: (c: string) => void) => void; removeListener?: (ev: string, f: (c: string) => void) => void } | null;
    if (off || !e?.on) return;
    const h = (c: string) => cb(parseInt(c, 16));
    e.on('chainChanged', h);
    detach = () => e.removeListener?.('chainChanged', h);
  });
  return () => { off = true; detach?.(); };
}

/** The wallet account this site is already connected to, without prompting (null if none). */
export async function connectedAccount(): Promise<string | null> {
  const eth = await activeWallet(); if (!eth) return null;
  try { const a = await eth.request({ method: 'eth_accounts' }) as string[]; return a?.[0] ? ethers.getAddress(a[0]) : null; } catch { return null; }
}

export async function walletOn(chain: EvmChain): Promise<ethers.JsonRpcSigner> {
  const eth = await activeWallet();
  if (!eth) throw new Error('No wallet found. Install MetaMask, Rabby or Brave Wallet, or open this page in your wallet app.');
  const accounts = await eth.request({ method: 'eth_requestAccounts' }) as string[];
  if (accounts?.length) chosen = eth;
  if (await chainOf(eth) !== chain.chainId) {
    const hex = `0x${chain.chainId.toString(16)}`;
    try {
      await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: hex }] });
    } catch (err) {
      const code = (err as { code?: number; data?: { originalError?: { code?: number } } })?.code ?? (err as { data?: { originalError?: { code?: number } } })?.data?.originalError?.code;
      if (code === 4001) throw new Error(`Switch to ${chain.name} was cancelled in the wallet.`);
      if (code !== 4902 && !/unrecognized|not added|unknown chain/i.test(String((err as Error)?.message))) throw err;
      await eth.request({ method: 'wallet_addEthereumChain', params: [addChainParams(chain)] });
    }
    // some wallets resolve the switch request a moment before the network actually changes
    for (let i = 0; i < 25 && await chainOf(eth) !== chain.chainId; i++) await new Promise((r) => setTimeout(r, 200));
  }
  const now = await chainOf(eth);
  if (now !== chain.chainId) throw new Error(`Your wallet is still on chain ${now}. Switch it to ${chain.name} (${chain.chainId}) and try again.`);
  // 'any' lets ethers follow the wallet across network switches instead of erroring
  return new ethers.BrowserProvider(eth as ethers.Eip1193Provider, 'any').getSigner();
}

export async function balanceOf(chain: EvmChain, token: string | 'native', owner: string): Promise<bigint> {
  if (token === 'native') return reader(chain).getBalance(owner);
  return new ethers.Contract(addr(token), ERC20, reader(chain)).balanceOf(owner);
}

/**
 * Swap. `useNative` pays (buy) or receives (sell) the chain's native coin when the quote
 * side is the wrapped native token. Returns the transaction hash.
 */
export async function swap(opts: {
  m: Market; route: TradeRoute; sell: boolean; amountIn: string; slippageBps: number; useNative: boolean; onStep: (s: string) => void;
}): Promise<string> {
  const { m, route, sell, amountIn, slippageBps, useNative, onStep } = opts;
  if (!isEvmRoute(route)) throw new Error('Not an EVM route.');
  onStep('Finding the best price…');
  const best = await quote(m, route, sell, amountIn, useNative);
  if (best.useAgg) {
    onStep(`Connecting to ${route.chain.name}…`);
    const signer = await walletOn(route.chain);
    const tokenIn = sell ? m.base.address! : m.quote.address!;
    const tokenOut = sell ? m.quote.address! : m.base.address!;
    const decimalsIn = await decimalsOf(route.chain, tokenIn);
    return kyberSwap({
      chain: route.chain, signer, slippageBps, onStep,
      tokenIn: aggToken(route.chain, tokenIn, useNative), tokenOut: aggToken(route.chain, tokenOut, useNative),
      amountIn: ethers.parseUnits(amountIn, decimalsIn),
    });
  }
  if (route.kind === 'agg') throw new Error('No route found for this pair.');
  onStep('Checking the router on-chain…');
  if (!(await verifyRouter(route, m.pool))) {
    throw new Error(`Safety check failed: this router is not the one for this ${m.venueLabel} pool. Nothing was approved.`);
  }
  onStep(`Connecting to ${route.chain.name}…`);
  const signer = await walletOn(route.chain);
  const me = await signer.getAddress();
  const tokenIn = addr(sell ? m.base.address! : m.quote.address!);
  const tokenOut = addr(sell ? m.quote.address! : m.base.address!);
  const q = best;
  const amount = ethers.parseUnits(amountIn, q.decimalsIn);
  const minOut = (q.amountOut * BigInt(10_000 - slippageBps)) / 10_000n;
  const deadline = Math.floor(Date.now() / 1000) + 1200;
  const wrapped = route.chain.wrappedNative.toLowerCase();
  // pay or receive the chain's native coin whenever that side is its wrapped token
  const nativeIn = useNative && tokenIn.toLowerCase() === wrapped;
  const nativeOut = useNative && tokenOut.toLowerCase() === wrapped && route.kind === 'v2';

  if (!nativeIn) {
    const t = new ethers.Contract(tokenIn, ERC20, signer);
    if ((await t.allowance(me, addr(route.router))) < amount) {
      onStep('Approve the token in your wallet…');
      await (await t.approve(addr(route.router), amount)).wait();
    }
  }
  onStep('Confirm the swap in your wallet…');
  let tx;
  if (route.kind === 'v2') {
    const r = new ethers.Contract(addr(route.router), V2_ROUTER, signer);
    const path = q.path ?? [tokenIn, tokenOut];
    if (nativeIn) tx = await r.swapExactETHForTokensSupportingFeeOnTransferTokens(minOut, path, me, deadline, { value: amount });
    else if (nativeOut) tx = await r.swapExactTokensForETHSupportingFeeOnTransferTokens(amount, minOut, path, me, deadline);
    else tx = await r.swapExactTokensForTokensSupportingFeeOnTransferTokens(amount, minOut, path, me, deadline);
  } else {
    const r = new ethers.Contract(addr(route.router), V3_ROUTER, signer);
    tx = await r.exactInputSingle(
      { tokenIn, tokenOut, fee: route.fee, recipient: me, amountIn: amount, amountOutMinimum: minOut, sqrtPriceLimitX96: 0 },
      nativeIn ? { value: amount } : {},
    );
  }
  onStep('Waiting for confirmation…');
  await tx.wait();
  return tx.hash as string;
}
