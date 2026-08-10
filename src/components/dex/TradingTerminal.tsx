import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createChart, ColorType, type IChartApi } from 'lightweight-charts';
import { ChevronDown, TrendingUp, TrendingDown, Crosshair } from 'lucide-react';
import { usePrices } from '../../hooks/usePrices';
import PerpOrderBook from './PerpOrderBook';
import toast from 'react-hot-toast';

/**
 * AsterDEX-style perps trading terminal: chart-dominant layout with an
 * order-book rail, order-entry panel and a positions drawer underneath.
 * Execution is mocked (positions live in component state); prices come
 * from priceService via usePrices, charts from lightweight-charts.
 */

type Timeframe = '15m' | '1h' | '4h' | '1d';
type Side = 'long' | 'short';
type OrderType = 'market' | 'limit';
type DrawerTab = 'positions' | 'orders' | 'history';

const TIMEFRAME_CONFIG: Record<Timeframe, { count: number; step: number }> = {
  '15m': { count: 96, step: 15 * 60 },
  '1h': { count: 168, step: 60 * 60 },
  '4h': { count: 180, step: 4 * 60 * 60 },
  '1d': { count: 90, step: 24 * 60 * 60 }
};

interface Market {
  id: string;
  base: string;
  quote: string;
  volume24h: string;
  openInterest: string;
  fundingRate: string;
  maxLev: number;
}

const MARKETS: Market[] = [
  { id: 'BTC-USDT', base: 'BTC', quote: 'USDT', volume24h: '$1.2B', openInterest: '$450M', fundingRate: '0.0100%', maxLev: 100 },
  { id: 'ETH-USDT', base: 'ETH', quote: 'USDT', volume24h: '$850M', openInterest: '$320M', fundingRate: '0.0080%', maxLev: 100 },
  { id: 'LTC-USDT', base: 'LTC', quote: 'USDT', volume24h: '$180M', openInterest: '$60M', fundingRate: '0.0100%', maxLev: 75 },
  { id: 'DOGE-USDT', base: 'DOGE', quote: 'USDT', volume24h: '$320M', openInterest: '$90M', fundingRate: '0.0100%', maxLev: 75 },
  { id: 'XMR-USDT', base: 'XMR', quote: 'USDT', volume24h: '$110M', openInterest: '$40M', fundingRate: '0.0100%', maxLev: 50 },
  { id: 'WTX-USDT', base: 'WTX', quote: 'USDT', volume24h: '$3.4M', openInterest: '$1.1M', fundingRate: '0.0125%', maxLev: 50 },
  { id: 'HTH-USDT', base: 'HTH', quote: 'USDT', volume24h: '$1.6M', openInterest: '$520K', fundingRate: '0.0125%', maxLev: 50 },
  { id: 'ALT-USDT', base: 'ALT', quote: 'USDT', volume24h: '$5.2M', openInterest: '$1.8M', fundingRate: '0.0150%', maxLev: 50 },
  { id: 'WATT-USDT', base: 'WATT', quote: 'USDT', volume24h: '$2.1M', openInterest: '$740K', fundingRate: '0.0125%', maxLev: 50 },
  { id: 'TROLL-USDT', base: 'TROLL', quote: 'USDT', volume24h: '$420K', openInterest: '$120K', fundingRate: '0.0150%', maxLev: 25 },
  { id: 'GHOST-USDT', base: 'GHOST', quote: 'USDT', volume24h: '$680K', openInterest: '$210K', fundingRate: '0.0150%', maxLev: 25 },
  { id: 'RTM-USDT', base: 'RTM', quote: 'USDT', volume24h: '$390K', openInterest: '$100K', fundingRate: '0.0150%', maxLev: 25 },
  { id: 'BTCZ-USDT', base: 'BTCZ', quote: 'USDT', volume24h: '$210K', openInterest: '$70K', fundingRate: '0.0150%', maxLev: 25 }
];

const MARKET_BASES = MARKETS.map(m => m.base);

