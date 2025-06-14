import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface PerpOrderBookProps {
  market: string;
}

interface OrderBookEntry {
  price: number;
  size: number;
  total: number;
  depth: number;
}

const PerpOrderBook: React.FC<PerpOrderBookProps> = ({ market }) => {
  const [asks, setAsks] = useState<OrderBookEntry[]>([]);
  const [bids, setBids] = useState<OrderBookEntry[]>([]);
  const [spread, setSpread] = useState<{ amount: number, percentage: number }>({ amount: 0, percentage: 0 });
  const [grouping, setGrouping] = useState<number>(0.5);
  const [loading, setLoading] = useState<boolean>(true);

  // Generate mock order book data based on market
  useEffect(() => {
    setLoading(true);
    
    // Get base price from market
    let basePrice = 50000; // Default to BTC price
    if (market.startsWith('ETH')) {
      basePrice = 3500;
    } else if (market.startsWith('ALT')) {
      basePrice = 0.000173;
    }
    
    // Generate asks (sell orders)
    const mockAsks: OrderBookEntry[] = [];
    let askTotal = 0;
    for (let i = 0; i < 15; i++) {
      const price = basePrice * (1 + ((i + 1) * grouping / 100));
      const size = Math.random() * 10 + 0.1;
      askTotal += size;
      mockAsks.push({
        price,
        size,
        total: askTotal,
        depth: 0 // Will be calculated later
      });
    }
    
    // Generate bids (buy orders)
    const mockBids: OrderBookEntry[] = [];
    let bidTotal = 0;
    for (let i = 0; i < 15; i++) {
      const price = basePrice * (1 - ((i + 1) * grouping / 100));
      const size = Math.random() * 10 + 0.1;
      bidTotal += size;
      mockBids.push({
        price,
        size,
        total: bidTotal,
        depth: 0 // Will be calculated later
      });
    }
    
    // Calculate depth percentages
    const maxTotal = Math.max(askTotal, bidTotal);
    mockAsks.forEach(ask => {
      ask.depth = (ask.total / maxTotal) * 100;
    });
    mockBids.forEach(bid => {
      bid.depth = (bid.total / maxTotal) * 100;
    });
    
    // Calculate spread
    const lowestAsk = mockAsks[0].price;
    const highestBid = mockBids[0].price;
    const spreadAmount = lowestAsk - highestBid;
    const spreadPercentage = (spreadAmount / lowestAsk) * 100;
    
    setAsks(mockAsks);
    setBids(mockBids);
    setSpread({
      amount: spreadAmount,
      percentage: spreadPercentage
    });
    
    setLoading(false);
  }, [market, grouping]);

  const handleGroupingChange = (value: number) => {
    setGrouping(value);
  };

  // Format price based on market
  const formatPrice = (price: number) => {
    if (market.startsWith('BTC')) {
      return price.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    } else if (market.startsWith('ETH')) {
      return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else if (market.startsWith('ALT')) {
      return price.toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 6 });
    }
    return price.toLocaleString();
  };

  return (
    <motion.div
      className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Order Book</h3>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400">Grouping:</span>
          <div className="flex space-x-1">
            {[0.1, 0.5, 1, 5].map((value) => (
              <button
                key={value}
                onClick={() => handleGroupingChange(value)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  grouping === value
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Asks (Sell Orders) */}
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-2 px-2">
              <span>Price (USD)</span>
              <span>Size</span>
              <span>Total</span>
            </div>
            <div className="space-y-1">
              {asks.map((ask, index) => (
                <div key={index} className="relative">
                  <div 
                    className="absolute right-0 top-0 h-full bg-red-500/10 z-0"
                    style={{ width: `${ask.depth}%` }}
                  ></div>
                  <div className="flex justify-between text-xs py-1 px-2 relative z-10">
                    <span className="text-red-400">{formatPrice(ask.price)}</span>
                    <span>{ask.size.toFixed(4)}</span>
                    <span className="text-slate-400">{ask.total.toFixed(4)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bids (Buy Orders) */}
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-2 px-2">
              <span>Price (USD)</span>
              <span>Size</span>
              <span>Total</span>
            </div>
            <div className="space-y-1">
              {bids.map((bid, index) => (
                <div key={index} className="relative">
                  <div 
                    className="absolute left-0 top-0 h-full bg-emerald-500/10 z-0"
                    style={{ width: `${bid.depth}%` }}
                  ></div>
                  <div className="flex justify-between text-xs py-1 px-2 relative z-10">
                    <span className="text-emerald-400">{formatPrice(bid.price)}</span>
                    <span>{bid.size.toFixed(4)}</span>
                    <span className="text-slate-400">{bid.total.toFixed(4)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Spread */}
      <div className="mt-4 p-3 bg-slate-900/50 rounded-lg text-center">
        <p className="text-sm">
          <span className="text-slate-400">Spread: </span>
          <span className="font-medium">{formatPrice(spread.amount)} ({spread.percentage.toFixed(2)}%)</span>
        </p>
      </div>
    </motion.div>
  );
};

export default PerpOrderBook;