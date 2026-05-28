import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Server, Wifi, WifiOff, Settings, Trash2, TestTube, Eye, EyeOff, Download, Play, Square } from 'lucide-react';
import { rpcNodeService, RPCNodeConfig } from '../../services/rpcNodeService';
import toast from 'react-hot-toast';

interface RPCNodeManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const RPCNodeManager: React.FC<RPCNodeManagerProps> = ({ isOpen, onClose }) => {
  const [nodes, setNodes] = useState<RPCNodeConfig[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showInstallForm, setShowInstallForm] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState('BTC');
  const [formData, setFormData] = useState({
    name: '',
    host: '',
    port: '',
    username: '',
    password: '',
    ssl: false
  });
  const [installData, setInstallData] = useState({
    symbol: 'BTC',
    dataDir: '',
    username: '',
    password: '',
    walletName: '',
    walletPassphrase: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [installing, setInstalling] = useState(false);
  const [starting, setStarting] = useState<string | null>(null);
  const [stopping, setStopping] = useState<string | null>(null);

  const supportedChains = ['BTC', 'LTC', 'XMR', 'GHOST', 'TROLL', 'HTH', 'ALT', 'RTM'];

  useEffect(() => {
    if (isOpen) {
      loadNodes();
      discoverLocalNodes();
    }
  }, [isOpen]);

  const loadNodes = () => {
    const allNodes = rpcNodeService.getAllNodes();
    setNodes(allNodes);
  };

  const discoverLocalNodes = async () => {
    try {
      const discovered = await rpcNodeService.discoverLocalNodes();
      if (discovered.length > 0) {
        toast.success(`Discovered ${discovered.length} local nodes`);
        // Auto-add discovered nodes
        for (const node of discovered) {
          rpcNodeService.addNode(node);
        }
        loadNodes();
      }
    } catch (error) {
      console.error('Node discovery failed:', error);
    }
  };

  const handleAddNode = () => {
    if (!formData.name || !formData.host || !formData.port) {
      toast.error('Please fill in all required fields');
      return;
    }

    const defaultConfig = rpcNodeService.getDefaultNodeConfig(selectedSymbol);
    const nodeConfig = {
      id: `${selectedSymbol.toLowerCase()}-${Date.now()}`,
      name: formData.name,
      symbol: selectedSymbol,
      host: formData.host,
      port: parseInt(formData.port),
      username: formData.username,
      password: formData.password,
      ssl: formData.ssl
    };

    const success = rpcNodeService.addNode(nodeConfig);
    if (success) {
      toast.success('Node added successfully');
      setShowAddForm(false);
      setFormData({
        name: '',
        host: '',
        port: '',
        username: '',
        password: '',
        ssl: false
      });
      loadNodes();
    } else {
      toast.error('Failed to add node');
    }
  };

  const handleInstallNode = async () => {
    if (!installData.dataDir || !installData.username || !installData.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    setInstalling(true);
    try {
      const success = await rpcNodeService.installNode(
        installData.symbol,
        installData.dataDir,
        installData.username,
        installData.password
      );

      if (success) {
        toast.success(`${installData.symbol} node installed successfully`);
        setShowInstallForm(false);
        
        // Add the newly installed node
        const defaultConfig = rpcNodeService.getDefaultNodeConfig(installData.symbol);
        const nodeConfig = {
          id: `${installData.symbol.toLowerCase()}-${Date.now()}`,
          name: `${defaultConfig?.name || installData.symbol} Node`,
          symbol: installData.symbol,
          host: '127.0.0.1',
          port: defaultConfig?.port || 0,
          username: installData.username,
          password: installData.password,
          ssl: false
        };

        rpcNodeService.addNode(nodeConfig);
        loadNodes();
      } else {
        toast.error(`Failed to install ${installData.symbol} node`);
      }
    } catch (error) {
      console.error('Installation failed:', error);
      toast.error('Installation failed');
    } finally {
      setInstalling(false);
    }
  };

  const handleStartNode = async (nodeId: string) => {
    setStarting(nodeId);
    try {
      const node = rpcNodeService.getNode(nodeId);
      if (!node) {
        toast.error('Node not found');
        return;
      }

      const success = await rpcNodeService.startNode(node.symbol, '');
      if (success) {
        toast.success(`${node.symbol} node started successfully`);
        // Update node status
        await rpcNodeService.testConnection(nodeId);
        loadNodes();
      } else {
        toast.error(`Failed to start ${node.symbol} node`);
      }
    } catch (error) {
      console.error('Failed to start node:', error);
      toast.error('Failed to start node');
    } finally {
      setStarting(null);
    }
  };

  const handleStopNode = async (nodeId: string) => {
    setStopping(nodeId);
    try {
      const node = rpcNodeService.getNode(nodeId);
      if (!node) {
        toast.error('Node not found');
        return;
      }

      const success = await rpcNodeService.stopNode(node.symbol, '');
      if (success) {
        toast.success(`${node.symbol} node stopped successfully`);
        // Update node status
        rpcNodeService.updateNode(nodeId, { isConnected: false });
        loadNodes();
      } else {
        toast.error(`Failed to stop ${node.symbol} node`);
      }
    } catch (error) {
      console.error('Failed to stop node:', error);
      toast.error('Failed to stop node');
    } finally {
      setStopping(null);
    }
  };

  const handleTestConnection = async (nodeId: string) => {
    setTesting(nodeId);
    try {
      const success = await rpcNodeService.testConnection(nodeId);
      if (success) {
        toast.success('Connection successful!');
      } else {
        toast.error('Connection failed');
      }
      loadNodes();
    } catch (error) {
      toast.error('Connection test failed');
    } finally {
      setTesting(null);
    }
  };

  const handleRemoveNode = (nodeId: string) => {
    const success = rpcNodeService.removeNode(nodeId);
    if (success) {
      toast.success('Node removed');
      loadNodes();
    } else {
      toast.error('Failed to remove node');
    }
  };

  const handleSymbolChange = (symbol: string) => {
    setSelectedSymbol(symbol);
    const defaultConfig = rpcNodeService.getDefaultNodeConfig(symbol);
    if (defaultConfig) {
      setFormData(prev => ({
        ...prev,
        name: defaultConfig.name || '',
        port: defaultConfig.port?.toString() || ''
      }));
    }
  };

  const handleInstallSymbolChange = (symbol: string) => {
    setInstallData(prev => ({
      ...prev,
      symbol,
      dataDir: `/home/project/nodes/${symbol.toLowerCase()}`
    }));
  };

  const getStatusIcon = (node: RPCNodeConfig) => {
    if (node.isConnected) {
      return <Wifi className="w-4 h-4 text-emerald-400" />;
    } else {
      return <WifiOff className="w-4 h-4 text-red-400" />;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          className="bg-slate-800/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
            <div>
              <h3 className="text-xl font-semibold">RPC Node Manager</h3>
              <p className="text-slate-400 text-sm">Manage remote blockchain node connections</p>
            </div>
            <div className="flex items-center space-x-2">
              <motion.button
                onClick={() => setShowAddForm(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Plus className="w-4 h-4" />
                <span>Add Node</span>
              </motion.button>
              <motion.button
                onClick={() => setShowInstallForm(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Download className="w-4 h-4" />
                <span>Install Node</span>
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
            {nodes.length === 0 ? (
              <div className="text-center py-12">
                <Server className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-400 mb-4">No RPC nodes configured</p>
                <p className="text-slate-500 text-sm">Add a remote node connection to manage UTXO chains</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {nodes.map((node) => (
                  <motion.div
                    key={node.id}
                    className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(node)}
                        <h4 className="font-semibold">{node.name}</h4>
                        <span className="text-xs bg-slate-700/50 px-2 py-1 rounded">{node.symbol}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {node.isConnected ? (
                          <button
                            onClick={() => handleStopNode(node.id)}
                            disabled={stopping === node.id}
                            className="p-1 hover:bg-red-500/20 rounded transition-colors text-red-400 disabled:opacity-50"
                          >
                            <Square className={`w-4 h-4 ${stopping === node.id ? 'animate-pulse' : ''}`} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStartNode(node.id)}
                            disabled={starting === node.id}
                            className="p-1 hover:bg-emerald-500/20 rounded transition-colors text-emerald-400 disabled:opacity-50"
                          >
                            <Play className={`w-4 h-4 ${starting === node.id ? 'animate-pulse' : ''}`} />
                          </button>
                        )}
                        <button
                          onClick={() => handleTestConnection(node.id)}
                          disabled={testing === node.id}
                          className="p-1 hover:bg-slate-700/50 rounded transition-colors disabled:opacity-50"
                        >
                          <TestTube className={`w-4 h-4 ${testing === node.id ? 'animate-pulse' : ''}`} />
                        </button>
                        <button
                          onClick={() => handleRemoveNode(node.id)}
                          className="p-1 hover:bg-red-500/20 rounded transition-colors text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Host:</span>
                        <span className="font-mono">{node.host}:{node.port}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Status:</span>
                        <span className={node.isConnected ? 'text-emerald-400' : 'text-red-400'}>
                          {node.isConnected ? 'Connected' : 'Disconnected'}
                        </span>
                      </div>
                      {node.isConnected && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Block Height:</span>
                            <span>{node.blockHeight.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Last Ping:</span>
                            <span>{node.lastPing ? new Date(node.lastPing).toLocaleTimeString() : 'Never'}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Add Node Form */}
          <AnimatePresence>
            {showAddForm && (
              <motion.div
                className="border-t border-slate-700/50 p-6"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <h4 className="text-lg font-semibold mb-4">Add New RPC Node</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Blockchain</label>
                    <select
                      value={selectedSymbol}
                      onChange={(e) => handleSymbolChange(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-500/50"
                    >
                      {supportedChains.map(symbol => (
                        <option key={symbol} value={symbol}>{symbol}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Node Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="My Bitcoin Node"
                      className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Host/IP Address</label>
                    <input
                      type="text"
                      value={formData.host}
                      onChange={(e) => setFormData(prev => ({ ...prev, host: e.target.value }))}
                      placeholder="192.168.1.100"
                      className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Port</label>
                    <input
                      type="number"
                      value={formData.port}
                      onChange={(e) => setFormData(prev => ({ ...prev, port: e.target.value }))}
                      placeholder="8332"
                      className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">RPC Username</label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="rpcuser"
                      className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">RPC Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="rpcpassword"
                        className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:border-yellow-500/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4 mt-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.ssl}
                      onChange={(e) => setFormData(prev => ({ ...prev, ssl: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm">Use SSL/HTTPS</span>
                  </label>
                </div>

                <div className="flex space-x-3 mt-6">
                  <motion.button
                    onClick={handleAddNode}
                    className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Node</span>
                  </motion.button>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Install Node Form */}
          <AnimatePresence>
            {showInstallForm && (
              <motion.div
                className="border-t border-slate-700/50 p-6"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <h4 className="text-lg font-semibold mb-4">Install New Blockchain Node</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Blockchain</label>
                    <select
                      value={installData.symbol}
                      onChange={(e) => handleInstallSymbolChange(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-500/50"
                    >
                      {supportedChains.map(symbol => (
                        <option key={symbol} value={symbol}>{symbol}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Data Directory</label>
                    <input
                      type="text"
                      value={installData.dataDir}
                      onChange={(e) => setInstallData(prev => ({ ...prev, dataDir: e.target.value }))}
                      placeholder="/home/project/nodes/bitcoin"
                      className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">RPC Username</label>
                    <input
                      type="text"
                      value={installData.username}
                      onChange={(e) => setInstallData(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="rpcuser"
                      className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">RPC Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={installData.password}
                        onChange={(e) => setInstallData(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="rpcpassword"
                        className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:border-yellow-500/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Wallet Name</label>
                    <input
                      type="text"
                      value={installData.walletName}
                      onChange={(e) => setInstallData(prev => ({ ...prev, walletName: e.target.value }))}
                      placeholder="mywallet"
                      className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Wallet Passphrase (Optional)</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={installData.walletPassphrase}
                        onChange={(e) => setInstallData(prev => ({ ...prev, walletPassphrase: e.target.value }))}
                        placeholder="Secure passphrase"
                        className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:border-yellow-500/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <h5 className="font-medium text-blue-400 mb-2">Installation Information</h5>
                  <p className="text-sm text-slate-300">
                    This will download and install a {installData.symbol} node on your system. The installation process may take some time depending on your internet connection and system performance. Make sure you have enough disk space available.
                  </p>
                  <p className="text-sm text-slate-300 mt-2">
                    After installation, the node will be automatically configured and added to your node list. You can then start and stop it from the node manager.
                  </p>
                </div>

                <div className="flex space-x-3 mt-6">
                  <motion.button
                    onClick={handleInstallNode}
                    disabled={installing}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {installing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Installing...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>Install Node</span>
                      </>
                    )}
                  </motion.button>
                  <button
                    onClick={() => setShowInstallForm(false)}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Instructions */}
          <div className="border-t border-slate-700/50 p-6">
            <h4 className="font-semibold mb-3">Setup Instructions</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <h5 className="font-medium text-yellow-400 mb-2">Bitcoin Core Example</h5>
                <div className="bg-black/50 rounded p-3 font-mono text-xs space-y-1">
                  <div>rpcuser=bitcoinrpc</div>
                  <div>rpcpassword=your_password</div>
                  <div>rpcallowip=0.0.0.0/0</div>
                  <div>server=1</div>
                </div>
              </div>
              <div>
                <h5 className="font-medium text-purple-400 mb-2">Security Notes</h5>
                <ul className="space-y-1 text-slate-300">
                  <li>• Use strong RPC passwords</li>
                  <li>• Restrict RPC access by IP</li>
                  <li>• Enable SSL when possible</li>
                  <li>• Keep nodes updated</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default RPCNodeManager;