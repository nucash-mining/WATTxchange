import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ExternalLink, Check } from 'lucide-react';
import { swapinService, SwapinNetwork } from '../../services/swapinService';
import toast from 'react-hot-toast';

interface NetworkSelectorProps {
  selectedNetwork: SwapinNetwork | null;
  onNetworkChange: (network: SwapinNetwork) => void;
  currentChainId?: number;
}

const NetworkSelector: React.FC<NetworkSelectorProps> = ({ 
  selectedNetwork, 
  onNetworkChange, 
  currentChainId 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const networks = swapinService.getAllNetworks();

  const handleNetworkSelect = async (network: SwapinNetwork) => {
    try {
      const success = await swapinService.switchToNetwork(network.chainId);
      if (success) {
        onNetworkChange(network);
        toast.success(`Switched to ${network.name}`);
      } else {
        toast.error(`Failed to switch to ${network.name}`);
      }
    } catch (error) {
      console.error('Network switch error:', error);
      toast.error('Failed to switch network');
    }
    setIsOpen(false);
  };

  // Real logo assets where we have them; clean lettered-circle badge otherwise. No emojis.
  const NETWORK_LOGOS: Record<string, string> = {
    'Altcoinchain': 'Altcoinchain logo.png',
    'ETHO': 'ETHO logo.png',
    'OctaSpace': 'OCTA logo.png',
    'Ethereum': 'ETH logo.png',
    'DOGEchain': 'DOGEchain logo.png',
  };
  const NETWORK_COLORS: Record<string, string> = {
    'EGAZ': 'bg-yellow-500', 'PlanQ': 'bg-teal-500', 'OctaSpace': 'bg-purple-500',
    'PartyChain': 'bg-pink-500', 'EGEM': 'bg-emerald-500', 'ETHO': 'bg-blue-500',
    'Altcoinchain': 'bg-red-600', 'DOGEchain': 'bg-amber-500', 'Fantom': 'bg-blue-600',
    'BSC': 'bg-yellow-600', 'Ethereum': 'bg-indigo-500', 'Polygon': 'bg-purple-600',
    'Avalanche': 'bg-red-500', 'Arbitrum': 'bg-blue-400', 'Optimism': 'bg-red-400', 'Base': 'bg-blue-500',
  };

  const getNetworkIcon = (network: SwapinNetwork, size: string = 'w-7 h-7') => {
    const logo = NETWORK_LOGOS[network.name];
    if (logo) {
      return <img src={`${import.meta.env.BASE_URL}${logo}`} alt={network.name} className={`${size} object-contain rounded-full`} />;
    }
    const color = NETWORK_COLORS[network.name] || 'bg-slate-600';
    return (
      <div className={`${size} rounded-full ${color} flex items-center justify-center text-white text-[10px] font-bold uppercase`}>
        {(network.nativeCurrency?.symbol || network.name).slice(0, 3)}
      </div>
    );
  };

  return (
    <div className="relative z-50">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 px-4 py-3 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg border border-slate-700/50 transition-colors min-w-[200px]"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {selectedNetwork ? (
          <>
            {getNetworkIcon(selectedNetwork)}
            <div className="flex-1 text-left">
              <p className="font-medium">{selectedNetwork.name}</p>
              <p className="text-xs text-slate-400">{selectedNetwork.nativeCurrency.symbol}</p>
            </div>
            {currentChainId === selectedNetwork.chainId && (
              <Check className="w-4 h-4 text-emerald-400" />
            )}
          </>
        ) : (
          <>
            <div className="w-7 h-7 rounded-full bg-slate-600 flex items-center justify-center">
              <ChevronDown className="w-4 h-4 text-slate-300" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium">Select Network</p>
              <p className="text-xs text-slate-400">Choose a chain</p>
            </div>
          </>
        )}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop to close dropdown when clicking outside */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            
            <motion.div
              className="absolute top-full left-0 right-0 mt-2 bg-slate-800/98 backdrop-blur-xl rounded-lg border border-slate-700/50 shadow-2xl z-50 max-h-80 overflow-y-auto"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className="p-2">
                <div className="text-xs text-slate-400 px-3 py-2 font-medium">
                  Swapin.co Networks
                </div>
                {networks.map((network, index) => (
                  <motion.button
                    key={network.chainId}
                    onClick={() => handleNetworkSelect(network)}
                    className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${
                      selectedNetwork?.chainId === network.chainId
                        ? 'bg-blue-600/20 border border-blue-500/30'
                        : 'hover:bg-slate-700/50'
                    }`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ x: 4 }}
                  >
                    {getNetworkIcon(network, 'w-6 h-6')}
                    <div className="flex-1 text-left">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium">{network.name}</p>
                        {currentChainId === network.chainId && (
                          <Check className="w-3 h-3 text-emerald-400" />
                        )}
                      </div>
                      <p className="text-xs text-slate-400">{network.nativeCurrency.symbol}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs bg-slate-700/50 px-2 py-1 rounded">
                        ID: {network.chainId}
                      </span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </div>
                  </motion.button>
                ))}
              </div>
              
              <div className="border-t border-slate-700/50 p-3">
                <div className="text-xs text-slate-400 space-y-1">
                  <p>• All networks use Uniswap V2 compatible contracts</p>
                  <p>• Factory: 0x347aAc6D939f98854110Ff48dC5B7beB52D86445</p>
                  <p>• Router: 0xae168Ce47cebca9abbC5107a58df0532f1afa4d6</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NetworkSelector;