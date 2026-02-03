import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  ArrowLeft, 
  Zap, 
  Shield, 
  Clock, 
  DollarSign, 
  Network, 
  CheckCircle, 
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Info
} from 'lucide-react';
import { useWallet } from '../../hooks/useWallet';
import { sonicService } from '../../services/sonicService';
import toast from 'react-hot-toast';

interface BridgeTransaction {
  id: string;
  fromChain: string;
  toChain: string;
  token: string;
  amount: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  txHash: string;
  timestamp: number;
  estimatedTime: number;
}

interface SupportedToken {
  symbol: string;
  name: string;
  icon: string;
  chains: string[];
  minAmount: string;
  fee: string;
}

const SonicBridgeInterface: React.FC = () => {
  const { isConnected, address, chainId } = useWallet();
  const [activeTab, setActiveTab] = useState<'bridge' | 'history' | 'status'>('bridge');
  const [fromChain, setFromChain] = useState('altcoinchain');
  const [toChain, setToChain] = useState('sonic');
  const [selectedToken, setSelectedToken] = useState<SupportedToken | null>(null);
  const [amount, setAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [transactions, setTransactions] = useState<BridgeTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [estimatedFee, setEstimatedFee] = useState('0');
  const [estimatedTime, setEstimatedTime] = useState('2-5 minutes');

  const supportedChains = [
    { id: 'altcoinchain', name: 'Altcoinchain', icon: '🔗', isTestnet: false },
    { id: 'sonic', name: 'Sonic', icon: '⚡', isTestnet: false },
    { id: 'polygon', name: 'Polygon', icon: '💜', isTestnet: false },
    { id: 'ethereum', name: 'Ethereum', icon: '🔷', isTestnet: false },
    { id: 'arbitrum', name: 'Arbitrum', icon: '🔵', isTestnet: false },
    { id: 'optimism', name: 'Optimism', icon: '🔴', isTestnet: false }
  ];

  const supportedTokens: SupportedToken[] = [
    {
      symbol: 'WATT',
      name: 'WATT Token',
      icon: '⚡',
      chains: ['altcoinchain', 'sonic', 'polygon'],
      minAmount: '10',
      fee: '0.1%'
    },
    {
      symbol: 'ALT',
      name: 'Altcoinchain',
      icon: '🔗',
      chains: ['altcoinchain', 'sonic'],
      minAmount: '1',
      fee: '0.05%'
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      icon: '💵',
      chains: ['altcoinchain', 'sonic', 'polygon', 'ethereum', 'arbitrum', 'optimism'],
      minAmount: '5',
      fee: '0.1%'
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      icon: '🔷',
      chains: ['ethereum', 'sonic', 'arbitrum', 'optimism'],
      minAmount: '0.01',
      fee: '0.15%'
    }
  ];

  // Mock transaction history
  useEffect(() => {
    const mockTransactions: BridgeTransaction[] = [
      {
        id: '1',
        fromChain: 'altcoinchain',
        toChain: 'sonic',
        token: 'WATT',
        amount: '1000',
        status: 'completed',
        txHash: '0x1234...5678',
        timestamp: Date.now() - 3600000,
        estimatedTime: 300000
      },
      {
        id: '2',
        fromChain: 'sonic',
        toChain: 'polygon',
        token: 'USDC',
        amount: '500',
        status: 'processing',
        txHash: '0xabcd...efgh',
        timestamp: Date.now() - 1800000,
        estimatedTime: 180000
      }
    ];
    setTransactions(mockTransactions);
  }, []);

  const handleBridge = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!selectedToken || !amount || !recipientAddress) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (parseFloat(amount) < parseFloat(selectedToken.minAmount)) {
      toast.error(`Minimum amount is ${selectedToken.minAmount} ${selectedToken.symbol}`);
      return;
    }

    setIsLoading(true);
    try {
      // Simulate bridge transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newTransaction: BridgeTransaction = {
        id: Date.now().toString(),
        fromChain,
        toChain,
        token: selectedToken.symbol,
        amount,
        status: 'processing',
        txHash: `0x${Math.random().toString(16).substr(2, 8)}...${Math.random().toString(16).substr(2, 8)}`,
        timestamp: Date.now(),
        estimatedTime: 300000
      };

      setTransactions(prev => [newTransaction, ...prev]);
      toast.success('Bridge transaction initiated!');
      
      // Reset form
      setAmount('');
      setRecipientAddress('');
    } catch (error) {
      toast.error('Failed to initiate bridge transaction');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateFee = () => {
    if (!selectedToken || !amount) return '0';
    const feeRate = parseFloat(selectedToken.fee.replace('%', '')) / 100;
    return (parseFloat(amount) * feeRate).toFixed(4);
  };

  const calculateReceived = () => {
    if (!amount) return '0';
    const fee = parseFloat(calculateFee());
    return (parseFloat(amount) - fee).toFixed(4);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'processing': return 'text-yellow-400';
      case 'pending': return 'text-blue-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'processing': return RefreshCw;
      case 'pending': return Clock;
      case 'failed': return AlertTriangle;
      default: return Clock;
    }
  };

  const tabs = [
    { id: 'bridge', label: 'Bridge', icon: ArrowRight },
    { id: 'history', label: 'History', icon: Clock },
    { id: 'status', label: 'Status', icon: Network }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600/10 to-blue-600/10 border border-purple-500/30 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-purple-400">Sonic Bridge</h2>
            <p className="text-gray-400 mt-1">Cross-chain asset transfers powered by Sonic Labs</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-400">Total Volume</p>
              <p className="text-lg font-semibold">$2.4M</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Active Bridges</p>
              <p className="text-lg font-semibold text-green-400">6</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-900/50 rounded-lg p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Bridge Interface */}
      {activeTab === 'bridge' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bridge Form */}
          <div className="space-y-6">
            <div className="bg-gray-900/30 backdrop-blur-xl rounded-xl p-6 border border-gray-800">
              <h3 className="text-lg font-semibold mb-4">Bridge Assets</h3>
              
              {/* From Chain */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">From Chain</label>
                <select
                  value={fromChain}
                  onChange={(e) => setFromChain(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500"
                >
                  {supportedChains.map((chain) => (
                    <option key={chain.id} value={chain.id}>
                      {chain.icon} {chain.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* To Chain */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">To Chain</label>
                <select
                  value={toChain}
                  onChange={(e) => setToChain(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500"
                >
                  {supportedChains.filter(chain => chain.id !== fromChain).map((chain) => (
                    <option key={chain.id} value={chain.id}>
                      {chain.icon} {chain.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Token Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Token</label>
                <div className="grid grid-cols-2 gap-2">
                  {supportedTokens
                    .filter(token => token.chains.includes(fromChain) && token.chains.includes(toChain))
                    .map((token) => (
                      <button
                        key={token.symbol}
                        onClick={() => setSelectedToken(token)}
                        className={`p-3 rounded-lg border transition-all ${
                          selectedToken?.symbol === token.symbol
                            ? 'border-purple-500 bg-purple-600/10'
                            : 'border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-1">{token.icon}</div>
                          <div className="font-semibold">{token.symbol}</div>
                          <div className="text-xs text-gray-400">Min: {token.minAmount}</div>
                        </div>
                      </button>
                    ))}
                </div>
              </div>

              {/* Amount */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Amount</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500"
                />
                {selectedToken && (
                  <p className="text-sm text-gray-400 mt-1">
                    Balance: 1,000 {selectedToken.symbol}
                  </p>
                )}
              </div>

              {/* Recipient Address */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Recipient Address</label>
                <input
                  type="text"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500"
                />
                <p className="text-sm text-gray-400 mt-1">
                  Leave empty to use your connected wallet address
                </p>
              </div>

              {/* Bridge Button */}
              <motion.button
                onClick={handleBridge}
                disabled={isLoading || !isConnected || !selectedToken || !amount}
                className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                  isLoading || !isConnected || !selectedToken || !amount
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
              >
                {isLoading ? 'Processing...' : 'Bridge Assets'}
              </motion.button>
            </div>
          </div>

          {/* Bridge Summary */}
          <div className="space-y-6">
            {/* Transaction Summary */}
            {selectedToken && amount && (
              <div className="bg-gray-900/30 backdrop-blur-xl rounded-xl p-6 border border-gray-800">
                <h3 className="text-lg font-semibold mb-4">Transaction Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">From:</span>
                    <span>{supportedChains.find(c => c.id === fromChain)?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">To:</span>
                    <span>{supportedChains.find(c => c.id === toChain)?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Amount:</span>
                    <span>{amount} {selectedToken.symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Bridge Fee:</span>
                    <span>{calculateFee()} {selectedToken.symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">You'll Receive:</span>
                    <span className="text-green-400">{calculateReceived()} {selectedToken.symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Estimated Time:</span>
                    <span>{estimatedTime}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Bridge Info */}
            <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/30 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 text-blue-400">Bridge Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-green-400" />
                  <span>Secured by Sonic Labs technology</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span>Fast cross-chain transfers</span>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-blue-400" />
                  <span>Competitive bridge fees</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Network className="w-4 h-4 text-purple-400" />
                  <span>Multi-chain support</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction History */}
      {activeTab === 'history' && (
        <div className="bg-gray-900/30 backdrop-blur-xl rounded-xl p-6 border border-gray-800">
          <h3 className="text-lg font-semibold mb-4">Transaction History</h3>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No bridge transactions yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((tx) => {
                const StatusIcon = getStatusIcon(tx.status);
                return (
                  <div key={tx.id} className="bg-gray-800/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <StatusIcon className={`w-5 h-5 ${getStatusColor(tx.status)}`} />
                        <span className="font-semibold">
                          {tx.amount} {tx.token}
                        </span>
                      </div>
                      <span className={`text-sm ${getStatusColor(tx.status)}`}>
                        {tx.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <span>
                        {supportedChains.find(c => c.id === tx.fromChain)?.name} → {supportedChains.find(c => c.id === tx.toChain)?.name}
                      </span>
                      <span>{new Date(tx.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="mt-2 text-sm text-gray-400">
                      <span>Tx Hash: </span>
                      <span className="font-mono">{tx.txHash}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Bridge Status */}
      {activeTab === 'status' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Network Status */}
          <div className="bg-gray-900/30 backdrop-blur-xl rounded-xl p-6 border border-gray-800">
            <h3 className="text-lg font-semibold mb-4">Network Status</h3>
            <div className="space-y-3">
              {supportedChains.map((chain) => (
                <div key={chain.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">{chain.icon}</span>
                    <span>{chain.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-sm text-green-400">Online</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bridge Statistics */}
          <div className="bg-gray-900/30 backdrop-blur-xl rounded-xl p-6 border border-gray-800">
            <h3 className="text-lg font-semibold mb-4">Bridge Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Volume:</span>
                <span>$2,450,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Transactions:</span>
                <span>1,247</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Success Rate:</span>
                <span className="text-green-400">99.8%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Average Time:</span>
                <span>3.2 minutes</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SonicBridgeInterface;
