import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, type IChartApi } from 'lightweight-charts';
import {
  type ChainHashrate,
  type HistoryPoint,
  formatHashrate,
  formatPct,
} from '../../services/hashrateStatsService';

// Total network hashrate vs WATTx merged-mining hashrate for one parent chain.
// The two series live on separate price scales (total is typically many orders
// of magnitude above the pool) so both stay readable; colors distinguish them.
const TOTAL_COLOR = '#3b82f6';   // blue — parent chain total
const WATTX_COLOR = '#eab308';   // yellow — WATTx merged hashrate

interface HashrateChartProps {
  stats: ChainHashrate;
  history: HistoryPoint[];
  rewardWtx: number | null;
}

const HashrateChart: React.FC<HashrateChartProps> = ({ stats, history, rewardWtx }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#94a3b8',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(148,163,184,0.07)' },
        horzLines: { color: 'rgba(148,163,184,0.07)' },
      },
      width: containerRef.current.clientWidth,
      height: 220,
      timeScale: { timeVisible: true, secondsVisible: false, borderColor: 'rgba(148,163,184,0.2)' },
      rightPriceScale: { borderColor: 'rgba(148,163,184,0.2)' },
      leftPriceScale: { visible: true, borderColor: 'rgba(148,163,184,0.2)' },
    });
    chartRef.current = chart;

    const totalSeries = chart.addAreaSeries({
      priceScaleId: 'right',
      lineColor: TOTAL_COLOR,
      topColor: 'rgba(59,130,246,0.25)',
      bottomColor: 'rgba(59,130,246,0.02)',
      lineWidth: 2,
      priceFormat: { type: 'custom', formatter: (v: number) => formatHashrate(v, stats.unit) },
    });
    const wattxSeries = chart.addAreaSeries({
      priceScaleId: 'left',
      lineColor: WATTX_COLOR,
      topColor: 'rgba(234,179,8,0.25)',
      bottomColor: 'rgba(234,179,8,0.02)',
      lineWidth: 2,
      priceFormat: { type: 'custom', formatter: (v: number) => formatHashrate(v, stats.unit) },
    });

    const seen = new Set<number>();
    const totalData: { time: number; value: number }[] = [];
    const wattxData: { time: number; value: number }[] = [];
    for (const p of history) {
      const t = Math.floor(p.t / 1000);
      if (seen.has(t)) continue;
      seen.add(t);
      if (p.total !== null) totalData.push({ time: t, value: p.total });
      wattxData.push({ time: t, value: p.wattx });
    }
    totalSeries.setData(totalData as never);
    wattxSeries.setData(wattxData as never);
    chart.timeScale().fitContent();

    const onResize = () => {
      if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth });
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      chart.remove();
      chartRef.current = null;
    };
  }, [history, stats.unit]);

  return (
    <div className="bg-slate-900/60 rounded-xl border border-slate-700/50 px-5 py-4 mb-7">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">Network Hashrate</p>
          <p className="text-sm font-bold mt-0.5" style={{ color: TOTAL_COLOR }}>
            {formatHashrate(stats.total_hashps, stats.unit)}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">WATTx Merged Hash</p>
          <p className="text-sm font-bold mt-0.5" style={{ color: WATTX_COLOR }}>
            {formatHashrate(stats.wattx_hashps, stats.unit)}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">% of Chain</p>
          <p className="text-sm font-bold text-white mt-0.5">{formatPct(stats.pct_of_chain)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">WTX Block Reward</p>
          <p className="text-sm font-bold text-emerald-400 mt-0.5">
            {rewardWtx !== null ? `${rewardWtx} WTX` : '—'}
          </p>
        </div>
      </div>
      <div ref={containerRef} className="w-full" />
      <div className="flex items-center gap-5 mt-2 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: TOTAL_COLOR }} />
          Total network ({stats.chain})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: WATTX_COLOR }} />
          WATTx merged miners
        </span>
      </div>
    </div>
  );
};

export default HashrateChart;
