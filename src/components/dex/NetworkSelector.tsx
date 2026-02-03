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

  const getNetworkIcon = (network: SwapinNetwork) => {
    const iconMap: Record<string, string> = {
      'EGAZ': '⚡',
      'PlanQ': '🌐',
      'OctaSpace': '🐙',
      'PartyChain': '🎉',
      'EGEM': '💎',
      'ETHO': '🔷',
      'Altcoinchain': '🔗',
      'DOGEchain': '🐕',
      'Fantom': '👻',
      'BSC': '🔶',
      'Ethereum': '💎',
      'Polygon': '🔷',
      'Avalanche': '🔺',
      'Arbitrum': '🔵',
      'Optimism': '🔴',
      'Base': '🟦'
    };
    return iconMap[network.name] || '🔗';
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
            <span className="text-xl">{getNetworkIcon(selectedNetwork)}</span>
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
            <span className="text-xl">🔗</span>
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
                    <span className="text-lg">{getNetworkIcon(network)}</span>
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