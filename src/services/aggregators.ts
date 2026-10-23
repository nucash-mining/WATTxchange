// In-app swaps for venues without a direct router here:
//  - KyberSwap aggregator: any EVM pool (Uniswap v4, PancakeSwap v3/Infinity/StableSwap,
//    QuickSwap v3/v4, …). Best route across all DEXs on that chain. Before any approval the
//    router Kyber returns must be its known MetaAggregationRouterV2.
//  - THORChain: native cross-chain swaps. EVM coins are deposited through the THORChain
//    router from the wallet; BTC-style coins get a deposit address + memo shown in-app.
import { ethers } from 'ethers';
import { EVM_CHAINS, type EvmChain } from '../config/evmChains';

// --------------------------------------------------------------- KyberSwap ----

const KYBER_API = 'https://aggregator-api.kyberswap.com';
export const KYBER_ROUTER = '0x6131B5fae19EA4f9D964eAc0408E4408b66337b5';
export const NATIVE = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
const KYBER_SLUG: Record<number, string> = {
  1: 'ethereum', 56: 'bsc', 137: 'polygon', 42161: 'arbitrum', 8453: 'base', 10: 'optimism', 43114: 'avalanche', 146: 'sonic',
};
export const kyberSupports = (chainId: number) => Boolean(KYBER_SLUG[chainId]);
const kyberHeaders = { 'x-client-id': 'wattxchange', 'content-type': 'application/json' };

export interface KyberQuote { amountOut: bigint; routeSummary: unknown; router: string; dexes: string[] }

export async function kyberQuote(chainId: number, tokenIn: string, tokenOut: string, amountIn: bigint): Promise<KyberQuote> {
  const slug = KYBER_SLUG[chainId];
  const url = `${KYBER_API}/${slug}/api/v1/routes?tokenIn=${tokenIn}&tokenOut=${tokenOut}&amountIn=${amountIn}`;
  const res = await fetch(url, { headers: kyberHeaders, signal: AbortSignal.timeout(15_000) });
  const body = await res.json();
  if (body.code !== 0 || !body.data?.routeSummary) throw new Error(body.message ?? 'No route found for this pair.');
  const rs = body.data.routeSummary;
  const dexes = [...new Set((rs.route ?? []).flat().map((s: { exchange: string }) => s.exchange))] as string[];
  return { amountOut: BigInt(rs.amountOut), routeSummary: rs, router: body.data.routerAddress, dexes };
}

/** Build + send the Kyber swap. Approves the token for Kyber's router first if needed. */
export async function kyberSwap(opts: {
  chain: EvmChain; signer: ethers.Signer; tokenIn: string; tokenOut: string; amountIn: bigint; slippageBps: number; onStep: (s: string) => void;
}): Promise<string> {
  const { chain, signer, tokenIn, tokenOut, amountIn, slippageBps, onStep } = opts;
  const me = await signer.getAddress();
  onStep('Finding the best route…');
  const q = await kyberQuote(chain.chainId, tokenIn, tokenOut, amountIn);
  if (q.router.toLowerCase() !== KYBER_ROUTER.toLowerCase()) throw new Error('Safety check failed: unexpected router from the aggregator. Nothing was approved.');
  const res = await fetch(`${KYBER_API}/${KYBER_SLUG[chain.chainId]}/api/v1/route/build`, {
    method: 'POST', headers: kyberHeaders,
    body: JSON.stringify({ routeSummary: q.routeSummary, sender: me, recipient: me, slippageTolerance: slippageBps, source: 'wattxchange' }),
  });
  const body = await res.json();
  if (body.code !== 0 || !body.data?.data) throw new Error(body.message ?? 'Could not build the swap.');
  if (body.data.routerAddress.toLowerCase() !== KYBER_ROUTER.toLowerCase()) throw new Error('Safety check failed: unexpected router. Nothing was approved.');
  const native = tokenIn.toLowerCase() === NATIVE.toLowerCase();
  if (!native) {
    const t = new ethers.Contract(tokenIn, ['function allowance(address,address) view returns (uint256)', 'function approve(address,uint256) returns (bool)'], signer);
    if ((await t.allowance(me, KYBER_ROUTER)) < amountIn) {
      onStep('Approve the token in your wallet…');
      await (await t.approve(KYBER_ROUTER, amountIn)).wait();
    }
  }
  onStep('Confirm the swap in your wallet…');
  const tx = await signer.sendTransaction({ to: KYBER_ROUTER, data: body.data.data, value: native ? amountIn : 0n });
  onStep('Waiting for confirmation…');
  await tx.wait();
  return tx.hash;
}

// --------------------------------------------------------------- THORChain ----

