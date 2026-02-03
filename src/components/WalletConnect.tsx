import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Zap } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';
import { useDeviceDetect } from '../hooks/useDeviceDetect';

const WalletConnect: React.FC = () => {
  const { isConnected, address, chainId, balance, altBalance, wattBalance, connectWallet, disconnectWallet, switchToAltcoinchain } = useWallet();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { isMobile } = useDeviceDetect();

  const formatAddress = (addr: string) => {
    return isMobile ? `${addr.slice(0, 4)}...${addr.slice(-3)}` : `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const isAltcoinchain = chainId === 2330;

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div className="relative">
      {!isConnected ? (
        <motion.button
          onClick={connectWallet}
          className={`flex items-center space-x-2 ${isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-2'} bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors font-medium touch-target`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Wallet className="w-4 h-4" />
          <span>{isMobile ? 'Connect' : 'Connect Wallet'}</span>
        </motion.button>
      ) : (
        <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-3'}`}>
          {!isAltcoinchain && (
            <motion.button
              onClick={switchToAltcoinchain}
              className={`flex items-center space-x-2 ${isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'} bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors touch-target`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Zap className="w-4 h-4" />
              <span>{isMobile ? 'ALT' : 'Switch to ALT'}</span>
            </motion.button>
          )}
          
          <div 
            className={`bg-slate-900/50 rounded-lg ${isMobile ? 'px-2 py-1' : 'px-3 py-2'} cursor-pointer hover:bg-slate-800/50 transition-colors touch-target`}
            onClick={toggleDropdown}
          >
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
              <span className={`font-medium ${isMobile ? 'text-sm' : ''}`}>{address ? formatAddress(address) : 'Connected'}</span>
            </div>
            <div className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-slate-400`}>
              {isAltcoinchain ? (
                <div className="space-y-1">
                  <div>ALT: {parseFloat(altBalance || '0').toFixed(4)}</div>
                  <div>WATT: {parseFloat(wattBalance || '0').toFixed(4)}</div>
                </div>
              ) : (
                <div>{parseFloat(balance || '0').toFixed(4)} ETH</div>
              )}
            </div>
          </div>

          {isDropdownOpen && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-lg border border-slate-700 z-50">
              <div className="p-3 border-b border-slate-700">
                <p className="text-xs text-slate-400">Connected to</p>
                <p className="font-medium">{isAltcoinchain ? 'Altcoinchain' : 'Ethereum'}</p>
              </div>
              <div className="p-3">
                <button
                  onClick={() => {
                    disconnectWallet();
                    setIsDropdownOpen(false);
                  }}
                  className="w-full text-left text-red-400 hover:text-red-300 transition-colors touch-target"
                >
                  Disconnect
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WalletConnect;