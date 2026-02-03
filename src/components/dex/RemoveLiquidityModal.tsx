import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import RemoveLiquidityForm from './RemoveLiquidityForm';

interface Position {
  id: string;
  pool: {
    token0: string;
    token1: string;
    fee: number;
  };
  liquidity: string;
  token0Amount: string;
  token1Amount: string;
  uncollectedFees: string;
}

interface RemoveLiquidityModalProps {
  isOpen: boolean;
  onClose: () => void;
  position: Position | null;
}

const RemoveLiquidityModal: React.FC<RemoveLiquidityModalProps> = ({ isOpen, onClose, position }) => {
  if (!isOpen || !position) return null;

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
              <h3 className="text-xl font-semibold">Remove Liquidity</h3>
              <p className="text-slate-400 text-sm">
                {position.pool.token0}/{position.pool.token1} Pool
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
            <RemoveLiquidityForm position={position} onClose={onClose} />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default RemoveLiquidityModal;