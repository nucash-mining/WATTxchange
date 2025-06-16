import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ArrowUpDown, BarChart3, DollarSign, Network, ArrowLeftRight, Zap, Key, AlertTriangle } from 'lucide-react';
import { usePrices } from '../hooks/usePrices';
import { useWallet } from '../hooks/useWallet';
import OrderBook from './dex/OrderBook';
import TradingChart from './dex/TradingChart';
import TradeForm from './dex/TradeForm';
import LiquidityPools from './dex/LiquidityPools';
import SwapInterface from './dex/SwapInterface';
import SwapinV2Interface from './dex/SwapinV2Interface';
import CrossChainBridge from './dex/AxelarBridgeInterface';
import PerpetualTrading from './dex/PerpetualTrading';
import ExchangeApiManager from './dex/ExchangeApiManager';

const DEXView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'uniswap' | 'spot' | 'pools' | 'multichain' | 'bridge' | 'perps'>('uniswap');
  const { getPrice } = usePrices(['ALT', 'BTC', 'ETH']);
  const [showApiManager, setShowApiManager] = useState(false);
  const { isConnected, connectWallet } = useWallet();

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
        
        <div className="flex items-center space-x-3">
          <motion.button
            onClick={() => setShowApiManager(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Key className="w-4 h-4" />
            <span>API Keys</span>
          </motion.button>
          
          <div className="flex items-center space-x-2 bg-slate-800/50 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('uniswap')}
              className={`px-4 py-2 rounded-md transition-colors ${
                activeTab === 'uniswap'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Swapin V2
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
              Spot
            </button>
            <button
              onClick={() => setActiveTab('perps')}
              className={`px-4 py-2 rounded-md transition-colors ${
                activeTab === 'perps'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Perpetuals
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
                Connect your wallet to access all DEX features
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

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'uniswap' && <SwapinV2Interface />}
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
        {activeTab === 'perps' && <PerpetualTrading />}
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
              Powered by Swapin.co's Uniswap V2 compatible contracts deployed across 10 different blockchains. 
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

      {/* Exchange API Manager Modal */}
      <ExchangeApiManager 
        isOpen={showApiManager} 
        onClose={() => setShowApiManager(false)} 
      />

      {/* Built with Bolt.new badge */}
      <div className="flex justify-center mt-8">
        <a 
          href="https://bolt.new" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center space-x-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-colors border border-slate-700/50"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13 2L4.09 12.11C3.69 12.59 3.48 12.83 3.43 13.11C3.38 13.35 3.44 13.6 3.6 13.8C3.78 14.03 4.14 14.12 4.84 14.31L10.07 15.93C10.35 16.02 10.49 16.06 10.59 16.15C10.68 16.23 10.73 16.34 10.73 16.46C10.74 16.6 10.65 16.76 10.46 17.08L7.75 21.5" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14.7 14.5L16.7 14.5C17.2523 14.5 17.5284 14.5 17.7611 14.3891C17.9623 14.2929 18.1297 14.1255 18.2259 13.9243C18.3368 13.6916 18.3368 13.4155 18.3368 12.8632L18.3368 6.13678C18.3368 5.58451 18.3368 5.30837 18.2259 5.07568C18.1297 4.87446 17.9623 4.70708 17.7611 4.61083C17.5284 4.5 17.2523 4.5 16.7 4.5L14.7 4.5" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-yellow-400 font-medium">Built with Bolt.new</span>
        </a>
      </div>
    </div>
  );
};

export default DEXView;