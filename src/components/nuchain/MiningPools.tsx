import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Coins, Activity, Shield, Server, Zap, Clock, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

const MiningPools: React.FC = () => {
  const [selectedPool, setSelectedPool] = useState<string | null>(null);

  const miningPools = [
    {
      id: 'pool-alpha',
      name: 'Alpha Mining Pool',
      host: '0x1234...abcd',
      wattLocked: '100,000',
      uptime: '99.8%',
      connectedTime: '247 days',
      blockConnection: '98.7%',
      miners: 156,
      hashRate: '2.4 TH/s',
      status: 'online',
      fee: '2%',
      minPayout: '0.1 WATT',
      lastBlock: '2 minutes ago'
    },
    {
      id: 'pool-beta',
      name: 'Beta Mining Pool',
      host: '0x5678...efgh',
      wattLocked: '150,000',
      uptime: '99.9%',
      connectedTime: '189 days',
      blockConnection: '99.2%',
      miners: 203,
      hashRate: '3.1 TH/s',
      status: 'online',
      fee: '1.5%',
      minPayout: '0.05 WATT',
      lastBlock: '1 minute ago'
    },
    {
      id: 'pool-gamma',
      name: 'Gamma Mining Pool',
      host: '0x9abc...ijkl',
      wattLocked: '125,000',
      uptime: '99.5%',
      connectedTime: '312 days',
      blockConnection: '97.8%',
      miners: 89,
      hashRate: '1.8 TH/s',
      status: 'online',
      fee: '3%',
      minPayout: '0.2 WATT',
      lastBlock: '30 seconds ago'
    },
    {
      id: 'pool-delta',
      name: 'Delta Mining Pool',
      host: '0xdef0...mnop',
      wattLocked: '100,000',
      uptime: '95.2%',
      connectedTime: '67 days',
      blockConnection: '89.3%',
      miners: 45,
      hashRate: '0.9 TH/s',
      status: 'unstable',
      fee: '2.5%',
      minPayout: '0.15 WATT',
      lastBlock: '15 minutes ago'
    }
  ];

  const myMiningRigs = [
    {
      id: 'rig-1',
      name: 'Gaming Rig Alpha',
      components: ['PC Case NFT', 'XL1 Processor', 'TX120 GPU', 'Genesis Badge'],
      hashRate: '125 MH/s',
      pool: 'pool-beta',
      earnings: '2.47 WATT',
      status: 'mining'
    },
    {
      id: 'rig-2',
      name: 'Mining Rig Beta',
      components: ['PC Case NFT', 'XL1 Processor', 'GP50 GPU'],
      hashRate: '89 MH/s',
      pool: 'pool-alpha',
      earnings: '1.83 WATT',
      status: 'mining'
    }
  ];

  const handleJoinPool = (poolId: string) => {
    toast.success(`Joining ${poolId}...`);
  };

  const handleCreatePool = () => {
    toast.success('Pool creation interface opened');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'text-emerald-400 bg-emerald-500/20';
      case 'unstable':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'offline':
        return 'text-red-400 bg-red-500/20';
      default:
        return 'text-slate-400 bg-slate-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Pool Host Requirements */}
      <motion.div
        className="bg-gradient-to-r from-yellow-600/10 to-orange-600/10 border border-yellow-500/30 rounded-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-yellow-600/20 rounded-lg">
              <Server className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Host a Mining Pool</h3>
              <p className="text-slate-400">Earn fees by hosting a nuChain mining pool</p>
            </div>
          </div>
          
          <motion.button
            onClick={handleCreatePool}
            className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Server className="w-4 h-4" />
            <span>Create Pool</span>
          </motion.button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-3 text-yellow-400">Requirements</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <Coins className="w-4 h-4 text-yellow-400" />
                <span>Lock 100,000 WATT tokens</span>
              </div>
              <div className="flex items-center space-x-2">
                <Server className="w-4 h-4 text-blue-400" />
                <span>Host a nuChain node</span>
              </div>
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Maintain 95%+ uptime</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-purple-400" />
                <span>Monitor node connectivity</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3 text-yellow-400">Rewards</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Pool Fees:</span>
                <span className="font-medium">1-5% of mining rewards</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">WATT Staking:</span>
                <span className="font-medium text-emerald-400">8% APY</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Node Rewards:</span>
                <span className="font-medium text-blue-400">0.1 NU per block</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Uptime Bonus:</span>
                <span className="font-medium text-purple-400">+20% at 99%+</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* My Mining Rigs */}
      <div>
        <h3 className="text-xl font-semibold mb-4">My NFT Mining Rigs</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {myMiningRigs.map((rig, index) => (
            <motion.div
              key={rig.id}
              className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-600/20 rounded-lg">
                    <Activity className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{rig.name}</h4>
                    <p className="text-sm text-slate-400">Hash Rate: {rig.hashRate}</p>
                  </div>
                </div>
                <span className="px-2 py-1 rounded text-xs bg-emerald-500/20 text-emerald-400">
                  MINING
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-400 mb-2">Components</p>
                  <div className="flex flex-wrap gap-1">
                    {rig.components.map((component, idx) => (
                      <span
                        key={idx}
                        className={`px-2 py-1 rounded text-xs ${
                          component === 'Genesis Badge'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-slate-700/50 text-slate-300'
                        }`}
                      >
                        {component}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Pool:</span>
                  <span className="font-medium">{rig.pool}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Earnings:</span>
                  <span className="font-medium text-emerald-400">{rig.earnings}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Available Mining Pools */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Available Mining Pools</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {miningPools.map((pool, index) => (
            <motion.div
              key={pool.id}
              className={`bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border transition-all duration-300 cursor-pointer ${
                selectedPool === pool.id
                  ? 'border-blue-500/50 bg-blue-500/5'
                  : 'border-slate-700/50 hover:border-slate-600/50'
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setSelectedPool(pool.id)}
              whileHover={{ y: -2 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-600/20 rounded-lg">
                    <Users className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{pool.name}</h4>
                    <p className="text-sm text-slate-400">{pool.host}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${getStatusColor(pool.status)}`}>
                  {pool.status.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-slate-400 text-sm">WATT Locked</p>
                  <p className="font-bold text-yellow-400">{pool.wattLocked}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Pool Fee</p>
                  <p className="font-bold">{pool.fee}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Uptime</p>
                  <p className="font-bold text-emerald-400">{pool.uptime}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Hash Rate</p>
                  <p className="font-bold text-purple-400">{pool.hashRate}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-slate-400">Miners:</span>
                  <span>{pool.miners}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Block Connection:</span>
                  <span>{pool.blockConnection}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Min Payout:</span>
                  <span>{pool.minPayout}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Last Block:</span>
                  <span>{pool.lastBlock}</span>
                </div>
              </div>

              {pool.status === 'online' && (
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleJoinPool(pool.id);
                  }}
                  className="w-full py-2 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg text-sm font-medium transition-colors border border-blue-500/30"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Join Pool
                </motion.button>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Pool Statistics */}
      <motion.div
        className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className="text-xl font-semibold mb-4">Mining Pool Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-400">18</p>
            <p className="text-slate-400 text-sm">Active Pools</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-400">1.8M</p>
            <p className="text-slate-400 text-sm">WATT Locked</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-400">3,247</p>
            <p className="text-slate-400 text-sm">Mining NFTs</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-400">8.2 TH/s</p>
            <p className="text-slate-400 text-sm">Total Hash Rate</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MiningPools;