import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ethers } from 'ethers';
import {
  createChart, ColorType, CrosshairMode, LineStyle,
  type IChartApi, type ISeriesApi, type UTCTimestamp, type MouseEventParams, type Time,
} from 'lightweight-charts';
import { Search, RefreshCw, ExternalLink, Star, ShieldCheck, ArrowDownUp, Filter } from 'lucide-react';
import {
  fetchMarkets, fetchCandles, routeFor, quote, swap, walletOn, balanceOf, poolUrl, decimalsOf, connectedAccount, contractLinks,
  type Market, type Candle, type TradeRoute,
} from '../../services/marketsService';
import { HyperliquidPanel, HyperliquidPairPanel, ThorPanel } from './VenuePanels';

const FAMILIES = ['SwapinDEX', 'Uniswap', 'PancakeSwap', 'QuickSwap', 'Hyperliquid', 'THORChain'];
const TFS = ['1m', '5m', '15m', '1h', '4h', '1D'] as const;
const TF_SEC: Record<typeof TFS[number], number> = { '1m': 60, '5m': 300, '15m': 900, '1h': 3600, '4h': 14_400, '1D': 86_400 };
const LS = { quote: 'wxc.dex.quote.v2', dust: 'wxc.dex.dust.v1', families: 'wxc.dex.families.v1', favs: 'wxc.dex.favs.v1', last: 'wxc.dex.last.v1' };

const load = <T,>(k: string, d: T): T => { try { return JSON.parse(localStorage.getItem(k) ?? 'null') ?? d; } catch { return d; } };
const fmt = (v: number | null | undefined, usd = false) => {
  if (v == null || !Number.isFinite(v)) return '—';
  const a = Math.abs(v);
  const s = a >= 1e9 ? `${(v / 1e9).toFixed(2)}B` : a >= 1e6 ? `${(v / 1e6).toFixed(2)}M` : a >= 1e3 ? `${(v / 1e3).toFixed(2)}K`
    : a >= 1 ? v.toFixed(4).replace(/\.?0+$/, '') : a === 0 ? '0' : v.toPrecision(4);
  return usd ? `$${s}` : s;
};
// Normalise wrapped/bridged names so the quote filter groups sensibly.
const quoteKey = (s: string) => s.replace(/^(USDC\.e|USDbC)$/i, 'USDC').replace(/^(USDT0|USDt|USD₮0?)$/i, 'USDT')
  .replace(/^(WBTC|cbBTC|BTCB|tBTC)$/i, 'BTC').replace(/^W(ETH|BNB|POL|MATIC|AVAX|ALT)$/i, '$1').replace(/^MATIC$/i, 'POL').toUpperCase();

