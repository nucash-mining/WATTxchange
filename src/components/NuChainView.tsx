import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Shield, Clock, Users } from 'lucide-react';
import NuChainDashboard from './nuchain/NuChainDashboard';
import ValidatorNodes from './nuchain/ValidatorNodes';
import MiningPools from './nuchain/MiningPools';
import NFTMiningRigs from './nuchain/NFTMiningRigs';
import NodeRewardDashboard from './nuchain/NodeRewardDashboard';

const NuChainView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'validators' | 'pools' | 'rigs' | 'rewards'>('dashboard');

  const stats = [
    {
      label: 'Block Time',
      value: '1.0s',
      change: 'Sonic Labs',
      icon: Clock,
      color: 'text-purple-400'
    },
    {
      label: 'TPS Capacity',
      value: '400K',
      change: 'zkRollup',
      icon: Zap,
      color: 'text-yellow-400'
    },
    {
      label: 'Active Validators',
      value: '247',
      change: '+12',
      icon: Shield,
      color: 'text-emerald-400'
    },
    {
      label: 'Mining Pools',
      value: '18',
      change: '+3',
      icon: Users,
      color: 'text-blue-400'
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
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            nuChain L2
          </h2>
          <p className="text-slate-400 mt-1">zkRollup Sidechain with NFT Mining Integration</p>
          <div className="flex items-center space-x-4 mt-2 text-sm">
            <span className="text-purple-400">⚡ Sonic Labs Technology</span>
            <span className="text-blue-400">🛡️ Altcoinchain Consensus</span>
            <span className="text-emerald-400">🎮 NFT Mining Pools</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 bg-slate-800/50 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('validators')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'validators'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Validators
          </button>
          <button
            onClick={() => setActiveTab('pools')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'pools'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Mining Pools
          </button>
          <button
            onClick={() => setActiveTab('rigs')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'rigs'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            NFT Rigs
          </button>
          <button
            onClick={() => setActiveTab('rewards')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'rewards'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Node Rewards
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
                  <p className={`text-sm ${stat.color}`}>{stat.change}</p>
                </div>
                <Icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* nuChain Architecture Overview */}
      <motion.div
        className="bg-gradient-to-r from-purple-600/10 to-blue-600/10 border border-purple-500/30 rounded-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-purple-600/20 rounded-lg">
            <Zap className="w-6 h-6 text-purple-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-purple-400 mb-2">nuChain L2 Architecture (Chain ID: 2331)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-400 mb-2">⚡ Sonic Labs Layer</h4>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>• 1-second block times</li>
                  <li>• 400,000+ TPS capacity</li>
                  <li>• Ultra-low latency</li>
                  <li>• EVM compatibility</li>
                </ul>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-emerald-400 mb-2">🛡️ zkRollup Security</h4>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>• Zero-knowledge proofs</li>
                  <li>• Altcoinchain validation</li>
                  <li>• Private transactions</li>
                  <li>• Fraud-proof system</li>
                </ul>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-400 mb-2">🎮 NFT Mining</h4>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>• Hardware component NFTs</li>
                  <li>• Virtual mining pools</li>
                  <li>• WATT token consumption</li>
                  <li>• NU token rewards</li>
                </ul>
              </div>
            </div>
            <div className="text-xs text-slate-400 space-y-1">
              <p>• Chain ID: 2331 (nuChain L2 zkRollup)</p>
              <p>• RPC: https://rpc.nuchain.network</p>
              <p>• Explorer: https://explorer.nuchain.network</p>
              <p>• WATT Destination: 0x7069C4CEC0972D2f5FA8E6886e438656D6e6f23b</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'dashboard' && <NuChainDashboard />}
        {activeTab === 'validators' && <ValidatorNodes />}
        {activeTab === 'pools' && <MiningPools />}
        {activeTab === 'rigs' && <NFTMiningRigs />}
        {activeTab === 'rewards' && <NodeRewardDashboard />}
      </motion.div>
    </div>
  );
};

export default NuChainView;