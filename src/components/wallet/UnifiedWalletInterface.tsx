import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet, 
  Key, 
  Eye, 
  EyeOff, 
  Copy, 
  Download, 
  Upload, 
  Shield, 
  Network,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Plus,
  Trash2,
  Settings
} from 'lucide-react';
import { walletService, WalletAddress } from '../../services/walletService';
import { utxoWalletService, UTXOWalletAddress } from '../../services/utxoWalletService';
import { rpcNodeService } from '../../services/rpcNodeService';
import { crossChainSwapCoordinator } from '../../services/crossChainSwapCoordinator';
import toast from 'react-hot-toast';

interface UnifiedWalletInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
}

const UnifiedWalletInterface: React.FC<UnifiedWalletInterfaceProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'evm' | 'utxo' | 'overview'>('overview');
  const [showPrivateKeys, setShowPrivateKeys] = useState(false);
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [mnemonic, setMnemonic] = useState('');
  const [evmWallets, setEvmWallets] = useState<Map<string, WalletAddress[]>>(new Map());
  const [utxoWallets, setUtxoWallets] = useState<Map<string, UTXOWalletAddress[]>>(new Map());
  const [nodeStatus, setNodeStatus] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);
  const [importData, setImportData] = useState({
    type: 'mnemonic',
    value: '',
    password: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadWallets();
      loadNodeStatus();
    }
  }, [isOpen]);

  const loadWallets = async () => {
    try {
      // Load EVM wallets
      const evmChains = walletService.getSupportedChains();
      const evmWalletMap = new Map<string, WalletAddress[]>();
      
      for (const chain of evmChains) {
        const addresses = walletService.getAllAddresses(chain);
        evmWalletMap.set(chain, addresses);
      }
      setEvmWallets(evmWalletMap);

      // Load UTXO wallets
      const utxoChains = utxoWalletService.getSupportedChains();
      const utxoWalletMap = new Map<string, UTXOWalletAddress[]>();
      
      for (const chain of utxoChains) {
        const addresses = utxoWalletService.getAllWallets(chain);
        utxoWalletMap.set(chain, addresses);
      }
      setUtxoWallets(utxoWalletMap);
    } catch (error) {
      console.error('Failed to load wallets:', error);
    }
  };

  const loadNodeStatus = async () => {
    try {
      const status = crossChainSwapCoordinator.getNodeStatus();
      setNodeStatus(status);
    } catch (error) {
      console.error('Failed to load node status:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadWallets(),
        loadNodeStatus()
      ]);
      toast.success('Wallets refreshed');
    } catch (error) {
      toast.error('Failed to refresh wallets');
    } finally {
      setRefreshing(false);
    }
  };

  const handleInitializeFromMnemonic = async () => {
    if (!mnemonic.trim()) {
      toast.error('Please enter a mnemonic phrase');
      return;
    }

    setLoading(true);
    try {
      // Initialize both EVM and UTXO wallets
      const evmSuccess = await walletService.initializeFromMnemonic(mnemonic);
      const utxoSuccess = await utxoWalletService.initializeFromMnemonic(mnemonic);

      if (evmSuccess && utxoSuccess) {
        toast.success('Wallets initialized successfully!');
        setMnemonic('');
        setShowMnemonic(false);
        await loadWallets();
      } else {
        toast.error('Failed to initialize wallets');
      }
    } catch (error) {
      console.error('Failed to initialize wallets:', error);
      toast.error('Failed to initialize wallets');
    } finally {
      setLoading(false);
    }
  };

  const handleImportWallet = async () => {
    if (!importData.value.trim()) {
      toast.error('Please enter import data');
      return;
    }

    setLoading(true);
    try {
      if (importData.type === 'mnemonic') {
        const evmSuccess = await walletService.initializeFromMnemonic(importData.value);
        const utxoSuccess = await utxoWalletService.initializeFromMnemonic(importData.value);
        
        if (evmSuccess && utxoSuccess) {
          toast.success('Wallets imported successfully!');
          setImportData({ type: 'mnemonic', value: '', password: '' });
          setShowImportForm(false);
          await loadWallets();
        } else {
          toast.error('Failed to import wallets');
        }
      } else if (importData.type === 'privateKey') {
        // For private key import, we need to specify which chain
        toast.error('Private key import requires chain selection');
      }
    } catch (error) {
      console.error('Failed to import wallet:', error);
      toast.error('Failed to import wallet');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const getChainIcon = (chain: string) => {
    switch (chain) {
      case 'BTC':
        return <img src="/BTC logo.png" alt="BTC" className="w-6 h-6 object-contain" />;
      case 'ETH':
        return <img src="/ETH logo.png" alt="ETH" className="w-6 h-6 object-contain" />;
      case 'LTC':
        return <img src="/LTC logo.png" alt="LTC" className="w-6 h-6 object-contain" />;
      case 'ALT':
        return <img src="/Altcoinchain logo.png" alt="ALT" className="w-6 h-6 object-contain rounded-full" />;
      case 'WATT':
        return <img src="/WATT logo.png" alt="WATT" className="w-6 h-6 object-contain" />;
      case 'GHOST':
        return <img src="/GHOST logo.png" alt="GHOST" className="w-6 h-6 object-contain" />;
      case 'TROLL':
        return <img src="/TROLL logo.png" alt="TROLL" className="w-6 h-6 object-contain" />;
      case 'HTH':
        return <img src="/HTH logo.webp" alt="HTH" className="w-6 h-6 object-contain" />;
      case 'RTM':
        return <img src="/RTM logo.png" alt="RTM" className="w-6 h-6 object-contain" />;
      default:
        return <div className="w-6 h-6 bg-slate-600 rounded-full flex items-center justify-center text-xs">{chain[0]}</div>;
    }
  };

  const isNodeConnected = (chain: string) => {
    const status = nodeStatus.find(s => s.chain === chain);
    return status?.isConnected || false;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        className="bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 w-full max-w-6xl max-h-[90vh] overflow-hidden"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
          <div className="flex items-center space-x-3">
            <Wallet className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-semibold">Unified Wallet Interface</h2>
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
            { id: 'overview', label: 'Overview', icon: Network },
            { id: 'evm', label: 'EVM Wallets', icon: Wallet },
            { id: 'utxo', label: 'UTXO Wallets', icon: Key }
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
              {/* Wallet Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div
                  className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                    <Wallet className="w-5 h-5 text-blue-400" />
                    <span>EVM Wallets</span>
                  </h3>
                  
                  <div className="space-y-3">
                    {Array.from(evmWallets.entries()).map(([chain, addresses]) => (
                      <div key={chain} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getChainIcon(chain)}
                          <span className="font-medium">{chain}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-slate-400">{addresses.length} addresses</span>
                          <div className={`w-2 h-2 rounded-full ${addresses.length > 0 ? 'bg-green-400' : 'bg-gray-400'}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                <motion.div
                  className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                    <Key className="w-5 h-5 text-purple-400" />
                    <span>UTXO Wallets</span>
                  </h3>
                  
                  <div className="space-y-3">
                    {Array.from(utxoWallets.entries()).map(([chain, addresses]) => (
                      <div key={chain} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getChainIcon(chain)}
                          <span className="font-medium">{chain}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-slate-400">{addresses.length} addresses</span>
                          <div className={`w-2 h-2 rounded-full ${addresses.length > 0 ? 'bg-green-400' : 'bg-gray-400'}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Node Status */}
              <motion.div
                className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                  <Network className="w-5 h-5 text-green-400" />
                  <span>Node Connections</span>
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {nodeStatus.map((status) => (
                    <div key={status.chain} className="flex items-center space-x-2">
                      {getChainIcon(status.chain)}
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{status.chain}</span>
                        <div className="flex items-center space-x-1">
                          <div className={`w-2 h-2 rounded-full ${status.isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
                          <span className="text-xs text-slate-400">
                            {status.isConnected ? 'Connected' : 'Disconnected'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Actions */}
              <motion.div
                className="flex space-x-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <motion.button
                  onClick={() => setShowMnemonic(true)}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Initialize from Mnemonic
                </motion.button>
                
                <motion.button
                  onClick={() => setShowImportForm(true)}
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Import Wallet
                </motion.button>
              </motion.div>
            </div>
          )}

          {activeTab === 'evm' && (
            <div className="space-y-6">
              {Array.from(evmWallets.entries()).map(([chain, addresses]) => (
                <motion.div
                  key={chain}
                  className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {getChainIcon(chain)}
                      <h3 className="text-lg font-semibold">{chain} Wallets</h3>
                    </div>
                    <motion.button
                      onClick={() => walletService.generateNewAddress(chain)}
                      className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Plus className="w-4 h-4" />
                    </motion.button>
                  </div>
                  
                  <div className="space-y-3">
                    {addresses.map((address, index) => (
                      <div key={index} className="bg-slate-900/50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-sm">{address.address}</span>
                          <div className="flex items-center space-x-2">
                            <motion.button
                              onClick={() => copyToClipboard(address.address, 'Address')}
                              className="p-1 hover:bg-slate-700/50 rounded transition-colors"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Copy className="w-4 h-4" />
                            </motion.button>
                            {showPrivateKeys && address.privateKey && (
                              <motion.button
                                onClick={() => copyToClipboard(address.privateKey, 'Private Key')}
                                className="p-1 hover:bg-slate-700/50 rounded transition-colors"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <Key className="w-4 h-4" />
                              </motion.button>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-slate-400">
                          Path: {address.derivationPath}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === 'utxo' && (
            <div className="space-y-6">
              {Array.from(utxoWallets.entries()).map(([chain, addresses]) => (
                <motion.div
                  key={chain}
                  className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {getChainIcon(chain)}
                      <h3 className="text-lg font-semibold">{chain} Wallets</h3>
                      <div className={`w-2 h-2 rounded-full ${isNodeConnected(chain) ? 'bg-green-400' : 'bg-red-400'}`} />
                    </div>
                    <motion.button
                      onClick={() => utxoWalletService.generateNewAddress(chain)}
                      className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Plus className="w-4 h-4" />
                    </motion.button>
                  </div>
                  
                  <div className="space-y-3">
                    {addresses.map((address, index) => (
                      <div key={index} className="bg-slate-900/50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-sm">{address.address}</span>
                          <div className="flex items-center space-x-2">
                            <motion.button
                              onClick={() => copyToClipboard(address.address, 'Address')}
                              className="p-1 hover:bg-slate-700/50 rounded transition-colors"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Copy className="w-4 h-4" />
                            </motion.button>
                            {showPrivateKeys && address.privateKey && (
                              <motion.button
                                onClick={() => copyToClipboard(address.privateKey, 'Private Key')}
                                className="p-1 hover:bg-slate-700/50 rounded transition-colors"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <Key className="w-4 h-4" />
                              </motion.button>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>Balance: {address.balance.toFixed(8)} {chain}</span>
                          <span>UTXOs: {address.unspentOutputs.length}</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          Path: {address.derivationPath}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Mnemonic Modal */}
        {showMnemonic && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-60 flex items-center justify-center p-4">
            <motion.div
              className="bg-slate-900/95 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6 w-full max-w-md"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <h3 className="text-lg font-semibold mb-4">Initialize Wallets</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Mnemonic Phrase</label>
                  <textarea
                    value={mnemonic}
                    onChange={(e) => setMnemonic(e.target.value)}
                    placeholder="Enter your 12 or 24 word mnemonic phrase..."
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500/50 h-24 resize-none"
                  />
                </div>
                
                <div className="flex space-x-3">
                  <motion.button
                    onClick={handleInitializeFromMnemonic}
                    disabled={loading}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors disabled:opacity-50"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {loading ? 'Initializing...' : 'Initialize'}
                  </motion.button>
                  <motion.button
                    onClick={() => setShowMnemonic(false)}
                    className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Import Modal */}
        {showImportForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-60 flex items-center justify-center p-4">
            <motion.div
              className="bg-slate-900/95 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6 w-full max-w-md"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <h3 className="text-lg font-semibold mb-4">Import Wallet</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Import Type</label>
                  <select
                    value={importData.type}
                    onChange={(e) => setImportData({ ...importData, type: e.target.value })}
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500/50"
                  >
                    <option value="mnemonic">Mnemonic Phrase</option>
                    <option value="privateKey">Private Key</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {importData.type === 'mnemonic' ? 'Mnemonic Phrase' : 'Private Key'}
                  </label>
                  <textarea
                    value={importData.value}
                    onChange={(e) => setImportData({ ...importData, value: e.target.value })}
                    placeholder={importData.type === 'mnemonic' ? 'Enter your mnemonic phrase...' : 'Enter your private key...'}
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500/50 h-24 resize-none"
                  />
                </div>
                
                <div className="flex space-x-3">
                  <motion.button
                    onClick={handleImportWallet}
                    disabled={loading}
                    className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors disabled:opacity-50"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {loading ? 'Importing...' : 'Import'}
                  </motion.button>
                  <motion.button
                    onClick={() => setShowImportForm(false)}
                    className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-700/50">
          <div className="flex items-center space-x-2">
            <motion.button
              onClick={() => setShowPrivateKeys(!showPrivateKeys)}
              className="flex items-center space-x-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {showPrivateKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span className="text-sm">{showPrivateKeys ? 'Hide' : 'Show'} Private Keys</span>
            </motion.button>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-slate-400">
            <Shield className="w-4 h-4" />
            <span>Private keys are stored locally and encrypted</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default UnifiedWalletInterface;
