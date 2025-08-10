import React from 'react';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, Gamepad2, ArrowLeftRight, Settings, ShoppingCart, Server, Zap } from 'lucide-react';

interface MobileNavbarProps {
  currentView: string;
  onViewChange: (view: 'wallet' | 'dex' | 'mining' | 'swap' | 'settings' | 'marketplace' | 'nodes' | 'nuchain') => void;
  isNativeApp?: boolean;
}

const MobileNavbar: React.FC<MobileNavbarProps> = ({ currentView, onViewChange, isNativeApp }) => {
  const menuItems = [
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'dex', label: 'DEX', icon: TrendingUp },
    { id: 'mining', label: 'Mining', icon: Gamepad2 },
    { id: 'nuchain', label: 'nuChain', icon: Zap },
    { id: 'swap', label: 'Swap', icon: ArrowLeftRight },
  ];

  return (
    <motion.div 
      className={`fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-gray-800 z-40 ${isNativeApp ? 'safe-area-bottom' : ''}`}
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', damping: 20 }}
    >
      <div className={`flex justify-around items-center ${isNativeApp ? 'h-20' : 'h-16'}`}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <motion.button
              key={item.id}
              onClick={() => onViewChange(item.id as any)}
              className={`flex flex-col items-center justify-center w-16 h-full touch-target ${
                isActive 
                  ? item.id === 'nuchain'
                    ? 'text-purple-400'
                    : 'text-yellow-400'
                  : 'text-gray-500'
              }`}
              whileTap={{ scale: 0.9 }}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-1">{item.label}</span>
              {isActive && (
                <motion.div
                  className={`absolute bottom-0 w-10 h-1 rounded-t-md ${
                    item.id === 'nuchain' ? 'bg-purple-400' : 'bg-yellow-400'
                  }`}
                  layoutId="activeTabIndicator"
                />
              )}
            </motion.button>
          );
        })}
        
        <motion.button
          onClick={() => onViewChange('settings')}
          className={`flex flex-col items-center justify-center w-16 h-full touch-target ${
            currentView === 'settings' ? 'text-yellow-400' : 'text-gray-500'
          }`}
          whileTap={{ scale: 0.9 }}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] mt-1">More</span>
          {currentView === 'settings' && (
            <motion.div
              className="absolute bottom-0 w-10 h-1 rounded-t-md bg-yellow-400"
              layoutId="activeTabIndicator"
            />
          )}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default MobileNavbar;