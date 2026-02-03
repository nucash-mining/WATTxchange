import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, ExternalLink, RefreshCw } from 'lucide-react';
import { atomicSwapService, AtomicSwapOrder } from '../../services/atomicSwapService';
import { useWallet } from '../../hooks/useWallet';

const SwapHistory: React.FC = () => {
  const { isConnected, address } = useWallet();
  const [swapHistory, setSwapHistory] = useState<AtomicSwapOrder[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSwapHistory();
  }, [isConnected, address]);

  const loadSwapHistory = async () => {
    setLoading(true);
    try {
      if (isConnected && address) {
        const orders = await atomicSwapService.getUserOrders(address);
        setSwapHistory(orders);
      } else {
        // Load mock data for demo
        const orders = await atomicSwapService.getOrders();
        setSwapHistory(orders);
      }
    } catch (error) {
      console.error('Failed to load swap history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'pending':
      case 'active':
      case 'matched':
        return <Clock className="w-5 h-5 text-yellow-400" />;
      case 'failed':
      case 'expired':
      case 'cancelled':
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
      case 'active':
      case 'matched':
        return 'text-yellow-400';
      case 'failed':
      case 'expired':
      case 'cancelled':
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
        <div className="flex items-center space-x-2">
          <button 
            onClick={loadSwapHistory}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <div className="flex items-center space-x-2 text-sm text-slate-400">
            <span>{swapHistory.filter(s => s.status === 'completed').length} Completed</span>
            <span>•</span>
            <span>{swapHistory.filter(s => ['active', 'matched', 'pending'].includes(s.status)).length} Pending</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {swapHistory.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-400 mb-2">No swap history yet</p>
            <p className="text-slate-500 text-sm">Your swap history will appear here</p>
          </div>
        ) : (
          swapHistory.map((swap, index) => (
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
                      <p className="text-sm text-slate-400">{swap.createdAt.toLocaleDateString()}</p>
                      <span className="text-xs text-slate-500">•</span>
                      <p className="text-xs text-slate-500">{swap.id.substring(0, 10)}...</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm text-slate-400">Rate</p>
                    <p className="font-medium">1:{swap.rate}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getStatusColor(swap.status)}`}>
                    {swap.status}
                  </span>
                  {swap.txHash && (
                    <motion.button
                      className="p-2 hover:bg-slate-700/50 rounded transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      title="View on Explorer"
                    >
                      <ExternalLink className="w-4 h-4 text-slate-400" />
                    </motion.button>
                  )}
                </div>
              </div>

              {swap.status === 'active' && (
                <div className="mt-3 bg-yellow-500/10 border border-yellow-500/30 rounded p-3">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-yellow-400" />
                    <p className="text-sm text-yellow-400">
                      Swap in progress - waiting for counterparty
                    </p>
                  </div>
                </div>
              )}

              {swap.status === 'matched' && (
                <div className="mt-3 bg-blue-500/10 border border-blue-500/30 rounded p-3">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <p className="text-sm text-blue-400">
                      Swap matched - waiting for blockchain confirmations
                    </p>
                  </div>
                </div>
              )}

              {(swap.status === 'expired' || swap.status === 'cancelled') && (
                <div className="mt-3 bg-red-500/10 border border-red-500/30 rounded p-3">
                  <div className="flex items-center space-x-2">
                    <XCircle className="w-4 h-4 text-red-400" />
                    <p className="text-sm text-red-400">
                      Swap {swap.status} - funds have been returned to your wallet
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* History Statistics */}
      {swapHistory.length > 0 && (
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
                {swapHistory.filter(s => ['active', 'matched', 'pending'].includes(s.status)).length}
              </p>
              <p className="text-slate-400 text-sm">Pending</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-400">
                {swapHistory.filter(s => ['expired', 'cancelled', 'failed'].includes(s.status)).length}
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
      )}
    </motion.div>
  );
};

export default SwapHistory;