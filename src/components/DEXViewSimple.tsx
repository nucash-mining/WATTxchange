import React, { useState } from 'react';
import { motion } from 'framer-motion';

const DEXViewSimple: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'uniswap' | 'spot' | 'pools' | 'multichain' | 'bridge' | 'perps'>('uniswap');

  const tabs = [
    { id: 'uniswap', label: 'Uniswap V3', icon: '🦄' },
    { id: 'spot', label: 'Spot Trading', icon: '📈' },
    { id: 'pools', label: 'Liquidity Pools', icon: '🏊' },
    { id: 'multichain', label: 'Multi-Chain', icon: '🌐' },
    { id: 'bridge', label: 'Bridge', icon: '🌉' },
    { id: 'perps', label: 'Perpetuals', icon: '⚡' }
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
          <h2 className="text-3xl font-bold">DEX Trading</h2>
          <p className="text-slate-400 mt-1">Decentralized Exchange Interface</p>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <span className="text-2xl">📈</span>
            </div>
            <span className="text-xs bg-slate-700/50 px-2 py-1 rounded text-emerald-400">+12.5%</span>
          </div>
          <div>
            <p className="text-slate-400 text-sm">24h Volume</p>
            <p className="text-2xl font-bold">$2.4M</p>
          </div>
        </motion.div>

        <motion.div
          className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-500/20 rounded-lg">
              <span className="text-2xl">💱</span>
            </div>
            <span className="text-xs bg-slate-700/50 px-2 py-1 rounded text-emerald-400">Active</span>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Active Pairs</p>
            <p className="text-2xl font-bold">24</p>
          </div>
        </motion.div>

        <motion.div
          className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <span className="text-2xl">🏊</span>
            </div>
            <span className="text-xs bg-slate-700/50 px-2 py-1 rounded text-blue-400">Live</span>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Total Liquidity</p>
            <p className="text-2xl font-bold">$8.9M</p>
          </div>
        </motion.div>

        <motion.div
          className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-500/20 rounded-lg">
              <span className="text-2xl">⚡</span>
            </div>
            <span className="text-xs bg-slate-700/50 px-2 py-1 rounded text-orange-400">Fast</span>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Avg. Swap Time</p>
            <p className="text-2xl font-bold">2.3s</p>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-800/30 backdrop-blur-xl rounded-xl p-1 border border-slate-700/50">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-all ${
              activeTab === tab.id
                ? 'bg-slate-700 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span>{tab.icon}</span>
            <span className="font-medium">{tab.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
      >
        <h3 className="text-xl font-bold mb-4">
          {tabs.find(t => t.id === activeTab)?.icon} {tabs.find(t => t.id === activeTab)?.label}
        </h3>
        
        <div className="text-center py-12">
          <div className="text-6xl mb-4">{tabs.find(t => t.id === activeTab)?.icon}</div>
          <h4 className="text-xl font-semibold mb-2">
            {tabs.find(t => t.id === activeTab)?.label} Interface
          </h4>
          <p className="text-slate-400">
            This is a simplified version of the DEX interface. 
            The full component will be restored once all dependencies are working.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default DEXViewSimple;
