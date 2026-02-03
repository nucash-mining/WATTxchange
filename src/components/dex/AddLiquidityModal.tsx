import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import AddLiquidityForm from './AddLiquidityForm';

interface AddLiquidityModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPool?: {
    id: string;
    name: string;
    token0: string;
    token1: string;
    reserve0: string;
    reserve1: string;
    totalSupply: string;
  };
}

const AddLiquidityModal: React.FC<AddLiquidityModalProps> = ({ isOpen, onClose, selectedPool }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <AnimatePresence>
        <motion.div
          className="bg-slate-800/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 max-w-md w-full"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
            <div>
              <h3 className="text-xl font-semibold">Add Liquidity</h3>
              <p className="text-slate-400 text-sm">
                {selectedPool ? `${selectedPool.token0}/${selectedPool.token1} Pool` : 'Create a new position'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <AddLiquidityForm 
              selectedPool={selectedPool} 
              onClose={onClose}
              chainId={2330} // Altcoinchain
            />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default AddLiquidityModal;