import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  BarChart2, 
  Clock, 
  DollarSign, 
  Shield, 
  Settings, 
  Info, 
  AlertTriangle, 
  ArrowRight, 
  ChevronDown, 
  ChevronUp,
  Percent,
  Wallet
} from 'lucide-react';
import { useWallet } from '../../hooks/useWallet';
import { usePrices } from '../../hooks/usePrices';
import { swapinService } from '../../services/swapinService';
import { tokenService } from '../../services/tokenService';
import PerpTradingChart from './PerpTradingChart';
import PerpOrderBook from './PerpOrderBook';
import PerpPositions from './PerpPositions';
import PerpLiquidityPools from './PerpLiquidityPools';
import toast from 'react-hot-toast';

const PerpetualTrading: React.FC = () => {
  const { isConnected, address, chainId } = useWallet();
  const [activeTab, setActiveTab] = useState<'trade' | 'positions' | 'pools' | 'history'>('trade');
  const [selectedNetwork, setSelectedNetwork] = useState<number | null>(null);
  const [selectedMarket, setSelectedMarket] = useState<string>('BTC-USD');
  const [leverageValue, setLeverageValue] = useState<number>(10);
  const [collateralAmount, setCollateralAmount] = useState<string>('');
  const [positionSize, setPositionSize] = useState<string>('0');
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop'>('market');
  const [limitPrice, setLimitPrice] = useState<string>('');
  const [stopPrice, setStopPrice] = useState<string>('');
  const [positionType, setPositionType] = useState<'long' | 'short'>('long');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [slippage, setSlippage] = useState<string>('0.5');
  const [takeProfitPrice, setTakeProfitPrice] = useState<string>('');
  const [stopLossPrice, setStopLossPrice] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const { getPrice, formatPrice, formatChange } = usePrices(['BTC', 'ETH', 'ALT']);
  const btcPrice = getPrice('BTC');
  const ethPrice = getPrice('ETH');
  const altPrice = getPrice('ALT');

  const networks = swapinService.getAllNetworks();
  const currentNetwork = networks.find(n => n.chainId === selectedNetwork);

  // Available markets for perpetual trading
  const markets = [
    { id: 'BTC-USD', name: 'BTC/USD', baseToken: 'BTC', quoteToken: 'USD', price: btcPrice?.price || 50000, change24h: btcPrice?.changePercent24h || 0, volume24h: '$1.2B', openInterest: '$450M', fundingRate: '0.01%/8h' },
    { id: 'ETH-USD', name: 'ETH/USD', baseToken: 'ETH', quoteToken: 'USD', price: ethPrice?.price || 3500, change24h: ethPrice?.changePercent24h || 0, volume24h: '$850M', openInterest: '$320M', fundingRate: '0.008%/8h' },
    { id: 'ALT-USD', name: 'ALT/USD', baseToken: 'ALT', quoteToken: 'USD', price: altPrice?.price || 0.000173, change24h: altPrice?.changePercent24h || 0, volume24h: '$5.2M', openInterest: '$1.8M', fundingRate: '0.015%/8h' },
    { id: 'BTC-USDT', name: 'BTC/USDT', baseToken: 'BTC', quoteToken: 'USDT', price: btcPrice?.price || 50000, change24h: btcPrice?.changePercent24h || 0, volume24h: '$950M', openInterest: '$380M', fundingRate: '0.01%/8h' },
    { id: 'ETH-USDT', name: 'ETH/USDT', baseToken: 'ETH', quoteToken: 'USDT', price: ethPrice?.price || 3500, change24h: ethPrice?.changePercent24h || 0, volume24h: '$720M', openInterest: '$290M', fundingRate: '0.007%/8h' },
    { id: 'ALT-USDT', name: 'ALT/USDT', baseToken: 'ALT', quoteToken: 'USDT', price: altPrice?.price || 0.000173, change24h: altPrice?.changePercent24h || 0, volume24h: '$4.8M', openInterest: '$1.5M', fundingRate: '0.012%/8h' }
  ];

  // Available collateral tokens
  const collateralTokens = [
    { symbol: 'USDT', name: 'Tether USD', balance: '1,000.00', logo: '/USDT logo.png' },
    { symbol: 'USDC', name: 'USD Coin', balance: '1,500.00', logo: '/USDC logo.png' },
    { symbol: 'DAI', name: 'Dai Stablecoin', balance: '750.00', logo: '/DAI logo.png' },
    { symbol: 'BTC', name: 'Bitcoin', balance: '0.05', logo: '/BTC logo.png' },
    { symbol: 'ETH', name: 'Ethereum', balance: '2.5', logo: '/ETH logo.png' },
    { symbol: 'ALT', name: 'Altcoinchain', balance: '10,000', logo: '/Altcoinchain logo.png' },
    { symbol: 'WATT', name: 'WATT Token', balance: '5,000', logo: '/WATT logo.png' }
  ];

  const [selectedCollateral, setSelectedCollateral] = useState(collateralTokens[0]);

  // Initialize with the first network
  useEffect(() => {
    if (networks.length > 0 && !selectedNetwork) {
      setSelectedNetwork(networks[0].chainId);
    }
  }, [networks]);

  // Calculate position size based on collateral and leverage
  useEffect(() => {
    if (collateralAmount && !isNaN(parseFloat(collateralAmount))) {
      const collateralValue = parseFloat(collateralAmount);
      const positionValue = collateralValue * leverageValue;
      setPositionSize(positionValue.toFixed(2));
    } else {
      setPositionSize('0');
    }
  }, [collateralAmount, leverageValue]);

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

  const handleMarketChange = (marketId: string) => {
    setSelectedMarket(marketId);
    
    // Reset form values when changing markets
    setLimitPrice('');
    setStopPrice('');
    setTakeProfitPrice('');
    setStopLossPrice('');
  };

  const handleLeverageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value);
    setLeverageValue(value);
  };

  const handleCollateralChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCollateralAmount(event.target.value);
  };

  const handleCollateralTokenChange = (symbol: string) => {
    const token = collateralTokens.find(t => t.symbol === symbol);
    if (token) {
      setSelectedCollateral(token);
    }
  };

  const handleSubmitOrder = () => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!selectedNetwork) {
      toast.error('Please select a network');
      return;
    }

    if (!collateralAmount || parseFloat(collateralAmount) <= 0) {
      toast.error('Please enter a valid collateral amount');
      return;
    }

    setLoading(true);

    // Simulate order submission
    setTimeout(() => {
      setLoading(false);
      toast.success(`${positionType.toUpperCase()} position opened: ${positionSize} ${markets.find(m => m.id === selectedMarket)?.baseToken} with ${leverageValue}x leverage`);
    }, 2000);
  };

  const getMarketPrice = () => {
    const market = markets.find(m => m.id === selectedMarket);
    return market?.price || 0;
  };

  const calculateLiquidationPrice = () => {
    const market = markets.find(m => m.id === selectedMarket);
    if (!market || !collateralAmount || parseFloat(collateralAmount) <= 0) return '0';

    const entryPrice = market.price;
    const maintenanceMargin = 0.05; // 5% maintenance margin
    
    if (positionType === 'long') {
      const liqPrice = entryPrice * (1 - (1 / leverageValue) + maintenanceMargin);
      return liqPrice.toFixed(2);
    } else {
      const liqPrice = entryPrice * (1 + (1 / leverageValue) - maintenanceMargin);
      return liqPrice.toFixed(2);
    }
  };

  const calculateMaxLeverage = () => {
    const market = markets.find(m => m.id === selectedMarket);
    if (!market) return 100;

    // Different markets might have different max leverage
    if (market.baseToken === 'BTC') return 100;
    if (market.baseToken === 'ETH') return 75;
    return 50;
  };

  const maxLeverage = calculateMaxLeverage();

  return (
    <div className="space-y-6">
      {/* Network Selection */}
      <div className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Select Network</h3>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">Perpetual Trading</span>
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
              <span className="text-xl">{
                network.name === 'EGAZ' ? '⚡' :
                network.name === 'PlanQ' ? '🌐' :
                network.name === 'OctaSpace' ? '🐙' :
                network.name === 'PartyChain' ? '🎉' :
                network.name === 'EGEM' ? '💎' :
                network.name === 'ETHO' ? '🔷' :
                network.name === 'Altcoinchain' ? '🔗' :
                network.name === 'DOGEchain' ? '🐕' :
                network.name === 'Fantom' ? '👻' :
                network.name === 'BSC' ? '🔶' :
                network.name === 'Ethereum' ? '💎' :
                network.name === 'Polygon' ? '🔷' :
                network.name === 'Avalanche' ? '🔺' :
                network.name === 'Arbitrum' ? '🔵' :
                network.name === 'Optimism' ? '🔴' :
                network.name === 'Base' ? '🟦' : '🌍'
              }</span>
              <span>{network.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center space-x-2 bg-slate-800/50 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('trade')}
          className={`px-4 py-2 rounded-md transition-colors ${
            activeTab === 'trade'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Trade
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
        <button
          onClick={() => setActiveTab('pools')}
          className={`px-4 py-2 rounded-md transition-colors ${
            activeTab === 'pools'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Liquidity Pools
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-md transition-colors ${
            activeTab === 'history'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          History
        </button>
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'trade' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Market Selection and Trading Form */}
            <div className="lg:col-span-1 space-y-6">
              {/* Market Selection */}
              <div className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
                <h3 className="text-lg font-semibold mb-4">Markets</h3>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  {markets.map((market) => (
                    <button
                      key={market.id}
                      onClick={() => handleMarketChange(market.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                        selectedMarket === market.id
                          ? 'bg-blue-600/20 border border-blue-500/30'
                          : 'bg-slate-700/50 hover:bg-slate-600/50'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-slate-600 rounded-full flex items-center justify-center text-xs">
                          {market.baseToken.charAt(0)}
                        </div>
                        <span className="font-medium">{market.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${market.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</p>
                        <p className={`text-xs ${market.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {market.change24h >= 0 ? '+' : ''}{market.change24h.toFixed(2)}%
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Trading Form */}
              <div className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    {markets.find(m => m.id === selectedMarket)?.name} Perpetual
                  </h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs px-2 py-1 bg-slate-700/50 rounded">
                      {markets.find(m => m.id === selectedMarket)?.fundingRate}
                    </span>
                  </div>
                </div>

                {/* Position Type */}
                <div className="flex space-x-2 mb-6">
                  <button
                    onClick={() => setPositionType('long')}
                    className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                      positionType === 'long'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-700/50 text-slate-400 hover:text-white'
                    }`}
                  >
                    Long
                  </button>
                  <button
                    onClick={() => setPositionType('short')}
                    className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                      positionType === 'short'
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-700/50 text-slate-400 hover:text-white'
                    }`}
                  >
                    Short
                  </button>
                </div>

                {/* Order Type */}
                <div className="flex space-x-2 mb-6">
                  <button
                    onClick={() => setOrderType('market')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm transition-colors ${
                      orderType === 'market'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700/50 text-slate-400 hover:text-white'
                    }`}
                  >
                    Market
                  </button>
                  <button
                    onClick={() => setOrderType('limit')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm transition-colors ${
                      orderType === 'limit'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700/50 text-slate-400 hover:text-white'
                    }`}
                  >
                    Limit
                  </button>
                  <button
                    onClick={() => setOrderType('stop')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm transition-colors ${
                      orderType === 'stop'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700/50 text-slate-400 hover:text-white'
                    }`}
                  >
                    Stop
                  </button>
                </div>

                {/* Limit Price */}
                {orderType === 'limit' && (
                  <div className="mb-4">
                    <label className="block text-sm text-slate-400 mb-2">Limit Price</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={limitPrice}
                        onChange={(e) => setLimitPrice(e.target.value)}
                        placeholder={getMarketPrice().toString()}
                        className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-3 pr-16 focus:outline-none focus:border-blue-500/50"
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <span className="text-slate-400 text-sm">USD</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Stop Price */}
                {orderType === 'stop' && (
                  <div className="mb-4">
                    <label className="block text-sm text-slate-400 mb-2">Stop Price</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={stopPrice}
                        onChange={(e) => setStopPrice(e.target.value)}
                        placeholder={getMarketPrice().toString()}
                        className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-3 pr-16 focus:outline-none focus:border-blue-500/50"
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <span className="text-slate-400 text-sm">USD</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Collateral Amount */}
                <div className="mb-6">
                  <label className="block text-sm text-slate-400 mb-2">Collateral</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={collateralAmount}
                      onChange={handleCollateralChange}
                      placeholder="0.00"
                      className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-3 pr-24 focus:outline-none focus:border-blue-500/50"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center">
                      <div className="relative">
                        <select
                          value={selectedCollateral.symbol}
                          onChange={(e) => handleCollateralTokenChange(e.target.value)}
                          className="appearance-none bg-slate-800 rounded px-2 py-1 pr-8 outline-none text-sm"
                        >
                          {collateralTokens.map(token => (
                            <option key={token.symbol} value={token.symbol}>{token.symbol}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-1 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-slate-400">Balance: {selectedCollateral.balance}</span>
                    <button 
                      className="text-xs text-blue-400 hover:text-blue-300"
                      onClick={() => setCollateralAmount(selectedCollateral.balance.replace(/,/g, ''))}
                    >
                      Max
                    </button>
                  </div>
                </div>

                {/* Leverage Slider */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-slate-400">Leverage</label>
                    <div className="flex items-center space-x-2">
                      <Zap className="w-4 h-4 text-yellow-400" />
                      <span className="font-medium">{leverageValue}x</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="1.1"
                    max={maxLeverage}
                    step="0.1"
                    value={leverageValue}
                    onChange={handleLeverageChange}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between mt-1 text-xs text-slate-400">
                    <span>1.1x</span>
                    <span>{maxLeverage / 2}x</span>
                    <span>{maxLeverage}x</span>
                  </div>
                </div>

                {/* Position Size */}
                <div className="mb-6 bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-slate-400">Position Size</span>
                    <span className="font-medium">${parseFloat(positionSize).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-slate-400">Entry Price</span>
                    <span className="font-medium">${getMarketPrice().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-400">Liquidation Price</span>
                    <span className={`font-medium ${positionType === 'long' ? 'text-red-400' : 'text-emerald-400'}`}>
                      ${calculateLiquidationPrice()}
                    </span>
                  </div>
                </div>

                {/* Advanced Options Toggle */}
                <div className="mb-4">
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center space-x-2 text-sm text-slate-400 hover:text-white"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Advanced Options</span>
                    {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {/* Advanced Options */}
                {showAdvanced && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6 space-y-4"
                  >
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Take Profit</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={takeProfitPrice}
                          onChange={(e) => setTakeProfitPrice(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 pr-16 focus:outline-none focus:border-blue-500/50"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <span className="text-slate-400 text-sm">USD</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Stop Loss</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={stopLossPrice}
                          onChange={(e) => setStopLossPrice(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 pr-16 focus:outline-none focus:border-blue-500/50"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <span className="text-slate-400 text-sm">USD</span>
                        </div>
                      </div>
                    </div>

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
                  </motion.div>
                )}

                {/* Submit Button */}
                <motion.button
                  onClick={handleSubmitOrder}
                  disabled={loading || !isConnected || !collateralAmount || parseFloat(collateralAmount) <= 0}
                  className={`w-full py-4 rounded-lg font-semibold transition-colors ${
                    positionType === 'long'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-red-600 hover:bg-red-700'
                  } disabled:opacity-50`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? 'Processing...' : `${positionType === 'long' ? 'Long' : 'Short'} ${markets.find(m => m.id === selectedMarket)?.baseToken}`}
                </motion.button>

                {/* Risk Warning */}
                <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5" />
                    <p className="text-xs text-yellow-400">
                      Trading with leverage involves significant risk. You can lose more than your initial investment.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Chart and Order Book */}
            <div className="lg:col-span-3 space-y-6">
              {/* Market Stats */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {[
                  { label: 'Price', value: `$${getMarketPrice().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`, icon: DollarSign, color: 'text-blue-400' },
                  { label: '24h Change', value: `${markets.find(m => m.id === selectedMarket)?.change24h.toFixed(2)}%`, icon: TrendingUp, color: markets.find(m => m.id === selectedMarket)?.change24h >= 0 ? 'text-emerald-400' : 'text-red-400' },
                  { label: '24h Volume', value: markets.find(m => m.id === selectedMarket)?.volume24h, icon: BarChart2, color: 'text-purple-400' },
                  { label: 'Open Interest', value: markets.find(m => m.id === selectedMarket)?.openInterest, icon: Zap, color: 'text-yellow-400' },
                  { label: 'Funding Rate', value: markets.find(m => m.id === selectedMarket)?.fundingRate, icon: Clock, color: 'text-emerald-400' }
                ].map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div
                      key={stat.label}
                      className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-4 border border-slate-700/50"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-slate-400">{stat.label}</span>
                        <Icon className={`w-4 h-4 ${stat.color}`} />
                      </div>
                      <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                    </motion.div>
                  );
                })}
              </div>

              {/* TradingView Chart */}
              <PerpTradingChart 
                symbol={selectedMarket} 
                interval="1h"
              />

              {/* Order Book */}
              <PerpOrderBook 
                market={selectedMarket}
              />
            </div>
          </div>
        )}

        {activeTab === 'positions' && <PerpPositions />}
        {activeTab === 'pools' && <PerpLiquidityPools />}
        {activeTab === 'history' && (
          <div className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-xl font-semibold mb-6">Trading History</h3>
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-400 mb-2">No trading history yet</p>
              <p className="text-slate-500 text-sm">Your trading history will appear here</p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Perpetual Trading Info */}
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
            <h3 className="text-lg font-semibold text-blue-400 mb-2">Perpetual Trading</h3>
            <p className="text-slate-300 mb-3">
              Trade perpetual futures with up to 100x leverage across multiple assets. Our perpetual contracts 
              never expire and use a funding rate mechanism to keep prices aligned with the spot market.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-emerald-400 mb-2">Isolated Margin</h4>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>• Limit risk to allocated margin</li>
                  <li>• Adjust leverage per position</li>
                  <li>• Prevent cross-position liquidations</li>
                  <li>• Ideal for high leverage trading</li>
                </ul>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-400 mb-2">Multi-Asset Collateral</h4>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>• Use any supported token as collateral</li>
                  <li>• Automatic collateral conversion</li>
                  <li>• Optimize capital efficiency</li>
                  <li>• Earn yield on idle collateral</li>
                </ul>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-purple-400 mb-2">Advanced Risk Management</h4>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>• Take profit & stop loss orders</li>
                  <li>• Trailing stops</li>
                  <li>• Partial position closing</li>
                  <li>• Liquidation protection</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 text-xs text-slate-400">
              <p>• Powered by nuChain L2 zkRollup technology for low fees and instant settlement</p>
              <p>• Liquidity provided by nuLP token holders across multiple chains</p>
              <p>• Insurance fund protects against socialized losses</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PerpetualTrading;