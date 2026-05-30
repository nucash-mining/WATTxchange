import React from 'react';
import { motion } from 'framer-motion';
import { Wifi, WifiOff, Settings, Menu } from 'lucide-react';
import WalletConnect from './WalletConnect';
import { useWallet } from '../hooks/useWallet';

interface HeaderProps {
  isMobile?: boolean;
  onMenuToggle?: () => void;
  isNativeApp?: boolean;
}

const Header: React.FC<HeaderProps> = ({ isMobile, onMenuToggle, isNativeApp }) => {
  const { isConnected, chainId } = useWallet();

  return (
    <header className={`bg-black/80 backdrop-blur-xl border-b border-gray-800 ${isMobile ? 'p-3' : 'p-4'} ${isNativeApp ? 'safe-area-top' : ''}`}>
      <div className="flex items-center justify-between">
        <motion.div 
          className="flex items-center space-x-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          {isMobile && onMenuToggle && (
            <button 
              onClick={onMenuToggle}
              className="p-3 mr-2 bg-gray-900/50 rounded-lg hover:bg-gray-800/50 transition-colors touch-target"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div className="relative flex-shrink-0">
            <img
              src="/WATTxchange logo.png"
              alt="WATT Token"
              className={isMobile ? "w-9 h-9" : "w-12 h-12"}
            />
            <motion.div
              className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <div className="min-w-0">
            <h1 className={`${isMobile ? "text-xl" : "text-3xl"} font-bold bg-gradient-to-r from-yellow-400 to-emerald-400 bg-clip-text text-transparent leading-tight whitespace-nowrap`}>
              WATTxchange
            </h1>
            <p className={`${isMobile ? "text-xs" : "text-sm"} text-gray-400 leading-tight`}>Multi-Chain DeFi Hub</p>
          </div>
        </motion.div>

        <motion.div 
          className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-4'}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <WalletConnect />
          
          <div className={`flex items-center space-x-2 bg-gray-900/50 rounded-lg ${isMobile ? 'px-2 py-1' : 'px-3 py-2'}`}>
            {isConnected ? (
              <Wifi className="w-4 h-4 text-emerald-400" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-400" />
            )}
            <span className={`${isMobile ? 'text-xs' : 'text-sm'}`}>
              {isConnected ? `Connected${chainId === 2330 ? ' (Altcoinchain)' : ''}` : 'Disconnected'}
            </span>
          </div>
          
          {!isMobile && (
            <motion.button
              className="p-2 bg-gray-900/50 rounded-lg hover:bg-gray-800/50 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Settings className="w-5 h-5" />
            </motion.button>
          )}
        </motion.div>
      </div>
    </header>
  );
};

export default Header;