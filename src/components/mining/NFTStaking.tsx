import React from 'react';
import { motion } from 'framer-motion';
import { Monitor, Cpu, HardDrive, Zap, Lock, Unlock } from 'lucide-react';

const NFTStaking: React.FC = () => {
  const nfts = [
    {
      id: 1,
      name: 'NVIDIA RTX 4090',
      type: 'GPU',
      hashRate: '120 MH/s',
      rarity: 'Legendary',
      staked: true,
      icon: Monitor,
      power: 450
    },
    {
      id: 2,
      name: 'AMD Ryzen 9 7950X',
      type: 'CPU',
      hashRate: '15 KH/s',
      rarity: 'Epic',
      staked: false,
      icon: Cpu,
      power: 170
    },
    {
      id: 3,
      name: 'ASIC Miner S19',
      type: 'ASIC',
      hashRate: '110 TH/s',
      rarity: 'Mythic',
      staked: true,
      icon: HardDrive,
      power: 3250
    },
    {
      id: 4,
      name: 'Intel i9-13900K',
      type: 'CPU',
      hashRate: '12 KH/s',
      rarity: 'Rare',
      staked: false,
      icon: Cpu,
      power: 125
    }
  ];

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Mythic': return 'from-purple-500 to-pink-500';
      case 'Legendary': return 'from-yellow-500 to-orange-500';
      case 'Epic': return 'from-blue-500 to-purple-500';
      case 'Rare': return 'from-green-500 to-blue-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold">Your Mining Hardware NFTs</h3>
        <div className="text-sm text-slate-400">
          Total Staked: {nfts.filter(nft => nft.staked).length}/{nfts.length}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {nfts.map((nft, index) => {
          const Icon = nft.icon;
          return (
            <motion.div
              key={nft.id}
              className={`relative bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border transition-all duration-300 ${
                nft.staked 
                  ? 'border-emerald-500/50 bg-emerald-500/5' 
                  : 'border-slate-700/50 hover:border-slate-600/50'
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -2 }}
            >
              {/* Rarity Gradient Border */}
              <div className={`absolute inset-0 bg-gradient-to-r ${getRarityColor(nft.rarity)} rounded-xl p-[1px]`}>
                <div className="bg-slate-800/90 rounded-xl h-full w-full" />
              </div>

              <div className="relative z-10 p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Icon className="w-6 h-6 text-blue-400" />
                    <span className="text-xs px-2 py-1 bg-slate-700/50 rounded text-slate-300">
                      {nft.type}
                    </span>
                  </div>
                  {nft.staked ? (
                    <Lock className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Unlock className="w-4 h-4 text-slate-400" />
                  )}
                </div>

                {/* NFT Info */}
                <div className="space-y-3">
                  <h4 className="font-semibold">{nft.name}</h4>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Rarity</span>
                    <span className={`font-medium bg-gradient-to-r ${getRarityColor(nft.rarity)} bg-clip-text text-transparent`}>
                      {nft.rarity}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Hash Rate</span>
                    <span className="font-medium">{nft.hashRate}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Power</span>
                    <div className="flex items-center space-x-1">
                      <Zap className="w-3 h-3 text-yellow-400" />
                      <span className="font-medium">{nft.power}W</span>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <motion.button
                  className={`w-full mt-4 py-2 rounded-lg font-medium transition-colors ${
                    nft.staked
                      ? 'bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30'
                      : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {nft.staked ? 'Unstake' : 'Stake'}
                </motion.button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Staking Stats */}
      <motion.div
        className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h4 className="text-lg font-semibold mb-4">Staking Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-400">2.4 TH/s</p>
            <p className="text-slate-400 text-sm">Total Hash Rate</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-400">3.7 kW</p>
            <p className="text-slate-400 text-sm">Power Consumption</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-400">24.5 WATT/day</p>
            <p className="text-slate-400 text-sm">Estimated Rewards</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default NFTStaking;