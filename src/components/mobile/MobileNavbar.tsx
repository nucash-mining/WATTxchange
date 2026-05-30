import React from 'react';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, Gamepad2, Cpu, Zap, MoreHorizontal } from 'lucide-react';

type ViewType = 'wallet' | 'dex' | 'mining' | 'swap' | 'settings' | 'marketplace' | 'nodes' | 'nuchain' | 'explorer' | 'pool';

interface MobileNavbarProps {
  currentView: string;
  onViewChange: (view: ViewType) => void;
  isNativeApp?: boolean;
}

const PRIMARY_ITEMS = [
  { id: 'wallet',  label: 'Wallet',  icon: Wallet      },
  { id: 'dex',     label: 'DEX',     icon: TrendingUp  },
  { id: 'pool',    label: 'Pool',    icon: Cpu         },
  { id: 'mining',  label: 'Mining',  icon: Gamepad2    },
  { id: 'nuchain', label: 'nuChain', icon: Zap         },
];

const MobileNavbar: React.FC<MobileNavbarProps> = ({ currentView, onViewChange, isNativeApp }) => {
  const [showMore, setShowMore] = React.useState(false);

  const MORE_ITEMS: { id: ViewType; label: string }[] = [
    { id: 'explorer',    label: 'Explorer'    },
    { id: 'nodes',       label: 'Nodes'       },
    { id: 'marketplace', label: 'Marketplace' },
    { id: 'swap',        label: 'Atomic Swap' },
    { id: 'settings',    label: 'Settings'    },
  ];

  return (
    <>
      {/* More drawer */}
      {showMore && (
        <motion.div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowMore(false)}
        >
          <motion.div
            className="absolute bottom-16 left-0 right-0 bg-gray-900/98 border-t border-gray-800 px-4 py-3 grid grid-cols-3 gap-3"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 20 }}
            onClick={e => e.stopPropagation()}
          >
            {MORE_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => { onViewChange(item.id); setShowMore(false); }}
                className={`py-3 rounded-xl text-sm font-medium transition-colors ${
                  currentView === item.id
                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </motion.div>
        </motion.div>
      )}

      {/* Bottom bar */}
      <motion.div
        className={`fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-gray-800 z-40 ${isNativeApp ? 'safe-area-bottom' : ''}`}
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', damping: 20 }}
      >
        <div className={`flex justify-around items-center ${isNativeApp ? 'h-20' : 'h-16'}`}>
          {PRIMARY_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <motion.button
                key={item.id}
                onClick={() => { onViewChange(item.id as ViewType); setShowMore(false); }}
                className={`relative flex flex-col items-center justify-center w-14 h-full ${
                  isActive
                    ? item.id === 'nuchain' ? 'text-purple-400' : 'text-yellow-400'
                    : 'text-gray-500'
                }`}
                whileTap={{ scale: 0.9 }}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] mt-0.5">{item.label}</span>
                {isActive && (
                  <motion.div
                    className={`absolute bottom-0 w-10 h-0.5 rounded-t ${
                      item.id === 'nuchain' ? 'bg-purple-400' : 'bg-yellow-400'
                    }`}
                    layoutId="mobileTab"
                  />
                )}
              </motion.button>
            );
          })}

          {/* More button */}
          <motion.button
            onClick={() => setShowMore(v => !v)}
            className={`flex flex-col items-center justify-center w-14 h-full ${showMore ? 'text-yellow-400' : 'text-gray-500'}`}
            whileTap={{ scale: 0.9 }}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">More</span>
          </motion.button>
        </div>
      </motion.div>
    </>
  );
};

export default MobileNavbar;
