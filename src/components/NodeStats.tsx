import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Server,
  Activity,
  Cpu,
  HardDrive,
  Zap,
  Clock,
  Users,
  TrendingUp,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Wifi,
  WifiOff,
  Database,
  Globe,
  Award,
  Shield,
  Network,
  Radio,
  Map,
  Eye,
  ArrowUpDown
} from 'lucide-react';
import { nodeStatsService, NodeStats as NodeStatsType, OracleNode, PeerInfo, NETWORKS } from '../services/nodeStatsService';
import toast from 'react-hot-toast';

// Oracle Node Card Component
const OracleNodeCard: React.FC<{ node: OracleNode }> = ({ node }) => {
  const getTypeIcon = () => {
    switch (node.type) {
      case 'full-node': return <Server className="w-5 h-5" />;
      case 'electrum': return <Zap className="w-5 h-5" />;
      case 'explorer': return <Eye className="w-5 h-5" />;
      case 'masternode': return <Shield className="w-5 h-5" />;
      default: return <Server className="w-5 h-5" />;
    }
  };

  const getTypeColor = () => {
    switch (node.type) {
      case 'full-node': return 'bg-blue-600/30 text-blue-400';
      case 'electrum': return 'bg-yellow-600/30 text-yellow-400';
      case 'explorer': return 'bg-purple-600/30 text-purple-400';
      case 'masternode': return 'bg-pink-600/30 text-pink-400';
      default: return 'bg-slate-600/30 text-slate-400';
    }
  };

  const getStatusColor = () => {
    switch (node.status) {
      case 'online': return 'bg-green-500';
      case 'syncing': return 'bg-yellow-500 animate-pulse';
      case 'offline': return 'bg-red-500';
      default: return 'bg-slate-500';
    }
  };

  const getTierBadge = () => {
    switch (node.tier) {
      case 'platinum':
        return <span className="px-2 py-0.5 bg-cyan-400/20 text-cyan-400 rounded-full text-xs flex items-center space-x-1"><Award className="w-3 h-3" /><span>Platinum</span></span>;
      case 'gold':
        return <span className="px-2 py-0.5 bg-yellow-400/20 text-yellow-400 rounded-full text-xs flex items-center space-x-1"><Award className="w-3 h-3" /><span>Gold</span></span>;
      case 'silver':
        return <span className="px-2 py-0.5 bg-gray-400/20 text-gray-400 rounded-full text-xs flex items-center space-x-1"><Shield className="w-3 h-3" /><span>Silver</span></span>;
      default:
        return null;
    }
  };

  return (
    <motion.div
      className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${getTypeColor()}`}>
            {getTypeIcon()}
          </div>
          <div>
            <h4 className="font-semibold">{node.name}</h4>
            <p className="text-xs text-slate-400">{node.coin} • {node.type}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getTierBadge()}
          <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor()}`} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-slate-900/50 rounded p-2">
          <p className="text-slate-500 text-xs">Host</p>
          <p className="font-mono text-xs truncate">{node.host}:{node.port}</p>
        </div>
        <div className="bg-slate-900/50 rounded p-2">
          <p className="text-slate-500 text-xs">Version</p>
          <p className="text-xs">{node.version}</p>
        </div>
        {node.blockHeight && (
          <div className="bg-slate-900/50 rounded p-2">
            <p className="text-slate-500 text-xs">Block Height</p>
            <p className="text-xs font-semibold">{node.blockHeight.toLocaleString()}</p>
          </div>
        )}
        {node.connections !== undefined && (
          <div className="bg-slate-900/50 rounded p-2">
            <p className="text-slate-500 text-xs">Connections</p>
            <p className="text-xs font-semibold">{node.connections}</p>
          </div>
        )}
        {node.syncProgress !== undefined && node.syncProgress < 100 && (
          <div className="col-span-2 bg-slate-900/50 rounded p-2">
            <p className="text-slate-500 text-xs mb-1">Sync Progress</p>
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                initial={{ width: 0 }}
                animate={{ width: `${node.syncProgress}%` }}
              />
            </div>
            <p className="text-xs text-right mt-1">{node.syncProgress.toFixed(1)}%</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Peer List Component
const PeerList: React.FC<{ peers: PeerInfo[]; coin: string }> = ({ peers, coin }) => {
  const [showAll, setShowAll] = useState(false);
  const displayPeers = showAll ? peers : peers.slice(0, 5);

  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold flex items-center space-x-2">
          <Users className="w-4 h-4 text-blue-400" />
          <span>Connected Peers ({peers.length})</span>
        </h4>
        {peers.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            {showAll ? 'Show Less' : `Show All (${peers.length})`}
          </button>
        )}
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {displayPeers.map((peer) => (
          <div
            key={peer.id}
            className="flex items-center justify-between bg-slate-900/50 rounded-lg p-2 text-xs"
          >
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${peer.inbound ? 'bg-green-400' : 'bg-blue-400'}`} />
              <span className="font-mono">{peer.addr}</span>
            </div>
            <div className="flex items-center space-x-3 text-slate-400">
              <span>{peer.subver?.slice(1, -1) || 'Unknown'}</span>
              <span className="flex items-center space-x-1">
                <ArrowUpDown className="w-3 h-3" />
                <span>{(peer.bytesrecv / 1024 / 1024).toFixed(1)}MB</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {peers.length === 0 && (
        <p className="text-sm text-slate-500 text-center py-4">No peers connected</p>
      )}
    </div>
  );
};

// Network Map Component
const NetworkMap: React.FC<{ nodes: OracleNode[]; peers: PeerInfo[]; selectedCoin: string }> = ({ nodes, peers, selectedCoin }) => {
  const centerX = 200;
  const centerY = 150;
  const radius = 100;

  // Filter nodes for selected coin
  const coinNodes = nodes.filter(n => n.coin === selectedCoin);
  const peerCount = Math.min(peers.length, 12);

  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
      <h4 className="font-semibold flex items-center space-x-2 mb-3">
        <Map className="w-4 h-4 text-purple-400" />
        <span>{selectedCoin} Network Topology</span>
      </h4>

      <svg viewBox="0 0 400 300" className="w-full h-64">
        {/* Background grid */}
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(100,116,139,0.1)" strokeWidth="0.5"/>
          </pattern>
          <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(234,179,8,0.3)"/>
            <stop offset="100%" stopColor="rgba(234,179,8,0)"/>
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)"/>

        {/* Connection lines to peers */}
        {peers.slice(0, peerCount).map((peer, i) => {
          const angle = (i / peerCount) * Math.PI * 2 - Math.PI / 2;
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;
          return (
            <motion.line
              key={peer.id}
              x1={centerX}
              y1={centerY}
              x2={x}
              y2={y}
              stroke={peer.inbound ? "rgba(74,222,128,0.3)" : "rgba(96,165,250,0.3)"}
              strokeWidth="1"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
            />
          );
        })}

        {/* Peer nodes */}
        {peers.slice(0, peerCount).map((peer, i) => {
          const angle = (i / peerCount) * Math.PI * 2 - Math.PI / 2;
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;
          return (
            <motion.g key={peer.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
              <circle
                cx={x}
                cy={y}
                r="6"
                fill={peer.inbound ? "rgba(74,222,128,0.8)" : "rgba(96,165,250,0.8)"}
              />
              <text
                x={x}
                y={y + 18}
                textAnchor="middle"
                fill="rgba(148,163,184,0.8)"
                fontSize="8"
              >
                {peer.addr.split(':')[0].split('.').slice(-2).join('.')}
              </text>
            </motion.g>
          );
        })}

        {/* Central node (our server) */}
        <motion.circle
          cx={centerX}
          cy={centerY}
          r="30"
          fill="url(#nodeGlow)"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        />
        <motion.circle
          cx={centerX}
          cy={centerY}
          r="20"
          fill="rgba(234,179,8,0.9)"
          stroke="rgba(234,179,8,0.5)"
          strokeWidth="2"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        />
        <text x={centerX} y={centerY + 4} textAnchor="middle" fill="black" fontSize="10" fontWeight="bold">
          {selectedCoin}
        </text>
        <text x={centerX} y={centerY + 45} textAnchor="middle" fill="rgba(148,163,184,0.8)" fontSize="9">
          WATTxchange Node
        </text>

        {/* Legend */}
        <g transform="translate(10, 260)">
          <circle cx="5" cy="5" r="4" fill="rgba(74,222,128,0.8)"/>
          <text x="15" y="8" fill="rgba(148,163,184,0.8)" fontSize="8">Inbound</text>
          <circle cx="60" cy="5" r="4" fill="rgba(96,165,250,0.8)"/>
          <text x="70" y="8" fill="rgba(148,163,184,0.8)" fontSize="8">Outbound</text>
        </g>

        {/* Stats */}
        <g transform="translate(280, 260)">
          <text fill="rgba(148,163,184,0.8)" fontSize="9">
            {peers.filter(p => p.inbound).length} in / {peers.filter(p => !p.inbound).length} out
          </text>
        </g>
      </svg>
    </div>
  );
};

// Network Stats Card
const NetworkStatsCard: React.FC<{ stats: NodeStatsType; isOwn: boolean }> = ({ stats, isOwn }) => {
  const formatNumber = (num: number, decimals = 2) => {
    if (num >= 1e12) return `${(num / 1e12).toFixed(decimals)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(decimals)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(decimals)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(decimals)}K`;
    return num.toLocaleString();
  };

  return (
    <motion.div
      className={`bg-slate-800/50 rounded-xl border ${isOwn ? 'border-yellow-500/30' : 'border-slate-700/50'} overflow-hidden`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className={`p-3 ${isOwn ? 'bg-yellow-600/10' : 'bg-slate-700/30'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold">{stats.symbol}</span>
            <span className="text-sm text-slate-400">{stats.name}</span>
          </div>
          {stats.node?.status && (
            <div className={`flex items-center space-x-1 text-xs ${
              stats.node.status === 'online' ? 'text-green-400' :
              stats.node.status === 'syncing' ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {stats.node.status === 'online' ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              <span className="capitalize">{stats.node.status}</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-3 grid grid-cols-2 gap-2 text-sm">
        <div className="bg-slate-900/50 rounded p-2">
          <p className="text-slate-500 text-xs">Block Height</p>
          <p className="font-semibold">{stats.network.blockHeight.toLocaleString()}</p>
        </div>
        <div className="bg-slate-900/50 rounded p-2">
          <p className="text-slate-500 text-xs">Hashrate</p>
          <p className="font-semibold">{stats.network.hashrateFormatted}</p>
        </div>
        <div className="bg-slate-900/50 rounded p-2">
          <p className="text-slate-500 text-xs">Peers</p>
          <p className="font-semibold">{stats.network.peers}</p>
        </div>
        <div className="bg-slate-900/50 rounded p-2">
          <p className="text-slate-500 text-xs">Circulating</p>
          <p className="font-semibold">{formatNumber(stats.supply.circulating)}</p>
        </div>
      </div>
    </motion.div>
  );
};

// Main Component
const NodeStatsView: React.FC = () => {
  const [oracleNodes, setOracleNodes] = useState<OracleNode[]>([]);
  const [allStats, setAllStats] = useState<NodeStatsType[]>([]);
  const [peers, setPeers] = useState<Map<string, PeerInfo[]>>(new Map());
  const [selectedCoin, setSelectedCoin] = useState<string>('WTX');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'our-nodes' | 'public'>('all');

  const loadData = useCallback(async () => {
    console.log('[NodeStats] Starting data load...');
    try {
      const [nodes, stats] = await Promise.all([
        nodeStatsService.getOracleNodes(),
        nodeStatsService.getAllStats()
      ]);
      console.log('[NodeStats] Oracle nodes loaded:', nodes);
      console.log('[NodeStats] All stats loaded:', stats);
      setOracleNodes(nodes);
      setAllStats(stats);

      // Load peers for our coins
      const newPeers = new Map<string, PeerInfo[]>();
      for (const coin of ['WTX', 'HTH', 'FLOP']) {
        const coinPeers = await nodeStatsService.getPeers(coin);
        console.log(`[NodeStats] Peers for ${coin}:`, coinPeers.length);
        newPeers.set(coin, coinPeers);
      }
      setPeers(newPeers);
      console.log('[NodeStats] Data load complete');
    } catch (error) {
      console.error('[NodeStats] Failed to load node stats:', error);
      toast.error('Failed to load node statistics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    nodeStatsService.clearCache();
    await loadData();
    setIsRefreshing(false);
    toast.success('Stats refreshed');
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const ownNetworks = nodeStatsService.getOwnNetworks().map(n => n.coin);
  const ownStats = allStats.filter(s => ownNetworks.includes(s.coin));
  const publicStats = allStats.filter(s => !ownNetworks.includes(s.coin));
  const currentPeers = peers.get(selectedCoin) || [];

  // Calculate summary stats
  const onlineNodes = oracleNodes.filter(n => n.status === 'online').length;
  const totalConnections = oracleNodes.reduce((sum, n) => sum + (n.connections || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h2 className="text-3xl font-bold">Network Statistics</h2>
          <p className="text-slate-400 mt-1">Real-time blockchain network data</p>
        </div>

        <div className="flex items-center space-x-3">
          <motion.button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-colors disabled:opacity-50"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </motion.button>

          <div className="flex bg-slate-800/50 rounded-lg p-1">
            {(['all', 'our-nodes', 'public'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  filter === f ? 'bg-yellow-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {f === 'all' ? 'All' : f === 'our-nodes' ? 'Our Nodes' : 'Public'}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border border-yellow-500/30 rounded-xl p-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="flex items-center space-x-3">
            <Server className="w-8 h-8 text-yellow-400" />
            <div>
              <p className="text-slate-400 text-sm">Oracle Nodes</p>
              <p className="text-2xl font-bold">{onlineNodes}/{oracleNodes.length}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-xl p-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center space-x-3">
            <Users className="w-8 h-8 text-blue-400" />
            <div>
              <p className="text-slate-400 text-sm">Total Connections</p>
              <p className="text-2xl font-bold">{totalConnections}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-xl p-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center space-x-3">
            <Globe className="w-8 h-8 text-green-400" />
            <div>
              <p className="text-slate-400 text-sm">Networks Tracked</p>
              <p className="text-2xl font-bold">{allStats.length}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center space-x-3">
            <Activity className="w-8 h-8 text-purple-400" />
            <div>
              <p className="text-slate-400 text-sm">Total Blocks</p>
              <p className="text-2xl font-bold">
                {(allStats.reduce((sum, s) => sum + s.network.blockHeight, 0) / 1e6).toFixed(1)}M
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Debug info */}
      <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-xs font-mono mb-4">
        <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
        <p>Oracle Nodes: {oracleNodes.length}</p>
        <p>All Stats: {allStats.length}</p>
        <p>WTX Stats: {JSON.stringify(allStats.find(s => s.coin === 'WTX')?.network || 'None')}</p>
        <p>HTH Stats: {JSON.stringify(allStats.find(s => s.coin === 'HTH')?.network || 'None')}</p>
        <button
          onClick={async () => {
            try {
              console.log('[Debug] Testing direct fetch...');
              const res = await fetch('https://wtx-explorer.wattxchange.app/api/stats');
              const data = await res.json();
              console.log('[Debug] Direct fetch result:', data);
              alert(`Direct fetch: Block ${data?.network?.blocks || 'N/A'}, Connections: ${data?.network?.connections || 'N/A'}`);
            } catch (e: any) {
              console.error('[Debug] Fetch error:', e);
              alert(`Fetch error: ${e.message}`);
            }
          }}
          className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white"
        >
          Test Direct Fetch
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-400" />
        </div>
      ) : (
        <>
          {/* Our Nodes Section */}
          {(filter === 'all' || filter === 'our-nodes') && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center space-x-2">
                <Server className="w-5 h-5 text-yellow-400" />
                <span>WATTxchange Oracle VM Infrastructure</span>
                <span className="text-sm text-slate-400 font-normal ml-2">129.80.40.193</span>
              </h3>

              {/* Oracle Nodes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {oracleNodes.map((node) => (
                  <OracleNodeCard key={node.id} node={node} />
                ))}
              </div>

              {/* Coin Selector for Network View */}
              <div className="flex items-center space-x-2 mt-6">
                <span className="text-sm text-slate-400">Select Network:</span>
                <div className="flex bg-slate-800/50 rounded-lg p-1">
                  {['WTX', 'HTH', 'FLOP'].map((coin) => (
                    <button
                      key={coin}
                      onClick={() => setSelectedCoin(coin)}
                      className={`px-4 py-1.5 rounded-md text-sm transition-colors ${
                        selectedCoin === coin ? 'bg-yellow-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {coin}
                    </button>
                  ))}
                </div>
              </div>

              {/* Network Map and Peers */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <NetworkMap
                  nodes={oracleNodes}
                  peers={currentPeers}
                  selectedCoin={selectedCoin}
                />
                <PeerList
                  peers={currentPeers}
                  coin={selectedCoin}
                />
              </div>

              {/* Our Network Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ownStats.map((stats) => (
                  <NetworkStatsCard key={stats.coin} stats={stats} isOwn={true} />
                ))}
              </div>
            </div>
          )}

          {/* Public Networks Section */}
          {(filter === 'all' || filter === 'public') && publicStats.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center space-x-2">
                <Globe className="w-5 h-5 text-blue-400" />
                <span>Public Network Statistics</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {publicStats.map((stats) => (
                  <NetworkStatsCard key={stats.coin} stats={stats} isOwn={false} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Node Tier Info */}
      <motion.div
        className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border border-slate-600/50 rounded-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-gradient-to-br from-yellow-600/30 to-orange-600/30 rounded-lg">
            <Award className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Node Tier System</h3>
            <p className="text-slate-400 text-sm mb-3">
              All WATTxchange infrastructure nodes run on Oracle Cloud with 99.9% uptime SLA.
            </p>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-cyan-400/20 text-cyan-400 rounded-full text-sm">
                <Award className="w-4 h-4" />
                <span>Platinum: 99.9%+ Uptime</span>
              </div>
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-yellow-400/20 text-yellow-400 rounded-full text-sm">
                <Award className="w-4 h-4" />
                <span>Gold: 99%+ Uptime</span>
              </div>
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-400/20 text-gray-400 rounded-full text-sm">
                <Shield className="w-4 h-4" />
                <span>Silver: 95%+ Uptime</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default NodeStatsView;
