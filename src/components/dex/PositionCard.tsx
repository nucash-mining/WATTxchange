import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Plus, Minus, Droplets, Percent } from 'lucide-react';

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

interface Position {
  id: string;
  pool: Pool;
  liquidity: string;
  token0Amount: string;
  token1Amount: string;
  uncollectedFees: string;
  inRange: boolean;
  tickLower: number;
  tickUpper: number;
}

interface PositionCardProps {
  position: Position;
  onCollectFees: (position: Position) => void;
  onAddLiquidity: (pool: Pool) => void;
  onRemoveLiquidity: (position: Position) => void;
}

const PositionCard: React.FC<PositionCardProps> = ({
  position,
  onCollectFees,
  onAddLiquidity,
  onRemoveLiquidity
}) => {
  const [expanded, setExpanded] = useState(false);

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

  return (
    <motion.div
      className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            {getTokenIcon(position.pool.token0)}
            {getTokenIcon(position.pool.token1)}
          </div>
          <h4 className="font-semibold">{position.pool.token0}/{position.pool.token1}</h4>
          <span className="text-xs bg-slate-700/50 px-2 py-1 rounded">
            {position.pool.fee}%
          </span>
        </div>
        <span className={`text-xs px-2 py-1 rounded ${
          position.inRange 
            ? 'bg-emerald-500/20 text-emerald-400' 
            : 'bg-red-500/20 text-red-400'
        }`}>
          {position.inRange ? 'In Range' : 'Out of Range'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-slate-400 text-sm">Liquidity</p>
          <div className="flex items-center space-x-2">
            <Droplets className="w-4 h-4 text-blue-400" />
            <p className="font-bold">{position.liquidity}</p>
          </div>
        </div>
        <div>
          <p className="text-slate-400 text-sm">Uncollected Fees</p>
          <div className="flex items-center space-x-2">
            <Percent className="w-4 h-4 text-emerald-400" />
            <p className="font-bold text-emerald-400">{position.uncollectedFees}</p>
          </div>
        </div>
        <div>
          <p className="text-slate-400 text-sm">{position.pool.token0}</p>
          <p className="font-bold">{position.token0Amount}</p>
        </div>
        <div>
          <p className="text-slate-400 text-sm">{position.pool.token1}</p>
          <p className="font-bold">{position.token1Amount}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
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
            onClick={() => onCollectFees(position)}
            className="flex-1 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 rounded-lg text-sm font-medium transition-colors border border-emerald-500/30"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Collect
          </motion.button>
          <motion.button
            onClick={() => onAddLiquidity(position.pool)}
            className="flex-1 py-2 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg text-sm font-medium transition-colors border border-blue-500/30"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-4 h-4 inline mr-1" />
            Add
          </motion.button>
          <motion.button
            onClick={() => onRemoveLiquidity(position)}
            className="flex-1 py-2 bg-red-600/20 hover:bg-red-600/30 rounded-lg text-sm font-medium transition-colors border border-red-500/30"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Minus className="w-4 h-4 inline mr-1" />
            Remove
          </motion.button>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 pt-4 border-t border-slate-700/30"
        >
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Position ID:</span>
              <span className="font-mono text-xs">{position.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Price Range:</span>
              <span>Full Range</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">APR:</span>
              <span className="text-emerald-400">{position.pool.apr}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Hooks:</span>
              <div className="flex flex-wrap justify-end gap-1">
                {position.pool.hooks.map((hook, i) => (
                  <span key={i} className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                    {hook}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Created:</span>
              <span>1 month ago</span>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default PositionCard;