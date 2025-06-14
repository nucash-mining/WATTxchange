import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Bitcoin } from 'lucide-react';
import { usePrices } from '../../hooks/usePrices';
import { priceService } from '../../services/priceService';

const TradingChart: React.FC = () => {
  const { getPrice, formatPrice, formatChange } = usePrices(['ALT', 'BTC']);
  const altPrice = getPrice('ALT');
  const btcPrice = getPrice('BTC');
  const change = formatChange('ALT');

  // Calculate ALT/BTC rate using the fixed exchange rate
  const altToBtcRate = priceService.getAltPriceInBtc();
  const altToBtcPrice = altToBtcRate.toFixed(10); // Show more decimals for small values

  return (
    <motion.div
      className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h3 className="text-xl font-semibold">ALT/BTC</h3>
          <div className={`flex items-center space-x-2 ${
            change.isPositive ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {change.isPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span className="font-medium">{change.value}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center space-x-2 mb-1">
            <Bitcoin className="w-5 h-5 text-orange-400" />
            <p className="text-2xl font-bold">{altToBtcPrice} BTC</p>
          </div>
          <p className="text-slate-400">{formatPrice('ALT', 6)}</p>
          {altPrice && btcPrice && (
            <div className="text-sm text-slate-400 mt-2">
              <p>1 BTC = {priceService.convertBtcToAlt(1).toLocaleString()} ALT</p>
              <p>100,000 ALT = 0.00016 BTC</p>
            </div>
          )}
        </div>
      </div>

      {/* Placeholder Chart */}
      <div className="h-64 bg-slate-900/50 rounded-lg flex items-center justify-center border border-slate-700/30">
        <div className="text-center">
          <TrendingUp className="w-12 h-12 text-blue-400 mx-auto mb-2" />
          <p className="text-slate-400">ALT/BTC Trading Chart</p>
          <p className="text-sm text-slate-500">Chart integration coming soon</p>
          <div className="mt-4 p-3 bg-slate-800/50 rounded-lg">
            <p className="text-xs text-slate-400">Exchange Rate</p>
            <p className="text-lg font-bold text-orange-400">
              1 ALT = {altToBtcRate.toFixed(10)} BTC
            </p>
          </div>
        </div>
      </div>

      {/* Chart Controls */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex space-x-2">
          {['1H', '4H', '1D', '1W', '1M'].map((timeframe) => (
            <button
              key={timeframe}
              className="px-3 py-1 text-sm bg-slate-700/50 hover:bg-slate-600/50 rounded transition-colors"
            >
              {timeframe}
            </button>
          ))}
        </div>
        <div className="flex items-center space-x-4 text-sm text-slate-400">
          {altPrice && (
            <span>Volume: {altPrice.volume24h.toLocaleString()} ALT</span>
          )}
          <span>Pair: ALT/BTC</span>
        </div>
      </div>

      {/* Exchange Rate Info */}
      <div className="mt-4 p-4 bg-slate-900/30 rounded-lg border border-slate-700/30">
        <h4 className="text-sm font-semibold mb-2 text-orange-400">Exchange Rate Information</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-400">ALT → BTC</p>
            <p className="font-mono">{altToBtcRate.toFixed(10)} BTC per ALT</p>
          </div>
          <div>
            <p className="text-slate-400">BTC → ALT</p>
            <p className="font-mono">{(1 / altToBtcRate).toLocaleString()} ALT per BTC</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TradingChart;