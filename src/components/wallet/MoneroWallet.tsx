import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  Send, 
  Download, 
  Upload, 
  Copy, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Plus,
  Minus,
  Play,
  Square,
  Server,
  Wifi,
  WifiOff,
  QrCode,
  History,
  Wallet,
  Cpu,
  Users,
  Activity
} from 'lucide-react';
// import { moneroRpcService, MoneroWallet, MoneroTransaction, MoneroMiningStatus, MoneroNodeInfo } from '../../services/moneroRpcService';
// import QRCode from 'qrcode.react';

interface MoneroWalletProps {
  onClose: () => void;
}

type TabType = 'overview' | 'send' | 'receive' | 'history' | 'mining' | 'settings';

const MoneroWallet: React.FC<MoneroWalletProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showBalances, setShowBalances] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Connection states
  const [nodeConnected, setNodeConnected] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [nodeInfo, setNodeInfo] = useState<MoneroNodeInfo | null>(null);
  
  // Wallet data
  const [wallets, setWallets] = useState<MoneroWallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<MoneroWallet | null>(null);
  const [transactions, setTransactions] = useState<MoneroTransaction[]>([]);
  const [walletAddress, setWalletAddress] = useState<string>('');
  
  // Mining states
  const [miningStatus, setMiningStatus] = useState<MoneroMiningStatus | null>(null);
  const [isMining, setIsMining] = useState(false);
  const [miningThreads, setMiningThreads] = useState(1);
  const [maxThreads, setMaxThreads] = useState(navigator.hardwareConcurrency || 4);
  const [miningPool, setMiningPool] = useState({
    host: 'pool.minexmr.com',
    port: 4444,
    username: '',
    password: 'x',
    ssl: false
  });
  
  // UI states
  const [showAddressQR, setShowAddressQR] = useState(false);
  const [newAddressLabel, setNewAddressLabel] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sendAddress, setSendAddress] = useState('');
  const [sendNote, setSendNote] = useState('');
  
  // Settings
  const [rpcConfig, setRpcConfig] = useState({
    nodeUrl: 'http://127.0.0.1:18081',
    walletUrl: 'http://127.0.0.1:18083',
    nodeUsername: '',
    nodePassword: '',
    walletUsername: '',
    walletPassword: ''
  });

  useEffect(() => {
    initializeWallet();
    checkConnections();
    loadWallets();
    loadMiningStatus();
    
    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      if (nodeConnected && walletConnected) {
        loadWallets();
        loadMiningStatus();
        loadTransactions();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const initializeWallet = async () => {
    try {
      moneroRpcService.updateConfig(rpcConfig);
    } catch (error) {
      console.error('Failed to initialize wallet:', error);
    }
  };

  const checkConnections = async () => {
    try {
      const nodeConnected = await moneroRpcService.testNodeConnection();
      const walletConnected = await moneroRpcService.testWalletConnection();
      
      setNodeConnected(nodeConnected);
      setWalletConnected(walletConnected);
      
      if (nodeConnected) {
        const info = await moneroRpcService.getNodeInfo();
        setNodeInfo(info);
      }
    } catch (error) {
      console.error('Connection check failed:', error);
      setNodeConnected(false);
      setWalletConnected(false);
    }
  };

  const loadWallets = async () => {
    if (!walletConnected) return;
    
    try {
      const address = await moneroRpcService.getWalletAddress();
      setWalletAddress(address);
      
      const walletAccounts = await moneroRpcService.getWalletAccounts();
      setWallets(walletAccounts);
      
      if (walletAccounts.length > 0 && !selectedWallet) {
        setSelectedWallet(walletAccounts[0]);
      }
    } catch (error) {
      console.error('Failed to load wallets:', error);
    }
  };

  const loadTransactions = async () => {
    if (!walletConnected || !selectedWallet) return;
    
    try {
      const txs = await moneroRpcService.getWalletTransactions();
      setTransactions(txs);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  };

  const loadMiningStatus = async () => {
    if (!nodeConnected) return;
    
    try {
      const status = await moneroRpcService.getMiningStatus();
      setMiningStatus(status);
      setIsMining(status.active);
      setMiningThreads(status.threads_count);
    } catch (error) {
      console.error('Failed to load mining status:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await checkConnections();
      await loadWallets();
      await loadTransactions();
      await loadMiningStatus();
    } finally {
      setIsRefreshing(false);
    }
  };

  const generateNewAddress = async () => {
    if (!walletConnected) return;
    
    try {
      // In a real implementation, this would generate a new subaddress
      // For now, we'll use the main address
      setShowAddressQR(true);
    } catch (error) {
      console.error('Failed to generate new address:', error);
    }
  };

  const handleSend = async () => {
    if (!walletConnected || !sendAmount || !sendAddress) return;
    
    try {
      const destinations = [{
        address: sendAddress,
        amount: parseFloat(sendAmount) * 1e12 // Convert XMR to atomic units
      }];
      
      const result = await moneroRpcService.sendTransaction(destinations);
      console.log('Transaction sent:', result);
      
      // Clear form
      setSendAmount('');
      setSendAddress('');
      setSendNote('');
      
      // Refresh data
      await loadWallets();
      await loadTransactions();
    } catch (error) {
      console.error('Failed to send transaction:', error);
    }
  };

  const handleStartMining = async () => {
    if (!nodeConnected || !walletAddress) return;
    
    try {
      const success = await moneroRpcService.startMining(walletAddress, miningThreads);
      if (success) {
        setIsMining(true);
        await loadMiningStatus();
      }
    } catch (error) {
      console.error('Failed to start mining:', error);
    }
  };

  const handleStopMining = async () => {
    if (!nodeConnected) return;
    
    try {
      const success = await moneroRpcService.stopMining();
      if (success) {
        setIsMining(false);
        await loadMiningStatus();
      }
    } catch (error) {
      console.error('Failed to stop mining:', error);
    }
  };

  const handleMiningThreadsChange = async (threads: number) => {
    setMiningThreads(threads);
    if (isMining) {
      try {
        await moneroRpcService.setMiningThreads(threads);
        await loadMiningStatus();
      } catch (error) {
        console.error('Failed to update mining threads:', error);
      }
    }
  };

  const formatBalance = (balance: string) => {
    const xmr = parseFloat(balance) / 1e12;
    return xmr.toFixed(12);
  };

  const formatTransactionAmount = (amount: string) => {
    const xmr = Math.abs(parseFloat(amount)) / 1e12;
    return xmr.toFixed(12);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'send', label: 'Send', icon: Send },
    { id: 'receive', label: 'Receive', icon: Download },
    { id: 'history', label: 'History', icon: History },
    { id: 'mining', label: 'Mining', icon: Cpu },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-slate-900 rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <img src="/XMR logo.png" alt="XMR" className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold text-white">Monero Wallet</h2>
              <div className="flex items-center space-x-4 text-sm">
                <div className={`flex items-center space-x-1 ${nodeConnected ? 'text-emerald-400' : 'text-red-400'}`}>
                  {nodeConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                  <span>Node {nodeConnected ? 'Connected' : 'Disconnected'}</span>
                </div>
                <div className={`flex items-center space-x-1 ${walletConnected ? 'text-emerald-400' : 'text-red-400'}`}>
                  <Wallet className="w-4 h-4" />
                  <span>Wallet {walletConnected ? 'Connected' : 'Disconnected'}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <motion.button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </motion.button>
            <motion.button
              onClick={onClose}
              className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-white font-bold">×</span>
            </motion.button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center space-x-2 px-6 py-4 transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-orange-500 text-orange-400 bg-slate-800/50'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 h-full overflow-y-auto"
              >
                {/* Balance Card */}
                <div className="bg-gradient-to-r from-orange-600/20 to-orange-500/20 border border-orange-500/30 rounded-xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">Total Balance</h3>
                    <button
                      onClick={() => setShowBalances(!showBalances)}
                      className="p-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-colors"
                    >
                      {showBalances ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <div className="text-3xl font-bold text-orange-400 mb-2">
                    {showBalances ? formatBalance(selectedWallet?.balance || '0') : '••••••••'} XMR
                  </div>
                  <div className="text-slate-400 text-sm">
                    Unlocked: {showBalances ? formatBalance(selectedWallet?.unlocked_balance || '0') : '••••••••'} XMR
                  </div>
                </div>

                {/* Node Info */}
                {nodeInfo && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                        <Server className="w-5 h-5" />
                        <span>Node Status</span>
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Height:</span>
                          <span className="text-white">{nodeInfo.height.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Connections:</span>
                          <span className="text-white">{nodeInfo.outgoing_connections_count + nodeInfo.incoming_connections_count}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Network:</span>
                          <span className="text-white">{nodeInfo.nettype}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Version:</span>
                          <span className="text-white">{nodeInfo.version}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                        <Cpu className="w-5 h-5" />
                        <span>Mining Status</span>
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Status:</span>
                          <span className={`font-semibold ${isMining ? 'text-emerald-400' : 'text-slate-400'}`}>
                            {isMining ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        {miningStatus && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Speed:</span>
                              <span className="text-white">{miningStatus.speed} H/s</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Threads:</span>
                              <span className="text-white">{miningStatus.threads_count}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Recent Transactions */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-white mb-4">Recent Transactions</h4>
                  <div className="space-y-3">
                    {transactions.slice(0, 5).map((tx) => (
                      <div key={tx.txid} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${tx.type === 'in' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                          <div>
                            <div className="text-sm font-medium text-white">
                              {tx.type === 'in' ? 'Received' : 'Sent'}
                            </div>
                            <div className="text-xs text-slate-400">
                              {new Date(tx.timestamp * 1000).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-semibold ${tx.type === 'in' ? 'text-emerald-400' : 'text-red-400'}`}>
                            {tx.type === 'in' ? '+' : '-'}{formatTransactionAmount(tx.amount)} XMR
                          </div>
                          <div className="text-xs text-slate-400">
                            {tx.confirmations} confirmations
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'send' && (
              <motion.div
                key="send"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 h-full overflow-y-auto"
              >
                <div className="max-w-md mx-auto">
                  <h3 className="text-xl font-bold text-white mb-6">Send Monero</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Recipient Address
                      </label>
                      <input
                        type="text"
                        value={sendAddress}
                        onChange={(e) => setSendAddress(e.target.value)}
                        placeholder="Enter Monero address"
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-orange-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Amount (XMR)
                      </label>
                      <input
                        type="number"
                        step="0.000000000001"
                        value={sendAmount}
                        onChange={(e) => setSendAmount(e.target.value)}
                        placeholder="0.000000000000"
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-orange-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Note (Optional)
                      </label>
                      <textarea
                        value={sendNote}
                        onChange={(e) => setSendNote(e.target.value)}
                        placeholder="Add a note to this transaction"
                        rows={3}
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-orange-500 focus:outline-none resize-none"
                      />
                    </div>

                    <motion.button
                      onClick={handleSend}
                      disabled={!sendAmount || !sendAddress || !walletConnected}
                      className="w-full py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Send Transaction
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'receive' && (
              <motion.div
                key="receive"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 h-full overflow-y-auto"
              >
                <div className="max-w-md mx-auto text-center">
                  <h3 className="text-xl font-bold text-white mb-6">Receive Monero</h3>
                  
                  {walletAddress && (
                    <div className="space-y-6">
                      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                        <h4 className="text-lg font-semibold text-white mb-4">Your Address</h4>
                        
                        <div className="bg-white p-4 rounded-lg mb-4 flex justify-center">
                          {/* QR Code temporarily disabled */}
                          <div className="w-48 h-48 bg-gray-200 flex items-center justify-center text-gray-500">
                            QR Code Placeholder
                          </div>
                        </div>
                        
                        <div className="bg-slate-700/50 p-4 rounded-lg mb-4">
                          <p className="text-sm text-slate-300 break-all">{walletAddress}</p>
                        </div>
                        
                        <motion.button
                          onClick={() => copyToClipboard(walletAddress)}
                          className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center space-x-2"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Copy className="w-4 h-4" />
                          <span>Copy Address</span>
                        </motion.button>
                      </div>

                      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                        <h4 className="text-lg font-semibold text-white mb-4">Generate New Address</h4>
                        
                        <div className="space-y-4">
                          <input
                            type="text"
                            value={newAddressLabel}
                            onChange={(e) => setNewAddressLabel(e.target.value)}
                            placeholder="Address label (optional)"
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-orange-500 focus:outline-none"
                          />
                          
                          <motion.button
                            onClick={generateNewAddress}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center space-x-2"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Plus className="w-4 h-4" />
                            <span>Generate New Address</span>
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 h-full overflow-y-auto"
              >
                <h3 className="text-xl font-bold text-white mb-6">Transaction History</h3>
                
                <div className="space-y-3">
                  {transactions.map((tx) => (
                    <div key={tx.txid} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded-full ${tx.type === 'in' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                          <div>
                            <div className="font-semibold text-white">
                              {tx.type === 'in' ? 'Received' : tx.type === 'out' ? 'Sent' : 'Pool'}
                            </div>
                            <div className="text-sm text-slate-400">
                              {new Date(tx.timestamp * 1000).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-bold ${tx.type === 'in' ? 'text-emerald-400' : 'text-red-400'}`}>
                            {tx.type === 'in' ? '+' : '-'}{formatTransactionAmount(tx.amount)} XMR
                          </div>
                          {parseFloat(tx.fee) > 0 && (
                            <div className="text-sm text-slate-400">
                              Fee: {formatTransactionAmount(tx.fee)} XMR
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-slate-400">Confirmations:</span>
                          <span className="text-white ml-2">{tx.confirmations}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Height:</span>
                          <span className="text-white ml-2">{tx.height}</span>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-slate-700">
                        <div className="text-xs text-slate-400 break-all">
                          TXID: {tx.txid}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'mining' && (
              <motion.div
                key="mining"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 h-full overflow-y-auto"
              >
                <h3 className="text-xl font-bold text-white mb-6">Mining Control</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Mining Status */}
                  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                      <Activity className="w-5 h-5" />
                      <span>Mining Status</span>
                    </h4>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Status:</span>
                        <span className={`font-semibold ${isMining ? 'text-emerald-400' : 'text-slate-400'}`}>
                          {isMining ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      {miningStatus && (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Hash Rate:</span>
                            <span className="text-white">{miningStatus.speed} H/s</span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Threads:</span>
                            <span className="text-white">{miningStatus.threads_count}</span>
                          </div>
                        </>
                      )}
                      
                      <div className="flex space-x-3">
                        <motion.button
                          onClick={handleStartMining}
                          disabled={isMining || !nodeConnected || !walletAddress}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center space-x-2"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Play className="w-4 h-4" />
                          <span>Start Mining</span>
                        </motion.button>
                        
                        <motion.button
                          onClick={handleStopMining}
                          disabled={!isMining || !nodeConnected}
                          className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center space-x-2"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Square className="w-4 h-4" />
                          <span>Stop Mining</span>
                        </motion.button>
                      </div>
                    </div>
                  </div>

                  {/* Mining Configuration */}
                  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                      <Settings className="w-5 h-5" />
                      <span>Configuration</span>
                    </h4>
                    
                    <div className="space-y-6">
                      {/* Thread Control */}
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-3">
                          CPU Threads: {miningThreads}
                        </label>
                        <div className="flex items-center space-x-4">
                          <motion.button
                            onClick={() => handleMiningThreadsChange(Math.max(1, miningThreads - 1))}
                            disabled={miningThreads <= 1}
                            className="p-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:cursor-not-allowed rounded-lg transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Minus className="w-4 h-4" />
                          </motion.button>
                          
                          <div className="flex-1 bg-slate-700 rounded-lg h-2">
                            <div 
                              className="bg-orange-500 h-2 rounded-lg transition-all duration-300"
                              style={{ width: `${(miningThreads / maxThreads) * 100}%` }}
                            />
                          </div>
                          
                          <motion.button
                            onClick={() => handleMiningThreadsChange(Math.min(maxThreads, miningThreads + 1))}
                            disabled={miningThreads >= maxThreads}
                            className="p-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:cursor-not-allowed rounded-lg transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Plus className="w-4 h-4" />
                          </motion.button>
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          Max available: {maxThreads} cores
                        </div>
                      </div>

                      {/* Pool Configuration */}
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Mining Pool
                        </label>
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={miningPool.host}
                            onChange={(e) => setMiningPool({...miningPool, host: e.target.value})}
                            placeholder="Pool host"
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-orange-500 focus:outline-none text-sm"
                          />
                          <div className="flex space-x-2">
                            <input
                              type="number"
                              value={miningPool.port}
                              onChange={(e) => setMiningPool({...miningPool, port: parseInt(e.target.value)})}
                              placeholder="Port"
                              className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-orange-500 focus:outline-none text-sm"
                            />
                            <input
                              type="text"
                              value={miningPool.username}
                              onChange={(e) => setMiningPool({...miningPool, username: e.target.value})}
                              placeholder="Username (wallet address)"
                              className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-orange-500 focus:outline-none text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 h-full overflow-y-auto"
              >
                <h3 className="text-xl font-bold text-white mb-6">Settings</h3>
                
                <div className="max-w-2xl space-y-6">
                  {/* RPC Configuration */}
                  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-white mb-4">RPC Configuration</h4>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Node RPC URL
                        </label>
                        <input
                          type="text"
                          value={rpcConfig.nodeUrl}
                          onChange={(e) => setRpcConfig({...rpcConfig, nodeUrl: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-orange-500 focus:outline-none"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Wallet RPC URL
                        </label>
                        <input
                          type="text"
                          value={rpcConfig.walletUrl}
                          onChange={(e) => setRpcConfig({...rpcConfig, walletUrl: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-orange-500 focus:outline-none"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Node Username
                          </label>
                          <input
                            type="text"
                            value={rpcConfig.nodeUsername}
                            onChange={(e) => setRpcConfig({...rpcConfig, nodeUsername: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-orange-500 focus:outline-none"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Node Password
                          </label>
                          <input
                            type="password"
                            value={rpcConfig.nodePassword}
                            onChange={(e) => setRpcConfig({...rpcConfig, nodePassword: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-orange-500 focus:outline-none"
                          />
                        </div>
                      </div>
                      
                      <motion.button
                        onClick={() => {
                          moneroRpcService.updateConfig(rpcConfig);
                          checkConnections();
                        }}
                        className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Save Configuration
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default MoneroWallet;
