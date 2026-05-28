import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Droplets, Coins, Percent, Shield, TrendingUp, Info, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface LiquidityPool {
  id: string;
  name: string;
  token: string;
  tokenLogo: string;
  tvl: string;
  apr: string;
  utilizationRate: string;
  myDeposit: string;
  myShare: string;
  network: string;
}

const PerpLiquidityPools: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'my-pools'>('all');
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [selectedPool, setSelectedPool] = useState<string | null>(null);
  const [showDepositModal, setShowDepositModal] = useState<boolean>(false);

  const pools: LiquidityPool[] = [
    {
      id: 'usdt-pool',
      name: 'USDT Liquidity Pool',
      token: 'USDT',
      tokenLogo: '/USDT logo.png',
      tvl: '$12.5M',
      apr: '8.4%',
      utilizationRate: '76%',
      myDeposit: '$0',
      myShare: '0%',
      network: 'Multi-Chain'
    },
    {
      id: 'usdc-pool',
      name: 'USDC Liquidity Pool',
      token: 'USDC',
      tokenLogo: '/USDC logo.png',
      tvl: '$18.2M',
      apr: '7.8%',
      utilizationRate: '82%',
      myDeposit: '$0',
      myShare: '0%',
      network: 'Multi-Chain'
    },
    {
      id: 'dai-pool',
      name: 'DAI Liquidity Pool',
      token: 'DAI',
      tokenLogo: '/DAI logo.png',
      tvl: '$8.7M',
      apr: '9.2%',
      utilizationRate: '68%',
      myDeposit: '$0',
      myShare: '0%',
      network: 'Multi-Chain'
    },
    {
      id: 'btc-pool',
      name: 'BTC Liquidity Pool',
      token: 'BTC',
      tokenLogo: '/BTC logo.png',
      tvl: '$25.4M',
      apr: '6.5%',
      utilizationRate: '85%',
      myDeposit: '$0',
      myShare: '0%',
      network: 'Multi-Chain'
    },
    {
      id: 'eth-pool',
      name: 'ETH Liquidity Pool',
      token: 'ETH',
      tokenLogo: '/ETH logo.png',
      tvl: '$15.8M',
      apr: '7.2%',
      utilizationRate: '79%',
      myDeposit: '$0',
      myShare: '0%',
      network: 'Multi-Chain'
    },
    {
      id: 'alt-pool',
      name: 'ALT Liquidity Pool',
      token: 'ALT',
      tokenLogo: '/Altcoinchain logo.png',
      tvl: '$2.4M',
      apr: '12.5%',
      utilizationRate: '54%',
      myDeposit: '$0',
      myShare: '0%',
      network: 'Altcoinchain'
    },
    {
      id: 'watt-pool',
      name: 'WATT Liquidity Pool',
      token: 'WATT',
      tokenLogo: '/WATT logo.png',
      tvl: '$1.8M',
      apr: '14.2%',
      utilizationRate: '48%',
      myDeposit: '$0',
      myShare: '0%',
      network: 'Altcoinchain'
    }
  ];

  const myPools = pools.filter(pool => parseFloat(pool.myDeposit.replace('$', '').replace(',', '')) > 0);

  const handleDeposit = (poolId: string) => {
    setSelectedPool(poolId);
    setShowDepositModal(true);
  };

  const handleSubmitDeposit = () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const pool = pools.find(p => p.id === selectedPool);
    if (!pool) return;

    toast.success(`Deposited $${depositAmount} to ${pool.name}`);
    setShowDepositModal(false);
    setDepositAmount('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">nuLP Liquidity Pools</h3>
        <div className="flex items-center space-x-2 bg-slate-800/50 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Pools
          </button>
          <button
            onClick={() => setActiveTab('my-pools')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'my-pools'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            My Pools
          </button>
        </div>
      </div>

      {/* Pool Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Value Locked', value: '$84.8M', icon: Droplets, color: 'text-blue-400' },
          { label: 'Average APR', value: '8.7%', icon: Percent, color: 'text-emerald-400' },
          { label: 'Utilization Rate', value: '74%', icon: TrendingUp, color: 'text-yellow-400' },
          { label: 'Insurance Fund', value: '$2.5M', icon: Shield, color: 'text-purple-400' }
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

      {/* Pools List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(activeTab === 'all' ? pools : myPools).map((pool, index) => (
          <motion.div
            key={pool.id}
            className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <img 
                  src={pool.tokenLogo} 
                  alt={pool.token} 
                  className="w-8 h-8 object-contain rounded-full"
                />
                <div>
                  <h4 className="font-semibold">{pool.name}</h4>
                  <p className="text-sm text-slate-400">{pool.network}</p>
                </div>
              </div>
              <div className="flex items-center space-x-1 text-emerald-400">
                <Percent className="w-4 h-4" />
                <span className="text-sm font-medium">{pool.apr}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">TVL</span>
                <span className="font-medium">{pool.tvl}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Utilization</span>
                <span className="font-medium">{pool.utilizationRate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">My Deposit</span>
                <span className="font-medium">{pool.myDeposit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">My Share</span>
                <span className="font-medium">{pool.myShare}</span>
              </div>
            </div>

            <div className="flex space-x-2 mt-4">
              <motion.button
                onClick={() => handleDeposit(pool.id)}
                className="flex-1 py-2 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg text-sm font-medium transition-colors border border-blue-500/30"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Deposit
              </motion.button>
              <motion.button
                className="flex-1 py-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-sm font-medium transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Withdraw
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* nuLP Token Info */}
      <motion.div
        className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/30 rounded-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-blue-600/20 rounded-lg">
            <Coins className="w-6 h-6 text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-400 mb-2">nuLP Tokens</h3>
            <p className="text-slate-300 mb-3">
              nuLP tokens represent your share in the liquidity pool. These tokens automatically earn fees from perpetual trading 
              and can be staked for additional rewards. Liquidity is shared across all supported chains through our cross-chain bridge.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-emerald-400 mb-2">Earning Mechanisms</h4>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>• Trading fees (0.05% - 0.1%)</li>
                  <li>• Funding rate payments</li>
                  <li>• Liquidation penalties</li>
                  <li>• Borrowing interest</li>
                </ul>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-400 mb-2">Risk Mitigation</h4>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>• Insurance fund protection</li>
                  <li>• Dynamic fee adjustment</li>
                  <li>• Partial liquidations</li>
                  <li>• Risk-based position limits</li>
                </ul>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-purple-400 mb-2">Staking Benefits</h4>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>• Boosted APR (up to +50%)</li>
                  <li>• Protocol governance rights</li>
                  <li>• Trading fee discounts</li>
                  <li>• Priority liquidation protection</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Deposit Modal */}
      {showDepositModal && selectedPool && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            className="bg-slate-800/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 max-w-md w-full"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
              <div className="flex items-center space-x-3">
                <img 
                  src={pools.find(p => p.id === selectedPool)?.tokenLogo} 
                  alt={pools.find(p => p.id === selectedPool)?.token} 
                  className="w-8 h-8 object-contain rounded-full"
                />
                <div>
                  <h3 className="text-xl font-semibold">{pools.find(p => p.id === selectedPool)?.name}</h3>
                  <p className="text-slate-400 text-sm">Deposit to earn {pools.find(p => p.id === selectedPool)?.apr} APR</p>
                </div>
              </div>
              <button
                onClick={() => setShowDepositModal(false)}
                className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Deposit Amount</label>
                <div className="relative">
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-3 pr-16 focus:outline-none focus:border-blue-500/50"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                    <button
                      onClick={() => setDepositAmount('1000')}
                      className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                    >
                      MAX
                    </button>
                    <span className="text-slate-400 text-sm">{pools.find(p => p.id === selectedPool)?.token}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">You Will Receive</span>
                  <span>~{depositAmount ? parseFloat(depositAmount).toFixed(2) : '0.00'} nuLP</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Share of Pool</span>
                  <span>~{depositAmount ? (parseFloat(depositAmount) / 1000000 * 100).toFixed(6) : '0.000000'}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Estimated APR</span>
                  <span className="text-emerald-400">{pools.find(p => p.id === selectedPool)?.apr}</span>
                </div>
              </div>

              <motion.button
                onClick={handleSubmitDeposit}
                disabled={!depositAmount || parseFloat(depositAmount) <= 0}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Deposit
              </motion.button>

              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Info className="w-4 h-4 text-blue-400 mt-0.5" />
                  <p className="text-xs text-blue-400">
                    Depositing liquidity earns you nuLP tokens that automatically accrue fees from perpetual trading. 
                    You can withdraw your liquidity at any time, subject to utilization rates.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PerpLiquidityPools;