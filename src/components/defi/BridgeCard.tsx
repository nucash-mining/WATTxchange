import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2, AlertCircle } from 'lucide-react';

interface BridgeCardProps {
  sourceChain: {
    name: string;
    logo: string;
    color: string;
  };
  destChain: {
    name: string;
    logo: string;
    color: string;
  };
  amount: string;
  token: string;
  fee: string;
  estimatedTime: string;
  isBridging: boolean;
  onBridge: () => void;
  disabled?: boolean;
}

const BridgeCard: React.FC<BridgeCardProps> = ({
  sourceChain,
  destChain,
  amount,
  token,
  fee,
  estimatedTime,
  isBridging,
  onBridge,
  disabled = false
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 border border-slate-700/50"
    >
      {/* Bridge Route Visualization */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <div className="flex flex-col items-center">
          <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${sourceChain.color} flex items-center justify-center mb-2`}>
            <img
              src={sourceChain.logo}
              alt={sourceChain.name}
              className="w-10 h-10"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
          </div>
          <span className="text-sm font-medium">{sourceChain.name}</span>
          <span className="text-xs text-slate-400">Source</span>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <motion.div
            className="flex items-center gap-2"
            animate={{ x: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <div className="h-0.5 w-12 bg-gradient-to-r from-yellow-500 to-transparent" />
            <ArrowRight className="w-6 h-6 text-yellow-400" />
            <div className="h-0.5 w-12 bg-gradient-to-l from-emerald-500 to-transparent" />
          </motion.div>
        </div>

        <div className="flex flex-col items-center">
          <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${destChain.color} flex items-center justify-center mb-2`}>
            <img
              src={destChain.logo}
              alt={destChain.name}
              className="w-10 h-10"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
          </div>
          <span className="text-sm font-medium">{destChain.name}</span>
          <span className="text-xs text-slate-400">Destination</span>
        </div>
      </div>

      {/* Bridge Details */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between py-2 border-b border-slate-700/30">
          <span className="text-slate-400">Amount</span>
          <span className="font-medium">{amount || '0'} {token}</span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-slate-700/30">
          <span className="text-slate-400">Bridge Fee</span>
          <span className="font-medium text-yellow-400">{fee}</span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-slate-700/30">
          <span className="text-slate-400">You'll Receive</span>
          <span className="font-medium text-emerald-400">
            ~{amount ? (parseFloat(amount) * 0.999).toFixed(6) : '0'} {token}
          </span>
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="text-slate-400">Estimated Time</span>
          <span className="font-medium">{estimatedTime}</span>
        </div>
      </div>

      {/* Warning */}
      {parseFloat(amount || '0') > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-yellow-600/10 border border-yellow-500/20 rounded-lg p-3 mb-4"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5" />
            <p className="text-xs text-yellow-400">
              Bridge transactions are irreversible. Please verify the destination address before proceeding.
            </p>
          </div>
        </motion.div>
      )}

      {/* Bridge Button */}
      <motion.button
        onClick={onBridge}
        disabled={disabled || isBridging || !amount || parseFloat(amount) <= 0}
        className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
          disabled || isBridging || !amount || parseFloat(amount) <= 0
            ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-yellow-600 to-emerald-600 hover:from-yellow-500 hover:to-emerald-500'
        }`}
        whileHover={!disabled && !isBridging && amount && parseFloat(amount) > 0 ? { scale: 1.02 } : {}}
        whileTap={!disabled && !isBridging && amount && parseFloat(amount) > 0 ? { scale: 0.98 } : {}}
      >
        {isBridging ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Bridging...
          </span>
        ) : (
          `Bridge ${amount || '0'} ${token}`
        )}
      </motion.button>
    </motion.div>
  );
};

export default BridgeCard;