interface Position {
  id: number;
  market: string;
  side: Side;
  size: number;        // in base units
  entryPrice: number;
  leverage: number;
  margin: number;      // quote collateral
  liqPrice: number;
  openedAt: number;
}

interface OpenOrder {
  id: number;
  market: string;
  side: Side;
  type: OrderType;
  price: number;
  size: number;
  leverage: number;
  placedAt: number;
}

interface Fill {
  id: number;
  market: string;
  side: Side | 'close';
  price: number;
  size: number;
  pnl?: number;
  time: number;
}

function buildSeries(basePrice: number, change24h: number, tf: Timeframe) {
  const { count, step } = TIMEFRAME_CONFIG[tf];
  const now = Math.floor(Date.now() / 1000);
  const startPrice = basePrice / (1 + (change24h || 0) / 100) || basePrice;
  const drift = Math.pow(basePrice / startPrice, 1 / count);

  const candles: { time: number; open: number; high: number; low: number; close: number }[] = [];
  const volumes: { time: number; value: number; color: string }[] = [];
  let prevClose = startPrice;
  for (let i = 0; i < count; i++) {
    const time = now - (count - 1 - i) * step;
    const open = prevClose;
    const noise = 1 + (Math.random() - 0.5) * 0.03;
    let close = open * drift * noise;
    if (i === count - 1) close = basePrice;
    const high = Math.max(open, close) * (1 + Math.random() * 0.012);
    const low = Math.min(open, close) * (1 - Math.random() * 0.012);
    candles.push({ time, open, high, low, close });
    volumes.push({
      time,
      value: Math.random() * 100 + 20,
      color: close >= open ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)'
    });
    prevClose = close;
  }
  return { candles, volumes };
}

// Real OHLC from Binance for coins it lists; app-native coins (ALT, WATT, …)
// have no exchange candles, so those fall back to buildSeries anchored to the
// real live spot price from priceService.
const BINANCE_SYMBOL: Record<string, string> = { BTC: 'BTCUSDT', ETH: 'ETHUSDT', LTC: 'LTCUSDT', DOGE: 'DOGEUSDT', BCH: 'BCHUSDT' };
const TF_TO_BINANCE: Record<Timeframe, string> = { '15m': '15m', '1h': '1h', '4h': '4h', '1d': '1d' };

async function fetchKlines(base: string, tf: Timeframe) {
  const sym = BINANCE_SYMBOL[base];
  if (!sym) return null;
  try {
    const url = `https://api.binance.com/api/v3/klines?symbol=${sym}&interval=${TF_TO_BINANCE[tf]}&limit=300`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const rows: unknown[][] = await res.json();
    const candles = rows.map((r) => ({
      time: Math.floor(Number(r[0]) / 1000),
      open: parseFloat(r[1] as string),
      high: parseFloat(r[2] as string),
      low: parseFloat(r[3] as string),
      close: parseFloat(r[4] as string),
    }));
    const volumes = rows.map((r) => ({
      time: Math.floor(Number(r[0]) / 1000),
      value: parseFloat(r[5] as string),
      color: parseFloat(r[4] as string) >= parseFloat(r[1] as string) ? '#10b98155' : '#ef444455',
    }));
    return { candles, volumes };
  } catch {
    return null;
  }
}

function fmtPrice(p: number): string {
  if (!isFinite(p)) return '—';
  if (p >= 1000) return p.toLocaleString(undefined, { maximumFractionDigits: 1 });
  if (p >= 1) return p.toFixed(2);
  return p.toPrecision(4);
}

