import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, Zap, Trophy, Gift, ExternalLink, Maximize2, Minimize2 } from 'lucide-react';
import NFTStaking from './mining/NFTStaking';
import MiningStats from './mining/MiningStats';
import RewardsClaiming from './mining/RewardsClaiming';
import MiningRigConfigurator from './mining/MiningRigConfigurator';

const MiningGameView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dapp' | 'stake' | 'mine' | 'rewards' | 'configure'>('dapp');
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h2 className="text-3xl font-bold">Mining Game</h2>
          <p className="text-slate-400 mt-1">Stake NFTs and earn rewards through virtual mining</p>
        </div>
        
        <div className="flex items-center space-x-2 bg-slate-800/50 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('dapp')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'dapp'
                ? 'bg-yellow-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Play Game
          </button>
          <button
            onClick={() => setActiveTab('configure')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'configure'
                ? 'bg-yellow-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Configure Rig
          </button>
          <button
            onClick={() => setActiveTab('stake')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'stake'
                ? 'bg-yellow-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Stake NFTs
          </button>
          <button
            onClick={() => setActiveTab('mine')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'mine'
                ? 'bg-yellow-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Mining Stats
          </button>
          <button
            onClick={() => setActiveTab('rewards')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'rewards'
                ? 'bg-yellow-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Rewards
          </button>
        </div>
      </motion.div>

      {/* Mining Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Staked NFTs', value: '12', icon: Gamepad2, color: 'text-yellow-400' },
          { label: 'Mining Power', value: '2.4 TH/s', icon: Zap, color: 'text-yellow-400' },
          { label: 'Total Earned', value: '1,234 WATT', icon: Trophy, color: 'text-emerald-400' },
          { label: 'Pending Rewards', value: '56.7 WATT', icon: Gift, color: 'text-purple-400' }
        ].map((stat, index) => {
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
                </div>
                <Icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Contract Addresses */}
      <motion.div
        className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-lg font-semibold mb-4">Contract Addresses</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-yellow-400 mb-2">Polygon Network</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">NFTs:</span>
                <span className="font-mono">0x970a8b10147e3459d3cbf56329b76ac18d329728</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">WATT:</span>
                <span className="font-mono">0xE960d5076cd3169C343Ee287A2c3380A222e5839</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Staking:</span>
                <span className="font-mono">0xcbfcA68D10B2ec60a0FB2Bc58F7F0Bfd32CD5275</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-yellow-400 mb-2">Altcoinchain Network</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">NFTs:</span>
                <span className="font-mono">0xf9670e5D46834561813CA79854B3d7147BBbFfb2</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">WATT:</span>
                <span className="font-mono">0x6645143e49B3a15d8F205658903a55E520444698</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Staking:</span>
                <span className="font-mono">0xe463045318393095F11ed39f1a98332aBCc1A7b1</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'dapp' && (
          <div className={`bg-slate-800/30 backdrop-blur-xl rounded-xl border border-slate-700/50 ${
            isFullscreen ? 'fixed inset-4 z-50' : 'relative'
          }`}>
            {/* dApp Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
              <div className="flex items-center space-x-3">
                <Gamepad2 className="w-6 h-6 text-yellow-400" />
                <div>
                  <h3 className="text-xl font-semibold">The Mining Game dApp</h3>
                  <p className="text-slate-400 text-sm">
                    Fully integrated mining game experience
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <motion.a
                  href="https://stake.mining.game"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-sm"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open in New Tab</span>
                </motion.a>
                
                <motion.button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </motion.button>
              </div>
            </div>
            
            {/* Embedded dApp */}
            <div className={`relative ${isFullscreen ? 'h-[calc(100vh-8rem)]' : 'h-[600px]'}`}>
              <iframe
                src="https://stake.mining.game"
                className="w-full h-full rounded-b-xl"
                title="The Mining Game"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                allow="clipboard-read; clipboard-write; web-share"
                loading="lazy"
              />
              
              {/* Loading overlay */}
              <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center rounded-b-xl">
                <div className="text-center">
                  <motion.div
                    className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full mx-auto mb-4"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <p className="text-slate-400">Loading Mining Game...</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="p-4 border-t border-slate-700/50 bg-slate-900/30 rounded-b-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-slate-400">
                  <span>🎮 Interactive mining simulation</span>
                  <span>💎 NFT staking rewards</span>
                  <span>⚡ Real-time WATT earnings</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-emerald-400">Live</span>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'configure' && <MiningRigConfigurator />}
        {activeTab === 'stake' && <NFTStaking />}
        {activeTab === 'mine' && <MiningStats />}
        {activeTab === 'rewards' && <RewardsClaiming />}
      </motion.div>

      {/* Fullscreen overlay backdrop */}
      {isFullscreen && (
        <motion.div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setIsFullscreen(false)}
        />
      )}

    </div>
  );
};

export default MiningGameView;