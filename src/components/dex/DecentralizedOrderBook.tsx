import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowUpDown, 
  Clock, 
  Shield, 
  Network, 
  TrendingUp, 
  TrendingDown,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { crossChainSwapCoordinator, CrossChainSwapOrder, NodeConnectionStatus } from '../../services/crossChainSwapCoordinator';
import { useWallet } from '../../hooks/useWallet';
import toast from 'react-hot-toast';

interface OrderBookProps {
  fromChain: string;
  toChain: string;
  onOrderSelect?: (order: CrossChainSwapOrder) => void;
}

const DecentralizedOrderBook: React.FC<OrderBookProps> = ({ 
  fromChain, 
  toChain, 
  onOrderSelect 
}) => {
  const { isConnected, address } = useWallet();
  const [orders, setOrders] = useState<CrossChainSwapOrder[]>([]);
  const [userOrders, setUserOrders] = useState<CrossChainSwapOrder[]>([]);
  const [nodeStatus, setNodeStatus] = useState<NodeConnectionStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<CrossChainSwapOrder | null>(null);
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [newOrder, setNewOrder] = useState({
    makerAmount: '',
    takerAmount: '',
    timelockHours: '24'
  });

  useEffect(() => {
    loadOrderBook();
    loadUserOrders();
    loadNodeStatus();
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      loadOrderBook();
      loadNodeStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, [fromChain, toChain, address]);

  const loadOrderBook = async () => {
    try {
      const orderBook = crossChainSwapCoordinator.getOrderBook(fromChain, toChain);
      setOrders(orderBook);
    } catch (error) {
      console.error('Failed to load order book:', error);
    }
  };

  const loadUserOrders = async () => {
    if (!address) return;
    
    try {
      const userOrders = crossChainSwapCoordinator.getUserOrders(address);
      setUserOrders(userOrders);
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

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadOrderBook(),
        loadUserOrders(),
        loadNodeStatus()
      ]);
      toast.success('Order book refreshed');
    } catch {
      toast.error('Failed to refresh order book');
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateOrder = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!newOrder.makerAmount || !newOrder.takerAmount) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const orderId = await crossChainSwapCoordinator.createSwapOrder(
        address,
        fromChain,
        fromChain,
        parseFloat(newOrder.makerAmount),
        toChain,
        toChain,
        parseFloat(newOrder.takerAmount),
        parseInt(newOrder.timelockHours)
      );

      if (orderId) {
        toast.success('Order created successfully!');
        setNewOrder({ makerAmount: '', takerAmount: '', timelockHours: '24' });
        setShowCreateOrder(false);
        await loadOrderBook();
        await loadUserOrders();
      } else {
        toast.error('Failed to create order');
      }
    } catch (error) {
      console.error('Failed to create order:', error);
      toast.error('Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      const success = await crossChainSwapCoordinator.cancelOrder(orderId);
      if (success) {
        toast.success('Order cancelled');
        await loadOrderBook();
        await loadUserOrders();
      } else {
        toast.error('Failed to cancel order');
      }
    } catch (error) {
      console.error('Failed to cancel order:', error);
      toast.error('Failed to cancel order');
    }
  };

  const handleCompleteSwap = async (orderId: string) => {
    try {
      const order = orders.find(o => o.id === orderId) || userOrders.find(o => o.id === orderId);
      if (!order || !order.secret) {
        toast.error('Order or secret not found');
        return;
      }

      const success = await crossChainSwapCoordinator.completeSwap(orderId, order.secret);
      if (success) {
        toast.success('Swap completed successfully!');
        await loadOrderBook();
        await loadUserOrders();
      } else {
        toast.error('Failed to complete swap');
      }
    } catch (error) {
      console.error('Failed to complete swap:', error);
      toast.error('Failed to complete swap');
    }
  };

  const getChainIcon = (chain: string) => {
    switch (chain) {
      case 'BTC':
        return <img src="/BTC logo.png" alt="BTC" className="w-5 h-5 object-contain" />;
      case 'ETH':
        return <img src="/ETH logo.png" alt="ETH" className="w-5 h-5 object-contain" />;
      case 'LTC':
        return <img src="/LTC logo.png" alt="LTC" className="w-5 h-5 object-contain" />;
      case 'ALT':
        return <img src="/Altcoinchain logo.png" alt="ALT" className="w-5 h-5 object-contain rounded-full" />;
      case 'GHOST':
        return <img src="/GHOST logo.png" alt="GHOST" className="w-5 h-5 object-contain" />;
      case 'TROLL':
        return <img src="/TROLL logo.png" alt="TROLL" className="w-5 h-5 object-contain" />;
      case 'HTH':
        return <img src="/HTH logo.webp" alt="HTH" className="w-5 h-5 object-contain" />;
      default:
        return <div className="w-5 h-5 bg-slate-600 rounded-full flex items-center justify-center text-xs">{chain[0]}</div>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <div className="w-2 h-2 bg-green-400 rounded-full" />;
      case 'matched':
        return <div className="w-2 h-2 bg-yellow-400 rounded-full" />;
      case 'locked':
        return <div className="w-2 h-2 bg-blue-400 rounded-full" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'expired':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-gray-400" />;
      default:
        return <div className="w-2 h-2 bg-gray-400 rounded-full" />;
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Decentralized Order Book</h3>
          <p className="text-slate-400">
            {fromChain} ↔ {toChain} Atomic Swaps
          </p>
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
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-colors disabled:opacity-50"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
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

      {/* Create Order Button */}
      {isConnected && isNodeConnected(fromChain) && isNodeConnected(toChain) && (
        <motion.button
          onClick={() => setShowCreateOrder(true)}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Create New Order
        </motion.button>
      )}

      {/* Create Order Modal */}
      {showCreateOrder && (
        <motion.div
          className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h4 className="text-lg font-semibold mb-4">Create Atomic Swap Order</h4>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">You Send ({fromChain})</label>
                <input
                  type="number"
                  value={newOrder.makerAmount}
                  onChange={(e) => setNewOrder({ ...newOrder, makerAmount: e.target.value })}
                  placeholder="0.00"
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">You Receive ({toChain})</label>
                <input
                  type="number"
                  value={newOrder.takerAmount}
                  onChange={(e) => setNewOrder({ ...newOrder, takerAmount: e.target.value })}
                  placeholder="0.00"
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500/50"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Timelock (hours)</label>
              <input
                type="number"
                value={newOrder.timelockHours}
                onChange={(e) => setNewOrder({ ...newOrder, timelockHours: e.target.value })}
                min="1"
                max="168"
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500/50"
              />
            </div>
            
            <div className="flex space-x-3">
              <motion.button
                onClick={handleCreateOrder}
                disabled={loading}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Create Order'}
              </motion.button>
              <motion.button
                onClick={() => setShowCreateOrder(false)}
                className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Cancel
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Order Book */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Open Orders */}
        <motion.div
          className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h4 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <span>Open Orders</span>
            <span className="text-sm text-slate-400">({orders.length})</span>
          </h4>
          
          {orders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400">No open orders available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <motion.div
                  key={order.id}
                  className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50 hover:border-slate-600/50 transition-colors cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                  onClick={() => {
                    setSelectedOrder(order);
                    onOrderSelect?.(order);
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
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
                  
                  <div className="flex items-center justify-between text-sm text-slate-400">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimeRemaining(order.timelock)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Shield className="w-3 h-3" />
                      <span>Atomic Swap</span>
                    </div>
                  </div>
                  
                  <div className="mt-2 text-xs text-slate-500">
                    Rate: 1 {order.makerToken} = {(order.takerAmount / order.makerAmount).toFixed(6)} {order.takerToken}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* User Orders */}
        <motion.div
          className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h4 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <TrendingDown className="w-5 h-5 text-blue-400" />
            <span>Your Orders</span>
            <span className="text-sm text-slate-400">({userOrders.length})</span>
          </h4>
          
          {userOrders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400">No orders found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {userOrders.map((order) => (
                <motion.div
                  key={order.id}
                  className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
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
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Selected Order Details */}
      {selectedOrder && (
        <motion.div
          className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h4 className="text-lg font-semibold mb-4">Order Details</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h5 className="font-medium mb-2">Maker</h5>
              <p className="text-sm text-slate-400 font-mono">{selectedOrder.maker}</p>
            </div>
            <div>
              <h5 className="font-medium mb-2">Status</h5>
              <div className="flex items-center space-x-2">
                {getStatusIcon(selectedOrder.status)}
                <span className={getStatusColor(selectedOrder.status)}>{selectedOrder.status}</span>
              </div>
            </div>
            <div>
              <h5 className="font-medium mb-2">Exchange Rate</h5>
              <p className="text-sm text-slate-400">
                1 {selectedOrder.makerToken} = {(selectedOrder.takerAmount / selectedOrder.makerAmount).toFixed(6)} {selectedOrder.takerToken}
              </p>
            </div>
            <div>
              <h5 className="font-medium mb-2">Time Remaining</h5>
              <p className="text-sm text-slate-400">{formatTimeRemaining(selectedOrder.timelock)}</p>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <div className="flex items-center space-x-2 text-sm text-slate-400">
              <Network className="w-4 h-4" />
              <span>Cross-chain atomic swap with local node verification</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default DecentralizedOrderBook;
