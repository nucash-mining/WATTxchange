import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeftRight, 
  Shield, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  Copy,
  RefreshCw
} from 'lucide-react';
import { moneroBridgeService, BridgeStatus } from '../../services/moneroBridgeService';
import toast from 'react-hot-toast';

interface MoneroBridgeInterfaceProps {
  onBack: () => void;
}

export const MoneroBridgeInterface: React.FC<MoneroBridgeInterfaceProps> = ({ onBack }) => {
  const [bridgeStatus, setBridgeStatus] = useState<BridgeStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'status'>('deposit');
  
  // Deposit state
  const [depositAddress, setDepositAddress] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [showDepositAddress, setShowDepositAddress] = useState(false);
  
  // Withdrawal state
  const [withdrawalAddress, setWithdrawalAddress] = useState('');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [wXMRBalance, setWXMRBalance] = useState('0');
  
  // Status state
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadBridgeStatus();
    loadDepositAddress();
    loadWXMRBalance();
  }, []);

  const loadBridgeStatus = async () => {
    try {
      setIsRefreshing(true);
      const status = await moneroBridgeService.getBridgeStatus();
      setBridgeStatus(status);
    } catch (error) {
      console.error('Error loading bridge status:', error);
      toast.error('Failed to load bridge status');
    } finally {
      setIsRefreshing(false);
    }
  };

  const loadDepositAddress = async () => {
    // In a real implementation, this would get the bridge's deposit address
    setDepositAddress('4AsjKppNcHfJPekAPKVMsecyVT1v35MVn4N6dsXYSVTZHWsmC66u3sDT5NYavm5udMXHf32Ntb4N2bJqhnN4Gfq2GKZYmMK');
  };

  const loadWXMRBalance = async () => {
    // In a real implementation, this would get the user's wXMR balance
    setWXMRBalance('0.000000');
  };

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    try {
      // In a real implementation, this would initiate the deposit process
      toast.success(`Deposit initiated! Send ${depositAmount} XMR to the address above.`);
    } catch (error) {
      console.error('Error initiating deposit:', error);
      toast.error('Failed to initiate deposit');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdrawal = async () => {
    if (!withdrawalAddress || !withdrawalAmount || parseFloat(withdrawalAmount) <= 0) {
      toast.error('Please enter valid address and amount');
      return;
    }

    // Validate Monero address
    const isValidAddress = await moneroBridgeService.validateMoneroAddress(withdrawalAddress);
    if (!isValidAddress) {
      toast.error('Invalid Monero address');
      return;
    }

    if (parseFloat(withdrawalAmount) > parseFloat(wXMRBalance)) {
      toast.error('Insufficient wXMR balance');
      return;
    }

    setIsLoading(true);
    try {
      // In a real implementation, this would initiate the withdrawal
      toast.success(`Withdrawal requested! ${withdrawalAmount} wXMR will be burned and XMR sent to your address.`);
    } catch (error) {
      console.error('Error initiating withdrawal:', error);
      toast.error('Failed to initiate withdrawal');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const formatAddress = (address: string) => {
    if (address.length <= 20) return address;
    return `${address.slice(0, 10)}...${address.slice(-10)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ArrowLeftRight className="w-6 h-6 text-white" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">Monero Bridge</h1>
              <p className="text-blue-200">Secure XMR ↔ wXMR on Altcoinchain</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={loadBridgeStatus}
              disabled={isRefreshing}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 text-white ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </motion.div>

        {/* Bridge Status Card */}
        {bridgeStatus && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-white/20"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Bridge Status</h2>
              <div className="flex items-center space-x-2">
                {bridgeStatus.isProperlyBacked ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-400" />
                )}
                <span className={`text-sm font-medium ${
                  bridgeStatus.isProperlyBacked ? 'text-green-400' : 'text-red-400'
                }`}>
                  {bridgeStatus.isProperlyBacked ? 'Properly Backed' : 'Not Backed'}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-blue-200 text-sm">Total XMR Backing</p>
                <p className="text-white text-lg font-semibold">{bridgeStatus.totalXMRBacking} XMR</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-blue-200 text-sm">Total wXMR Supply</p>
                <p className="text-white text-lg font-semibold">{bridgeStatus.totalWXMRSupply} wXMR</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-blue-200 text-sm">Backing Ratio</p>
                <p className="text-white text-lg font-semibold">
                  {(bridgeStatus.backingRatio * 100).toFixed(2)}%
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex space-x-1 mb-8 bg-white/10 rounded-lg p-1"
        >
          {[
            { id: 'deposit', label: 'Deposit XMR', icon: ArrowLeftRight },
            { id: 'withdraw', label: 'Withdraw XMR', icon: ArrowLeftRight },
            { id: 'status', label: 'Status', icon: Shield }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-purple-900 font-semibold'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </motion.div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
        >
          {activeTab === 'deposit' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-2">Deposit XMR</h3>
                <p className="text-blue-200">Send XMR to receive wXMR tokens on Altcoinchain</p>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-white font-medium">Deposit Address</label>
                  <button
                    onClick={() => setShowDepositAddress(!showDepositAddress)}
                    className="p-1 rounded hover:bg-white/10 transition-colors"
                  >
                    {showDepositAddress ? (
                      <EyeOff className="w-4 h-4 text-blue-200" />
                    ) : (
                      <Eye className="w-4 h-4 text-blue-200" />
                    )}
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={showDepositAddress ? depositAddress : '•'.repeat(95)}
                    readOnly
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white font-mono text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(depositAddress)}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <Copy className="w-4 h-4 text-white" />
                  </button>
                </div>
                <p className="text-blue-200 text-xs mt-2">
                  ⚠️ Only send XMR to this address. Other cryptocurrencies will be lost.
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <label className="text-white font-medium block mb-2">Amount to Deposit</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="0.000000"
                    step="0.000001"
                    min="0.001"
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                  />
                  <span className="text-white font-medium">XMR</span>
                </div>
                <p className="text-blue-200 text-xs mt-2">
                  Minimum: 0.001 XMR | Maximum: 100 XMR
                </p>
              </div>

              <button
                onClick={handleDeposit}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
              >
                {isLoading ? 'Processing...' : 'Initiate Deposit'}
              </button>
            </div>
          )}

          {activeTab === 'withdraw' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-2">Withdraw XMR</h3>
                <p className="text-blue-200">Burn wXMR tokens to receive XMR</p>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">Your wXMR Balance</span>
                  <span className="text-white font-semibold">{wXMRBalance} wXMR</span>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <label className="text-white font-medium block mb-2">Monero Address</label>
                <input
                  type="text"
                  value={withdrawalAddress}
                  onChange={(e) => setWithdrawalAddress(e.target.value)}
                  placeholder="4AsjKppNcHfJPekAPKVMsecyVT1v35MVn4N6dsXYSVTZHWsmC66u3sDT5NYavm5udMXHf32Ntb4N2bJqhnN4Gfq2GKZYmMK"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white font-mono text-sm"
                />
                <p className="text-blue-200 text-xs mt-2">
                  Enter your Monero address to receive XMR
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <label className="text-white font-medium block mb-2">Amount to Withdraw</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                    placeholder="0.000000"
                    step="0.000001"
                    min="0.001"
                    max={wXMRBalance}
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                  />
                  <span className="text-white font-medium">wXMR</span>
                </div>
                <p className="text-blue-200 text-xs mt-2">
                  Minimum: 0.001 wXMR | Maximum: {wXMRBalance} wXMR
                </p>
              </div>

              <button
                onClick={handleWithdrawal}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
              >
                {isLoading ? 'Processing...' : 'Request Withdrawal'}
              </button>
            </div>
          )}

          {activeTab === 'status' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-2">Bridge Security</h3>
                <p className="text-blue-200">Monitor bridge health and security</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Shield className="w-5 h-5 text-green-400" />
                    <h4 className="text-white font-semibold">Security Features</h4>
                  </div>
                  <ul className="space-y-2 text-blue-200 text-sm">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span>1:1 XMR backing guaranteed</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span>10 confirmations required</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span>1-hour withdrawal delay</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span>Operator-controlled security</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Lock className="w-5 h-5 text-blue-400" />
                    <h4 className="text-white font-semibold">Bridge Controls</h4>
                  </div>
                  <ul className="space-y-2 text-blue-200 text-sm">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span>Pausable in emergencies</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span>Maximum supply limits</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span>Real-time monitoring</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span>Automatic rebalancing</span>
                    </li>
                  </ul>
                </div>
              </div>

              {bridgeStatus && (
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-3">Live Status</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-blue-200">Last Updated</p>
                      <p className="text-white">{bridgeStatus.lastChecked.toLocaleTimeString()}</p>
                    </div>
                    <div>
                      <p className="text-blue-200">Pending Deposits</p>
                      <p className="text-white">{bridgeStatus.pendingDeposits}</p>
                    </div>
                    <div>
                      <p className="text-blue-200">Pending Withdrawals</p>
                      <p className="text-white">{bridgeStatus.pendingWithdrawals}</p>
                    </div>
                    <div>
                      <p className="text-blue-200">Health Status</p>
                      <p className={`font-semibold ${
                        bridgeStatus.isProperlyBacked ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {bridgeStatus.isProperlyBacked ? 'Healthy' : 'Warning'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};
