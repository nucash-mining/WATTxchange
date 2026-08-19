/**
 * OrderbookView — exchange-style trading view over the swap-router aggregator.
 *
 * Left: full market list (every pair a venue can quote), grouped by quote
 * currency and searchable. Center: a real depth ladder (asks stacked above the
 * spread, bids below) with cumulative-depth bars, best bid/ask and spread, fed
 * by the aggregated /book (kdf makers + SwapinDEX AMM + THORChain + CEX ref).
 * Right/below: live cross-chain arbitrage signals (dry-run).
 *
 * Reads fall back to the Oracle 24/7 engine when the desktop /router is offline,
 * so the tab keeps showing cross-chain data even when the desktop is asleep.
 */
import { useEffect, useMemo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Search, Radio, ArrowRightLeft, Server, Cloud, Star } from 'lucide-react';
import {
  swapRouterService, AggBook, ArbSnapshot, Market, BookLevel,
} from '../services/swapRouterService';

const VENUE_COLOR: Record<string, string> = {
  kdf: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  swapin: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  thorchain: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
  cex: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
};
const dot: Record<string, string> = {
  kdf: 'bg-purple-400', swapin: 'bg-emerald-400', thorchain: 'bg-sky-400', cex: 'bg-amber-400',
};
const badge = (v: string) => VENUE_COLOR[v.split('/')[0]] || 'bg-gray-500/20 text-gray-300 border-gray-500/40';

