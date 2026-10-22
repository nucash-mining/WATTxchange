import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  createChart, ColorType, CrosshairMode, LineStyle,
  type IChartApi, type ISeriesApi, type UTCTimestamp, type MouseEventParams, type Time,
} from 'lightweight-charts';
import { ArrowLeftRight, CandlestickChart, LineChart } from 'lucide-react';
import {
  loadIndexedHistory, loadPoolTrades, rangeSupported, RANGE_SECONDS,
  type HistoryRange, type LpPool, type PoolTick,
} from '../../services/liquidityService';

type Range = HistoryRange | 'ALL';
const RANGES: Range[] = ['1D', '7D', '30D', '90D', 'ALL'];
const INTERVALS = [
  { id: '5m', sec: 300 }, { id: '15m', sec: 900 }, { id: '1h', sec: 3600 },
  { id: '4h', sec: 14_400 }, { id: '1D', sec: 86_400 }, { id: '1W', sec: 604_800 },
] as const;
type IntervalId = typeof INTERVALS[number]['id'];
const DEFAULT_INTERVAL: Record<Range, IntervalId> = { '1D': '5m', '7D': '1h', '30D': '4h', '90D': '1D', ALL: '1D' };

const fmt = (v: number) => {
  if (!Number.isFinite(v)) return '—';
  const a = Math.abs(v);
  if (a >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (a >= 1e3) return `${(v / 1e3).toFixed(2)}K`;
  if (a >= 1) return v.toFixed(4);
  if (a === 0) return '0';
  return v.toPrecision(4);
};

interface Candle { time: UTCTimestamp; open: number; high: number; low: number; close: number; volume: number }
interface LiqPoint { time: UTCTimestamp; value: number }

const THEME = {
  layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: '#94a3b8', fontSize: 11 },
  grid: { vertLines: { color: 'rgba(51,65,85,0.25)' }, horzLines: { color: 'rgba(51,65,85,0.25)' } },
  crosshair: { mode: CrosshairMode.Normal, vertLine: { color: '#64748b', style: LineStyle.Dashed }, horzLine: { color: '#64748b', style: LineStyle.Dashed } },
  rightPriceScale: { borderColor: '#334155', minimumWidth: 72 },
  timeScale: { borderColor: '#334155', timeVisible: true, secondsVisible: false },
};

