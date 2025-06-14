import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react';

const SwapHistory: React.FC = () => {
  const swapHistory = [
    {
      id: '0x1234...abcd',
      sendToken: 'BTC',
      receiveToken: 'ETH',
      sendAmount: '0.25',
      receiveAmount: '4.125',
      status: 'completed',
      timestamp: '2 hours ago',
      txHash: '0x1234567890abcdef...'
    },
    {
      id: '0x5678...efgh',
      sendToken: 'ETH',
      receiveToken: 'ALT',
      sendAmount: '1.5',
      receiveAmount: '750',
      status: 'completed',
      timestamp: '1 day ago',
      txHash: '0x5678901234abcdef...'
    },
    {
      id: '0x9abc...ijkl',
      sendToken: 'ALT',
      receiveToken: 'BTC',
      sendAmount: '2000',
      receiveAmount: '0.1',
      status: 'pending',
      timestamp: '2 days ago',
      txHash: '0x9abc123456defghi...'
    },
    {
      id: '0xdef0...mnop',
      sendToken: 'LTC',
      receiveToken: 'ETH',
      sendAmount: '5',
      receiveAmount: '0.425',
      status: 'failed',
      timestamp: '3 days ago',
      txHash: '0xdef0123456789abc...'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-400" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-emerald-400';
      case 'pending':
        return 'text-yellow-400';
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <motion.div
      className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold">Swap History</h3>
        <div className="flex items-center space-x-2 text-sm text-slate-400">
          <span>{swapHistory.filter(s => s.status === 'completed').length} Completed</span>
          <span>•</span>
          <span>{swapHistory.filter(s => s.status === 'pending').length} Pending</span>
        </div>
      </div>

      <div className="space-y-4">
        {swapHistory.map((swap, index) => (
          <motion.div
            key={swap.id}
            className="bg-slate-900/30 rounded-lg p-4 border border-slate-700/30 hover:border-slate-600/50 transition-colors"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {getStatusIcon(swap.status)}
                <div>
                  <p className="font-medium">
                    {swap.sendAmount} {swap.sendToken} → {swap.receiveAmount} {swap.receiveToken}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-sm text-slate-400">{swap.timestamp}</p>
                    <span className="text-xs text-slate-500">•</span>
                    <p className="text-xs text-slate-500">{swap.id}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getStatusColor(swap.status)}`}>
                  {swap.status}
                </span>
                <motion.button
                  className="p-2 hover:bg-slate-700/50 rounded transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="View on Explorer"
                >
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                </motion.button>
              </div>
            </div>

            {swap.status === 'pending' && (
              <div className="mt-3 bg-yellow-500/10 border border-yellow-500/30 rounded p-3">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  <p className="text-sm text-yellow-400">
                    Swap in progress - waiting for blockchain confirmations
                  </p>
                </div>
              </div>
            )}

            {swap.status === 'failed' && (
              <div className="mt-3 bg-red-500/10 border border-red-500/30 rounded p-3">
                <div className="flex items-center space-x-2">
                  <XCircle className="w-4 h-4 text-red-400" />
                  <p className="text-sm text-red-400">
                    Swap failed - funds have been returned to your wallet
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* History Statistics */}
      <div className="mt-6 pt-6 border-t border-slate-700/30">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-emerald-400">
              {swapHistory.filter(s => s.status === 'completed').length}
            </p>
            <p className="text-slate-400 text-sm">Completed</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-400">
              {swapHistory.filter(s => s.status === 'pending').length}
            </p>
            <p className="text-slate-400 text-sm">Pending</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-400">
              {swapHistory.filter(s => s.status === 'failed').length}
            </p>
            <p className="text-slate-400 text-sm">Failed</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-400">
              {((swapHistory.filter(s => s.status === 'completed').length / swapHistory.length) * 100).toFixed(1)}%
            </p>
            <p className="text-slate-400 text-sm">Success Rate</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SwapHistory;