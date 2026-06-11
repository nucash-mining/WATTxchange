import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, type IChartApi } from 'lightweight-charts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { usePrices } from '../../hooks/usePrices';

interface PriceChartProps {
  symbol?: string;
  interval?: string;
}

type Timeframe = '15m' | '1h' | '4h' | '1d' | '1w';

/** Candle count + seconds-per-candle for each timeframe. */
const TIMEFRAME_CONFIG: Record<Timeframe, { count: number; step: number }> = {
  '15m': { count: 96, step: 15 * 60 },        // ~1 day
  '1h': { count: 168, step: 60 * 60 },        // ~1 week
  '4h': { count: 180, step: 4 * 60 * 60 },    // ~1 month
  '1d': { count: 90, step: 24 * 60 * 60 },    // ~3 months
  '1w': { count: 52, step: 7 * 24 * 60 * 60 } // ~1 year
};

/**
 * Build a random-walk candle series that ENDS at `basePrice` and is consistent
 * with the 24h change, so the chart matches the live price shown in the UI.
 * (Execution is mocked; spot price comes from priceService.)
 */
function buildSeries(basePrice: number, change24h: number, tf: Timeframe) {
  const { count, step } = TIMEFRAME_CONFIG[tf];
  const now = Math.floor(Date.now() / 1000);
  // Start price implied by the 24h change, clamped to something sane.
  const startPrice = basePrice / (1 + (change24h || 0) / 100) || basePrice;
  const drift = Math.pow(basePrice / startPrice, 1 / count);

  const candles: { time: number; open: number; high: number; low: number; close: number }[] = [];
  let prevClose = startPrice;
  for (let i = 0; i < count; i++) {
    const time = now - (count - 1 - i) * step;
    const open = prevClose;
    const noise = 1 + (Math.random() - 0.5) * 0.03; // ±1.5% wiggle
    let close = open * drift * noise;
    if (i === count - 1) close = basePrice; // anchor the final candle to spot
    const high = Math.max(open, close) * (1 + Math.random() * 0.012);
    const low = Math.min(open, close) * (1 - Math.random() * 0.012);
    candles.push({ time, open, high, low, close });
    prevClose = close;
  }
  return candles;
}

const PriceChart: React.FC<PriceChartProps> = ({ symbol = 'ALT/USDT', interval = '1d' }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>(
    (['15m', '1h', '4h', '1d', '1w'].includes(interval) ? interval : '1d') as Timeframe
  );
  const { getPrice, formatChange } = usePrices(['ALT', 'BTC', 'ETH', 'WATT', 'PEPE', 'PEPI', 'MALT', 'SWAPD', 'SCAM']);

  const baseSymbol = symbol.split('/')[0];
  const priceData = getPrice(baseSymbol);
  const change = formatChange(baseSymbol);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0f172a' },
        textColor: '#94a3b8',
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      grid: {
        vertLines: { color: '#1e293b' },
        horzLines: { color: '#1e293b' },
      },
      timeScale: { borderColor: '#1e293b', timeVisible: timeframe === '15m' || timeframe === '1h' },
      rightPriceScale: { borderColor: '#1e293b' },
      crosshair: { mode: 0 },
    });
    chartRef.current = chart;

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ef4444',
      borderUpColor: '#10b981',
      borderDownColor: '#ef4444',
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    const basePrice =
      priceData?.price ||
      (baseSymbol === 'ALT' ? 0.000173 :
       baseSymbol === 'WATT' ? 2.0 :
       baseSymbol === 'PEPE' ? 0.0000012 :
       baseSymbol === 'PEPI' ? 0.0000008 :
       baseSymbol === 'MALT' ? 0.05 :
       baseSymbol === 'SWAPD' ? 0.1 :
       baseSymbol === 'SCAM' ? 0.00001 : 1.0);

    const candles = buildSeries(basePrice, priceData?.change24h ?? 0, timeframe);
    candleSeries.setData(candles);

    const volumeSeries = chart.addHistogramSeries({
      color: '#f97316',
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    });
    volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
    volumeSeries.setData(
      candles.map((c) => ({
        time: c.time,
        value: Math.random() * 100000 * basePrice,
        color: c.open <= c.close ? 'rgba(16,185,129,0.5)' : 'rgba(239,68,68,0.5)',
      }))
    );

    chart.timeScale().fitContent();

    const handleResize = () =>
      chart.applyOptions({ width: chartContainerRef.current?.clientWidth });
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, [symbol, timeframe, baseSymbol, priceData]);

  return (
    <div className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold">{symbol} Chart</h3>
          <div className={`flex items-center space-x-1 ${change.isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {change.isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span className="text-sm font-medium">{change.value}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {(['15m', '1h', '4h', '1d', '1w'] as Timeframe[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                timeframe === tf
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-700/50 hover:bg-slate-600/50 text-slate-300'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div ref={chartContainerRef} className="h-[400px]" />
    </div>
  );
};

export default PriceChart;