const TradingTerminal: React.FC = () => {
  const [market, setMarket] = useState<Market>(MARKETS[0]);
  const [marketOpen, setMarketOpen] = useState(false);
  const [timeframe, setTimeframe] = useState<Timeframe>('1h');
  const [side, setSide] = useState<Side>('long');
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [leverage, setLeverage] = useState(10);
  const [margin, setMargin] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [drawerTab, setDrawerTab] = useState<DrawerTab>('positions');
  const [positions, setPositions] = useState<Position[]>([]);
  const [orders, setOrders] = useState<OpenOrder[]>([]);
  const [fills, setFills] = useState<Fill[]>([]);
  const [fundingIn, setFundingIn] = useState(3600 * 4 + 812);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const { getPrice } = usePrices(MARKET_BASES);
  const priceData = getPrice(market.base);
  const markPrice = priceData?.price || 0;
  const change24h = priceData?.changePercent24h || 0;
  const high24h = markPrice * (1 + Math.abs(change24h) / 100 + 0.006);
  const low24h = markPrice * (1 - Math.abs(change24h) / 100 - 0.006);

  // Funding countdown ticker
  useEffect(() => {
    const t = setInterval(() => setFundingIn(s => (s > 0 ? s - 1 : 8 * 3600)), 1000);
    return () => clearInterval(t);
  }, []);

  // Chart lifecycle
  useEffect(() => {
    const el = chartContainerRef.current;
    if (!el || !markPrice) return;

    const chart = createChart(el, {
      layout: {
        background: { type: ColorType.Solid, color: '#0b0e14' },
        textColor: '#8b93a7'
      },
      width: el.clientWidth,
      height: el.clientHeight || 480,
      grid: {
        vertLines: { color: '#141924' },
        horzLines: { color: '#141924' }
      },
      timeScale: {
        borderColor: '#1c2230',
        timeVisible: timeframe === '15m' || timeframe === '1h'
      },
      rightPriceScale: { borderColor: '#1c2230' },
      crosshair: { mode: 0 }
    });
    chartRef.current = chart;

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ef4444',
      borderUpColor: '#10b981',
      borderDownColor: '#ef4444',
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444'
    });
    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: ''
    });
    volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });

    // Instant synthetic series anchored to the live spot price, so the chart is
    // never blank while real candles load.
    const synth = buildSeries(markPrice, change24h, timeframe);
    candleSeries.setData(synth.candles as never);
    volumeSeries.setData(synth.volumes as never);
    chart.timeScale().fitContent();

    // Replace with REAL Binance OHLC for listed coins; refresh every 30s so the
    // chart tracks the live market.
    let cancelled = false;
    const loadReal = async () => {
      const real = await fetchKlines(market.base, timeframe);
      if (cancelled || !real || !chartRef.current) return;
      candleSeries.setData(real.candles as never);
      volumeSeries.setData(real.volumes as never);
      chart.timeScale().fitContent();
    };
    loadReal();
    const poll = setInterval(loadReal, 30000);

    const onResize = () => {
      chart.applyOptions({ width: el.clientWidth, height: el.clientHeight || 480 });
    };
    window.addEventListener('resize', onResize);
    return () => {
      cancelled = true;
      clearInterval(poll);
      window.removeEventListener('resize', onResize);
      chart.remove();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [market.id, timeframe, markPrice > 0]);

  const marginNum = parseFloat(margin) || 0;
  const notional = marginNum * leverage;
  const entryPrice = orderType === 'limit' ? parseFloat(limitPrice) || markPrice : markPrice;
  const sizeBase = entryPrice > 0 ? notional / entryPrice : 0;
  // Simple isolated-margin liquidation estimate with a 0.5% maintenance buffer.
  const liqPrice =
    side === 'long'
      ? entryPrice * (1 - 0.95 / leverage)
      : entryPrice * (1 + 0.95 / leverage);
  const takerFee = notional * 0.0005;

  const unrealized = (p: Position) => {
    const cur = getPrice(p.market.split('-')[0])?.price || p.entryPrice;
    const diff = p.side === 'long' ? cur - p.entryPrice : p.entryPrice - cur;
    return diff * p.size;
  };

  const submitOrder = () => {
    if (!marginNum || marginNum <= 0) {
      toast.error('Enter a margin amount');
      return;
    }
    if (orderType === 'limit' && !(parseFloat(limitPrice) > 0)) {
      toast.error('Enter a limit price');
      return;
    }
    if (orderType === 'limit') {
      const order: OpenOrder = {
        id: Date.now(),
        market: market.id,
        side,
        type: 'limit',
        price: parseFloat(limitPrice),
        size: sizeBase,
        leverage,
        placedAt: Date.now()
      };
      setOrders(o => [order, ...o]);
      toast.success(`Limit ${side} placed: ${sizeBase.toFixed(4)} ${market.base} @ ${fmtPrice(order.price)}`);
    } else {
      const pos: Position = {
        id: Date.now(),
        market: market.id,
        side,
        size: sizeBase,
        entryPrice,
        leverage,
        margin: marginNum,
        liqPrice,
        openedAt: Date.now()
      };
      setPositions(p => [pos, ...p]);
      setFills(f => [
        { id: Date.now(), market: market.id, side, price: entryPrice, size: sizeBase, time: Date.now() },
        ...f
      ]);
      toast.success(`${side === 'long' ? 'Long' : 'Short'} opened: ${sizeBase.toFixed(4)} ${market.base} @ ${fmtPrice(entryPrice)} (${leverage}x)`);
    }
    setMargin('');
  };

  const closePosition = (p: Position) => {
    const pnl = unrealized(p);
    setPositions(ps => ps.filter(x => x.id !== p.id));
    setFills(f => [
      {
        id: Date.now(),
        market: p.market,
        side: 'close',
        price: getPrice(p.market.split('-')[0])?.price || p.entryPrice,
        size: p.size,
        pnl,
        time: Date.now()
      },
      ...f
    ]);
    toast.success(`Position closed — PnL ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`);
  };

  const cancelOrder = (id: number) => {
    setOrders(o => o.filter(x => x.id !== id));
    toast('Order cancelled');
  };

  const fundingClock = useMemo(() => {
    const h = Math.floor(fundingIn / 3600);
    const m = Math.floor((fundingIn % 3600) / 60);
    const s = fundingIn % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, [fundingIn]);

  const changePositive = change24h >= 0;

  return (
    <div className="rounded-xl overflow-hidden border border-[#1c2230] bg-[#0b0e14] text-[13px]">
      {/* ── Market stats bar ─────────────────────────────────────────── */}
      <div className="flex items-stretch gap-0 border-b border-[#1c2230] overflow-x-auto">
        {/* Market selector */}
        <div className="relative">
          <button
            onClick={() => setMarketOpen(v => !v)}
            className="flex items-center gap-2 px-4 h-full min-h-[56px] hover:bg-[#12161f] transition-colors border-r border-[#1c2230]"
          >
            <img
              src={`${import.meta.env.BASE_URL}${market.base === 'ALT' ? 'Altcoinchain' : market.base} logo.png`}
              alt={market.base}
              className="w-6 h-6 rounded-full"
              onError={e => ((e.target as HTMLImageElement).style.display = 'none')}
            />
            <span className="font-semibold text-white text-base whitespace-nowrap">
              {market.base}<span className="text-slate-500">/{market.quote}</span>
            </span>
            <span className="px-1.5 py-0.5 rounded bg-yellow-500/15 text-yellow-400 text-[10px] font-medium">PERP</span>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${marketOpen ? 'rotate-180' : ''}`} />
          </button>
          {marketOpen && (
            <div className="absolute z-30 top-full left-0 mt-1 w-64 rounded-lg border border-[#1c2230] bg-[#0f131c] shadow-xl">
              {MARKETS.map(m => {
                const p = getPrice(m.base);
                const ch = p?.changePercent24h || 0;
                return (
                  <button
                    key={m.id}
                    onClick={() => { setMarket(m); setMarketOpen(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 hover:bg-[#161b28] transition-colors ${m.id === market.id ? 'bg-[#12161f]' : ''}`}
                  >
                    <span className="font-medium text-white">{m.base}<span className="text-slate-500">/{m.quote}</span></span>
                    <span className="text-right">
                      <span className="block text-slate-200">{p ? fmtPrice(p.price) : '—'}</span>
                      <span className={`block text-[11px] ${ch >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {ch >= 0 ? '+' : ''}{ch.toFixed(2)}%
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Mark price */}
        <div className="px-4 py-2 flex flex-col justify-center border-r border-[#1c2230] min-w-[110px]">
          <span className={`text-lg font-semibold tabular-nums ${changePositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {markPrice ? fmtPrice(markPrice) : '—'}
          </span>
          <span className="text-[11px] text-slate-500">Mark</span>
        </div>

        {[
          {
            label: '24h Change',
            value: `${changePositive ? '+' : ''}${change24h.toFixed(2)}%`,
            cls: changePositive ? 'text-emerald-400' : 'text-red-400'
          },
          { label: '24h High', value: markPrice ? fmtPrice(high24h) : '—', cls: 'text-slate-200' },
          { label: '24h Low', value: markPrice ? fmtPrice(low24h) : '—', cls: 'text-slate-200' },
          { label: '24h Volume', value: market.volume24h, cls: 'text-slate-200' },
          { label: 'Open Interest', value: market.openInterest, cls: 'text-slate-200' },
          { label: `Funding / ${fundingClock}`, value: market.fundingRate, cls: 'text-yellow-400' }
        ].map(stat => (
          <div key={stat.label} className="px-4 py-2 flex flex-col justify-center border-r border-[#1c2230] whitespace-nowrap">
            <span className={`font-medium tabular-nums ${stat.cls}`}>{stat.value}</span>
            <span className="text-[11px] text-slate-500">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* ── Main grid: chart | order book | order entry ─────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_240px_300px] lg:grid-cols-[1fr_300px]">
        {/* Chart */}
        <div className="border-r border-[#1c2230] min-h-[480px] flex flex-col">
          <div className="flex items-center gap-1 px-3 py-2 border-b border-[#1c2230]">
            {(Object.keys(TIMEFRAME_CONFIG) as Timeframe[]).map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 rounded text-[12px] transition-colors ${
                  timeframe === tf ? 'bg-[#1c2230] text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {tf.toUpperCase()}
              </button>
            ))}
            <span className="ml-auto flex items-center gap-1 text-slate-600 text-[11px]">
              <Crosshair className="w-3.5 h-3.5" /> lightweight-charts
            </span>
          </div>
          <div ref={chartContainerRef} className="flex-1 min-h-[430px]" />
        </div>

        {/* Order book (hidden below xl) */}
        <div className="hidden xl:block border-r border-[#1c2230] bg-[#0b0e14] p-2 min-w-0 overflow-hidden">
          <PerpOrderBook market={market.id} />
        </div>

        {/* Order entry */}
        <div className="hidden lg:flex flex-col p-3 gap-3 bg-[#0d1118] min-w-0 overflow-hidden">
          {/* Side toggle */}
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-[#12161f] p-1">
            <button
              onClick={() => setSide('long')}
              className={`py-2 rounded-md font-semibold transition-colors ${
                side === 'long' ? 'bg-emerald-500 text-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              Long
            </button>
            <button
              onClick={() => setSide('short')}
              className={`py-2 rounded-md font-semibold transition-colors ${
                side === 'short' ? 'bg-red-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Short
            </button>
          </div>

          {/* Order type */}
          <div className="flex gap-3 text-[12px]">
            {(['market', 'limit'] as OrderType[]).map(t => (
              <button
                key={t}
                onClick={() => setOrderType(t)}
                className={`capitalize pb-1 border-b-2 transition-colors ${
                  orderType === t ? 'border-yellow-400 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {orderType === 'limit' && (
            <label className="block">
              <span className="text-[11px] text-slate-500">Limit price ({market.quote})</span>
              <input
                value={limitPrice}
                onChange={e => setLimitPrice(e.target.value)}
                placeholder={markPrice ? fmtPrice(markPrice) : '0.00'}
                inputMode="decimal"
                className="mt-1 w-full rounded-lg bg-[#12161f] border border-[#1c2230] px-3 py-2 text-white placeholder-slate-600 focus:border-yellow-400/60 focus:outline-none tabular-nums"
              />
            </label>
          )}

          <label className="block">
            <span className="text-[11px] text-slate-500">Margin ({market.quote})</span>
            <input
              value={margin}
              onChange={e => setMargin(e.target.value)}
              placeholder="0.00"
              inputMode="decimal"
              className="mt-1 w-full rounded-lg bg-[#12161f] border border-[#1c2230] px-3 py-2 text-white placeholder-slate-600 focus:border-yellow-400/60 focus:outline-none tabular-nums"
            />
          </label>

          {/* Leverage */}
          <div>
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Leverage</span>
              <span className="text-yellow-400 font-semibold">{leverage}x</span>
            </div>
            <input
              type="range"
              min={1}
              max={market.maxLev}
              value={Math.min(leverage, market.maxLev)}
              onChange={e => setLeverage(parseInt(e.target.value))}
              className="w-full accent-yellow-400"
            />
            <div className="flex justify-between text-[10px] text-slate-600">
              {[1, Math.round(market.maxLev / 4), Math.round(market.maxLev / 2), market.maxLev].map(v => (
                <button key={v} onClick={() => setLeverage(v)} className="hover:text-slate-300">{v}x</button>
              ))}
            </div>
          </div>

          {/* Order summary */}
          <div className="rounded-lg bg-[#12161f] p-3 space-y-1.5 text-[12px]">
            {[
              { k: 'Notional size', v: `${sizeBase ? sizeBase.toFixed(4) : '0.0000'} ${market.base}` },
              { k: 'Entry price', v: entryPrice ? fmtPrice(entryPrice) : '—' },
              { k: 'Est. liq. price', v: marginNum ? fmtPrice(liqPrice) : '—', cls: 'text-orange-400' },
              { k: 'Taker fee (0.05%)', v: `$${takerFee.toFixed(2)}` }
            ].map(r => (
              <div key={r.k} className="flex justify-between">
                <span className="text-slate-500">{r.k}</span>
                <span className={`tabular-nums ${r.cls || 'text-slate-200'}`}>{r.v}</span>
              </div>
            ))}
          </div>

          <button
            onClick={submitOrder}
            className={`py-3 rounded-lg font-bold transition-colors ${
              side === 'long'
                ? 'bg-emerald-500 hover:bg-emerald-400 text-black'
                : 'bg-red-500 hover:bg-red-400 text-white'
            }`}
          >
            {orderType === 'market'
              ? `${side === 'long' ? 'Open Long' : 'Open Short'} ${market.base}`
              : `Place Limit ${side === 'long' ? 'Long' : 'Short'}`}
          </button>
          <p className="text-[10px] text-slate-600 text-center -mt-1">
            Demo terminal — execution is simulated locally.
          </p>
        </div>
      </div>

      {/* ── Positions drawer ─────────────────────────────────────────── */}
      <div className="border-t border-[#1c2230]">
        <div className="flex items-center gap-4 px-4 pt-2 border-b border-[#1c2230]">
          {(
            [
              ['positions', `Positions (${positions.length})`],
              ['orders', `Open Orders (${orders.length})`],
              ['history', `Trade History (${fills.length})`]
            ] as [DrawerTab, string][]
          ).map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setDrawerTab(tab)}
              className={`pb-2 text-[12px] border-b-2 transition-colors ${
                drawerTab === tab ? 'border-yellow-400 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="min-h-[140px] max-h-[240px] overflow-y-auto">
          {drawerTab === 'positions' && (
            positions.length === 0 ? (
              <p className="text-slate-600 text-center py-10">No open positions</p>
            ) : (
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="text-slate-500 text-left">
                    {['Market', 'Side', 'Size', 'Entry', 'Mark', 'Liq. price', 'Margin', 'uPnL', ''].map(h => (
                      <th key={h} className="px-4 py-2 font-normal">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {positions.map(p => {
                    const pnl = unrealized(p);
                    const cur = getPrice(p.market.split('-')[0])?.price || p.entryPrice;
                    return (
                      <tr key={p.id} className="border-t border-[#141924] text-slate-200">
                        <td className="px-4 py-2 font-medium text-white">{p.market} <span className="text-yellow-400">{p.leverage}x</span></td>
                        <td className={`px-4 py-2 ${p.side === 'long' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {p.side === 'long' ? <TrendingUp className="inline w-3.5 h-3.5 mr-1" /> : <TrendingDown className="inline w-3.5 h-3.5 mr-1" />}
                          {p.side}
                        </td>
                        <td className="px-4 py-2 tabular-nums">{p.size.toFixed(4)}</td>
                        <td className="px-4 py-2 tabular-nums">{fmtPrice(p.entryPrice)}</td>
                        <td className="px-4 py-2 tabular-nums">{fmtPrice(cur)}</td>
                        <td className="px-4 py-2 tabular-nums text-orange-400">{fmtPrice(p.liqPrice)}</td>
                        <td className="px-4 py-2 tabular-nums">${p.margin.toFixed(2)}</td>
                        <td className={`px-4 py-2 tabular-nums font-medium ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <button
                            onClick={() => closePosition(p)}
                            className="px-3 py-1 rounded bg-[#1c2230] hover:bg-[#242b3d] text-slate-200 transition-colors"
                          >
                            Close
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )
          )}

          {drawerTab === 'orders' && (
            orders.length === 0 ? (
              <p className="text-slate-600 text-center py-10">No open orders</p>
            ) : (
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="text-slate-500 text-left">
                    {['Market', 'Side', 'Type', 'Price', 'Size', 'Placed', ''].map(h => (
                      <th key={h} className="px-4 py-2 font-normal">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id} className="border-t border-[#141924] text-slate-200">
                      <td className="px-4 py-2 font-medium text-white">{o.market} <span className="text-yellow-400">{o.leverage}x</span></td>
                      <td className={`px-4 py-2 ${o.side === 'long' ? 'text-emerald-400' : 'text-red-400'}`}>{o.side}</td>
                      <td className="px-4 py-2 capitalize">{o.type}</td>
                      <td className="px-4 py-2 tabular-nums">{fmtPrice(o.price)}</td>
                      <td className="px-4 py-2 tabular-nums">{o.size.toFixed(4)}</td>
                      <td className="px-4 py-2 text-slate-500">{new Date(o.placedAt).toLocaleTimeString()}</td>
                      <td className="px-4 py-2 text-right">
                        <button
                          onClick={() => cancelOrder(o.id)}
                          className="px-3 py-1 rounded bg-[#1c2230] hover:bg-[#242b3d] text-slate-200 transition-colors"
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}

          {drawerTab === 'history' && (
            fills.length === 0 ? (
              <p className="text-slate-600 text-center py-10">No trades yet</p>
            ) : (
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="text-slate-500 text-left">
                    {['Market', 'Action', 'Price', 'Size', 'Realized PnL', 'Time'].map(h => (
                      <th key={h} className="px-4 py-2 font-normal">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fills.map(f => (
                    <tr key={f.id} className="border-t border-[#141924] text-slate-200">
                      <td className="px-4 py-2 font-medium text-white">{f.market}</td>
                      <td className={`px-4 py-2 capitalize ${f.side === 'long' ? 'text-emerald-400' : f.side === 'short' ? 'text-red-400' : 'text-slate-300'}`}>{f.side}</td>
                      <td className="px-4 py-2 tabular-nums">{fmtPrice(f.price)}</td>
                      <td className="px-4 py-2 tabular-nums">{f.size.toFixed(4)}</td>
                      <td className={`px-4 py-2 tabular-nums ${f.pnl === undefined ? 'text-slate-600' : f.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {f.pnl === undefined ? '—' : `${f.pnl >= 0 ? '+' : ''}$${f.pnl.toFixed(2)}`}
                      </td>
                      <td className="px-4 py-2 text-slate-500">{new Date(f.time).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default TradingTerminal;
