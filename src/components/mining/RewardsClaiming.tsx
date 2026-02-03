import React from 'react';
import { motion } from 'framer-motion';
import { Gift, Coins, TrendingUp, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const RewardsClaiming: React.FC = () => {
  const handleClaimRewards = () => {
    toast.success('Rewards claimed successfully!');
  };

  const rewards = [
    {
      token: 'WATT',
      amount: '56.7',
      usdValue: '$113.40',
      icon: '⚡',
      color: 'text-yellow-400'
    },
    {
      token: 'ETH',
      amount: '0.0234',
      usdValue: '$82.20',
      icon: '💎',
      color: 'text-blue-400'
    },
    {
      token: 'BTC',
      amount: '0.00156',
      usdValue: '$78.00',
      icon: '₿',
      color: 'text-orange-400'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Pending Rewards */}
      <motion.div
        className="bg-gradient-to-r from-emerald-600/20 to-blue-600/20 backdrop-blur-xl rounded-xl p-6 border border-emerald-500/30"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold mb-2">Pending Rewards</h3>
          <p className="text-slate-400">Ready to claim from your mining operations</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {rewards.map((reward, index) => (
            <motion.div
              key={reward.token}
              className="bg-slate-800/50 rounded-lg p-4 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="text-2xl mb-2">{reward.icon}</div>
              <p className={`text-xl font-bold ${reward.color}`}>{reward.amount} {reward.token}</p>
              <p className="text-slate-400 text-sm">{reward.usdValue}</p>
            </motion.div>
          ))}
        </div>

        <motion.button
          onClick={handleClaimRewards}
          className="w-full py-3 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 rounded-lg font-semibold transition-all duration-300"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Claim All Rewards ($273.60)
        </motion.button>
      </motion.div>

      {/* Reward Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: 'Total Earned',
            value: '$12,345',
            icon: Coins,
            color: 'text-emerald-400'
          },
          {
            label: 'Daily Average',
            value: '$45.60',
            icon: TrendingUp,
            color: 'text-blue-400'
          },
          {
            label: 'Last Claim',
            value: '2 days ago',
            icon: Clock,
            color: 'text-purple-400'
          },
          {
            label: 'Claim Rate',
            value: '98.5%',
            icon: Gift,
            color: 'text-yellow-400'
          }
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <p className="text-slate-400 text-sm">{stat.label}</p>
              <p className="text-xl font-bold">{stat.value}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Reward History */}
      <motion.div
        className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className="text-xl font-semibold mb-4">Reward History</h3>
        <div className="space-y-3">
          {[
            { date: 'Today', tokens: '12.5 WATT + 0.005 BTC', amount: '$89.50', status: 'pending' },
            { date: 'Yesterday', tokens: '15.2 WATT + 0.008 ETH', amount: '$105.20', status: 'claimed' },
            { date: '2 days ago', tokens: '18.7 WATT + 0.006 BTC', amount: '$124.80', status: 'claimed' },
            { date: '3 days ago', tokens: '14.3 WATT + 0.007 ETH', amount: '$98.40', status: 'claimed' }
          ].map((history, index) => (
            <motion.div
              key={index}
              className="flex items-center justify-between p-3 bg-slate-900/30 rounded-lg border border-slate-700/30"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div>
                <p className="font-medium">{history.tokens}</p>
                <p className="text-sm text-slate-400">{history.date}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">{history.amount}</p>
                <span className={`text-xs px-2 py-1 rounded ${
                  history.status === 'claimed' 
                    ? 'bg-emerald-500/20 text-emerald-400' 
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {history.status}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default RewardsClaiming;