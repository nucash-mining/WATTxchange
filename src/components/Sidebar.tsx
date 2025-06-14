import React from 'react';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, Gamepad2, ArrowLeftRight, Settings, ShoppingCart, Server, Zap } from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: 'wallet' | 'dex' | 'mining' | 'swap' | 'settings' | 'marketplace' | 'nodes' | 'nuchain') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
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

  return (
    <aside className="w-64 bg-black/50 backdrop-blur-xl border-r border-gray-800 p-4">
      <nav className="space-y-2">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <motion.button
              key={item.id}
              onClick={() => onViewChange(item.id as any)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? item.id === 'nuchain'
                    ? 'bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 text-purple-400'
                    : 'bg-gradient-to-r from-yellow-600/20 to-emerald-600/20 border border-yellow-500/30 text-yellow-400'
                  : 'hover:bg-gray-900/50 text-gray-300 hover:text-white'
              }`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
              {item.id === 'nuchain' && (
                <span className="ml-auto text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
                  L2
                </span>
              )}
              {isActive && (
                <motion.div
                  className={`ml-auto w-2 h-2 rounded-full ${
                    item.id === 'nuchain' ? 'bg-purple-400' : 'bg-yellow-400'
                  }`}
                  layoutId="activeIndicator"
                />
              )}
            </motion.button>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;