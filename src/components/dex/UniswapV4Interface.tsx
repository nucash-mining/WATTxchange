import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpDown, Settings, Zap, TrendingUp, Info, Plus, Minus, ArrowRight } from 'lucide-react';
import { swapinService } from '../../services/swapinService';
import { tokenService } from '../../services/tokenService';
import toast from 'react-hot-toast';

interface Pool {
  id: string;
  token0: string;
  token1: string;
  fee: number;
  liquidity: string;
  volume24h: string;
  apr: number;
  hooks: string[];
}

interface Position {
  id: string;
  pool: Pool;
  liquidity: string;
  token0Amount: string;
  token1Amount: string;
  uncollectedFees: string;
  inRange: boolean;
  tickLower: number;
  tickUpper: number;
}

const UniswapV4Interface: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'swap' | 'pools' | 'positions'>('swap');
  const [selectedNetwork, setSelectedNetwork] = useState(2330); // Altcoinchain
  const [fromToken, setFromToken] = useState('ALT');
  const [toToken, setToToken] = useState('WATT');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [slippage, setSlippage] = useState('0.5');
  const [showSettings, setShowSettings] = useState(false);
  const [pools, setPools] = useState<Pool[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);

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
    const mockPools: Pool[] = [
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
      }
    ];
    setPools(mockPools);
    // Load positions after pools are set
    loadPositions(mockPools);
  };

  const loadPositions = async (poolsData: Pool[]) => {
    // Mock user positions - use the provided pools data to ensure we have valid pool references
    if (poolsData.length > 0) {
      const mockPositions: Position[] = [
        {
          id: 'pos-1',
          pool: poolsData[0], // Use the first pool from the provided data
          liquidity: '12,345',
          token0Amount: '1,000',
          token1Amount: '1,500',
          uncollectedFees: '$23.45',
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
    setToAmount(calculatedAmount.toFixed(6));
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
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      // Simulate swap
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success(`Swapped ${fromAmount} ${fromToken} for ${toAmount} ${toToken}`);
      setFromAmount('');
      setToAmount('');
    } catch (error) {
      console.error('Swap failed:', error);
      toast.error('Swap failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLiquidity = () => {
    toast.success('Add liquidity interface opened');
  };

  const handleRemoveLiquidity = (positionId: string) => {
    toast.success(`Remove liquidity for position ${positionId}`);
  };

  const handleCollectFees = (positionId: string) => {
    toast.success(`Collected fees for position ${positionId}`);
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
                    <label className="block text-sm text-slate-400 mb-2">Slippage Tolerance</label>
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
                    <label className="block text-sm text-slate-400 mb-2">Transaction Deadline</label>
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
                  
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Interface Settings</label>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Expert Mode</span>
                      <input type="checkbox" className="toggle" />
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
                  <select
                    value={fromToken}
                    onChange={(e) => setFromToken(e.target.value)}
                    className="bg-slate-800 rounded px-3 py-2 outline-none"
                  >
                    {availableTokens.map(token => (
                      <option key={token.symbol} value={token.symbol}>{token.symbol}</option>
                    ))}
                  </select>
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
                  <select
                    value={toToken}
                    onChange={(e) => setToToken(e.target.value)}
                    className="bg-slate-800 rounded px-3 py-2 outline-none"
                  >
                    {availableTokens.filter(t => t.symbol !== fromToken).map(token => (
                      <option key={token.symbol} value={token.symbol}>{token.symbol}</option>
                    ))}
                  </select>
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

              {/* Swap Button */}
              <motion.button
                onClick={handleSwap}
                disabled={loading || !fromAmount || parseFloat(fromAmount) <= 0}
                className={`w-full py-4 rounded-lg font-semibold transition-colors ${
                  !loading && fromAmount && parseFloat(fromAmount) > 0
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                }`}
                whileHover={!loading && fromAmount && parseFloat(fromAmount) > 0 ? { scale: 1.02 } : {}}
                whileTap={!loading && fromAmount && parseFloat(fromAmount) > 0 ? { scale: 0.98 } : {}}
              >
                {loading ? 'Swapping...' : 'Swap Tokens'}
              </motion.button>
            </div>
          </div>
        )}

        {/* Pools Interface */}
        {activeTab === 'pools' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Liquidity Pools</h3>
              <motion.button
                onClick={handleAddLiquidity}
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
                <motion.div
                  key={pool.id}
                  className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -2 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold">
                          {pool.token0?.charAt(0) || 'T'}
                        </div>
                        <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-xs font-bold -ml-2">
                          {pool.token1?.charAt(0) || 'T'}
                        </div>
                      </div>
                      <h4 className="font-semibold">{pool.token0}/{pool.token1}</h4>
                      <span className="text-xs bg-slate-700/50 px-2 py-1 rounded">
                        {pool.fee}%
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 text-emerald-400">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm font-medium">{pool.apr}%</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400 text-sm">Liquidity</span>
                      <span className="font-medium">{pool.liquidity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 text-sm">24h Volume</span>
                      <span className="font-medium">{pool.volume24h}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 text-sm">Hooks</span>
                      <div className="flex flex-wrap justify-end gap-1">
                        {pool.hooks.map((hook, i) => (
                          <span key={i} className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                            {hook}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2 mt-4">
                    <motion.button
                      className="flex-1 py-2 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg text-sm font-medium transition-colors border border-blue-500/30"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Add
                    </motion.button>
                    <motion.button
                      className="flex-1 py-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-sm font-medium transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Details
                    </motion.button>
                  </div>
                </motion.div>
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
                onClick={handleAddLiquidity}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Plus className="w-4 h-4" />
                <span>New Position</span>
              </motion.button>
            </div>

            {positions.length === 0 ? (
              <div className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-12 border border-slate-700/50 text-center">
                <Info className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold mb-2">No active positions</h4>
                <p className="text-slate-400 mb-6">Add liquidity to get started</p>
                <motion.button
                  onClick={handleAddLiquidity}
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
                  <motion.div
                    key={position.id}
                    className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold">
                            {position.pool?.token0?.charAt(0) || 'T'}
                          </div>
                          <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-xs font-bold -ml-2">
                            {position.pool?.token1?.charAt(0) || 'T'}
                          </div>
                        </div>
                        <h4 className="font-semibold">{position.pool?.token0 || 'TOKEN0'}/{position.pool?.token1 || 'TOKEN1'}</h4>
                        <span className="text-xs bg-slate-700/50 px-2 py-1 rounded">
                          {position.pool?.fee || 0}%
                        </span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        position.inRange 
                          ? 'bg-emerald-500/20 text-emerald-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {position.inRange ? 'In Range' : 'Out of Range'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-slate-400 text-sm">Liquidity</p>
                        <p className="font-bold">{position.liquidity}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm">Uncollected Fees</p>
                        <p className="font-bold text-emerald-400">{position.uncollectedFees}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm">{position.pool?.token0 || 'TOKEN0'}</p>
                        <p className="font-bold">{position.token0Amount}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm">{position.pool?.token1 || 'TOKEN1'}</p>
                        <p className="font-bold">{position.token1Amount}</p>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <motion.button
                        onClick={() => handleCollectFees(position.id)}
                        className="flex-1 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 rounded-lg text-sm font-medium transition-colors border border-emerald-500/30"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Collect Fees
                      </motion.button>
                      <motion.button
                        onClick={() => handleAddLiquidity()}
                        className="flex-1 py-2 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg text-sm font-medium transition-colors border border-blue-500/30"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Plus className="w-4 h-4 inline mr-1" />
                        Add
                      </motion.button>
                      <motion.button
                        onClick={() => handleRemoveLiquidity(position.id)}
                        className="flex-1 py-2 bg-red-600/20 hover:bg-red-600/30 rounded-lg text-sm font-medium transition-colors border border-red-500/30"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Minus className="w-4 h-4 inline mr-1" />
                        Remove
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Uniswap V4 Features */}
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
            <h3 className="text-lg font-semibold text-blue-400 mb-2">Uniswap V4 Features</h3>
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
            <div className="mt-4 text-xs text-slate-400">
              <p>• Powered by Swapin.co's Uniswap V4 compatible contracts</p>
              <p>• Factory: {currentNetwork?.contracts.factory}</p>
              <p>• Router: {currentNetwork?.contracts.router}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default UniswapV4Interface;