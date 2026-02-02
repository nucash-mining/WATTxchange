import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Box, Clock, Hash, ArrowRight, Zap, Users, Activity, ExternalLink, Copy, CheckCircle, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';
import DifficultyMetrics from './explorer/DifficultyMetrics';

interface Block {
  height: number;
  hash: string;
  time: number;
  txCount: number;
  size: number;
  miner?: string;
}

interface Transaction {
  txid: string;
  blockHeight: number;
  time: number;
  value: number;
  fee: number;
  confirmations: number;
}

interface NetworkStats {
  blockHeight: number;
  difficulty: string;
  hashrate: string;
  totalSupply: string;
  circulatingSupply: string;
  marketCap?: string;
  price?: string;
}

type Chain = 'WTX' | 'HTH' | 'FLOP' | 'ALT';

const ExplorerView: React.FC = () => {
  const [activeChain, setActiveChain] = useState<Chain>('WTX');
  const [activeTab, setActiveTab] = useState<'overview' | 'difficulty'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [recentBlocks, setRecentBlocks] = useState<Block[]>([]);
  const [recentTxs, setRecentTxs] = useState<Transaction[]>([]);
  const [networkStats, setNetworkStats] = useState<NetworkStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Explorer endpoints - unified API at api.wattxchange.app
  const explorerEndpoints = {
    WTX: {
      api: 'https://api.wattxchange.app/wtx',
      apiDisplay: 'https://api.wattxchange.app/wtx',
      electrum: 'electrum.wattxchange.app:50002',
      rpc: '129.80.40.193:3889'
    },
    HTH: {
      api: 'https://api.wattxchange.app/hth',
      apiDisplay: 'https://api.wattxchange.app/hth',
      electrum: 'electrum.wattxchange.app:50002',
      rpc: '129.80.40.193:65001'
    },
    FLOP: {
      api: 'https://api.wattxchange.app/flop',
      apiDisplay: 'https://api.wattxchange.app/flop',
      electrum: 'flop-electrum.wattxchange.app:50002',
      rpc: '129.80.40.193:9998'
    },
    ALT: {
      api: 'https://api.wattxchange.app/bit',
      apiDisplay: 'https://api.wattxchange.app/bit',
      rpc: 'https://alt-rpc.wattxchange.app',
      ws: 'wss://alt-ws.wattxchange.app',
      chainId: 2330
    }
  };

  useEffect(() => {
    loadExplorerData();
    const interval = setInterval(loadExplorerData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [activeChain]);

  const loadExplorerData = async () => {
    setIsLoading(true);
    try {
      // In production, these would fetch from actual explorer APIs
      // For now, using mock data
      await Promise.all([
        fetchNetworkStats(),
        fetchRecentBlocks(),
        fetchRecentTransactions()
      ]);
    } catch (error) {
      console.error('Failed to load explorer data:', error);
      toast.error('Failed to load explorer data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNetworkStats = async () => {
    try {
      const response = await fetch(`${explorerEndpoints[activeChain].api}/stats`);
      if (!response.ok) throw new Error('API request failed');

      const data = await response.json();

      // Format the response data
      const formatHashrate = (hashrate: number | null) => {
        if (!hashrate) return 'N/A';
        if (hashrate >= 1e12) return `${(hashrate / 1e12).toFixed(2)} TH/s`;
        if (hashrate >= 1e9) return `${(hashrate / 1e9).toFixed(2)} GH/s`;
        if (hashrate >= 1e6) return `${(hashrate / 1e6).toFixed(2)} MH/s`;
        if (hashrate >= 1e3) return `${(hashrate / 1e3).toFixed(2)} KH/s`;
        return `${hashrate.toFixed(2)} H/s`;
      };

      const formatDifficulty = (diff: number) => {
        if (diff >= 1e9) return `${(diff / 1e9).toFixed(2)}B`;
        if (diff >= 1e6) return `${(diff / 1e6).toFixed(2)}M`;
        if (diff >= 1e3) return `${(diff / 1e3).toFixed(2)}K`;
        return diff.toFixed(2);
      };

      const getTotalSupply = (chain: Chain) => {
        switch (chain) {
          case 'WTX': return '21,000,000 WTX';
          case 'HTH': return '100,000,000 HTH';
          case 'FLOP': return '100,000,000 FLOP';
          case 'ALT': return '∞ ALT'; // EVM chain with no max supply
        }
      };

      const getBlockReward = (chain: Chain) => {
        switch (chain) {
          case 'WTX': return 50;
          case 'HTH': return 10;
          case 'FLOP': return 50;
          case 'ALT': return 2; // PoS block reward
        }
      };

      setNetworkStats({
        blockHeight: data.network?.blocks || data.network?.height || 0,
        difficulty: formatDifficulty(data.network?.difficulty || 0),
        hashrate: activeChain === 'ALT' ? 'N/A (PoS)' : formatHashrate(data.network?.networkHashPs || data.network?.hashrate),
        totalSupply: getTotalSupply(activeChain),
        circulatingSupply: `${((data.network?.blocks || 0) * getBlockReward(activeChain)).toLocaleString()} ${activeChain}`,
        price: 'N/A'
      });
    } catch (error) {
      console.error('Failed to fetch network stats:', error);
      // Fallback to mock data on error
      const getTotalSupplyFallback = (chain: Chain) => {
        switch (chain) {
          case 'WTX': return '21,000,000 WTX';
          case 'HTH': return '100,000,000 HTH';
          case 'FLOP': return '100,000,000 FLOP';
          case 'ALT': return '∞ ALT';
        }
      };
      setNetworkStats({
        blockHeight: 0,
        difficulty: 'N/A',
        hashrate: 'N/A',
        totalSupply: getTotalSupplyFallback(activeChain),
        circulatingSupply: 'N/A',
        price: 'N/A'
      });
    }
  };

  const fetchRecentBlocks = async () => {
    try {
      const response = await fetch(`${explorerEndpoints[activeChain].api}/blocks?limit=10`);
      if (!response.ok) throw new Error('API request failed');

      const data = await response.json();

      const blocks: Block[] = (data.blocks || []).map((block: any) => ({
        height: block.height,
        hash: block.hash,
        time: block.time * 1000, // Convert to milliseconds
        txCount: block.txCount || 1,
        size: block.size || 0,
        miner: block.miner || (() => {
          switch (activeChain) {
            case 'WTX': return 'RandomX Miner';
            case 'HTH': return 'X25X Miner';
            case 'FLOP': return 'Scrypt Miner';
            case 'ALT': return 'Validator';
          }
        })()
      }));
      setRecentBlocks(blocks);
    } catch (error) {
      console.error('Failed to fetch recent blocks:', error);
      setRecentBlocks([]);
    }
  };

  const fetchRecentTransactions = async () => {
    try {
      const response = await fetch(`${explorerEndpoints[activeChain].api}/txs?limit=10`);
      if (!response.ok) throw new Error('API request failed');

      const data = await response.json();

      const txs: Transaction[] = (data.transactions || []).map((tx: any) => ({
        txid: tx.txid,
        blockHeight: tx.blockHeight,
        time: tx.blockTime * 1000, // Convert to milliseconds
        value: parseFloat(tx.totalOutput) || 0,
        fee: parseFloat(tx.fee) || 0,
        confirmations: (networkStats?.blockHeight || 0) - tx.blockHeight + 1
      }));
      setRecentTxs(txs);
    } catch (error) {
      console.error('Failed to fetch recent transactions:', error);
      setRecentTxs([]);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    toast.loading('Searching...', { id: 'search' });

    // Determine search type based on query
    if (searchQuery.length === 64) {
      // TX hash or block hash
      toast.success(`Found transaction/block: ${searchQuery.slice(0, 16)}...`, { id: 'search' });
    } else if (!isNaN(Number(searchQuery))) {
      // Block height
      toast.success(`Found block at height ${searchQuery}`, { id: 'search' });
    } else if (searchQuery.startsWith('wx1') || searchQuery.startsWith('H')) {
      // Address
      toast.success(`Found address: ${searchQuery.slice(0, 16)}...`, { id: 'search' });
    } else {
      toast.error('Invalid search query', { id: 'search' });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const formatTime = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const truncateHash = (hash: string, length: number = 8) => {
    return `${hash.slice(0, length)}...${hash.slice(-length)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-emerald-400 bg-clip-text text-transparent">
            Block Explorer
          </h1>
          <p className="text-gray-400 mt-1">Explore {activeChain} blockchain</p>
        </div>

        {/* Chain Selector */}
        <div className="flex space-x-2 flex-wrap gap-y-2">
          {(['WTX', 'HTH', 'FLOP', 'ALT'] as Chain[]).map((chain) => {
            const getChainGradient = (c: Chain) => {
              switch (c) {
                case 'WTX': return 'from-yellow-600 to-emerald-600';
                case 'HTH': return 'from-green-500 to-yellow-400';
                case 'FLOP': return 'from-pink-500 to-yellow-400';
                case 'ALT': return 'from-red-600 to-slate-900';
              }
            };
            return (
              <button
                key={chain}
                onClick={() => setActiveChain(chain)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeChain === chain
                    ? `bg-gradient-to-r ${getChainGradient(chain)} text-white`
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {chain}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-900/50 rounded-xl p-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-all ${
            activeTab === 'overview'
              ? 'bg-gradient-to-r from-yellow-600/20 to-emerald-600/20 border border-yellow-500/30 text-yellow-400'
              : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
          }`}
        >
          <Box className="w-4 h-4" />
          <span className="font-medium">Blocks & Transactions</span>
        </button>
        <button
          onClick={() => setActiveTab('difficulty')}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-all ${
            activeTab === 'difficulty'
              ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 text-purple-400'
              : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span className="font-medium">Difficulty & Staking</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'difficulty' ? (
          <motion.div
            key="difficulty"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <DifficultyMetrics coin={activeChain} />
          </motion.div>
        ) : (
          <motion.div
            key="overview"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-900/50 rounded-xl p-4 border border-gray-800"
      >
        <div className="flex space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search by address, txid, or block height..."
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50"
            />
          </div>
          <button
            onClick={handleSearch}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeChain === 'WTX'
                ? 'bg-gradient-to-r from-yellow-600 to-emerald-600 hover:from-yellow-500 hover:to-emerald-500'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500'
            } text-white`}
          >
            Search
          </button>
        </div>
      </motion.div>

      {/* Network Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
      >
        {networkStats && (
          <>
            <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
              <div className="flex items-center space-x-2 text-gray-400 mb-1">
                <Box className="w-4 h-4" />
                <span className="text-sm">Block Height</span>
              </div>
              <p className="text-xl font-bold text-white">{networkStats.blockHeight.toLocaleString()}</p>
            </div>
            <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
              <div className="flex items-center space-x-2 text-gray-400 mb-1">
                <Activity className="w-4 h-4" />
                <span className="text-sm">Difficulty</span>
              </div>
              <p className="text-xl font-bold text-white">{networkStats.difficulty}</p>
            </div>
            <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
              <div className="flex items-center space-x-2 text-gray-400 mb-1">
                <Zap className="w-4 h-4" />
                <span className="text-sm">Hashrate</span>
              </div>
              <p className="text-xl font-bold text-white">{networkStats.hashrate}</p>
            </div>
            <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
              <div className="flex items-center space-x-2 text-gray-400 mb-1">
                <Hash className="w-4 h-4" />
                <span className="text-sm">Total Supply</span>
              </div>
              <p className="text-xl font-bold text-white">{networkStats.totalSupply}</p>
            </div>
            <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
              <div className="flex items-center space-x-2 text-gray-400 mb-1">
                <Users className="w-4 h-4" />
                <span className="text-sm">Circulating</span>
              </div>
              <p className="text-xl font-bold text-white">{networkStats.circulatingSupply}</p>
            </div>
            <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
              <div className="flex items-center space-x-2 text-gray-400 mb-1">
                <Activity className="w-4 h-4" />
                <span className="text-sm">Price</span>
              </div>
              <p className="text-xl font-bold text-emerald-400">{networkStats.price}</p>
            </div>
          </>
        )}
      </motion.div>

      {/* Recent Blocks & Transactions */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Blocks */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden"
        >
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center space-x-2">
              <Box className="w-5 h-5 text-yellow-400" />
              <span>Recent Blocks</span>
            </h2>
            <button className="text-sm text-yellow-400 hover:text-yellow-300 flex items-center space-x-1">
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="divide-y divide-gray-800 max-h-96 overflow-y-auto">
            {recentBlocks.map((block) => (
              <div key={block.height} className="p-4 hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-yellow-400">#{block.height.toLocaleString()}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <button
                        onClick={() => copyToClipboard(block.hash)}
                        className="text-sm text-gray-400 hover:text-white flex items-center space-x-1"
                      >
                        <span>{truncateHash(block.hash)}</span>
                        {copiedHash === block.hash ? (
                          <CheckCircle className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">{block.txCount} txns</p>
                    <p className="text-xs text-gray-500">{formatTime(block.time)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden"
        >
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center space-x-2">
              <ArrowRight className="w-5 h-5 text-emerald-400" />
              <span>Recent Transactions</span>
            </h2>
            <button className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center space-x-1">
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="divide-y divide-gray-800 max-h-96 overflow-y-auto">
            {recentTxs.map((tx) => (
              <div key={tx.txid} className="p-4 hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <button
                      onClick={() => copyToClipboard(tx.txid)}
                      className="font-medium text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
                    >
                      <span>{truncateHash(tx.txid, 10)}</span>
                      {copiedHash === tx.txid ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                    <p className="text-sm text-gray-400 mt-1">Block #{tx.blockHeight.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{tx.value.toFixed(4)} {activeChain}</p>
                    <p className="text-xs text-gray-500">{formatTime(tx.time)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Connection Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gray-900/50 rounded-xl p-4 border border-gray-800"
      >
        <h3 className="text-lg font-semibold mb-3">Connection Endpoints</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {activeChain === 'ALT' ? (
            <>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-sm text-gray-400 mb-1">WebSocket</p>
                <div className="flex items-center justify-between">
                  <code className="text-sm text-yellow-400">{explorerEndpoints.ALT.ws}</code>
                  <button
                    onClick={() => copyToClipboard(explorerEndpoints.ALT.ws || '')}
                    className="text-gray-400 hover:text-white"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-sm text-gray-400 mb-1">Chain ID</p>
                <div className="flex items-center justify-between">
                  <code className="text-sm text-yellow-400">{explorerEndpoints.ALT.chainId}</code>
                  <button
                    onClick={() => copyToClipboard(String(explorerEndpoints.ALT.chainId))}
                    className="text-gray-400 hover:text-white"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-gray-800/50 rounded-lg p-3">
              <p className="text-sm text-gray-400 mb-1">Electrum Server</p>
              <div className="flex items-center justify-between">
                <code className="text-sm text-yellow-400">{(explorerEndpoints[activeChain] as any).electrum}</code>
                <button
                  onClick={() => copyToClipboard((explorerEndpoints[activeChain] as any).electrum)}
                  className="text-gray-400 hover:text-white"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          <div className="bg-gray-800/50 rounded-lg p-3">
            <p className="text-sm text-gray-400 mb-1">RPC Endpoint</p>
            <div className="flex items-center justify-between">
              <code className="text-sm text-yellow-400">{explorerEndpoints[activeChain].rpc}</code>
              <button
                onClick={() => copyToClipboard(explorerEndpoints[activeChain].rpc)}
                className="text-gray-400 hover:text-white"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <p className="text-sm text-gray-400 mb-1">API Endpoint</p>
            <div className="flex items-center justify-between">
              <code className="text-sm text-yellow-400 truncate">{explorerEndpoints[activeChain].apiDisplay}</code>
              <a
                href={explorerEndpoints[activeChain].apiDisplay}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white ml-2"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </motion.div>
        </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExplorerView;
