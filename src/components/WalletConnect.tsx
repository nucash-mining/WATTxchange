import React from 'react';
import { motion } from 'framer-motion';
import { Wallet, ExternalLink, Zap } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';

interface WalletConnectProps {
  isMobile?: boolean;
}

const WalletConnect: React.FC<WalletConnectProps> = ({ isMobile = false }) => {
  const { isConnected, address, chainId, balance, altBalance, wattBalance, connectWallet, disconnectWallet, switchToAltcoinchain } = useWallet();

  const formatAddress = (addr: string) => {
    return isMobile 
      ? `${addr.slice(0, 4)}...${addr.slice(-4)}`
      : `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const isAltcoinchain = chainId === 2330;

  return (
    <div className="flex items-center space-x-2">
      {!isConnected ? (
        <motion.button
          onClick={connectWallet}
          className={`flex items-center space-x-2 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors font-medium ${isMobile ? 'text-xs' : ''}`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Wallet className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
          <span>{isMobile ? 'Connect' : 'Connect Wallet'}</span>
        </motion.button>
      ) : (
        <div className="flex items-center space-x-2">
          {!isAltcoinchain && !isMobile && (
            <motion.button
              onClick={switchToAltcoinchain}
              className="flex items-center space-x-2 px-3 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors text-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Zap className="w-4 h-4" />
              <span>Switch to ALT</span>
            </motion.button>
          )}
          
          <div className="bg-slate-900/50 rounded-lg px-3 py-2">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
              <span className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>{formatAddress(address!)}</span>
            </div>
            <div className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-slate-400`}>
              {isAltcoinchain ? (
                <div className="space-y-1">
                  <div>ALT: {parseFloat(altBalance).toFixed(2)}</div>
                  <div>WATT: {parseFloat(wattBalance).toFixed(2)}</div>
                </div>
              ) : (
                <div>{parseFloat(balance).toFixed(4)} ETH</div>
              )}
            </div>
          </div>

          {!isMobile && (
            <motion.button
              onClick={disconnectWallet}
              className="p-2 bg-slate-900/50 hover:bg-slate-800/50 rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ExternalLink className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      )}
    </div>
  );
};

export default WalletConnect;