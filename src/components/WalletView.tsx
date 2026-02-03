import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, RefreshCw, TrendingUp, TrendingDown, AlertCircle, Wifi, WifiOff, Server, BarChart2, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';
import { usePrices } from '../hooks/usePrices';
import { walletService } from '../services/walletService';
// import { realRPCNodeService } from '../services/realRPCNodeService';
import MoneroWalletWorking from './wallet/MoneroWalletWorking';
import NodeStatus from './wallet/NodeStatus';
import BalanceCard from './wallet/BalanceCard';
import MobileWalletCard from './mobile/MobileWalletCard';
import TransactionHistory from './wallet/TransactionHistory';
import WalletAuth from './wallet/WalletAuth';
import RPCNodeManager from './wallet/RPCNodeManager';
import TradingBotManager from './wallet/TradingBotManager';
import MoneroNodeManager from './wallet/MoneroNodeManager';
import ReceiveModal from './wallet/ReceiveModal';
import SendModal from './wallet/SendModal';
import DepositModal from './wallet/DepositModal';
// import FullGUIWalletSimple from './wallet/FullGUIWalletSimple';

const WalletView: React.FC = () => {
  const [showBalances, setShowBalances] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Start as authenticated to show normal interface
  const [showRPCManager, setShowRPCManager] = useState(false);
  const [showTradingBot, setShowTradingBot] = useState(false);
  const [showMoneroNodes, setShowMoneroNodes] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showMoneroWallet, setShowMoneroWallet] = useState(false);
  const [selectedChain, setSelectedChain] = useState<{
    id: string;
    name: string;
    symbol: string;
    balance: string;
    address: string;
    icon: string;
  } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [rpcBalances, setRpcBalances] = useState<Record<string, string>>({});
  const { isConnected, address, chainId, altBalance, wattBalance, refreshBalances, provider } = useWallet();
  
  // Fetch prices for all supported cryptocurrencies including GHOST, TROLL, HTH, and RTM
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
  } = usePrices(['ALT', 'BTC', 'ETH', 'LTC', 'XMR', 'DOGE', 'GHOST', 'TROLL', 'HTH', 'RTM']);

  // Load RPC node balances
  const loadRpcBalances = async () => {
    const balances: Record<string, string> = {};
    
    // Check for Monero wallet RPC specifically (separate from daemon connection)
    try {
      const walletRpcPorts = [18083, 18084, 18085]; // Common wallet RPC ports
      let balanceFound = false;
      
      for (const port of walletRpcPorts) {
        try {
          const response = await fetch(`http://127.0.0.1:${port}/json_rpc`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: '0',
              method: 'get_balance',
              params: { account_index: 0 }
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.result && data.result.balance !== null) {
              // Convert from atomic units to XMR
              const balance = (data.result.balance / 1e12).toFixed(12);
              balances['XMR'] = balance;
              balanceFound = true;
              console.log(`✅ Found Monero wallet balance on port ${port}: ${balance} XMR`);
              break;
            }
          }
        } catch (portError) {
          // Port not accessible, try next one
          console.log(`Port ${port} not accessible, trying next...`);
          continue;
        }
      }
      
      if (!balanceFound) {
        console.log('Monero wallet RPC not accessible on any port (18083, 18084, 18085)');
      }
    } catch (error) {
      console.error('Failed to check Monero wallet RPC:', error);
    }
    
    setRpcBalances(balances);
  };

  useEffect(() => {
    // Check if wallet service is already initialized
    if (walletService.isInitialized()) {
      setIsAuthenticated(true);
    }
    
    // Detect mobile devices
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(isMobileDevice || isSmallScreen);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Load RPC balances on mount
    loadRpcBalances();
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
      await refetchPrices();
      if (provider && address) {
        await refreshBalances(provider, address);
      }
      // Refresh RPC balances
      await loadRpcBalances();
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
            className={`${isMobile ? 'w-8 h-8' : 'w-12 h-12'} object-contain rounded-full`}
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
      icon: () => <img src="/BTC logo.png" alt="BTC" className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} object-contain`} />,
      color: 'from-orange-500 to-orange-600',
      nodeType: 'rpc' as const,
      syncStatus: 'connected' as const
    },
    {
      name: 'Ethereum',
      symbol: 'ETH',
      balance: '0.0000',
      icon: () => <img src="/ETH logo.png" alt="ETH" className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} object-contain`} />,
      color: 'from-purple-500 to-purple-600',
      nodeType: 'light' as const,
      syncStatus: 'connected' as const
    },
    {
      name: 'Litecoin',
      symbol: 'LTC',
      balance: '0.00000',
      icon: () => <img src="/LTC logo.png" alt="LTC" className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} object-contain`} />,
      color: 'from-gray-400 to-gray-500',
      nodeType: 'rpc' as const,
      syncStatus: 'disconnected' as const
    },
    {
      name: 'Monero',
      symbol: 'XMR',
      balance: rpcBalances['XMR'] || '0.000000',
      icon: () => <img src="/XMR logo.png" alt="XMR" className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} object-contain`} />,
      color: 'from-orange-600 to-red-600',
      nodeType: 'rpc' as const,
      syncStatus: rpcBalances['XMR'] ? 'connected' as const : 'disconnected' as const
    },
    {
      name: 'Trollcoin',
      symbol: 'TROLL',
      balance: '0.00000',
      icon: () => <img src="/TROLL logo.png" alt="TROLL" className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} object-contain`} />,
      color: 'from-red-500 to-orange-500',
      nodeType: 'rpc' as const,
      syncStatus: 'disconnected' as const
    },
    {
      name: 'GHOST',
      symbol: 'GHOST',
      balance: '0.000000',
      icon: () => <img src="/GHOST logo.png" alt="GHOST" className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} object-contain`} />,
      color: 'from-gray-600 to-gray-700',
      nodeType: 'rpc' as const,
      syncStatus: 'disconnected' as const
    },
    {
      name: 'Help The Homeless',
      symbol: 'HTH',
      balance: '0.000000',
      icon: () => <img src="/HTH logo.webp" alt="HTH" className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} object-contain`} />,
      color: 'from-green-600 to-yellow-500',
      nodeType: 'rpc' as const,
      syncStatus: 'disconnected' as const
    },
    {
      name: 'Raptoreum',
      symbol: 'RTM',
      balance: '0.000000',
      icon: () => <img src="/RTM logo.png" alt="RTM" className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} object-contain rounded-full`} />,
      color: 'from-red-600 to-orange-600',
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
      icon: () => <img src="/WATT logo.png" alt="WATT" className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} object-contain`} />,
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

  // Handle modals for mobile
  const handleReceive = (chain: any) => {
    setSelectedChain({
      id: chain.chainId?.toString() || '',
      name: chain.name,
      symbol: chain.symbol,
      balance: chain.balance,
      address: '',
      icon: 'default-icon'
    });
    setShowReceiveModal(true);
  };

  const handleSend = (chain: any) => {
    setSelectedChain({
      id: chain.chainId?.toString() || '',
      name: chain.name,
      symbol: chain.symbol,
      balance: chain.balance,
      address: '',
      icon: 'default-icon'
    });
    setShowSendModal(true);
  };

  const handleMore = (chain: any) => {
    setSelectedChain({
      id: chain.chainId?.toString() || '',
      name: chain.name,
      symbol: chain.symbol,
      balance: chain.balance,
      address: '',
      icon: 'default-icon'
    });
    setShowDepositModal(true);
  };

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
          <h2 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold`}>Universal Wallet</h2>
          <p className={`text-slate-400 mt-1 ${isMobile ? 'text-sm' : ''}`}>Manage your multi-chain assets</p>
          {isConnected && !isMobile && (
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
            {lastUpdated && !isMobile && (
              <p className="text-xs text-slate-500">
                Prices updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
            {!isMobile && (
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
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {!isMobile && (
            <>
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
                onClick={() => setShowTradingBot(true)}
                className="flex items-center space-x-2 p-2 bg-slate-900/50 rounded-lg hover:bg-slate-800/50 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <BarChart2 className="w-5 h-5" />
                <span className="text-sm">Trading Bot</span>
              </motion.button>
              <motion.button
                onClick={() => setShowMoneroNodes(true)}
                className="flex items-center space-x-2 p-2 bg-slate-900/50 rounded-lg hover:bg-slate-800/50 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <img src="/XMR logo.png" alt="XMR" className="w-5 h-5" />
                <span className="text-sm">Monero Nodes</span>
              </motion.button>
            </>
          )}
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
            <span className={isMobile ? 'hidden' : 'inline'}>Refresh</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Debug Info */}
      <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
        <p className="text-sm text-blue-300">
          🔧 Debug: Wallet loaded successfully! Chains: {chainsWithPrices.length}, 
          Connected: {isConnected ? 'Yes' : 'No'}, 
          Balances: {showBalances ? 'Visible' : 'Hidden'}
        </p>
      </div>

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
      {!isMobile && (
        <motion.div
          className="bg-blue-600/20 border border-blue-500/30 rounded-xl p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center space-x-2">
            <Server className="w-5 h-5 text-blue-400" />
            <p className="text-blue-400 font-medium">
              UTXO chains (BTC, LTC, XMR, GHOST, TROLL, HTH, RTM) require RPC node connections for balance and transaction management
            </p>
          </div>
        </motion.div>
      )}

      {/* Monero Wallet Notice */}
      {!rpcBalances['XMR'] && (
        <motion.div
          className="bg-orange-600/20 border border-orange-500/30 rounded-xl p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center space-x-2">
            <img src="/XMR logo.png" alt="XMR" className="w-5 h-5" />
            <div className="flex-1">
              <p className="text-orange-400 font-medium">
                Monero wallet RPC not accessible
              </p>
              <p className="text-orange-300 text-sm mt-1">
                To enable Monero transactions and view balance, start the wallet RPC server:
              </p>
              <div className="mt-2 p-2 bg-slate-800/50 rounded text-xs font-mono text-slate-300">
                <p>1. Open terminal and run:</p>
                <p className="text-yellow-400">/home/nuts/Downloads/monero_gui/monero-gui-v0.18.4.2/extras/monero-wallet-rpc --rpc-bind-ip=127.0.0.1 --rpc-bind-port=18083 --daemon-address=127.0.0.1:18081 --wallet-file=/home/nuts/Monero/wallets/nuts/nuts --disable-rpc-login --prompt-for-password</p>
                <p className="mt-1">2. Enter your wallet password when prompted</p>
                <p className="mt-1">3. Click Refresh button above</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

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
          <h3 className={`${isMobile ? 'text-3xl' : 'text-4xl'} font-bold bg-gradient-to-r from-yellow-400 to-emerald-400 bg-clip-text text-transparent`}>
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
      {!isMobile && (
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
          <div className="grid grid-cols-2 md:grid-cols-8 gap-4">
            {chainsWithPrices.slice(0, 8).map((chain) => {
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
      )}

      {/* Mobile Price Overview */}
      {isMobile && (
        <motion.div
          className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-4 border border-slate-700/50 overflow-x-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="flex space-x-4 pb-2" style={{ minWidth: 'max-content' }}>
            {chainsWithPrices.slice(0, 8).map((chain) => {
              const change = formatChange(chain.symbol);
              const IconComponent = chain.icon;
              return (
                <div key={chain.symbol} className="text-center w-20">
                  <div className="flex flex-col items-center mb-1">
                    <IconComponent />
                    <span className="font-medium text-xs">{chain.symbol}</span>
                  </div>
                  <p className="text-sm font-bold">
                    {formatPrice(chain.symbol, chain.symbol === 'ALT' ? 6 : 2)}
                  </p>
                  <div className={`flex items-center justify-center space-x-1 text-xs ${
                    change.isPositive ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {change.isPositive ? (
                      <TrendingUp className="w-2 h-2" />
                    ) : (
                      <TrendingDown className="w-2 h-2" />
                    )}
                    <span>{change.value}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Node Status */}
      {!isMobile && (
        <NodeStatus
          // Only pass the chains of nodeType 'full' or 'light', conforming to Chain[]
          chains={chainsWithPrices.filter(
            (chain) => chain.nodeType === 'full' || chain.nodeType === 'light'
          )}
        />
      )}

      {/* Balance Cards */}
      {!isMobile ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {chainsWithPrices.map((chain, index) => (
            <BalanceCard
              key={`${chain.symbol}-${chain.chainId || 'default'}`}
              chain={chain}
              showBalance={showBalances}
              index={index}
              onFullGUIClick={(chain) => {
                setSelectedChain(chain);
                if (chain.symbol === 'XMR') {
                  setShowMoneroWallet(true);
                }
              }}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {chainsWithPrices.map((chain) => (
            <MobileWalletCard
              key={`${chain.symbol}-${chain.chainId || 'default'}`}
              chain={{
                name: chain.name,
                symbol: chain.symbol,
                balance: chain.balance,
                icon: chain.icon,
                usdValue: chain.usdValue,
                color: chain.color,
                chainId: chain.chainId
              }}
              showBalance={showBalances}
              onReceive={() =>
                handleReceive({
                  id: chain.chainId?.toString() || '',
                  name: chain.name,
                  symbol: chain.symbol,
                  balance: chain.balance,
                  address: 'address' in chain && typeof chain.address === 'string' ? chain.address : '',
                  icon: 'default-icon',
                })
              }
              onSend={() => handleSend(chain)}
              onMore={() => handleMore(chain)}
            />
          ))}
        </div>
      )}

      {/* Transaction History */}
      {!isMobile && <TransactionHistory />}

      {/* Mobile Transaction History */}
      {isMobile && (
        <motion.div
          className="bg-gray-900/30 backdrop-blur-xl rounded-xl p-4 border border-gray-800"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Recent Transactions</h3>
            <button className="text-yellow-400 hover:text-yellow-300 text-xs font-medium">
              View All
            </button>
          </div>

          <div className="space-y-3">
            {[1, 2].map((_, index) => (
              <motion.div
                key={index}
                className="flex items-center justify-between p-3 bg-black/30 rounded-lg"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    index % 2 === 0 
                      ? 'bg-emerald-600/20 text-emerald-400' 
                      : 'bg-orange-600/20 text-orange-400'
                  }`}>
                    {index % 2 === 0 ? (
                      <ArrowDownLeft className="w-3 h-3" />
                    ) : (
                      <ArrowUpRight className="w-3 h-3" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm capitalize">{index % 2 === 0 ? 'Receive' : 'Send'}</p>
                    <p className="text-xs text-gray-400">
                      {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-sm">{index % 2 === 0 ? '+0.05 BTC' : '-150 ALT'}</p>
                  <p className="text-xs text-gray-400">{index % 2 === 0 ? '$2,500.00' : '$300.00'}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* RPC Node Manager Modal */}
      <RPCNodeManager
        isOpen={showRPCManager}
        onClose={() => setShowRPCManager(false)}
      />

      {/* Trading Bot Manager Modal */}
      <TradingBotManager
        isOpen={showTradingBot}
        onClose={() => setShowTradingBot(false)}
      />

      {/* Monero Node Manager Modal */}
      <MoneroNodeManager
        isOpen={showMoneroNodes}
        onClose={() => setShowMoneroNodes(false)}
      />

      {/* Mobile Modals */}
      {selectedChain && (
        <>
          <ReceiveModal
            isOpen={showReceiveModal}
            onClose={() => setShowReceiveModal(false)}
            chainSymbol={selectedChain.symbol}
          />

          <SendModal
            isOpen={showSendModal}
            onClose={() => setShowSendModal(false)}
            chainSymbol={selectedChain.symbol}
            balance={selectedChain.balance}
          />

          <DepositModal
            isOpen={showDepositModal}
            onClose={() => setShowDepositModal(false)}
            chainSymbol={selectedChain.symbol}
          />
        </>
      )}

      {/* Monero Wallet */}
      {showMoneroWallet && selectedChain && selectedChain.symbol === 'XMR' && (
        <MoneroWalletWorking
          onClose={() => setShowMoneroWallet(false)}
        />
      )}

    </div>
  );
};

export default WalletView;