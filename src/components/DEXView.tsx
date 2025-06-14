import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ArrowUpDown, BarChart3, DollarSign, Network, ArrowLeftRight } from 'lucide-react';
import { usePrices } from '../hooks/usePrices';
import OrderBook from './dex/OrderBook';
import TradingChart from './dex/TradingChart';
import TradeForm from './dex/TradeForm';
import LiquidityPools from './dex/LiquidityPools';
import SwapInterface from './dex/SwapInterface';
import UniswapV4Interface from './dex/UniswapV4Interface';
import CrossChainBridge from './dex/CrossChainBridge';

const DEXView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'uniswap' | 'spot' | 'pools' | 'multichain' | 'bridge'>('uniswap');
  const { getPrice } = usePrices(['ALT', 'BTC', 'ETH']);

  const altPrice = getPrice('ALT');
  const volume24h = altPrice ? altPrice.volume24h * altPrice.price : 0;

  const stats = [
    {
      label: '24h Volume',
      value: `$${volume24h.toLocaleString()}`,
      change: altPrice ? `+${altPrice.changePercent24h.toFixed(1)}%` : '+0%',
      icon: BarChart3,
      color: 'text-emerald-400'
    },
    {
      label: 'Total Liquidity',
      value: '$15.8M',
      change: '+5.2%',
      icon: DollarSign,
      color: 'text-blue-400'
    },
    {
      label: 'Active Networks',
      value: '10',
      change: '+2',
      icon: Network,
      color: 'text-purple-400'
    },
    {
      label: 'Active Pairs',
      value: '124',
      change: '+8',
      icon: TrendingUp,
      color: 'text-yellow-400'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h2 className="text-3xl font-bold">Decentralized Exchange</h2>
          <p className="text-slate-400 mt-1">Multi-chain trading powered by Swapin.co</p>
        </div>
        
        <div className="flex items-center space-x-2 bg-slate-800/50 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('uniswap')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'uniswap'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Uniswap V4
          </button>
          <button
            onClick={() => setActiveTab('multichain')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'multichain'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Multi-Chain
          </button>
          <button
            onClick={() => setActiveTab('spot')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'spot'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Spot Trading
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
            onClick={() => setActiveTab('bridge')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'bridge'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Bridge
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className={`text-sm ${stat.color}`}>{stat.change}</p>
                </div>
                <Icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'uniswap' && <UniswapV4Interface />}
        {activeTab === 'multichain' && <SwapInterface />}
        {activeTab === 'spot' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 space-y-6">
              <TradingChart />
              <OrderBook />
            </div>
            <div className="lg:col-span-1">
              <TradeForm />
            </div>
          </div>
        )}
        {activeTab === 'pools' && <LiquidityPools />}
        {activeTab === 'bridge' && <CrossChainBridge />}
      </motion.div>

      {/* Swapin.co Info */}
      <motion.div
        className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/30 rounded-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-blue-600/20 rounded-lg">
            <Network className="w-6 h-6 text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-400 mb-2">Multi-Chain DEX Integration</h3>
            <p className="text-slate-300 mb-3">
              Powered by Swapin.co's Uniswap V4 compatible contracts deployed across 10 different blockchains. 
              Trade seamlessly between networks with consistent contract addresses and familiar interfaces.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
              {[
                'EGAZ', 'PlanQ', 'OctaSpace', 'PartyChain', 'EGEM', 
                'ETHO', 'Altcoinchain', 'DOGEchain', 'Fantom'
              ].map((network) => (
                <div key={network} className="bg-slate-800/50 rounded px-2 py-1 text-center">
                  {network}
                </div>
              ))}
            </div>
            <div className="mt-4 text-xs text-slate-400">
              <p>• Factory: 0x347aAc6D939f98854110Ff48dC5B7beB52D86445</p>
              <p>• Router: 0xae168Ce47cebca9abbC5107a58df0532f1afa4d6</p>
              <p>• Deployer: 0xE01A6a52Ef245FDeA587735aFe60a1C96152A48D</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DEXView;