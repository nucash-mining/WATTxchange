import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

interface Chain {
  id: number;
  name: string;
  symbol: string;
  logo: string;
  color: string;
}

interface ChainSelectorProps {
  chains: Chain[];
  selectedChain: Chain;
  onSelect: (chain: Chain) => void;
  label?: string;
  disabled?: boolean;
}

const ChainSelector: React.FC<ChainSelectorProps> = ({
  chains,
  selectedChain,
  onSelect,
  label,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {label && (
        <label className="text-sm text-slate-400 mb-2 block">{label}</label>
      )}

      <motion.button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between bg-black/30 rounded-xl p-4 border border-slate-700/50 transition-all ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-slate-600/50'
        }`}
        whileHover={!disabled ? { scale: 1.01 } : {}}
        whileTap={!disabled ? { scale: 0.99 } : {}}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${selectedChain.color} flex items-center justify-center`}>
            <img
              src={selectedChain.logo}
              alt={selectedChain.name}
              className="w-6 h-6"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
          </div>
          <div className="text-left">
            <p className="font-medium">{selectedChain.name}</p>
            <p className="text-xs text-slate-400">{selectedChain.symbol}</p>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-slate-900 rounded-xl border border-slate-700/50 overflow-hidden z-50 shadow-xl"
            >
              {chains.map((chain) => (
                <motion.button
                  key={chain.id}
                  onClick={() => {
                    onSelect(chain);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors ${
                    selectedChain.id === chain.id ? 'bg-slate-800/30' : ''
                  }`}
                  whileHover={{ x: 4 }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${chain.color} flex items-center justify-center`}>
                      <img
                        src={chain.logo}
                        alt={chain.name}
                        className="w-5 h-5"
                        onError={(e) => { e.currentTarget.style.display = 'none' }}
                      />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">{chain.name}</p>
                      <p className="text-xs text-slate-400">Chain ID: {chain.id}</p>
                    </div>
                  </div>
                  {selectedChain.id === chain.id && (
                    <Check className="w-5 h-5 text-emerald-400" />
                  )}
                </motion.button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChainSelector;
