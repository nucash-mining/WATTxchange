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
}
export interface Candle { time: number; open: number; high: number; low: number; close: number; volume: number }

export async function fetchMarkets(): Promise<{ markets: Market[]; updatedAt: number }> {
  const res = await fetch(`${MARKETS_API}/markets`, { signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`markets: HTTP ${res.status}`);
  const body = await res.json() as { markets: Market[]; updatedAt: number };
  const markets = body.markets.map((m) => (suspicious(m) ? { ...m, suspect: true } : m));
  return { ...body, markets: [...markets, ...hlPairs(markets)] };
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

/** Candles ending before `before` (unix s); page back with before = oldest candle's time. */
export async function fetchCandles(id: string, tf: string, before = 0): Promise<Candle[]> {
  const res = await fetch(`${MARKETS_API}/candles?id=${encodeURIComponent(id)}&tf=${tf}${before ? `&before=${before}` : ''}`, { signal: AbortSignal.timeout(30_000) });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? `candles: HTTP ${res.status}`);
  return body.candles;
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

export interface Quote { amountOut: bigint; decimalsOut: number; decimalsIn: number; via?: string[] }
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
  if (route.kind === 'agg') {
    const k = await kyberQuote(route.chain.chainId, aggToken(route.chain, tokenIn, useNative), aggToken(route.chain, tokenOut, useNative), raw);
    return { amountOut: k.amountOut, decimalsIn, decimalsOut, via: k.dexes };
  }
  if (route.kind === 'v2') {
    const amounts = await new ethers.Contract(addr(route.router), V2_ROUTER, reader(route.chain)).getAmountsOut(raw, [addr(tokenIn), addr(tokenOut)]);
    return { amountOut: amounts[amounts.length - 1], decimalsIn, decimalsOut };
  }
  const q = new ethers.Contract(addr(route.quoter), V3_QUOTER, reader(route.chain));
  const [out] = await q.quoteExactInputSingle.staticCall({ tokenIn: addr(tokenIn), tokenOut: addr(tokenOut), amountIn: raw, fee: route.fee, sqrtPriceLimitX96: 0 });
  return { amountOut: out, decimalsIn, decimalsOut };
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
  if (route.kind === 'agg') {
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
  onStep('Checking the router on-chain…');
  if (!(await verifyRouter(route, m.pool))) {
    throw new Error(`Safety check failed: this router is not the one for this ${m.venueLabel} pool. Nothing was approved.`);
  }
  onStep(`Connecting to ${route.chain.name}…`);
  const signer = await walletOn(route.chain);
  const me = await signer.getAddress();
  const tokenIn = addr(sell ? m.base.address! : m.quote.address!);
  const tokenOut = addr(sell ? m.quote.address! : m.base.address!);
  const q = await quote(m, route, sell, amountIn);
  const amount = ethers.parseUnits(amountIn, q.decimalsIn);
  const minOut = (q.amountOut * BigInt(10_000 - slippageBps)) / 10_000n;
  const deadline = Math.floor(Date.now() / 1000) + 1200;
  const wrapped = route.chain.wrappedNative.toLowerCase();
  const nativeIn = useNative && !sell && tokenIn.toLowerCase() === wrapped;
  const nativeOut = useNative && sell && tokenOut.toLowerCase() === wrapped;

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
    const path = [tokenIn, tokenOut];
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
