import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, Zap, Lock, Unlock, TrendingUp, BarChart3,
  Clock, Layers, PieChart, RefreshCw, AlertCircle, Coins
} from 'lucide-react';

interface DifficultyData {
  blockHeight: number;
  timestamp: number;
  pow: {
    difficulty: number;
    difficultyFormatted: string;
    networkHashrate: number;
    hashrateFormatted: string;
    avgBlockTime: string;
    targetBlockTime: number;
    blocksLast24h: number;
  };
  pos: {
    difficulty: string;
    totalMatureSupply: number;
    totalMatureSupplyFormatted: string;
    activeStakingWeight: number;
    activeStakingWeightFormatted: string;
    stakingParticipation: string;
    delegatedCoins: number;
    delegatedCoinsFormatted: string;
    matureUndelegated: number;
    matureUndelegatedFormatted: string;
    maturityThreshold: number;
    blocksLast24h: number;
  };
  supply: {
    total: number;
    totalFormatted: string;
    circulating: number;
    circulatingFormatted: string;
    immature: number;
    immatureFormatted: string;
    maxSupply: number;
    percentMature: string;
  };
  combined: {
    effectiveDifficulty: string;
    powWeight: string;
    posWeight: string;
    algorithm: string;
  };
}

interface Props {
  coin?: 'WTX' | 'HTH' | 'FLOP' | 'ALT';
}

