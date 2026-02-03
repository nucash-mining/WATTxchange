import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Server, 
  Download, 
  Play, 
  Square, 
  Settings, 
  TrendingUp, 
  HardDrive, 
  Wifi, 
  Clock, 
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  Zap
} from 'lucide-react';
import { nodeHostingService, NodeHostingConfig, NodePerformanceMetrics, WATTRewardCalculation } from '../../services/nodeHostingService';
import { useWallet } from '../../hooks/useWallet';
import toast from 'react-hot-toast';

interface NodeHostingDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const NodeHostingDashboard: React.FC<NodeHostingDashboardProps> = ({ isOpen, onClose }) => {
  const { isConnected, address } = useWallet();
  const [activeTab, setActiveTab] = useState<'overview' | 'install' | 'manage' | 'rewards'>('overview');
  const [hostedNodes, setHostedNodes] = useState<NodeHostingConfig[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<Map<string, NodePerformanceMetrics>>(new Map());
  const [rewardHistory, setRewardHistory] = useState<WATTRewardCalculation[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showInstallForm, setShowInstallForm] = useState(false);
  const [selectedChain, setSelectedChain] = useState('BTC');
  const [installForm, setInstallForm] = useState({
    nodeType: 'full' as 'full' | 'light' | 'archive',
    installPath: '',
    dataDir: '',
    rpcUsername: '',
    rpcPassword: '',
    stakingAmount: ''
  });
  const [showPasswords, setShowPasswords] = useState(false);

  const supportedChains = [
    { id: 'BTC', name: 'Bitcoin Core', icon: '/BTC logo.png', storage: '500+ GB', reward: '0.1 WATT/block' },
    { id: 'LTC', name: 'Litecoin Core', icon: '/LTC logo.png', storage: '50+ GB', reward: '0.05 WATT/block' },
    { id: 'ETH', name: 'Ethereum Geth', icon: '/ETH logo.png', storage: '1000+ GB', reward: '0.2 WATT/block' },
    { id: 'ALT', name: 'Altcoinchain', icon: '/Altcoinchain logo.png', storage: '200+ GB', reward: '0.15 WATT/block' },
    { id: 'GHOST', name: 'GHOST', icon: '/GHOST logo.png', storage: '100+ GB', reward: '0.08 WATT/block' },
    { id: 'TROLL', name: 'Trollcoin', icon: '/TROLL logo.png', storage: '50+ GB', reward: '0.06 WATT/block' },
    { id: 'HTH', name: 'Help The Homeless', icon: '/HTH logo.webp', storage: '80+ GB', reward: '0.07 WATT/block' },
    { id: 'RTM', name: 'Raptoreum', icon: '/RTM logo.png', storage: '60+ GB', reward: '0.05 WATT/block' }
  ];

  useEffect(() => {
    if (isOpen) {
      loadHostedNodes();
      loadPerformanceMetrics();
      loadRewardHistory();
    }
  }, [isOpen]);

  const loadHostedNodes = async () => {
    try {
      const nodes = nodeHostingService.getHostedNodes();
      setHostedNodes(nodes);
    } catch (error) {
      console.error('Failed to load hosted nodes:', error);
    }
  };

  const loadPerformanceMetrics = async () => {
    try {
      const metrics = new Map<string, NodePerformanceMetrics>();
      hostedNodes.forEach(node => {
        const nodeMetrics = nodeHostingService.getNodeMetrics(node.id);
        if (nodeMetrics) {
          metrics.set(node.id, nodeMetrics);
        }
      });
      setPerformanceMetrics(metrics);
    } catch (error) {
      console.error('Failed to load performance metrics:', error);
    }
  };

  const loadRewardHistory = async () => {
    try {
      const history = nodeHostingService.getRewardHistory();
      setRewardHistory(history);
    } catch (error) {
      console.error('Failed to load reward history:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadHostedNodes(),
        loadPerformanceMetrics(),
        loadRewardHistory()
      ]);
      toast.success('Node data refreshed');
    } catch (error) {
      toast.error('Failed to refresh node data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleInstallNode = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!installForm.installPath || !installForm.dataDir || !installForm.rpcUsername || !installForm.rpcPassword) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const success = await nodeHostingService.installNode(
        selectedChain,
        installForm.nodeType,
        installForm.installPath,
        installForm.dataDir,
        {
          username: installForm.rpcUsername,
          password: installForm.rpcPassword
        }
      );

      if (success) {
        toast.success(`${selectedChain} node installed successfully!`);
        setInstallForm({
          nodeType: 'full',
          installPath: '',
          dataDir: '',
          rpcUsername: '',
          rpcPassword: '',
          stakingAmount: ''
        });
        setShowInstallForm(false);
        await loadHostedNodes();
      } else {
        toast.error('Failed to install node');
      }
    } catch (error) {
      console.error('Failed to install node:', error);
      toast.error('Failed to install node');
    } finally {
      setLoading(false);
    }
  };

