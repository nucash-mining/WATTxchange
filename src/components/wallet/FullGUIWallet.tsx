import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet, 
  Send, 
  Receive, 
  History, 
  Settings, 
  Eye, 
  EyeOff,
  Copy,
  QrCode,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Shield,
  Key,
  Download,
  Upload,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Zap
} from 'lucide-react';
import toast from 'react-hot-toast';

interface WalletData {
  symbol: string;
  name: string;
  balance: string;
  address: string;
  privateKey?: string;
  icon: string;
  color: string;
  network: string;
  blockHeight: number;
  connections: number;
  syncStatus: 'synced' | 'syncing' | 'disconnected';
}

interface FullGUIWalletProps {
  selectedWallet: WalletData;
  onClose: () => void;
}

const FullGUIWallet: React.FC<FullGUIWalletProps> = ({ selectedWallet, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'send' | 'receive' | 'history' | 'settings'>('overview');
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [showBalances, setShowBalances] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [sendAmount, setSendAmount] = useState('');
  const [sendAddress, setSendAddress] = useState('');
  const [sendFee, setSendFee] = useState('0.0001');
  const [isSending, setIsSending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mock transaction data
  useEffect(() => {
    setTransactions([
      {
        id: '1',
        type: 'received',
        amount: '0.5',
        address: '3QJmV3qfvL9SuYo34YihAf3sRCW3qSinyC',
        confirmations: 6,
        timestamp: new Date(Date.now() - 3600000),
        txid: 'abc123...def456'
      },
      {
        id: '2',
        type: 'sent',
        amount: '0.1',
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        confirmations: 12,
        timestamp: new Date(Date.now() - 7200000),
        txid: 'def456...ghi789'
      }
    ]);
  }, []);

  const getWalletStyle = () => {
    const styles = {
      bitcoin: {
        primary: '#f7931a',
        secondary: '#ffb84d',
        background: 'linear-gradient(135deg, #f7931a 0%, #ffb84d 100%)',
        cardBg: 'rgba(247, 147, 26, 0.1)',
        border: '#f7931a'
      },
      ethereum: {
        primary: '#627eea',
        secondary: '#8fa4ff',
        background: 'linear-gradient(135deg, #627eea 0%, #8fa4ff 100%)',
        cardBg: 'rgba(98, 126, 234, 0.1)',
        border: '#627eea'
      },
      monero: {
        primary: '#ff6600',
        secondary: '#ff8533',
        background: 'linear-gradient(135deg, #ff6600 0%, #ff8533 100%)',
        cardBg: 'rgba(255, 102, 0, 0.1)',
        border: '#ff6600'
      },
      litecoin: {
        primary: '#bfbbbb',
        secondary: '#d4d1d1',
        background: 'linear-gradient(135deg, #bfbbbb 0%, #d4d1d1 100%)',
        cardBg: 'rgba(191, 187, 187, 0.1)',
        border: '#bfbbbb'
      },
      default: {
        primary: '#3b82f6',
        secondary: '#60a5fa',
        background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
        cardBg: 'rgba(59, 130, 246, 0.1)',
        border: '#3b82f6'
      }
    };

    const walletType = selectedWallet.symbol.toLowerCase();
    return styles[walletType as keyof typeof styles] || styles.default;
  };

  const walletStyle = getWalletStyle();

  const handleSend = async () => {
    if (!sendAmount || !sendAddress) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSending(true);
    // Simulate sending
    setTimeout(() => {
      toast.success(`Sent ${sendAmount} ${selectedWallet.symbol} to ${sendAddress.slice(0, 10)}...`);
      setSendAmount('');
      setSendAddress('');
      setIsSending(false);
    }, 2000);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('Balance refreshed');
    }, 1000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-gray-900 rounded-2xl w-full max-w-4xl h-[90vh] overflow-hidden border border-gray-700"
      >
        {/* Header */}
        <div 
          className="p-6 text-white"
          style={{ background: walletStyle.background }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img src={selectedWallet.icon} alt={selectedWallet.symbol} className="w-12 h-12 rounded-full" />
              <div>
                <h2 className="text-2xl font-bold">{selectedWallet.name} Wallet</h2>
                <p className="text-white/80">Full GUI Interface</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-gray-800 border-b border-gray-700">
          {[
            { id: 'overview', label: 'Overview', icon: Wallet },
            { id: 'send', label: 'Send', icon: Send },
            { id: 'receive', label: 'Receive', icon: Receive },
            { id: 'history', label: 'History', icon: History },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center space-x-2 py-4 px-6 transition-colors ${
                activeTab === tab.id
                  ? 'bg-gray-700 text-white border-b-2'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
              style={activeTab === tab.id ? { borderBottomColor: walletStyle.primary } : {}}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Balance Card */}
              <div 
                className="rounded-xl p-6 text-white"
                style={{ background: walletStyle.cardBg, border: `1px solid ${walletStyle.border}` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Balance</h3>
                  <button
                    onClick={() => setShowBalances(!showBalances)}
                    className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                  >
                    {showBalances ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <div className="text-3xl font-bold mb-2">
                  {showBalances ? `${selectedWallet.balance} ${selectedWallet.symbol}` : '••••••'}
                </div>
                <div className="text-white/70">
                  ≈ ${(parseFloat(selectedWallet.balance) * 50000).toLocaleString()} USD
                </div>
              </div>

              {/* Network Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Network className="w-5 h-5 text-green-400" />
                    <span className="text-white font-medium">Network Status</span>
                  </div>
                  <div className={`text-sm ${selectedWallet.syncStatus === 'synced' ? 'text-green-400' : 'text-yellow-400'}`}>
                    {selectedWallet.syncStatus === 'synced' ? 'Synchronized' : 'Synchronizing...'}
                  </div>
                  <div className="text-gray-400 text-xs mt-1">
                    Block: {selectedWallet.blockHeight.toLocaleString()}
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Zap className="w-5 h-5 text-blue-400" />
                    <span className="text-white font-medium">Connections</span>
                  </div>
                  <div className="text-blue-400 text-lg font-semibold">
                    {selectedWallet.connections}
                  </div>
                  <div className="text-gray-400 text-xs mt-1">
                    Active peers
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="w-5 h-5 text-purple-400" />
                    <span className="text-white font-medium">Security</span>
                  </div>
                  <div className="text-green-400 text-sm">
                    Wallet Encrypted
                  </div>
                  <div className="text-gray-400 text-xs mt-1">
                    Private keys secured
                  </div>
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-4">Recent Transactions</h3>
                <div className="space-y-3">
                  {transactions.slice(0, 3).map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {tx.type === 'received' ? (
                          <ArrowDownLeft className="w-5 h-5 text-green-400" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5 text-red-400" />
                        )}
                        <div>
                          <div className="text-white text-sm">
                            {tx.type === 'received' ? 'Received' : 'Sent'}
                          </div>
                          <div className="text-gray-400 text-xs">
                            {formatAddress(tx.address)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${tx.type === 'received' ? 'text-green-400' : 'text-red-400'}`}>
                          {tx.type === 'received' ? '+' : '-'}{tx.amount} {selectedWallet.symbol}
                        </div>
                        <div className="text-gray-400 text-xs">
                          {tx.confirmations} confirmations
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'send' && (
            <div className="max-w-md mx-auto space-y-6">
              <h3 className="text-xl font-semibold text-white mb-6">Send {selectedWallet.symbol}</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Amount</label>
                  <input
                    type="number"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                    placeholder="0.00000000"
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">To Address</label>
                  <input
                    type="text"
                    value={sendAddress}
                    onChange={(e) => setSendAddress(e.target.value)}
                    placeholder={`Enter ${selectedWallet.symbol} address`}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">Transaction Fee</label>
                  <input
                    type="number"
                    value={sendFee}
                    onChange={(e) => setSendFee(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  onClick={handleSend}
                  disabled={isSending || !sendAmount || !sendAddress}
                  className="w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: walletStyle.background }}
                >
                  {isSending ? 'Sending...' : `Send ${selectedWallet.symbol}`}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'receive' && (
            <div className="max-w-md mx-auto space-y-6">
              <h3 className="text-xl font-semibold text-white mb-6">Receive {selectedWallet.symbol}</h3>
              
              <div className="bg-gray-800 rounded-lg p-6 text-center">
                <div className="w-48 h-48 mx-auto mb-4 bg-white rounded-lg flex items-center justify-center">
                  <QrCode className="w-32 h-32 text-gray-600" />
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Your {selectedWallet.symbol} Address</label>
                    <div className="bg-gray-700 rounded-lg p-3 flex items-center justify-between">
                      <span className="text-white font-mono text-sm">
                        {formatAddress(selectedWallet.address)}
                      </span>
                      <button
                        onClick={() => copyToClipboard(selectedWallet.address)}
                        className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors"
                      >
                        <Copy className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>

                  <p className="text-gray-400 text-sm">
                    Share this address to receive {selectedWallet.symbol}. Always verify the address before sharing.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white mb-6">Transaction History</h3>
              
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div key={tx.id} className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        {tx.type === 'received' ? (
                          <ArrowDownLeft className="w-5 h-5 text-green-400" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5 text-red-400" />
                        )}
                        <div>
                          <div className="text-white font-medium">
                            {tx.type === 'received' ? 'Received' : 'Sent'}
                          </div>
                          <div className="text-gray-400 text-sm">
                            {tx.timestamp.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${tx.type === 'received' ? 'text-green-400' : 'text-red-400'}`}>
                          {tx.type === 'received' ? '+' : '-'}{tx.amount} {selectedWallet.symbol}
                        </div>
                        <div className="text-gray-400 text-sm">
                          {tx.confirmations} confirmations
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 p-2 bg-gray-700 rounded text-xs text-gray-400 font-mono">
                      {tx.txid}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-md mx-auto space-y-6">
              <h3 className="text-xl font-semibold text-white mb-6">Wallet Settings</h3>
              
              <div className="space-y-4">
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3">Wallet Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Wallet Type:</span>
                      <span className="text-white">{selectedWallet.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Network:</span>
                      <span className="text-white">{selectedWallet.network}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Address:</span>
                      <span className="text-white font-mono">{formatAddress(selectedWallet.address)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3">Security</h4>
                  <div className="space-y-3">
                    <button
                      onClick={() => setShowPrivateKey(!showPrivateKey)}
                      className="w-full flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <Key className="w-5 h-5 text-yellow-400" />
                        <span className="text-white">Show Private Key</span>
                      </div>
                      {showPrivateKey ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                    </button>

                    {showPrivateKey && selectedWallet.privateKey && (
                      <div className="bg-gray-700 rounded-lg p-3">
                        <div className="text-gray-400 text-xs mb-2">Private Key (Keep Secret!)</div>
                        <div className="text-white font-mono text-sm break-all">
                          {selectedWallet.privateKey}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3">Actions</h4>
                  <div className="space-y-2">
                    <button className="w-full flex items-center space-x-2 p-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                      <Download className="w-5 h-5 text-white" />
                      <span className="text-white">Export Wallet</span>
                    </button>
                    <button className="w-full flex items-center space-x-2 p-3 bg-red-600 rounded-lg hover:bg-red-700 transition-colors">
                      <Upload className="w-5 h-5 text-white" />
                      <span className="text-white">Import Wallet</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default FullGUIWallet;
