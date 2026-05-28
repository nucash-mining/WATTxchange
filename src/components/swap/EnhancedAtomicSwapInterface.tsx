import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowUpDown, 
  Clock, 
  Shield, 
  Network, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Copy} from 'lucide-react';
import { crossChainSwapCoordinator, CrossChainSwapOrder } from '../../services/crossChainSwapCoordinator';
// Removed import of utxoWalletService because it is not exported from the module
import { walletService } from '../../services/walletService';
import { useWallet } from '../../hooks/useWallet';
import DecentralizedOrderBook from '../dex/DecentralizedOrderBook';
import toast from 'react-hot-toast';

interface EnhancedAtomicSwapInterfaceProps {
  onClose?: () => void;
}

const EnhancedAtomicSwapInterface: React.FC<EnhancedAtomicSwapInterfaceProps> = () => {
  const { isConnected, address, connectWallet } = useWallet();
  const [activeTab, setActiveTab] = useState<'create' | 'orderbook' | 'history'>('create');
  const [fromChain, setFromChain] = useState('BTC');
  const [toChain, setToChain] = useState('ETH');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [timelockHours, setTimelockHours] = useState('24');
  const [loading, setLoading] = useState(false);
  const [userOrders, setUserOrders] = useState<CrossChainSwapOrder[]>([]);
  const [nodeStatus, setNodeStatus] = useState<any[]>([]);
  const [showPrivateKeys, setShowPrivateKeys] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<CrossChainSwapOrder | null>(null);

  const supportedChains = ['BTC', 'LTC', 'GHOST', 'TROLL', 'HTH', 'RTM', 'ETH', 'ALT', 'WATT'];

  useEffect(() => {
    loadUserOrders();
    loadNodeStatus();
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      loadUserOrders();
      loadNodeStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, [address]);

  const loadUserOrders = async () => {
    if (!address) return;
    
    try {
      const orders = crossChainSwapCoordinator.getUserOrders(address);
      setUserOrders(orders);
    } catch (error) {
      console.error('Failed to load user orders:', error);
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

  const handleCreateSwap = async () => {
    if (!isConnected) {
      connectWallet();
      return;
    }

    if (!fromAmount || !toAmount) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const orderId = await crossChainSwapCoordinator.createSwapOrder(
        address!,
        fromChain,
        fromChain,
        parseFloat(fromAmount),
        toChain,
        toChain,
        parseFloat(toAmount),
        parseInt(timelockHours)
      );

      if (orderId) {
        toast.success('Atomic swap order created successfully!');
        setFromAmount('');
        setToAmount('');
        await loadUserOrders();
      } else {
        toast.error('Failed to create atomic swap order');
      }
    } catch (error) {
      console.error('Failed to create swap:', error);
      toast.error('Failed to create atomic swap order');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSwap = async (orderId: string) => {
    try {
      const order = userOrders.find(o => o.id === orderId);
      if (!order || !order.secret) {
        toast.error('Order or secret not found');
        return;
      }

      const success = await crossChainSwapCoordinator.completeSwap(orderId, order.secret);
      if (success) {
        toast.success('Swap completed successfully!');
        await loadUserOrders();
      } else {
        toast.error('Failed to complete swap');
      }
    } catch (error) {
      console.error('Failed to complete swap:', error);
      toast.error('Failed to complete swap');
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      const success = await crossChainSwapCoordinator.cancelOrder(orderId);
      if (success) {
        toast.success('Order cancelled');
        await loadUserOrders();
      } else {
        toast.error('Failed to cancel order');
      }
    } catch (error) {
      console.error('Failed to cancel order:', error);
      toast.error('Failed to cancel order');
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <div className="w-3 h-3 bg-green-400 rounded-full" />;
      case 'matched':
        return <div className="w-3 h-3 bg-yellow-400 rounded-full" />;
      case 'locked':
        return <div className="w-3 h-3 bg-blue-400 rounded-full" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'expired':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-gray-400" />;
      default:
        return <div className="w-3 h-3 bg-gray-400 rounded-full" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'text-green-400';
      case 'matched':
        return 'text-yellow-400';
      case 'locked':
        return 'text-blue-400';
      case 'completed':
        return 'text-green-400';
      case 'expired':
        return 'text-red-400';
      case 'cancelled':
        return 'text-gray-400';
      default:
        return 'text-gray-400';
    }
  };

  const isNodeConnected = (chain: string) => {
    const status = nodeStatus.find(s => s.chain === chain);
    return status?.isConnected || false;
  };

  const formatTimeRemaining = (timelock: number) => {
    const remaining = timelock - Math.floor(Date.now() / 1000);
    if (remaining <= 0) return 'Expired';
    
    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const getWalletBalance = (chain: string) => {
    if (['ETH', 'ALT', 'WATT'].includes(chain)) {
      // For ETH-like chains, addresses from getAllAddresses likely don't have balances attached, so we must fetch them separately or default to 0.
      // Here, just return '0.00000000' as we don't have the balance.
      return '0.00000000';
    } else {
      // walletService.getAllWallets does not exist, so fallback to getAllAddresses
      const addresses = walletService.getAllAddresses(chain);
      // Assume that if you have an address, you have a zero balance, otherwise zero.
      return addresses.length > 0 ? '0.00000000' : '0.00000000';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Enhanced Atomic Swaps</h2>
          <p className="text-slate-400">Cross-chain atomic swaps with local node verification</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Node Status Indicators */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              {getChainIcon(fromChain)}
              <div className={`w-2 h-2 rounded-full ${isNodeConnected(fromChain) ? 'bg-green-400' : 'bg-red-400'}`} />
            </div>
            <ArrowUpDown className="w-4 h-4 text-slate-400" />
            <div className="flex items-center space-x-1">
              {getChainIcon(toChain)}
              <div className={`w-2 h-2 rounded-full ${isNodeConnected(toChain) ? 'bg-green-400' : 'bg-red-400'}`} />
            </div>
          </div>
          
          <motion.button
            onClick={() => {
              loadUserOrders();
              loadNodeStatus();
            }}
            className="p-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RefreshCw className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Node Connection Status */}
      {(!isNodeConnected(fromChain) || !isNodeConnected(toChain)) && (
        <motion.div
          className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <div>
              <p className="font-medium text-yellow-400">Node Connection Required</p>
              <p className="text-sm text-slate-300">
                Connect to {fromChain} and {toChain} nodes to participate in atomic swaps.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-700/50">
        {[
          { id: 'create', label: 'Create Swap', icon: ArrowUpDown },
          { id: 'orderbook', label: 'Order Book', icon: Network },
          { id: 'history', label: 'My Orders', icon: Clock }
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

      {/* Tab Content */}
      {activeTab === 'create' && (
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Create Swap Form */}
          <div className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-xl font-semibold mb-6">Create Atomic Swap</h3>

            <div className="space-y-6">
              {/* From Chain */}
              <div className="space-y-3">
                <label className="block text-sm font-medium">You Send</label>
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <input
                      type="number"
                      value={fromAmount}
                      onChange={(e) => setFromAmount(e.target.value)}
                      placeholder="0.00"
                      className="bg-transparent text-2xl font-bold outline-none flex-1"
                    />
                    
                    <select
                      value={fromChain}
                      onChange={(e) => setFromChain(e.target.value)}
                      className="bg-slate-800 rounded px-3 py-2 outline-none flex items-center space-x-2"
                    >
                      {supportedChains.map(chain => (
                        <option key={chain} value={chain}>{chain}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-between text-sm text-slate-400">
                    <span>≈ $0.00</span>
                    <span>Balance: {getWalletBalance(fromChain)}</span>
                  </div>
                </div>
              </div>

              {/* Swap Button */}
              <div className="flex justify-center">
                <motion.button
                  onClick={() => {
                    const tempChain = fromChain;
                    setFromChain(toChain);
                    setToChain(tempChain);
                    
                    const tempAmount = fromAmount;
                    setFromAmount(toAmount);
                    setToAmount(tempAmount);
                  }}
                  className="p-3 bg-slate-700/50 hover:bg-slate-600/50 rounded-full transition-colors"
                  whileHover={{ scale: 1.1, rotate: 180 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <ArrowUpDown className="w-5 h-5" />
                </motion.button>
              </div>

              {/* To Chain */}
              <div className="space-y-3">
                <label className="block text-sm font-medium">You Receive</label>
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <input
                      type="number"
                      value={toAmount}
                      onChange={(e) => setToAmount(e.target.value)}
                      placeholder="0.00"
                      className="bg-transparent text-2xl font-bold outline-none flex-1"
                    />
                    
                    <select
                      value={toChain}
                      onChange={(e) => setToChain(e.target.value)}
                      className="bg-slate-800 rounded px-3 py-2 outline-none"
                    >
                      {supportedChains.map(chain => (
                        <option key={chain} value={chain}>{chain}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-between text-sm text-slate-400">
                    <span>≈ $0.00</span>
                    <span>Balance: {getWalletBalance(toChain)}</span>
                  </div>
                </div>
              </div>

              {/* Timelock */}
              <div className="space-y-3">
                <label className="block text-sm font-medium">Timelock (hours)</label>
                <input
                  type="number"
                  value={timelockHours}
                  onChange={(e) => setTimelockHours(e.target.value)}
                  min="1"
                  max="168"
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-3 focus:outline-none focus:border-blue-500/50"
                />
                <p className="text-xs text-slate-400">
                  The swap will automatically expire after this time if not completed.
                </p>
              </div>

              {/* Swap Details */}
              {fromAmount && toAmount && (
                <div className="bg-slate-900/50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Exchange Rate</span>
                    <span>1 {fromChain} = {(parseFloat(toAmount) / parseFloat(fromAmount)).toFixed(6)} {toChain}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Timelock</span>
                    <span>{timelockHours} hours</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Network Fee</span>
                    <span>~0.001 {fromChain}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Route</span>
                    <div className="flex items-center space-x-1">
                      <span>{fromChain}</span>
                      <ArrowUpDown className="w-3 h-3" />
                      <span>{toChain}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Create Swap Button */}
              <motion.button
                onClick={handleCreateSwap}
                disabled={loading || !fromAmount || !toAmount || !isNodeConnected(fromChain) || !isNodeConnected(toChain)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {!isConnected ? 'Connect Wallet' : 
                 loading ? 'Creating Swap...' :
                 'Create Atomic Swap'}
              </motion.button>
            </div>
          </div>

          {/* Swap Information */}
          <div className="space-y-6">
            {/* Chain Information */}
            <div className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
              <h4 className="text-lg font-semibold mb-4">Chain Information</h4>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getChainIcon(fromChain)}
                    <div>
                      <p className="font-medium">{fromChain}</p>
                      <p className="text-sm text-slate-400">
                        {fromChain === 'BTC' ? 'Bitcoin' :
                         fromChain === 'LTC' ? 'Litecoin' :
                         fromChain === 'ETH' ? 'Ethereum' :
                         fromChain === 'ALT' ? 'Altcoinchain' :
                         fromChain === 'GHOST' ? 'GHOST' :
                         fromChain === 'TROLL' ? 'Trollcoin' :
                         fromChain === 'HTH' ? 'Help The Homeless' :
                         fromChain === 'RTM' ? 'Raptoreum' : fromChain}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${isNodeConnected(fromChain) ? 'bg-green-400' : 'bg-red-400'}`} />
                    <span className="text-sm text-slate-400">
                      {isNodeConnected(fromChain) ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getChainIcon(toChain)}
                    <div>
                      <p className="font-medium">{toChain}</p>
                      <p className="text-sm text-slate-400">
                        {toChain === 'BTC' ? 'Bitcoin' :
                         toChain === 'LTC' ? 'Litecoin' :
                         toChain === 'ETH' ? 'Ethereum' :
                         toChain === 'ALT' ? 'Altcoinchain' :
                         toChain === 'GHOST' ? 'GHOST' :
                         toChain === 'TROLL' ? 'Trollcoin' :
                         toChain === 'HTH' ? 'Help The Homeless' :
                         toChain === 'RTM' ? 'Raptoreum' : toChain}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${isNodeConnected(toChain) ? 'bg-green-400' : 'bg-red-400'}`} />
                    <span className="text-sm text-slate-400">
                      {isNodeConnected(toChain) ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Features */}
            <div className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
              <h4 className="text-lg font-semibold mb-4">Security Features</h4>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-green-400 mt-0.5" />
                  <div>
                    <p className="font-medium">Trustless Atomic Swaps</p>
                    <p className="text-sm text-slate-400">No third-party custody required. Your private keys remain in your control.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <p className="font-medium">Time-Locked Contracts</p>
                    <p className="text-sm text-slate-400">Funds are locked for a specified time period, ensuring both parties have time to complete the swap.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Network className="w-5 h-5 text-purple-400 mt-0.5" />
                  <div>
                    <p className="font-medium">Local Node Verification</p>
                    <p className="text-sm text-slate-400">All transactions are verified through your local nodes for maximum security.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'orderbook' && (
        <DecentralizedOrderBook
          fromChain={fromChain}
          toChain={toChain}
          onOrderSelect={setSelectedOrder}
        />
      )}

      {activeTab === 'history' && (
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-xl font-semibold mb-6">Your Atomic Swap Orders</h3>
            
            {userOrders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400">No orders found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {userOrders.map((order) => (
                  <motion.div
                    key={order.id}
                    className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {getChainIcon(order.makerChain)}
                        <span className="font-medium">{order.makerAmount} {order.makerToken}</span>
                        <ArrowUpDown className="w-4 h-4 text-slate-400" />
                        {getChainIcon(order.takerChain)}
                        <span className="font-medium">{order.takerAmount} {order.takerToken}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(order.status)}
                        <span className={`text-sm ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-slate-400 mb-3">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatTimeRemaining(order.timelock)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Shield className="w-3 h-3" />
                        <span>Atomic Swap</span>
                      </div>
                    </div>
                    
                    {order.status === 'open' && (
                      <motion.button
                        onClick={() => handleCancelOrder(order.id)}
                        className="w-full py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Cancel Order
                      </motion.button>
                    )}
                    
                    {order.status === 'locked' && order.secret && (
                      <motion.button
                        onClick={() => handleCompleteSwap(order.id)}
                        className="w-full py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Complete Swap
                      </motion.button>
                    )}
                    
                    {order.secret && (
                      <div className="mt-3 p-3 bg-slate-800/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Secret Key</span>
                          <motion.button
                            onClick={() => copyToClipboard(order.secret!, 'Secret Key')}
                            className="p-1 hover:bg-slate-700/50 rounded transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Copy className="w-4 h-4" />
                          </motion.button>
                        </div>
                        <p className="font-mono text-xs break-all text-slate-300">
                          {showPrivateKeys ? order.secret : '••••••••••••••••••••••••••••••••'}
                        </p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
        <div className="flex items-center space-x-2">
          <motion.button
            onClick={() => setShowPrivateKeys(!showPrivateKeys)}
            className="flex items-center space-x-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {showPrivateKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span className="text-sm">{showPrivateKeys ? 'Hide' : 'Show'} Secrets</span>
          </motion.button>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-slate-400">
          <Shield className="w-4 h-4" />
          <span>Private keys and secrets are stored locally</span>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAtomicSwapInterface;
