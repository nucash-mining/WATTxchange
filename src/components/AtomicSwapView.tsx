import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftRight, Shield, Clock, CheckCircle } from 'lucide-react';
import SwapForm from './swap/SwapForm';
import SwapHistory from './swap/SwapHistory';
import OrderBook from './swap/OrderBook';

const AtomicSwapView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'swap' | 'orders' | 'history'>('swap');

  const stats = [
    {
      label: 'Total Swaps',
      value: '1,247',
      icon: ArrowLeftRight,
      color: 'text-blue-400'
    },
    {
      label: 'Success Rate',
      value: '99.2%',
      icon: CheckCircle,
      color: 'text-emerald-400'
    },
    {
      label: 'Avg. Time',
      value: '12m',
      icon: Clock,
      color: 'text-yellow-400'
    },
    {
      label: 'Security',
      value: 'Trustless',
      icon: Shield,
      color: 'text-purple-400'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h2 className="text-3xl font-bold">Atomic Swaps</h2>
          <p className="text-slate-400 mt-1">Trustless P2P cryptocurrency trading</p>
        </div>
        
        <div className="flex items-center space-x-2 bg-slate-800/50 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('swap')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'swap'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Swap
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'orders'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Order Book
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            History
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <Icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'swap' && <SwapForm />}
        {activeTab === 'orders' && <OrderBook />}
        {activeTab === 'history' && <SwapHistory />}
      </motion.div>
    </div>
  );
};

export default AtomicSwapView;