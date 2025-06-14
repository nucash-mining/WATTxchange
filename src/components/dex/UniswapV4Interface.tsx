import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpDown, Settings, Zap, TrendingUp, Info, Plus, Minus, ArrowRight, RefreshCw, Wallet, AlertTriangle } from 'lucide-react';
import { swapinService } from '../../services/swapinService';
import { tokenService } from '../../services/tokenService';
import { useWallet } from '../../hooks/useWallet';
import { useDeviceDetect } from '../../hooks/useDeviceDetect';
import TokenSelector from './TokenSelector';
import PriceChart from './PriceChart';
import PoolCard from './PoolCard';
import PositionCard from './PositionCard';
import AddLiquidityModal from './AddLiquidityModal';
import RemoveLiquidityModal from './RemoveLiquidityModal';
import toast from 'react-hot-toast';

const SwapinV2Interface: React.FC = () => {
  const { isConnected, address, chainId, switchToAltcoinchain, signTransaction } = useWallet();
  const { isMobile } = useDeviceDetect();
  const [activeTab, setActiveTab] = useState<'swap' | 'pools' | 'positions'>('swap');
  const [selectedNetwork, setSelectedNetwork] = useState(2330); // Altcoinchain
  const [fromToken, setFromToken] = useState('ALT');
  const [toToken, setToToken] = useState('WATT');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [slippage, setSlippage] = useState('0.5');
  const [showSettings, setShowSettings] = useState(false);
  const [pools, setPools] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddLiquidityModal, setShowAddLiquidityModal] = useState(false);
  const [showRemoveLiquidityModal, setShowRemoveLiquidityModal] = useState(false);
  const [selectedPool, setSelectedPool] = useState<any>(null);
  const [selectedPosition, setSelectedPosition] = useState<any>(null);
  const [isSwapping, setIsSwapping] = useState(false);

  const networks = swapinService.getAllNetworks();
  const currentNetwork = networks.find(n => n.chainId === selectedNetwork);
  const availableTokens = tokenService.getTokensForChain(currentNetwork?.name || 'ALT');

  useEffect(() => {
    loadPools();
  }, [selectedNetwork]);

  useEffect(() => {
    if (fromAmount && fromToken && toToken) {
      calculateSwapAmount();
    }
  }, [fromAmount, fromToken, toToken]);

  const loadPools = async () => {
    // Mock V4 pools with hooks
    const mockPools = [
      {
        id: 'alt-watt-0.3',
        token0: 'ALT',
        token1: 'WATT',
        fee: 0.3,
        liquidity: '1,234,567',
        volume24h: '$45,678',
        apr: 24.5,
        hooks: ['Dynamic Fee', 'MEV Protection']
      },
      {
        id: 'alt-usdt-0.05',
        token0: 'ALT',
        token1: 'USDT',
        fee: 0.05,
        liquidity: '2,345,678',
        volume24h: '$123,456',
        apr: 18.2,
        hooks: ['TWAMM', 'Limit Orders']
      },
      {
        id: 'watt-usdt-0.3',
        token0: 'WATT',
        token1: 'USDT',
        fee: 0.3,
        liquidity: '987,654',
        volume24h: '$67,890',
        apr: 32.1,
        hooks: ['Volatility Oracle', 'Auto-Compound']
      },
      {
        id: 'altpepe-altpepi-0.3',
        token0: 'AltPEPE',
        token1: 'AltPEPI',
        fee: 0.3,
        liquidity: '456,789',
        volume24h: '$34,567',
        apr: 38.5,
        hooks: ['Dynamic Fee', 'MEV Protection']
      },
      {
        id: 'altpepe-walt-0.3',
        token0: 'AltPEPE',
        token1: 'wALT',
        fee: 0.3,
        liquidity: '345,678',
        volume24h: '$23,456',
        apr: 32.7,
        hooks: ['TWAMM', 'Limit Orders']
      },
      {
        id: 'scam-walt-0.3',
        token0: 'SCAM',
        token1: 'wALT',
        fee: 0.3,
        liquidity: '234,567',
        volume24h: '$12,345',
        apr: 45.2,
        hooks: ['Volatility Oracle', 'Auto-Compound']
      }
    ];
    setPools(mockPools);
    
    // Load positions after pools are set
    loadPositions(mockPools);
  };

  const loadPositions = async (poolsData: any[]) => {
    // Mock user positions - use the provided pools data to ensure we have valid pool references
    if (poolsData.length > 0) {
      const mockPositions = [
        {
          id: 'pos-1',
          pool: poolsData[0], // ALT-WATT pool
          liquidity: '12,345',
          token0Amount: '1,000',
          token1Amount: '1,500',
          uncollectedFees: '$23.45',
          inRange: true,
          tickLower: -887220,
          tickUpper: 887220
        },
        {
          id: 'pos-2',
          pool: poolsData[1], // ALT-USDT pool
          liquidity: '34,567',
          token0Amount: '2,500',
          token1Amount: '432.50',
          uncollectedFees: '$45.67',
          inRange: true,
          tickLower: -887220,
          tickUpper: 887220
        }
      ];
      setPositions(mockPositions);
    } else {
      setPositions([]);
    }
  };

  const calculateSwapAmount = async () => {
    // Simulate price calculation
    const rate = fromToken === 'ALT' && toToken === 'WATT' ? 1.5 : 
                 fromToken === 'WATT' && toToken === 'ALT' ? 0.67 : 1;
    
    const calculatedAmount = parseFloat(fromAmount) * rate;
    if (!isNaN(calculatedAmount)) {
      setToAmount(calculatedAmount.toFixed(6));
    } else {
      setToAmount('');
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

    // Check if user is on the correct network
    if (chainId !== selectedNetwork) {
      try {
        const switched = await switchToAltcoinchain();
        if (!switched) {
          toast.error('Please switch to Altcoinchain network');
          return;
        }
      } catch (error) {
        toast.error('Failed to switch network');
        return;
      }
    }

    setIsSwapping(true);
    
    try {
      // Create transaction details for signing
      const transactionDetails = {
        type: 'swap',
        fromToken,
        toToken,
        fromAmount,
        toAmount,
        slippage
      };

      // Request permission to sign the transaction
      const signed = await signTransaction(transactionDetails);
      
      if (signed) {
        toast.success('Swap completed successfully!');
        setFromAmount('');
        setToAmount('');
      } else {
        toast.error('Transaction cancelled or failed');
      }
    } catch (error) {
      console.error('Swap failed:', error);
      toast.error('Swap failed');
    } finally {
      setIsSwapping(false);
    }
  };

  const handleAddLiquidity = (pool?: any) => {
    setSelectedPool(pool);
    setShowAddLiquidityModal(true);
  };

  const handleRemoveLiquidity = (position: any) => {
    setSelectedPosition(position);
    setShowRemoveLiquidityModal(true);
  };

  const handleCollectFees = async (position: any) => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    // Check if user is on the correct network
    if (chainId !== selectedNetwork) {
      try {
        const switched = await switchToAltcoinchain();
        if (!switched) {
          toast.error('Please switch to Altcoinchain network');
          return;
        }
      } catch (error) {
        toast.error('Failed to switch network');
        return;
      }
    }

    setLoading(true);
    
    try {
      // Create transaction details for signing
      const transactionDetails = {
        type: 'collectFees',
        positionId: position.id,
        token0: position.pool.token0,
        token1: position.pool.token1,
        fees: position.uncollectedFees
      };

      // Request permission to sign the transaction
      const signed = await signTransaction(transactionDetails);
      
      if (signed) {
        toast.success(`Collected ${position.uncollectedFees} in fees`);
        
        // Update positions to show fees as collected
        setPositions(positions.map(p => 
          p.id === position.id ? { ...p, uncollectedFees: '$0.00' } : p
        ));
      } else {
        toast.error('Transaction cancelled or failed');
      }
    } catch (error) {
      console.error('Failed to collect fees:', error);
      toast.error('Failed to collect fees');
    } finally {
      setLoading(false);
    }
  };

  const handleTrade = (token0: string, token1: string) => {
    setActiveTab('swap');
    setFromToken(token0);
    setToToken(token1);
    setFromAmount('');
    setToAmount('');
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
              onClick={() => setSelectedNetwork(network.chainId)}
              className={`flex items-center justify-center space-x-2 p-3 rounded-lg transition-colors ${
                selectedNetwork === network.chainId
                  ? 'bg-blue-600/20 border border-blue-500/30 text-blue-400'
                  : 'bg-slate-700/50 hover:bg-slate-600/50 text-slate-300'
              }`}
            >
              <span className="text-xl">{
                network.name === 'EGAZ' ? '⚡' :
                network.name === 'PlanQ' ? '🌐' :
                network.name === 'OctaSpace' ? '🐙' :
                network.name === 'PartyChain' ? '🎉' :
                network.name === 'EGEM' ? '💎' :
                network.name === 'ETHO' ? '🔷' :
                network.name === 'Altcoinchain' ? '🔗' :
                network.name === 'DOGEchain' ? '🐕' :
                network.name === 'Fantom' ? '👻' : '🌍'
              }</span>
              <span>{network.name}</span>
            </button>
          ))}
        </div>
      </div>

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
        {/* Swap Interface */}
        {activeTab === 'swap' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Swap Form */}
            <div className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
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
                    <span className="text-sm text-slate-400">Balance: 0.00</span>
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
                      chainId={selectedNetwork}
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
                    <span className="text-sm text-slate-400">Balance: 0.00</span>
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
                      chainId={selectedNetwork}
                    />
                  </div>
                </div>

                {/* Swap Details */}
                {fromAmount && toAmount && (
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
                      <span className="text-slate-400">Network Fee</span>
                      <span>~$0.50</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Route</span>
                      <div className="flex items-center space-x-1">
                        <span>{fromToken}</span>
                        <ArrowRight className="w-3 h-3" />
                        <span>{toToken}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Transaction Signing Notice */}
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5" />
                    <p className="text-xs text-yellow-400">
                      Swapping tokens requires signing a transaction with your wallet. Please review all details before confirming.
                    </p>
                  </div>
                </div>

                {/* Swap Button */}
                <motion.button
                  onClick={handleSwap}
                  disabled={isSwapping || !fromAmount || parseFloat(fromAmount) <= 0}
                  className={`w-full py-4 rounded-lg font-semibold transition-colors ${
                    !isSwapping && fromAmount && parseFloat(fromAmount) > 0
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  }`}
                  whileHover={!isSwapping && fromAmount && parseFloat(fromAmount) > 0 ? { scale: 1.02 } : {}}
                  whileTap={!isSwapping && fromAmount && parseFloat(fromAmount) > 0 ? { scale: 0.98 } : {}}
                >
                  {!isConnected ? (
                    <>
                      <Wallet className="w-5 h-5 inline mr-2" />
                      Connect Wallet
                    </>
                  ) : isSwapping ? (
                    <>
                      <RefreshCw className="w-5 h-5 inline mr-2 animate-spin" />
                      Signing Transaction...
                    </>
                  ) : (
                    'Swap Tokens'
                  )}
                </motion.button>
              </div>
            </div>

            {/* Price Chart */}
            <div className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
              <h3 className="text-lg font-semibold mb-4">Price Chart</h3>
              <div className="flex space-x-2 mb-4">
                {['15m', '1H', '4H', '1D', '1W'].map((timeframe) => (
                  <button
                    key={timeframe}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      timeframe === '1D'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                    }`}
                  >
                    {timeframe}
                  </button>
                ))}
              </div>
              
              <PriceChart 
                symbol={`${fromToken}/${toToken}`} 
                timeframe="1D"
                height={isMobile ? 200 : 300}
              />
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pools.map((pool, index) => (
                <PoolCard
                  key={pool.id}
                  pool={pool}
                  onAddLiquidity={() => handleAddLiquidity(pool)}
                  onTrade={(token0, token1) => handleTrade(token0, token1)}
                />
              ))}
            </div>
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
              <div className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-12 border border-slate-700/50 text-center">
                <Wallet className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold mb-2">Connect Wallet</h4>
                <p className="text-slate-400 mb-6">Connect your wallet to view your liquidity positions</p>
                <motion.button
                  onClick={() => {
                    // This will trigger the wallet connect flow
                    if (window.ethereum) {
                      window.ethereum.request({ method: 'eth_requestAccounts' });
                    } else {
                      toast.error('No wallet detected. Please install MetaMask or another Web3 wallet.');
                    }
                  }}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {positions.map((position) => (
                  <PositionCard
                    key={position.id}
                    position={position}
                    onCollectFees={handleCollectFees}
                    onAddLiquidity={(pool) => handleAddLiquidity(pool)}
                    onRemoveLiquidity={handleRemoveLiquidity}
                  />
                ))}
              </div>
            )}

            {/* Transaction Signing Notice */}
            {positions.length > 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                  <div>
                    <p className="text-yellow-400 font-medium">Transaction Signing Required</p>
                    <p className="text-sm text-slate-300 mt-1">
                      Managing liquidity positions requires signing transactions with your wallet. You'll need to confirm
                      transactions when adding liquidity, removing liquidity, or collecting fees.
                    </p>
                  </div>
                </div>
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
                <h4 className="font-semibold text-purple-400 mb-2">Hooks</h4>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>• Dynamic fee adjustment</li>
                  <li>• Time-weighted AMMs</li>
                  <li>• Limit orders</li>
                  <li>• Custom trading logic</li>
                </ul>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-emerald-400 mb-2">Singleton Architecture</h4>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>• Gas-efficient swaps</li>
                  <li>• Shared liquidity</li>
                  <li>• Reduced deployment costs</li>
                  <li>• Improved capital efficiency</li>
                </ul>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-400 mb-2">Flash Accounting</h4>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>• Optimized token transfers</li>
                  <li>• Reduced gas costs</li>
                  <li>• Improved MEV protection</li>
                  <li>• Better swap execution</li>
                </ul>
              </div>
            </div>
            {!isMobile && (
              <div className="mt-4 text-xs text-slate-400">
                <p>• Powered by Swapin.co's Uniswap V4 compatible contracts</p>
                <p>• Factory: {currentNetwork?.contracts.factory}</p>
                <p>• Router: {currentNetwork?.contracts.router}</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Add Liquidity Modal */}
      <AddLiquidityModal
        isOpen={showAddLiquidityModal}
        onClose={() => setShowAddLiquidityModal(false)}
        selectedPool={selectedPool}
      />

      {/* Remove Liquidity Modal */}
      <RemoveLiquidityModal
        isOpen={showRemoveLiquidityModal}
        onClose={() => setShowRemoveLiquidityModal(false)}
        position={selectedPosition}
      />
    </div>
  );
};

export default SwapinV2Interface;