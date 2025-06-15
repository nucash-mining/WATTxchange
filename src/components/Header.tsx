import React from 'react';
import { motion } from 'framer-motion';
import { Wifi, WifiOff, Settings, Menu } from 'lucide-react';
import WalletConnect from './WalletConnect';
import { useWallet } from '../hooks/useWallet';

interface HeaderProps {
  isMobile?: boolean;
  onMenuToggle?: () => void;
}

const Header: React.FC<HeaderProps> = ({ isMobile, onMenuToggle }) => {
  const { isConnected, chainId } = useWallet();

  return (
    <header className="bg-black/80 backdrop-blur-xl border-b border-gray-800 p-4">
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
              className="p-2 mr-2 bg-gray-900/50 rounded-lg hover:bg-gray-800/50 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div className="relative">
            <img 
              src="/WATTxchange logo.png" 
              alt="WATT Token" 
              className={isMobile ? "w-16 h-16" : "w-32 h-32"} 
            />
            <motion.div
              className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <div>
            <h1 className={`${isMobile ? "text-4xl" : "text-8xl"} font-bold bg-gradient-to-r from-yellow-400 to-emerald-400 bg-clip-text text-transparent`}>
              WATTxchange
            </h1>
            <p className={`${isMobile ? "text-lg" : "text-2xl"} text-gray-400`}>Multi-Chain DeFi Hub</p>
          </div>
        </motion.div>

        <motion.div 
          className="flex items-center space-x-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <WalletConnect />
          
          <div className="flex items-center space-x-2 bg-gray-900/50 rounded-lg px-3 py-2">
            {isConnected ? (
              <Wifi className="w-4 h-4 text-emerald-400" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-400" />
            )}
            <span className="text-sm">
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