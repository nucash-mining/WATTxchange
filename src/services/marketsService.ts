// All DEX markets (pools-api aggregator), candles, quotes, and in-app swaps.
//
// Swaps are sent straight to the venue's own router from the user's wallet. Before any
// approval the router is checked on-chain against the pool: router.factory() must be the
// factory that deployed the pool. If it is not, nothing is approved and the user is sent
// to the venue's own app instead.
import { ethers } from 'ethers';
import { EVM_CHAINS, V2_ROUTERS, UNISWAP_V3, addChainParams, type EvmChain } from '../config/evmChains';

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
}
export interface Candle { time: number; open: number; high: number; low: number; close: number; volume: number }

export async function fetchMarkets(): Promise<{ markets: Market[]; updatedAt: number }> {
  const res = await fetch(`${MARKETS_API}/markets`, { signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`markets: HTTP ${res.status}`);
  return res.json();
}

export async function fetchCandles(id: string, tf: string): Promise<Candle[]> {
  const res = await fetch(`${MARKETS_API}/candles?id=${encodeURIComponent(id)}&tf=${tf}`, { signal: AbortSignal.timeout(30_000) });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? `candles: HTTP ${res.status}`);
  return body.candles;
}

// ----------------------------------------------------------- trade routing ----

export type TradeRoute =
  | { kind: 'v2'; chain: EvmChain; router: string }
  | { kind: 'v3'; chain: EvmChain; router: string; quoter: string; fee: number }
  | { kind: 'link'; url: string; reason: string };

const isEvmAddress = (a?: string) => !!a && /^0x[0-9a-fA-F]{40}$/.test(a);

export function venueUrl(m: Market): string {
  const chain = m.chainId ? EVM_CHAINS[m.chainId] : undefined;
  const inT = m.quote.address ?? '', outT = m.base.address ?? '';
  switch (m.family) {
    case 'Uniswap': return `https://app.uniswap.org/swap?chain=${chain?.slug ?? 'ethereum'}&inputCurrency=${inT}&outputCurrency=${outT}`;
    case 'PancakeSwap': return `https://pancakeswap.finance/swap?chain=${({ 56: 'bsc', 1: 'eth', 42161: 'arb', 8453: 'base' } as Record<number, string>)[m.chainId ?? 56] ?? 'bsc'}&inputCurrency=${inT}&outputCurrency=${outT}`;
    case 'QuickSwap': return `https://dapp.quickswap.exchange/swap/best/${inT}/${outT}`;
    case 'Hyperliquid': return `https://app.hyperliquid.xyz/trade/${encodeURIComponent(m.coin ?? m.base.symbol)}`;
    case 'THORChain': return 'https://app.thorswap.finance/swap';
    default: return chain ? `${chain.explorer}/address/${m.pool}` : 'https://wattxchange.app';
  }
}

export function routeFor(m: Market): TradeRoute {
  const chain = m.chainId ? EVM_CHAINS[m.chainId] : undefined;
  if (!chain || !isEvmAddress(m.base.address) || !isEvmAddress(m.quote.address)) {
    return { kind: 'link', url: venueUrl(m), reason: `${m.venueLabel} trades on its own platform.` };
  }
  if (m.version === 'v2' || m.version === 'v1') {
    const fam = m.family === 'SwapinDEX' ? 'SwapinDEX' : m.family;
    const router = V2_ROUTERS[fam]?.[chain.chainId];
    if (router && m.version === 'v2') return { kind: 'v2', chain, router };
  }
  if (m.family === 'Uniswap' && m.version === 'v3' && UNISWAP_V3[chain.chainId]) {
    const fee = Math.round(Number(m.fee ?? '0.3') * 10_000);
    return { kind: 'v3', chain, ...UNISWAP_V3[chain.chainId], fee };
  }
  return { kind: 'link', url: venueUrl(m), reason: `${m.venueLabel} pools are traded on ${m.family}'s app.` };
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

export interface Quote { amountOut: bigint; decimalsOut: number; decimalsIn: number }

/** sell=true: spend base, receive quote. sell=false: spend quote, receive base. */
export async function quote(m: Market, route: TradeRoute, sell: boolean, amountIn: string): Promise<Quote> {
  if (route.kind === 'link') throw new Error(route.reason);
  const tokenIn = sell ? m.base.address! : m.quote.address!;
  const tokenOut = sell ? m.quote.address! : m.base.address!;
  const [decimalsIn, decimalsOut] = await Promise.all([decimalsOf(route.chain, tokenIn), decimalsOf(route.chain, tokenOut)]);
  const raw = ethers.parseUnits(amountIn || '0', decimalsIn);
  if (raw === 0n) return { amountOut: 0n, decimalsIn, decimalsOut };
  if (route.kind === 'v2') {
    const amounts = await new ethers.Contract(addr(route.router), V2_ROUTER, reader(route.chain)).getAmountsOut(raw, [addr(tokenIn), addr(tokenOut)]);
    return { amountOut: amounts[amounts.length - 1], decimalsIn, decimalsOut };
  }
  const q = new ethers.Contract(addr(route.quoter), V3_QUOTER, reader(route.chain));
  const [out] = await q.quoteExactInputSingle.staticCall({ tokenIn: addr(tokenIn), tokenOut: addr(tokenOut), amountIn: raw, fee: route.fee, sqrtPriceLimitX96: 0 });
  return { amountOut: out, decimalsIn, decimalsOut };
}

type Eip1193 = { request: (a: { method: string; params?: unknown[] }) => Promise<unknown> };
const injected = (): Eip1193 | null => (window as unknown as { ethereum?: Eip1193 }).ethereum ?? null;

/** Connect a wallet and put it on `chain` (adding the network if the wallet lacks it). */
export async function walletOn(chain: EvmChain): Promise<ethers.JsonRpcSigner> {
  const eth = injected();
  if (!eth) throw new Error('No wallet found. Install MetaMask, Rabby or Brave Wallet, or open this page in your wallet app.');
  await eth.request({ method: 'eth_requestAccounts' });
  const current = parseInt(String(await eth.request({ method: 'eth_chainId' })), 16);
  if (current !== chain.chainId) {
    const hex = `0x${chain.chainId.toString(16)}`;
    try {
      await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: hex }] });
    } catch (err) {
      if ((err as { code?: number })?.code !== 4902) throw err;
      await eth.request({ method: 'wallet_addEthereumChain', params: [addChainParams(chain)] });
    }
  }
  const provider = new ethers.BrowserProvider(eth as ethers.Eip1193Provider);
  if (Number((await provider.getNetwork()).chainId) !== chain.chainId) throw new Error(`Switch your wallet to ${chain.name} and try again.`);
  return provider.getSigner();
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
  if (route.kind === 'link') throw new Error(route.reason);
  onStep('Checking the router on-chain…');
  if (!(await verifyRouter(route, m.pool))) {
    throw new Error(`Safety check failed: this router is not the one for this ${m.venueLabel} pool. Nothing was approved. Trade it on ${m.family}'s app instead.`);
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
