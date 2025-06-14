import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, ShoppingCart, Server, Zap, ArrowLeftRight, Gamepad2, TrendingUp, Wallet } from 'lucide-react';

interface MobileMoreMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onViewChange: (view: 'wallet' | 'dex' | 'mining' | 'swap' | 'settings' | 'marketplace' | 'nodes' | 'nuchain') => void;
  currentView: string;
}

const MobileMoreMenu: React.FC<MobileMoreMenuProps> = ({ isOpen, onClose, onViewChange, currentView }) => {
  const menuItems = [
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'nodes', label: 'Nodes', icon: Server },
    { id: 'dex', label: 'DEX', icon: TrendingUp },
    { id: 'mining', label: 'Mining Game', icon: Gamepad2 },
    { id: 'nuchain', label: 'nuChain L2', icon: Zap },
    { id: 'marketplace', label: 'Tech Marketplace', icon: ShoppingCart },
    { id: 'swap', label: 'Atomic Swap', icon: ArrowLeftRight },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-xl font-bold">Menu</h2>
          <motion.button
            onClick={onClose}
            className="p-2 bg-gray-900/50 rounded-full"
            whileTap={{ scale: 0.9 }}
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              
              return (
                <motion.button
                  key={item.id}
                  onClick={() => {
                    onViewChange(item.id as any);
                    onClose();
                  }}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl ${
                    isActive
                      ? item.id === 'nuchain'
                        ? 'bg-purple-600/20 border border-purple-500/30 text-purple-400'
                        : 'bg-yellow-600/20 border border-yellow-500/30 text-yellow-400'
                      : 'bg-gray-800/50 border border-gray-700/50 text-gray-300'
                  }`}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon className="w-8 h-8 mb-2" />
                  <span className="text-sm">{item.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MobileMoreMenu;