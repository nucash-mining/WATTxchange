import React from 'react';
import { motion } from 'framer-motion';
import { Activity, TrendingUp, Zap, Clock } from 'lucide-react';

const MiningStats: React.FC = () => {
  const miningData = [
    { time: '00:00', hashRate: 2100, efficiency: 85 },
    { time: '04:00', hashRate: 2250, efficiency: 88 },
    { time: '08:00', hashRate: 2400, efficiency: 92 },
    { time: '12:00', hashRate: 2350, efficiency: 89 },
    { time: '16:00', hashRate: 2480, efficiency: 94 },
    { time: '20:00', hashRate: 2420, efficiency: 91 },
  ];

  return (
    <div className="space-y-6">
      {/* Mining Performance Chart */}
      <motion.div
        className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">Mining Performance</h3>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
              <span className="text-slate-400">Hash Rate</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
              <span className="text-slate-400">Efficiency</span>
            </div>
          </div>
        </div>

        {/* Simplified Chart Visualization */}
        <div className="h-64 bg-slate-900/50 rounded-lg flex items-end justify-between p-4 space-x-2">
          {miningData.map((data, index) => (
            <div key={index} className="flex-1 flex flex-col items-center space-y-2">
              <div className="w-full space-y-1">
                <motion.div
                  className="bg-blue-400 rounded-t"
                  style={{ height: `${(data.hashRate / 2500) * 120}px` }}
                  initial={{ height: 0 }}
                  animate={{ height: `${(data.hashRate / 2500) * 120}px` }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                />
                <motion.div
                  className="bg-emerald-400 rounded-t"
                  style={{ height: `${(data.efficiency / 100) * 80}px` }}
                  initial={{ height: 0 }}
                  animate={{ height: `${(data.efficiency / 100) * 80}px` }}
                  transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
                />
              </div>
              <span className="text-xs text-slate-400">{data.time}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Mining Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: 'Current Hash Rate',
            value: '2.42 TH/s',
            change: '+5.2%',
            icon: Activity,
            color: 'text-blue-400'
          },
          {
            label: 'Mining Efficiency',
            value: '91.5%',
            change: '+2.1%',
            icon: TrendingUp,
            color: 'text-emerald-400'
          },
          {
            label: 'Power Usage',
            value: '3.7 kW',
            change: '-1.2%',
            icon: Zap,
            color: 'text-yellow-400'
          },
          {
            label: 'Uptime',
            value: '99.8%',
            change: '+0.1%',
            icon: Clock,
            color: 'text-purple-400'
          }
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
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-6 h-6 ${stat.color}`} />
                <span className={`text-sm font-medium ${
                  stat.change.startsWith('+') ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {stat.change}
                </span>
              </div>
              <p className="text-slate-400 text-sm">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Mining History */}
      <motion.div
        className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="text-xl font-semibold mb-4">Recent Mining Activity</h3>
        <div className="space-y-3">
          {[
            { time: '2 hours ago', event: 'Block reward received', amount: '+2.5 WATT' },
            { time: '4 hours ago', event: 'Mining efficiency optimized', amount: '+5% boost' },
            { time: '6 hours ago', event: 'New hardware NFT staked', amount: 'RTX 4090' },
            { time: '8 hours ago', event: 'Block reward received', amount: '+2.3 WATT' }
          ].map((activity, index) => (
            <motion.div
              key={index}
              className="flex items-center justify-between p-3 bg-slate-900/30 rounded-lg"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div>
                <p className="font-medium">{activity.event}</p>
                <p className="text-sm text-slate-400">{activity.time}</p>
              </div>
              <span className="text-emerald-400 font-medium">{activity.amount}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default MiningStats;