import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Server, Activity, Shield, Cpu, RefreshCw, Settings, Play, Square, Wifi } from 'lucide-react';
import RPCNodeManager from './wallet/RPCNodeManager';
import RealNodeConnectionModal from './nodes/RealNodeConnectionModal';
import toast from 'react-hot-toast';

const NodesView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'bitcoin' | 'ethereum' | 'litecoin' | 'monero' | 'altcoin' | 'ghost' | 'troll' | 'hth' | 'raptoreum'>('bitcoin');
  const [showNodeManager, setShowNodeManager] = useState(false);
  const [showRealNodeConnection, setShowRealNodeConnection] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [nodeStatus, setNodeStatus] = useState<Record<string, { running: boolean; syncing: boolean; blockHeight: number; connections: number; lastBlock: Date }>>({
    bitcoin: { running: true, syncing: false, blockHeight: 824567, connections: 8, lastBlock: new Date(Date.now() - 10 * 60 * 1000) },
    ethereum: { running: true, syncing: false, blockHeight: 19245678, connections: 12, lastBlock: new Date(Date.now() - 5 * 60 * 1000) },
    litecoin: { running: false, syncing: false, blockHeight: 2567890, connections: 0, lastBlock: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    monero: { running: false, syncing: false, blockHeight: 3124567, connections: 0, lastBlock: new Date(Date.now() - 3 * 60 * 60 * 1000) },
    altcoin: { running: true, syncing: false, blockHeight: 1234567, connections: 6, lastBlock: new Date(Date.now() - 2 * 60 * 1000) },
    ghost: { running: true, syncing: false, blockHeight: 987654, connections: 5, lastBlock: new Date(Date.now() - 15 * 60 * 1000) },
    troll: { running: false, syncing: false, blockHeight: 456789, connections: 0, lastBlock: new Date(Date.now() - 5 * 60 * 60 * 1000) },
    hth: { running: true, syncing: false, blockHeight: 789123, connections: 7, lastBlock: new Date(Date.now() - 8 * 60 * 1000) },
    raptoreum: { running: false, syncing: false, blockHeight: 1234567, connections: 0, lastBlock: new Date(Date.now() - 2 * 60 * 60 * 1000) }
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    // Simulate refreshing node status
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Update with new random data
    const updatedStatus = { ...nodeStatus };
    Object.keys(updatedStatus).forEach(key => {
      if (updatedStatus[key].running) {
        updatedStatus[key].blockHeight += Math.floor(Math.random() * 10);
        updatedStatus[key].connections = Math.max(1, Math.floor(Math.random() * 15));
        updatedStatus[key].lastBlock = new Date();
      }
    });
    
    setNodeStatus(updatedStatus);
    setIsRefreshing(false);
    toast.success('Node status refreshed');
  };

  const toggleNodeRunning = (node: string) => {
    const updatedStatus = { ...nodeStatus };
    updatedStatus[node].running = !updatedStatus[node].running;
    
    if (updatedStatus[node].running) {
      updatedStatus[node].connections = Math.floor(Math.random() * 10) + 1;
      updatedStatus[node].lastBlock = new Date();
      toast.success(`${node.charAt(0).toUpperCase() + node.slice(1)} node started`);
    } else {
      updatedStatus[node].connections = 0;
      toast.success(`${node.charAt(0).toUpperCase() + node.slice(1)} node stopped`);
    }
    
    setNodeStatus(updatedStatus);
  };

  const getNodeIcon = (node: string) => {
    switch (node) {
      case 'bitcoin':
        return <img src="/BTC logo.png" alt="Bitcoin" className="w-6 h-6" />;
      case 'ethereum':
        return <img src="/ETH logo.png" alt="Ethereum" className="w-6 h-6" />;
      case 'litecoin':
        return <img src="/LTC logo.png" alt="Litecoin" className="w-6 h-6" />;
      case 'monero':
        return <img src="/XMR logo.png" alt="Monero" className="w-6 h-6" />;
      case 'altcoin':
        return <img src="/Altcoinchain logo.png" alt="Altcoinchain" className="w-6 h-6 rounded-full" />;
      case 'ghost':
        return <img src="/GHOST logo.png" alt="GHOST" className="w-6 h-6" />;
      case 'troll':
        return <img src="/TROLL logo.png" alt="Trollcoin" className="w-6 h-6" />;
      case 'hth':
        return <img src="/HTH logo.webp" alt="Help The Homeless" className="w-6 h-6" />;
      case 'raptoreum':
        return <img src="/RTM logo.png" alt="Raptoreum" className="w-6 h-6" />;
      default:
        return <Server className="w-6 h-6" />;
    }
  };

  const getConsensusType = (node: string) => {
    switch (node) {
      case 'ethereum':
      case 'ghost':
        return { type: 'PoS', icon: <Shield className="w-4 h-4 text-purple-400" /> };
      case 'bitcoin':
      case 'litecoin':
      case 'monero':
      case 'altcoin':
      case 'troll':
      case 'hth':
      case 'raptoreum':
        return { type: 'PoW', icon: <Cpu className="w-4 h-4 text-orange-400" /> };
      default:
        return { type: 'Unknown', icon: <Activity className="w-4 h-4 text-gray-400" /> };
    }
  };

  const getNodeDetails = (node: string) => {
    switch (node) {
      case 'bitcoin':
        return {
          name: 'Bitcoin Core',
          version: 'v25.0',
          dataDir: '~/.bitcoin',
          rpcPort: 8332,
          p2pPort: 8333,
          minRequirements: {
            storage: '500 GB SSD',
            memory: '8 GB RAM',
            cpu: '4 cores',
            network: '50 Mbps'
          }
        };
      case 'ethereum':
        return {
          name: 'Geth (Go Ethereum)',
          version: 'v1.13.5',
          dataDir: '~/.ethereum',
          rpcPort: 8545,
          p2pPort: 30303,
          minRequirements: {
            storage: '1 TB SSD',
            memory: '16 GB RAM',
            cpu: '4 cores',
            network: '50 Mbps'
          }
        };
      case 'litecoin':
        return {
          name: 'Litecoin Core',
          version: 'v0.21.2.2',
          dataDir: '~/.litecoin',
          rpcPort: 9332,
          p2pPort: 9333,
          minRequirements: {
            storage: '100 GB SSD',
            memory: '4 GB RAM',
            cpu: '2 cores',
            network: '10 Mbps'
          }
        };
      case 'monero':
        return {
          name: 'Monero Daemon',
          version: 'v0.18.3.1',
          dataDir: '~/.monero',
          rpcPort: 18081,
          p2pPort: 18080,
          minRequirements: {
            storage: '150 GB SSD',
            memory: '4 GB RAM',
            cpu: '2 cores',
            network: '10 Mbps'
          }
        };
      case 'altcoin':
        return {
          name: 'Altcoinchain',
          version: 'v1.0.0',
          dataDir: '~/.altcoin',
          rpcPort: 8645,
          p2pPort: 8646,
          minRequirements: {
            storage: '50 GB SSD',
            memory: '4 GB RAM',
            cpu: '2 cores',
            network: '10 Mbps'
          }
        };
      case 'ghost':
        return {
          name: 'GHOST Core',
          version: 'v2.0.0',
          dataDir: '~/.ghost',
          rpcPort: 51725,
          p2pPort: 51726,
          minRequirements: {
            storage: '20 GB SSD',
            memory: '2 GB RAM',
            cpu: '2 cores',
            network: '5 Mbps'
          }
        };
      case 'troll':
        return {
          name: 'Trollcoin Core',
          version: 'v2.0.0',
          dataDir: '~/.trollcoin',
          rpcPort: 9666,
          p2pPort: 9667,
          minRequirements: {
            storage: '10 GB SSD',
            memory: '2 GB RAM',
            cpu: '1 core',
            network: '5 Mbps'
          }
        };
      case 'hth':
        return {
          name: 'Help The Homeless Core',
          version: 'v0.14.1',
          dataDir: '~/.helpthehomeless',
          rpcPort: 13777,
          p2pPort: 13778,
          minRequirements: {
            storage: '10 GB SSD',
            memory: '2 GB RAM',
            cpu: '1 core',
            network: '5 Mbps'
          }
        };
      case 'raptoreum':
        return {
          name: 'Raptoreum Core',
          version: 'v1.3.17.02',
          dataDir: '~/.raptoreum',
          rpcPort: 9998,
          p2pPort: 9999,
          minRequirements: {
            storage: '50 GB SSD',
            memory: '4 GB RAM',
            cpu: '2 cores',
            network: '10 Mbps'
          }
        };
      default:
        return {
          name: 'Unknown Node',
          version: 'v0.0.0',
          dataDir: '~/.unknown',
          rpcPort: 0,
          p2pPort: 0,
          minRequirements: {
            storage: 'Unknown',
            memory: 'Unknown',
            cpu: 'Unknown',
            network: 'Unknown'
          }
        };
    }
  };

  const getHTHInfo = () => {
    return {
      name: 'Help The Homeless',
      ticker: 'HTH',
      algorithm: 'x25x',
      blockReward: '2500 HTH',
      blockTime: '60 seconds',
      matureTime: '101 blocks',
      difficultyAdjustment: 'DGW3',
      masternodeCollateral: '1,000,000 HTH',
      masternodeReward: '25% of block reward',
      powReward: '64.75% of block reward',
      devFunds: '10% of block reward',
      donations: '2.5% of block reward'
    };
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
          <h2 className="text-3xl font-bold">Blockchain Nodes</h2>
          <p className="text-slate-400 mt-1">Manage your full and light nodes</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <motion.button
            onClick={() => setShowRealNodeConnection(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Wifi className="w-4 h-4" />
            <span>Real RPC Connection</span>
          </motion.button>
          <motion.button
            onClick={() => setShowNodeManager(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Settings className="w-4 h-4" />
            <span>RPC Settings</span>
          </motion.button>
          <motion.button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors disabled:opacity-50"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Node Selection Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        {['bitcoin', 'ethereum', 'litecoin', 'monero', 'altcoin', 'ghost', 'troll', 'hth', 'raptoreum'].map((node) => (
          <motion.button
            key={node}
            onClick={() => setActiveTab(node as 'bitcoin' | 'litecoin' | 'monero' | 'ghost' | 'trollcoin' | 'hth' | 'rtm' | 'altcoinchain')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === node
                ? 'bg-yellow-600 text-white'
                : 'bg-slate-800/50 hover:bg-slate-700/50 text-slate-300'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="w-6 h-6 flex items-center justify-center">
              {getNodeIcon(node)}
            </span>
            <span className="capitalize">{node === 'hth' ? 'HTH' : node === 'raptoreum' ? 'RTM' : node}</span>
            <div className={`w-2 h-2 rounded-full ${nodeStatus[node].running ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
          </motion.button>
        ))}
      </div>

      {/* Node Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              {getNodeIcon(activeTab)}
              <div>
                <h3 className="text-lg font-semibold capitalize">{activeTab === 'hth' ? 'HTH' : activeTab}</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-xs bg-slate-700/50 px-2 py-1 rounded">
                    {getNodeDetails(activeTab).name}
                  </span>
                  <span className="text-xs bg-slate-700/50 px-2 py-1 rounded">
                    {getNodeDetails(activeTab).version}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${nodeStatus[activeTab].running ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
              <span className="text-sm">{nodeStatus[activeTab].running ? 'Running' : 'Stopped'}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-slate-400">Status:</span>
              <span className={nodeStatus[activeTab].running ? 'text-emerald-400' : 'text-red-400'}>
                {nodeStatus[activeTab].running ? (nodeStatus[activeTab].syncing ? 'Syncing' : 'Synced') : 'Offline'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Block Height:</span>
              <span>{nodeStatus[activeTab].blockHeight.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Connections:</span>
              <span>{nodeStatus[activeTab].connections}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Last Block:</span>
              <span>{nodeStatus[activeTab].lastBlock.toLocaleTimeString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Consensus:</span>
              <div className="flex items-center space-x-1">
                {getConsensusType(activeTab).icon}
                <span>{getConsensusType(activeTab).type}</span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            {nodeStatus[activeTab].running ? (
              <motion.button
                onClick={() => toggleNodeRunning(activeTab)}
                className="w-full flex items-center justify-center space-x-2 py-2 bg-red-600/20 hover:bg-red-600/30 rounded-lg text-sm font-medium transition-colors border border-red-500/30"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Square className="w-4 h-4" />
                <span>Stop Node</span>
              </motion.button>
            ) : (
              <motion.button
                onClick={() => toggleNodeRunning(activeTab)}
                className="w-full flex items-center justify-center space-x-2 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 rounded-lg text-sm font-medium transition-colors border border-emerald-500/30"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Play className="w-4 h-4" />
                <span>Start Node</span>
              </motion.button>
            )}
          </div>
        </motion.div>

        <motion.div
          className="md:col-span-3 bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-lg font-semibold mb-4">Node Configuration</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-yellow-400 mb-3">Connection Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">RPC Port:</span>
                  <span>{getNodeDetails(activeTab).rpcPort}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">P2P Port:</span>
                  <span>{getNodeDetails(activeTab).p2pPort}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Data Directory:</span>
                  <span className="font-mono">{getNodeDetails(activeTab).dataDir}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">RPC Username:</span>
                  <span className="font-mono">rpcuser</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">RPC Password:</span>
                  <span className="font-mono">•••••••••••••</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-yellow-400 mb-3">System Requirements</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Storage:</span>
                  <span>{getNodeDetails(activeTab).minRequirements.storage}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Memory:</span>
                  <span>{getNodeDetails(activeTab).minRequirements.memory}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">CPU:</span>
                  <span>{getNodeDetails(activeTab).minRequirements.cpu}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Network:</span>
                  <span>{getNodeDetails(activeTab).minRequirements.network}</span>
                </div>
              </div>
            </div>
          </div>

          {/* HTH Specific Information */}
          {activeTab === 'hth' && (
            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <h4 className="font-medium text-blue-400 mb-3">Help The Homeless (HTH) Specifications</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Algorithm:</span>
                    <span>{getHTHInfo().algorithm}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Block Reward:</span>
                    <span>{getHTHInfo().blockReward}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Block Time:</span>
                    <span>{getHTHInfo().blockTime}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Masternode Collateral:</span>
                    <span>{getHTHInfo().masternodeCollateral}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Masternode Reward:</span>
                    <span>{getHTHInfo().masternodeReward}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">PoW Reward:</span>
                    <span>{getHTHInfo().powReward}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Dev Funds:</span>
                    <span>{getHTHInfo().devFunds}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Donations:</span>
                    <span>{getHTHInfo().donations}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Difficulty Adjustment:</span>
                    <span>{getHTHInfo().difficultyAdjustment}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* GHOST Specific Information */}
          {activeTab === 'ghost' && (
            <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <h4 className="font-medium text-purple-400 mb-3">GHOST Proof-of-Stake Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Consensus:</span>
                    <span className="text-purple-400">Proof-of-Stake</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Staking Requirement:</span>
                    <span>Any amount of GHOST</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Staking Rewards:</span>
                    <span>~5% annually</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Coin Maturity:</span>
                    <span>500 confirmations</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Minimum Stake Age:</span>
                    <span>3 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Staking Status:</span>
                    <span className={nodeStatus.ghost.running ? 'text-emerald-400' : 'text-red-400'}>
                      {nodeStatus.ghost.running ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Trollcoin Specific Information */}
          {activeTab === 'troll' && (
            <div className="mt-6 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
              <h4 className="font-medium text-orange-400 mb-3">Trollcoin Proof-of-Work Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Consensus:</span>
                    <span className="text-orange-400">Proof-of-Work</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Algorithm:</span>
                    <span>Scrypt</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Block Time:</span>
                    <span>60 seconds</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Mining Status:</span>
                    <span className={nodeStatus.troll.running ? 'text-emerald-400' : 'text-red-400'}>
                      {nodeStatus.troll.running ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Mining Hardware:</span>
                    <span>CPU/GPU</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Difficulty:</span>
                    <span>Variable</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Raptoreum Specific Information */}
          {activeTab === 'raptoreum' && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <h4 className="font-medium text-red-400 mb-3">Raptoreum Proof-of-Work Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Consensus:</span>
                    <span className="text-red-400">Proof-of-Work</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Algorithm:</span>
                    <span>GhostRider</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Block Time:</span>
                    <span>120 seconds</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Mining Status:</span>
                    <span className={nodeStatus.raptoreum.running ? 'text-emerald-400' : 'text-red-400'}>
                      {nodeStatus.raptoreum.running ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">SmartNodes:</span>
                    <span>Supported</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Assets:</span>
                    <span>Enabled</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Node Management */}
          <div className="mt-6">
            <h4 className="font-medium text-yellow-400 mb-3">Node Management</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
                <h5 className="font-medium mb-2">Configuration</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Node Type:</span>
                    <span>{activeTab === 'ethereum' ? 'Light' : 'Full'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Auto-start:</span>
                    <span>Enabled</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pruning:</span>
                    <span>{activeTab === 'bitcoin' || activeTab === 'litecoin' ? 'Enabled' : 'Disabled'}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
                <h5 className="font-medium mb-2">Network</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Inbound Connections:</span>
                    <span>{Math.floor(nodeStatus[activeTab].connections / 2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Outbound Connections:</span>
                    <span>{Math.ceil(nodeStatus[activeTab].connections / 2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Network Type:</span>
                    <span>IPv4 + IPv6</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
                <h5 className="font-medium mb-2">Storage</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Blockchain Size:</span>
                    <span>
                      {activeTab === 'bitcoin' ? '500 GB' : 
                       activeTab === 'ethereum' ? '950 GB' : 
                       activeTab === 'litecoin' ? '80 GB' : 
                       activeTab === 'monero' ? '150 GB' : 
                       activeTab === 'altcoin' ? '45 GB' : 
                       activeTab === 'ghost' ? '15 GB' : 
                       activeTab === 'troll' ? '5 GB' : 
                       activeTab === 'hth' ? '8 GB' : 
                       activeTab === 'raptoreum' ? '50 GB' : '0 GB'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Free Space:</span>
                    <span>1.2 TB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Database Engine:</span>
                    <span>{activeTab === 'raptoreum' ? 'Berkeley DB' : 'LevelDB'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Node Logs */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-yellow-400">Node Logs</h4>
              <span className="text-xs text-slate-400">Last 5 entries</span>
            </div>
            <div className="bg-slate-900/70 rounded-lg p-4 border border-slate-700/50 font-mono text-xs h-32 overflow-y-auto">
              {nodeStatus[activeTab].running ? (
                <div className="space-y-1">
                  <p><span className="text-blue-400">[{new Date().toLocaleTimeString()}]</span> Block height: {nodeStatus[activeTab].blockHeight}</p>
                  <p><span className="text-blue-400">[{new Date(Date.now() - 30000).toLocaleTimeString()}]</span> Received block header from peer 0x742d35Cc</p>
                  <p><span className="text-blue-400">[{new Date(Date.now() - 60000).toLocaleTimeString()}]</span> Connected to {nodeStatus[activeTab].connections} peers</p>
                  <p><span className="text-blue-400">[{new Date(Date.now() - 90000).toLocaleTimeString()}]</span> Synchronization status: {nodeStatus[activeTab].syncing ? 'in progress' : 'complete'}</p>
                  <p><span className="text-blue-400">[{new Date(Date.now() - 120000).toLocaleTimeString()}]</span> Node started successfully</p>
                </div>
              ) : (
                <p><span className="text-red-400">[{new Date().toLocaleTimeString()}]</span> Node is not running</p>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Node Management Commands */}
      <motion.div
        className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-lg font-semibold mb-4">Node Management Commands</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-yellow-400 mb-3">Basic Commands</h4>
            <div className="space-y-2 font-mono text-sm">
              <div className="bg-slate-900/50 rounded p-2">
                <span className="text-emerald-400">$</span> {activeTab === 'bitcoin' ? 'bitcoin-cli' : 
                                                            activeTab === 'ethereum' ? 'geth' :
                                                            activeTab === 'litecoin' ? 'litecoin-cli' :
                                                            activeTab === 'monero' ? 'monerod' :
                                                            activeTab === 'altcoin' ? 'altcoin-cli' :
                                                            activeTab === 'ghost' ? 'ghost-cli' :
                                                            activeTab === 'troll' ? 'trollcoind' :
                                                            activeTab === 'hth' ? 'helpthehomeless-cli' :
                                                            activeTab === 'raptoreum' ? 'raptoreum-cli' : 'node-cli'} getblockchaininfo
              </div>
              <div className="bg-slate-900/50 rounded p-2">
                <span className="text-emerald-400">$</span> {activeTab === 'bitcoin' ? 'bitcoin-cli' : 
                                                            activeTab === 'ethereum' ? 'geth' :
                                                            activeTab === 'litecoin' ? 'litecoin-cli' :
                                                            activeTab === 'monero' ? 'monerod' :
                                                            activeTab === 'altcoin' ? 'altcoin-cli' :
                                                            activeTab === 'ghost' ? 'ghost-cli' :
                                                            activeTab === 'troll' ? 'trollcoind' :
                                                            activeTab === 'hth' ? 'helpthehomeless-cli' :
                                                            activeTab === 'raptoreum' ? 'raptoreum-cli' : 'node-cli'} getnetworkinfo
              </div>
              <div className="bg-slate-900/50 rounded p-2">
                <span className="text-emerald-400">$</span> {activeTab === 'bitcoin' ? 'bitcoin-cli' : 
                                                            activeTab === 'ethereum' ? 'geth' :
                                                            activeTab === 'litecoin' ? 'litecoin-cli' :
                                                            activeTab === 'monero' ? 'monerod' :
                                                            activeTab === 'altcoin' ? 'altcoin-cli' :
                                                            activeTab === 'ghost' ? 'ghost-cli' :
                                                            activeTab === 'troll' ? 'trollcoind' :
                                                            activeTab === 'hth' ? 'helpthehomeless-cli' :
                                                            activeTab === 'raptoreum' ? 'raptoreum-cli' : 'node-cli'} getpeerinfo
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-yellow-400 mb-3">Advanced Commands</h4>
            <div className="space-y-2 font-mono text-sm">
              {activeTab === 'ghost' && (
                <>
                  <div className="bg-slate-900/50 rounded p-2">
                    <span className="text-emerald-400">$</span> ghost-cli getstakinginfo
                  </div>
                  <div className="bg-slate-900/50 rounded p-2">
                    <span className="text-emerald-400">$</span> ghost-cli walletpassphrase "your_passphrase" 0 true
                  </div>
                </>
              )}
              
              {activeTab === 'troll' && (
                <>
                  <div className="bg-slate-900/50 rounded p-2">
                    <span className="text-emerald-400">$</span> trollcoind getmininginfo
                  </div>
                  <div className="bg-slate-900/50 rounded p-2">
                    <span className="text-emerald-400">$</span> trollcoind setgenerate true 4
                  </div>
                </>
              )}
              
              {activeTab === 'hth' && (
                <>
                  <div className="bg-slate-900/50 rounded p-2">
                    <span className="text-emerald-400">$</span> helpthehomeless-cli getmininginfo
                  </div>
                  <div className="bg-slate-900/50 rounded p-2">
                    <span className="text-emerald-400">$</span> helpthehomeless-cli masternode status
                  </div>
                </>
              )}
              
              {activeTab === 'raptoreum' && (
                <>
                  <div className="bg-slate-900/50 rounded p-2">
                    <span className="text-emerald-400">$</span> raptoreum-cli getmininginfo
                  </div>
                  <div className="bg-slate-900/50 rounded p-2">
                    <span className="text-emerald-400">$</span> raptoreum-cli smartnode status
                  </div>
                </>
              )}
              
              {(activeTab !== 'ghost' && activeTab !== 'troll' && activeTab !== 'hth' && activeTab !== 'raptoreum') && (
                <>
                  <div className="bg-slate-900/50 rounded p-2">
                    <span className="text-emerald-400">$</span> {activeTab === 'bitcoin' ? 'bitcoin-cli' : 
                                                              activeTab === 'ethereum' ? 'geth' :
                                                              activeTab === 'litecoin' ? 'litecoin-cli' :
                                                              activeTab === 'monero' ? 'monerod' :
                                                              activeTab === 'altcoin' ? 'altcoin-cli' : 'node-cli'} help
                  </div>
                  <div className="bg-slate-900/50 rounded p-2">
                    <span className="text-emerald-400">$</span> {activeTab === 'bitcoin' ? 'bitcoin-cli' : 
                                                              activeTab === 'ethereum' ? 'geth' :
                                                              activeTab === 'litecoin' ? 'litecoin-cli' :
                                                              activeTab === 'monero' ? 'monerod' :
                                                              activeTab === 'altcoin' ? 'altcoin-cli' :
                                                              activeTab === 'raptoreum' ? 'raptoreum-cli' : 'node-cli'} getwalletinfo
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* RPC Node Manager Modal */}
      <RPCNodeManager
        isOpen={showNodeManager}
        onClose={() => setShowNodeManager(false)}
      />

      {/* Real Node Connection Modal */}
      <RealNodeConnectionModal
        isOpen={showRealNodeConnection}
        onClose={() => setShowRealNodeConnection(false)}
        chain={activeTab}
      />
    </div>
  );
};

export default NodesView;