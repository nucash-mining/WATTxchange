import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wifi, WifiOff, RefreshCw, TestTube, Globe, Shield, Eye, CheckCircle, AlertTriangle } from 'lucide-react';
import { moneroNodeService, MoneroNode } from '../../services/moneroNodeService';
import { rpcNodeService } from '../../services/rpcNodeService';
import toast from 'react-hot-toast';

interface MoneroNodeManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const MoneroNodeManager: React.FC<MoneroNodeManagerProps> = ({ isOpen, onClose }) => {
  const [nodes, setNodes] = useState<MoneroNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<MoneroNode | null>(null);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [nodeInfo, setNodeInfo] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      loadNodes();
    }
  }, [isOpen]);

  const loadNodes = () => {
    const allNodes = moneroNodeService.getAllNodes();
    setNodes(allNodes);
    setSelectedNode(moneroNodeService.getSelectedNode());
  };

  const handleConnectNode = async (nodeId: string) => {
    setTesting(nodeId);
    try {
      const success = await moneroNodeService.connectToNode(nodeId);
      if (success) {
        toast.success('Connected to Monero node successfully!');
        loadNodes();
        
        // Get node info
        const info = await moneroNodeService.getNodeInfo();
        setNodeInfo(info);
        
        // Also add to RPC node service for integration with wallet
        const node = moneroNodeService.getAllNodes().find(n => n.id === nodeId);
        if (node) {
          rpcNodeService.addNode({
            id: `monero-${nodeId}`,
            name: `Monero Remote (${node.host})`,
            symbol: 'XMR',
            host: node.host,
            port: node.port,
            username: '',
            password: '',
            ssl: node.protocol === 'HTTPS'
          });
        }
      } else {
        toast.error('Failed to connect to Monero node');
      }
    } catch (error) {
      console.error('Connection failed:', error);
      toast.error('Connection failed');
    } finally {
      setTesting(null);
    }
  };

  const handleRefreshNodes = async () => {
    setLoading(true);
    try {
      await moneroNodeService.refreshNodeStatus();
      loadNodes();
      toast.success('Node status refreshed');
    } catch (error) {
      console.error('Refresh failed:', error);
      toast.error('Failed to refresh nodes');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (node: MoneroNode) => {
    if (node.status === 'Online') {
      return <Wifi className="w-4 h-4 text-emerald-400" />;
    } else {
      return <WifiOff className="w-4 h-4 text-red-400" />;
    }
  };

  const getNetworkTypeColor = (networkType: string) => {
    switch (networkType) {
      case 'MAINNET':
        return 'bg-emerald-500/20 text-emerald-400';
      case 'STAGENET':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'TESTNET':
        return 'bg-blue-500/20 text-blue-400';
      default:
        return 'bg-slate-500/20 text-slate-400';
    }
  };

  const getFlagIcon = (flag: string) => {
    if (flag === 'TOR') {
      return <Shield className="w-3 h-3 text-purple-400" />;
    } else if (flag === 'I2P') {
      return <Eye className="w-3 h-3 text-blue-400" />;
    } else {
      return <Globe className="w-3 h-3 text-slate-400" />;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          className="bg-slate-800/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 max-w-6xl w-full max-h-[90vh] overflow-y-auto"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
            <div>
              <h3 className="text-xl font-semibold">Monero Remote Nodes</h3>
              <p className="text-slate-400 text-sm">Connect to public Monero nodes for wallet functionality</p>
            </div>
            <div className="flex items-center space-x-2">
              <motion.button
                onClick={handleRefreshNodes}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors disabled:opacity-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </motion.button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Node List */}
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4">
              {nodes.map((node) => (
                <motion.div
                  key={node.id}
                  className={`bg-slate-900/50 rounded-lg p-4 border transition-all duration-300 ${
                    selectedNode?.id === node.id
                      ? 'border-emerald-500/50 bg-emerald-500/5'
                      : 'border-slate-700/30 hover:border-slate-600/50'
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      {getStatusIcon(node)}
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold">{node.host}</h4>
                          <span className="text-sm text-slate-400">:{node.port}</span>
                          <span className={`text-xs px-2 py-1 rounded ${getNetworkTypeColor(node.networkType)}`}>
                            {node.networkType}
                          </span>
                          <span className="text-xs bg-slate-700/50 px-2 py-1 rounded">
                            {node.protocol}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="flex items-center space-x-1">
                            <span className="text-slate-400">Status:</span>
                            <span className={node.status === 'Online' ? 'text-emerald-400' : 'text-red-400'}>
                              {node.status}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <span className="text-slate-400">Uptime:</span>
                            <span className={node.availability > 95 ? 'text-emerald-400' : node.availability > 80 ? 'text-yellow-400' : 'text-red-400'}>
                              {node.availability}%
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <span className="text-slate-400">Last Checked:</span>
                            <span>{node.lastChecked}</span>
                          </div>
                          
                          {node.location && (
                            <div className="flex items-center space-x-1">
                              <span className="text-slate-400">Location:</span>
                              <span>{node.location}</span>
                            </div>
                          )}
                        </div>
                        
                        {node.flags && node.flags.length > 0 && (
                          <div className="flex items-center space-x-2 mt-2">
                            {node.flags.map((flag, index) => (
                              <div key={index} className="flex items-center space-x-1">
                                {getFlagIcon(flag)}
                                <span className="text-xs bg-slate-700/50 px-2 py-1 rounded">{flag}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {selectedNode?.id === node.id ? (
                        <div className="flex items-center space-x-2 px-3 py-2 bg-emerald-600/20 rounded-lg">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          <span className="text-sm text-emerald-400">Connected</span>
                        </div>
                      ) : (
                        <motion.button
                          onClick={() => handleConnectNode(node.id)}
                          disabled={testing === node.id || node.status === 'Offline'}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {testing === node.id ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Connecting...</span>
                            </>
                          ) : (
                            <>
                              <TestTube className="w-4 h-4" />
                              <span>Connect</span>
                            </>
                          )}
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Node Info */}
            {selectedNode && nodeInfo && (
              <motion.div
                className="mt-6 bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h4 className="text-lg font-semibold mb-4">Connected Node Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="font-medium text-yellow-400 mb-2">Network Status</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Block Height:</span>
                        <span>{nodeInfo.height?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Node Status:</span>
                        <span className="text-emerald-400">{nodeInfo.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Version:</span>
                        <span>{nodeInfo.version}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Network:</span>
                        <span>{selectedNode.networkType}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-yellow-400 mb-2">Connection Details</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Host:</span>
                        <span className="font-mono">{selectedNode.host}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Port:</span>
                        <span>{selectedNode.port}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Protocol:</span>
                        <span>{selectedNode.protocol}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Availability:</span>
                        <span className={selectedNode.availability > 95 ? 'text-emerald-400' : 'text-yellow-400'}>
                          {selectedNode.availability}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Privacy Notice */}
            <motion.div
              className="mt-6 bg-purple-600/10 border border-purple-500/30 rounded-xl p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-start space-x-3">
                <Shield className="w-6 h-6 text-purple-400 mt-1" />
                <div>
                  <h4 className="text-lg font-semibold text-purple-400 mb-2">Privacy & Security</h4>
                  <p className="text-slate-300 mb-3">
                    Monero nodes provide access to the privacy-focused Monero network. When connecting to remote nodes, 
                    your IP address may be visible to the node operator.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <h5 className="font-semibold text-purple-400 mb-2">🔗 Regular Nodes</h5>
                      <ul className="text-sm text-slate-300 space-y-1">
                        <li>• Direct connection</li>
                        <li>• Fastest performance</li>
                        <li>• IP visible to node</li>
                        <li>• Recommended for testing</li>
                      </ul>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <h5 className="font-semibold text-purple-400 mb-2">🧅 Tor Nodes</h5>
                      <ul className="text-sm text-slate-300 space-y-1">
                        <li>• Anonymous connection</li>
                        <li>• Hidden IP address</li>
                        <li>• Requires Tor browser</li>
                        <li>• Maximum privacy</li>
                      </ul>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <h5 className="font-semibold text-purple-400 mb-2">👁️ I2P Nodes</h5>
                      <ul className="text-sm text-slate-300 space-y-1">
                        <li>• I2P network routing</li>
                        <li>• High anonymity</li>
                        <li>• Requires I2P setup</li>
                        <li>• Advanced privacy</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Instructions */}
            <motion.div
              className="mt-6 bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h4 className="font-semibold mb-3">How to Use</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                  <h5 className="font-medium text-yellow-400 mb-2">Getting Started</h5>
                  <ol className="space-y-1 text-slate-300 list-decimal pl-4">
                    <li>Choose a node from the list above</li>
                    <li>Click "Connect" to test the connection</li>
                    <li>Once connected, you can check balances and send XMR</li>
                    <li>For privacy, prefer Tor or I2P nodes</li>
                  </ol>
                </div>
                <div>
                  <h5 className="font-medium text-purple-400 mb-2">Node Types</h5>
                  <ul className="space-y-1 text-slate-300">
                    <li>• <strong>MAINNET:</strong> Production Monero network</li>
                    <li>• <strong>STAGENET:</strong> Testing with real features</li>
                    <li>• <strong>TESTNET:</strong> Development testing only</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default MoneroNodeManager;