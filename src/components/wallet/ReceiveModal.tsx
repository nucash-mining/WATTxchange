import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, QrCode, Plus, RefreshCw, Server, ChevronDown, Check } from 'lucide-react';
import { walletService, WalletAddress } from '../../services/walletService';
import { rpcNodeService } from '../../services/rpcNodeService';
import { generateQRCode } from '../../utils/qrCodeGenerator';
import { tokenService } from '../../services/tokenService';
import { useDeviceDetect } from '../../hooks/useDeviceDetect';
import toast from 'react-hot-toast';

interface ReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  chainSymbol: string;
}

interface Token {
  symbol: string;
  name: string;
  address?: string;
  decimals: number;
  logo: string;
  isNative: boolean;
}

const ReceiveModal: React.FC<ReceiveModalProps> = ({ isOpen, onClose, chainSymbol }) => {
  const [addresses, setAddresses] = useState<WalletAddress[]>([]);
  const [currentAddress, setCurrentAddress] = useState<WalletAddress | null>(null);
  const [rpcAddress, setRpcAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatingRpcAddress, setGeneratingRpcAddress] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [showTokenSelector, setShowTokenSelector] = useState(false);
  const [customTokenAddress, setCustomTokenAddress] = useState('');
  const [showAddToken, setShowAddToken] = useState(false);
  const [copied, setCopied] = useState(false);
  const { isMobile } = useDeviceDetect();

  const chainConfig = walletService.getChainConfig(chainSymbol);
  const isEVMChain = chainConfig !== null;
  const rpcNodes = rpcNodeService.getNodesBySymbol(chainSymbol);
  const connectedRpcNode = rpcNodes.find(node => node.isConnected);

  // Get available tokens for the chain
  const availableTokens = tokenService.getTokensForChain(chainSymbol);

  useEffect(() => {
    if (isOpen && chainSymbol) {
      // Set default token (native token)
      const nativeToken = availableTokens.find(t => t.isNative);
      setSelectedToken(nativeToken || null);

      if (isEVMChain) {
        loadEVMAddresses();
      } else {
        loadRPCAddress();
      }
    }
  }, [isOpen, chainSymbol, isEVMChain]);

  useEffect(() => {
    if (currentAddress?.address || rpcAddress) {
      generateQRCodeForAddress();
    }
  }, [currentAddress, rpcAddress, selectedToken]);

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

  const generateQRCodeForAddress = async () => {
    const address = currentAddress?.address || rpcAddress;
    if (!address) return;

    try {
      let qrData = address;
      
      // For EVM chains with tokens, include token info in QR code
      if (isEVMChain && selectedToken && !selectedToken.isNative) {
        qrData = `ethereum:${selectedToken.address}@${chainConfig?.chainId}/transfer?address=${address}&uint256=0`;
      } else if (isEVMChain) {
        qrData = `ethereum:${address}`;
      }

      const qrCodeUrl = await generateQRCode(qrData);
      setQrCodeDataUrl(qrCodeUrl);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Address copied to clipboard');
    
    setTimeout(() => {
      setCopied(false);
    }, 3000);
  };

  const handleTokenChange = (tokenSymbol: string) => {
    const token = availableTokens.find(t => t.symbol === tokenSymbol);
    if (token) {
      setSelectedToken(token);
      generateQRCodeForAddress();
    }
  };

  const addCustomToken = async () => {
    if (!customTokenAddress.trim()) {
      toast.error('Please enter a token contract address');
      return;
    }

    try {
      const success = await tokenService.addCustomToken(chainSymbol, customTokenAddress);
      if (success) {
        toast.success('Token added successfully!');
        setCustomTokenAddress('');
        setShowAddToken(false);
      } else {
        toast.error('Failed to add token');
      }
    } catch (error) {
      console.error('Failed to add custom token:', error);
      toast.error('Failed to add token');
    }
  };

  if (!isOpen) return null;

  const displayAddress = currentAddress?.address || rpcAddress;

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
              <h3 className="text-xl font-semibold">Receive {selectedToken?.symbol || chainSymbol}</h3>
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

          {/* Token Selector for EVM chains */}
          {isEVMChain && availableTokens.length > 1 && (
            <div className="p-6 border-b border-slate-700/50">
              <label className="block text-sm font-medium mb-2">Select Token</label>
              <div className="relative">
                <button
                  onClick={() => setShowTokenSelector(!showTokenSelector)}
                  className="w-full flex items-center justify-between p-3 bg-slate-900/50 border border-slate-700/50 rounded-lg hover:border-slate-600/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <img 
                      src={selectedToken?.logo || '/placeholder-token.png'} 
                      alt={selectedToken?.symbol} 
                      className="w-6 h-6 rounded-full"
                    />
                    <div className="text-left">
                      <p className="font-medium">{selectedToken?.symbol}</p>
                      <p className="text-xs text-slate-400">{selectedToken?.name}</p>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showTokenSelector ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showTokenSelector && (
                    <motion.div
                      className="absolute top-full left-0 right-0 mt-2 bg-slate-800/95 backdrop-blur-xl rounded-lg border border-slate-700/50 shadow-2xl z-10 max-h-60 overflow-y-auto"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      {availableTokens.map((token) => (
                        <button
                          key={token.symbol}
                          onClick={() => {
                            setSelectedToken(token);
                            setShowTokenSelector(false);
                          }}
                          className="w-full flex items-center space-x-3 p-3 hover:bg-slate-700/50 transition-colors first:rounded-t-lg last:rounded-b-lg"
                        >
                          <img 
                            src={token.logo} 
                            alt={token.symbol} 
                            className="w-6 h-6 rounded-full"
                          />
                          <div className="text-left flex-1">
                            <p className="font-medium">{token.symbol}</p>
                            <p className="text-xs text-slate-400">{token.name}</p>
                          </div>
                          {!token.isNative && (
                            <span className="text-xs bg-slate-700/50 px-2 py-1 rounded">
                              Token
                            </span>
                          )}
                        </button>
                      ))}
                      
                      {/* Add Custom Token */}
                      <div className="border-t border-slate-700/50 p-3">
                        {!showAddToken ? (
                          <button
                            onClick={() => setShowAddToken(true)}
                            className="w-full flex items-center justify-center space-x-2 py-2 text-yellow-400 hover:text-yellow-300 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            <span className="text-sm">Add Custom Token</span>
                          </button>
                        ) : (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={customTokenAddress}
                              onChange={(e) => setCustomTokenAddress(e.target.value)}
                              placeholder="Token contract address..."
                              className="w-full bg-slate-900/50 border border-slate-700/50 rounded px-3 py-2 text-sm focus:outline-none focus:border-yellow-500/50"
                            />
                            <div className="flex space-x-2">
                              <button
                                onClick={addCustomToken}
                                className="flex-1 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-sm transition-colors"
                              >
                                Add
                              </button>
                              <button
                                onClick={() => {
                                  setShowAddToken(false);
                                  setCustomTokenAddress('');
                                }}
                                className="flex-1 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Address Display */}
          {displayAddress && (
            <div className="p-6 space-y-4">
              <div className="text-center">
                {qrCodeDataUrl && (
                  <div className="bg-white p-4 rounded-lg inline-block mb-4">
                    <img 
                      src={qrCodeDataUrl} 
                      alt="QR Code" 
                      className={`${isMobile ? 'w-40 h-40' : 'w-48 h-48'}`}
                    />
                  </div>
                )}
                
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
                  <p className="text-slate-400 text-sm mb-2">
                    {selectedToken && !selectedToken.isNative ? `${selectedToken.symbol} Token Address` : 'Receive Address'}
                  </p>
                  <div className="flex items-center space-x-2">
                    <p className={`font-mono text-sm flex-1 break-all ${isMobile ? 'text-xs' : ''}`}>{displayAddress}</p>
                    <button
                      onClick={() => copyToClipboard(displayAddress)}
                      className="p-2 hover:bg-slate-700/50 rounded transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  {selectedToken && !selectedToken.isNative && (
                    <div className="mt-2 pt-2 border-t border-slate-700/30">
                      <p className="text-xs text-slate-400">Contract: {selectedToken.address}</p>
                    </div>
                  )}
                </div>
              </div>

              {isEVMChain ? (
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
              ) : (
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
            </div>
          )}

          {/* No Connection State */}
          {!isEVMChain && !connectedRpcNode && (
            <div className="p-6">
              <div className="text-center py-8">
                <Server className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-400 mb-2">No RPC node connected</p>
                <p className="text-slate-500 text-sm">
                  Configure an RPC node for {chainSymbol} to receive addresses
                </p>
              </div>
            </div>
          )}

          {/* Security Notice */}
          <div className="px-6 pb-6">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-blue-400 text-sm">
                <strong>Security:</strong> {isEVMChain 
                  ? `This address can receive ${selectedToken?.symbol || chainSymbol} ${selectedToken && !selectedToken.isNative ? 'tokens' : ''}. QR code includes ${selectedToken && !selectedToken.isNative ? 'token contract information' : 'address information'} for easy scanning.`
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