export default function MarketsTerminal() {
  const [markets, setMarkets] = useState<Market[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [chainFilter, setChainFilter] = useState<string>('all');
  const [families, setFamilies] = useState<string[]>(() => load(LS.families, FAMILIES));
  const [quoteTab, setQuoteTab] = useState<string>(() => load(LS.quote, 'ALL'));
  const [showDust, setShowDust] = useState<boolean>(() => load(LS.dust, false));
  const [favs, setFavs] = useState<string[]>(() => load(LS.favs, []));
  const [sort, setSort] = useState<'volume' | 'liquidity' | 'change'>('volume');
  const [limit, setLimit] = useState(150);
  const [selectedId, setSelectedId] = useState<string | null>(() => localStorage.getItem(LS.last));
  const [showFilters, setShowFilters] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try { setMarkets((await fetchMarkets()).markets); setError(null); }
    catch (err) { setError(err instanceof Error ? err.message : String(err)); }
    finally { setLoading(false); }
  };
  useEffect(() => { refresh(); const t = setInterval(refresh, 120_000); return () => clearInterval(t); }, []);
  useEffect(() => { localStorage.setItem(LS.families, JSON.stringify(families)); }, [families]);
  useEffect(() => { localStorage.setItem(LS.quote, JSON.stringify(quoteTab)); }, [quoteTab]);
  useEffect(() => { localStorage.setItem(LS.dust, JSON.stringify(showDust)); }, [showDust]);
  useEffect(() => { localStorage.setItem(LS.favs, JSON.stringify(favs)); }, [favs]);

  const chains = useMemo(() => [...new Set((markets ?? []).map((m) => m.chain))].sort(), [markets]);
  const quoteOptions = useMemo(() => {
    const count = new Map<string, number>();
    for (const m of markets ?? []) count.set(quoteKey(m.quote.symbol), (count.get(quoteKey(m.quote.symbol)) ?? 0) + 1);
    const PRIORITY = ['USDC', 'USDT', 'ETH', 'BTC', 'BNB', 'SOL', 'POL', 'HYPE', 'WATT', 'ALT', 'DAI', 'RUNE', 'AVAX'];
    const rank = (q: string) => { const i = PRIORITY.indexOf(q); return i === -1 ? 100 : i; };
    return [...count.entries()]
      .filter(([q, n]) => rank(q) < 100 || n >= 8)
      .sort((a, b) => (rank(a[0]) - rank(b[0])) || (b[1] - a[1]))
      .slice(0, 18).map(([q]) => q);
  }, [markets]);

  const rows = useMemo(() => {
    const s = search.trim().toLowerCase();
    const list = (markets ?? []).filter((m) =>
      families.includes(m.family)
      && (chainFilter === 'all' || m.chain === chainFilter)
      && (showDust || !m.suspect || (s && m.pool.toLowerCase() === s))
      && (s ? `${m.base.symbol}/${m.quote.symbol} ${m.name} ${m.pool} ${m.venueLabel}`.toLowerCase().includes(s) : (quoteTab === 'ALL' ? m.version !== 'Pair' : quoteKey(m.quote.symbol) === quoteTab)));
    const key = (m: Market) => (sort === 'volume' ? m.volume24hUsd ?? -1 : sort === 'liquidity' ? m.liquidityUsd ?? -1 : m.change24h ?? -999);
    return list.sort((a, b) => (Number(favs.includes(b.id)) - Number(favs.includes(a.id))) || (key(b) - key(a)));
  }, [markets, search, families, chainFilter, quoteTab, showDust, sort, favs]);

  const selected = useMemo(() => (markets ?? []).find((m) => m.id === selectedId) ?? rows[0] ?? null, [markets, selectedId, rows]);
  useEffect(() => { if (selected) localStorage.setItem(LS.last, selected.id); }, [selected?.id]);

  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const chip = (on: boolean) => `px-2 py-1 rounded-md text-xs border whitespace-nowrap ${on ? 'bg-yellow-500/15 border-yellow-500/60 text-yellow-300' : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'}`;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr_340px] gap-3">
      {/* ------------------------------------------------------------ markets */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col min-h-[420px] xl:h-[calc(100vh-11rem)]">
        <div className="p-3 space-y-2 border-b border-slate-800">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search pair, token or address"
                className="w-full pl-8 pr-2 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm outline-none focus:border-yellow-600" />
            </div>
            <button onClick={() => setShowFilters((v) => !v)} title="Filters" className={`px-2 rounded-lg border ${showFilters ? 'border-yellow-600 text-yellow-300' : 'border-slate-800 text-slate-400'}`}><Filter className="w-4 h-4" /></button>
            <button onClick={refresh} title="Refresh" className="px-2 rounded-lg border border-slate-800 text-slate-400"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'thin' }}>
            {['ALL', ...quoteOptions].map((q) => (
              <button key={q} className={chip(quoteTab === q)} onClick={() => setQuoteTab(q)}>{q === 'ALL' ? 'All' : q}</button>
            ))}
          </div>
          {showFilters && (
            <>
              <div className="text-[11px] text-slate-500 uppercase tracking-wide">Venues</div>
              <div className="flex gap-1 flex-wrap">
                {FAMILIES.map((f) => <button key={f} className={chip(families.includes(f))} onClick={() => setFamilies(toggle(families, f))}>{f}</button>)}
              </div>
              <div className="flex gap-2">
                <select value={chainFilter} onChange={(e) => setChainFilter(e.target.value)} className="flex-1 bg-slate-950 border border-slate-800 rounded-lg text-xs px-2 py-1.5">
                  <option value="all">All chains</option>
                  {chains.map((c) => <option key={c}>{c}</option>)}
                </select>
                <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="flex-1 bg-slate-950 border border-slate-800 rounded-lg text-xs px-2 py-1.5">
                  <option value="volume">Sort: 24h volume</option>
                  <option value="liquidity">Sort: liquidity</option>
                  <option value="change">Sort: 24h change</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-400">
                <input type="checkbox" checked={showDust} onChange={(e) => setShowDust(e.target.checked)} />
                Show low-liquidity and suspicious pools ({(markets ?? []).filter((m) => m.suspect).length})
              </label>
            </>
          )}
        </div>
        <div className="px-3 py-1.5 text-[11px] text-slate-500 flex justify-between border-b border-slate-800">
          <span>{rows.length.toLocaleString()} of {(markets?.length ?? 0).toLocaleString()} pairs</span><span>24h vol · change</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {error && <div className="p-3 text-sm text-red-400">{error}</div>}
          {!markets && !error && <div className="p-4 text-sm text-slate-400">Loading markets…</div>}
          {rows.slice(0, limit).map((m) => (
            <button key={m.id} onClick={() => setSelectedId(m.id)}
              className={`w-full text-left px-3 py-2 flex items-center gap-2 border-b border-slate-800/60 hover:bg-slate-800/50 ${selected?.id === m.id ? 'bg-slate-800/80' : ''}`}>
              <span onClick={(e) => { e.stopPropagation(); setFavs(toggle(favs, m.id)); }} className="shrink-0">
                <Star className={`w-3.5 h-3.5 ${favs.includes(m.id) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'}`} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium truncate">{m.base.symbol}<span className="text-slate-500">/{m.quote.symbol}</span></span>
                <span className="block text-[11px] text-slate-500 truncate">{m.venueLabel} · {m.chain}</span>
              </span>
              <span className="text-right shrink-0">
                <span className="block text-xs">{fmt(m.volume24hUsd, true)}</span>
                <span className={`block text-[11px] ${(m.change24h ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{m.change24h == null ? '' : `${m.change24h >= 0 ? '+' : ''}${m.change24h.toFixed(2)}%`}</span>
              </span>
            </button>
          ))}
          {rows.length > limit && <button onClick={() => setLimit((l) => l + 150)} className="w-full py-3 text-sm text-slate-400 hover:text-white">Show more</button>}
        </div>
      </div>

      {/* --------------------------------------------------------------- chart */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 min-w-0">
        {selected ? <MarketChart market={selected} /> : <div className="p-8 text-slate-400">Pick a market.</div>}
      </div>

      {/* ---------------------------------------------------------------- trade */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
        {selected && <TradePanel key={selected.id} market={selected} />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------- chart ----

function MarketChart({ market: m }: { market: Market }) {
  const box = useRef<HTMLDivElement>(null);
  const chart = useRef<IChartApi | null>(null);
  const candleS = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volS = useRef<ISeriesApi<'Histogram'> | null>(null);
  const [tf, setTf] = useState<typeof TFS[number]>('1h');
  const [candles, setCandles] = useState<Candle[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hover, setHover] = useState<Candle | null>(null);

  useEffect(() => {
    if (!box.current) return undefined;
    const c = createChart(box.current, {
      height: 460,
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: '#94a3b8', fontSize: 11 },
      grid: { vertLines: { color: 'rgba(51,65,85,0.25)' }, horzLines: { color: 'rgba(51,65,85,0.25)' } },
      crosshair: { mode: CrosshairMode.Normal, vertLine: { color: '#64748b', style: LineStyle.Dashed }, horzLine: { color: '#64748b', style: LineStyle.Dashed } },
      rightPriceScale: { borderColor: '#334155', minimumWidth: 72 },
      timeScale: { borderColor: '#334155', timeVisible: true, secondsVisible: false },
    });
    candleS.current = c.addCandlestickSeries({
      upColor: '#22c55e', downColor: '#ef4444', borderUpColor: '#22c55e', borderDownColor: '#ef4444', wickUpColor: '#22c55e', wickDownColor: '#ef4444',
      priceFormat: { type: 'custom', formatter: (v: number) => fmt(v), minMove: 1e-12 },
    });
    volS.current = c.addHistogramSeries({ priceScaleId: 'vol', priceFormat: { type: 'custom', formatter: (v: number) => fmt(v) } });
    c.priceScale('vol').applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
    c.subscribeCrosshairMove((p: MouseEventParams<Time>) => {
      const d = p.time && candleS.current ? p.seriesData.get(candleS.current) as unknown as Candle | undefined : undefined;
      const v = p.time && volS.current ? p.seriesData.get(volS.current) as { value: number } | undefined : undefined;
      setHover(d ? { ...d, volume: v?.value ?? 0 } : null);
    });
    const ro = new ResizeObserver(() => box.current && c.applyOptions({ width: box.current.clientWidth }));
    ro.observe(box.current);
    chart.current = c;
    return () => { ro.disconnect(); c.remove(); chart.current = null; };
  }, []);

  // Full history: the newest page loads first; scrolling near the left edge pages back
  // (before = oldest candle) until the source has nothing older.
  const page = useRef({ key: '', loading: false, done: false, shift: 0, fit: true });
  useEffect(() => {
    let cancelled = false;
    const key = `${m.id}|${tf}`;
    page.current = { key, loading: false, done: false, shift: 0, fit: true };
    renderedLen.current = 0;
    setCandles(null); setError(null);
    fetchCandles(m.id, tf, 0, !!m.inverted).then((c) => { if (!cancelled) setCandles(c); }).catch((e) => { if (!cancelled) setError(e.message); });
    // live refresh: merge the newest page into whatever history is loaded
    const t = setInterval(() => fetchCandles(m.id, tf, 0, !!m.inverted).then((fresh) => {
      if (cancelled || !fresh.length) return;
      setCandles((cur) => {
        if (!cur?.length) return fresh;
        const first = fresh[0].time;
        return [...cur.filter((c) => c.time < first), ...fresh];
      });
    }).catch(() => {}), tf === '1m' ? 15_000 : 60_000);
    return () => { cancelled = true; clearInterval(t); };
  }, [m.id, tf]);

  const loadOlder = useRef<() => void>(() => {});
  loadOlder.current = () => {
    const p = page.current;
    if (p.loading || p.done || !candles?.length) return;
    p.loading = true;
    const key = p.key, oldest = candles[0].time;
    fetchCandles(m.id, tf, oldest, !!m.inverted).then((older) => {
      if (page.current.key !== key) return;
      const add = older.filter((c) => c.time < oldest);
      if (!add.length) { page.current.done = true; return; }
      page.current.shift = add.length;
      setCandles((cur) => [...add, ...(cur ?? [])]);
    }).catch(() => { page.current.done = true; }).finally(() => { page.current.loading = false; });
  };
  useEffect(() => {
    const c = chart.current; if (!c) return undefined;
    const onRange = (r: { from: number; to: number } | null) => { if (r && r.from < 30) loadOlder.current(); };
    c.timeScale().subscribeVisibleLogicalRangeChange(onRange);
    return () => c.timeScale().unsubscribeVisibleLogicalRangeChange(onRange);
  }, []);

  // Thin pools only print a candle when someone trades. Fill every empty period up to
  // now with a flat candle at the last price (muted red, no volume) so the chart shows
  // real time instead of a few candles squashed together.
  const renderedLen = useRef(0);
  useEffect(() => {
    const raw = (candles ?? []).filter((c, i, a) => i === 0 || c.time > a[i - 1].time);
    const step = TF_SEC[tf];
    const FLAT = 'rgba(239,68,68,0.45)';
    type Pt = Candle & { flat?: boolean };
    const data: Pt[] = [];
    const nowBucket = Math.floor(Date.now() / 1000 / step) * step;
    for (let i = 0; i < raw.length; i++) {
      const c = raw[i];
      if (data.length) {
        const prev = data[data.length - 1];
        for (let t = prev.time + step; t < c.time && data.length < 20_000; t += step) {
          data.push({ time: t, open: prev.close, high: prev.close, low: prev.close, close: prev.close, volume: 0, flat: true });
        }
      }
      data.push(c);
    }
    const lastC = data[data.length - 1];
    if (lastC) for (let t = lastC.time + step; t <= nowBucket && data.length < 20_000; t += step) {
      data.push({ time: t, open: lastC.close, high: lastC.close, low: lastC.close, close: lastC.close, volume: 0, flat: true });
    }
    const shown = data.slice(-6000);                         // keep the chart responsive
    const ts = chart.current?.timeScale();
    const before = ts?.getVisibleLogicalRange();
    candleS.current?.setData(shown.map((c) => (c.flat
      ? { time: c.time as UTCTimestamp, open: c.open, high: c.high, low: c.low, close: c.close, color: FLAT, borderColor: FLAT, wickColor: FLAT }
      : { time: c.time as UTCTimestamp, open: c.open, high: c.high, low: c.low, close: c.close })));
    volS.current?.setData(shown.map((c) => ({ time: c.time as UTCTimestamp, value: c.volume, color: c.close >= c.open ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)' })));
    const p = page.current;
    const grew = shown.length - renderedLen.current;
    renderedLen.current = shown.length;
    if (!shown.length) return;
    if (p.fit) {
      // open on the most recent ~150 periods; older ones are a scroll away
      p.fit = false;
      ts?.setVisibleLogicalRange({ from: Math.max(0, shown.length - 150), to: shown.length + 2 });
    } else if (p.shift && before) {
      ts?.setVisibleLogicalRange({ from: before.from + grew, to: before.to + grew });
      p.shift = 0;
    }
  }, [candles]);

  const last = candles?.[candles.length - 1];
  const shown = hover ?? last;
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-xl font-bold">{m.base.symbol}<span className="text-slate-500">/{m.quote.symbol}</span></div>
          <div className="text-xs text-slate-400">{m.venueLabel}{m.fee ? ` · ${m.fee}%` : ''} · {m.chain}
          </div>
          {contractLinks(m).length > 0 && (
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-[11px]">
              {contractLinks(m).map((c) => (
                <a key={c.label + c.address} href={c.url} target="_blank" rel="noopener noreferrer" title={c.address}
                  className="text-slate-500 hover:text-yellow-400 inline-flex items-center gap-0.5">
                  {c.label} {c.address.slice(0, 6)}…{c.address.slice(-4)} <ExternalLink className="w-3 h-3" />
                </a>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-4 text-xs">
          <div><div className="text-slate-500">Price</div><div className="font-semibold">{fmt(m.price)} {m.quote.symbol}</div><div className="text-slate-500">{fmt(m.priceUsd, true)}</div></div>
          <div><div className="text-slate-500">24h</div><div className={(m.change24h ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}>{m.change24h == null ? '—' : `${m.change24h.toFixed(2)}%`}</div></div>
          <div><div className="text-slate-500">Volume</div><div>{fmt(m.volume24hUsd, true)}</div></div>
          <div><div className="text-slate-500">Liquidity</div><div>{fmt(m.liquidityUsd, true)}</div></div>
        </div>
      </div>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-[11px] font-mono flex gap-3">
          {shown && <>
            <span className="text-slate-400">O <span className="text-slate-200">{fmt(shown.open)}</span></span>
            <span className="text-slate-400">H <span className="text-slate-200">{fmt(shown.high)}</span></span>
            <span className="text-slate-400">L <span className="text-slate-200">{fmt(shown.low)}</span></span>
            <span className="text-slate-400">C <span className={shown.close >= shown.open ? 'text-emerald-400' : 'text-red-400'}>{fmt(shown.close)}</span></span>
            <span className="text-slate-400">V <span className="text-slate-200">{fmt(shown.volume)}</span></span>
          </>}
        </div>
        <div className="flex gap-1">
          {TFS.map((t) => <button key={t} onClick={() => setTf(t)} className={`px-2 py-1 rounded text-xs ${tf === t ? 'bg-yellow-500 text-black' : 'bg-slate-800 text-slate-300'}`}>{t}</button>)}
        </div>
      </div>
      <div className="relative">
        <div ref={box} className="w-full" />
        {(!candles || error || candles.length === 0) && (
          <div className="absolute inset-0 grid place-items-center text-sm text-slate-400 bg-slate-950/60 rounded">
            {error ? `Chart unavailable: ${error}` : !candles ? 'Loading chart…' : 'No trades in this timeframe yet.'}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------- trade ----

function TradePanel({ market: m }: { market: Market }) {
  const route: TradeRoute = useMemo(() => routeFor(m), [m]);
  if (route.kind === 'hl') return <HyperliquidPanel market={m} spot={route.spot} />;
  if (route.kind === 'hlpair') return <HyperliquidPairPanel market={m} />;
  if (route.kind === 'thor') return <ThorPanel market={m} />;
  if (route.kind === 'none') return <div className="space-y-2"><div className="font-semibold">Trade {m.base.symbol}/{m.quote.symbol}</div><p className="text-sm text-slate-400">{route.reason}</p></div>;
  return <EvmTradePanel market={m} route={route} />;
}

function EvmTradePanel({ market: m, route }: { market: Market; route: Extract<TradeRoute, { kind: 'v2' | 'v3' | 'agg' }> }) {
  const [sell, setSell] = useState(false);
  const [amount, setAmount] = useState('');
  const [out, setOut] = useState<string | null>(null);
  const [quoteErr, setQuoteErr] = useState<string | null>(null);
  const [slippage, setSlippage] = useState(100);
  const [useNative, setUseNative] = useState(true);
  const [step, setStep] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hash, setHash] = useState<string | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);

  const inSym = sell ? m.base.symbol : m.quote.symbol;
  const outSym = sell ? m.quote.symbol : m.base.symbol;
  const chain = route.chain;
  const wrapped = chain?.wrappedNative.toLowerCase();
  // the chain's native coin can stand in for its wrapped token on either side of the pair
  const wrappedIn = (sell ? m.base.address : m.quote.address)?.toLowerCase() === wrapped;
  const wrappedOut = (sell ? m.quote.address : m.base.address)?.toLowerCase() === wrapped;
  const nativeApplies = wrappedIn || (wrappedOut && route.kind !== 'v3'); // v3 router pays out wrapped
  const [via, setVia] = useState<string[] | null>(null);

  useEffect(() => {
    if (!amount || Number(amount) <= 0) { setOut(null); setQuoteErr(null); return undefined; }
    let cancelled = false;
    const t = setTimeout(() => {
      quote(m, route, sell, amount, useNative && nativeApplies)
        .then((q) => { if (!cancelled) { setOut(ethers.formatUnits(q.amountOut, q.decimalsOut)); setVia(q.via ?? null); setQuoteErr(null); } })
        .catch((e) => { if (!cancelled) { setOut(null); setQuoteErr(e.shortMessage ?? e.message); } });
    }, 350);
    return () => { cancelled = true; clearTimeout(t); };
  }, [amount, sell, m.id, useNative]);

  useEffect(() => {
    if (!account || !chain) { setBalance(null); return; }
    const token = sell ? m.base.address! : m.quote.address!;
    const native = useNative && wrappedIn;
    balanceOf(chain, native ? 'native' : token, account)
      .then(async (b) => {
        const dec = native ? 18 : await decimalsOf(chain, token);
        setBalance(ethers.formatUnits(b, dec));
      }).catch(() => setBalance(null));
  }, [account, sell, m.id, useNative, hash]);

  useEffect(() => { connectedAccount().then((a) => a && setAccount((x) => x ?? a)); }, []);
  const connect = async () => { try { const s = await walletOn(route.chain); setAccount(await s.getAddress()); } catch (e) { setError((e as Error).message); } };
  const go = async () => {
    setError(null); setHash(null);
    try {
      const h = await swap({ m, route, sell, amountIn: amount, slippageBps: slippage, useNative: useNative && nativeApplies, onStep: setStep });
      setHash(h); setAmount('');
    } catch (e) {
      const err = e as { code?: string; shortMessage?: string; message: string };
      setError(err.code === 'ACTION_REJECTED' ? 'Cancelled in the wallet.' : err.shortMessage ?? err.message);
    } finally { setStep(null); }
  };
  const label = (s: string) => {
    const w = [m.base, m.quote].find((t) => t.address?.toLowerCase() === wrapped);
    return useNative && nativeApplies && w && s === w.symbol ? route.chain.native.symbol : s;
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 bg-slate-950 rounded-lg p-1">
        <button onClick={() => setSell(false)} className={`py-2 rounded-md text-sm font-semibold ${!sell ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>Buy {m.base.symbol}</button>
        <button onClick={() => setSell(true)} className={`py-2 rounded-md text-sm font-semibold ${sell ? 'bg-red-600 text-white' : 'text-slate-400'}`}>Sell {m.base.symbol}</button>
      </div>
      <div className="bg-slate-950 rounded-lg p-3">
        <div className="flex justify-between text-xs text-slate-500"><span>You pay</span>
          {balance != null && <button className="hover:text-slate-300" onClick={() => setAmount(balance)}>Balance {fmt(Number(balance))}</button>}</div>
        <div className="flex items-center gap-2">
          <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(',', '.'))} placeholder="0.0" className="flex-1 bg-transparent text-xl outline-none min-w-0" />
          <span className="text-sm font-semibold">{label(inSym)}</span>
        </div>
      </div>
      <div className="flex justify-center -my-1"><button onClick={() => setSell((v) => !v)} className="p-1.5 rounded-lg bg-slate-800"><ArrowDownUp className="w-4 h-4" /></button></div>
      <div className="bg-slate-950 rounded-lg p-3">
        <div className="text-xs text-slate-500">You receive (estimated)</div>
        <div className="flex items-center gap-2">
          <div className="flex-1 text-xl">{out ? fmt(Number(out)) : '—'}</div>
          <span className="text-sm font-semibold">{label(outSym)}</span>
        </div>
        {quoteErr && <div className="text-xs text-red-400 mt-1">Quote failed: {quoteErr}</div>}
        {via && via.length > 0 && <div className="text-[11px] text-slate-500 mt-1">Best price via {via.slice(0, 3).join(', ')}{via.length > 3 ? ` +${via.length - 3}` : ''}</div>}
      </div>
      {nativeApplies && (
        <label className="flex items-center gap-2 text-xs text-slate-300">
          <input type="checkbox" checked={useNative} onChange={(e) => setUseNative(e.target.checked)} />
          Use native {route.chain.native.symbol} (not the wrapped token)
        </label>
      )}
      <div className="flex items-center gap-2 text-xs text-slate-400">Slippage
        {[50, 100, 300].map((b) => <button key={b} onClick={() => setSlippage(b)} className={`px-2 py-1 rounded ${slippage === b ? 'bg-yellow-500 text-black' : 'bg-slate-800'}`}>{b / 100}%</button>)}
      </div>
      {!account ? (
        <button onClick={connect} className="w-full py-3 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black font-semibold">Connect wallet · {route.chain.name}</button>
      ) : (
        <button onClick={go} disabled={!!step || !out || !amount} className={`w-full py-3 rounded-lg font-semibold disabled:opacity-50 ${sell ? 'bg-red-600 hover:bg-red-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}>
          {step ?? `${sell ? 'Sell' : 'Buy'} ${m.base.symbol}`}
        </button>
      )}
      {error && <div className="text-xs text-red-400 break-words">{error}</div>}
      {hash && <a href={`${route.chain.explorer}/tx/${hash}`} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-400 hover:underline inline-flex items-center gap-1">Swap confirmed · view transaction <ExternalLink className="w-3 h-3" /></a>}
      <div className="text-[11px] text-slate-500 flex gap-1.5 items-start">
        <ShieldCheck className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-500" />
        <span>{route.kind === 'agg'
          ? `Swaps from your wallet through the KyberSwap aggregator on ${route.chain.name}, which finds the best price across ${m.family} and the chain's other DEXs. Approvals only ever go to Kyber's verified router.`
          : `Goes straight from your wallet to the ${m.venueLabel} router on ${route.chain.name}. The router is checked on-chain against this pool before anything is approved.`}</span>
      </div>
    </div>
  );
}
