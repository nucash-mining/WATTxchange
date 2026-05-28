import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpDown } from 'lucide-react';
import { priceService } from '../../services/priceService';
import { usePrices } from '../../hooks/usePrices';
import toast from 'react-hot-toast';

const TradeForm: React.FC = () => {
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [selectedPair, setSelectedPair] = useState<'ALT/BTC' | 'ALT/USDT' | 'XMR/BTC' | 'WATT/ALT' | 'GHOST/BTC' | 'TROLL/BTC'>('ALT/BTC');

  const { getPrice, formatPrice } = usePrices(['ALT', 'BTC', 'XMR', 'WATT', 'GHOST', 'TROLL']);
  const altPrice = getPrice('ALT');
  const btcPrice = getPrice('BTC');
  const xmrPrice = getPrice('XMR');
  const wattPrice = getPrice('WATT');
  const ghostPrice = getPrice('GHOST');
  const trollPrice = getPrice('TROLL');

  // Get current exchange rates
  const altToBtcRate = priceService.getAltPriceInBtc();
  const getCurrentPrice = () => {
    switch (selectedPair) {
      case 'ALT/BTC':
        return altToBtcRate;
      case 'ALT/USDT':
        return altPrice?.price || 0.000173;
      case 'XMR/BTC':
        return xmrPrice && btcPrice ? xmrPrice.price / btcPrice.price : 0.0036;
      case 'WATT/ALT':
        return 1.5; // Example rate
      case 'GHOST/BTC':
        return ghostPrice && btcPrice ? ghostPrice.price / btcPrice.price : 0.000045;
      case 'TROLL/BTC':
        return trollPrice && btcPrice ? trollPrice.price / btcPrice.price : 0.000001;
      default:
        return 0;
    }
  };

  const currentPrice = getCurrentPrice();

  const tokens = [
    { 
      symbol: 'ALT', 
      name: 'Altcoin', 
      balance: '1,234.56',
      icon: () => <img src="/Altcoinchain logo.png" alt="ALT" className="w-6 h-6 object-contain rounded-full" />
    },
    { 
      symbol: 'BTC', 
      name: 'Bitcoin', 
      balance: '0.05432',
      icon: () => <img src="/BTC logo.png" alt="BTC" className="w-6 h-6 object-contain" />
    },
    { 
      symbol: 'ETH', 
      name: 'Ethereum', 
      balance: '2.1847',
      icon: () => <img src="/ETH logo.png" alt="ETH" className="w-6 h-6 object-contain" />
    },
    { 
      symbol: 'LTC', 
      name: 'Litecoin', 
      balance: '12.67',
      icon: () => <img src="/LTC logo.png" alt="LTC" className="w-6 h-6 object-contain" />
    },
    { 
      symbol: 'XMR', 
      name: 'Monero', 
      balance: '5.234',
      icon: () => <img src="/XMR logo.png" alt="XMR" className="w-6 h-6 object-contain" />
    },
    { 
      symbol: 'WATT', 
      name: 'WATT Token', 
      balance: '56.7',
      icon: () => <img src="/WATT logo.png" alt="WATT" className="w-6 h-6 object-contain" />
    },
    { 
      symbol: 'GHOST', 
      name: 'GHOST', 
      balance: '1,250.75',
      icon: () => <img src="/GHOST logo.png" alt="GHOST" className="w-6 h-6 object-contain" />
    },
    { 
      symbol: 'TROLL', 
      name: 'Trollcoin', 
      balance: '15,420.69',
      icon: () => <img src="/TROLL logo.png" alt="TROLL" className="w-6 h-6 object-contain" />
    }
  ];

  const handleSwapTokens = () => {
    const tempAmount = sendAmount;
    setSendAmount(receiveAmount);
    setReceiveAmount(tempAmount);
  };

  const handleTrade = () => {
    if (!amount) {
      toast.error('Please enter an amount');
      return;
    }
    
    const amountNum = parseFloat(amount);
    const priceNum = orderType === 'limit' ? parseFloat(price || '0') : currentPrice;
    
    const [baseToken, quoteToken] = selectedPair.split('/');
    const total = amountNum * priceNum;
    
    toast.success(`${tradeType.toUpperCase()} order placed: ${amountNum} ${baseToken} for ${total.toFixed(8)} ${quoteToken}`);
    
    setAmount('');
    setPrice('');
  };

  const calculateTotal = () => {
    const amountNum = parseFloat(amount || '0');
    const priceNum = orderType === 'limit' ? parseFloat(price || '0') : currentPrice;
    return amountNum * priceNum;
  };

  const [baseToken, quoteToken] = selectedPair.split('/');

  return (
    <motion.div
      className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
    >
      <h3 className="text-xl font-semibold mb-6">Place Order</h3>

      {/* Trading Pair Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Trading Pair</label>
        <div className="grid grid-cols-2 gap-2">
          {['ALT/BTC', 'ALT/USDT', 'XMR/BTC', 'WATT/ALT', 'GHOST/BTC', 'TROLL/BTC'].map((pair) => {
            const [base, quote] = pair.split('/');
            const baseToken = tokens.find(t => t.symbol === base);
            const quoteToken = tokens.find(t => t.symbol === quote);
            
            return (
              <button
                key={pair}
                onClick={() => setSelectedPair(pair as any)}
                className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-lg transition-colors ${
                  selectedPair === pair
                    ? 'bg-blue-600/20 border border-blue-500/30 text-blue-400'
                    : 'bg-slate-700/50 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-1">
                  {baseToken && <baseToken.icon />}
                  <span className="text-sm">{base}</span>
                </div>
                <span className="text-xs">/</span>
                <div className="flex items-center space-x-1">
                  {quoteToken && <quoteToken.icon />}
                  <span className="text-sm">{quote}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Trade Type */}
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => setTradeType('buy')}
          className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
            tradeType === 'buy'
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-700/50 text-slate-400 hover:text-white'
          }`}
        >
          Buy {baseToken}
        </button>
        <button
          onClick={() => setTradeType('sell')}
          className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
            tradeType === 'sell'
              ? 'bg-red-600 text-white'
              : 'bg-slate-700/50 text-slate-400 hover:text-white'
          }`}
        >
          Sell {baseToken}
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
      </div>

      {/* Current Price Display */}
      <div className="mb-4 p-3 bg-slate-900/50 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">Current Price</span>
          <div className="text-right">
            <p className="font-bold">
              {currentPrice.toFixed(selectedPair === 'ALT/BTC' || selectedPair === 'TROLL/BTC' ? 10 : 6)} {quoteToken}
            </p>
            <p className="text-xs text-slate-400">per {baseToken}</p>
          </div>
        </div>
      </div>

      {/* Amount Input */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-slate-400 mb-2">Amount ({baseToken})</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-3 focus:outline-none focus:border-blue-500/50"
          />
        </div>

        {orderType === 'limit' && (
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Price ({quoteToken})
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder={selectedPair === 'ALT/BTC' || selectedPair === 'TROLL/BTC' ? '0.0000000000' : '0.000000'}
              step={selectedPair === 'ALT/BTC' || selectedPair === 'TROLL/BTC' ? '0.0000000001' : '0.000001'}
              className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-3 focus:outline-none focus:border-blue-500/50"
            />
          </div>
        )}

        {/* Order Summary */}
        <div className="bg-slate-900/50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Total</span>
            <span>{calculateTotal().toFixed(selectedPair === 'ALT/BTC' || selectedPair === 'TROLL/BTC' ? 8 : 6)} {quoteToken}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Fee (0.1%)</span>
            <span>{(calculateTotal() * 0.001).toFixed(selectedPair === 'ALT/BTC' || selectedPair === 'TROLL/BTC' ? 8 : 6)} {quoteToken}</span>
          </div>
          {selectedPair === 'ALT/BTC' && amount && (
            <div className="pt-2 border-t border-slate-700/30">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Exchange Rate</span>
                <span>100,000 ALT = 0.00016 BTC</span>
              </div>
            </div>
          )}
          {selectedPair === 'TROLL/BTC' && amount && (
            <div className="pt-2 border-t border-slate-700/30">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Trollcoin PoW</span>
                <span>Proof-of-Work mining</span>
              </div>
            </div>
          )}
          {selectedPair === 'GHOST/BTC' && amount && (
            <div className="pt-2 border-t border-slate-700/30">
              <div className="flex justify-between text-xs text-slate-400">
                <span>GHOST PoS Coin</span>
                <span>Proof-of-Stake consensus</span>
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <motion.button
          onClick={handleTrade}
          className={`w-full py-3 rounded-lg font-medium transition-colors ${
            tradeType === 'buy'
              ? 'bg-emerald-600 hover:bg-emerald-700'
              : 'bg-red-600 hover:bg-red-700'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {tradeType === 'buy' ? 'Buy' : 'Sell'} {baseToken}
          <span className="ml-2 text-sm opacity-75">for {quoteToken}</span>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default TradeForm;