  const handleStartNode = async (nodeId: string) => {
    try {
      const success = await nodeHostingService.startNode(nodeId);
      if (success) {
        toast.success('Node started successfully');
        await loadHostedNodes();
      } else {
        toast.error('Failed to start node');
      }
    } catch (error) {
      console.error('Failed to start node:', error);
      toast.error('Failed to start node');
    }
  };

  const handleStopNode = async (nodeId: string) => {
    try {
      const success = await nodeHostingService.stopNode(nodeId);
      if (success) {
        toast.success('Node stopped successfully');
        await loadHostedNodes();
      } else {
        toast.error('Failed to stop node');
      }
    } catch (error) {
      console.error('Failed to stop node:', error);
      toast.error('Failed to stop node');
    }
  };

  const handleEnableStaking = async (nodeId: string, amount: number) => {
    try {
      const success = await nodeHostingService.enableStaking(nodeId, amount);
      if (success) {
        toast.success('Staking enabled successfully');
        await loadHostedNodes();
      } else {
        toast.error('Failed to enable staking');
      }
    } catch (error) {
      console.error('Failed to enable staking:', error);
      toast.error('Failed to enable staking');
    }
  };

  const getChainIcon = (chain: string) => {
    const chainInfo = supportedChains.find(c => c.id === chain);
    if (chainInfo) {
      return <img src={chainInfo.icon} alt={chain} className="w-6 h-6 object-contain" />;
    }
    return <div className="w-6 h-6 bg-slate-600 rounded-full flex items-center justify-center text-xs">{chain[0]}</div>;
  };

  const getStatusIcon = (node: NodeHostingConfig) => {
    if (!node.isInstalled) {
      return <XCircle className="w-4 h-4 text-gray-400" />;
    }
    if (!node.isRunning) {
      return <Square className="w-4 h-4 text-red-400" />;
    }
    if (node.syncStatus === 'syncing') {
      return <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />;
    }
    if (node.isStaking) {
      return <CheckCircle className="w-4 h-4 text-green-400" />;
    }
    return <CheckCircle className="w-4 h-4 text-blue-400" />;
  };

  const getStatusText = (node: NodeHostingConfig) => {
    if (!node.isInstalled) return 'Not Installed';
    if (!node.isRunning) return 'Stopped';
    if (node.syncStatus === 'syncing') return 'Syncing';
    if (node.isStaking) return 'Staking';
    return 'Running';
  };

  const getStatusColor = (node: NodeHostingConfig) => {
    if (!node.isInstalled) return 'text-gray-400';
    if (!node.isRunning) return 'text-red-400';
    if (node.syncStatus === 'syncing') return 'text-yellow-400';
    if (node.isStaking) return 'text-green-400';
    return 'text-blue-400';
  };

  const formatStorageSize = (size: number) => {
    if (size >= 1000) {
      return `${(size / 1000).toFixed(1)} TB`;
    }
    return `${size.toFixed(1)} GB`;
  };

