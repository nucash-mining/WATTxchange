import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Network, Clock, CheckCircle, AlertTriangle, ExternalLink, RefreshCw, Wallet } from 'lucide-react';
import { axelarService, CrossChainTransfer } from '../../services/axelarService';
// import { tokenService } from '../../services/tokenService';
import { useWallet } from '../../hooks/useWallet';
import toast from 'react-hot-toast';

const AxelarBridgeInterface: React.FC = () => {
  const { isConnected, address, connectWallet } = useWallet();
  const [sourceChain, setSourceChain] = useState('ethereum');
  const [destinationChain, setDestinationChain] = useState('altcoinchain');
  const [selectedToken, setSelectedToken] = useState('USDT');
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [transferFee, setTransferFee] = useState({ fee: '0', gasLimit: '0' });
  const [loading, setLoading] = useState(false);
  const [recentTransfers, setRecentTransfers] = useState<CrossChainTransfer[]>([]);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [networkStatus, setNetworkStatus] = useState({ connected: false, blockHeight: 0, validators: 0 });
  const [supportedChains, setSupportedChains] = useState<any[]>([]);
  const availableTokens = [
    { symbol: 'USDT', name: 'Tether USD', logo: '/USDT logo.png' },
    { symbol: 'USDC', name: 'USD Coin', logo: '/USDC logo.png' },
    { symbol: 'WBTC', name: 'Wrapped Bitcoin', logo: '/BTC logo.png' },
    { symbol: 'DAI', name: 'Dai Stablecoin', logo: '/DAI logo.png' },
  ];

  useEffect(() => {
    loadNetworkStatus();
    loadRecentTransfers();
    loadSupportedChains();
    
    const interval = setInterval(() => {
      loadNetworkStatus();
      loadRecentTransfers();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isConnected && address) {
      setRecipient(address);
    }
  }, [isConnected, address]);

  useEffect(() => {
    if (amount && sourceChain && destinationChain && selectedToken) {
      updateTransferFee();
    }
  }, [amount, sourceChain, destinationChain, selectedToken]);

  const loadSupportedChains = () => {
    const networks = axelarService.getAllNetworks();
    const chains = networks.map(network => ({
      id: Object.keys(axelarService['supportedNetworks']).find(
        key => axelarService['supportedNetworks'][key].name === network.name
      ) || network.name.toLowerCase(),
      name: network.name,
      logo: network.icon || `/placeholder-chain.png`
    }));
    setSupportedChains(chains);
  };

  const loadNetworkStatus = async () => {
    setLoadingStatus(true);
    try {
      const status = await axelarService.getNetworkStatus();
      setNetworkStatus(status);
    } catch (error) {
      console.error('Failed to load network status:', error);
    } finally {
      setLoadingStatus(false);
    }
  };

  const loadRecentTransfers = async () => {
    try {
      const transfers = await axelarService.getRecentTransfers(5);
      setRecentTransfers(transfers);
    } catch (error) {
      console.error('Failed to load recent transfers:', error);
    }
  };

  const updateTransferFee = async () => {
    try {
      if (!amount) return;
      
      const fee = await axelarService.getTransferFee(sourceChain, destinationChain, selectedToken, amount);
      setTransferFee(fee);
    } catch (error) {
      console.error('Failed to get transfer fee:', error);
    }
  };

  const handleSwapChains = () => {
    const temp = sourceChain;
    setSourceChain(destinationChain);
    setDestinationChain(temp);
  };

  const handleTransfer = async () => {
    if (!isConnected) {
      connectWallet();
      return;
    }

    if (!amount || !recipient) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!axelarService.isRouteSupported(sourceChain, destinationChain)) {
      toast.error('This route is not supported');
      return;
    }

    setLoading(true);
    try {
      await axelarService.initiateTransfer(
        sourceChain,
        destinationChain,
        selectedToken,
        amount,
        recipient
      );

      toast.success('Cross-chain transfer initiated!');
      setAmount('');
      loadRecentTransfers();
    } catch (error) {
      console.error('Transfer failed:', error);
      toast.error('Transfer failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'executed':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'confirmed':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'failed':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-blue-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'executed':
        return 'text-emerald-400';
      case 'confirmed':
        return 'text-yellow-400';
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-blue-400';
    }
  };

  const getChainIcon = (chainId: string) => {
    const chain = supportedChains.find(c => c.id === chainId);
    if (chain) {
      return <img src={chain.logo} alt={chain.name} className="w-5 h-5 rounded-full" />;
    }
    return <div className="w-5 h-5 bg-slate-600 rounded-full flex items-center justify-center text-xs">{chainId.charAt(0).toUpperCase()}</div>;
  };

  return (
    <div className="space-y-6">
      {/* Axelar Network Status */}
      <motion.div
        className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/30 rounded-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Network className="w-6 h-6 text-blue-400" />
            <div>
              <h3 className="text-lg font-semibold">Axelar Network</h3>
              <p className="text-slate-400 text-sm">Interchain messaging protocol</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {loadingStatus ? (
              <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
            ) : (
              <>
                <div className={`w-2 h-2 rounded-full ${networkStatus.connected ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
                <span className="text-sm">{networkStatus.connected ? 'Connected' : 'Disconnected'}</span>
              </>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-400">{networkStatus.blockHeight.toLocaleString()}</p>
            <p className="text-slate-400 text-sm">Block Height</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-400">{networkStatus.validators}</p>
            <p className="text-slate-400 text-sm">Active Validators</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-400">{supportedChains.length}</p>
            <p className="text-slate-400 text-sm">Connected Chains</p>
          </div>
        </div>
      </motion.div>

      {/* Bridge Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transfer Form */}
        <motion.div
          className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h3 className="text-xl font-semibold mb-6">Cross-Chain Transfer</h3>

          {/* Chain Selection */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">From</label>
              <select
                value={sourceChain}
                onChange={(e) => setSourceChain(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500/50"
              >
                {supportedChains.map(chain => (
                  <option key={chain.id} value={chain.id}>{chain.name}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-center">
              <motion.button
                onClick={handleSwapChains}
                className="p-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-full transition-colors"
                whileHover={{ scale: 1.1, rotate: 180 }}
                whileTap={{ scale: 0.9 }}
              >
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">To</label>
              <select
                value={destinationChain}
                onChange={(e) => setDestinationChain(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500/50"
              >
                {supportedChains.filter(chain => chain.id !== sourceChain).map(chain => (
                  <option key={chain.id} value={chain.id}>{chain.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Token Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Token</label>
            <div className="relative">
              <select
                value={selectedToken}
                onChange={(e) => setSelectedToken(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 pl-10 focus:outline-none focus:border-blue-500/50 appearance-none"
              >
                {availableTokens.map(token => (
                  <option key={token.symbol} value={token.symbol}>{token.symbol} - {token.name}</option>
                ))}
              </select>
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <img 
                  src={availableTokens.find(t => t.symbol === selectedToken)?.logo || '/placeholder-token.png'} 
                  alt={selectedToken} 
                  className="w-5 h-5 rounded-full"
                />
              </div>
            </div>
          </div>

          {/* Amount */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-3 focus:outline-none focus:border-blue-500/50"
            />
          </div>

          {/* Recipient */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Recipient Address</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x..."
              className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-3 focus:outline-none focus:border-blue-500/50"
            />
          </div>

          {/* Transfer Details */}
          {amount && (
            <div className="bg-slate-900/50 rounded-lg p-4 mb-6 border border-slate-700/30">
              <h4 className="font-medium mb-3">Transfer Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Amount:</span>
                  <span>{amount} {selectedToken}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Bridge Fee:</span>
                  <span>{transferFee.fee} {selectedToken}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Gas Limit:</span>
                  <span>{transferFee.gasLimit}</span>
                </div>
                <div className="flex justify-between font-medium pt-2 border-t border-slate-700/30">
                  <span>You'll receive:</span>
                  <span>{(parseFloat(amount || '0') - parseFloat(transferFee.fee)).toFixed(6)} {selectedToken}</span>
                </div>
              </div>
            </div>
          )}

          {/* Transfer Button */}
          <motion.button
            onClick={handleTransfer}
            disabled={loading || !amount || !recipient || !networkStatus.connected}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors disabled:opacity-50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {!isConnected ? (
              <span className="flex items-center justify-center space-x-2">
                <Wallet className="w-5 h-5" />
                <span>Connect Wallet</span>
              </span>
            ) : loading ? (
              <span className="flex items-center justify-center space-x-2">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Initiating Transfer...</span>
              </span>
            ) : (
              'Transfer'
            )}
          </motion.button>
        </motion.div>

        {/* Recent Transfers */}
        <motion.div
          className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">Recent Transfers</h3>
            <button 
              onClick={loadRecentTransfers}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {recentTransfers.length === 0 ? (
            <div className="text-center py-8">
              <Network className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-400">No recent transfers</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentTransfers.map((transfer, index) => (
                <motion.div
                  key={transfer.id}
                  className="bg-slate-900/30 rounded-lg p-4 border border-slate-700/30"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(transfer.status)}
                      <span className={`text-sm font-medium capitalize ${getStatusColor(transfer.status)}`}>
                        {transfer.status}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {transfer.timestamp.toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getChainIcon(transfer.sourceChain)}
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      {getChainIcon(transfer.destinationChain)}
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{transfer.amount} {transfer.sourceToken}</p>
                      <p className="text-xs text-slate-400 truncate max-w-24">
                        {transfer.recipient.substring(0, 6)}...{transfer.recipient.substring(transfer.recipient.length - 4)}
                      </p>
                    </div>
                  </div>

                  {transfer.txHash && (
                    <div className="mt-2 pt-2 border-t border-slate-700/30">
                      <button className="flex items-center space-x-1 text-xs text-blue-400 hover:text-blue-300">
                        <ExternalLink className="w-3 h-3" />
                        <span>View Transaction</span>
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Supported Routes */}
      <motion.div
        className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-xl font-semibold mb-4">Supported Routes</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {supportedChains.map((sourceChain) => (
            supportedChains
              .filter(destChain => destChain.id !== sourceChain.id)
              .map((destChain) => (
                <div
                  key={`${sourceChain.id}-${destChain.id}`}
                  className="bg-slate-900/30 rounded-lg p-4 border border-slate-700/30"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <img src={sourceChain.logo} alt={sourceChain.name} className="w-5 h-5 rounded-full" />
                      <span className="text-sm">{sourceChain.name}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                    <div className="flex items-center space-x-2">
                      <img src={destChain.logo} alt={destChain.name} className="w-5 h-5 rounded-full" />
                      <span className="text-sm">{destChain.name}</span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-slate-400">
                    Fee: ~0.1% | Time: 2-5 min
                  </div>
                </div>
              ))
          ))}
        </div>
      </motion.div>

      {/* Axelar Info */}
      <motion.div
        className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/30 rounded-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-blue-600/20 rounded-lg">
            <Network className="w-6 h-6 text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-400 mb-2">Powered by Axelar Network</h3>
            <p className="text-slate-300 mb-3">
              Axelar delivers secure cross-chain communication for Web3. Axelar consists of a decentralized network, 
              a suite of protocols and APIs, and the Axelar Virtual Machine (AVM), which enables developers to build 
              on top of its platform.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-400 mb-2">Secure Transfers</h4>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>• Decentralized validator network</li>
                  <li>• Cryptographic proof verification</li>
                  <li>• Multi-party computation</li>
                  <li>• Threshold signatures</li>
                </ul>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-purple-400 mb-2">Supported Assets</h4>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>• USDC, USDT, DAI</li>
                  <li>• WETH, WBTC</li>
                  <li>• WATT Token</li>
                  <li>• And many more...</li>
                </ul>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-emerald-400 mb-2">Fast & Reliable</h4>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>• 2-5 minute transfers</li>
                  <li>• 99.9% uptime</li>
                  <li>• Low fees</li>
                  <li>• Transparent tracking</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <a 
                href="https://axelar.network/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-blue-400 hover:text-blue-300"
              >
                <span>Learn more about Axelar</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AxelarBridgeInterface;