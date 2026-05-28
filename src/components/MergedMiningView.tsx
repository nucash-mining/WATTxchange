import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Cpu, Zap, CheckCircle, Clock } from 'lucide-react';

interface Coin {
  ticker: string;
  name: string;
  algo: string;
  port: number;
  status: 'live' | 'soon';
  logo: string;
  hash: string;
  note?: string;
}

const COINS: Coin[] = [
  { ticker: 'XMR',  name: 'Monero',       algo: 'RandomX',    port: 3334, status: 'live', logo: 'https://assets.coingecko.com/coins/images/69/large/monero_logo.png',            hash: 'xmr' },
  { ticker: 'ALT',  name: 'Altcoinchain', algo: 'Ethash',     port: 3333, status: 'live', logo: 'https://avatars.githubusercontent.com/u/115709361?v=4',                         hash: 'alt' },
  { ticker: 'LTC',  name: 'Litecoin',     algo: 'Scrypt',     port: 3337, status: 'soon', logo: 'https://assets.coingecko.com/coins/images/2/large/litecoin.png',                hash: 'ltc' },
  { ticker: 'BTC',  name: 'Bitcoin',      algo: 'SHA-256d',   port: 3336, status: 'soon', logo: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',                 hash: 'btc' },
  { ticker: 'OCTA', name: 'Octaspace',    algo: 'Ethash',     port: 3333, status: 'soon', logo: 'https://avatars.githubusercontent.com/u/47415994?v=4',                          hash: 'octa', note: 'Same port as ALT' },
  { ticker: 'DASH', name: 'Dash',         algo: 'X11',        port: 3340, status: 'soon', logo: 'https://assets.coingecko.com/coins/images/19/large/dash-logo.png',              hash: 'dash' },
  { ticker: 'ZEN',  name: 'Horizen',      algo: 'Equihash',   port: 3341, status: 'soon', logo: 'https://assets.coingecko.com/coins/images/691/large/horizen.png',               hash: 'zen',  note: 'Same port as ZEC+BTCZ' },
  { ticker: 'ZEC',  name: 'Zcash',        algo: 'Equihash',   port: 3341, status: 'soon', logo: 'https://assets.coingecko.com/coins/images/486/large/circle-zcash-color.png',    hash: 'zec',  note: 'Same port as ZEN+BTCZ' },
  { ticker: 'BTCZ', name: 'BitcoinZ',     algo: 'Equihash',   port: 3341, status: 'soon', logo: 'https://avatars.githubusercontent.com/u/33205606?s=200&v=4',                   hash: 'btcz', note: 'Same port as ZEN+ZEC' },
  { ticker: 'KAS',  name: 'Kaspa',        algo: 'kHeavyHash', port: 3342, status: 'soon', logo: 'https://assets.coingecko.com/coins/images/25751/large/kaspa-icon-exchanges.png', hash: 'kas' },
  { ticker: 'BIT',  name: 'Bitnet',       algo: 'SHA-256d',   port: 3343, status: 'soon', logo: 'https://avatars.githubusercontent.com/u/121768826?v=4',                         hash: 'bit' },
];

const MergedMiningView: React.FC = () => {
  const [copied, setCopied] = useState('');

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(''), 1500);
    });
  };

  const liveCount = COINS.filter(c => c.status === 'live').length;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Merged Mining Pool</h2>
            <p className="text-slate-400 mt-1">Mine any supported coin and earn WTX simultaneously — no extra hardware required</p>
          </div>
          <motion.a
            href="https://mm.wattxchange.app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 px-5 py-2.5 bg-yellow-600 hover:bg-yellow-500 text-black font-semibold rounded-xl transition-colors"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
          >
            <span>Open Mining Hub</span>
            <ExternalLink className="w-4 h-4" />
          </motion.a>
        </div>
      </motion.div>

      {/* Stats strip */}
      <motion.div
        className="grid grid-cols-3 gap-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border border-yellow-500/30 rounded-xl p-4 flex items-center space-x-3">
          <Cpu className="w-8 h-8 text-yellow-400 flex-shrink-0" />
          <div>
            <p className="text-slate-400 text-sm">Supported Coins</p>
            <p className="text-2xl font-bold">{COINS.length}</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-xl p-4 flex items-center space-x-3">
          <CheckCircle className="w-8 h-8 text-green-400 flex-shrink-0" />
          <div>
            <p className="text-slate-400 text-sm">Live Now</p>
            <p className="text-2xl font-bold">{liveCount}</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-xl p-4 flex items-center space-x-3">
          <Zap className="w-8 h-8 text-blue-400 flex-shrink-0" />
          <div>
            <p className="text-slate-400 text-sm">Stratum Host</p>
            <p className="text-sm font-mono font-bold text-blue-300 truncate">stratum.wattxchange.app</p>
          </div>
        </div>
      </motion.div>

      {/* Coin grid */}
      <div>
        <h3 className="text-xl font-semibold mb-4 flex items-center space-x-2">
          <Cpu className="w-5 h-5 text-yellow-400" />
          <span>Supported Coins</span>
          <span className="text-sm text-slate-400 font-normal ml-1">— connect once, earn on two chains simultaneously</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {COINS.map((coin, i) => (
            <motion.div
              key={coin.ticker}
              className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:border-yellow-500/30 transition-colors"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              {/* Top row: logo + name + algo badge */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <img
                    src={coin.logo}
                    alt={coin.ticker}
                    className="w-10 h-10 rounded-full object-cover bg-slate-700"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/nucash-mining/WATTxchange/main/WATT%20logo.png'; }}
                  />
                  <div>
                    <p className="font-semibold">{coin.name}</p>
                    <p className="text-slate-400 text-sm">{coin.ticker}</p>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-slate-700/70 text-slate-300 font-mono">
                  {coin.algo}
                </span>
              </div>

              {/* Port row */}
              <div className="flex items-center justify-between mb-3 bg-slate-900/60 rounded-lg px-3 py-2">
                <span className="text-slate-400 text-xs">Port</span>
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-yellow-400">{coin.port}</span>
                  <button
                    onClick={() => copyText(`stratum.wattxchange.app:${coin.port}`, coin.ticker)}
                    className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {copied === coin.ticker ? '✓' : 'copy'}
                  </button>
                </div>
              </div>

              {coin.note && (
                <p className="text-xs text-slate-500 mb-2">{coin.note}</p>
              )}

              {/* Footer row: status + link */}
              <div className="flex items-center justify-between">
                {coin.status === 'live' ? (
                  <span className="flex items-center space-x-1 text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                    <CheckCircle className="w-3 h-3" />
                    <span>Live</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-1 text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                    <Clock className="w-3 h-3" />
                    <span>Coming Soon</span>
                  </span>
                )}
                <a
                  href={`https://mm.wattxchange.app#${coin.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center space-x-1 transition-colors"
                >
                  <span>View Setup</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Info footer */}
      <motion.div
        className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border border-slate-600/50 rounded-xl p-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-start space-x-4">
          <div className="p-2 bg-yellow-600/20 rounded-lg flex-shrink-0">
            <Zap className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <p className="font-semibold mb-1">How Merged Mining Works</p>
            <p className="text-slate-400 text-sm">
              WATTx has built-in merged stratum support. Connect your miner once and it earns both the parent coin (XMR, LTC, etc.) and WTX simultaneously. Each coin uses its native algorithm — no extra configuration. Visit{' '}
              <a href="https://mm.wattxchange.app" target="_blank" rel="noopener noreferrer" className="text-yellow-400 hover:underline">
                mm.wattxchange.app
              </a>{' '}
              for full per-coin miner setup guides.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MergedMiningView;
