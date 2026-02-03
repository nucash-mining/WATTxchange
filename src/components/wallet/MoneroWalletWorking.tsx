import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Send, 
  Download, 
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
  History,
  Wallet,
  Cpu,
  Activity,
  CheckCircle,
  XCircle,
  ArrowRight
} from 'lucide-react';
import XMRWrappingInterface from './XMRWrappingInterface';

interface MoneroWalletWorkingProps {
  onClose: () => void;
}

type TabType = 'overview' | 'send' | 'receive' | 'history' | 'mining' | 'settings';

interface ConnectionStatus {
  node: boolean;
  wallet: boolean;
  error?: string;
}

interface WalletData {
  address: string;
  balance: string;
  unlocked_balance: string;
}

interface Transaction {
  txid: string;
  height: number;
  timestamp: number;
  amount: string;
  type: 'in' | 'out' | 'pool';
  confirmations: number;
}

export const MoneroWalletWorking: React.FC<MoneroWalletWorkingProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showBalances, setShowBalances] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Connection states
  const [connections, setConnections] = useState<ConnectionStatus>({ node: false, wallet: false });
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Wallet data
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [nodeInfo, setNodeInfo] = useState<any>(null);
  
  // Mining states
  const [isMining, setIsMining] = useState(false);
  const [miningThreads, setMiningThreads] = useState(4);
  const [maxThreads, setMaxThreads] = useState(navigator.hardwareConcurrency || 4);
  const [miningStatus, setMiningStatus] = useState<any>(null);
  const [isControllingMining, setIsControllingMining] = useState(false);
  const [backendServiceAvailable, setBackendServiceAvailable] = useState(false);
  const [miningStats, setMiningStats] = useState({
    hashrate: 0,
    shares: 0,
    uptime: 0,
    lastUpdate: null as Date | null,
    pool: false
  });
  const [miningPool, setMiningPool] = useState({
    host: 'pool.minexmr.com',
    port: 4444,
    username: '',
    password: 'x',
    ssl: false
  });
  const [miningMode, setMiningMode] = useState<'solo' | 'pool'>('solo');
  const [usePoolMining, setUsePoolMining] = useState(false);
  const [showXMRWrapping, setShowXMRWrapping] = useState(false);
  
  // UI states
  const [sendAmount, setSendAmount] = useState('');
  const [sendAddress, setSendAddress] = useState('');
  const [sendNote, setSendNote] = useState('');
  const [newAddressLabel, setNewAddressLabel] = useState('');
  
  // Settings
  const [rpcConfig, setRpcConfig] = useState({
    nodeUrl: 'http://127.0.0.1:18081',
    walletUrl: 'http://127.0.0.1:18083',
    nodeUsername: '',
    nodePassword: '',
    walletUsername: '',
    walletPassword: ''
  });

  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    // Auto-connect on mount if settings are saved
    const savedConfig = localStorage.getItem('monero-rpc-config');
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      setRpcConfig(config);
      connectToMonero(config);
    }

    // Check if backend service is available
    checkBackendService();

    // Set up periodic mining stats updates
    const statsInterval = setInterval(fetchMiningStats, 5000); // Update every 5 seconds

    return () => {
      clearInterval(statsInterval);
    };
  }, []);

  const getBackendUrl = () => {
    // If running on wattxchange.app domain, use the domain's backend
    if (window.location.hostname === 'wattxchange.app' || window.location.hostname === 'www.wattxchange.app') {
      return 'https://wattxchange.app:3001';
    }
    // Otherwise use localhost for development
    return 'http://localhost:3001';
  };

  const checkBackendService = async () => {
    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/health`);
      if (response.ok) {
        setBackendServiceAvailable(true);
        console.log('✅ Mining backend service is available at:', backendUrl);
        // Also fetch mining status when checking backend
        await fetchMiningStats();
      } else {
        setBackendServiceAvailable(false);
        console.log('❌ Mining backend service is not available at:', backendUrl);
      }
    } catch (error) {
      setBackendServiceAvailable(false);
      console.log('❌ Mining backend service is not running:', error);
    }
  };

  const fetchMiningStats = async () => {
    try {
      const backendUrl = getBackendUrl();
      // Try the detailed mining stats endpoint first
      let response = await fetch(`${backendUrl}/mining-stats`);
      if (!response.ok) {
        // Fallback to regular status endpoint
        response = await fetch(`${backendUrl}/status`);
      }
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
              setMiningStats(prev => ({
                ...prev,
                hashrate: data.data.hashrate || 0,
                shares: data.data.shares || 0,
                uptime: data.data.uptime || 0,
                lastUpdate: new Date(),
                pool: data.data.pool || false
              }));
          
          // Update mining status
          setIsMining(data.data.isActive || false);
        }
      }
    } catch (error) {
      console.error('Failed to fetch mining stats:', error);
    }
  };

  const makeRpcRequest = async (url: string, method: string, params: any = {}, useAuth: boolean = false) => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (useAuth && rpcConfig.nodeUsername && rpcConfig.nodePassword) {
        const auth = btoa(`${rpcConfig.nodeUsername}:${rpcConfig.nodePassword}`);
        headers['Authorization'] = `Basic ${auth}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: '0',
          method,
          params,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`RPC error: ${data.error.message}`);
      }

      return data.result;
    } catch (error) {
      console.error(`RPC request failed for ${method}:`, error);
      throw error;
    }
  };

  const testNodeConnection = async (config: typeof rpcConfig) => {
    try {
      const result = await makeRpcRequest(
        `${config.nodeUrl}/json_rpc`, 
        'get_info', 
        {}, 
        true
      );
      setNodeInfo(result);
      return true;
    } catch (error) {
      console.error('Node connection test failed:', error);
      return false;
    }
  };

  const testWalletConnection = async (config: typeof rpcConfig) => {
    try {
      const result = await makeRpcRequest(
        `${config.walletUrl}/json_rpc`, 
        'get_address', 
        {}, 
        false
      );
      return true;
    } catch (error) {
      console.error('Wallet connection test failed:', error);
      return false;
    }
  };

  const connectToMonero = async (config: typeof rpcConfig) => {
    setIsConnecting(true);
    setConnections({ node: false, wallet: false });
    
    try {
      // Test node connection
      const nodeConnected = await testNodeConnection(config);
      
      // Test wallet connection
      const walletConnected = await testWalletConnection(config);
      
      setConnections({ 
        node: nodeConnected, 
        wallet: walletConnected,
        error: !nodeConnected || !walletConnected ? 'Connection failed. Check your RPC settings.' : undefined
      });

      if (nodeConnected && walletConnected) {
        await loadWalletData(config);
        await loadMiningStatus(config);
      }
    } catch (error) {
      setConnections({ 
        node: false, 
        wallet: false, 
        error: 'Failed to connect to Monero RPC' 
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const loadWalletData = async (config: typeof rpcConfig) => {
    try {
      // Get wallet address
      const address = await makeRpcRequest(
        `${config.walletUrl}/json_rpc`, 
        'get_address'
      );

      // Get wallet balance
      const balance = await makeRpcRequest(
        `${config.walletUrl}/json_rpc`, 
        'get_balance'
      );

      setWalletData({
        address: address.address || 'No address',
        balance: balance.balance || '0',
        unlocked_balance: balance.unlocked_balance || '0'
      });

      // Load recent transactions
      await loadTransactions(config);
    } catch (error) {
      console.error('Failed to load wallet data:', error);
    }
  };

  const loadTransactions = async (config: typeof rpcConfig) => {
    try {
      const result = await makeRpcRequest(
        `${config.walletUrl}/json_rpc`, 
        'get_transfers',
        {
          in: true,
          out: true,
          pending: true,
          failed: false,
          pool: true
        }
      );

      const txs: Transaction[] = [];
      
      // Combine all transaction types
      [...(result.in || []), ...(result.out || []), ...(result.pool || [])].forEach((tx: any) => {
        txs.push({
          txid: tx.txid,
          height: tx.height || 0,
          timestamp: tx.timestamp,
          amount: tx.amount,
          type: tx.type || (parseFloat(tx.amount) > 0 ? 'in' : 'out'),
          confirmations: tx.confirmations || 0
        });
      });

      // Sort by timestamp (newest first)
      setTransactions(txs.sort((a, b) => b.timestamp - a.timestamp));
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  };

  const loadMiningStatus = async (config: typeof rpcConfig) => {
    try {
      const status = await makeRpcRequest(
        `${config.nodeUrl}/json_rpc`, 
        'mining_status',
        {},
        true
      );
      
      console.log('📊 Mining status loaded:', status);
      
      setMiningStatus(status);
      setIsMining(status.active || false);
      
      // Update threads if mining is active
      if (status.active && status.threads_count) {
        setMiningThreads(status.threads_count);
      }
      
      // Log mining details
      if (status.active) {
        console.log(`⛏️ Mining active: ${status.speed} H/s with ${status.threads_count} threads`);
      }
    } catch (error) {
      console.error('Failed to load mining status:', error);
      
      // Check if mining_status method is not supported
      if (error instanceof Error && error.message.includes('Method not found')) {
        console.log('Mining status method not supported by this daemon version');
        // Set default status for unsupported daemons
        setMiningStatus({
          active: false,
          speed: 0,
          threads_count: 0,
          mining_supported: false
        });
      }
    }
  };

      const checkMiningSupport = async () => {
        try {
          // Try to get mining status to check if mining is supported
          await makeRpcRequest(
            `${rpcConfig.nodeUrl}/json_rpc`,
            'mining_status',
            {},
            true
          );
          return true;
        } catch (error) {
          if (error instanceof Error && error.message.includes('Method not found')) {
            // Try alternative mining method
            try {
              await makeRpcRequest(
                `${rpcConfig.nodeUrl}/json_rpc`,
                'start_mining',
                { miner_address: 'test', threads_count: 1 },
                true
              );
              return true;
            } catch (altError) {
              if (altError instanceof Error && altError.message.includes('Method not found')) {
                return false;
              }
              throw altError;
            }
          }
          throw error;
        }
      };

  const handleStartMining = async () => {
    if (!connections.node || !walletData) {
      alert('Please connect to both node and wallet first');
      return;
    }

    setIsControllingMining(true);

    try {
      if (miningMode === 'pool') {
        console.log('🏊 Starting pool mining via xmrig...', {
          address: walletData.address,
          threads: miningThreads,
          pool: `${miningPool.host}:${miningPool.port}`
        });

        // Start pool mining with xmrig
        const backendUrl = getBackendUrl();
        const response = await fetch(`${backendUrl}/start-pool-mining`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            threads: miningThreads,
            address: walletData.address,
            poolHost: miningPool.host,
            poolPort: miningPool.port,
            poolUser: miningPool.username || walletData.address,
            poolPass: miningPool.password
          })
        });

        const result = await response.json();
        console.log('✅ Pool mining start result:', result);

        if (result.success) {
          setIsMining(true);
          alert(`✅ Pool mining started successfully with ${miningThreads} threads!`);
          
          // Refresh mining stats after a moment
          setTimeout(() => {
            fetchMiningStats();
          }, 3000);
        } else {
          alert(`❌ Failed to start pool mining: ${result.message}`);
        }
      } else {
        console.log('⛏️ Starting solo mining via daemon...', {
          address: walletData.address,
          threads: miningThreads
        });

        // Use backend service to start solo mining
        const backendUrl = getBackendUrl();
        const response = await fetch(`${backendUrl}/start-daemon`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mining: true,
            threads: miningThreads,
            address: walletData.address
          })
        });

        const result = await response.json();
        console.log('✅ Solo mining start result:', result);

        if (result.success) {
          setIsMining(true);
          alert(`✅ Solo mining started successfully with ${miningThreads} threads!`);
          
          // Refresh mining stats after a moment
          setTimeout(() => {
            fetchMiningStats();
          }, 3000);
        } else {
          alert(`❌ Failed to start solo mining: ${result.message}`);
        }
      }

    } catch (error) {
      console.error('Failed to start mining:', error);
      alert(`❌ Mining start error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsControllingMining(false);
    }
  };

  const handleStopMining = async () => {
    if (!connections.node) return;
    
    setIsControllingMining(true);

    try {
      console.log('🛑 Stopping Monero mining...');
      
      // Use backend service to stop mining
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/start-daemon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mining: false
        })
      });

      const result = await response.json();
      console.log('✅ Mining stop result:', result);
      
      if (result.success) {
        setIsMining(false);
        alert('✅ Mining stopped successfully!');
        
        // Refresh mining stats after a moment
        setTimeout(() => {
          fetchMiningStats();
        }, 3000);
      } else {
        alert(`❌ Failed to stop mining: ${result.message}`);
      }

    } catch (error) {
      console.error('Failed to stop mining:', error);
      alert(`❌ Mining stop error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsControllingMining(false);
    }
  };

  const handleSend = async () => {
    if (!connections.wallet || !sendAmount || !sendAddress) return;
    
    try {
      const destinations = [{
        address: sendAddress,
        amount: parseFloat(sendAmount) * 1e12 // Convert XMR to atomic units
      }];
      
      await makeRpcRequest(
        `${rpcConfig.walletUrl}/json_rpc`, 
        'transfer',
        {
          destinations,
          priority: 1,
          ring_size: 11,
          unlock_time: 0
        }
      );
      
      // Clear form
      setSendAmount('');
      setSendAddress('');
      setSendNote('');
      
      // Refresh data
      await loadWalletData(rpcConfig);
    } catch (error) {
      console.error('Failed to send transaction:', error);
    }
  };

  const handleRefresh = async () => {
    if (!connections.node && !connections.wallet) return;
    
    setIsRefreshing(true);
    try {
      if (connections.node) {
        await loadMiningStatus(rpcConfig);
      }
      if (connections.wallet) {
        await loadWalletData(rpcConfig);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const saveSettings = () => {
    localStorage.setItem('monero-rpc-config', JSON.stringify(rpcConfig));
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
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
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">X</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Monero Wallet</h2>
              <div className="flex items-center space-x-4 text-sm">
                <div className={`flex items-center space-x-1 ${connections.node ? 'text-emerald-400' : 'text-red-400'}`}>
                  {connections.node ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  <span>Node {connections.node ? 'Connected' : 'Disconnected'}</span>
                </div>
                <div className={`flex items-center space-x-1 ${connections.wallet ? 'text-emerald-400' : 'text-red-400'}`}>
                  {connections.wallet ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  <span>Wallet {connections.wallet ? 'Connected' : 'Disconnected'}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <motion.button
              onClick={handleRefresh}
              disabled={isRefreshing || isConnecting}
              className="p-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-600 rounded-lg transition-colors"
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

        {/* Connection Error */}
        {connections.error && (
          <div className="bg-red-600/20 border border-red-500/30 p-4 mx-6 mt-4 rounded-lg">
            <p className="text-red-400 text-sm">{connections.error}</p>
          </div>
        )}

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
          {activeTab === 'overview' && (
            <div className="p-6 h-full overflow-y-auto">
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
                  {showBalances ? formatBalance(walletData?.balance || '0') : '••••••••'} XMR
                </div>
                <div className="text-slate-400 text-sm">
                  Unlocked: {showBalances ? formatBalance(walletData?.unlocked_balance || '0') : '••••••••'} XMR
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
                        <span className="text-white">{nodeInfo.height?.toLocaleString() || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Connections:</span>
                        <span className="text-white">
                          {(nodeInfo.outgoing_connections_count || 0) + (nodeInfo.incoming_connections_count || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Network:</span>
                        <span className="text-white">{nodeInfo.nettype || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Version:</span>
                        <span className="text-white">{nodeInfo.version || 'N/A'}</span>
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
                            <span className="text-white">{miningStatus.speed || 0} H/s</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Threads:</span>
                            <span className="text-white">{miningStatus.threads_count || 0}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Transactions */}
              {transactions.length > 0 && (
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
              )}

              {/* XMR Wrapping Section */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                  <ArrowRight className="w-5 h-5" />
                  <span>XMR Wrapping</span>
                </h4>
                <p className="text-slate-400 text-sm mb-4">
                  Wrap your XMR to wXMR tokens on Altcoinchain for DeFi activities
                </p>
                <motion.button
                  onClick={() => setShowXMRWrapping(true)}
                  className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center space-x-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>Wrap XMR to wXMR</span>
                </motion.button>
                <div className="mt-3 text-xs text-slate-500">
                  • Unique deposit address for each wrap<br/>
                  • 30-minute deposit window<br/>
                  • 1:1 ratio (1 XMR = 1 wXMR)
                </div>
              </div>
            </div>
          )}

          {activeTab === 'send' && (
            <div className="p-6 h-full overflow-y-auto">
              <div className="max-w-md mx-auto">
                <h3 className="text-xl font-bold text-white mb-6">Send Monero</h3>
                
                {!connections.wallet ? (
                  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                    <p className="text-slate-400 text-center">
                      Connect to Monero wallet RPC to enable sending
                    </p>
                  </div>
                ) : (
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
                      disabled={!sendAmount || !sendAddress}
                      className="w-full py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Send Transaction
                    </motion.button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'receive' && (
            <div className="p-6 h-full overflow-y-auto">
              <div className="max-w-md mx-auto text-center">
                <h3 className="text-xl font-bold text-white mb-6">Receive Monero</h3>
                
                {!connections.wallet ? (
                  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                    <p className="text-slate-400 text-center">
                      Connect to Monero wallet RPC to generate addresses
                    </p>
                  </div>
                ) : walletData ? (
                  <div className="space-y-6">
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-white mb-4">Your Address</h4>
                      
                      <div className="bg-white p-4 rounded-lg mb-4 flex justify-center">
                        <div className="w-48 h-48 bg-gray-200 flex items-center justify-center text-gray-500">
                          QR Code Placeholder
                        </div>
                      </div>
                      
                      <div className="bg-slate-700/50 p-4 rounded-lg mb-4">
                        <p className="text-sm text-slate-300 break-all">{walletData.address}</p>
                      </div>
                      
                      <motion.button
                        onClick={() => copyToClipboard(walletData.address)}
                        className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center space-x-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Copy className="w-4 h-4" />
                        <span>Copy Address</span>
                      </motion.button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                    <p className="text-slate-400 text-center">
                      Loading wallet data...
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="p-6 h-full overflow-y-auto">
              <h3 className="text-xl font-bold text-white mb-6">Transaction History</h3>
              
              {!connections.wallet ? (
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                  <p className="text-slate-400 text-center">
                    Connect to Monero wallet RPC to view transaction history
                  </p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                  <p className="text-slate-400 text-center">
                    No transactions found
                  </p>
                </div>
              ) : (
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
                          <div className="text-sm text-slate-400">
                            {tx.confirmations} confirmations
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-xs text-slate-400 break-all">
                        TXID: {tx.txid}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'mining' && (
            <div className="p-6 h-full overflow-y-auto">
              <h3 className="text-xl font-bold text-white mb-6">Mining Control</h3>
              
              {!connections.node ? (
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                  <p className="text-slate-400 text-center">
                    Connect to Monero node RPC to control mining
                  </p>
                </div>
              ) : !backendServiceAvailable ? (
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                  <div className="text-center">
                    <div className="text-orange-400 text-4xl mb-4">⚠️</div>
                    <h4 className="text-lg font-semibold text-orange-400 mb-2">Backend Service Required</h4>
                    <p className="text-orange-200 mb-4">
                      The mining control backend service is not running.
                    </p>
                    <div className="bg-orange-900/20 border border-orange-600/30 rounded-lg p-4 text-left">
                      <h5 className="font-semibold text-orange-400 mb-2">🚀 To Enable Mining Control:</h5>
                      <ol className="text-sm text-orange-200 space-y-1 list-decimal list-inside">
                        <li>Open terminal in WATTxchange directory</li>
                        <li>Run: <code className="bg-orange-800 px-1 rounded">./start-mining-backend.sh</code></li>
                        <li>Refresh this page</li>
                      </ol>
                      <div className="mt-3 p-2 bg-slate-800 rounded text-xs">
                        <p><strong>Alternative:</strong> Use external mining software (xmrig) with the commands shown below.</p>
                      </div>
                      <motion.button
                        onClick={checkBackendService}
                        className="mt-3 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        🔄 Check Backend Service
                      </motion.button>
                    </div>
                  </div>
                </div>
              ) : miningStatus?.mining_supported === false ? (
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                  <div className="text-center">
                    <div className="text-green-400 text-4xl mb-4">⛏️</div>
                    <h4 className="text-lg font-semibold text-green-400 mb-2">✅ Mining Control Ready!</h4>
                    <p className="text-green-200 mb-4">
                      Backend service is running. You can now control mining!
                    </p>
                    <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-4 text-left">
                      <h5 className="font-semibold text-green-400 mb-3">⛏️ Mining Control Panel</h5>
                      
                      {/* Mining Mode Selection */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Mining Mode
                        </label>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setMiningMode('solo')}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                              miningMode === 'solo'
                                ? 'bg-orange-600 text-white'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}
                            disabled={isControllingMining}
                          >
                            ⛏️ Solo Mining
                          </button>
                          <button
                            onClick={() => setMiningMode('pool')}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                              miningMode === 'pool'
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}
                            disabled={isControllingMining}
                          >
                            🏊 Pool Mining
                          </button>
                        </div>
                        <div className="mt-2 text-xs text-slate-400">
                          {miningMode === 'solo' ? (
                            <span>⛏️ Solo mining: Mine directly to your wallet (estimated hashrate)</span>
                          ) : (
                            <span>🏊 Pool mining: Mine to a pool for real-time hashrate like Monero GUI</span>
                          )}
                        </div>
                      </div>

                      {/* Core Selection */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          CPU Cores: {miningThreads} / {maxThreads}
                        </label>
                        <input
                          type="range"
                          min="1"
                          max={maxThreads}
                          value={miningThreads}
                          onChange={(e) => setMiningThreads(parseInt(e.target.value))}
                          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                          disabled={isControllingMining}
                        />
                        <div className="flex justify-between text-xs text-slate-400 mt-1">
                          <span>1</span>
                          <span>{maxThreads}</span>
                        </div>
                      </div>

                      {/* Pool Configuration (only show for pool mining) */}
                      {miningMode === 'pool' && (
                        <div className="mb-4 p-3 bg-blue-900/20 border border-blue-600/30 rounded-lg">
                          <h6 className="font-semibold text-blue-400 mb-2">🏊 Pool Configuration</h6>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs text-slate-300 mb-1">Pool Host</label>
                              <input
                                type="text"
                                value={miningPool.host}
                                onChange={(e) => setMiningPool(prev => ({ ...prev, host: e.target.value }))}
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-sm text-white"
                                placeholder="pool.minexmr.com"
                                disabled={isControllingMining}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs text-slate-300 mb-1">Port</label>
                                <input
                                  type="number"
                                  value={miningPool.port}
                                  onChange={(e) => setMiningPool(prev => ({ ...prev, port: parseInt(e.target.value) }))}
                                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-sm text-white"
                                  placeholder="4444"
                                  disabled={isControllingMining}
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-slate-300 mb-1">Username (optional)</label>
                                <input
                                  type="text"
                                  value={miningPool.username}
                                  onChange={(e) => setMiningPool(prev => ({ ...prev, username: e.target.value }))}
                                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-sm text-white"
                                  placeholder="Auto: wallet address"
                                  disabled={isControllingMining}
                                />
                              </div>
                            </div>
                            <div className="text-xs text-blue-300">
                              💡 Leave username empty to use your wallet address automatically
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Mining Controls */}
                      <div className="flex gap-3 mb-4">
                        <motion.button
                          onClick={handleStartMining}
                          disabled={isControllingMining || !connections.node || !walletData}
                          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                            isControllingMining || !connections.node || !walletData
                              ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                              : 'bg-green-600 hover:bg-green-700 text-white'
                          }`}
                          whileHover={{ scale: isControllingMining ? 1 : 1.02 }}
                          whileTap={{ scale: isControllingMining ? 1 : 0.98 }}
                        >
                          {isControllingMining ? 'Starting...' : '⛏️ Start Mining'}
                        </motion.button>
                        
                        <motion.button
                          onClick={handleStopMining}
                          disabled={isControllingMining || !connections.node}
                          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                            isControllingMining || !connections.node
                              ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                              : 'bg-red-600 hover:bg-red-700 text-white'
                          }`}
                          whileHover={{ scale: isControllingMining ? 1 : 1.02 }}
                          whileTap={{ scale: isControllingMining ? 1 : 0.98 }}
                        >
                          {isControllingMining ? 'Stopping...' : '🛑 Stop Mining'}
                        </motion.button>
                      </div>

                      {/* Mining Stats */}
                      {isMining && (
                        <div className="mb-4 p-3 bg-green-900/20 border border-green-600/30 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h6 className="font-semibold text-green-400">📊 Mining Statistics</h6>
                            <div className="flex items-center space-x-2">
                              {miningStats.pool ? (
                                <span className="px-2 py-1 bg-blue-600/20 text-blue-300 text-xs rounded border border-blue-500/30">
                                  🏊 Pool Mining
                                </span>
                              ) : (
                                <span className="px-2 py-1 bg-orange-600/20 text-orange-300 text-xs rounded border border-orange-500/30">
                                  ⛏️ Solo Mining
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-slate-400">Hashrate:</span>
                              <span className="text-green-300 ml-1">
                                {miningStats.hashrate > 0 ? `${miningStats.hashrate.toFixed(2)} H/s` : 'Calculating...'}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400">Threads:</span>
                              <span className="text-green-300 ml-1">{miningThreads}</span>
                            </div>
                            <div>
                              <span className="text-slate-400">Shares:</span>
                              <span className="text-green-300 ml-1">{miningStats.shares}</span>
                            </div>
                            <div>
                              <span className="text-slate-400">Uptime:</span>
                              <span className="text-green-300 ml-1">
                                {miningStats.uptime > 0 ? `${Math.floor(miningStats.uptime / 60)}m` : '0m'}
                              </span>
                            </div>
                          </div>
                          {miningStats.pool && (
                            <div className="mt-2 p-2 bg-blue-900/20 border border-blue-600/30 rounded text-xs">
                              <span className="text-blue-300">💡 Pool mining provides real-time hashrate data like your Monero GUI wallet</span>
                            </div>
                          )}
                          {!miningStats.pool && (
                            <div className="mt-2 p-2 bg-orange-900/20 border border-orange-600/30 rounded text-xs">
                              <span className="text-orange-300">⚠️ Solo mining shows estimated hashrate. For real-time data like Monero GUI, use pool mining with xmrig</span>
                            </div>
                          )}
                          {miningStats.lastUpdate && (
                            <div className="text-xs text-slate-500 mt-2">
                              Last update: {miningStats.lastUpdate.toLocaleTimeString()}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Status Info */}
                      <div className="text-xs text-slate-300 bg-slate-800/50 p-3 rounded">
                        <p><strong>Current Status:</strong> {isMining ? 'Mining Active' : 'Mining Stopped'}</p>
                        <p><strong>Wallet Address:</strong> {walletData?.address ? walletData.address.substring(0, 20) + '...' : 'Not connected'}</p>
                        <p><strong>Backend Service:</strong> ✅ Running</p>
                      </div>
                      
                      {/* Refresh Button */}
                      <motion.button
                        onClick={checkBackendService}
                        className="mt-3 w-full px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors text-sm"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        🔄 Refresh Status
                      </motion.button>
                    </div>
                    <motion.button
                      onClick={() => checkMiningSupport().then(supported => {
                        if (supported) {
                          alert('✅ Mining is now supported! Please refresh the page.');
                        } else {
                          alert('❌ Mining is still not supported by this daemon.');
                        }
                      })}
                      className="mt-4 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Check Again
                    </motion.button>
                  </div>
                </div>
              ) : (
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
                            <span className="text-white">{miningStatus.speed || 0} H/s</span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Threads:</span>
                            <span className="text-white">{miningStatus.threads_count || 0}</span>
                          </div>
                        </>
                      )}
                      
                      <div className="flex space-x-3">
                        <motion.button
                          onClick={handleStartMining}
                          disabled={isMining || !walletData}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center space-x-2"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Play className="w-4 h-4" />
                          <span>Start Mining</span>
                        </motion.button>
                        
                        <motion.button
                          onClick={handleStopMining}
                          disabled={!isMining}
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
                            onClick={() => setMiningThreads(Math.max(1, miningThreads - 1))}
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
                            onClick={() => setMiningThreads(Math.min(maxThreads, miningThreads + 1))}
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

                      {/* Mining Mode */}
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-3">
                          Mining Mode
                        </label>
                        <div className="space-y-3">
                          <label className="flex items-center space-x-3">
                            <input
                              type="radio"
                              checked={!usePoolMining}
                              onChange={() => setUsePoolMining(false)}
                              className="w-4 h-4 text-orange-500 bg-slate-700 border-slate-600 focus:ring-orange-500"
                            />
                            <span className="text-sm text-slate-300">Solo Mining (Direct to your wallet)</span>
                          </label>
                          <label className="flex items-center space-x-3">
                            <input
                              type="radio"
                              checked={usePoolMining}
                              onChange={() => setUsePoolMining(true)}
                              className="w-4 h-4 text-orange-500 bg-slate-700 border-slate-600 focus:ring-orange-500"
                            />
                            <span className="text-sm text-slate-300">Pool Mining (Configured pool)</span>
                          </label>
                        </div>
                      </div>

                      {/* Pool Configuration */}
                      {usePoolMining && (
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Mining Pool Configuration
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
                            <div className="text-xs text-orange-400 bg-orange-500/10 p-2 rounded">
                              💡 Pool mining requires external software like xmrig. Configure xmrig to connect to this pool.
                            </div>
                            
                            {/* xmrig Configuration Commands */}
                            <div className="mt-4 p-3 bg-slate-700/50 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="text-sm font-medium text-white">🔧 xmrig Command:</h5>
                                <motion.button
                                  onClick={() => {
                                    const command = usePoolMining ? 
                                      `xmrig -o ${miningPool.host}:${miningPool.port} -u ${miningPool.username || walletData?.address} -p ${miningPool.password} -t ${miningThreads}` :
                                      `xmrig -o pool.supportxmr.com:443 -u ${walletData?.address} -p x -t ${miningThreads} --tls`;
                                    copyToClipboard(command);
                                    alert('Command copied to clipboard!');
                                  }}
                                  className="px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white text-xs rounded transition-colors"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  Copy
                                </motion.button>
                              </div>
                              <div className="text-xs text-slate-300 font-mono bg-slate-800 p-2 rounded break-all">
                                {usePoolMining ? (
                                  `xmrig -o ${miningPool.host}:${miningPool.port} -u ${miningPool.username || walletData?.address} -p ${miningPool.password} -t ${miningThreads}`
                                ) : (
                                  `xmrig -o pool.supportxmr.com:443 -u ${walletData?.address} -p x -t ${miningThreads} --tls`
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="p-6 h-full overflow-y-auto">
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
                        placeholder="http://127.0.0.1:18081"
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
                        placeholder="http://127.0.0.1:18083"
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
                          placeholder="Optional"
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
                          placeholder="Optional"
                          className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-orange-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    
                    <div className="flex space-x-3">
                      <motion.button
                        onClick={saveSettings}
                        className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Save Configuration
                      </motion.button>
                      
                      <motion.button
                        onClick={() => connectToMonero(rpcConfig)}
                        disabled={isConnecting}
                        className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {isConnecting ? 'Connecting...' : 'Test Connection'}
                      </motion.button>
                    </div>
                    
                    {settingsSaved && (
                      <div className="bg-emerald-600/20 border border-emerald-500/30 p-3 rounded-lg">
                        <p className="text-emerald-400 text-sm">Settings saved successfully!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* XMR Wrapping Interface */}
      {showXMRWrapping && (
        <XMRWrappingInterface onClose={() => setShowXMRWrapping(false)} />
      )}
    </div>
  );
};

export default MoneroWalletWorking;