const DifficultyMetrics: React.FC<Props> = ({ coin = 'WTX' }) => {
  const [data, setData] = useState<DifficultyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const getApiEndpoint = (c: string) => {
    switch (c) {
      case 'WTX': return '/api/wtx-explorer/difficulty';
      case 'HTH': return '/api/hth-explorer/difficulty';
      case 'FLOP': return '/api/flop-explorer/difficulty';
      case 'ALT': return '/api/alt-explorer/difficulty';
      default: return '/api/wtx-explorer/difficulty';
    }
  };

  const apiEndpoint = getApiEndpoint(coin);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(apiEndpoint);
      if (!response.ok) throw new Error('Failed to fetch difficulty data');
      const result = await response.json();
      setData(result);
      setLastUpdate(new Date());
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [coin]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-yellow-400" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6 text-center">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-400" />
        <p className="text-red-400">{error}</p>
        <button
          onClick={fetchData}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const getCoinStyle = (c: string) => {
    switch (c) {
      case 'WTX': return { color: 'yellow', gradientFrom: 'from-yellow-600', gradientTo: 'to-emerald-600' };
      case 'HTH': return { color: 'green', gradientFrom: 'from-green-500', gradientTo: 'to-yellow-400' };
      case 'FLOP': return { color: 'pink', gradientFrom: 'from-pink-500', gradientTo: 'to-yellow-400' };
      case 'ALT': return { color: 'blue', gradientFrom: 'from-blue-500', gradientTo: 'to-slate-600' };
      default: return { color: 'yellow', gradientFrom: 'from-yellow-600', gradientTo: 'to-emerald-600' };
    }
  };

  const getAlgorithmLabel = (c: string) => {
    switch (c) {
      case 'WTX': return 'RandomX Mining Power';
      case 'HTH': return 'X25X Mining Power';
      case 'FLOP': return 'Scrypt Mining Power';
      case 'ALT': return 'PoW/PoS Hybrid';
      default: return 'Mining Power';
    }
  };

  const { color: coinColor, gradientFrom, gradientTo } = getCoinStyle(coin);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <Activity className={`w-6 h-6 text-${coinColor}-400`} />
            <span>{coin} Network Difficulty</span>
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Block #{data.blockHeight.toLocaleString()} • {data.combined.algorithm}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {lastUpdate && (
            <span className="text-xs text-gray-500">
              Updated {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchData}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Combined Difficulty Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-gradient-to-r ${gradientFrom} ${gradientTo} rounded-xl p-6`}
      >
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-white/70 text-sm mb-1">Combined Difficulty</p>
            <p className="text-3xl font-bold text-white">{data.combined.effectiveDifficulty}</p>
            <p className="text-white/60 text-xs mt-1">
              {data.combined.powWeight} PoW + {data.combined.posWeight} PoS
            </p>
          </div>
          <div className="text-center">
            <p className="text-white/70 text-sm mb-1">Network Hashrate</p>
            <p className="text-3xl font-bold text-white">{data.pow.hashrateFormatted}</p>
            <p className="text-white/60 text-xs mt-1">{getAlgorithmLabel(coin)}</p>
          </div>
          <div className="text-center">
            <p className="text-white/70 text-sm mb-1">Staking Participation</p>
            <p className="text-3xl font-bold text-white">{data.pos.stakingParticipation}%</p>
            <p className="text-white/60 text-xs mt-1">Of Mature Supply</p>
          </div>
        </div>
      </motion.div>

      {/* PoW and PoS Side by Side */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* PoW Metrics */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gray-900/50 rounded-xl p-6 border border-gray-800"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <Zap className="w-5 h-5 text-orange-400" />
            <span>Proof of Work (PoW)</span>
          </h3>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Difficulty</span>
              <span className="font-mono text-lg">{data.pow.difficultyFormatted}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Network Hashrate</span>
              <span className="text-orange-400 font-semibold">{data.pow.hashrateFormatted}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Avg Block Time</span>
              <span>{data.pow.avgBlockTime}s <span className="text-gray-500">(target: {data.pow.targetBlockTime}s)</span></span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">PoW Blocks (24h)</span>
              <span>{data.pow.blocksLast24h.toLocaleString()}</span>
            </div>

            {/* Block Time Visual */}
            <div className="mt-4 pt-4 border-t border-gray-800">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-500">Block Time Variance</span>
                <span className={parseFloat(data.pow.avgBlockTime) > data.pow.targetBlockTime * 1.2 ? 'text-red-400' :
                               parseFloat(data.pow.avgBlockTime) < data.pow.targetBlockTime * 0.8 ? 'text-yellow-400' :
                               'text-emerald-400'}>
                  {((parseFloat(data.pow.avgBlockTime) / data.pow.targetBlockTime) * 100).toFixed(0)}% of target
                </span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    parseFloat(data.pow.avgBlockTime) > data.pow.targetBlockTime * 1.2 ? 'bg-red-500' :
                    parseFloat(data.pow.avgBlockTime) < data.pow.targetBlockTime * 0.8 ? 'bg-yellow-500' :
                    'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, (parseFloat(data.pow.avgBlockTime) / data.pow.targetBlockTime) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* PoS Metrics */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gray-900/50 rounded-xl p-6 border border-gray-800"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <Lock className="w-5 h-5 text-purple-400" />
            <span>Proof of Stake (PoS)</span>
          </h3>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Staking Difficulty</span>
              <span className="font-mono text-lg">{data.pos.difficulty}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Active Staking Weight</span>
              <span className="text-purple-400 font-semibold">{data.pos.activeStakingWeightFormatted} {coin}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Delegated Coins</span>
              <span>{data.pos.delegatedCoinsFormatted} {coin}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">PoS Blocks (24h)</span>
              <span>{data.pos.blocksLast24h.toLocaleString()}</span>
            </div>

            {/* Staking Participation Visual */}
            <div className="mt-4 pt-4 border-t border-gray-800">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-500">Staking Participation</span>
                <span className="text-purple-400">{data.pos.stakingParticipation}%</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                  style={{ width: `${Math.min(100, parseFloat(data.pos.stakingParticipation))}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Maturity threshold: {data.pos.maturityThreshold} blocks
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Supply Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gray-900/50 rounded-xl p-6 border border-gray-800"
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
          <Coins className="w-5 h-5 text-emerald-400" />
          <span>Supply & Maturity Breakdown</span>
        </h3>

        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-gray-800/50 rounded-lg p-4 text-center">
            <p className="text-gray-400 text-sm">Total Supply</p>
            <p className="text-xl font-bold mt-1">{data.supply.totalFormatted}</p>
            <p className="text-xs text-gray-500 mt-1">{coin}</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4 text-center">
            <p className="text-gray-400 text-sm">Mature Supply</p>
            <p className="text-xl font-bold mt-1 text-emerald-400">{data.supply.circulatingFormatted}</p>
            <p className="text-xs text-gray-500 mt-1">{data.supply.percentMature}% mature</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4 text-center">
            <p className="text-gray-400 text-sm">Immature Supply</p>
            <p className="text-xl font-bold mt-1 text-yellow-400">{data.supply.immatureFormatted}</p>
            <p className="text-xs text-gray-500 mt-1">&lt;{data.pos.maturityThreshold} confirmations</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4 text-center">
            <p className="text-gray-400 text-sm">Max Supply</p>
            <p className="text-xl font-bold mt-1">{data.supply.maxSupply.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">{coin}</p>
          </div>
        </div>

        {/* Supply Bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-500">Supply Distribution</span>
          </div>
          <div className="h-4 bg-gray-800 rounded-full overflow-hidden flex">
            {/* Mature + Staking */}
            <div
              className="h-full bg-emerald-500"
              style={{ width: `${(data.pos.activeStakingWeight / data.supply.total) * 100}%` }}
              title={`Staking: ${data.pos.activeStakingWeightFormatted}`}
            />
            {/* Mature but not staking */}
            <div
              className="h-full bg-blue-500"
              style={{ width: `${((data.supply.circulating - data.pos.activeStakingWeight) / data.supply.total) * 100}%` }}
              title={`Mature (not staking): ${data.pos.matureUndelegatedFormatted}`}
            />
            {/* Immature */}
            <div
              className="h-full bg-yellow-500"
              style={{ width: `${(data.supply.immature / data.supply.total) * 100}%` }}
              title={`Immature: ${data.supply.immatureFormatted}`}
            />
          </div>
          <div className="flex items-center justify-center space-x-4 mt-3 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-emerald-500 rounded" />
              <span className="text-gray-400">Staking</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-500 rounded" />
              <span className="text-gray-400">Mature (Idle)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-yellow-500 rounded" />
              <span className="text-gray-400">Immature</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Difficulty Formula */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gray-900/30 rounded-xl p-4 border border-gray-800/50"
      >
        <h4 className="text-sm font-semibold text-gray-400 mb-3">Difficulty Calculation Formula</h4>
        <div className="font-mono text-sm bg-black/30 rounded-lg p-4 overflow-x-auto">
          <div className="text-emerald-400">// PoW Difficulty (mining)</div>
          <div className="text-gray-300">D<sub>pow</sub> = D<sub>prev</sub> × (TargetTime / ActualAvgTime)</div>
          <div className="mt-3 text-purple-400">// PoS Difficulty (staking weight)</div>
          <div className="text-gray-300">D<sub>pos</sub> = TotalMatureSupply / ActiveStakingWeight</div>
          <div className="mt-3 text-yellow-400">// Combined Difficulty</div>
          <div className="text-gray-300">D<sub>combined</sub> = D<sub>pow</sub><sup>0.6</sup> × D<sub>pos</sub><sup>0.4</sup></div>
          <div className="mt-3 text-blue-400">// Mature Supply (coins eligible for staking)</div>
          <div className="text-gray-300">MatureSupply = Σ(UTXO.value) where confirmations ≥ {data.pos.maturityThreshold}</div>
        </div>
      </motion.div>
    </div>
  );
};

export default DifficultyMetrics;
