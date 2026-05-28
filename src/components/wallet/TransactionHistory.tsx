import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownLeft, Clock, CheckCircle } from 'lucide-react';

const TransactionHistory: React.FC = () => {
  const transactions = [
    {
      id: '1',
      type: 'receive',
      amount: '0.05 BTC',
      usdValue: '$2,500.00',
      from: '1A1zP1...eP6XLn',
      status: 'confirmed',
      timestamp: '2 hours ago',
      hash: '0x1234...abcd'
    },
    {
      id: '2',
      type: 'send',
      amount: '150.00 ALT',
      usdValue: '$300.00',
      to: '0x742d...35Cc',
      status: 'confirmed',
      timestamp: '5 hours ago',
      hash: '0x5678...efgh'
    },
    {
      id: '3',
      type: 'receive',
      amount: '1.25 ETH',
      usdValue: '$4,375.00',
      from: '0x8ba1...f58c',
      status: 'pending',
      timestamp: '1 day ago',
      hash: '0x9abc...ijkl'
    }
  ];

  return (
    <motion.div
      className="bg-gray-900/30 backdrop-blur-xl rounded-xl p-6 border border-gray-800"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold">Recent Transactions</h3>
        <button className="text-yellow-400 hover:text-yellow-300 text-sm font-medium">
          View All
        </button>
      </div>

      <div className="space-y-4">
        {transactions.map((tx, index) => (
          <motion.div
            key={tx.id}
            className="flex items-center justify-between p-4 bg-black/30 rounded-lg hover:bg-black/50 transition-colors"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-center space-x-4">
              <div className={`p-2 rounded-lg ${
                tx.type === 'receive' 
                  ? 'bg-emerald-600/20 text-emerald-400' 
                  : 'bg-orange-600/20 text-orange-400'
              }`}>
                {tx.type === 'receive' ? (
                  <ArrowDownLeft className="w-4 h-4" />
                ) : (
                  <ArrowUpRight className="w-4 h-4" />
                )}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <p className="font-medium capitalize">{tx.type}</p>
                  {tx.status === 'confirmed' ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Clock className="w-4 h-4 text-yellow-400" />
                  )}
                </div>
                <p className="text-sm text-gray-400">
                  {tx.type === 'receive' ? `From ${tx.from}` : `To ${tx.to}`}
                </p>
                <p className="text-xs text-gray-500">{tx.timestamp}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium">{tx.amount}</p>
              <p className="text-sm text-gray-400">{tx.usdValue}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default TransactionHistory;