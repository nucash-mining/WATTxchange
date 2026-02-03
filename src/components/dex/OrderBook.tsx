import React from 'react';
import { motion } from 'framer-motion';

const OrderBook: React.FC = () => {
  const sellOrders = [
    { price: '0.00245', amount: '1,234', total: '3.02' },
    { price: '0.00244', amount: '2,567', total: '6.26' },
    { price: '0.00243', amount: '5,432', total: '13.20' },
    { price: '0.00242', amount: '3,876', total: '9.38' },
    { price: '0.00241', amount: '7,654', total: '18.45' },
  ];

  const buyOrders = [
    { price: '0.00239', amount: '2,345', total: '5.60' },
    { price: '0.00238', amount: '4,567', total: '10.87' },
    { price: '0.00237', amount: '6,789', total: '16.09' },
    { price: '0.00236', amount: '3,456', total: '8.16' },
    { price: '0.00235', amount: '8,901', total: '20.92' },
  ];

  return (
    <motion.div
      className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <h3 className="text-xl font-semibold mb-6">Order Book</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sell Orders */}
        <div>
          <div className="flex justify-between text-sm text-slate-400 mb-3">
            <span>Price (ETH)</span>
            <span>Amount (ALT)</span>
            <span>Total</span>
          </div>
          <div className="space-y-1">
            {sellOrders.map((order, index) => (
              <motion.div
                key={index}
                className="flex justify-between text-sm py-1 hover:bg-red-500/10 rounded cursor-pointer"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <span className="text-red-400">{order.price}</span>
                <span>{order.amount}</span>
                <span className="text-slate-400">{order.total}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Buy Orders */}
        <div>
          <div className="flex justify-between text-sm text-slate-400 mb-3">
            <span>Price (ETH)</span>
            <span>Amount (ALT)</span>
            <span>Total</span>
          </div>
          <div className="space-y-1">
            {buyOrders.map((order, index) => (
              <motion.div
                key={index}
                className="flex justify-between text-sm py-1 hover:bg-emerald-500/10 rounded cursor-pointer"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <span className="text-emerald-400">{order.price}</span>
                <span>{order.amount}</span>
                <span className="text-slate-400">{order.total}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Spread */}
      <div className="mt-6 p-3 bg-slate-900/50 rounded-lg text-center border border-slate-700/30">
        <p className="text-sm text-slate-400">Spread: 0.00002 ETH (0.83%)</p>
      </div>
    </motion.div>
  );
};

export default OrderBook;