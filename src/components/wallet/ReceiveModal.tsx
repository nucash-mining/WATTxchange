import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, QrCode, Plus, RefreshCw, Server } from 'lucide-react';
import { walletService, WalletAddress } from '../../services/walletService';
import { rpcNodeService } from '../../services/rpcNodeService';
import toast from 'react-hot-toast';

interface ReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  chainSymbol: string;
}

const ReceiveModal: React.FC<ReceiveModalProps> = ({ isOpen, onClose, chainSymbol }) => {
  const [addresses, setAddresses] = useState<WalletAddress[]>([]);
  const [currentAddress, setCurrentAddress] = useState<WalletAddress | null>(null);
  const [rpcAddress, setRpcAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatingRpcAddress, setGeneratingRpcAddress] = useState(false);

  const chainConfig = walletService.getChainConfig(chainSymbol);
  const isEVMChain = chainConfig !== null;
  const rpcNodes = rpcNodeService.getNodesBySymbol(chainSymbol);
  const connectedRpcNode = rpcNodes.find(node => node.isConnected);

  useEffect(() => {
    if (isOpen && chainSymbol) {
      if (isEVMChain) {
        loadEVMAddresses();
      } else {
        loadRPCAddress();
      }
    }
  }, [isOpen, chainSymbol, isEVMChain]);

  const loadEVMAddresses = () => {
    const allAddresses = walletService.getAllAddresses(chainSymbol);
    const current = walletService.getCurrentAddress(chainSymbol);
    setAddresses(allAddresses);
    setCurrentAddress(current);
  };

  const loadRPCAddress = async () => {
    if (!connectedRpcNode) {
      setRpcAddress(null);
      return;
    }

    try {
      const address = await rpcNodeService.getNewAddress(connectedRpcNode.id);
      setRpcAddress(address);
    } catch (error) {
      console.error('Failed to get RPC address:', error);
      setRpcAddress(null);
    }
  };

  const generateNewEVMAddress = async () => {
    setLoading(true);
    try {
      const newAddress = await walletService.generateNewAddress(chainSymbol);
      setCurrentAddress(newAddress);
      loadEVMAddresses();
      toast.success('New address generated!');
    } catch (error) {
      console.error('Failed to generate new address:', error);
      toast.error('Failed to generate new address');
    } finally {
      setLoading(false);
    }
  };

  const generateNewRPCAddress = async () => {
    if (!connectedRpcNode) return;

    setGeneratingRpcAddress(true);
    try {
      const address = await rpcNodeService.getNewAddress(connectedRpcNode.id);
      setRpcAddress(address);
      toast.success('New address generated!');
    } catch (error) {
      console.error('Failed to generate RPC address:', error);
      toast.error('Failed to generate new address');
    } finally {
      setGeneratingRpcAddress(false);
    }
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.success('Address copied to clipboard!');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          className="bg-slate-800/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 max-w-md w-full max-h-[90vh] overflow-y-auto"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
            <div>
              <h3 className="text-xl font-semibold">Receive {chainSymbol}</h3>
              <p className="text-slate-400 text-sm">
                {isEVMChain ? chainConfig?.name : `${chainSymbol} via RPC`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* EVM Chain Address */}
          {isEVMChain && currentAddress && (
            <div className="p-6 space-y-4">
              <div className="text-center">
                <div className="bg-white p-4 rounded-lg inline-block mb-4">
                  <img 
                    src={currentAddress.qrCode} 
                    alt="QR Code" 
                    className="w-48 h-48"
                  />
                </div>
                
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
                  <p className="text-slate-400 text-sm mb-2">Current Address</p>
                  <div className="flex items-center space-x-2">
                    <p className="font-mono text-sm flex-1 break-all">{currentAddress.address}</p>
                    <button
                      onClick={() => copyAddress(currentAddress.address)}
                      className="p-2 hover:bg-slate-700/50 rounded transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <motion.button
                onClick={generateNewEVMAddress}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-medium transition-colors disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                <span>{loading ? 'Generating...' : 'Generate New Address'}</span>
              </motion.button>
            </div>
          )}

          {/* RPC Chain Address */}
          {!isEVMChain && (
            <div className="p-6 space-y-4">
              {connectedRpcNode ? (
                <>
                  <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
                    <p className="text-slate-400 text-sm mb-2">RPC Node</p>
                    <p className="font-medium">{connectedRpcNode.name}</p>
                    <p className="text-xs text-slate-500">{connectedRpcNode.host}:{connectedRpcNode.port}</p>
                  </div>

                  {rpcAddress ? (
                    <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
                      <p className="text-slate-400 text-sm mb-2">Receive Address</p>
                      <div className="flex items-center space-x-2">
                        <p className="font-mono text-sm flex-1 break-all">{rpcAddress}</p>
                        <button
                          onClick={() => copyAddress(rpcAddress)}
                          className="p-2 hover:bg-slate-700/50 rounded transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-slate-400 mb-4">No address available</p>
                      <motion.button
                        onClick={generateNewRPCAddress}
                        disabled={generatingRpcAddress}
                        className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors disabled:opacity-50"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {generatingRpcAddress ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                        <span>{generatingRpcAddress ? 'Generating...' : 'Generate Address'}</span>
                      </motion.button>
                    </div>
                  )}

                  {rpcAddress && (
                    <motion.button
                      onClick={generateNewRPCAddress}
                      disabled={generatingRpcAddress}
                      className="w-full flex items-center justify-center space-x-2 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition-colors disabled:opacity-50"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {generatingRpcAddress ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      <span>{generatingRpcAddress ? 'Generating...' : 'Generate New Address'}</span>
                    </motion.button>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <Server className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-400 mb-2">No RPC node connected</p>
                  <p className="text-slate-500 text-sm">
                    Configure an RPC node for {chainSymbol} to receive addresses
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Address History for EVM chains */}
          {isEVMChain && addresses.length > 1 && (
            <div className="px-6 pb-6">
              <h4 className="font-semibold mb-3">Previous Addresses</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {addresses.slice(0, -1).reverse().map((addr, index) => (
                  <div
                    key={index}
                    className="bg-slate-900/30 rounded-lg p-3 border border-slate-700/30"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-mono text-xs text-slate-300 flex-1 truncate">
                        {addr.address}
                      </p>
                      <button
                        onClick={() => copyAddress(addr.address)}
                        className="p-1 hover:bg-slate-700/50 rounded transition-colors ml-2"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{addr.derivationPath}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Security Notice */}
          <div className="px-6 pb-6">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-blue-400 text-sm">
                <strong>Security:</strong> {isEVMChain 
                  ? `Each address is derived from your wallet's master key using the derivation path ${chainConfig?.derivationPath}. All addresses are valid for receiving ${chainSymbol}.`
                  : `Addresses are generated by your connected RPC node. Ensure your node is properly secured and backed up.`
                }
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ReceiveModal;