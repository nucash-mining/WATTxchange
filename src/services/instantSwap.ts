// Instant cross-chain swaps (HoudiniSwap-style) through Exolix: Monero <-> any coin, and
// any coin <-> any coin, to EVM or UTXO wallets. No account or KYC; the user sends the
// "from" coin to a one-time deposit address and Exolix pays out to their own address.
// The browser talks to Exolix directly (CORS is allowed for wattxchange.app).
import { ethers } from 'ethers';

const API = 'https://exolix.com/api/v2';

export interface SwapNetwork {
  network: string; name: string; shortName: string; addressRegex: string; memoNeeded: boolean; memoName: string;
  memoRegex: string; contract: string | null; isDefault: boolean; isNative?: boolean; blockExplorer?: string; decimal?: number | null;
}
export interface SwapCoin { code: string; name: string; icon: string; networks: SwapNetwork[] }
export interface SwapAsset { coin: SwapCoin; net: SwapNetwork }
export interface SwapRate { toAmount: number; rate: number; minAmount: number; maxAmount: number; message: string | null }
export interface SwapOrder {
  id: string; status: string; amount: number; amountTo: number; rate: number;
  depositAddress: string; depositExtraId: string | null; withdrawalAddress: string; withdrawalExtraId?: string | null;
  refundAddress?: string | null; createdAt: string;
  coinFrom: { coinCode: string; network: string; networkName: string; contract: string | null };
  coinTo: { coinCode: string; network: string; networkName: string };
  hashIn?: { hash: string | null; link: string | null }; hashOut?: { hash: string | null; link: string | null };
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { signal: AbortSignal.timeout(20_000) });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message ?? body.error ?? `HTTP ${res.status}`);
  return body as T;
}

let coinCache: Promise<SwapCoin[]> | null = null;
/** Every coin and network Exolix supports (≈500), cached for the session. */
export function swapCoins(): Promise<SwapCoin[]> {
  if (!coinCache) {
    coinCache = (async () => {
      const first = await get<{ data: SwapCoin[]; count: number }>('/currencies?size=100&page=1&withNetworks=true');
      const pages = Math.ceil(first.count / 100);
      const rest = await Promise.all(Array.from({ length: pages - 1 }, (_, i) => get<{ data: SwapCoin[] }>(`/currencies?size=100&page=${i + 2}&withNetworks=true`)));
      return [first, ...rest].flatMap((p) => p.data).filter((c) => c.networks?.length);
    })().catch((e) => { coinCache = null; throw e; });
  }
  return coinCache;
}

const q = (a: SwapAsset, side: 'From' | 'To') => `coin${side}=${encodeURIComponent(a.coin.code)}&network${side}=${encodeURIComponent(a.net.network)}`;

export async function swapRate(from: SwapAsset, to: SwapAsset, amount: string): Promise<SwapRate> {
  const res = await fetch(`${API}/rate?${q(from, 'From')}&${q(to, 'To')}&amount=${encodeURIComponent(amount)}&rateType=float`, { signal: AbortSignal.timeout(20_000) });
  const body = await res.json().catch(() => ({}));
  // Exolix answers out-of-range amounts with HTTP 422 but still sends the limits
  if (!res.ok && body.minAmount == null) throw new Error(body.message ?? `HTTP ${res.status}`);
  return { toAmount: Number(body.toAmount ?? 0), rate: Number(body.rate ?? 0), minAmount: Number(body.minAmount ?? 0), maxAmount: Number(body.maxAmount ?? 0), message: body.message ?? null };
}

export async function createSwap(o: { from: SwapAsset; to: SwapAsset; amount: string; address: string; memo?: string; refund?: string; refundMemo?: string }): Promise<SwapOrder> {
  const res = await fetch(`${API}/transactions`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, signal: AbortSignal.timeout(30_000),
    body: JSON.stringify({
      coinFrom: o.from.coin.code, networkFrom: o.from.net.network, coinTo: o.to.coin.code, networkTo: o.to.net.network,
      amount: Number(o.amount), withdrawalAddress: o.address.trim(), withdrawalExtraId: o.memo?.trim() || undefined,
      refundAddress: o.refund?.trim() || undefined, refundExtraId: o.refundMemo?.trim() || undefined, rateType: 'float',
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.depositAddress) throw new Error(body.message ?? body.error ?? `Could not create the swap (HTTP ${res.status}).`);
  return body as SwapOrder;
}

export const swapStatus = (id: string) => get<SwapOrder>(`/transactions/${encodeURIComponent(id)}`);

export const validAddress = (net: SwapNetwork, addr: string) => {
  if (!addr.trim()) return false;
  if (!net.addressRegex) return true;
  try { return new RegExp(net.addressRegex).test(addr.trim()); } catch { return true; }
};

/** Exolix status -> plain words + progress step (0..4). */
export function statusInfo(s: string): { label: string; step: number; done?: boolean; bad?: boolean } {
  switch (s) {
    case 'wait': return { label: 'Waiting for your deposit', step: 0 };
    case 'confirmation': return { label: 'Deposit seen, waiting for confirmations', step: 1 };
    case 'confirmed': return { label: 'Deposit confirmed', step: 2 };
    case 'exchanging': return { label: 'Swapping', step: 3 };
    case 'success': return { label: 'Done: coins sent to your address', step: 4, done: true };
    case 'overdue': return { label: 'Expired: no deposit arrived in time. Start a new swap.', step: 0, bad: true };
    case 'refunded': return { label: 'Refunded to your refund address', step: 4, bad: true };
    default: return { label: s, step: 1 };
  }
}

/** EVM networks we can send the deposit from straight out of the connected wallet. */
export const EVM_NETWORK_CHAIN: Record<string, number> = { ETH: 1, MATIC: 137, ARBITRUM: 42161, BASE: 8453, OPTIMISM: 10, SONIC: 146 };
const NATIVE_MARKERS = ['0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', '0x0000000000000000000000000000000000001010'];
export const isNativeContract = (c: string | null) => !c || NATIVE_MARKERS.includes(c.toLowerCase());

/** Send the deposit from an EVM wallet (native coin or ERC-20 transfer). */
export async function sendDeposit(signer: ethers.Signer, order: SwapOrder, contract: string | null): Promise<string> {
  const to = ethers.getAddress(order.depositAddress);
  if (isNativeContract(contract)) {
    const tx = await signer.sendTransaction({ to, value: ethers.parseEther(String(order.amount)) });
    return tx.hash;
  }
  const token = new ethers.Contract(contract!, ['function decimals() view returns (uint8)', 'function transfer(address,uint256) returns (bool)'], signer);
  const dec = Number(await token.decimals());
  const tx = await token.transfer(to, ethers.parseUnits(String(order.amount), dec));
  return tx.hash as string;
}
