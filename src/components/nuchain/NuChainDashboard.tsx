import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, TrendingUp, Shield, Zap, Clock, Users, Coins, Server, Cpu } from 'lucide-react';
import LiveMiningDashboard from './LiveMiningDashboard';
import ContractDeployment from './ContractDeployment';

const NuChainDashboard: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'live' | 'contracts'>('overview');

  const networkMetrics = [
    { label: 'Current Block', value: '2,847,392', icon: Activity, color: 'text-blue-400' },
    { label: 'Transactions/sec', value: '12,847', icon: TrendingUp, color: 'text-emerald-400' },
    { label: 'Gas Price', value: '0.001 NU', icon: Zap, color: 'text-yellow-400' },
    { label: 'Network Uptime', value: '99.98%', icon: Shield, color: 'text-purple-400' }
  ];
      
  const validatorMetrics = [
    { label: 'Active Validators', value: '247', icon: Users, color: 'text-emerald-400' },
    { label: 'Total Staked', value: '24.7M NU', icon: Coins, color: 'text-blue-400' },
    { label: 'Avg. Block Time', value: '1.02s', icon: Clock, color: 'text-purple-400' },
    { label: 'Validator Rewards', value: '8.5% APY', icon: TrendingUp, color: 'text-yellow-400' }
  ];

  const miningPoolMetrics = [
    { label: 'Active Pools', value: '18', icon: Server, color: 'text-blue-400' },
    { label: 'Total WATT Locked', value: '1.8M', icon: Coins, color: 'text-yellow-400' },
    { label: 'Mining NFTs', value: '3,247', icon: Activity, color: 'text-purple-400' },
    { label: 'Pool Uptime', value: '98.7%', icon: Shield, color: 'text-emerald-400' }
  ];

  const recentBlocks = [
    { height: 2847392, hash: '0x1a2b3c...', txs: 247, validator: 'Pool-Alpha', time: '1.1s ago' },
    { height: 2847391, hash: '0x4d5e6f...', txs: 189, validator: 'Pool-Beta', time: '2.1s ago' },
    { height: 2847390, hash: '0x7g8h9i...', txs: 312, validator: 'Pool-Gamma', time: '3.0s ago' },
    { height: 2847389, hash: '0xjklmno...', txs: 156, validator: 'Pool-Delta', time: '4.2s ago' },
    { height: 2847388, hash: '0xpqrstu...', txs: 278, validator: 'Pool-Epsilon', time: '5.1s ago' }
  ];

  return (
    <div className="space-y-6">
      {/* Sub-navigation */}
      <div className="flex items-center space-x-2 bg-slate-800/50 rounded-lg p-1">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`px-4 py-2 rounded-md transition-colors ${
            activeSubTab === 'overview'
              ? 'bg-purple-600 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveSubTab('live')}
          className={`px-4 py-2 rounded-md transition-colors ${
            activeSubTab === 'live'
              ? 'bg-purple-600 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Live Mining
        </button>
        <button
          onClick={() => setActiveSubTab('contracts')}
          className={`px-4 py-2 rounded-md transition-colors ${
            activeSubTab === 'contracts'
              ? 'bg-purple-600 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Contracts
        </button>
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeSubTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
            >
        {activeSubTab === 'overview' && (
          <div className="space-y-6">
            {/* Network Metrics */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Network Performance</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {networkMetrics.map((metric, index) => {
                  const Icon = metric.icon;
                  return (
                    <motion.div
                      key={metric.label}
                      className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                >
                      <div className="flex items-center justify-between mb-2">
                        <Icon className={`w-6 h-6 ${metric.color}`} />
                        <span className="text-xs bg-slate-700/50 px-2 py-1 rounded">Live</span>
                      </div>
                      <p className="text-slate-400 text-sm">{metric.label}</p>
                      <p className="text-2xl font-bold">{metric.value}</p>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Validator Metrics */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Validator Network</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {validatorMetrics.map((metric, index) => {
                  const Icon = metric.icon;
                  return (
                    <motion.div
                      key={metric.label}
                      className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                >
                      <div className="flex items-center justify-between mb-2">
                        <Icon className={`w-6 h-6 ${metric.color}`} />
                        <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">PoS</span>
                      </div>
                      <p className="text-slate-400 text-sm">{metric.label}</p>
                      <p className="text-2xl font-bold">{metric.value}</p>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Mining Pool Metrics */}
            <div>
              <h3 className="text-xl font-semibold mb-4">NFT Mining Pools</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {miningPoolMetrics.map((metric, index) => {
                  const Icon = metric.icon;
                  return (
                    <motion.div
                      key={metric.label}
                      className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                >
                      <div className="flex items-center justify-between mb-2">
                        <Icon className={`w-6 h-6 ${metric.color}`} />
                        <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">NFT</span>
                      </div>
                      <p className="text-slate-400 text-sm">{metric.label}</p>
                      <p className="text-2xl font-bold">{metric.value}</p>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Recent Blocks */}
            <motion.div
              className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <h3 className="text-xl font-semibold mb-4">Recent Blocks</h3>
              <div className="space-y-3">
                {recentBlocks.map((block, _index) => (
                  <motion.div
                    key={block.hash}
                    className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Cpu className="w-6 h-6 text-blue-400" />
                        <div>
                          <p className="font-medium">Block #{block.height.toLocaleString()}</p>
                          <p className="text-sm text-slate-400">{block.hash}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{block.txs} txs</p>
                        <p className="text-sm text-slate-400">{block.validator}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-400">{block.time}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* zkRollup Status */}
            <motion.div
                className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-purple-600/20 rounded-lg">
                  <Shield className="w-6 h-6 text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-purple-400 mb-2">zkRollup Security Status</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-emerald-400">99.98%</p>
                      <p className="text-slate-400 text-sm">Proof Success Rate</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-400">2.3s</p>
                      <p className="text-slate-400 text-sm">Avg. Proof Time</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-yellow-400">847,392</p>
                      <p className="text-slate-400 text-sm">Verified on ALT</p>
                    </div>
                  </div>
                  <div className="mt-4 text-xs text-slate-400">
                    <p>• Last Altcoinchain validation: Block 847,392 (12 seconds ago)</p>
                    <p>• Next validation: Block 847,400 (estimated 8 seconds)</p>
                    <p>• Private transaction pool: 1,247 pending</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {activeSubTab === 'live' && <LiveMiningDashboard />}
        {activeSubTab === 'contracts' && <ContractDeployment />}
      </motion.div>
    </div>
  );
};

export default NuChainDashboard;