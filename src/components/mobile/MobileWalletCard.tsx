import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownLeft, MoreHorizontal } from 'lucide-react';

interface MobileWalletCardProps {
  chain: {
    name: string;
    symbol: string;
    balance: string;
    usdValue: string;
    icon: React.ComponentType<{ className?: string }> | (() => JSX.Element);
    color: string;
    chainId?: number;
  };
  showBalance: boolean;
  onReceive: () => void;
  onSend: () => void;
  onMore: () => void;
}

const MobileWalletCard: React.FC<MobileWalletCardProps> = ({ 
  chain, 
  showBalance, 
  onReceive, 
  onSend, 
  onMore 
}) => {
  const IconComponent = chain.icon;

  return (
    <motion.div
      className={`backdrop-blur-xl rounded-xl p-4 border border-slate-700/50 ${
        chain.symbol === 'ALT' ? 'bg-slate-800/20' : 'bg-slate-800/30'
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="flex items-center justify-center">
            <IconComponent />
          </div>
          <div>
            <h4 className="font-semibold text-sm">{chain.name}</h4>
            <div className="flex items-center space-x-1">
              <p className="text-xs text-slate-400">{chain.symbol}</p>
              {chain.chainId === 2330 && (
                <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-1 py-0.5 rounded">
                  Live
                </span>
              )}
            </div>
          </div>
        </div>
        <button 
          className="p-1 hover:bg-slate-700/50 rounded-lg transition-colors"
          onClick={onMore}
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-1">
        <div>
          <p className="text-lg font-bold">
            {showBalance ? chain.balance : '••••••'}
          </p>
          <p className="text-xs text-slate-400">
            {showBalance ? chain.usdValue : '••••••'}
          </p>
        </div>
      </div>

      <div className="flex space-x-2 mt-3">
        <motion.button
          onClick={onReceive}
          className="flex-1 flex items-center justify-center space-x-1 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 rounded-lg transition-colors border border-emerald-500/30"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <ArrowDownLeft className="w-3 h-3" />
          <span className="text-xs font-medium">Receive</span>
        </motion.button>
        <motion.button
          onClick={onSend}
          className="flex-1 flex items-center justify-center space-x-1 py-2 bg-yellow-600/20 hover:bg-yellow-600/30 rounded-lg transition-colors border border-yellow-500/30"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <ArrowUpRight className="w-3 h-3" />
          <span className="text-xs font-medium">Send</span>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default MobileWalletCard;