  const formatUptime = (uptime: number) => {
    return `${uptime.toFixed(1)}%`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        className="bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 w-full max-w-7xl max-h-[90vh] overflow-hidden"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
          <div className="flex items-center space-x-3">
            <Server className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-semibold">Node Hosting Dashboard</h2>
            <div className="flex items-center space-x-2 px-3 py-1 bg-green-500/20 rounded-full">
              <Zap className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-400">Earn WATT Tokens</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <motion.button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-colors disabled:opacity-50"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </motion.button>
            
            <motion.button
              onClick={onClose}
              className="p-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700/50">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'install', label: 'Install Node', icon: Download },
            { id: 'manage', label: 'Manage Nodes', icon: Settings },
            { id: 'rewards', label: 'Rewards', icon: DollarSign }
          ].map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <motion.div
                  className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">Total Nodes</p>
                      <p className="text-2xl font-bold">{hostedNodes.length}</p>
                    </div>
                    <Server className="w-8 h-8 text-blue-400" />
                  </div>
                </motion.div>

                <motion.div
                  className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">Active Nodes</p>
                      <p className="text-2xl font-bold">{hostedNodes.filter(n => n.isRunning).length}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                </motion.div>

                <motion.div
                  className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">Staking Nodes</p>
                      <p className="text-2xl font-bold">{hostedNodes.filter(n => n.isStaking).length}</p>
                    </div>
                    <Zap className="w-8 h-8 text-yellow-400" />
                  </div>
                </motion.div>

                <motion.div
                  className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">Total Rewards</p>
                      <p className="text-2xl font-bold">
                        {hostedNodes.reduce((sum, node) => sum + node.totalRewards, 0).toFixed(2)} WATT
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-emerald-400" />
                  </div>
                </motion.div>
              </div>

              {/* Recent Nodes */}
              <motion.div
                className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h3 className="text-lg font-semibold mb-4">Recent Nodes</h3>
                
                {hostedNodes.length === 0 ? (
                  <div className="text-center py-8">
                    <Server className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-400">No nodes installed yet</p>
                    <p className="text-sm text-slate-500">Install your first node to start earning WATT rewards</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {hostedNodes.slice(0, 5).map((node) => {
                      const metrics = performanceMetrics.get(node.id);
                      return (
                        <div key={node.id} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            {getChainIcon(node.chain)}
                            <div>
                              <p className="font-medium">{node.chain} Node</p>
                              <p className="text-sm text-slate-400">{node.nodeType} • {node.chain}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className="text-sm font-medium">{getStatusText(node)}</p>
                              <p className="text-xs text-slate-400">
                                {metrics ? `${formatUptime(metrics.uptime)} uptime` : 'No data'}
                              </p>
                            </div>
                            {getStatusIcon(node)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            </div>
          )}

          {activeTab === 'install' && (
            <div className="space-y-6">
              {/* Supported Chains */}
              <motion.div
                className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h3 className="text-lg font-semibold mb-4">Supported Blockchains</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {supportedChains.map((chain) => (
                    <motion.div
                      key={chain.id}
                      onClick={() => setSelectedChain(chain.id)}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedChain === chain.id
                          ? 'border-blue-500/50 bg-blue-500/10'
                          : 'border-slate-700/50 hover:border-slate-600/50'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <img src={chain.icon} alt={chain.name} className="w-8 h-8 object-contain" />
                        <div>
                          <p className="font-medium">{chain.name}</p>
                          <p className="text-xs text-slate-400">{chain.id}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Storage:</span>
                          <span>{chain.storage}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Reward:</span>
                          <span className="text-green-400">{chain.reward}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Installation Form */}
              <motion.div
                className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h3 className="text-lg font-semibold mb-4">Install {selectedChain} Node</h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Node Type</label>
                      <select
                        value={installForm.nodeType}
                        onChange={(e) => setInstallForm({ ...installForm, nodeType: e.target.value as any })}
                        className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500/50"
                      >
                        <option value="full">Full Node</option>
                        <option value="light">Light Node</option>
                        <option value="archive">Archive Node</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Installation Path</label>
                      <input
                        type="text"
                        value={installForm.installPath}
                        onChange={(e) => setInstallForm({ ...installForm, installPath: e.target.value })}
                        placeholder="/path/to/installation"
                        className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500/50"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Data Directory</label>
                    <input
                      type="text"
                      value={installForm.dataDir}
                      onChange={(e) => setInstallForm({ ...installForm, dataDir: e.target.value })}
                      placeholder="/path/to/data"
                      className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">RPC Username</label>
                      <input
                        type="text"
                        value={installForm.rpcUsername}
                        onChange={(e) => setInstallForm({ ...installForm, rpcUsername: e.target.value })}
                        placeholder="rpc_username"
                        className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500/50"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">RPC Password</label>
                      <div className="relative">
                        <input
                          type={showPasswords ? 'text' : 'password'}
                          value={installForm.rpcPassword}
                          onChange={(e) => setInstallForm({ ...installForm, rpcPassword: e.target.value })}
                          placeholder="rpc_password"
                          className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:border-blue-500/50"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(!showPasswords)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        >
                          {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Staking Amount (WATT)</label>
                    <input
                      type="number"
                      value={installForm.stakingAmount}
                      onChange={(e) => setInstallForm({ ...installForm, stakingAmount: e.target.value })}
                      placeholder="0.0"
                      min="0"
                      step="0.1"
                      className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500/50"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      Stake WATT tokens to earn additional rewards from node hosting
                    </p>
                  </div>
                  
                  <motion.button
                    onClick={handleInstallNode}
                    disabled={loading}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors disabled:opacity-50"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Installing Node...</span>
                      </div>
                    ) : (
                      `Install ${selectedChain} Node`
                    )}
                  </motion.button>
                </div>
              </motion.div>
            </div>
          )}

          {activeTab === 'manage' && (
            <div className="space-y-6">
              <motion.div
                className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h3 className="text-lg font-semibold mb-4">Manage Hosted Nodes</h3>
                
                {hostedNodes.length === 0 ? (
                  <div className="text-center py-8">
                    <Server className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-400">No nodes to manage</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {hostedNodes.map((node) => {
                      const metrics = performanceMetrics.get(node.id);
                      return (
                        <div key={node.id} className="bg-slate-900/50 rounded-lg p-6 border border-slate-700/50">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              {getChainIcon(node.chain)}
                              <div>
                                <p className="font-medium">{node.chain} Node</p>
                                <p className="text-sm text-slate-400">
                                  {node.nodeType} • {node.installPath}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(node)}
                              <span className={`text-sm ${getStatusColor(node)}`}>
                                {getStatusText(node)}
                              </span>
                            </div>
                          </div>
                          
                          {metrics && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                              <div className="text-center">
                                <p className="text-sm text-slate-400">Uptime</p>
                                <p className="font-medium">{formatUptime(metrics.uptime)}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-sm text-slate-400">Storage</p>
                                <p className="font-medium">{formatStorageSize(metrics.storageSize)}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-sm text-slate-400">Block Height</p>
                                <p className="font-medium">{metrics.blockHeight.toLocaleString()}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-sm text-slate-400">Peers</p>
                                <p className="font-medium">{metrics.peers}</p>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-slate-400">
                              Total Rewards: <span className="text-green-400 font-medium">{node.totalRewards.toFixed(4)} WATT</span>
                            </div>
                            
                            <div className="flex space-x-2">
                              {!node.isRunning ? (
                                <motion.button
                                  onClick={() => handleStartNode(node.id)}
                                  className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm transition-colors"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Play className="w-3 h-3 inline mr-1" />
                                  Start
                                </motion.button>
                              ) : (
                                <motion.button
                                  onClick={() => handleStopNode(node.id)}
                                  className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Square className="w-3 h-3 inline mr-1" />
                                  Stop
                                </motion.button>
                              )}
                              
                              {node.isRunning && !node.isStaking && (
                                <motion.button
                                  onClick={() => handleEnableStaking(node.id, parseFloat(installForm.stakingAmount) || 100)}
                                  className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-sm transition-colors"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Zap className="w-3 h-3 inline mr-1" />
                                  Enable Staking
                                </motion.button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            </div>
          )}

          {activeTab === 'rewards' && (
            <div className="space-y-6">
              <motion.div
                className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h3 className="text-lg font-semibold mb-4">Reward History</h3>
                
                {rewardHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <DollarSign className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-400">No rewards earned yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {rewardHistory.slice(0, 10).map((reward, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getChainIcon(reward.chain)}
                          <div>
                            <p className="font-medium">{reward.chain} Node</p>
                            <p className="text-sm text-slate-400">
                              {reward.blocksProcessed} blocks • {reward.timePeriod}h
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="font-medium text-green-400">+{reward.totalReward.toFixed(4)} WATT</p>
                          <p className="text-xs text-slate-400">
                            Base: {reward.baseReward.toFixed(4)} + Storage: {reward.storageBonus.toFixed(4)} + Uptime: {reward.uptimeBonus.toFixed(4)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default NodeHostingDashboard;
