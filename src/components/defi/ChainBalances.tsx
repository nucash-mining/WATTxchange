import React from 'react';
import { motion } from 'framer-motion';
import {
  Wallet,
  RefreshCw,
  ExternalLink,
  Copy,
  CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ChainBalancesProps {
  balances: {
    polygon: { MATIC: string; WATT: string };
    wattx: { WATT: string; tWATTx: string };
  };
  chains: any;
  walletAddress: string;
  onRefresh: () => void;
  isLoading: boolean;
}

const ChainBalances: React.FC<ChainBalancesProps> = ({
  balances,
  chains,
  walletAddress,
  onRefresh,
  isLoading
}) => {
  const [copied, setCopied] = React.useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    toast.success('Address copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const chainData = [
    {
      name: 'Polygon',
      logo: '/polygon-logo.png',
      color: 'from-purple-500 to-purple-600',
      borderColor: 'border-purple-500/30',
      bgColor: 'from-purple-600/20 to-purple-800/20',
      explorer: 'https://polygonscan.com',
      tokens: [
        { symbol: 'MATIC', balance: balances.polygon.MATIC, native: true },
        { symbol: 'WATT', balance: balances.polygon.WATT, contract: chains.polygon.tokens.WATT }
      ]
    },
    {
      name: 'WATTx',
      logo: '/WATT logo.png',
      color: 'from-emerald-500 to-emerald-600',
      borderColor: 'border-emerald-500/30',
      bgColor: 'from-emerald-600/20 to-emerald-800/20',
      explorer: chains.wattx.explorer,
      tokens: [
        { symbol: 'WATT', balance: balances.wattx.WATT, native: true },
        { symbol: 'tWATTx', balance: balances.wattx.tWATTx, contract: chains.wattx.tokens.tWATTx }
      ]
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Wallet Address Card */}
      <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Wallet className="w-5 h-5 text-yellow-400" />
            Your Wallet
          </h3>
          <motion.button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 bg-slate-800/50 rounded-lg hover:bg-slate-700/50 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>

        {walletAddress ? (
          <div className="flex items-center gap-3 bg-black/30 rounded-xl p-4">
            <div className="flex-1 font-mono text-sm break-all">
              {walletAddress}
            </div>
            <motion.button
              onClick={copyAddress}
              className="p-2 bg-slate-800/50 rounded-lg hover:bg-slate-700/50 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {copied ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </motion.button>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">
            Connect your wallet to view balances
          </div>
        )}
      </div>

      {/* Chain Balances */}
      <div className="grid md:grid-cols-2 gap-6">
        {chainData.map((chain, chainIndex) => (
          <motion.div
            key={chain.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: chainIndex * 0.1 }}
            className={`bg-gradient-to-br ${chain.bgColor} backdrop-blur-xl rounded-2xl p-6 border ${chain.borderColor}`}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${chain.color} flex items-center justify-center`}>
                  <img
                    src={chain.logo}
                    alt={chain.name}
                    className="w-8 h-8"
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                </div>
                <div>
                  <h4 className="text-lg font-bold">{chain.name}</h4>
                  <a
                    href={chain.explorer}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    View Explorer
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {chain.tokens.map((token, tokenIndex) => (
                <motion.div
                  key={token.symbol}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (chainIndex * 0.1) + (tokenIndex * 0.05) }}
                  className="bg-black/20 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center text-sm font-bold">
                        {token.symbol.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{token.symbol}</p>
                        <p className="text-xs text-slate-400">
                          {token.native ? 'Native' : 'Token'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">
                        {parseFloat(token.balance).toFixed(6)}
                      </p>
                      {token.contract && (
                        <a
                          href={`${chain.explorer}/token/${token.contract}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-slate-400 hover:text-white"
                        >
                          {token.contract.slice(0, 6)}...{token.contract.slice(-4)}
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 mt-4">
              <motion.button
                className="flex-1 py-2 bg-black/30 rounded-lg text-sm font-medium hover:bg-black/50 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Receive
              </motion.button>
              <motion.button
                className="flex-1 py-2 bg-black/30 rounded-lg text-sm font-medium hover:bg-black/50 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Send
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Token Contracts Info */}
      <div className="bg-slate-900/30 rounded-xl p-4 border border-slate-700/30">
        <h4 className="text-sm font-medium mb-3 text-slate-400">Token Contracts</h4>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center justify-between bg-black/20 rounded-lg p-3">
            <span className="text-slate-400">WATT (Polygon)</span>
            <code className="text-xs text-yellow-400">{chains.polygon.tokens.WATT}</code>
          </div>
          <div className="flex items-center justify-between bg-black/20 rounded-lg p-3">
            <span className="text-slate-400">tWATTx (WATTx)</span>
            <code className="text-xs text-emerald-400">{chains.wattx.tokens.tWATTx}</code>
          </div>
          <div className="flex items-center justify-between bg-black/20 rounded-lg p-3">
            <span className="text-slate-400">Bridge Vault (Polygon)</span>
            <code className="text-xs text-purple-400">{chains.polygon.bridge.vault}</code>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ChainBalances;
