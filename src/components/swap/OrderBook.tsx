import React from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, XCircle } from 'lucide-react';

const OrderBook: React.FC = () => {
  const orders = [
    {
      id: '1',
      type: 'buy',
      sendToken: 'BTC',
      receiveToken: 'ETH',
      sendAmount: '0.5',
      receiveAmount: '8.25',
      rate: '16.5',
      timelock: '2 hours',
      status: 'active'
    },
    {
      id: '2',
      type: 'sell',
      sendToken: 'ETH',
      receiveToken: 'ALT',
      sendAmount: '2.0',
      receiveAmount: '1000',
      rate: '500',
      timelock: '1.5 hours',
      status: 'active'
    },
    {
      id: '3',
      type: 'buy',
      sendToken: 'ALT',
      receiveToken: 'BTC',
      sendAmount: '5000',
      receiveAmount: '0.25',
      rate: '0.00005',
      timelock: '3 hours',
      status: 'matched'
    },
    {
      id: '4',
      type: 'sell',
      sendToken: 'LTC',
      receiveToken: 'ETH',  
      sendAmount: '10',
      receiveAmount: '0.85',
      rate: '0.085',
      timelock: '1 hour',
      status: 'expired'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Clock className="w-4 h-4 text-blue-400" />;
      case 'matched':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'expired':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-500/10 text-blue-400';
      case 'matched':  
        return 'bg-emerald-500/10 text-emerald-400';
      case 'expired':
        return 'bg-red-500/10 text-red-400';
      default:
        return 'bg-gray-500/10 text-gray-400';
    }
  };

  return (
    <motion.div
      className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold">Active Swap Orders</h3>
        <div className="flex items-center space-x-2 text-sm text-slate-400">
          <span>{orders.filter(o => o.status === 'active').length} Active</span>
          <span>•</span>
          <span>{orders.filter(o => o.status === 'matched').length} Matched</span>
        </div>
      </div>

      <div className="space-y-4">
        {orders.map((order, index) => (
          <motion.div
            key={order.id}
            className="bg-slate-900/30 rounded-lg p-4 border border-slate-700/30 hover:border-slate-600/50 transition-colors"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  order.type === 'buy' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {order.type.toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">
                    {order.sendAmount} {order.sendToken} → {order.receiveAmount} {order.receiveToken}
                  </p>
                  <p className="text-sm text-slate-400">
                    Rate: 1 {order.sendToken} = {order.rate} {order.receiveToken}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-slate-400">Time Lock</p>
                  <p className="font-medium">{order.timelock}</p>
                </div>
                <div className={`flex items-center space-x-1 px-2 py-1 rounded text-xs ${getStatusColor(order.status)}`}>
                  {getStatusIcon(order.status)}
                  <span className="capitalize">{order.status}</span>
                </div>
                {order.status === 'active' && (
                  <motion.button
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Match
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Order Statistics */}
      <div className="mt-6 pt-6 border-t border-slate-700/30">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-blue-400">{orders.filter(o => o.status === 'active').length}</p>
            <p className="text-slate-400 text-sm">Active Orders</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-400">{orders.filter(o => o.status === 'matched').length}</p>
            <p className="text-slate-400 text-sm">Matched Today</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-400">15.3m</p>
            <p className="text-slate-400 text-sm">Avg. Match Time</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default OrderBook;