import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpDown, Settings, Zap, TrendingUp, Info, Plus, Minus, ArrowRight, ChevronDown, ChevronUp, Percent, Wallet, RefreshCw, Clock, Droplets, BarChart2 } from 'lucide-react';
import { swapinService } from '../../services/swapinService';
import { tokenService } from '../../services/tokenService';
import { useWallet } from '../../hooks/useWallet';
import { useDeviceDetect } from '../../hooks/useDeviceDetect';
import PriceChart from './PriceChart';
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
  const [showAddLiquidityModal, setShowAddLiquidityModal] = useState(false);
  const [showRemoveLiquidityModal, setShowRemoveLiquidityModal] = useState(false);
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [expandedPool, setExpandedPool] = useState<string | null>(null);
  const [expandedPosition, setExpandedPosition] = useState<string | null>(null);
  const [removeAmount, setRemoveAmount] = useState(50); // percentage
  const [chartSymbol, setChartSymbol] = useState('ALT/WATT');
  const [chartTimeframe, setChartTimeframe] = useState('1D');
  const { isMobile } = useDeviceDetect();

  const { isConnected, address, chainId, switchToAltcoinchain } = useWallet();
  const networks = swapinService.getAllNetworks();
  const currentNetwork = networks.find(n => n.chainId === selectedNetwork);
  const availableTokens = tokenService.getTokensForChain(currentNetwork?.name || 'ALT');
  
  // Get Altcoinchain token addresses
  const altTokens = swapinService.getAltcoinchainTokens();
  const altPools = swapinService.getAltcoinchainPools();

  useEffect(() => {
    loadPools();
    loadPositions();
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
      },
      {
        id: 'altpepe-altpepi-1.0',
        token0: 'AltPEPE',
        token1: 'AltPEPI',
        fee: 1.0,
        liquidity: '456,789',
        volume24h: '$34,567',
        apr: 38.5,
        hooks: ['Price Impact Protection']
      },
      {
        id: 'altpepe-walt-0.3',
        token0: 'AltPEPE',
        token1: 'wALT',
        fee: 0.3,
        liquidity: '345,678',
        volume24h: '$23,456',
        apr: 32.7,
        hooks: ['Limit Orders']
      },
      {
        id: 'scam-walt-0.3',
        token0: 'SCAM',
        token1: 'wALT',
        fee: 0.3,
        liquidity: '234,567',
        volume24h: '$12,345',
        apr: 45.2,
        hooks: ['MEV Protection']
      },
      {
        id: 'swapd-walt-0.3',
        token0: 'SWAPD',
        token1: 'wALT',
        fee: 0.3,
        liquidity: '123,456',
        volume24h: '$6,789',
        apr: 29.8,
        hooks: ['Auto-Compound']
      },
      {
        id: 'malt-walt-0.3',
        token0: 'MALT',
        token1: 'wALT',
        fee: 0.3,
        liquidity: '78,901',
        volume24h: '$4,567',
        apr: 36.4,
        hooks: ['Dynamic Fee']
      },
      {
        id: 'altpepe-watt-0.3',
        token0: 'AltPEPE',
        token1: 'WATT',
        fee: 0.3,
        liquidity: '56,789',
        volume24h: '$3,456',
        apr: 42.1,
        hooks: ['Price Impact Protection']
      }
    ];
    setPools(mockPools);
    
    // Set chart symbol based on first pool
    setChartSymbol(`${mockPools[0].token0}/${mockPools[0].token1}`);
  };

  const loadPositions = async () => {
    // Mock user positions
    const mockPositions: Position[] = [
      {
        id: 'pos-1',
        pool: {
          id: 'alt-watt-0.3',
          token0: 'ALT',
          token1: 'WATT',
          fee: 0.3,
          liquidity: '1,234,567',
          volume24h: '$45,678',
          apr: 24.5,
          hooks: ['Dynamic Fee', 'MEV Protection']
        },
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
        pool: {
          id: 'alt-usdt-0.05',
          token0: 'ALT',
          token1: 'USDT',
          fee: 0.05,
          liquidity: '2,345,678',
          volume24h: '$123,456',
          apr: 18.2,
          hooks: ['TWAMM', 'Limit Orders']
        },
        liquidity: '8,765',
        token0Amount: '5,000',
        token1Amount: '865',
        uncollectedFees: '$12.34',
        inRange: true,
        tickLower: -887220,
        tickUpper: 887220
      },
      {
        id: 'pos-3',
        pool: {
          id: 'altpepe-watt-0.3',
          token0: 'AltPEPE',
          token1: 'WATT',
          fee: 0.3,
          liquidity: '56,789',
          volume24h: '$3,456',
          apr: 42.1,
          hooks: ['Price Impact Protection']
        },
        liquidity: '4,321',
        token0Amount: '10,000',
        token1Amount: '15,000',
        uncollectedFees: '$45.67',
        inRange: true,
        tickLower: -887220,
        tickUpper: 887220
      }
    ];
    setPositions(mockPositions);
  };

  const calculateSwapAmount = async () => {
    // Simulate price calculation
    const rate = fromToken === 'ALT' && toToken === 'WATT' ? 1.5 : 
                 fromToken === 'WATT' && toToken === 'ALT' ? 0.67 : 
                 fromToken === 'AltPEPE' && toToken === 'AltPEPI' ? 1.5 :
                 fromToken === 'AltPEPE' && toToken === 'wALT' ? 0.5 :
                 fromToken === 'SCAM' && toToken === 'wALT' ? 0.25 :
                 fromToken === 'SWAPD' && toToken === 'wALT' ? 0.75 :
                 fromToken === 'MALT' && toToken === 'wALT' ? 0.8 :
                 fromToken === 'AltPEPE' && toToken === 'WATT' ? 1.5 : 1;
    
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
      // Check if user is on the correct network
      if (chainId !== selectedNetwork) {
        const switched = await swapinService.switchToNetwork(selectedNetwork);
        if (!switched) {
          toast.error('Please switch to the correct network');
          setLoading(false);
          return;
        }
      }
      
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

  const handleAddLiquidity = (pool?: Pool) => {
    if (pool) {
      setSelectedPool(pool);
    } else {
      setSelectedPool(null);
    }
    setShowAddLiquidityModal(true);
  };

  const handleRemoveLiquidity = (position: Position) => {
    setSelectedPosition(position);
    setShowRemoveLiquidityModal(true);
  };

  const handleCollectFees = (position: Position) => {
    toast.success(`Collected ${position.uncollectedFees} in fees`);
  };

  const togglePoolDetails = (poolId: string) => {
    if (expandedPool === poolId) {
      setExpandedPool(null);
    } else {
      setExpandedPool(poolId);
    }
  };

  const togglePositionDetails = (positionId: string) => {
    if (expandedPosition === positionId) {
      setExpandedPosition(null);
    } else {
      setExpandedPosition(positionId);
    }
  };

  const getTokenAddress = (symbol: string) => {
    switch (symbol) {
      case 'ALT': return 'Native ALT';
      case 'wALT': return altTokens.wALT;
      case 'WATT': return altTokens.WATT;
      case 'AltPEPE': return altTokens.AltPEPE;
      case 'AltPEPI': return altTokens.AltPEPI;
      case 'SCAM': return altTokens.SCAM;
      case 'SWAPD': return altTokens.SWAPD;
      case 'MALT': return altTokens.MALT;
      default: return '';
    }
  };

  const getPoolAddress = (token0: string, token1: string) => {
    const key = `${token0}/${token1}`;
    return altPools[key as keyof typeof altPools] || '';
  };

  const getTokenIcon = (symbol: string) => {
    switch (symbol) {
      case 'ALT':
        return <img src="/Altcoinchain logo.png" alt="ALT" className="w-6 h-6 object-contain rounded-full" />;
      case 'wALT':
        return <img src="/Altcoinchain logo.png" alt="wALT" className="w-6 h-6 object-contain rounded-full" />;
      case 'WATT':
        return <img src="/WATT logo.png" alt="WATT" className="w-6 h-6 object-contain" />;
      case 'AltPEPE':
        return <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold">P</div>;
      case 'AltPEPI':
        return <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center text-xs font-bold">P</div>;
      case 'SCAM':
        return <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold">S</div>;
      case 'SWAPD':
        return <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs font-bold">S</div>;
      case 'MALT':
        return <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold">M</div>;
      case 'USDT':
        return <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-xs font-bold">U</div>;
      default:
        return <div className="w-6 h-6 bg-slate-500 rounded-full flex items-center justify-center text-xs font-bold">{symbol[0]}</div>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Network Selection */}
      <div className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Select Network</h3>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">Uniswap V4 Compatible</span>
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
          </div>
        </div>
        
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 ${isMobile ? 'overflow-x-auto' : ''}`}>
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Swap Form */}
            <div className="lg:col-span-1">
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
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Interface Settings</label>
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
                      <div className="relative">
                        <select
                          value={fromToken}
                          onChange={(e) => setFromToken(e.target.value)}
                          className="appearance-none bg-slate-800 rounded px-3 py-2 pr-8 outline-none flex items-center space-x-2"
                        >
                          {['ALT', 'wALT', 'WATT', 'AltPEPE', 'AltPEPI', 'SCAM', 'SWAPD', 'MALT', 'USDT'].map(token => (
                            <option key={token} value={token}>{token}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none" />
                      </div>
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
                      <div className="relative">
                        <select
                          value={toToken}
                          onChange={(e) => setToToken(e.target.value)}
                          className="appearance-none bg-slate-800 rounded px-3 py-2 pr-8 outline-none"
                        >
                          {['ALT', 'wALT', 'WATT', 'AltPEPE', 'AltPEPI', 'SCAM', 'SWAPD', 'MALT', 'USDT'].filter(t => t !== fromToken).map(token => (
                            <option key={token} value={token}>{token}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none" />
                      </div>
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
                    {loading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>Swapping...</span>
                      </div>
                    ) : !isConnected ? (
                      'Connect Wallet'
                    ) : (
                      'Swap Tokens'
                    )}
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Price Chart */}
            <div className="lg:col-span-2">
              <div className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-semibold">{chartSymbol} Chart</h3>
                    <div className="flex items-center space-x-2">
                      {getTokenIcon(chartSymbol.split('/')[0])}
                      <span>/</span>
                      {getTokenIcon(chartSymbol.split('/')[1])}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {['15m', '1H', '4H', '1D', '1W'].map(timeframe => (
                      <button
                        key={timeframe}
                        onClick={() => setChartTimeframe(timeframe)}
                        className={`px-2 py-1 rounded text-xs transition-colors ${
                          chartTimeframe === timeframe
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                        }`}
                      >
                        {timeframe}
                      </button>
                    ))}
                  </div>
                </div>
                
                <PriceChart 
                  symbol={chartSymbol} 
                  timeframe={chartTimeframe}
                  height={400}
                />
                
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-900/30 rounded-lg p-3">
                    <p className="text-xs text-slate-400">Price</p>
                    <p className="text-lg font-bold">$0.000173</p>
                  </div>
                  <div className="bg-slate-900/30 rounded-lg p-3">
                    <p className="text-xs text-slate-400">24h Change</p>
                    <p className="text-lg font-bold text-emerald-400">+2.5%</p>
                  </div>
                  <div className="bg-slate-900/30 rounded-lg p-3">
                    <p className="text-xs text-slate-400">24h Volume</p>
                    <p className="text-lg font-bold">$45,678</p>
                  </div>
                  <div className="bg-slate-900/30 rounded-lg p-3">
                    <p className="text-xs text-slate-400">TVL</p>
                    <p className="text-lg font-bold">$1.23M</p>
                  </div>
                </div>
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
                        {getTokenIcon(pool.token0)}
                        {getTokenIcon(pool.token1)}
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

                  <div className="flex items-center justify-between mt-4">
                    <button
                      onClick={() => togglePoolDetails(pool.id)}
                      className="flex items-center space-x-1 text-sm text-slate-400 hover:text-white"
                    >
                      <span>Details</span>
                      {expandedPool === pool.id ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    
                    <div className="flex space-x-2">
                      <motion.button
                        onClick={() => handleAddLiquidity(pool)}
                        className="flex-1 py-2 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg text-sm font-medium transition-colors border border-blue-500/30"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Add
                      </motion.button>
                      <motion.button
                        onClick={() => {
                          setChartSymbol(`${pool.token0}/${pool.token1}`);
                          setActiveTab('swap');
                          setFromToken(pool.token0);
                          setToToken(pool.token1);
                        }}
                        className="flex-1 py-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-sm font-medium transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Trade
                      </motion.button>
                    </div>
                  </div>

                  {/* Expanded Pool Details */}
                  {expandedPool === pool.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-slate-700/30"
                    >
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Pool Address:</span>
                          <span className="font-mono text-xs">{getPoolAddress(pool.token0, pool.token1) || '0x...'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">{pool.token0} Address:</span>
                          <span className="font-mono text-xs">{getTokenAddress(pool.token0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">{pool.token1} Address:</span>
                          <span className="font-mono text-xs">{getTokenAddress(pool.token1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Fee Tier:</span>
                          <span>{pool.fee}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Created:</span>
                          <span>2 months ago</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
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
                onClick={() => handleAddLiquidity()}
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
                          {getTokenIcon(position.pool.token0)}
                          {getTokenIcon(position.pool.token1)}
                        </div>
                        <h4 className="font-semibold">{position.pool.token0}/{position.pool.token1}</h4>
                        <span className="text-xs bg-slate-700/50 px-2 py-1 rounded">
                          {position.pool.fee}%
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
                        <p className="text-slate-400 text-sm">{position.pool.token0}</p>
                        <p className="font-bold">{position.token0Amount}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm">{position.pool.token1}</p>
                        <p className="font-bold">{position.token1Amount}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => togglePositionDetails(position.id)}
                        className="flex items-center space-x-1 text-sm text-slate-400 hover:text-white"
                      >
                        <span>Details</span>
                        {expandedPosition === position.id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                      
                      <div className="flex space-x-2">
                        <motion.button
                          onClick={() => handleCollectFees(position)}
                          className="flex-1 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 rounded-lg text-sm font-medium transition-colors border border-emerald-500/30"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Collect Fees
                        </motion.button>
                        <motion.button
                          onClick={() => handleAddLiquidity(position.pool)}
                          className="flex-1 py-2 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg text-sm font-medium transition-colors border border-blue-500/30"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Plus className="w-4 h-4 inline mr-1" />
                          Add
                        </motion.button>
                        <motion.button
                          onClick={() => handleRemoveLiquidity(position)}
                          className="flex-1 py-2 bg-red-600/20 hover:bg-red-600/30 rounded-lg text-sm font-medium transition-colors border border-red-500/30"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Minus className="w-4 h-4 inline mr-1" />
                          Remove
                        </motion.button>
                      </div>
                    </div>

                    {/* Expanded Position Details */}
                    {expandedPosition === position.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-slate-700/30"
                      >
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Pool Address:</span>
                            <span className="font-mono text-xs">{getPoolAddress(position.pool.token0, position.pool.token1) || '0x...'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Position ID:</span>
                            <span className="font-mono text-xs">{position.id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Price Range:</span>
                            <span>Full Range</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">APR:</span>
                            <span className="text-emerald-400">{position.pool.apr}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Created:</span>
                            <span>1 month ago</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Add Liquidity Modal */}
      {showAddLiquidityModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            className="bg-slate-800/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 max-w-md w-full"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
              <div>
                <h3 className="text-xl font-semibold">Add Liquidity</h3>
                <p className="text-slate-400 text-sm">
                  {selectedPool ? `${selectedPool.token0}/${selectedPool.token1} Pool` : 'Create a new position'}
                </p>
              </div>
              <button
                onClick={() => setShowAddLiquidityModal(false)}
                className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Fee Tier Selection (for new pools) */}
              {!selectedPool && (
                <div>
                  <label className="block text-sm font-medium mb-2">Fee Tier</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[0.01, 0.05, 0.3, 1.0].map((fee) => (
                      <button
                        key={fee}
                        className="p-3 bg-slate-900/50 border border-slate-700/50 rounded-lg text-center hover:border-blue-500/50 transition-colors"
                      >
                        <div className="font-medium">{fee}%</div>
                        <div className="text-xs text-slate-400">
                          {fee === 0.01 ? 'Stable Pairs' : 
                           fee === 0.05 ? 'Standard' : 
                           fee === 0.3 ? 'Most Pairs' : 
                           'Exotic Pairs'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Token Selection (for new pools) */}
              {!selectedPool && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Token 1</label>
                    <div className="relative">
                      <select
                        className="w-full appearance-none bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:border-blue-500/50"
                      >
                        {['ALT', 'wALT', 'WATT', 'AltPEPE', 'AltPEPI', 'SCAM', 'SWAPD', 'MALT', 'USDT'].map(token => (
                          <option key={token} value={token}>{token}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Token 2</label>
                    <div className="relative">
                      <select
                        className="w-full appearance-none bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:border-blue-500/50"
                      >
                        {['ALT', 'wALT', 'WATT', 'AltPEPE', 'AltPEPI', 'SCAM', 'SWAPD', 'MALT', 'USDT'].map(token => (
                          <option key={token} value={token}>{token}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none" />
                    </div>
                  </div>
                </div>
              )}

              {/* Token 1 Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">
                    {selectedPool ? selectedPool.token0 : 'Token 1'} Amount
                  </label>
                  <div className="flex items-center space-x-1 text-xs text-slate-400">
                    <span>Balance: 1,000.00</span>
                    <button className="text-blue-400 hover:text-blue-300">MAX</button>
                  </div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
                  <div className="flex items-center space-x-3">
                    <input
                      type="number"
                      placeholder="0.0"
                      className="flex-1 bg-transparent text-xl font-bold outline-none"
                    />
                    <div className="flex items-center space-x-2 bg-slate-800 rounded-lg px-3 py-2">
                      {selectedPool ? getTokenIcon(selectedPool.token0) : getTokenIcon('ALT')}
                      <span>{selectedPool ? selectedPool.token0 : 'ALT'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Plus Icon */}
              <div className="flex justify-center">
                <div className="bg-slate-800 rounded-full p-2">
                  <Plus className="w-5 h-5" />
                </div>
              </div>

              {/* Token 2 Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">
                    {selectedPool ? selectedPool.token1 : 'Token 2'} Amount
                  </label>
                  <div className="flex items-center space-x-1 text-xs text-slate-400">
                    <span>Balance: 1,500.00</span>
                    <button className="text-blue-400 hover:text-blue-300">MAX</button>
                  </div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
                  <div className="flex items-center space-x-3">
                    <input
                      type="number"
                      placeholder="0.0"
                      className="flex-1 bg-transparent text-xl font-bold outline-none"
                    />
                    <div className="flex items-center space-x-2 bg-slate-800 rounded-lg px-3 py-2">
                      {selectedPool ? getTokenIcon(selectedPool.token1) : getTokenIcon('WATT')}
                      <span>{selectedPool ? selectedPool.token1 : 'WATT'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Price Range (simplified) */}
              <div>
                <label className="block text-sm font-medium mb-2">Price Range</label>
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm">Full Range</span>
                    <div className="flex items-center space-x-1">
                      <input type="checkbox" checked className="rounded" />
                      <span className="text-sm">Use full range</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">
                    Liquidity will be allocated across the full price range, earning fees on all trades but with less capital efficiency.
                  </p>
                </div>
              </div>

              {/* Deposit Summary */}
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Share of Pool</span>
                  <span>~0.01%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Estimated APR</span>
                  <span className="text-emerald-400">24.5%</span>
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  toast.success('Liquidity added successfully!');
                  setShowAddLiquidityModal(false);
                }}
              >
                Add Liquidity
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Remove Liquidity Modal */}
      {showRemoveLiquidityModal && selectedPosition && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            className="bg-slate-800/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 max-w-md w-full"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
              <div>
                <h3 className="text-xl font-semibold">Remove Liquidity</h3>
                <p className="text-slate-400 text-sm">
                  {selectedPosition.pool.token0}/{selectedPosition.pool.token1} Pool
                </p>
              </div>
              <button
                onClick={() => setShowRemoveLiquidityModal(false)}
                className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Position Info */}
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-400 text-sm">Liquidity</p>
                    <p className="font-bold">{selectedPosition.liquidity}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Uncollected Fees</p>
                    <p className="font-bold text-emerald-400">{selectedPosition.uncollectedFees}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">{selectedPosition.pool.token0}</p>
                    <p className="font-bold">{selectedPosition.token0Amount}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">{selectedPosition.pool.token1}</p>
                    <p className="font-bold">{selectedPosition.token1Amount}</p>
                  </div>
                </div>
              </div>

              {/* Amount to Remove */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Amount to Remove</label>
                  <span className="text-sm">{removeAmount}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={removeAmount}
                  onChange={(e) => setRemoveAmount(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between mt-1 text-xs text-slate-400">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* You Will Receive */}
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
                <h4 className="font-medium mb-3">You Will Receive</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      {getTokenIcon(selectedPosition.pool.token0)}
                      <span>{selectedPosition.pool.token0}</span>
                    </div>
                    <span className="font-medium">
                      {(parseFloat(selectedPosition.token0Amount.replace(/,/g, '')) * removeAmount / 100).toFixed(4)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      {getTokenIcon(selectedPosition.pool.token1)}
                      <span>{selectedPosition.pool.token1}</span>
                    </div>
                    <span className="font-medium">
                      {(parseFloat(selectedPosition.token1Amount.replace(/,/g, '')) * removeAmount / 100).toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Collect Fees Option */}
              <div className="flex items-center space-x-2">
                <input type="checkbox" checked className="rounded" />
                <label className="text-sm">Collect uncollected fees</label>
              </div>

              {/* Submit Button */}
              <motion.button
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  toast.success('Liquidity removed successfully!');
                  setShowRemoveLiquidityModal(false);
                }}
              >
                Remove Liquidity
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

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