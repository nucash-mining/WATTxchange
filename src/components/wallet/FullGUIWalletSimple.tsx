import React, { useState } from 'react';
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
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

interface WalletData {
  symbol: string;
  name: string;
  balance: string;
  address: string;
  color: string;
  network: string;
  blockHeight: number;
  connections: number;
  syncStatus: 'synced' | 'syncing' | 'disconnected';
}

interface FullGUIWalletSimpleProps {
  selectedWallet: WalletData;
  onClose: () => void;
}

const FullGUIWalletSimple: React.FC<FullGUIWalletSimpleProps> = ({ selectedWallet, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'send' | 'receive' | 'history' | 'settings'>('overview');
  const [showBalances, setShowBalances] = useState(true);
  const [sendAmount, setSendAmount] = useState('');
  const [sendAddress, setSendAddress] = useState('');

  const handleSend = async () => {
    if (!sendAmount || !sendAddress) {
      toast.error('Please fill in all fields');
      return;
    }
    toast.success(`Sent ${sendAmount} ${selectedWallet.symbol} to ${sendAddress.slice(0, 10)}...`);
    setSendAmount('');
    setSendAddress('');
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
        <div className="p-6 text-white bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold">{selectedWallet.name} Wallet</h2>
                <p className="text-white/80">Full GUI Interface</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
              >
                <X className="w-5 h-5" />
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
                  ? 'bg-gray-700 text-white border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
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
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-600">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Balance</h3>
                  <button
                    onClick={() => setShowBalances(!showBalances)}
                    className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                  >
                    {showBalances ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                  </button>
                </div>
                <div className="text-3xl font-bold mb-2 text-white">
                  {showBalances ? `${selectedWallet.balance} ${selectedWallet.symbol}` : '••••••'}
                </div>
                <div className="text-gray-400">
                  ≈ ${(parseFloat(selectedWallet.balance) * 50000).toLocaleString()} USD
                </div>
              </div>

              {/* Network Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-600">
                  <div className="text-white font-medium mb-2">Network Status</div>
                  <div className={`text-sm ${selectedWallet.syncStatus === 'synced' ? 'text-green-400' : 'text-yellow-400'}`}>
                    {selectedWallet.syncStatus === 'synced' ? 'Synchronized' : 'Synchronizing...'}
                  </div>
                  <div className="text-gray-400 text-xs mt-1">
                    Block: {selectedWallet.blockHeight.toLocaleString()}
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-4 border border-gray-600">
                  <div className="text-white font-medium mb-2">Connections</div>
                  <div className="text-blue-400 text-lg font-semibold">
                    {selectedWallet.connections}
                  </div>
                  <div className="text-gray-400 text-xs mt-1">
                    Active peers
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-4 border border-gray-600">
                  <div className="text-white font-medium mb-2">Address</div>
                  <div className="text-gray-400 text-xs font-mono">
                    {formatAddress(selectedWallet.address)}
                  </div>
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

                <button
                  onClick={handleSend}
                  disabled={!sendAmount || !sendAddress}
                  className="w-full py-3 px-6 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Send {selectedWallet.symbol}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'receive' && (
            <div className="max-w-md mx-auto space-y-6">
              <h3 className="text-xl font-semibold text-white mb-6">Receive {selectedWallet.symbol}</h3>
              
              <div className="bg-gray-800 rounded-lg p-6 text-center border border-gray-600">
                <div className="w-48 h-48 mx-auto mb-4 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-6xl">📱</span>
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
              
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-600">
                <p className="text-gray-400 text-center py-8">
                  No transactions yet. Start by sending or receiving {selectedWallet.symbol}.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-md mx-auto space-y-6">
              <h3 className="text-xl font-semibold text-white mb-6">Wallet Settings</h3>
              
              <div className="space-y-4">
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-600">
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
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default FullGUIWalletSimple;
