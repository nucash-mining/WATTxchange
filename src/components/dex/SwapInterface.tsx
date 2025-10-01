import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpDown, Settings, Info, AlertTriangle, ArrowRight } from 'lucide-react';
import { swapinService, SwapinNetwork } from '../../services/swapinService';
import { useWallet } from '../../hooks/useWallet';
import { useDeviceDetect } from '../../hooks/useDeviceDetect';
import NetworkSelector from './NetworkSelector';
import TokenSelector from './TokenSelector';
import toast from 'react-hot-toast';

const SwapInterface: React.FC = () => {
  const { isConnected, address, chainId, signTransaction, connectWallet } = useWallet();
  const { isMobile } = useDeviceDetect();
  const [selectedNetwork, setSelectedNetwork] = useState<SwapinNetwork | null>(null);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [fromToken, setFromToken] = useState('ALT');
  const [toToken, setToToken] = useState('WATT');
  const [slippage, setSlippage] = useState('0.5');
  const [showSettings, setShowSettings] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);

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
      connectWallet();
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

    setIsSwapping(true);

    try {
      // Request permission to sign the transaction
      const transactionDetails = {
        type: 'swap',
        fromToken,
        toToken,
        fromAmount,
        toAmount,
        slippage,
        network: selectedNetwork.name
      };

      const signed = await signTransaction(transactionDetails);
      
      if (signed) {
        toast.success('Swap completed successfully!');
        // Reset form
        setFromAmount('');
        setToAmount('');
      } else {
        toast.error('Swap cancelled or failed');
      }
    } catch (error) {
      console.error('Swap failed:', error);
      toast.error('Swap failed. Please try again.');
    } finally {
      setIsSwapping(false);
    }
  };

  useEffect(() => {
    if (fromAmount && fromToken && toToken) {
      // Calculate the output amount based on the input
      const rate = fromToken === 'ALT' && toToken === 'WATT' ? 1.5 : 
                  fromToken === 'WATT' && toToken === 'ALT' ? 0.67 : 
                  fromToken === 'ALT' && toToken === 'AltPEPE' ? 0.5 :
                  fromToken === 'AltPEPE' && toToken === 'ALT' ? 2.0 :
                  fromToken === 'ALT' && toToken === 'AltPEPI' ? 0.667 :
                  fromToken === 'AltPEPI' && toToken === 'ALT' ? 1.5 :
                  fromToken === 'ALT' && toToken === 'SCAM' ? 0.25 :
                  fromToken === 'SCAM' && toToken === 'ALT' ? 4.0 :
                  fromToken === 'ALT' && toToken === 'SWAPD' ? 0.75 :
                  fromToken === 'SWAPD' && toToken === 'ALT' ? 1.333 :
                  fromToken === 'ALT' && toToken === 'MALT' ? 0.8 :
                  fromToken === 'MALT' && toToken === 'ALT' ? 1.25 :
                  fromToken === 'AltPEPE' && toToken === 'WATT' ? 1.5 :
                  fromToken === 'WATT' && toToken === 'AltPEPE' ? 0.667 : 1;
      
      const calculatedAmount = parseFloat(fromAmount) * rate;
      if (!isNaN(calculatedAmount)) {
        setToAmount(calculatedAmount.toFixed(6));
      }
    }
  }, [fromAmount, fromToken, toToken]);

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

      {/* Wallet Connection Notice */}
      {!isConnected && (
        <motion.div
          className="bg-yellow-600/20 border border-yellow-500/30 rounded-xl p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              <p className="text-yellow-400">
                Connect your wallet to access all DEX features
              </p>
            </div>
            <motion.button
              onClick={connectWallet}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Connect Wallet
            </motion.button>
          </div>
        </motion.div>
      )}

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
                <label className="block text-sm font-medium mb-2">Slippage Tolerance</label>
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
              
              <div>
                <label className="block text-sm font-medium mb-2">Transaction Deadline</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    defaultValue="30"
                    className="px-2 py-1 bg-slate-700 rounded text-sm w-16"
                    min="1"
                  />
                  <span className="text-sm text-slate-400">minutes</span>
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
              
              <TokenSelector
                selectedToken={fromToken}
                onSelectToken={setFromToken}
                excludeToken={toToken}
                chainId={selectedNetwork?.chainId || 2330}
              />
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <motion.button
              onClick={handleSwapTokens}
              className="p-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowUpDown className="w-4 h-4" />
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
                readOnly
                placeholder="0.0"
                className="flex-1 bg-transparent text-2xl font-bold outline-none"
              />
              
              <TokenSelector
                selectedToken={toToken}
                onSelectToken={setToToken}
                excludeToken={fromToken}
                chainId={selectedNetwork?.chainId || 2330}
              />
            </div>
          </div>
        </div>

        {/* Swap Details */}
        {fromAmount && toAmount && (
          <motion.div
            className="mt-4 p-3 bg-slate-900/50 rounded-lg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Rate</span>
                <span>1 {fromToken} = {(parseFloat(toAmount) / parseFloat(fromAmount)).toFixed(6)} {toToken}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Slippage Tolerance</span>
                <span>{slippage}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Minimum Received</span>
                <span>{(parseFloat(toAmount) * (1 - parseFloat(slippage) / 100)).toFixed(6)} {toToken}</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Swap Button */}
        <motion.button
          onClick={handleSwap}
          disabled={!isConnected || !fromAmount || !toAmount || isSwapping}
          className={`w-full mt-6 py-4 rounded-xl font-semibold transition-all ${
            !isConnected || !fromAmount || !toAmount || isSwapping
              ? 'bg-slate-700/50 text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
          }`}
          whileHover={!isConnected || !fromAmount || !toAmount || isSwapping ? {} : { scale: 1.02 }}
          whileTap={!isConnected || !fromAmount || !toAmount || isSwapping ? {} : { scale: 0.98 }}
        >
          {isSwapping ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Swapping...</span>
            </div>
          ) : !isConnected ? (
            'Connect Wallet'
          ) : !fromAmount || !toAmount ? (
            'Enter Amount'
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <span>Swap</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          )}
        </motion.button>
      </div>
    </div>
  );
};

export default SwapInterface;