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

      {/* Built with Bolt.new badge */}
      <div className="flex justify-center mt-8">
        <a 
          href="https://bolt.new" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center space-x-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-colors border border-slate-700/50"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13 2L4.09 12.11C3.69 12.59 3.48 12.83 3.43 13.11C3.38 13.35 3.44 13.6 3.6 13.8C3.78 14.03 4.14 14.12 4.84 14.31L10.07 15.93C10.35 16.02 10.49 16.06 10.59 16.15C10.68 16.23 10.73 16.34 10.73 16.46C10.74 16.6 10.65 16.76 10.46 17.08L7.75 21.5" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14.7 14.5L16.7 14.5C17.2523 14.5 17.5284 14.5 17.7611 14.3891C17.9623 14.2929 18.1297 14.1255 18.2259 13.9243C18.3368 13.6916 18.3368 13.4155 18.3368 12.8632L18.3368 6.13678C18.3368 5.58451 18.3368 5.30837 18.2259 5.07568C18.1297 4.87446 17.9623 4.70708 17.7611 4.61083C17.5284 4.5 17.2523 4.5 16.7 4.5L14.7 4.5" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-yellow-400 font-medium">Built with Bolt.new</span>
        </a>
      </div>
    </div>
  );
};

export default AtomicSwapView;