const THORNODE = 'https://gateway.liquify.com/chain/thorchain_api/thorchain';
/** THORChain chain prefix → EVM chain we can send from. */
export const THOR_EVM: Record<string, number> = { ETH: 1, BSC: 56, AVAX: 43114, BASE: 8453 };
export const THOR_GAS: Record<string, string> = { ETH: 'ETH.ETH', BSC: 'BSC.BNB', AVAX: 'AVAX.AVAX', BASE: 'BASE.ETH', BTC: 'BTC.BTC', LTC: 'LTC.LTC', DOGE: 'DOGE.DOGE', BCH: 'BCH.BCH', GAIA: 'GAIA.ATOM', THOR: 'THOR.RUNE' };
export const thorChainOf = (asset: string) => asset.split('.')[0];
export const thorSymbol = (asset: string) => asset.split('.')[1]?.split('-')[0] ?? asset;
export const thorTokenAddress = (asset: string) => { const c = asset.split('-')[1]; return c && /^0X[0-9A-F]{40}$/i.test(c) ? ethers.getAddress(c.toLowerCase()) : null; };
export const thorEvmChain = (asset: string): EvmChain | null => { const id = THOR_EVM[thorChainOf(asset)]; return id ? EVM_CHAINS[id] ?? null : null; };

export interface ThorQuote {
  expected_amount_out: string; memo: string; inbound_address: string; router?: string; expiry: number;
  recommended_min_amount_in?: string; dust_threshold?: string; fees: { total: string; total_bps: number };
  total_swap_seconds?: number; warning?: string;
}

/** amountIn is in the source asset's units (e.g. "0.5"); THORChain uses 1e8 for every asset. */
export async function thorQuote(from: string, to: string, amountIn: string, destination: string, toleranceBps: number): Promise<ThorQuote> {
  const amt = ethers.parseUnits(Number(amountIn).toFixed(8), 8);
  const q = new URLSearchParams({ from_asset: from, to_asset: to, amount: amt.toString(), tolerance_bps: String(toleranceBps) });
  if (destination) q.set('destination', destination);
  const res = await fetch(`${THORNODE}/quote/swap?${q}`, { signal: AbortSignal.timeout(15_000) });
  const body = await res.json();
  if (!res.ok || body.error || body.code) throw new Error(String(body.error ?? body.message ?? `THORChain: HTTP ${res.status}`).replace(/^.*?: /, ''));
  return body;
}

const THOR_ROUTER_ABI = ['function depositWithExpiry(address vault, address asset, uint256 amount, string memo, uint256 expiration) payable'];

/** Send an EVM-chain deposit to THORChain from the connected wallet. */
export async function thorDepositEvm(opts: { signer: ethers.Signer; from: string; amountIn: string; quote: ThorQuote; onStep: (s: string) => void }): Promise<string> {
  const { signer, from, amountIn, quote: q, onStep } = opts;
  if (!q.router) throw new Error('THORChain did not return a router for this chain.');
  const token = thorTokenAddress(from);
  const me = await signer.getAddress();
  let amount: bigint;
  if (token) {
    const t = new ethers.Contract(token, ['function decimals() view returns (uint8)', 'function allowance(address,address) view returns (uint256)', 'function approve(address,uint256) returns (bool)'], signer);
    amount = ethers.parseUnits(amountIn, Number(await t.decimals()));
    if ((await t.allowance(me, q.router)) < amount) {
      onStep('Approve the token for THORChain in your wallet…');
      await (await t.approve(q.router, amount)).wait();
    }
  } else {
    amount = ethers.parseEther(amountIn);
  }
  onStep('Confirm the THORChain deposit in your wallet…');
  const r = new ethers.Contract(q.router, THOR_ROUTER_ABI, signer);
  const tx = await r.depositWithExpiry(q.inbound_address, token ?? ethers.ZeroAddress, amount, q.memo, q.expiry, { value: token ? 0n : amount });
  onStep('Waiting for confirmation…');
  await tx.wait();
  return tx.hash as string;
}

export async function thorStatus(txHash: string) {
  const res = await fetch(`${THORNODE}/tx/status/${txHash.replace(/^0x/, '').toUpperCase()}`);
  return res.ok ? res.json() : null;
}

/** Assets THORChain can swap right now (available pools + RUNE). */
export async function thorAssets(): Promise<string[]> {
  const res = await fetch(`${THORNODE}/pools`, { signal: AbortSignal.timeout(15_000) });
  const pools = (await res.json()) as { asset: string; status: string }[];
  const list = pools.filter((p) => p.status === 'Available' && !p.asset.includes('/') && !p.asset.includes('~')).map((p) => p.asset);
  return ['THOR.RUNE', ...list.sort()];
}

/** Address formats THORChain wants per chain: EVM chains take 0x…, others their own. */
export const thorAddressHint = (asset: string) => {
  const c = thorChainOf(asset);
  if (THOR_EVM[c]) return '0x… address';
  return ({ BTC: 'bc1… / 1… / 3… Bitcoin address', LTC: 'ltc1… / L… / M… Litecoin address', DOGE: 'D… Dogecoin address', BCH: 'Bitcoin Cash address', GAIA: 'cosmos1… address', THOR: 'thor1… address', XRP: 'r… XRP address', TRON: 'T… TRON address', SOL: 'Solana address' } as Record<string, string>)[c] ?? `${c} address`;
};
