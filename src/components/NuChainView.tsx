import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import NuChainDashboard from './nuchain/NuChainDashboard';
import StakingView from './nuchain/StakingView';
import ValidatorNodes from './nuchain/ValidatorNodes';
import MiningPools from './nuchain/MiningPools';
import NFTMiningRigs from './nuchain/NFTMiningRigs';
import NodeRewardDashboard from './nuchain/NodeRewardDashboard';
import NuChainBridges from './nuchain/NuChainBridges';
import TabErrorBoundary from './nuchain/TabErrorBoundary';
import AddWalletButtons from './nuchain/AddWalletButtons';
const PrivateSwaps = React.lazy(() => import('./nuchain/PrivateSwaps'));
const OsmosisSwap = React.lazy(() => import('./nuchain/OsmosisSwap'));

const NuChainView: React.FC = () => {
  type Tab = 'dashboard' | 'swap' | 'bridges' | 'private' | 'staking' | 'validators' | 'pools' | 'rigs' | 'rewards';
  const TABS: Tab[] = ['dashboard', 'swap', 'bridges', 'private', 'staking', 'validators', 'pools', 'rigs', 'rewards'];
  // sub-tab from /nuchain/<tab> or #nuchain/<tab>
  const tabFromUrl = (): Tab => {
    const base = import.meta.env.BASE_URL || '/';
    const path = window.location.pathname.startsWith(base) ? window.location.pathname.slice(base.length) : '';
    const seg = (path.split('/')[1] || window.location.hash.replace(/^#\/?/, '').split('/')[1] || '').toLowerCase() as Tab;
    return TABS.includes(seg) ? seg : 'dashboard';
  };
  const [activeTab, setActiveTabState] = useState<Tab>(tabFromUrl);
  const setActiveTab = (t: Tab) => {
    setActiveTabState(t);
    const base = import.meta.env.BASE_URL || '/';
    if (window.location.pathname.startsWith(base + 'nuchain')) {
      window.history.replaceState(null, '', base + 'nuchain' + (t === 'dashboard' ? '' : '/' + t));
    }
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            nuChain L2
          </h2>
          <p className="text-slate-400 mt-1">Cosmos SDK chain linking WATTx and Altcoinchain, with merged mining, private swaps and omnichain bridges</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm">
            <span className="text-purple-400">Cosmos SDK + EVM</span>
            <span className="text-blue-400">Merged-mined with BitcoinZ and WATTx</span>
            <span className="text-emerald-400">zk private swaps</span>
          </div>
          <div className="mt-3"><AddWalletButtons /></div>
        </div>
        
        <div className="flex items-center space-x-2 bg-slate-800/50 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('swap')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'swap'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Cosmos Swap
          </button>
          <button
            onClick={() => setActiveTab('bridges')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'bridges'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Bridges
          </button>
          <button
            onClick={() => setActiveTab('private')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'private'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Private
          </button>
          <button
            onClick={() => setActiveTab('staking')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'staking'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Staking
          </button>
          <button
            onClick={() => setActiveTab('validators')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'validators'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Validators
          </button>
          <button
            onClick={() => setActiveTab('pools')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'pools'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Mining Pools
          </button>
          <button
            onClick={() => setActiveTab('rigs')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'rigs'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            NFT Rigs
          </button>
          <button
            onClick={() => setActiveTab('rewards')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'rewards'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Node Rewards
          </button>
        </div>
      </motion.div>

      {/* nuChain Architecture Overview */}
      <motion.div
        className="bg-gradient-to-r from-purple-600/10 to-blue-600/10 border border-purple-500/30 rounded-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-purple-600/20 rounded-lg">
            <Zap className="w-6 h-6 text-purple-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-purple-400 mb-2">nuChain architecture (chain-id nuchain_28277-1, EVM 28277)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-400 mb-2">Consensus and execution</h4>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>• CometBFT proof-of-stake validators</li>
                  <li>• About 1-second blocks</li>
                  <li>• Cosmos SDK v0.54 with cosmos/evm: full EVM</li>
                  <li>• IBC for Cosmos interchain transfers</li>
                </ul>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-emerald-400 mb-2">Mining</h4>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>• zhash (equihash 144,5) on CPU or GPU</li>
                  <li>• Merged with BitcoinZ and WATTx: one share earns all three</li>
                  <li>• 50 NU per block, halving every 210,000 blocks, 21M cap</li>
                  <li>• No pre-mine; unclaimed rewards roll over</li>
                </ul>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-400 mb-2">Privacy and bridges</h4>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>• Groth16 shielded pool and private swaps</li>
                  <li>• WTX bridge (wWTX, fully backed)</li>
                  <li>• LayerZero hub for WTX, WATT and ALT</li>
                  <li>• Solana gateway</li>
                </ul>
              </div>
            </div>
            <div className="text-xs text-slate-400 space-y-1">
              <p>• Cosmos chain-id: nuchain_28277-1 · EVM chain-id: 28277 · prefix: nu · coin: NU</p>
              <p>• No pre-mine: 50 NU per block, halving every 210,000 blocks, mined with zhash (equihash 144,5) merged with BitcoinZ and WATTx</p>
              <p>• Bridged: WTX (native bridge), WATT and ALT (LayerZero hub), Solana gateway</p>
              <p>• EVM RPC: <a className="text-cyan-400" href="https://evm-nu.wattxchange.app">https://evm-nu.wattxchange.app</a></p>
              <p>• Explorer: <a className="text-cyan-400" href="https://nu-exp.wattxchange.app">https://nu-exp.wattxchange.app</a></p>
            </div>
            <div className="mt-4 bg-slate-800/50 rounded-lg p-4">
              <h4 className="font-semibold text-cyan-400 mb-2">Cosmos SDK</h4>
              <p className="text-xs text-slate-400 mb-3">
                nuChain is a Cosmos SDK v0.54 chain (CometBFT consensus, cosmos/evm execution) with native PoS staking and zhash mining.
              </p>
              <div className="flex flex-wrap gap-2 text-sm">
                {[
                  ['Cosmos explorer', 'https://nu-exp.wattxchange.app'],
                  ['Cosmos REST (LCD)', 'https://api-nu.wattxchange.app/cosmos/base/tendermint/v1beta1/node_info'],
                  ['CometBFT RPC', 'https://rpc-nu.wattxchange.app/status'],
                  ['Chain registry entry', 'https://github.com/nucash-mining/nuchain/blob/main/registry/chain.json'],
                  ['nuChain source', 'https://github.com/nucash-mining/nuchain'],
                  ['Cosmos SDK docs', 'https://docs.cosmos.network'],
                  ['cosmos/evm', 'https://github.com/cosmos/evm'],
                ].map(([label, href]) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                     className="px-3 py-1.5 rounded-md bg-slate-900/70 border border-slate-700 text-cyan-300 hover:border-cyan-500 hover:text-cyan-200 transition-colors">
                    {label}
                  </a>
                ))}
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
        {activeTab === 'dashboard' && <NuChainDashboard />}
        {activeTab === 'swap' && (
          <TabErrorBoundary name="Cosmos Swap">
            <React.Suspense fallback={<div className="text-slate-400 p-6">Loading Cosmos swap...</div>}>
              <OsmosisSwap />
            </React.Suspense>
          </TabErrorBoundary>
        )}
        {activeTab === 'bridges' && <NuChainBridges />}
        {activeTab === 'private' && (
          <TabErrorBoundary name="Private">
            <React.Suspense fallback={<div className="text-slate-400 p-6">Loading private swaps...</div>}>
              <PrivateSwaps />
            </React.Suspense>
          </TabErrorBoundary>
        )}
        {activeTab === 'staking' && <StakingView />}
        {activeTab === 'validators' && <ValidatorNodes />}
        {activeTab === 'pools' && <MiningPools />}
        {activeTab === 'rigs' && <NFTMiningRigs />}
        {activeTab === 'rewards' && <NodeRewardDashboard />}
      </motion.div>
    </div>
  );
};

export default NuChainView;