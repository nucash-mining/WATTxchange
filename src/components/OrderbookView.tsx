/**
 * OrderbookView — live aggregated cross-venue orderbook + always-on cross-chain
 * arbitrage signals. Reads the swap-router (/book, /arb, /venues), which merges:
 *   • kdf atomic-swap maker orders (non-custodial HTLC)
 *   • SwapinDEX on-chain AMM pools on Altcoinchain
 *   • THORChain cross-chain liquidity
 *   • CEX reference prices (signal-only anchor)
 * The arb scanner is DRY-RUN: it detects and ranks opportunities, never executes.
 */
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, TrendingUp, ArrowRightLeft, Radio, AlertTriangle } from 'lucide-react';
import {
  swapRouterService, AggBook, ArbSnapshot, Venue,
} from '../services/swapRouterService';

const PAIRS = [
  { base: 'FLOP', rel: 'ALT' },
  { base: 'WTX', rel: 'HTH' },
  { base: 'WATT', rel: 'WALT' },
  { base: 'LTC', rel: 'BTC' },
  { base: 'BTC', rel: 'ETH' },
  { base: 'DOGE', rel: 'LTC' },
];

const VENUE_COLOR: Record<string, string> = {
  kdf: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  swapin: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  thorchain: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
  cex: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
};
const badge = (v: string) =>
  VENUE_COLOR[v.split('/')[0]] || 'bg-gray-500/20 text-gray-300 border-gray-500/40';

const fmt = (n: number | null | undefined, p = 8) =>
  n == null ? '—' : n < 1e-4 ? n.toExponential(3) : n.toLocaleString(undefined, { maximumFractionDigits: p });

