import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownLeft, MoreHorizontal } from 'lucide-react';
import ReceiveModal from './ReceiveModal';
import SendModal from './SendModal';
import DepositModal from './DepositModal';

interface Chain {
  name: string;
  symbol: string;
  balance: string;
  usdValue: string;
  icon: React.ComponentType<{ className?: string }> | (() => JSX.Element);
  color: string;
  chainId?: number;
}

interface BalanceCardProps {
  chain: Chain;
  showBalance: boolean;
  index: number;
  onFullGUIClick?: (chain: Chain) => void;
}

const BalanceCard: React.FC<BalanceCardProps> = ({ chain, showBalance, index, onFullGUIClick }) => {
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const IconComponent = chain.icon;

  const handleDoubleClick = () => {
    if (chain.symbol === 'ALT' && chain.chainId === 2330) {
      console.log('Double-clicked ALT balance card - showing detailed info');
    }
  };

  return (
    <>
      <motion.div
        className={`backdrop-blur-xl rounded-xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 cursor-pointer relative overflow-visible ${
          chain.symbol === 'ALT' ? 'bg-slate-800/20' : 'bg-slate-800/30'
        }`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 + index * 0.1 }}
        whileHover={{ y: -2 }}
        onDoubleClick={handleDoubleClick}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center">
              <IconComponent />
            </div>
            <div>
              <h4 className="font-semibold">{chain.name}</h4>
              <div className="flex items-center space-x-2">
                <p className="text-sm text-slate-400">{chain.symbol}</p>
                {chain.chainId === 2330 && (
                  <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">
                    Live
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="relative">
            <button 
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
              onClick={() => setShowMenu(!showMenu)}
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            
            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-lg border border-slate-700 z-10">
                {onFullGUIClick && chain.symbol === 'XMR' && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onFullGUIClick(chain);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-700 transition-colors rounded-t-lg flex items-center space-x-2"
                  >
                    <span className="text-orange-400">🟠</span>
                    <span>Monero GUI Wallet</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowDepositModal(true);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-700 transition-colors"
                >
                  Deposit
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    // Add additional actions here
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-700 transition-colors"
                >
                  View Transactions
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    // Add additional actions here
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-700 transition-colors rounded-b-lg"
                >
                  Hide Token
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div>
            <p className="text-2xl font-bold">
              {showBalance ? chain.balance : '••••••'}
            </p>
            <p className="text-slate-400">
              {showBalance ? chain.usdValue : '••••••'}
            </p>
          </div>
        </div>

        <div className="flex space-x-2 mt-4">
          <motion.button
            onClick={() => setShowReceiveModal(true)}
            className="flex-1 flex items-center justify-center space-x-2 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 rounded-lg transition-colors border border-emerald-500/30"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Receive</span>
          </motion.button>
          <motion.button
            onClick={() => setShowSendModal(true)}
            className="flex-1 flex items-center justify-center space-x-2 py-2 bg-yellow-600/20 hover:bg-yellow-600/30 rounded-lg transition-colors border border-yellow-500/30"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span className="text-sm font-medium">Send</span>
          </motion.button>
        </div>

        {chain.symbol === 'ALT' && chain.chainId === 2330 && (
          <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs text-yellow-400">
            💡 Double-click for detailed balance info
          </div>
        )}
      </motion.div>

      {/* Modals */}
      <ReceiveModal
        isOpen={showReceiveModal}
        onClose={() => setShowReceiveModal(false)}
        chainSymbol={chain.symbol}
      />

      <SendModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        chainSymbol={chain.symbol}
        balance={chain.balance}
      />

      <DepositModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        chainSymbol={chain.symbol}
      />
    </>
  );
};

export default BalanceCard;