import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Server, Wifi, WifiOff, Activity, DollarSign, Hash, Clock, Users, CheckCircle, AlertCircle, Play, Square, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { realRPCNodeService, NodeStatus, WalletInfo, MiningInfo } from '../../services/realRPCNodeService';

interface RealNodeConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  chain: string;
}

const RealNodeConnectionModal: React.FC<RealNodeConnectionModalProps> = ({ isOpen, onClose, chain }) => {
  const [rpcUrl, setRpcUrl] = useState('');
  const [rpcUsername, setRpcUsername] = useState('');
  const [rpcPassword, setRpcPassword] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [nodeStatus, setNodeStatus] = useState<NodeStatus | null>(null);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [miningInfo, setMiningInfo] = useState<MiningInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newAddress, setNewAddress] = useState('');
  const [sendToAddress, setSendToAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [isMining, setIsMining] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Load default RPC settings for the chain
      const defaults = realRPCNodeService.getDefaultRPCSettings(chain);
      setRpcUrl(defaults.url);
      setRpcUsername(defaults.username);
      setRpcPassword(defaults.password);
    }
  }, [isOpen, chain]);

  const connectToNode = async () => {
    if (!rpcUrl) {
      toast.error('Please enter RPC URL');
      return;
    }
    
    // For Monero, username and password can be empty
    if (chain.toLowerCase() !== 'monero' && (!rpcUsername || !rpcPassword)) {
      toast.error('Please fill in RPC username and password');
      return;
    }

    setIsConnecting(true);
    try {
      const success = await realRPCNodeService.connectToNode(chain, rpcUrl, rpcUsername, rpcPassword);
      
      if (success) {
        setIsConnected(true);
        toast.success(`Connected to ${chain} node successfully!`);
        await refreshNodeData();
      } else {
        toast.error(`Failed to connect to ${chain} node`);
      }
    } catch (error) {
      toast.error(`Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const refreshNodeData = async () => {
    if (!isConnected) return;

    setIsLoading(true);
    try {
      const [status, wallet, mining] = await Promise.all([
        realRPCNodeService.getNodeStatus(chain),
        realRPCNodeService.getWalletInfo(chain),
        realRPCNodeService.getMiningInfo(chain)
      ]);

      setNodeStatus(status);
      setWalletInfo(wallet);
      setMiningInfo(mining);
    } catch (error) {
      console.error('Error refreshing node data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewAddress = async () => {
    try {
      const address = await realRPCNodeService.createNewAddress(chain, 'WATTxchange');
      if (address) {
        setNewAddress(address);
        toast.success('New address created successfully!');
        await refreshNodeData();
      } else {
        toast.error('Failed to create new address');
      }
    } catch (error) {
      toast.error(`Error creating address: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const sendCoins = async () => {
    if (!sendToAddress || !sendAmount) {
      toast.error('Please enter recipient address and amount');
      return;
    }

    try {
      const txid = await realRPCNodeService.sendCoins(chain, sendToAddress, parseFloat(sendAmount), 'WATTxchange transfer');
      if (txid) {
        toast.success(`Transaction sent successfully! TXID: ${txid}`);
        setSendToAddress('');
        setSendAmount('');
        await refreshNodeData();
      } else {
        toast.error('Failed to send transaction');
      }
    } catch (error) {
      toast.error(`Error sending coins: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const startMining = async () => {
    try {
      const success = await realRPCNodeService.startMining(chain, walletInfo?.addresses[0] || '', 1);
      if (success) {
        setIsMining(true);
        toast.success('Mining started successfully!');
        await refreshNodeData();
      } else {
        toast.error('Failed to start mining');
      }
    } catch (error) {
      toast.error(`Error starting mining: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const stopMining = async () => {
    try {
      const success = await realRPCNodeService.stopMining(chain);
      if (success) {
        setIsMining(false);
        toast.success('Mining stopped successfully!');
        await refreshNodeData();
      } else {
        toast.error('Failed to stop mining');
      }
    } catch (error) {
      toast.error(`Error stopping mining: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-gray-900/95 backdrop-blur-sm border border-gray-700/50 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Server className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Real {chain.toUpperCase()} Node Connection</h2>
                <p className="text-sm text-gray-400">Connect to actual blockchain node via RPC</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[70vh]">
            {!isConnected ? (
              /* Connection Form */
              <div className="space-y-6">
                <div className="bg-gray-800/50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">RPC Connection Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">RPC URL</label>
                      <input
                        type="text"
                        value={rpcUrl}
                        onChange={(e) => setRpcUrl(e.target.value)}
                        placeholder="http://localhost:8332"
                        className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">RPC Username</label>
                      <input
                        type="text"
                        value={rpcUsername}
                        onChange={(e) => setRpcUsername(e.target.value)}
                        placeholder={chain.toLowerCase() === 'monero' ? "Leave empty for Monero" : "rpcuser"}
                        className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm text-gray-400 mb-2">RPC Password</label>
                      <input
                        type="password"
                        value={rpcPassword}
                        onChange={(e) => setRpcPassword(e.target.value)}
                        placeholder={chain.toLowerCase() === 'monero' ? "Leave empty for Monero" : "rpcpassword"}
                        className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <button
                      onClick={connectToNode}
                      disabled={isConnecting}
                      className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
                    >
                      {isConnecting ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          <span>Connecting...</span>
                        </>
                      ) : (
                        <>
                          <Wifi className="w-5 h-5" />
                          <span>Connect to Node</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Instructions */}
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <h4 className="text-yellow-400 font-semibold mb-2">Setup Instructions:</h4>
                  <div className="text-sm text-gray-300 space-y-2">
                    <p>1. Install and run a {chain} node on your system</p>
                    <p>2. Enable RPC in the node configuration file</p>
                    {chain.toLowerCase() === 'monero' ? (
                      <>
                        <p>3. For Monero: RPC is enabled by default, no username/password needed</p>
                        <p>4. Start monerod with: <code className="bg-gray-800 px-1 rounded">--rpc-bind-ip=127.0.0.1 --rpc-bind-port=18081</code></p>
                      </>
                    ) : (
                      <>
                        <p>3. Set rpcuser and rpcpassword in the config</p>
                        <p>4. Restart the node and enter the connection details above</p>
                      </>
                    )}
                    <p>5. Click "Connect to Node" to establish RPC connection</p>
                  </div>
                </div>
              </div>
            ) : (
              /* Connected Interface */
              <div className="space-y-6">
                {/* Connection Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-green-400 font-semibold">Connected to {chain.toUpperCase()} Node</span>
                  </div>
                  <button
                    onClick={refreshNodeData}
                    disabled={isLoading}
                    className="flex items-center space-x-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>

                {/* Node Status */}
                {nodeStatus && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Activity className="w-4 h-4 text-blue-400" />
                        <span className="text-sm text-gray-400">Block Height</span>
                      </div>
                      <p className="text-xl font-bold text-white">{nodeStatus.blockHeight.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Hash className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-gray-400">Difficulty</span>
                      </div>
                      <p className="text-xl font-bold text-white">{nodeStatus.difficulty.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Users className="w-4 h-4 text-purple-400" />
                        <span className="text-sm text-gray-400">Peers</span>
                      </div>
                      <p className="text-xl font-bold text-white">{nodeStatus.peers}</p>
                    </div>
                  </div>
                )}

                {/* Wallet Information */}
                {walletInfo && (
                  <div className="bg-gray-800/50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Wallet Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <span className="text-gray-400">Balance:</span>
                        <span className="text-white ml-2 font-semibold">{walletInfo.balance} {chain.toUpperCase()}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Addresses:</span>
                        <span className="text-white ml-2">{walletInfo.addresses.length}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <button
                          onClick={createNewAddress}
                          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          Create New Address
                        </button>
                        {newAddress && (
                          <div className="mt-2 p-3 bg-gray-700/50 rounded-lg">
                            <p className="text-sm text-gray-400">New Address:</p>
                            <p className="text-white font-mono text-sm break-all">{newAddress}</p>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Send To Address</label>
                          <input
                            type="text"
                            value={sendToAddress}
                            onChange={(e) => setSendToAddress(e.target.value)}
                            placeholder="Enter recipient address"
                            className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Amount</label>
                          <input
                            type="number"
                            value={sendAmount}
                            onChange={(e) => setSendAmount(e.target.value)}
                            placeholder="0.0"
                            step="0.00000001"
                            className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                          />
                        </div>
                      </div>
                      <button
                        onClick={sendCoins}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        Send Coins
                      </button>
                    </div>
                  </div>
                )}

                {/* Mining Controls */}
                {miningInfo && (
                  <div className="bg-gray-800/50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Mining Controls</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <span className="text-gray-400">Network Hashrate:</span>
                        <span className="text-white ml-2">{(miningInfo.networkhashps / 1e9).toFixed(2)} GH/s</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Pooled Transactions:</span>
                        <span className="text-white ml-2">{miningInfo.pooledtx}</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-4">
                      {!isMining ? (
                        <button
                          onClick={startMining}
                          className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
                        >
                          <Play className="w-4 h-4" />
                          <span>Start Mining</span>
                        </button>
                      ) : (
                        <button
                          onClick={stopMining}
                          className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
                        >
                          <Square className="w-4 h-4" />
                          <span>Stop Mining</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default RealNodeConnectionModal;