function fmt(n: number | null | undefined, sig = 6): string {
  if (n == null || !isFinite(n)) return '—';
  if (n === 0) return '0';
  const abs = Math.abs(n);
  if (abs >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (abs < 1e-4) return n.toExponential(2);
  return n.toPrecision(sig).replace(/\.?0+$/, '');
}

const DEFAULT_QUOTE_ORDER = ['USDT', 'USDC', 'BTC', 'ETH', 'ALT', 'WALT', 'WATT', 'WTX', 'HTH'];

export default function OrderbookView() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [quotes, setQuotes] = useState<string[]>([]);
  const [quote, setQuote] = useState<string>('USDT');
  const [search, setSearch] = useState('');
  const [sel, setSel] = useState<{ base: string; rel: string } | null>(null);
  const [book, setBook] = useState<AggBook | null>(null);
  const [arb, setArb] = useState<ArbSnapshot | null>(null);
  const [source, setSource] = useState<'desktop' | 'oracle' | null>(null);
  const [live, setLive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [favs, setFavs] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('ob_favs') || '[]')); } catch { return new Set(); }
  });

  // load markets once
  useEffect(() => {
    swapRouterService.getMarkets().then((m) => {
      setMarkets(m.markets);
      setQuotes(m.quotes);
      const q = DEFAULT_QUOTE_ORDER.find((x) => m.quotes.includes(x)) || m.quotes[0];
      setQuote(q);
    }).catch(() => {});
  }, []);

  const listForQuote = useMemo(() => {
    const s = search.trim().toUpperCase();
    return markets
      .filter((m) => (s ? (`${m.base}/${m.rel}`.includes(s)) : m.rel === quote))
      .sort((a, b) => a.base.localeCompare(b.base));
  }, [markets, quote, search]);

  // pick a default market once markets load
  useEffect(() => {
    if (!sel && listForQuote.length) setSel({ base: listForQuote[0].base, rel: listForQuote[0].rel });
  }, [listForQuote, sel]);

  const loadBook = useCallback(async () => {
    if (!sel) return;
    setLoading(true);
    try {
      const [b, a] = await Promise.all([
        swapRouterService.getBook(sel.base, sel.rel),
        swapRouterService.getArb(),
      ]);
      setBook(b);
      setArb(a);
      setSource((b as AggBook & { source?: 'desktop' | 'oracle' }).source || null);
    } catch { /* keep last */ }
    finally { setLoading(false); }
  }, [sel]);

  useEffect(() => { loadBook(); }, [loadBook]);
  useEffect(() => {
    if (!live) return;
    const t = setInterval(loadBook, 12000);
    return () => clearInterval(t);
  }, [live, loadBook]);

  const toggleFav = (k: string) => {
    setFavs((prev) => {
      const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k);
      localStorage.setItem('ob_favs', JSON.stringify([...n]));
      return n;
    });
  };

  // ---- exchange-style ladder maths (all level.price = rel per base) ----
  const ladder = useMemo(() => {
    const asks = (book?.asks || []).filter((l) => l.price > 0).slice().sort((a, b) => a.price - b.price); // ascending
    const bids = (book?.bids || []).filter((l) => l.price > 0).slice().sort((a, b) => b.price - a.price); // descending
    const bestAsk = asks[0]?.price ?? null;
    const bestBid = bids[0]?.price ?? null;
    const spread = bestAsk != null && bestBid != null ? bestAsk - bestBid : null;
    const spreadPct = spread != null && bestBid ? (spread / bestBid) * 100 : null;
    const mid = bestAsk != null && bestBid != null ? (bestAsk + bestBid) / 2
      : bestAsk ?? bestBid ?? book?.reference?.crossPrice ?? null;
    // cumulative sizes for depth bars
    const cum = (rows: BookLevel[]) => {
      let t = 0; return rows.map((r) => ({ ...r, cumu: (t += (r.size || 0)) }));
    };
    const asksC = cum(asks.slice(0, 12));
    const bidsC = cum(bids.slice(0, 12));
    const maxCum = Math.max(1, asksC.at(-1)?.cumu || 0, bidsC.at(-1)?.cumu || 0);
    return { asksC, bidsC, bestAsk, bestBid, spread, spreadPct, mid, maxCum };
  }, [book]);

  const pairArb = useMemo(() => {
    const all = arb?.opportunities || [];
    if (!sel) return all;
    const match = all.filter((o) => o.base === sel.base && o.rel === sel.rel);
    return match.length ? match : all;
  }, [arb, sel]);

  return (
    <div className="max-w-[1400px] mx-auto px-3 py-4">
      {/* top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold">Exchange</h1>
          <span className="text-xs text-gray-400">{markets.length} markets · kdf · SwapinDEX · THORChain · CEX</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md border ${
            source === 'oracle' ? 'bg-sky-500/15 text-sky-300 border-sky-500/40' : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'}`}>
            {source === 'oracle' ? <Cloud className="w-3.5 h-3.5" /> : <Server className="w-3.5 h-3.5" />}
            {source === 'oracle' ? 'Oracle 24/7' : 'Desktop full book'}
          </span>
          <button onClick={() => setLive((v) => !v)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs border ${live ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-gray-700/40 text-gray-300 border-gray-600'}`}>
            <Radio className={`w-3.5 h-3.5 ${live ? 'animate-pulse' : ''}`} />{live ? 'Live' : 'Paused'}
          </button>
          <button onClick={loadBook} className="p-1.5 rounded-md bg-gray-700/60 hover:bg-gray-700">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-3">
        {/* ---- market list ---- */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-lg flex flex-col min-h-[520px]">
          <div className="p-2 border-b border-gray-800">
            <div className="flex items-center gap-2 bg-gray-800/70 rounded-md px-2">
              <Search className="w-4 h-4 text-gray-500" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search all pairs"
                className="bg-transparent text-sm py-1.5 w-full outline-none" />
            </div>
          </div>
          {!search && (
            <div className="flex flex-wrap gap-1 p-2 border-b border-gray-800">
              {quotes.map((q) => (
                <button key={q} onClick={() => setQuote(q)}
                  className={`text-xs px-2 py-0.5 rounded ${q === quote ? 'bg-yellow-500/20 text-yellow-300' : 'text-gray-400 hover:text-gray-200'}`}>{q}</button>
              ))}
            </div>
          )}
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="text-gray-500 sticky top-0 bg-gray-900/90">
                <tr><th className="text-left px-2 py-1 font-normal">Pair</th><th className="text-right px-2 py-1 font-normal">Venues</th></tr>
              </thead>
              <tbody>
                {listForQuote.map((m) => {
                  const k = `${m.base}/${m.rel}`;
                  const active = sel?.base === m.base && sel?.rel === m.rel;
                  return (
                    <tr key={k} onClick={() => setSel({ base: m.base, rel: m.rel })}
                      className={`cursor-pointer border-t border-gray-800/60 ${active ? 'bg-yellow-500/10' : 'hover:bg-gray-800/50'}`}>
                      <td className="px-2 py-1.5">
                        <span className="inline-flex items-center gap-1">
                          <Star className={`w-3 h-3 ${favs.has(k) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`}
                            onClick={(e) => { e.stopPropagation(); toggleFav(k); }} />
                          <span className="font-medium text-gray-200">{m.base}</span><span className="text-gray-500">/{m.rel}</span>
                        </span>
                      </td>
                      <td className="px-2 py-1.5">
                        <span className="flex items-center justify-end gap-1">
                          {m.venues.map((v) => <span key={v} className={`w-1.5 h-1.5 rounded-full ${dot[v] || 'bg-gray-500'}`} title={v} />)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {listForQuote.length === 0 && <tr><td colSpan={2} className="px-3 py-4 text-gray-500">No pairs.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* ---- book + arb ---- */}
        <div className="space-y-3">
          {/* pair header */}
          <div className="bg-gray-900/60 border border-gray-800 rounded-lg px-4 py-3 flex flex-wrap items-center gap-x-8 gap-y-2">
            <div className="text-lg font-bold">{sel ? `${sel.base}/${sel.rel}` : '—'}</div>
            <Stat label="Last" value={fmt(ladder.mid)} accent />
            <Stat label={`Best bid`} value={fmt(ladder.bestBid)} className="text-emerald-300" />
            <Stat label={`Best ask`} value={fmt(ladder.bestAsk)} className="text-red-300" />
            <Stat label="Spread" value={ladder.spreadPct != null ? `${ladder.spreadPct.toFixed(2)}%` : '—'} />
            <div className="flex gap-1 ml-auto">
              {(book?.venues || []).map((v) => <span key={v} className={`text-[10px] px-1.5 py-0.5 rounded border ${badge(v)}`}>{v}</span>)}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            {/* depth ladder */}
            <div className="bg-gray-900/60 border border-gray-800 rounded-lg overflow-hidden">
              <div className="grid grid-cols-3 text-[11px] text-gray-500 px-3 py-1.5 border-b border-gray-800">
                <span>Price ({sel?.rel})</span><span className="text-right">Amount ({sel?.base})</span><span className="text-right">Total</span>
              </div>
              {/* asks (reversed: worst on top, best just above spread) */}
              <div className="flex flex-col-reverse">
                {ladder.asksC.map((l, i) => <LadderRow key={`a${i}`} l={l} max={ladder.maxCum} side="ask" />)}
              </div>
              {/* spread */}
              <div className="px-3 py-1.5 border-y border-gray-800 bg-gray-800/40 flex items-center justify-between text-xs">
                <span className="font-semibold">{fmt(ladder.mid)}</span>
                <span className="text-gray-400">spread {ladder.spread != null ? fmt(ladder.spread) : '—'} {ladder.spreadPct != null ? `(${ladder.spreadPct.toFixed(2)}%)` : ''}</span>
              </div>
              {/* bids */}
              <div className="flex flex-col">
                {ladder.bidsC.map((l, i) => <LadderRow key={`b${i}`} l={l} max={ladder.maxCum} side="bid" />)}
              </div>
              {ladder.asksC.length === 0 && ladder.bidsC.length === 0 && (
                <div className="px-3 py-8 text-center text-sm text-gray-500">No liquidity on any venue for this pair yet.
                  {book?.reference && <div className="text-xs text-amber-300/70 mt-1">CEX reference: {fmt(book.reference.crossPrice)} {sel?.rel}</div>}
                </div>
              )}
            </div>

            {/* arb signals for this pair / global */}
            <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold flex items-center gap-1.5"><ArrowRightLeft className="w-4 h-4 text-sky-400" />Arbitrage signals</h2>
                <span className="text-[10px] text-gray-500">{arb?.lastScan ? new Date(arb.lastScan).toLocaleTimeString() : ''} · dry-run</span>
              </div>
              {pairArb.length === 0 ? (
                <div className="text-xs text-gray-500 py-6 text-center">No opportunities above threshold. Scanner runs every 30s.</div>
              ) : (
                <div className="space-y-1.5 max-h-[380px] overflow-y-auto">
                  {pairArb.map((o, i) => (
                    <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="flex items-center justify-between gap-2 bg-gray-800/60 rounded-md px-2.5 py-1.5 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium">{o.base}/{o.rel}</span>
                        <span className={`px-1.5 py-0.5 rounded border ${badge(o.buyVenue)}`}>{o.buyVenue}</span>
                        <ArrowRightLeft className="w-3 h-3 text-gray-500" />
                        <span className={`px-1.5 py-0.5 rounded border ${badge(o.sellVenue)}`}>{o.sellVenue}</span>
                        {o.referenceOnly && <span className="text-amber-400 text-[10px]">ref</span>}
                      </div>
                      <span className={`font-bold ${o.netSpreadPct >= 1 ? 'text-emerald-300' : 'text-yellow-300'}`}>+{o.netSpreadPct}%</span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, className = '', accent = false }: { label: string; value: string; className?: string; accent?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] text-gray-500 uppercase tracking-wide">{label}</span>
      <span className={`text-sm font-mono ${accent ? 'text-yellow-300 font-semibold' : ''} ${className}`}>{value}</span>
    </div>
  );
}

function LadderRow({ l, max, side }: { l: BookLevel & { cumu: number }; max: number; side: 'ask' | 'bid' }) {
  const pct = Math.min(100, (l.cumu / max) * 100);
  const barColor = side === 'ask' ? 'bg-red-500/12' : 'bg-emerald-500/12';
  const priceColor = side === 'ask' ? 'text-red-300' : 'text-emerald-300';
  return (
    <div className="relative grid grid-cols-3 px-3 py-[3px] text-[11px] font-mono">
      <div className={`absolute inset-y-0 right-0 ${barColor}`} style={{ width: `${pct}%` }} />
      <span className={`relative ${priceColor}`}>{fmt(l.price)}</span>
      <span className="relative text-right text-gray-300">{fmt(l.size, 4)}</span>
      <span className="relative text-right text-gray-500 flex items-center justify-end gap-1">
        <span className={`w-1.5 h-1.5 rounded-full ${dot[l.venue?.split('/')[0]] || 'bg-gray-500'}`} title={l.venue} />
        {fmt(l.cumu, 4)}
      </span>
    </div>
  );
}