export default function OrderbookView() {
  const [pair, setPair] = useState(PAIRS[0]);
  const [book, setBook] = useState<AggBook | null>(null);
  const [arb, setArb] = useState<ArbSnapshot | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [live, setLive] = useState(true);

  const load = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const [b, a] = await Promise.all([
        swapRouterService.getBook(pair.base, pair.rel),
        swapRouterService.getArb(),
      ]);
      setBook(b); setArb(a);
    } catch (e) { setErr((e as Error).message); }
    finally { setLoading(false); }
  }, [pair]);

  useEffect(() => { swapRouterService.getVenues().then(setVenues).catch(() => {}); }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!live) return;
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [live, load]);

  const opps = (arb?.opportunities || []).slice().sort((a, b) => b.netSpreadPct - a.netSpreadPct);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-purple-400" /> Cross-Chain Orderbook
          </h1>
          <p className="text-sm text-gray-400">
            One book across kdf swaps · SwapinDEX AMM · THORChain · CEX reference. Arb scanner is dry-run.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLive((v) => !v)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border ${
              live ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-gray-700/40 text-gray-300 border-gray-600'
            }`}
          >
            <Radio className={`w-4 h-4 ${live ? 'animate-pulse' : ''}`} /> {live ? 'Live' : 'Paused'}
          </button>
          <button onClick={load} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm bg-purple-600/80 hover:bg-purple-600">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* venues strip */}
      <div className="flex flex-wrap gap-2">
        {venues.map((v) => (
          <span key={v.id} className={`text-xs px-2 py-1 rounded-md border ${badge(v.id)}`}>
            {v.id} · {v.kind}
          </span>
        ))}
      </div>

      {err && (
        <div className="flex items-center gap-2 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
          <AlertTriangle className="w-4 h-4" /> {err}
        </div>
      )}

      {/* pair selector */}
      <div className="flex flex-wrap gap-2">
        {PAIRS.map((p) => {
          const active = p.base === pair.base && p.rel === pair.rel;
          return (
            <button key={`${p.base}/${p.rel}`} onClick={() => setPair(p)}
              className={`px-3 py-1.5 rounded-lg text-sm border ${active ? 'bg-purple-600 border-purple-400' : 'bg-gray-800/60 border-gray-700 hover:border-gray-500'}`}>
              {p.base}/{p.rel}
            </button>
          );
        })}
      </div>

      {/* book */}
      <div className="grid md:grid-cols-2 gap-4">
        <BookSide title={`Asks — sell ${pair.base}, get ${pair.rel}`} color="text-red-300"
          levels={book?.asks || []} best={book?.bestAsk} rel={pair.rel} />
        <BookSide title={`Bids — buy ${pair.base}, pay ${pair.rel}`} color="text-emerald-300"
          levels={book?.bids || []} best={book?.bestBid} rel={pair.rel} />
      </div>
      {book?.reference && (
        <div className="text-xs text-amber-300/80">
          CEX reference ({book.reference.source}): 1 {pair.base} ≈ {fmt(book.reference.crossPrice)} {pair.rel}
          {' '}(${fmt(book.reference.baseUsd, 4)} / ${fmt(book.reference.relUsd, 4)})
        </div>
      )}
      {book?.notes?.length ? (
        <div className="text-xs text-gray-500">{book.notes.join(' · ')}</div>
      ) : null}

      {/* arb signals */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-sky-400" /> Arbitrage Signals
            <span className="text-xs text-gray-400 font-normal">
              {arb?.lastScan ? `scan #${arb.scans} · ${new Date(arb.lastScan).toLocaleTimeString()}` : ''}
            </span>
          </h2>
          <span className="text-xs text-gray-500">dry-run — detection only, no auto-execution</span>
        </div>

        {opps.length === 0 ? (
          <div className="text-sm text-gray-400 bg-gray-800/40 border border-gray-700 rounded-lg p-4">
            No opportunities above threshold right now. The scanner keeps watching every 30s.
          </div>
        ) : (
          <div className="space-y-2">
            {opps.map((o, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap items-center justify-between gap-3 bg-gray-800/60 border border-gray-700 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{o.base}/{o.rel}</span>
                  <span className={`text-xs px-2 py-0.5 rounded border ${badge(o.buyVenue)}`}>buy {o.buyVenue}</span>
                  <ArrowRightLeft className="w-3 h-3 text-gray-500" />
                  <span className={`text-xs px-2 py-0.5 rounded border ${badge(o.sellVenue)}`}>sell {o.sellVenue}</span>
                  {o.referenceOnly && <span className="text-xs text-amber-400">(reference)</span>}
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-400">buy {fmt(o.buyPrice)} → sell {fmt(o.sellPrice)}</span>
                  <span className={`font-bold ${o.netSpreadPct >= 1 ? 'text-emerald-300' : 'text-yellow-300'}`}>
                    +{o.netSpreadPct}% net
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* survey / coverage transparency */}
        {arb?.surveyed?.length ? (
          <details className="text-xs text-gray-500">
            <summary className="cursor-pointer">Coverage ({arb.surveyed.length} pairs scanned)</summary>
            <div className="mt-2 space-y-1">
              {arb.surveyed.map((s, i) => (
                <div key={i}>{s.pair}: {s.venues?.join(', ') || 'none'} {s.note ? `— ${s.note}` : ''}{s.error ? `— ${s.error}` : ''}</div>
              ))}
            </div>
          </details>
        ) : null}
      </div>
    </div>
  );
}

function BookSide({ title, color, levels, best, rel }: {
  title: string; color: string; levels: { venue: string; price: number; size: number }[];
  best?: number | null; rel: string;
}) {
  return (
    <div className="bg-gray-800/40 border border-gray-700 rounded-lg overflow-hidden">
      <div className="px-3 py-2 border-b border-gray-700 flex items-center justify-between">
        <span className={`text-sm font-medium ${color}`}>{title}</span>
        <span className="text-xs text-gray-400">best {fmt(best)} {rel}</span>
      </div>
      <div className="max-h-72 overflow-y-auto">
        {levels.length === 0 ? (
          <div className="px-3 py-4 text-xs text-gray-500">No liquidity on any venue.</div>
        ) : (
          <table className="w-full text-xs">
            <thead className="text-gray-500">
              <tr><th className="text-left px-3 py-1">Venue</th><th className="text-right px-3 py-1">Price ({rel})</th><th className="text-right px-3 py-1">Size</th></tr>
            </thead>
            <tbody>
              {levels.map((l, i) => (
                <tr key={i} className="border-t border-gray-800">
                  <td className="px-3 py-1"><span className={`px-1.5 py-0.5 rounded border ${badge(l.venue)}`}>{l.venue}</span></td>
                  <td className="text-right px-3 py-1 font-mono">{fmt(l.price)}</td>
                  <td className="text-right px-3 py-1 font-mono text-gray-400">{fmt(l.size, 4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
