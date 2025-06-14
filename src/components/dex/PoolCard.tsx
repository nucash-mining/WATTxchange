import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, TrendingUp, Droplets } from 'lucide-react';
import { swapinService } from '../../services/swapinService';

interface Pool {
  id: string;
  token0: string;
  token1: string;
  fee: number;
  liquidity: string;
  volume24h: string;
  apr: number;
  hooks: string[];
}

interface PoolCardProps {
  pool: Pool;
  onAddLiquidity: (pool: Pool) => void;
  onTrade: (token0: string, token1: string) => void;
}

const PoolCard: React.FC<PoolCardProps> = ({ pool, onAddLiquidity, onTrade }) => {
  const [expanded, setExpanded] = useState(false);
  
  // Get Altcoinchain token addresses
  const altTokens = swapinService.getAltcoinchainTokens();
  const altPools = swapinService.getAltcoinchainPools();

  const getTokenIcon = (symbol: string) => {
    switch (symbol) {
      case 'ALT':
        return <img src="/Altcoinchain logo.png" alt="ALT" className="w-6 h-6 object-contain rounded-full" />;
      case 'wALT':
        return <img src="/Altcoinchain logo.png" alt="wALT" className="w-6 h-6 object-contain rounded-full" />;
      case 'WATT':
        return <img src="/WATT logo.png" alt="WATT" className="w-6 h-6 object-contain" />;
      case 'AltPEPE':
        return <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold">P</div>;
      case 'AltPEPI':
        return <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center text-xs font-bold">P</div>;
      case 'SCAM':
        return <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold">S</div>;
      case 'SWAPD':
        return <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs font-bold">S</div>;
      case 'MALT':
        return <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold">M</div>;
      case 'USDT':
        return <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-xs font-bold">U</div>;
      default:
        return <div className="w-6 h-6 bg-slate-500 rounded-full flex items-center justify-center text-xs font-bold">{symbol[0]}</div>;
    }
  };

  const getTokenAddress = (symbol: string) => {
    switch (symbol) {
      case 'ALT': return 'Native ALT';
      case 'wALT': return altTokens.wALT;
      case 'WATT': return altTokens.WATT;
      case 'AltPEPE': return altTokens.AltPEPE;
      case 'AltPEPI': return altTokens.AltPEPI;
      case 'SCAM': return altTokens.SCAM;
      case 'SWAPD': return altTokens.SWAPD;
      case 'MALT': return altTokens.MALT;
      default: return '';
    }
  };

  const getPoolAddress = (token0: string, token1: string) => {
    const key = `${token0}/${token1}`;
    return altPools[key as keyof typeof altPools] || '';
  };

  return (
    <motion.div
      className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            {getTokenIcon(pool.token0)}
            {getTokenIcon(pool.token1)}
          </div>
          <h4 className="font-semibold">{pool.token0}/{pool.token1}</h4>
          <span className="text-xs bg-slate-700/50 px-2 py-1 rounded">
            {pool.fee}%
          </span>
        </div>
        <div className="flex items-center space-x-1 text-emerald-400">
          <TrendingUp className="w-4 h-4" />
          <span className="text-sm font-medium">{pool.apr}%</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-slate-400 text-sm">Liquidity</span>
          <span className="font-medium">{pool.liquidity}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400 text-sm">24h Volume</span>
          <span className="font-medium">{pool.volume24h}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400 text-sm">Hooks</span>
          <div className="flex flex-wrap justify-end gap-1">
            {pool.hooks.map((hook, i) => (
              <span key={i} className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                {hook}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center space-x-1 text-sm text-slate-400 hover:text-white"
        >
          <span>Details</span>
          {expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
        
        <div className="flex space-x-2">
          <motion.button
            onClick={() => onAddLiquidity(pool)}
            className="flex-1 py-2 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg text-sm font-medium transition-colors border border-blue-500/30"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Add
          </motion.button>
          <motion.button
            onClick={() => onTrade(pool.token0, pool.token1)}
            className="flex-1 py-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-sm font-medium transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Trade
          </motion.button>
        </div>
      </div>

      {/* Expanded Pool Details */}
      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 pt-4 border-t border-slate-700/30"
        >
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Pool Address:</span>
              <span className="font-mono text-xs">{getPoolAddress(pool.token0, pool.token1) || '0x...'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">{pool.token0} Address:</span>
              <span className="font-mono text-xs">{getTokenAddress(pool.token0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">{pool.token1} Address:</span>
              <span className="font-mono text-xs">{getTokenAddress(pool.token1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Fee Tier:</span>
              <span>{pool.fee}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Created:</span>
              <span>2 months ago</span>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default PoolCard;