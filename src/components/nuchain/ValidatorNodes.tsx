import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Server, Shield, Coins, Clock, TrendingUp, Play, Square, Settings } from 'lucide-react';
import toast from 'react-hot-toast';

const ValidatorNodes: React.FC = () => {
  const [selectedValidator, setSelectedValidator] = useState<string | null>(null);

  const validators = [
    {
      id: 'validator-1',
      name: 'nuChain-Alpha',
      address: '0x1234...abcd',
      stake: '125,000 NU',
      commission: '5%',
      uptime: '99.8%',
      blocks: 12847,
      status: 'active',
      apy: '8.5%',
      delegators: 247,
      lastBlock: '2 minutes ago'
    },
    {
      id: 'validator-2',
      name: 'nuChain-Beta',
      address: '0x5678...efgh',
      stake: '98,500 NU',
      commission: '3%',
      uptime: '99.9%',
      blocks: 11234,
      status: 'active',
      apy: '9.2%',
      delegators: 189,
      lastBlock: '1 minute ago'
    },
    {
      id: 'validator-3',
      name: 'nuChain-Gamma',
      address: '0x9abc...ijkl',
      stake: '156,750 NU',
      commission: '4%',
      uptime: '99.7%',
      blocks: 15678,
      status: 'active',
      apy: '8.8%',
      delegators: 312,
      lastBlock: '30 seconds ago'
    },
    {
      id: 'validator-4',
      name: 'nuChain-Delta',
      address: '0xdef0...mnop',
      stake: '87,250 NU',
      commission: '6%',
      uptime: '98.9%',
      blocks: 9876,
      status: 'jailed',
      apy: '0%',
      delegators: 156,
      lastBlock: '2 hours ago'
    }
  ];

  const myValidator = {
    name: 'My-nuChain-Node',
    status: 'inactive',
    stake: '0 NU',
    minStake: '100,000 NU',
    requirements: [
      '100,000 NU minimum stake',
      'Sonic Labs compatible hardware',
      '99.5% uptime requirement',
      'Slashing protection enabled'
    ]
  };

  const handleStartValidator = () => {
    toast.success('Validator node starting...');
  };

  const handleStakeTokens = () => {
    toast.success('Staking interface opened');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-emerald-400 bg-emerald-500/20';
      case 'jailed':
        return 'text-red-400 bg-red-500/20';
      case 'inactive':
        return 'text-slate-400 bg-slate-500/20';
      default:
        return 'text-slate-400 bg-slate-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* My Validator Node */}
      <motion.div
        className="bg-gradient-to-r from-purple-600/10 to-blue-600/10 border border-purple-500/30 rounded-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-600/20 rounded-lg">
              <Server className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{myValidator.name}</h3>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded text-xs ${getStatusColor(myValidator.status)}`}>
                  {myValidator.status.toUpperCase()}
                </span>
                <span className="text-sm text-slate-400">Stake: {myValidator.stake}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <motion.button
              onClick={handleStakeTokens}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Coins className="w-4 h-4" />
              <span>Stake NU</span>
            </motion.button>
            <motion.button
              onClick={handleStartValidator}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Play className="w-4 h-4" />
              <span>Start Validator</span>
            </motion.button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-3">Validator Requirements</h4>
            <div className="space-y-2">
              {myValidator.requirements.map((req, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span>{req}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3">Staking Info</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Minimum Stake:</span>
                <span className="font-medium">{myValidator.minStake}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current APY:</span>
                <span className="font-medium text-emerald-400">8.5%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Slashing Risk:</span>
                <span className="font-medium text-yellow-400">0.5%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Lock Period:</span>
                <span className="font-medium">21 days</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Active Validators */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Active Validators</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {validators.map((validator, index) => (
            <motion.div
              key={validator.id}
              className={`bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border transition-all duration-300 cursor-pointer ${
                selectedValidator === validator.id
                  ? 'border-purple-500/50 bg-purple-500/5'
                  : 'border-slate-700/50 hover:border-slate-600/50'
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setSelectedValidator(validator.id)}
              whileHover={{ y: -2 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-slate-700/50 rounded-lg">
                    <Shield className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{validator.name}</h4>
                    <p className="text-sm text-slate-400">{validator.address}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${getStatusColor(validator.status)}`}>
                  {validator.status.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-slate-400 text-sm">Total Stake</p>
                  <p className="font-bold">{validator.stake}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Commission</p>
                  <p className="font-bold">{validator.commission}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Uptime</p>
                  <p className="font-bold text-emerald-400">{validator.uptime}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">APY</p>
                  <p className="font-bold text-yellow-400">{validator.apy}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-4">
                  <span className="text-slate-400">Blocks: {validator.blocks.toLocaleString()}</span>
                  <span className="text-slate-400">Delegators: {validator.delegators}</span>
                </div>
                <span className="text-slate-400">{validator.lastBlock}</span>
              </div>

              {validator.status === 'active' && (
                <motion.button
                  className="w-full mt-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 rounded-lg text-sm font-medium transition-colors border border-purple-500/30"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Delegate to Validator
                </motion.button>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Validator Statistics */}
      <motion.div
        className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className="text-xl font-semibold mb-4">Network Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-400">247</p>
            <p className="text-slate-400 text-sm">Active Validators</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-400">24.7M NU</p>
            <p className="text-slate-400 text-sm">Total Staked</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-400">8.5%</p>
            <p className="text-slate-400 text-sm">Average APY</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-400">99.8%</p>
            <p className="text-slate-400 text-sm">Network Uptime</p>
          </div>
        </div>
      </motion.div>

      {/* Sonic Labs Integration */}
      <motion.div
        className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/30 rounded-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-blue-600/20 rounded-lg">
            <TrendingUp className="w-6 h-6 text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-400 mb-2">Sonic Labs Validator Requirements</h3>
            <p className="text-slate-300 mb-3">
              nuChain validators use the same requirements as Sonic Labs for maximum compatibility and performance.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold text-purple-400 mb-2">Hardware Requirements</h4>
                <ul className="space-y-1 text-slate-300">
                  <li>• 8+ CPU cores (3.0+ GHz)</li>
                  <li>• 32+ GB RAM</li>
                  <li>• 1+ TB NVMe SSD</li>
                  <li>• 100+ Mbps internet</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-purple-400 mb-2">Staking Requirements</h4>
                <ul className="space-y-1 text-slate-300">
                  <li>• 100,000 NU minimum stake</li>
                  <li>• 21-day unbonding period</li>
                  <li>• 99.5% uptime requirement</li>
                  <li>• Slashing protection enabled</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ValidatorNodes;