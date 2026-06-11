import React from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  ArrowRight
} from 'lucide-react';

interface BridgeTransaction {
  id: string;
  direction: 'polygon-to-wattx' | 'wattx-to-polygon';
  amount: string;
  status: 'pending' | 'confirming' | 'completed' | 'failed';
  sourceChain: string;
  destChain: string;
  sourceTxHash: string;
  destTxHash?: string;
  timestamp: number;
  nonce: number;
}

interface BridgeHistoryProps {
  history: BridgeTransaction[];
}

const BridgeHistory: React.FC<BridgeHistoryProps> = ({ history }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'confirming':
        return <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-emerald-400 bg-emerald-500/10';
      case 'failed':
        return 'text-red-400 bg-red-500/10';
      case 'confirming':
        return 'text-yellow-400 bg-yellow-500/10';
      default:
        return 'text-slate-400 bg-slate-500/10';
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const truncateHash = (hash: string) => {
    return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
  };

  if (history.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50 text-center"
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
          <Clock className="w-8 h-8 text-slate-500" />
        </div>
        <h3 className="text-lg font-medium mb-2">No Bridge History</h3>
        <p className="text-slate-400">Your bridge transactions will appear here</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50"
    >
      <h3 className="text-lg font-bold mb-4">Bridge History</h3>
      <div className="space-y-4">
        {history.map((tx, index) => (
          <motion.div
            key={tx.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-black/30 rounded-xl p-4 border border-slate-700/30"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {getStatusIcon(tx.status)}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{tx.sourceChain}</span>
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                    <span className="font-medium">{tx.destChain}</span>
                  </div>
                  <p className="text-xs text-slate-400">{formatDate(tx.timestamp)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold">{tx.amount} {tx.direction === 'polygon-to-wattx' ? 'WATT' : 'tWATTx'}</p>
                <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(tx.status)}`}>
                  {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <a
                href={`https://polygonscan.com/tx/${tx.sourceTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
              >
                <span>Source: {truncateHash(tx.sourceTxHash)}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              {tx.destTxHash && (
                <a
                  href={`#`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
                >
                  <span>Dest: {truncateHash(tx.destTxHash)}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default BridgeHistory;
