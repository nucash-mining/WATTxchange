import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart2, 
  Clock, 
  DollarSign, 
  Target,
  Activity
} from 'lucide-react';
import { useWallet } from '../../hooks/useWallet';
import { usePrices } from '../../hooks/usePrices';
import { usePythPrices } from '../../hooks/usePythPrices';
import toast from 'react-hot-toast';

interface PerpPosition {
  id: string;
  market: string;
  side: 'long' | 'short';
  size: string;
  entryPrice: string;
  markPrice: string;
  pnl: string;
  pnlPercent: string;
  margin: string;
  leverage: string;
  liquidationPrice: string;
  fundingRate: string;
  timestamp: number;
}

interface PerpMarket {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  price: string;
  priceChange24h: string;
  volume24h: string;
  openInterest: string;
  fundingRate: string;
  nextFundingTime: number;
  maxLeverage: string;
  tickSize: string;
  stepSize: string;
}

const NavigatorPerpInterface: React.FC = () => {
  // Wallet, Prices, and Pyth API hooks (ignore unused destructured variables)
  useWallet();
  usePrices(['BTC', 'ETH', 'ALT', 'WATT']);
  usePythPrices();

  const [activeTab, setActiveTab] = useState<'trade' | 'positions' | 'history' | 'funding'>('trade');
  const [selectedMarket, setSelectedMarket] = useState<PerpMarket | null>(null);
  const [positions, setPositions] = useState<PerpPosition[]>([]);
  const [markets, setMarkets] = useState<PerpMarket[]>([]);
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop'>('market');
  const [side, setSide] = useState<'long' | 'short'>('long');
  const [size, setSize] = useState('');
  const [price, setPrice] = useState('');
  const [leverage, setLeverage] = useState('10');
  const [isLoading, setIsLoading] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    const mockMarkets: PerpMarket[] = [
      {
        symbol: 'BTC-PERP',
        baseAsset: 'BTC',
        quoteAsset: 'USDC',
        price: '43250.50',
        priceChange24h: '+2.45%',
        volume24h: '125.8M',
        openInterest: '45.2M',
        fundingRate: '0.01%',
        nextFundingTime: Date.now() + 3600000,
        maxLeverage: '50x',
        tickSize: '0.1',
        stepSize: '0.001'
      },
      {
        symbol: 'ETH-PERP',
        baseAsset: 'ETH',
        quoteAsset: 'USDC',
        price: '2650.75',
        priceChange24h: '+1.23%',
        volume24h: '89.3M',
        openInterest: '32.1M',
        fundingRate: '0.02%',
        nextFundingTime: Date.now() + 3600000,
        maxLeverage: '50x',
        tickSize: '0.01',
        stepSize: '0.01'
      },
      {
        symbol: 'ALT-PERP',
        baseAsset: 'ALT',
        quoteAsset: 'USDC',
        price: '0.1250',
        priceChange24h: '+5.67%',
        volume24h: '12.4M',
        openInterest: '8.7M',
        fundingRate: '0.05%',
        nextFundingTime: Date.now() + 3600000,
        maxLeverage: '25x',
        tickSize: '0.0001',
        stepSize: '1'
      }
    ];

    const mockPositions: PerpPosition[] = [
      {
        id: '1',
        market: 'BTC-PERP',
        side: 'long',
        size: '0.5',
        entryPrice: '42800.00',
        markPrice: '43250.50',
        pnl: '+225.25',
        pnlPercent: '+1.05%',
        margin: '2140.00',
        leverage: '10x',
        liquidationPrice: '38520.00',
        fundingRate: '0.01%',
        timestamp: Date.now() - 3600000
      }
    ];

    setMarkets(mockMarkets);
    setPositions(mockPositions);
    setSelectedMarket(mockMarkets[0]);
  }, []);

  const { address, isConnected } = useWallet();

  const handlePlaceOrder = async () => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!selectedMarket || !size) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate order placement
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success(`${side.toUpperCase()} order placed for ${size} ${selectedMarket.baseAsset}`);
      
      // Reset form
      setSize('');
      setPrice('');
    } catch (error) {
      toast.error('Failed to place order');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateNotional = () => {
    if (!selectedMarket || !size) return '0';
    const notional = parseFloat(size) * parseFloat(selectedMarket.price);
    return notional.toFixed(2);
  };

  const calculateMargin = () => {
    const notional = parseFloat(calculateNotional());
    const lev = parseFloat(leverage);
    return (notional / lev).toFixed(2);
  };

  const tabs = [
    { id: 'trade', label: 'Trade', icon: Target },
    { id: 'positions', label: 'Positions', icon: Activity },
    { id: 'history', label: 'History', icon: Clock },
    { id: 'funding', label: 'Funding', icon: DollarSign }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/30 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-blue-400">Navigator PERP Trading</h2>
            <p className="text-gray-400 mt-1">Powered by PYTH Price Feeds on Sonic</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-400">Account Balance</p>
              <p className="text-lg font-semibold">$12,450.00</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Unrealized PnL</p>
              <p className="text-lg font-semibold text-green-400">+$225.25</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-900/50 rounded-lg p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Market Selector */}
      <div className="bg-gray-900/30 backdrop-blur-xl rounded-xl p-6 border border-gray-800">
        <h3 className="text-lg font-semibold mb-4">Select Market</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {markets.map((market) => (
            <motion.button
              key={market.symbol}
              onClick={() => setSelectedMarket(market)}
              className={`p-4 rounded-lg border transition-all ${
                selectedMarket?.symbol === market.symbol
                  ? 'border-blue-500 bg-blue-600/10'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">{market.symbol}</span>
                <span className={`text-sm ${
                  market.priceChange24h.startsWith('+') ? 'text-green-400' : 'text-red-400'
                }`}>
                  {market.priceChange24h}
                </span>
              </div>
              <div className="text-2xl font-bold">${market.price}</div>
              <div className="text-sm text-gray-400">
                Vol: {market.volume24h} | OI: {market.openInterest}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trading Panel */}
        {activeTab === 'trade' && (
          <div className="lg:col-span-2 space-y-6">
            {/* Order Form */}
            <div className="bg-gray-900/30 backdrop-blur-xl rounded-xl p-6 border border-gray-800">
              <h3 className="text-lg font-semibold mb-4">Place Order</h3>
              
              {/* Order Type */}
              <div className="flex space-x-2 mb-4">
                {(['market', 'limit', 'stop'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setOrderType(type)}
                    className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                      orderType === type
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {/* Side Selection */}
              <div className="flex space-x-2 mb-4">
                <button
                  onClick={() => setSide('long')}
                  className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                    side === 'long'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <TrendingUp className="w-5 h-5 mx-auto mb-1" />
                  Long
                </button>
                <button
                  onClick={() => setSide('short')}
                  className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                    side === 'short'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <TrendingDown className="w-5 h-5 mx-auto mb-1" />
                  Short
                </button>
              </div>

              {/* Size Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Size ({selectedMarket?.baseAsset})</label>
                <input
                  type="number"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Price Input (for limit orders) */}
              {orderType === 'limit' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Price (USDC)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              {/* Leverage */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Leverage</label>
                <div className="flex space-x-2">
                  {['1', '5', '10', '25', '50'].map((lev) => (
                    <button
                      key={lev}
                      onClick={() => setLeverage(lev)}
                      className={`px-3 py-2 rounded-lg transition-colors ${
                        leverage === lev
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {lev}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Notional Value:</span>
                  <span>${calculateNotional()}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Margin Required:</span>
                  <span>${calculateMargin()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Liquidation Price:</span>
                  <span className="text-red-400">$38,520.00</span>
                </div>
              </div>

              {/* Place Order Button */}
              <motion.button
                onClick={handlePlaceOrder}
                disabled={isLoading || !isConnected}
                className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                  isLoading || !isConnected
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : side === 'long'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
              >
                {isLoading ? 'Placing Order...' : `Place ${side.toUpperCase()} Order`}
              </motion.button>
            </div>
          </div>
        )}

        {/* Positions Panel */}
        {activeTab === 'positions' && (
          <div className="lg:col-span-2">
            <div className="bg-gray-900/30 backdrop-blur-xl rounded-xl p-6 border border-gray-800">
              <h3 className="text-lg font-semibold mb-4">Open Positions</h3>
              {positions.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No open positions</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {positions.map((position) => (
                    <div key={position.id} className="bg-gray-800/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">{position.market}</span>
                        <span className={`px-2 py-1 rounded text-sm ${
                          position.side === 'long' ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'
                        }`}>
                          {position.side.toUpperCase()}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Size:</span>
                          <p>{position.size} {position.market.split('-')[0]}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Entry Price:</span>
                          <p>${position.entryPrice}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Mark Price:</span>
                          <p>${position.markPrice}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">PnL:</span>
                          <p className={position.pnl.startsWith('+') ? 'text-green-400' : 'text-red-400'}>
                            {position.pnl} ({position.pnlPercent})
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Market Info Sidebar */}
        <div className="space-y-6">
          {/* Price Chart Placeholder */}
          <div className="bg-gray-900/30 backdrop-blur-xl rounded-xl p-6 border border-gray-800">
            <h3 className="text-lg font-semibold mb-4">Price Chart</h3>
            <div className="h-64 bg-gray-800/50 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-400">
                <BarChart2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Chart Integration</p>
                <p className="text-sm">Coming Soon</p>
              </div>
            </div>
          </div>

          {/* Market Stats */}
          {selectedMarket && (
            <div className="bg-gray-900/30 backdrop-blur-xl rounded-xl p-6 border border-gray-800">
              <h3 className="text-lg font-semibold mb-4">Market Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">24h Volume:</span>
                  <span>{selectedMarket.volume24h}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Open Interest:</span>
                  <span>{selectedMarket.openInterest}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Funding Rate:</span>
                  <span>{selectedMarket.fundingRate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Max Leverage:</span>
                  <span>{selectedMarket.maxLeverage}</span>
                </div>
              </div>
            </div>
          )}

          {/* PYTH Price Feed Info */}
          <div className="bg-gradient-to-r from-purple-600/10 to-blue-600/10 border border-purple-500/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 text-purple-400">PYTH Price Feeds</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Provider:</span>
                <span>PYTH Network</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Update Frequency:</span>
                <span>400ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Confidence:</span>
                <span className="text-green-400">99.9%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavigatorPerpInterface;
