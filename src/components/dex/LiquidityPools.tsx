import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Droplets, TrendingUp, Network } from 'lucide-react';
import { swapinService } from '../../services/swapinService';

const LiquidityPools: React.FC = () => {
  const [selectedNetwork, setSelectedNetwork] = useState('all');
  const networks = swapinService.getAllNetworks();

  const pools = [
    // Altcoinchain pools
    {
      pair: 'ALT/WATT',
      network: 'Altcoinchain',
      chainId: 2330,
      tvl: '$2.4M',
      apr: '24.5%',
      volume24h: '$850K',
      myLiquidity: '$0',
      token1: 'ALT',
      token2: 'WATT',
      token1Icon: () => <img src="/Altcoinchain logo.png" alt="ALT" className="w-6 h-6 object-contain rounded-full" />,
      token2Icon: () => <img src="/WATT logo.png" alt="WATT" className="w-6 h-6 object-contain" />
    },
    {
      pair: 'ALT/USDT',
      network: 'Altcoinchain',
      chainId: 2330,
      tvl: '$1.8M',
      apr: '18.2%',
      volume24h: '$620K',
      myLiquidity: '$0',
      token1: 'ALT',
      token2: 'USDT',
      token1Icon: () => <img src="/Altcoinchain logo.png" alt="ALT" className="w-6 h-6 object-contain rounded-full" />,
      token2Icon: () => <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-xs font-bold">U</div>
    },
    // EGAZ pools
    {
      pair: 'EGAZ/USDT',
      network: 'EGAZ',
      chainId: 1234,
      tvl: '$1.2M',
      apr: '32.1%',
      volume24h: '$340K',
      myLiquidity: '$0',
      token1: 'EGAZ',
      token2: 'USDT',
      token1Icon: () => <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-xs font-bold">⚡</div>,
      token2Icon: () => <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-xs font-bold">U</div>
    },
    {
      pair: 'wEGAZ/EGAZ',
      network: 'EGAZ',
      chainId: 1234,
      tvl: '$890K',
      apr: '15.7%',
      volume24h: '$280K',
      myLiquidity: '$0',
      token1: 'wEGAZ',
      token2: 'EGAZ',
      token1Icon: () => <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-xs font-bold">W</div>,
      token2Icon: () => <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-xs font-bold">⚡</div>
    },
    // PlanQ pools
    {
      pair: 'PLQ/SWAPD',
      network: 'PlanQ',
      chainId: 7070,
      tvl: '$750K',
      apr: '28.4%',
      volume24h: '$195K',
      myLiquidity: '$0',
      token1: 'PLQ',
      token2: 'SWAPD',
      token1Icon: () => <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold">🌐</div>,
      token2Icon: () => <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs font-bold">S</div>
    },
    {
      pair: 'wPLQ/USDT',
      network: 'PlanQ',
      chainId: 7070,
      tvl: '$650K',
      apr: '22.1%',
      volume24h: '$180K',
      myLiquidity: '$0',
      token1: 'wPLQ',
      token2: 'USDT',
      token1Icon: () => <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-xs font-bold">W</div>,
      token2Icon: () => <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-xs font-bold">U</div>
    },
    // OctaSpace pools
    {
      pair: 'OCTA/USDT',
      network: 'OctaSpace',
      chainId: 800001,
      tvl: '$520K',
      apr: '35.2%',
      volume24h: '$125K',
      myLiquidity: '$0',
      token1: 'OCTA',
      token2: 'USDT',
      token1Icon: () => <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs font-bold">🐙</div>,
      token2Icon: () => <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-xs font-bold">U</div>
    },
    // Fantom pools
    {
      pair: 'FTM/USDT',
      network: 'Fantom',
      chainId: 250,
      tvl: '$3.2M',
      apr: '14.3%',
      volume24h: '$1.1M',
      myLiquidity: '$0',
      token1: 'FTM',
      token2: 'USDT',
      token1Icon: () => <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold">👻</div>,
      token2Icon: () => <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-xs font-bold">U</div>
    },
    // GHOST pools
    {
      pair: 'GHOST/USDT',
      network: 'Multi-Chain',
      chainId: 0,
      tvl: '$420K',
      apr: '41.7%',
      volume24h: '$95K',
      myLiquidity: '$0',
      token1: 'GHOST',
      token2: 'USDT',
      token1Icon: () => <img src="/GHOST logo.png" alt="GHOST" className="w-6 h-6 object-contain" />,
      token2Icon: () => <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-xs font-bold">U</div>
    }
  ];

  const filteredPools = selectedNetwork === 'all' 
    ? pools 
    : pools.filter(pool => pool.network === selectedNetwork || pool.chainId.toString() === selectedNetwork);

  const getNetworkIcon = (network: string) => {
    const iconMap: Record<string, string> = {
      'EGAZ': '⚡',
      'PlanQ': '🌐',
      'OctaSpace': '🐙',
      'PartyChain': '🎉',
      'EGEM': '💎',
      'ETHO': '🔷',
      'Altcoinchain': '🔗',
      'DOGEchain': '🐕',
      'Fantom': '👻',
      'Multi-Chain': '🌍'
    };
    return iconMap[network] || '🔗';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold">Multi-Chain Liquidity Pools</h3>
        <motion.button
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="w-4 h-4" />
          <span>Add Liquidity</span>
        </motion.button>
      </div>

      {/* Network Filter */}
      <div className="flex items-center space-x-3 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedNetwork('all')}
          className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
            selectedNetwork === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-700 hover:bg-slate-600'
          }`}
        >
          All Networks
        </button>
        {networks.map((network) => (
          <button
            key={network.chainId}
            onClick={() => setSelectedNetwork(network.name)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              selectedNetwork === network.name
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 hover:bg-slate-600'
            }`}
          >
            <span>{getNetworkIcon(network.name)}</span>
            <span>{network.name}</span>
          </button>
        ))}
      </div>

      {/* Pools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPools.map((pool, index) => {
          const Token1Icon = pool.token1Icon;
          const Token2Icon = pool.token2Icon;
          
          return (
            <motion.div
              key={`${pool.pair}-${pool.network}`}
              className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -2 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Droplets className="w-5 h-5 text-blue-400" />
                  <div className="flex items-center space-x-1">
                    <Token1Icon />
                    <span className="font-semibold">/</span>
                    <Token2Icon />
                  </div>
                  <h4 className="font-semibold">{pool.pair}</h4>
                  {pool.token1 === 'GHOST' && (
                    <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
                      PoS
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-1 text-emerald-400">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">{pool.apr}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">Network</span>
                  <div className="flex items-center space-x-1">
                    <span>{getNetworkIcon(pool.network)}</span>
                    <span className="font-medium text-sm">{pool.network}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">TVL</span>
                  <span className="font-medium">{pool.tvl}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">24h Volume</span>
                  <span className="font-medium">{pool.volume24h}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">My Liquidity</span>
                  <span className="font-medium">{pool.myLiquidity}</span>
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
                  Remove
                </motion.button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Pool Statistics */}
      <motion.div
        className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h4 className="text-lg font-semibold mb-4">Multi-Chain Pool Statistics</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-400">$12.4M</p>
            <p className="text-slate-400 text-sm">Total Value Locked</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-400">24.1%</p>
            <p className="text-slate-400 text-sm">Average APR</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-400">$3.51M</p>
            <p className="text-slate-400 text-sm">24h Volume</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-400">10</p>
            <p className="text-slate-400 text-sm">Active Networks</p>
          </div>
        </div>
      </motion.div>

      {/* Swapin.co Integration Info */}
      <motion.div
        className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/30 rounded-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-start space-x-3">
          <Network className="w-6 h-6 text-blue-400 mt-1" />
          <div>
            <h4 className="text-lg font-semibold text-blue-400 mb-2">Swapin.co Liquidity Pools</h4>
            <p className="text-slate-300 mb-3">
              Provide liquidity across multiple blockchains using Swapin.co's unified DEX infrastructure. 
              Earn fees from trades while supporting cross-chain DeFi ecosystems.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-slate-400">
              <div>• Uniswap V2 Compatible</div>
              <div>• Cross-Chain Rewards</div>
              <div>• Unified Interface</div>
              <div>• Low Gas Fees</div>
              <div>• High APR Opportunities</div>
              <div>• Multi-Network Support</div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LiquidityPools;