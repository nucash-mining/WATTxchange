import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bitcoin, Zap, DollarSign, Hash, Eye, EyeOff, RefreshCw, TrendingUp, TrendingDown, AlertCircle, Wifi, WifiOff, Server } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';
import { usePrices } from '../hooks/usePrices';
import { walletService } from '../services/walletService';
import NodeStatus from './wallet/NodeStatus';
import BalanceCard from './wallet/BalanceCard';
import TransactionHistory from './wallet/TransactionHistory';
import WalletAuth from './wallet/WalletAuth';
import RPCNodeManager from './wallet/RPCNodeManager';

const WalletView: React.FC = () => {
  const [showBalances, setShowBalances] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showRPCManager, setShowRPCManager] = useState(false);
  const { isConnected, address, chainId, altBalance, wattBalance, refreshBalances } = useWallet();
  
  // Fetch prices for all supported cryptocurrencies including GHOST and TROLL
  const { 
    prices, 
    loading: pricesLoading, 
    error: pricesError,
    formatPrice, 
    formatChange, 
    refetch: refetchPrices, 
    lastUpdated,
    apiConnected,
    getTotalValue
  } = usePrices(['ALT', 'BTC', 'ETH', 'LTC', 'XMR', 'DOGE', 'GHOST', 'TROLL']);

  useEffect(() => {
    // Check if wallet service is already initialized
    if (walletService.isInitialized()) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      refetchPrices(),
      refreshBalances()
    ]);
    // Simulate additional refresh time
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const chains = [
    {
      name: 'Altcoinchain',
      symbol: 'ALT',
      chainId: 2330,
      balance: isConnected && chainId === 2330 ? altBalance : '0',
      icon: () => (
        <div className="relative flex items-center justify-center">
          <img 
            src="/Altcoinchain logo.png" 
            alt="ALT" 
            className="w-12 h-12 object-contain rounded-full"
            style={{ aspectRatio: '1/1' }}
          />
        </div>
      ),
      color: 'from-yellow-500 to-yellow-600',
      nodeType: 'full' as const,
      syncStatus: 'synced' as const
    },
    {
      name: 'Bitcoin',
      symbol: 'BTC',
      balance: '0.00000',
      icon: () => <img src="/BTC logo.png" alt="BTC" className="w-8 h-8 object-contain" />,
      color: 'from-orange-500 to-orange-600',
      nodeType: 'rpc' as const,
      syncStatus: 'connected' as const
    },
    {
      name: 'Ethereum',
      symbol: 'ETH',
      balance: '0.0000',
      icon: () => <img src="/ETH logo.png" alt="ETH" className="w-8 h-8 object-contain" />,
      color: 'from-purple-500 to-purple-600',
      nodeType: 'light' as const,
      syncStatus: 'connected' as const
    },
    {
      name: 'Litecoin',
      symbol: 'LTC',
      balance: '0.00000',
      icon: () => <img src="/LTC logo.png" alt="LTC" className="w-8 h-8 object-contain" />,
      color: 'from-gray-400 to-gray-500',
      nodeType: 'rpc' as const,
      syncStatus: 'disconnected' as const
    },
    {
      name: 'Monero',
      symbol: 'XMR',
      balance: '0.000000',
      icon: () => <img src="/XMR logo.png" alt="XMR" className="w-8 h-8 object-contain" />,
      color: 'from-orange-600 to-red-600',
      nodeType: 'rpc' as const,
      syncStatus: 'disconnected' as const
    },
    {
      name: 'Trollcoin',
      symbol: 'TROLL',
      balance: '0.00000',
      icon: () => <img src="/TROLL logo.png" alt="TROLL" className="w-8 h-8 object-contain" />,
      color: 'from-red-500 to-orange-500',
      nodeType: 'rpc' as const,
      syncStatus: 'disconnected' as const
    },
    {
      name: 'GHOST',
      symbol: 'GHOST',
      balance: '0.000000',
      icon: () => <img src="/GHOST logo.png" alt="GHOST" className="w-8 h-8 object-contain" />,
      color: 'from-gray-600 to-gray-700',
      nodeType: 'rpc' as const,
      syncStatus: 'disconnected' as const
    }
  ];

  // Add WATT token if connected to Altcoinchain
  const allTokens = [...chains];
  if (isConnected && chainId === 2330) {
    allTokens.push({
      name: 'WATT Token',
      symbol: 'WATT',
      chainId: 2330,
      balance: wattBalance,
      icon: () => <img src="/WATT logo.png" alt="WATT" className="w-8 h-8 object-contain" />,
      color: 'from-emerald-500 to-emerald-600',
      nodeType: 'full' as const,
      syncStatus: 'synced' as const
    });
  }

  // Calculate USD values using real prices
  const chainsWithPrices = allTokens.map(chain => {
    const priceData = prices.get(chain.symbol);
    const balanceNum = parseFloat(chain.balance.replace(',', ''));
    const usdValue = priceData && !isNaN(priceData.price) && !isNaN(balanceNum) 
      ? balanceNum * priceData.price 
      : 0;
    
    return {
      ...chain,
      usdValue: `$${usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      priceData,
      balanceNum
    };
  });

  // Calculate total portfolio value
  const balances: Record<string, number> = {};
  chainsWithPrices.forEach(chain => {
    balances[chain.symbol] = chain.balanceNum;
  });
  const totalUsdValue = getTotalValue(balances);

  // Show authentication screen if not authenticated
  if (!isAuthenticated) {
    return <WalletAuth onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h2 className="text-3xl font-bold">Universal Wallet</h2>
          <p className="text-slate-400 mt-1">Manage your multi-chain assets</p>
          {isConnected && (
            <div className="mt-2 space-y-1">
              <p className="text-sm text-yellow-400">
                Connected: {address?.slice(0, 6)}...{address?.slice(-4)} 
                {chainId === 2330 && ' (Altcoinchain)'}
              </p>
              {chainId === 2330 && (
                <div className="flex items-center space-x-4 text-xs">
                  <span className="text-emerald-400">ALT: {parseFloat(altBalance).toFixed(4)}</span>
                  <span className="text-purple-400">WATT: {parseFloat(wattBalance).toFixed(4)}</span>
                </div>
              )}
            </div>
          )}
          <div className="flex items-center space-x-4 mt-1">
            {lastUpdated && (
              <p className="text-xs text-slate-500">
                Prices updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
            <div className="flex items-center space-x-1">
              {apiConnected === true ? (
                <Wifi className="w-3 h-3 text-emerald-400" />
              ) : apiConnected === false ? (
                <WifiOff className="w-3 h-3 text-red-400" />
              ) : null}
              <span className="text-xs text-slate-500">
                {apiConnected === true ? 'Multi-API Connected' : 
                 apiConnected === false ? 'Fallback Data' : 'Connecting...'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <motion.button
            onClick={() => setShowRPCManager(true)}
            className="flex items-center space-x-2 p-2 bg-slate-900/50 rounded-lg hover:bg-slate-800/50 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Server className="w-5 h-5" />
            <span className="text-sm">RPC Nodes</span>
          </motion.button>
          <motion.button
            onClick={() => setShowBalances(!showBalances)}
            className="p-2 bg-slate-900/50 rounded-lg hover:bg-slate-800/50 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {showBalances ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </motion.button>
          <motion.button
            onClick={handleRefresh}
            disabled={isRefreshing || pricesLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors disabled:opacity-50"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RefreshCw className={`w-4 h-4 ${(isRefreshing || pricesLoading) ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Connection Status */}
      {!isConnected && (
        <motion.div
          className="bg-orange-600/20 border border-orange-500/30 rounded-xl p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-orange-400 font-medium">
            Connect your wallet to view live balances for EVM-compatible chains (ETH, ALT, WATT)
          </p>
        </motion.div>
      )}

      {/* RPC Node Notice */}
      <motion.div
        className="bg-blue-600/20 border border-blue-500/30 rounded-xl p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center space-x-2">
          <Server className="w-5 h-5 text-blue-400" />
          <p className="text-blue-400 font-medium">
            UTXO chains (BTC, LTC, XMR, GHOST, TROLL) require RPC node connections for balance and transaction management
          </p>
        </div>
      </motion.div>

      {/* Price Error Warning */}
      {pricesError && (
        <motion.div
          className="bg-red-600/20 border border-red-500/30 rounded-xl p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-400 font-medium">
              Price data may be outdated. Using fallback prices.
            </p>
          </div>
        </motion.div>
      )}

      {/* Total Balance */}
      <motion.div
        className="bg-gradient-to-r from-yellow-600/20 to-emerald-600/20 backdrop-blur-xl rounded-2xl p-6 border border-yellow-500/30"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="text-center">
          <p className="text-slate-400 text-sm">Total Portfolio Value</p>
          <h3 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-emerald-400 bg-clip-text text-transparent">
            {showBalances ? `$${totalUsdValue.toLocaleString()}` : '••••••'}
          </h3>
          {pricesLoading && (
            <p className="text-sm text-slate-500 mt-2">Updating prices...</p>
          )}
          {isAuthenticated && (
            <p className="text-sm text-emerald-400 mt-2">
              ✅ Universal wallet authenticated
            </p>
          )}
        </div>
      </motion.div>

      {/* Price Overview */}
      <motion.div
        className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Market Prices</h3>
          <div className="flex items-center space-x-2 text-sm">
            {apiConnected === true ? (
              <span className="text-emerald-400">Multi-API Average</span>
            ) : (
              <span className="text-yellow-400">Fallback Data</span>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
          {chainsWithPrices.slice(0, 7).map((chain) => {
            const change = formatChange(chain.symbol);
            const IconComponent = chain.icon;
            return (
              <div key={chain.symbol} className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-1">
                  <IconComponent />
                  <span className="font-medium">{chain.symbol}</span>
                </div>
                <p className="text-lg font-bold">
                  {formatPrice(chain.symbol, chain.symbol === 'ALT' ? 6 : 2)}
                </p>
                <div className={`flex items-center justify-center space-x-1 text-sm ${
                  change.isPositive ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {change.isPositive ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>{change.value}</span>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Node Status */}
      <NodeStatus chains={chainsWithPrices} />

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {chainsWithPrices.map((chain, index) => (
          <BalanceCard
            key={`${chain.symbol}-${chain.chainId || 'default'}`}
            chain={chain}
            showBalance={showBalances}
            index={index}
          />
        ))}
      </div>

      {/* Transaction History */}
      <TransactionHistory />

      {/* RPC Node Manager Modal */}
      <RPCNodeManager
        isOpen={showRPCManager}
        onClose={() => setShowRPCManager(false)}
      />
    </div>
  );
};

export default WalletView;