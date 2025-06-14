import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpDown, Settings, Info } from 'lucide-react';
import { swapinService, SwapinNetwork } from '../../services/swapinService';
import { useWallet } from '../../hooks/useWallet';
import NetworkSelector from './NetworkSelector';
import toast from 'react-hot-toast';

const SwapInterface: React.FC = () => {
  const { isConnected, chainId } = useWallet();
  const [selectedNetwork, setSelectedNetwork] = useState<SwapinNetwork | null>(null);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [fromToken, setFromToken] = useState('ETH');
  const [toToken, setToToken] = useState('USDT');
  const [slippage, setSlippage] = useState('0.5');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (chainId) {
      const network = swapinService.getNetwork(chainId);
      if (network) {
        setSelectedNetwork(network);
        setFromToken(network.nativeCurrency.symbol);
      }
    }
  }, [chainId]);

  const handleSwapTokens = () => {
    const tempToken = fromToken;
    const tempAmount = fromAmount;
    setFromToken(toToken);
    setToToken(tempToken);
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  };

  const handleSwap = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!selectedNetwork) {
      toast.error('Please select a network');
      return;
    }

    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    // Check if user is on the correct network
    if (chainId !== selectedNetwork.chainId) {
      const switched = await swapinService.switchToNetwork(selectedNetwork.chainId);
      if (!switched) {
        toast.error('Please switch to the correct network');
        return;
      }
    }

    toast.success('Swap initiated! (Demo mode)');
  };

  const getTokenOptions = () => {
    if (!selectedNetwork) return ['ETH', 'USDT'];
    
    const baseTokens = [
      selectedNetwork.nativeCurrency.symbol,
      `w${selectedNetwork.nativeCurrency.symbol}`,
      'USDT',
      'USDC'
    ];

    // Add network-specific tokens
    if (selectedNetwork.name === 'PlanQ') {
      baseTokens.push('SWAPD');
    }

    return baseTokens;
  };

  return (
    <div className="space-y-6">
      {/* Network Selection */}
      <div className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50 relative z-30">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Select Network</h3>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">Powered by Swapin.co</span>
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
          </div>
        </div>
        
        <NetworkSelector
          selectedNetwork={selectedNetwork}
          onNetworkChange={setSelectedNetwork}
          currentChainId={chainId}
        />

        {selectedNetwork && (
          <div className="mt-4 p-3 bg-slate-900/50 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-400">Router Contract</p>
                <p className="font-mono text-xs">{selectedNetwork.contracts.router}</p>
              </div>
              <div>
                <p className="text-slate-400">Factory Contract</p>
                <p className="font-mono text-xs">{selectedNetwork.contracts.factory}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Swap Interface */}
      <div className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50 relative z-20">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Swap Tokens</h3>
          <motion.button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Settings className="w-4 h-4" />
          </motion.button>
        </div>

        {showSettings && (
          <motion.div
            className="mb-6 p-4 bg-slate-900/50 rounded-lg border border-slate-700/30"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
          >
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Slippage Tolerance</label>
                <div className="flex space-x-2">
                  {['0.1', '0.5', '1.0'].map((value) => (
                    <button
                      key={value}
                      onClick={() => setSlippage(value)}
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        slippage === value
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 hover:bg-slate-600'
                      }`}
                    >
                      {value}%
                    </button>
                  ))}
                  <input
                    type="number"
                    value={slippage}
                    onChange={(e) => setSlippage(e.target.value)}
                    className="px-2 py-1 bg-slate-700 rounded text-sm w-16"
                    step="0.1"
                    min="0.1"
                    max="50"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="space-y-4">
          {/* From Token */}
          <div className="bg-slate-900/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">From</span>
              <span className="text-sm text-slate-400">Balance: 0.00</span>
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                placeholder="0.0"
                className="flex-1 bg-transparent text-2xl font-bold outline-none"
              />
              <select
                value={fromToken}
                onChange={(e) => setFromToken(e.target.value)}
                className="bg-slate-800 rounded px-3 py-2 outline-none"
              >
                {getTokenOptions().map(token => (
                  <option key={token} value={token}>{token}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <motion.button
              onClick={handleSwapTokens}
              className="p-3 bg-slate-700/50 hover:bg-slate-600/50 rounded-full transition-colors"
              whileHover={{ scale: 1.1, rotate: 180 }}
              whileTap={{ scale: 0.9 }}
            >
              <ArrowUpDown className="w-5 h-5" />
            </motion.button>
          </div>

          {/* To Token */}
          <div className="bg-slate-900/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">To</span>
              <span className="text-sm text-slate-400">Balance: 0.00</span>
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                value={toAmount}
                onChange={(e) => setToAmount(e.target.value)}
                placeholder="0.0"
                className="flex-1 bg-transparent text-2xl font-bold outline-none"
              />
              <select
                value={toToken}
                onChange={(e) => setToToken(e.target.value)}
                className="bg-slate-800 rounded px-3 py-2 outline-none"
              >
                {getTokenOptions().map(token => (
                  <option key={token} value={token}>{token}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Swap Details */}
          {fromAmount && toAmount && (
            <div className="bg-slate-900/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Rate</span>
                <span>1 {fromToken} = 1.00 {toToken}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Slippage</span>
                <span>{slippage}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Network Fee</span>
                <span>~$0.50</span>
              </div>
            </div>
          )}

          {/* Swap Button */}
          <motion.button
            onClick={handleSwap}
            disabled={!selectedNetwork || !isConnected}
            className={`w-full py-4 rounded-lg font-semibold transition-colors ${
              selectedNetwork && isConnected
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
            }`}
            whileHover={selectedNetwork && isConnected ? { scale: 1.02 } : {}}
            whileTap={selectedNetwork && isConnected ? { scale: 0.98 } : {}}
          >
            {!isConnected ? 'Connect Wallet' : 
             !selectedNetwork ? 'Select Network' : 
             'Swap Tokens'}
          </motion.button>
        </div>
      </div>

      {/* Network Info */}
      {selectedNetwork && (
        <motion.div
          className="bg-blue-600/10 border border-blue-500/30 rounded-xl p-4 relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <p className="font-medium text-blue-400">Multi-Chain DEX</p>
              <p className="text-sm text-slate-300 mt-1">
                You're trading on {selectedNetwork.name} using Swapin.co's Uniswap V2 compatible contracts. 
                All trades are executed on-chain with full decentralization.
              </p>
              <div className="mt-2 text-xs text-slate-400">
                <p>• Factory: {selectedNetwork.contracts.factory}</p>
                <p>• Router: {selectedNetwork.contracts.router}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default SwapInterface;