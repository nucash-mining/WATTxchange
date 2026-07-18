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

/**
 * Stacked exchange-style order book: asks (best at the bottom) over the
 * spread row, bids below. Single-column ladder so it fits narrow terminal
 * side panels and wide pages alike without overflowing its container.
 */
const PerpOrderBook: React.FC<PerpOrderBookProps> = ({ market }) => {
  const [asks, setAsks] = useState<OrderBookEntry[]>([]);
  const [bids, setBids] = useState<OrderBookEntry[]>([]);
  const [spread, setSpread] = useState<{ amount: number, percentage: number }>({ amount: 0, percentage: 0 });
  const [grouping, setGrouping] = useState<number>(0.5);
  const [loading, setLoading] = useState<boolean>(true);

  const LEVELS = 12;

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
    for (let i = 0; i < LEVELS; i++) {
      const price = basePrice * (1 + ((i + 1) * grouping / 100));
      const size = Math.random() * 10 + 0.1;
      askTotal += size;
      mockAsks.push({ price, size, total: askTotal, depth: 0 });
    }

    // Generate bids (buy orders)
    const mockBids: OrderBookEntry[] = [];
    let bidTotal = 0;
    for (let i = 0; i < LEVELS; i++) {
      const price = basePrice * (1 - ((i + 1) * grouping / 100));
      const size = Math.random() * 10 + 0.1;
      bidTotal += size;
      mockBids.push({ price, size, total: bidTotal, depth: 0 });
    }

    // Calculate depth percentages
    const maxTotal = Math.max(askTotal, bidTotal);
    mockAsks.forEach(ask => { ask.depth = (ask.total / maxTotal) * 100; });
    mockBids.forEach(bid => { bid.depth = (bid.total / maxTotal) * 100; });

    // Calculate spread
    const lowestAsk = mockAsks[0].price;
    const highestBid = mockBids[0].price;
    const spreadAmount = lowestAsk - highestBid;
    setAsks(mockAsks);
    setBids(mockBids);
    setSpread({ amount: spreadAmount, percentage: (spreadAmount / lowestAsk) * 100 });

    setLoading(false);
  }, [market, grouping]);

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

  const Row = ({ entry, side }: { entry: OrderBookEntry; side: 'ask' | 'bid' }) => (
    <div className="relative min-w-0">
      <div
        className={`absolute right-0 top-0 h-full z-0 ${side === 'ask' ? 'bg-red-500/10' : 'bg-emerald-500/10'}`}
        style={{ width: `${entry.depth}%` }}
      />
      <div className="grid grid-cols-3 gap-1 text-[11px] leading-5 px-1 relative z-10 tabular-nums">
        <span className={`truncate ${side === 'ask' ? 'text-red-400' : 'text-emerald-400'}`}>
          {formatPrice(entry.price)}
        </span>
        <span className="truncate text-right text-slate-300">{entry.size.toFixed(3)}</span>
        <span className="truncate text-right text-slate-500">{entry.total.toFixed(3)}</span>
      </div>
    </div>
  );

  return (
    <motion.div
      className="min-w-0 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
        <h3 className="text-[13px] font-semibold text-slate-200">Order Book</h3>
        <div className="flex items-center gap-1">
          {[0.1, 0.5, 1, 5].map((value) => (
            <button
              key={value}
              onClick={() => setGrouping(value)}
              className={`px-1.5 py-0.5 text-[10px] rounded transition-colors ${
                grouping === value
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700/60 hover:bg-slate-600 text-slate-300'
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="min-w-0">
          <div className="grid grid-cols-3 gap-1 text-[10px] uppercase tracking-wide text-slate-500 px-1 mb-1">
            <span>Price</span>
            <span className="text-right">Size</span>
            <span className="text-right">Total</span>
          </div>

          {/* Asks: worst at top, best ask adjacent to the spread row */}
          <div className="space-y-px">
            {[...asks].reverse().map((ask, index) => (
              <Row key={`a${index}`} entry={ask} side="ask" />
            ))}
          </div>

          {/* Spread */}
          <div className="my-1.5 py-1 px-1 bg-slate-900/60 rounded flex items-baseline justify-between gap-2 text-[11px] tabular-nums">
            <span className="text-slate-500">Spread</span>
            <span className="text-slate-300 truncate">
              {formatPrice(spread.amount)} ({spread.percentage.toFixed(2)}%)
            </span>
          </div>

          {/* Bids: best at top */}
          <div className="space-y-px">
            {bids.map((bid, index) => (
              <Row key={`b${index}`} entry={bid} side="bid" />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default PerpOrderBook;
