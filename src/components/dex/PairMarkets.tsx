import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, BarChart3, ArrowLeftRight } from 'lucide-react';
import PriceChart from './PriceChart';
import { pairHistoryService, type PairInfo } from '../../services/pairHistoryService';

interface PairMarketsProps {
  /** Jump to the swap tab pre-filled with this pair's tokens. */
  onTrade?: (symbol0: string, symbol1: string) => void;
}

/**
 * Markets: every pair on the live SwapinDEX factory, each with its real
 * on-chain Sync-event chart. Select a row to open the full chart.
 */
const PairMarkets: React.FC<PairMarketsProps> = ({ onTrade }) => {
  const [pairs, setPairs] = useState<PairInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PairInfo | null>(null);
  const [inverted, setInverted] = useState(false);

  const load = (force = false) => {
    setLoading(true);
    pairHistoryService
      .getAllPairs(force)
      .then((list) => {
        setPairs(list);
        setSelected((prev) => prev ?? list.find((p) => p.reserve0 > 0) ?? list[0] ?? null);
      })
      .catch((error) => console.error('PairMarkets: failed to load pairs', error))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  // Highest-liquidity pairs first (by token0 reserve as a rough proxy).
  const sorted = useMemo(
    () => [...pairs].sort((a, b) => b.reserve0 * b.midPrice + b.reserve1 - (a.reserve0 * a.midPrice + a.reserve1)),
    [pairs]
  );

  const base = selected ? (inverted ? selected.symbol1 : selected.symbol0) : '';
  const quote = selected ? (inverted ? selected.symbol0 : selected.symbol1) : '';

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
      {/* Pair list */}
      <div className="xl:col-span-2 bg-slate-800/30 backdrop-blur-xl rounded-xl border border-slate-700/50 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-orange-400" />
            <h3 className="font-semibold">All Pairs</h3>
            <span className="text-xs text-slate-400">{pairs.length} on-chain</span>
          </div>
          <motion.button
            onClick={() => load(true)}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
            whileTap={{ scale: 0.9 }}
            title="Refresh from chain"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
        <div className="max-h-[520px] overflow-y-auto divide-y divide-slate-700/30">
          {loading && pairs.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-sm">Reading pairs from the factory…</div>
          ) : (
            sorted.map((pair) => {
              const isSel = selected?.address === pair.address;
              return (
                <button
                  key={pair.address}
                  onClick={() => { setSelected(pair); setInverted(false); }}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                    isSel ? 'bg-orange-500/10 border-l-2 border-orange-500' : 'hover:bg-slate-700/30'
                  }`}
                >
                  <div>
                    <p className="font-medium">{pair.symbol0}/{pair.symbol1}</p>
                    <p className="text-xs text-slate-400">
                      {pair.reserve0.toLocaleString(undefined, { maximumFractionDigits: 1 })} {pair.symbol0}
                      {' · '}
                      {pair.reserve1.toLocaleString(undefined, { maximumFractionDigits: 1 })} {pair.symbol1}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-200">
                      {pair.midPrice > 0 ? pair.midPrice.toLocaleString(undefined, { maximumSignificantDigits: 5 }) : '—'}
                    </p>
                    <p className="text-[10px] uppercase tracking-wide text-slate-500">{pair.symbol1} per {pair.symbol0}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Selected pair chart */}
      <div className="xl:col-span-3 space-y-3">
        {selected ? (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setInverted((v) => !v)}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-sm transition-colors"
                  title="Flip base/quote"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span>{base}/{quote}</span>
                </button>
                <span className="text-xs text-slate-500 font-mono">{selected.address.slice(0, 10)}…</span>
              </div>
              {onTrade && (
                <motion.button
                  onClick={() => onTrade(base, quote)}
                  className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 rounded-lg text-sm font-medium transition-colors"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Trade
                </motion.button>
              )}
            </div>
            <PriceChart
              symbol={`${base}/${quote}`}
              pair={selected}
              invert={inverted}
              livePrice={inverted
                ? (selected.midPrice > 0 ? 1 / selected.midPrice : undefined)
                : (selected.midPrice || undefined)}
            />
          </>
        ) : (
          <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-12 text-center text-slate-400">
            Select a pair to see its on-chain chart
          </div>
        )}
      </div>
    </div>
  );
};

export default PairMarkets;
