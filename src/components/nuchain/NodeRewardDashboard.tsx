import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Server, Coins, TrendingUp, Activity, Clock, Zap, Shield } from 'lucide-react';
import { nodeRewardService, NodeReward, BlockValidationEvent } from '../../services/nodeRewardService';
import { rpcNodeService } from '../../services/rpcNodeService';

const NodeRewardDashboard: React.FC = () => {
  const [nodeRewards, setNodeRewards] = useState<NodeReward[]>([]);
  const [validationHistory, setValidationHistory] = useState<BlockValidationEvent[]>([]);
  const [totalWATTEarned, setTotalWATTEarned] = useState(0);
  const [totalBlocksValidated, setTotalBlocksValidated] = useState(0);
  const [activeNodesCount, setActiveNodesCount] = useState(0);

  useEffect(() => {
    loadRewardData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadRewardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadRewardData = () => {
    const rewards = nodeRewardService.getAllNodeRewards();
    const history = nodeRewardService.getValidationHistory(10);
    
    setNodeRewards(rewards);
    setValidationHistory(history);
    setTotalWATTEarned(nodeRewardService.getTotalWATTEarned());
    setTotalBlocksValidated(nodeRewardService.getTotalBlocksValidated());
    setActiveNodesCount(nodeRewardService.getActiveNodesCount());
  };

  const getBlockchainIcon = (blockchain: string) => {
    switch (blockchain.toLowerCase()) {
      case 'bitcoin':
      case 'btc':
        return <img src="/BTC logo.png" alt="BTC" className="w-6 h-6 object-contain" />;
      case 'ethereum':
      case 'eth':
        return <img src="/ETH logo.png" alt="ETH" className="w-6 h-6 object-contain" />;
      case 'litecoin':
      case 'ltc':
        return <img src="/LTC logo.png" alt="LTC" className="w-6 h-6 object-contain" />;
      case 'monero':
      case 'xmr':
        return <img src="/XMR logo.png" alt="XMR" className="w-6 h-6 object-contain" />;
      case 'altcoinchain':
      case 'alt':
        return <img src="/Altcoinchain logo.png" alt="ALT" className="w-6 h-6 object-contain rounded-full" />;
      case 'ghost':
        return <img src="/GHOST logo.png" alt="GHOST" className="w-6 h-6 object-contain" />;
      case 'trollcoin':
      case 'troll':
        return <img src="/TROLL logo.png" alt="TROLL" className="w-6 h-6 object-contain" />;
      case 'hth':
        return <img src="/HTH logo.webp" alt="HTH" className="w-6 h-6 object-contain" />;
      case 'raptoreum':
      case 'rtm':
        return <img src="/RTM logo.png" alt="RTM" className="w-6 h-6 object-contain rounded-full" />;
      default:
        return <Server className="w-6 h-6 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h2 className="text-3xl font-bold">Node Reward Dashboard</h2>
          <p className="text-slate-400 mt-1">Earn 1 WATT per block validated by your nodes</p>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total WATT Earned</p>
              <p className="text-2xl font-bold text-yellow-400">{totalWATTEarned.toFixed(2)}</p>
            </div>
            <Coins className="w-8 h-8 text-yellow-400" />
          </div>
        </motion.div>

        <motion.div
          className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Blocks Validated</p>
              <p className="text-2xl font-bold text-blue-400">{totalBlocksValidated.toLocaleString()}</p>
            </div>
            <Activity className="w-8 h-8 text-blue-400" />
          </div>
        </motion.div>

        <motion.div
          className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Active Nodes</p>
              <p className="text-2xl font-bold text-emerald-400">{activeNodesCount}</p>
            </div>
            <Server className="w-8 h-8 text-emerald-400" />
          </div>
        </motion.div>

        <motion.div
          className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Hourly Rate</p>
              <p className="text-2xl font-bold text-purple-400">
                {(totalWATTEarned / Math.max(1, activeNodesCount)).toFixed(2)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-400" />
          </div>
        </motion.div>
      </div>

      {/* Active Node Rewards */}
      <motion.div
        className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className="text-xl font-semibold mb-4">Active Node Rewards</h3>
        
        {nodeRewards.length === 0 ? (
          <div className="text-center py-8">
            <Server className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-400 mb-2">No active nodes</p>
            <p className="text-slate-500 text-sm">Start hosting nodes to earn WATT rewards</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nodeRewards.map((reward, index) => (
              <motion.div
                key={reward.nodeId}
                className="bg-slate-900/30 rounded-lg p-4 border border-slate-700/30"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getBlockchainIcon(reward.blockchain)}
                    <span className="font-medium">{reward.blockchain.toUpperCase()}</span>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    reward.isActive 
                      ? 'bg-emerald-500/20 text-emerald-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {reward.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Blocks Validated:</span>
                    <span className="font-medium">{reward.blocksValidated.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">WATT Earned:</span>
                    <span className="font-medium text-yellow-400">{reward.wattEarned.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Last Block:</span>
                    <span className="font-medium">{reward.lastRewardBlock.toLocaleString()}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Recent Validation History */}
      <motion.div
        className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className="text-xl font-semibold mb-4">Recent Block Validations</h3>
        
        {validationHistory.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-400 mb-2">No validation history</p>
            <p className="text-slate-500 text-sm">Block validation events will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {validationHistory.map((event, index) => (
              <motion.div
                key={`${event.nodeId}-${event.blockNumber}`}
                className="flex items-center justify-between p-3 bg-slate-900/30 rounded-lg"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center space-x-3">
                  {getBlockchainIcon(event.blockchain)}
                  <div>
                    <p className="font-medium">{event.blockchain.toUpperCase()} Block #{event.blockNumber.toLocaleString()}</p>
                    <p className="text-sm text-slate-400">{event.timestamp.toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-yellow-400">+{event.wattReward} WATT</p>
                  <p className="text-sm text-slate-400">Node: {event.nodeId.slice(0, 8)}...</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* WATT Earning Info */}
      <motion.div
        className="bg-gradient-to-r from-yellow-600/10 to-emerald-600/10 border border-yellow-500/30 rounded-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-yellow-600/20 rounded-lg">
            <Zap className="w-6 h-6 text-yellow-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-yellow-400 mb-2">Node Hosting Rewards</h3>
            <p className="text-slate-300 mb-3">
              Earn 1 WATT token for every block your nodes validate across all supported blockchains. 
              Host full nodes to contribute to network security and earn passive income.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-emerald-400 mb-2">Supported Blockchains</h4>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>• Bitcoin (BTC) - SHA-256</li>
                  <li>• Ethereum (ETH) - Proof-of-Stake</li>
                  <li>• Litecoin (LTC) - Scrypt</li>
                  <li>• Monero (XMR) - RandomX</li>
                  <li>• Altcoinchain (ALT) - Ethash</li>
                  <li>• GHOST - Proof-of-Stake</li>
                  <li>• Trollcoin (TROLL) - Scrypt</li>
                  <li>• Help The Homeless (HTH) - x25x</li>
                  <li>• Raptoreum (RTM) - GhostRider</li>
                </ul>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-400 mb-2">Reward Mechanics</h4>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>• 1 WATT per block validated</li>
                  <li>• Real-time block monitoring</li>
                  <li>• Automatic reward distribution</li>
                  <li>• Cross-chain compatibility</li>
                </ul>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-purple-400 mb-2">Node Requirements</h4>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>• Fully synced node</li>
                  <li>• Stable internet connection</li>
                  <li>• RPC interface enabled</li>
                  <li>• 99%+ uptime recommended</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default NodeRewardDashboard;