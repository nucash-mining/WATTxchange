import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Zap, TrendingUp, Users, Server, Coins, Clock, Shield } from 'lucide-react';
import { useNuChain } from '../../hooks/useNuChain';

const LiveMiningDashboard: React.FC = () => {
  const { miningPools, myRigs, validators, loading } = useNuChain();
  const [liveStats, setLiveStats] = useState({
    networkHashRate: 8247,
    activeMiners: 1247,
    blocksPerHour: 3600,
    avgBlockTime: 1.02,
    totalRewardsToday: 12847,
    networkDifficulty: 2.4e12
  });

  const [realtimeData, setRealtimeData] = useState({
    currentBlock: 2847392,
    lastBlockTime: Date.now(),
    pendingTransactions: 1247,
    gasPrice: 0.001,
    networkUptime: 99.98
  });

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRealtimeData(prev => ({
        ...prev,
        currentBlock: prev.currentBlock + 1,
        lastBlockTime: Date.now(),
        pendingTransactions: Math.floor(Math.random() * 2000) + 500,
        gasPrice: 0.001 + (Math.random() - 0.5) * 0.0005
      }));

      setLiveStats(prev => ({
        ...prev,
        networkHashRate: prev.networkHashRate + (Math.random() - 0.5) * 100,
        activeMiners: prev.activeMiners + Math.floor((Math.random() - 0.5) * 10),
        totalRewardsToday: prev.totalRewardsToday + Math.random() * 10
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatHashRate = (hashRate: number) => {
    if (hashRate >= 1000) {
      return `${(hashRate / 1000).toFixed(1)} TH/s`;
    }
    return `${hashRate.toFixed(1)} GH/s`;
  };

  return (
    <div className="space-y-6">
      {/* Real-time Network Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-6 h-6 text-blue-400" />
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
          </div>
          <p className="text-slate-400 text-sm">Current Block</p>
          <p className="text-2xl font-bold">{realtimeData.currentBlock.toLocaleString()}</p>
          <p className="text-xs text-slate-500">
            {new Date(realtimeData.lastBlockTime).toLocaleTimeString()}
          </p>
        </motion.div>

        <motion.div
          className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-2">
            <Zap className="w-6 h-6 text-yellow-400" />
            <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">Live</span>
          </div>
          <p className="text-slate-400 text-sm">Network Hash Rate</p>
          <p className="text-2xl font-bold">{formatHashRate(liveStats.networkHashRate)}</p>
          <p className="text-xs text-emerald-400">+2.3% from yesterday</p>
        </motion.div>

        <motion.div
          className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-2">
            <Users className="w-6 h-6 text-purple-400" />
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-slate-400 text-sm">Active Miners</p>
          <p className="text-2xl font-bold">{liveStats.activeMiners.toLocaleString()}</p>
          <p className="text-xs text-purple-400">Across {miningPools.length} pools</p>
        </motion.div>

        <motion.div
          className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-6 h-6 text-emerald-400" />
            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">
              {liveStats.avgBlockTime}s
            </span>
          </div>
          <p className="text-slate-400 text-sm">Avg Block Time</p>
          <p className="text-2xl font-bold">{liveStats.blocksPerHour}</p>
          <p className="text-xs text-slate-400">blocks/hour</p>
        </motion.div>
      </div>

      {/* Live Mining Activity */}
      <motion.div
        className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">Live Mining Activity</h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-emerald-400">Real-time</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Active Rigs */}
          <div>
            <h4 className="font-semibold mb-4 text-purple-400">My Active Rigs</h4>
            <div className="space-y-3">
              {myRigs.filter(rig => rig.isActive).map((rig, index) => (
                <motion.div
                  key={rig.rigId}
                  className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Server className="w-4 h-4 text-purple-400" />
                      <span className="font-medium">Rig #{rig.rigId}</span>
                      {rig.hasGenesisBadge && (
                        <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">
                          Genesis
                        </span>
                      )}
                    </div>
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">Hash Rate</p>
                      <p className="font-medium">{rig.totalHashRate} MH/s</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Earnings Today</p>
                      <p className="font-medium text-emerald-400">
                        +{(Math.random() * 5 + 1).toFixed(2)} WATT
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Pool Performance */}
          <div>
            <h4 className="font-semibold mb-4 text-blue-400">Pool Performance</h4>
            <div className="space-y-3">
              {miningPools.slice(0, 3).map((pool, index) => (
                <motion.div
                  key={pool.poolId}
                  className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-blue-400" />
                      <span className="font-medium">{pool.name}</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      pool.isActive 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {pool.isActive ? 'ONLINE' : 'OFFLINE'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">Miners</p>
                      <p className="font-medium">{pool.totalMiners}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Hash Rate</p>
                      <p className="font-medium">{formatHashRate(pool.totalHashRate)}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Network Health */}
      <motion.div
        className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className="text-xl font-semibold mb-6">Network Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Shield className="w-8 h-8 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-emerald-400">{realtimeData.networkUptime}%</p>
            <p className="text-slate-400 text-sm">Network Uptime</p>
            <div className="mt-2 bg-slate-900/50 rounded-full h-2">
              <div 
                className="bg-emerald-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${realtimeData.networkUptime}%` }}
              />
            </div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Activity className="w-8 h-8 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-blue-400">{validators.length}</p>
            <p className="text-slate-400 text-sm">Active Validators</p>
            <p className="text-xs text-blue-400 mt-1">
              {validators.filter(v => v.isActive && !v.isJailed).length} healthy
            </p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Coins className="w-8 h-8 text-yellow-400" />
            </div>
            <p className="text-2xl font-bold text-yellow-400">
              {liveStats.totalRewardsToday.toLocaleString()}
            </p>
            <p className="text-slate-400 text-sm">WATT Rewards Today</p>
            <p className="text-xs text-yellow-400 mt-1">
              +{((Math.random() * 10) + 5).toFixed(1)}% vs yesterday
            </p>
          </div>
        </div>
      </motion.div>

      {/* Recent Blocks */}
      <motion.div
        className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <h3 className="text-xl font-semibold mb-6">Recent Blocks</h3>
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, i) => {
            const blockNumber = realtimeData.currentBlock - i;
            const timeAgo = i === 0 ? 'Just now' : `${i * 1.02}s ago`;
            const txCount = Math.floor(Math.random() * 300) + 50;
            const validator = `Pool-${String.fromCharCode(65 + (i % 5))}`;
            
            return (
              <motion.div
                key={blockNumber}
                className="flex items-center justify-between p-3 bg-slate-900/30 rounded-lg hover:bg-slate-900/50 transition-colors"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + i * 0.1 }}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-2 h-2 rounded-full ${
                    i === 0 ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                  }`}></div>
                  <div>
                    <p className="font-medium">Block #{blockNumber.toLocaleString()}</p>
                    <p className="text-sm text-slate-400">0x{Math.random().toString(16).substr(2, 8)}...</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{txCount} txs</p>
                  <p className="text-sm text-slate-400">{validator}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-400">{timeAgo}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default LiveMiningDashboard;