/** TradingView-style chart for one pool: candles + volume, with a synced liquidity pane. */
const PoolChart: React.FC<{ pool: LpPool }> = ({ pool }) => {
  const priceBox = useRef<HTMLDivElement>(null);
  const liqBox = useRef<HTMLDivElement>(null);
  const priceChart = useRef<IChartApi | null>(null);
  const liqChart = useRef<IChartApi | null>(null);
  const candleSeries = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const lineSeries = useRef<ISeriesApi<'Line'> | null>(null);
  const volSeries = useRef<ISeriesApi<'Histogram'> | null>(null);
  const liqSeries = useRef<ISeriesApi<'Area'> | null>(null);

  const [range, setRange] = useState<Range>('ALL');
  const [interval, setInterval] = useState<IntervalId>('1D');
  const [style, setStyle] = useState<'candles' | 'line'>('candles');
  // Price the project token in the base coin (WATT in WPOL), not the other way round.
  const [flip, setFlip] = useState(() => {
    const quoteLike = (t: LpPool['token0']) => ['ALT', 'POL', 'USDC', 'USDT'].includes(t.priceKey ?? '');
    return quoteLike(pool.token0) && !quoteLike(pool.token1);
  });
  const [ticks, setTicks] = useState<PoolTick[] | null>(null);
  const [source, setSource] = useState<'indexer' | 'chain' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hover, setHover] = useState<{ c?: Candle; liq?: number } | null>(null);

  const base = flip ? pool.token1.label : pool.token0.label;
  const quote = flip ? pool.token0.label : pool.token1.label;

  // Full history from the indexer; the chain directly if it is unavailable.
  useEffect(() => {
    let cancelled = false;
    setTicks(null);
    setError(null);
    (async () => {
      const indexed = await loadIndexedHistory(pool);
      if (cancelled) return;
      if (indexed && indexed.ticks.length) {
        setTicks(indexed.ticks);
        setSource('indexer');
        return;
      }
      const fallback: HistoryRange = rangeSupported(pool.chain, '90D') ? '90D' : '30D';
      const { open, ticks: t, from } = await loadPoolTrades(pool, fallback);
      if (cancelled) return;
      setTicks(open ? [{ time: from, reserve0: open.reserve0, reserve1: open.reserve1, vol0: 0, vol1: 0 }, ...t] : t);
      setSource('chain');
    })().catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : String(e)); });
    return () => { cancelled = true; };
  }, [pool]);

  // Build candles and liquidity points for the chosen range / interval / direction.
  const { candles, liquidity } = useMemo(() => {
    if (!ticks?.length) return { candles: [] as Candle[], liquidity: [] as LiqPoint[] };
    const sec = INTERVALS.find((i) => i.id === interval)!.sec;
    const now = Math.floor(Date.now() / 1000);
    const start = range === 'ALL' ? 0 : now - RANGE_SECONDS[range];
    const price = (t: PoolTick) => (flip ? t.reserve0 / t.reserve1 : t.reserve1 / t.reserve0);
    const quoteReserve = (t: PoolTick) => (flip ? t.reserve0 : t.reserve1);
    const quoteVol = (t: PoolTick) => (flip ? t.vol0 : t.vol1);

    const out: Candle[] = [];
    const liq: LiqPoint[] = [];
    let prevClose: number | null = null;
    for (const t of ticks) {
      if (!(t.reserve0 > 0 && t.reserve1 > 0)) continue;
      const p = price(t);
      if (t.time < start) { prevClose = p; continue; }
      const bucket = (Math.floor(t.time / sec) * sec) as UTCTimestamp;
      const last = out[out.length - 1];
      if (last && last.time === bucket) {
        last.high = Math.max(last.high, p);
        last.low = Math.min(last.low, p);
        last.close = p;
        last.volume += quoteVol(t);
        liq[liq.length - 1].value = quoteReserve(t) * 2;
      } else {
        const open = prevClose ?? p;
        out.push({ time: bucket, open, high: Math.max(open, p), low: Math.min(open, p), close: p, volume: quoteVol(t) });
        liq.push({ time: bucket, value: quoteReserve(t) * 2 });
      }
      prevClose = p;
    }
    // A pool with no trades in range still has a price: show it as one flat candle.
    if (!out.length && prevClose != null) {
      const bucket = (Math.floor(now / sec) * sec) as UTCTimestamp;
      const lastTick = ticks[ticks.length - 1];
      out.push({ time: bucket, open: prevClose, high: prevClose, low: prevClose, close: prevClose, volume: 0 });
      liq.push({ time: bucket, value: quoteReserve(lastTick) * 2 });
    }
    return { candles: out, liquidity: liq };
  }, [ticks, range, interval, flip]);

  // Create both charts once and keep their time axes in step.
  useEffect(() => {
    if (!priceBox.current || !liqBox.current) return undefined;
    const pc = createChart(priceBox.current, { ...THEME, height: 340, timeScale: { ...THEME.timeScale, visible: false } });
    const lc = createChart(liqBox.current, { ...THEME, height: 130 });
    const priceFormat = { type: 'custom' as const, formatter: fmt, minMove: 1e-12 };
    candleSeries.current = pc.addCandlestickSeries({
      upColor: '#22c55e', downColor: '#ef4444', borderUpColor: '#22c55e', borderDownColor: '#ef4444',
      wickUpColor: '#22c55e', wickDownColor: '#ef4444', priceFormat,
    });
    lineSeries.current = pc.addLineSeries({ color: '#22d3ee', lineWidth: 2, priceFormat, visible: false });
    volSeries.current = pc.addHistogramSeries({ priceScaleId: 'vol', priceFormat: { type: 'custom', formatter: fmt } });
    pc.priceScale('vol').applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
    liqSeries.current = lc.addAreaSeries({
      lineColor: '#a78bfa', topColor: 'rgba(167,139,250,0.35)', bottomColor: 'rgba(167,139,250,0.02)', lineWidth: 2,
      priceFormat: { type: 'custom', formatter: fmt },
    });
    priceChart.current = pc;
    liqChart.current = lc;

    let syncing = false;
    const link = (from: IChartApi, to: IChartApi) => from.timeScale().subscribeVisibleLogicalRangeChange((r) => {
      if (syncing || !r) return;
      syncing = true;
      to.timeScale().setVisibleLogicalRange(r);
      syncing = false;
    });
    link(pc, lc);
    link(lc, pc);

    const onMove = (param: MouseEventParams<Time>) => {
      if (!param.time) { setHover(null); return; }
      const c = candleSeries.current ? param.seriesData.get(candleSeries.current) as Candle | undefined : undefined;
      const l = lineSeries.current ? param.seriesData.get(lineSeries.current) as { value: number } | undefined : undefined;
      const v = volSeries.current ? param.seriesData.get(volSeries.current) as { value: number } | undefined : undefined;
      const lq = liqSeries.current ? param.seriesData.get(liqSeries.current) as { value: number } | undefined : undefined;
      setHover({
        c: c ? { ...c, volume: v?.value ?? 0 } : l ? { time: param.time as UTCTimestamp, open: l.value, high: l.value, low: l.value, close: l.value, volume: v?.value ?? 0 } : undefined,
        liq: lq?.value,
      });
    };
    pc.subscribeCrosshairMove(onMove);
    lc.subscribeCrosshairMove(onMove);

    const ro = new ResizeObserver(() => {
      const w = priceBox.current?.clientWidth ?? 0;
      if (w) { pc.applyOptions({ width: w }); lc.applyOptions({ width: w }); }
    });
    ro.observe(priceBox.current);
    return () => {
      ro.disconnect();
      pc.remove();
      lc.remove();
      priceChart.current = liqChart.current = null;
      candleSeries.current = null; lineSeries.current = null; volSeries.current = null; liqSeries.current = null;
    };
  }, []);

  useEffect(() => {
    candleSeries.current?.setData(candles);
    lineSeries.current?.setData(candles.map((c) => ({ time: c.time, value: c.close })));
    volSeries.current?.setData(candles.map((c) => ({
      time: c.time, value: c.volume, color: c.close >= c.open ? 'rgba(34,197,94,0.45)' : 'rgba(239,68,68,0.45)',
    })));
    liqSeries.current?.setData(liquidity);
    priceChart.current?.timeScale().fitContent();
    liqChart.current?.timeScale().fitContent();
  }, [candles, liquidity]);

  useEffect(() => {
    candleSeries.current?.applyOptions({ visible: style === 'candles' });
    lineSeries.current?.applyOptions({ visible: style === 'line' });
  }, [style]);

  const last = candles[candles.length - 1];
  const first = candles[0];
  const shown = hover?.c ?? last;
  const change = shown && first ? ((shown.close - first.open) / first.open) * 100 : null;
  const liqNow = hover?.liq ?? liquidity[liquidity.length - 1]?.value;

  const pickRange = (r: Range) => { setRange(r); setInterval(DEFAULT_INTERVAL[r]); };
  const btn = (active: boolean) => `px-2 py-1 rounded text-xs ${active ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 flex-wrap">
          {RANGES.map((r) => <button key={r} onClick={() => pickRange(r)} className={btn(range === r)}>{r === 'ALL' ? 'All' : r}</button>)}
          <span className="w-px h-4 bg-slate-700 mx-1" />
          {INTERVALS.map((i) => <button key={i.id} onClick={() => setInterval(i.id)} className={btn(interval === i.id)}>{i.id}</button>)}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setStyle('candles')} title="Candles" className={btn(style === 'candles')}><CandlestickChart className="w-3.5 h-3.5" /></button>
          <button onClick={() => setStyle('line')} title="Line" className={btn(style === 'line')}><LineChart className="w-3.5 h-3.5" /></button>
          <button onClick={() => setFlip((v) => !v)} title={`Show ${quote} priced in ${base}`} className={btn(false)}><ArrowLeftRight className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      <div className="text-xs flex flex-wrap gap-x-3 gap-y-1 font-mono">
        <span className="text-slate-200 font-sans font-semibold">{base}/{quote}</span>
        {shown ? (
          <>
            <span className="text-slate-400">O <span className="text-slate-200">{fmt(shown.open)}</span></span>
            <span className="text-slate-400">H <span className="text-slate-200">{fmt(shown.high)}</span></span>
            <span className="text-slate-400">L <span className="text-slate-200">{fmt(shown.low)}</span></span>
            <span className="text-slate-400">C <span className={shown.close >= shown.open ? 'text-emerald-400' : 'text-red-400'}>{fmt(shown.close)}</span></span>
            {change != null && <span className={change >= 0 ? 'text-emerald-400' : 'text-red-400'}>{change >= 0 ? '+' : ''}{change.toFixed(2)}%</span>}
            <span className="text-slate-400">Vol <span className="text-slate-200">{fmt(shown.volume)} {quote}</span></span>
          </>
        ) : <span className="text-slate-500">—</span>}
      </div>

      <div className="relative rounded-lg border border-slate-800 bg-slate-950/40">
        <div ref={priceBox} className="w-full" />
        <div className="px-2 pt-1 text-[11px] text-slate-400 border-t border-slate-800">
          Liquidity <span className="text-violet-300">{liqNow != null ? `${fmt(liqNow)} ${quote}` : '—'}</span>
          <span className="text-slate-600"> · total pool value in {quote}</span>
        </div>
        <div ref={liqBox} className="w-full" />
        {(!ticks || error || !candles.length) && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400 bg-slate-950/70 rounded-lg px-4 text-center">
            {error ? `Could not load history: ${error}` : !ticks ? 'Loading full pool history…' : 'No trades in this range.'}
          </div>
        )}
      </div>
      <div className="text-[11px] text-slate-500">
        {source === 'indexer' ? 'Full history since the pool was created, from every swap and liquidity change on chain.'
          : source === 'chain' ? 'Recent history read directly from the chain (the history service is unavailable).' : ''}
      </div>
    </div>
  );
};

export default PoolChart;
