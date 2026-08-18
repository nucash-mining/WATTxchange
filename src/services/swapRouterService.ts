/**
 * swapRouterService — client for the non-custodial best-price aggregator.
 *
 * The router only QUOTES and hands off to the winning route's own deposit
 * address (a THORChain vault or the WATT⇄WTX desk). It never custodies funds
 * and never holds an exchange key, so nothing sensitive touches the browser.
 *
 * Exposed via the bridge endpoint's /router/* passthrough (reuses its TLS/CORS).
 */

const BASE =
  ((import.meta as { env?: Record<string, string> }).env?.VITE_WATT_BRIDGE_API ||
    'https://bridge.wattxchange.app') + '/router';

export interface SwapRoute {
  provider: string;
  custody: string;
  from: string;
  to: string;
  inAmount: number;
  outAmount: number;
  feeOut?: number | null;
  etaSeconds?: number | null;
}

export interface QuoteResult {
  from: string;
  to: string;
  amount: string;
  best: SwapRoute | null;
  routes: SwapRoute[];
  errors?: { provider: string; error: string }[];
  note?: string;
}

export interface BookLevel {
  venue: string;
  kind: string;
  custody: string;
  price: number;
  size: number;
  effective?: boolean;
}
export interface AggBook {
  base: string;
  rel: string;
  generatedAt: string;
  venues: string[];
  bestAsk: number | null;
  bestBid: number | null;
  asks: BookLevel[];
  bids: BookLevel[];
  reference?: { source: string; baseUsd: number; relUsd: number; crossPrice: number } | null;
  notes?: string[];
}
export interface ArbOpportunity {
  base: string;
  rel: string;
  kind?: string;
  buyVenue: string;
  buyPrice: number;
  sellVenue: string;
  sellPrice: number;
  grossSpreadPct: number;
  estCostPct: number;
  netSpreadPct: number;
  sizeBase?: number | null;
  referenceOnly?: boolean;
  actionable?: boolean;
  detectedAt?: string;
  note?: string;
}
export interface ArbSnapshot {
  lastScan: string | null;
  scans: number;
  opportunities: ArbOpportunity[];
  surveyed: { pair: string; venues: string[]; note?: string; error?: string }[];
  history: ArbOpportunity[];
}
export interface Venue { id: string; kind: string; custody?: string; coins?: string[]; tokens?: string[]; }

export interface RouterSwap {
  id: string;
  provider: string;
  from: string;
  to: string;
  amount: string | number;
  destination: string;
  expectedOut?: number;
  state: string;
  depositAddress?: string | null;
  memo?: string | null;
  depositCoin?: string;
  lockParams?: unknown;
  instructions?: string;
  txid?: string;
  live?: { state?: string; deposit?: { seen: boolean; confirmations: number; required: number }; error?: string };
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init);
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error((body && body.error) || `router ${res.status}`);
  return body as T;
}

export const swapRouterService = {
  /** Coins the router can currently route (THORChain + own WATT/WTX rails). */
  coins: ['BTC', 'ETH', 'LTC', 'DOGE', 'BCH', 'AVAX', 'ATOM', 'USDC', 'USDT', 'WTX', 'WATT', 'HTH', 'FLOP', 'ALT'],

  quote(from: string, to: string, amount: string) {
    const qs = new URLSearchParams({ from, to, amount });
    return call<QuoteResult>(`/quote?${qs}`);
  },

  createSwap(from: string, to: string, amount: string, destination: string) {
    return call<{ swap: RouterSwap }>(`/swap`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ from, to, amount, destination }),
    }).then((r) => r.swap);
  },

  /** Aggregated cross-venue orderbook for a pair. */
  getBook(base: string, rel: string) {
    const qs = new URLSearchParams({ base, rel });
    return call<AggBook>(`/book?${qs}`);
  },

  /** Latest always-on arbitrage scan (dry-run signals). */
  getArb() {
    return call<ArbSnapshot>(`/arb`);
  },

  /** Venues feeding the book + scanner. */
  getVenues() {
    return call<{ venues: Venue[] }>(`/venues`).then((r) => r.venues);
  },

  getSwap(id: string) {
    return call<{ swap: RouterSwap }>(`/swap/${id}`).then((r) => r.swap);
  },

  /** Attach the user's inbound txid so a THORChain swap can be tracked. */
  attachTxid(id: string, txid: string) {
    return call<{ swap: RouterSwap }>(`/swap/${id}/sent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ txid }),
    }).then((r) => r.swap);
  },
};
