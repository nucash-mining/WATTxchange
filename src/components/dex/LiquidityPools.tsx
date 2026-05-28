import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Droplets, TrendingUp, Network, ChevronDown, ChevronUp } from 'lucide-react';
import { swapinService } from '../../services/swapinService';
import AddLiquidityModal from './AddLiquidityModal';
// import toast from 'react-hot-toast';

const LiquidityPools: React.FC = () => {
  const [selectedNetwork, setSelectedNetwork] = useState('all');
  const [showAddLiquidityModal, setShowAddLiquidityModal] = useState(false);
  const [selectedPool, setSelectedPool] = useState<{
    id: string;
    name: string;
    token0: string;
    token1: string;
    reserve0: string;
    reserve1: string;
    totalSupply: string;
    fee: number;
  } | null>(null);
  const [expandedPool, setExpandedPool] = useState<string | null>(null);
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
      token2Icon: () => <img src="/WATT logo.png" alt="WATT" className="w-6 h-6 object-contain" />,
      address: '0xb2F8e147d6a2570b19d1731401DDD5A4F62e2C33'
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
      token1Icon: () => <img src="/OCTA logo.png" alt="OCTA" className="w-6 h-6 object-contain rounded-full" />,
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
      token1Icon: () => <img src="/Fantom logo.png" alt="FTM" className="w-6 h-6 object-contain rounded-full" />,
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
    },
    // Altcoinchain custom pools
    {
      pair: 'AltPEPE/AltPEPI',
      network: 'Altcoinchain',
      chainId: 2330,
      tvl: '$1.2M',
      apr: '38.5%',
      volume24h: '$450K',
      myLiquidity: '$0',
      token1: 'AltPEPE',
      token2: 'AltPEPI',
      token1Icon: () => <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold">P</div>,
      token2Icon: () => <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center text-xs font-bold">P</div>,
      address: '0x284F01A8AB6542e8E257f289A2c4E851C7ebc82E'
    },
    {
      pair: 'AltPEPE/wALT',
      network: 'Altcoinchain',
      chainId: 2330,
      tvl: '$980K',
      apr: '32.7%',
      volume24h: '$320K',
      myLiquidity: '$0',
      token1: 'AltPEPE',
      token2: 'wALT',
      token1Icon: () => <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold">P</div>,
      token2Icon: () => <img src="/Altcoinchain logo.png" alt="ALT" className="w-6 h-6 object-contain rounded-full" />,
      address: '0xB1297e255933E6c11bc72D6De2c911e4a05A18d8'
    },
    {
      pair: 'SCAM/wALT',
      network: 'Altcoinchain',
      chainId: 2330,
      tvl: '$750K',
      apr: '45.2%',
      volume24h: '$280K',
      myLiquidity: '$0',
      token1: 'SCAM',
      token2: 'wALT',
      token1Icon: () => <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold">S</div>,
      token2Icon: () => <img src="/Altcoinchain logo.png" alt="ALT" className="w-6 h-6 object-contain rounded-full" />,
      address: '0x4d40fa6da5495f74f61af89008035062a0f66730'
    },
    {
      pair: 'SWAPD/wALT',
      network: 'Altcoinchain',
      chainId: 2330,
      tvl: '$680K',
      apr: '29.8%',
      volume24h: '$210K',
      myLiquidity: '$0',
      token1: 'SWAPD',
      token2: 'wALT',
      token1Icon: () => <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs font-bold">S</div>,
      token2Icon: () => <img src="/Altcoinchain logo.png" alt="ALT" className="w-6 h-6 object-contain rounded-full" />,
      address: '0x044e22b6276424d0b6e014Fd9E259D03C7b031bb'
    },
    {
      pair: 'MALT/wALT',
      network: 'Altcoinchain',
      chainId: 2330,
      tvl: '$520K',
      apr: '36.4%',
      volume24h: '$180K',
      myLiquidity: '$0',
      token1: 'MALT',
      token2: 'wALT',
      token1Icon: () => <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold">M</div>,
      token2Icon: () => <img src="/Altcoinchain logo.png" alt="ALT" className="w-6 h-6 object-contain rounded-full" />,
      address: '0xb9707EBc943AD698852dca99dAB8C973e1CD6BD8'
    },
    {
      pair: 'AltPEPE/WATT',
      network: 'Altcoinchain',
      chainId: 2330,
      tvl: '$480K',
      apr: '42.1%',
      volume24h: '$160K',
      myLiquidity: '$0',
      token1: 'AltPEPE',
      token2: 'WATT',
      token1Icon: () => <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold">P</div>,
      token2Icon: () => <img src="/WATT logo.png" alt="WATT" className="w-6 h-6 object-contain" />,
      address: '0xdC1f931aeFba25d1ad442c7235D9AEbAf51C9D01'
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
      'Multi-Chain': '🌍',
      'BSC': '🔶',
      'Ethereum': '💎',
      'Polygon': '🔷',
      'Avalanche': '🔺',
      'Arbitrum': '🔵',
      'Optimism': '🔴',
      'Base': '🟦'
    };
    return iconMap[network] || '🔗';
  };

  const handleAddLiquidity = (pool: {
    id: string;
    name: string;
    token0: string;
    token1: string;
    reserve0: string;
    reserve1: string;
    totalSupply: string;
    fee: number;
  }) => {
    setSelectedPool(pool);
    setShowAddLiquidityModal(true);
  };

  const togglePoolDetails = (poolPair: string) => {
    if (expandedPool === poolPair) {
      setExpandedPool(null);
    } else {
      setExpandedPool(poolPair);
    }
  };

  const getTokenAddresses = (pool: {
    id: string;
    name: string;
    token0: string;
    token1: string;
    reserve0: string;
    reserve1: string;
    totalSupply: string;
    fee: number;
    network?: string;
  }) => {
    // Return token addresses for Altcoinchain pools
    if (pool.network === 'Altcoinchain') {
      if (pool.pair === 'ALT/WATT') {
        return {
          token1: 'Native ALT',
          token2: '0x6645143e49B3a15d8F205658903a55E520444698', // WATT
          wALT: '0x48721ADeFE5b97101722c0866c2AffCE797C32b6'
        };
      } else if (pool.pair === 'AltPEPE/AltPEPI') {
        return {
          token1: '0xd350ecd60912913cc15d312ef38adeca909ecdd5', // PEPE
          token2: '0xbb1f8b3a73a0b5084af9a95e748f9d84ddba6e88', // PEPI
          wALT: '0x48721ADeFE5b97101722c0866c2AffCE797C32b6'
        };
      } else if (pool.pair === 'AltPEPE/wALT') {
        return {
          token1: '0xd350ecd60912913cc15d312ef38adeca909ecdd5', // PEPE
          token2: '0x48721ADeFE5b97101722c0866c2AffCE797C32b6', // wALT
          wALT: '0x48721ADeFE5b97101722c0866c2AffCE797C32b6'
        };
      } else if (pool.pair === 'SCAM/wALT') {
        return {
          token1: '0x75b37574c2317ccba905e2c628d949710627c20a', // SCAM
          token2: '0x48721ADeFE5b97101722c0866c2AffCE797C32b6', // wALT
          wALT: '0x48721ADeFE5b97101722c0866c2AffCE797C32b6'
        };
      } else if (pool.pair === 'SWAPD/wALT') {
        return {
          token1: '0x67e7ebda5cba73f5830538b03e678a1b45517dd7', // SWAPD
          token2: '0x48721ADeFE5b97101722c0866c2AffCE797C32b6', // wALT
          wALT: '0x48721ADeFE5b97101722c0866c2AffCE797C32b6'
        };
      } else if (pool.pair === 'MALT/wALT') {
        return {
          token1: '0xaf5d066eb3e4147325d3ed23f94bc925fbf3b9ef', // MALT
          token2: '0x48721ADeFE5b97101722c0866c2AffCE797C32b6', // wALT
          wALT: '0x48721ADeFE5b97101722c0866c2AffCE797C32b6'
        };
      } else if (pool.pair === 'AltPEPE/WATT') {
        return {
          token1: '0xd350ecd60912913cc15d312ef38adeca909ecdd5', // PEPE
          token2: '0x6645143e49B3a15d8F205658903a55E520444698', // WATT
          wALT: '0x48721ADeFE5b97101722c0866c2AffCE797C32b6'
        };
      }
    }
    
    return {
      token1: '',
      token2: '',
      wALT: ''
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold">Multi-Chain Liquidity Pools</h3>
        <motion.button
          onClick={() => {
            setSelectedPool(null);
            setShowAddLiquidityModal(true);
          }}
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

              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={() => togglePoolDetails(`${pool.pair}-${pool.network}`)}
                  className="flex items-center space-x-1 text-sm text-slate-400 hover:text-white"
                >
                  <span>Details</span>
                  {expandedPool === `${pool.pair}-${pool.network}` ? (
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
                    className="flex-1 py-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-sm font-medium transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Remove
                  </motion.button>
                </div>
              </div>

              {/* Expanded Pool Details */}
              {expandedPool === `${pool.pair}-${pool.network}` && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-slate-700/30"
                >
                  <div className="space-y-2 text-sm">
                    {pool.address && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Pool Address:</span>
                        <span className="font-mono text-xs">{pool.address}</span>
                      </div>
                    )}
                    {pool.network === 'Altcoinchain' && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-slate-400">{pool.token1} Address:</span>
                          <span className="font-mono text-xs">{getTokenAddresses(pool).token1}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">{pool.token2} Address:</span>
                          <span className="font-mono text-xs">{getTokenAddresses(pool).token2}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-400">Fee Tier:</span>
                      <span>0.3%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Created:</span>
                      <span>2 months ago</span>
                    </div>
                  </div>
                </motion.div>
              )}
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

      {/* Add Liquidity Modal */}
      <AddLiquidityModal 
        isOpen={showAddLiquidityModal} 
        onClose={() => setShowAddLiquidityModal(false)} 
        selectedPool={selectedPool}
      />
    </div>
  );
};

export default LiquidityPools;