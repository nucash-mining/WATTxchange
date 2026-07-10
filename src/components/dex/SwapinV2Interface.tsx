import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowUpDown, 
  Settings, 
  Zap, 
  TrendingUp, 
  Info, 
  Plus, 
  Minus, 
  ArrowRight, 
  ChevronDown, 
  ChevronUp,
  Percent,
  Wallet,
  AlertTriangle
} from 'lucide-react';
import { useWallet } from '../../hooks/useWallet';
import { swapinService } from '../../services/swapinService';
import { ammV2Service } from '../../services/ammV2Service';
import PriceChart from './PriceChart';
import PoolCard from './PoolCard';
import PositionCard from './PositionCard';
import AddLiquidityModal from './AddLiquidityModal';
import RemoveLiquidityModal from './RemoveLiquidityModal';
import toast from 'react-hot-toast';
import TokenSelector from './TokenSelector';

const SwapinV2Interface: React.FC = () => {
  const { isConnected, address, chainId, signer, switchToAltcoinchain, connectWallet, getTokenBalance } = useWallet();
  const [activeTab, setActiveTab] = useState<'swap' | 'pools' | 'positions'>('swap');
  const [selectedNetwork, setSelectedNetwork] = useState<number | null>(null);
  const [selectedMarket, setSelectedMarket] = useState<string>('ALT-WATT');
  const [fromToken, setFromToken] = useState<string>('ALT');
  const [toToken, setToToken] = useState<string>('WATT');
  const [fromAmount, setFromAmount] = useState<string>('');
  const [toAmount, setToAmount] = useState<string>('');
  const [slippage, setSlippage] = useState<string>('0.5');
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [pools, setPools] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddLiquidityModal, setShowAddLiquidityModal] = useState(false);
  const [showRemoveLiquidityModal, setShowRemoveLiquidityModal] = useState(false);
  const [selectedPool, setSelectedPool] = useState<any>(null);
  const [selectedPosition, setSelectedPosition] = useState<any>(null);
  const [isSwapping, setIsSwapping] = useState(false);
  const [quoteRoute, setQuoteRoute] = useState<string[] | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [midRate, setMidRate] = useState<number | undefined>(undefined);

  // Live mid rate for the selected pair (1 fromToken -> ? toToken), feeds the chart.
  useEffect(() => {
    let cancelled = false;
    setMidRate(undefined);
    if (!fromToken || !toToken || fromToken === toToken) return;
    ammV2Service
      .quote(fromToken, toToken, '1')
      .then((q) => {
        if (!cancelled) setMidRate(parseFloat(q.amountOut));
      })
      .catch(() => {
        /* no route — chart falls back to priceService */
      });
    return () => {
      cancelled = true;
    };
  }, [fromToken, toToken]);


  const networks = swapinService.getAllNetworks();
  const currentNetwork = networks.find(n => n.chainId === selectedNetwork);

  // Initialize with the first network
  useEffect(() => {
    if (networks.length > 0 && !selectedNetwork) {
      setSelectedNetwork(networks[0].chainId);
    }
  }, [networks]);

  // Load pools and positions when network changes
  useEffect(() => {
    if (selectedNetwork) {
      loadPools();
      loadPositions();
    }
  }, [selectedNetwork]);

  // Update token amounts when input changes (debounced; on-chain quote per change)
  useEffect(() => {
    if (!(fromAmount && parseFloat(fromAmount) > 0 && fromToken && toToken)) {
      setToAmount('');
      setQuoteRoute(null);
      setQuoteError(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const q = await ammV2Service.quote(fromToken, toToken, fromAmount);
        if (cancelled) return;
        setToAmount(parseFloat(q.amountOut).toFixed(6));
        setQuoteRoute(q.pathSymbols);
        setQuoteError(null);
      } catch (error: any) {
        if (cancelled) return;
        console.error('Quote failed:', error);
        setToAmount('');
        setQuoteRoute(null);
        setQuoteError(
          /No liquidity route/i.test(error?.message || '')
            ? `No liquidity route for ${fromToken} → ${toToken}`
            : 'Quote unavailable (RPC error)'
        );
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [fromAmount, fromToken, toToken]);

  const loadPools = async () => {
    try {
      const poolsData = await ammV2Service.getPools();
      setPools(poolsData.map(pool => ({
        id: pool.pairAddress,
        token0: pool.token0,
        token1: pool.token1,
        fee: 0.3,
        liquidity: `${parseFloat(pool.reserve0).toLocaleString(undefined, { maximumFractionDigits: 0 })} ${pool.token0} / ${parseFloat(pool.reserve1).toLocaleString(undefined, { maximumFractionDigits: 0 })} ${pool.token1}`,
        volume24h: '—',
        apr: 0,
        hooks: []
      })));
    } catch (error) {
      console.error('Failed to load pools:', error);
      toast.error('Failed to load pools');
    }
  };

  const loadPositions = async () => {
    try {
      if (!isConnected || !address) {
        setPositions([]);
        return;
      }
      const onchain = await ammV2Service.getPositions(address);
      setPositions(onchain.map(pos => ({
        id: pos.pairAddress,
        pool: {
          id: pos.pairAddress,
          token0: pos.token0,
          token1: pos.token1,
          fee: 0.3,
          liquidity: '—',
          volume24h: '—',
          apr: 0,
          hooks: []
        },
        liquidity: parseFloat(pos.lpBalance).toFixed(6),
        token0Amount: pos.token0Amount,
        token1Amount: pos.token1Amount,
        uncollectedFees: '—',
        inRange: true,
        tickLower: 0,
        tickUpper: 0
      })));
    } catch (error) {
      console.error('Failed to load positions:', error);
      toast.error('Failed to load positions');
    }
  };

  const handleSwapTokens = () => {
    const tempToken = fromToken;
    const tempAmount = fromAmount;
    setFromToken(toToken);
    setToToken(tempToken);
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  };

  const handleSwap = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (quoteError || !toAmount) {
      toast.error(quoteError || 'No quote available');
      return;
    }

    if (!signer) {
      toast.error('Wallet signer unavailable — reconnect your wallet');
      return;
    }

    // Live trading runs on Altcoinchain; prompt a network switch if needed.
    if (chainId !== 2330) {
      const switched = await switchToAltcoinchain();
      if (!switched) {
        toast.error('Please switch your wallet to Altcoinchain (2330)');
        return;
      }
    }

    setIsSwapping(true);
    try {
      const txHash = await ammV2Service.swap(
        signer,
        fromToken,
        toToken,
        fromAmount,
        parseFloat(slippage) || 0.5
      );
      toast.success(`Swap confirmed: ${txHash.slice(0, 10)}…`);
      setFromAmount('');
      setToAmount('');
    } catch (error: any) {
      console.error('Swap failed:', error);
      const msg = error?.shortMessage || error?.reason || error?.message || '';
      toast.error(
        /user rejected|denied/i.test(msg) ? 'Swap cancelled in wallet' : `Swap failed: ${msg.slice(0, 120)}`
      );
    } finally {
      setIsSwapping(false);
    }
  };

  const handleAddLiquidity = (pool?: any) => {
    if (pool) {
      setSelectedPool(pool);
    } else {
      setSelectedPool(null);
    }
    setShowAddLiquidityModal(true);
  };

  const handleRemoveLiquidity = (position: any) => {
    setSelectedPosition(position);
    setShowRemoveLiquidityModal(true);
  };

  const handleCollectFees = (position: any) => {
    toast.success(`Collected ${position.uncollectedFees} in fees`);
  };

  const handleNetworkChange = async (chainId: number) => {
    try {
      const success = await swapinService.switchToNetwork(chainId);
      if (success) {
        setSelectedNetwork(chainId);
        toast.success(`Switched to ${networks.find(n => n.chainId === chainId)?.name}`);
      } else {
        toast.error(`Failed to switch to network`);
      }
    } catch (error) {
      console.error('Network switch error:', error);
      toast.error('Failed to switch network');
    }
  };

  return (
    <div className="space-y-6">
      {/* Network Selection */}
      <div className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Select Network</h3>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">Powered by Swapin.co</span>
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {networks.map(network => (
            <button
              key={network.chainId}
              onClick={() => handleNetworkChange(network.chainId)}
              className={`flex items-center justify-center space-x-2 p-3 rounded-lg transition-colors ${
                selectedNetwork === network.chainId
                  ? 'bg-blue-600/20 border border-blue-500/30 text-blue-400'
                  : 'bg-slate-700/50 hover:bg-slate-600/50 text-slate-300'
              }`}
            >
              {(() => {
                const logos: Record<string, string> = {
                  'Altcoinchain': 'Altcoinchain logo.png', 'ETHO': 'ETHO logo.png',
                  'OctaSpace': 'OCTA logo.png', 'Ethereum': 'ETH logo.png', 'DOGEchain': 'DOGEchain logo.png',
                };
                const colors: Record<string, string> = {
                  'EGAZ': 'bg-yellow-500', 'PlanQ': 'bg-teal-500', 'PartyChain': 'bg-pink-500',
                  'EGEM': 'bg-emerald-500', 'Fantom': 'bg-blue-600', 'BSC': 'bg-yellow-600',
                  'Polygon': 'bg-purple-600', 'Avalanche': 'bg-red-500', 'Arbitrum': 'bg-blue-400',
                  'Optimism': 'bg-red-400', 'Base': 'bg-blue-500',
                };
                const logo = logos[network.name];
                return logo
                  ? <img src={`${import.meta.env.BASE_URL}${logo}`} alt={network.name} className="w-6 h-6 object-contain rounded-full" />
                  : <div className={`w-6 h-6 rounded-full ${colors[network.name] || 'bg-slate-600'} flex items-center justify-center text-white text-[10px] font-bold uppercase`}>{network.name.slice(0, 3)}</div>;
              })()}
              <span>{network.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Wallet Connection Notice */}
      {!isConnected && (
        <motion.div
          className="bg-yellow-600/20 border border-yellow-500/30 rounded-xl p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              <p className="text-yellow-400">
                Connect your wallet to access all Swapin V2 features
              </p>
            </div>
            <motion.button
              onClick={connectWallet}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Connect Wallet
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center space-x-2 bg-slate-800/50 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('swap')}
          className={`px-4 py-2 rounded-md transition-colors ${
            activeTab === 'swap'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Swap
        </button>
        <button
          onClick={() => setActiveTab('pools')}
          className={`px-4 py-2 rounded-md transition-colors ${
            activeTab === 'pools'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Pools
        </button>
        <button
          onClick={() => setActiveTab('positions')}
          className={`px-4 py-2 rounded-md transition-colors ${
            activeTab === 'positions'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Positions
        </button>
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Swap Interface — chart left-center, swap card right */}
        {activeTab === 'swap' && (
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
          <div className="xl:col-span-3 order-2 xl:order-1">
            <PriceChart symbol={`${fromToken}/${toToken}`} livePrice={midRate} />
          </div>
          <div className="xl:col-span-2 order-1 xl:order-2 bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Swap Tokens</h3>
              <motion.button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Settings className="w-4 h-4" />
              </motion.button>
            </div>

            {showSettings && (
              <motion.div
                className="mb-6 p-4 bg-slate-900/50 rounded-lg border border-slate-700/30"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">Slippage Tolerance</label>
                    <div className="flex space-x-2">
                      {['0.1', '0.5', '1.0'].map((value) => (
                        <button
                          key={value}
                          onClick={() => setSlippage(value)}
                          className={`px-3 py-1 rounded text-sm transition-colors ${
                            slippage === value
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-700 hover:bg-slate-600'
                          }`}
                        >
                          {value}%
                        </button>
                      ))}
                      <input
                        type="number"
                        value={slippage}
                        onChange={(e) => setSlippage(e.target.value)}
                        className="px-2 py-1 bg-slate-700 rounded text-sm w-16"
                        step="0.1"
                        min="0.1"
                        max="50"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Transaction Deadline</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        defaultValue="30"
                        className="px-2 py-1 bg-slate-700 rounded text-sm w-16"
                        min="1"
                      />
                      <span className="text-sm text-slate-400">minutes</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="space-y-4">
              {/* From Token */}
              <div className="bg-slate-900/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">From</span>
                  <span className="text-sm text-slate-400">Balance: {parseFloat(getTokenBalance(fromToken)).toFixed(4)}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    value={fromAmount}
                    onChange={(e) => setFromAmount(e.target.value)}
                    placeholder="0.0"
                    className="flex-1 bg-transparent text-2xl font-bold outline-none"
                  />
                  
                  <TokenSelector
                    selectedToken={fromToken}
                    onSelectToken={setFromToken}
                    excludeToken={toToken}
                    chainId={selectedNetwork || 2330}
                  />
                </div>
              </div>

              {/* Swap Button */}
              <div className="flex justify-center">
                <motion.button
                  onClick={handleSwapTokens}
                  className="p-3 bg-slate-700/50 hover:bg-slate-600/50 rounded-full transition-colors"
                  whileHover={{ scale: 1.1, rotate: 180 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <ArrowUpDown className="w-5 h-5" />
                </motion.button>
              </div>

              {/* To Token */}
              <div className="bg-slate-900/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">To</span>
                  <span className="text-sm text-slate-400">Balance: {parseFloat(getTokenBalance(toToken)).toFixed(4)}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    value={toAmount}
                    onChange={(e) => setToAmount(e.target.value)}
                    placeholder="0.0"
                    className="flex-1 bg-transparent text-2xl font-bold outline-none"
                    readOnly
                  />
                  
                  <TokenSelector
                    selectedToken={toToken}
                    onSelectToken={setToToken}
                    excludeToken={fromToken}
                    chainId={selectedNetwork || 2330}
                  />
                </div>
              </div>

              {/* Quote error */}
              {quoteError && fromAmount && (
                <div className="bg-red-600/10 border border-red-500/30 rounded-lg p-3 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span className="text-sm text-red-400">{quoteError}</span>
                </div>
              )}

              {/* Swap Details */}
              {fromAmount && toAmount && !quoteError && (
                <div className="bg-slate-900/50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Rate</span>
                    <span>1 {fromToken} = {(parseFloat(toAmount) / parseFloat(fromAmount)).toFixed(6)} {toToken}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Slippage</span>
                    <span>{slippage}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Route</span>
                    <div className="flex items-center space-x-1">
                      {(quoteRoute ?? [fromToken, toToken]).map((sym, i, arr) => (
                        <React.Fragment key={`${sym}-${i}`}>
                          <span>{sym}</span>
                          {i < arr.length - 1 && <ArrowRight className="w-3 h-3" />}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Swap Button */}
              {(() => {
                const canSwap = !isSwapping && !!fromAmount && parseFloat(fromAmount) > 0 &&
                  isConnected && !!toAmount && !quoteError;
                return (
                  <motion.button
                    onClick={handleSwap}
                    disabled={!canSwap}
                    className={`w-full py-4 rounded-lg font-semibold transition-colors ${
                      canSwap
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    }`}
                    whileHover={canSwap ? { scale: 1.02 } : {}}
                    whileTap={canSwap ? { scale: 0.98 } : {}}
                  >
                    {!isConnected ? 'Connect Wallet' :
                     isSwapping ? 'Confirming Transaction…' :
                     quoteError ? 'No Route' :
                     'Swap Tokens'}
                  </motion.button>
                );
              })()}
            </div>
          </div>
          </div>
        )}

        {/* Pools Interface */}
        {activeTab === 'pools' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Liquidity Pools</h3>
              <motion.button
                onClick={() => handleAddLiquidity()}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Plus className="w-4 h-4" />
                <span>Add Liquidity</span>
              </motion.button>
            </div>

            {!isConnected ? (
              <div className="bg-yellow-600/20 border border-yellow-500/30 rounded-xl p-6 text-center">
                <Wallet className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold mb-2">Connect Wallet to View Pools</h4>
                <p className="text-slate-400 mb-6">Connect your wallet to view and manage your liquidity positions</p>
                <motion.button
                  onClick={connectWallet}
                  className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-medium transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Connect Wallet
                </motion.button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pools.map((pool, index) => (
                  <PoolCard
                    key={pool.id}
                    pool={pool}
                    onAddLiquidity={() => handleAddLiquidity(pool)}
                    onTrade={(token0, token1) => {
                      setFromToken(token0);
                      setToToken(token1);
                      setActiveTab('swap');
                    }}
                  />
                ))}
              </div>
            )}

            {/* Price Chart */}
            <PriceChart symbol={`${fromToken}/${toToken}`} />
          </div>
        )}

        {/* Positions Interface */}
        {activeTab === 'positions' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Your Positions</h3>
              <motion.button
                onClick={() => handleAddLiquidity()}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Plus className="w-4 h-4" />
                <span>New Position</span>
              </motion.button>
            </div>

            {!isConnected ? (
              <div className="bg-yellow-600/20 border border-yellow-500/30 rounded-xl p-6 text-center">
                <Wallet className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold mb-2">Connect Wallet to View Positions</h4>
                <p className="text-slate-400 mb-6">Connect your wallet to view and manage your liquidity positions</p>
                <motion.button
                  onClick={connectWallet}
                  className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-medium transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Connect Wallet
                </motion.button>
              </div>
            ) : positions.length === 0 ? (
              <div className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-12 border border-slate-700/50 text-center">
                <Info className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold mb-2">No active positions</h4>
                <p className="text-slate-400 mb-6">Add liquidity to get started</p>
                <motion.button
                  onClick={() => handleAddLiquidity()}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Add Liquidity
                </motion.button>
              </div>
            ) : (
              <div className="space-y-6">
                {positions.map((position, index) => (
                  <PositionCard
                    key={position.id}
                    position={position}
                    onCollectFees={handleCollectFees}
                    onAddLiquidity={() => handleAddLiquidity(position.pool)}
                    onRemoveLiquidity={() => handleRemoveLiquidity(position)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Swapin V2 Features */}
      <motion.div
        className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/30 rounded-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-blue-600/20 rounded-lg">
            <Zap className="w-6 h-6 text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-400 mb-2">Swapin V2 Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-purple-400 mb-2">Automatic ALT Wrapping</h4>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>• Seamless ALT to wALT conversion</li>
                  <li>• No manual wrapping required</li>
                  <li>• Optimized gas efficiency</li>
                  <li>• Automatic unwrapping on withdrawal</li>
                </ul>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-emerald-400 mb-2">Multi-Chain Support</h4>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>• Trade across 10+ networks</li>
                  <li>• Consistent contract addresses</li>
                  <li>• Unified liquidity pools</li>
                  <li>• Cross-chain compatibility</li>
                </ul>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-400 mb-2">Advanced Trading</h4>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>• Custom slippage settings</li>
                  <li>• MEV protection</li>
                  <li>• Optimized routing</li>
                  <li>• Low fee structure</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 text-xs text-slate-400">
              <p>• Powered by Swapin.co's Uniswap V2 compatible contracts</p>
              <p>• Factory: {currentNetwork?.contracts.factory}</p>
              <p>• Router: {currentNetwork?.contracts.router}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Modals */}
      <AddLiquidityModal
        isOpen={showAddLiquidityModal}
        onClose={() => setShowAddLiquidityModal(false)}
        selectedPool={selectedPool}
      />

      <RemoveLiquidityModal
        isOpen={showRemoveLiquidityModal}
        onClose={() => setShowRemoveLiquidityModal(false)}
        position={selectedPosition}
      />
    </div>
  );
};

export default SwapinV2Interface;