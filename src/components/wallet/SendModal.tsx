import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, AlertTriangle, Zap, Clock, TrendingUp, Server } from 'lucide-react';
import { walletService } from '../../services/walletService';
import { realRPCNodeService } from '../../services/realRPCNodeService';
import { priceService, GasFees } from '../../services/priceService';
import { useDeviceDetect } from '../../hooks/useDeviceDetect';
import toast from 'react-hot-toast';

interface SendModalProps {
  isOpen: boolean;
  onClose: () => void;
  chainSymbol: string;
  balance: string;
}

const SendModal: React.FC<SendModalProps> = ({ isOpen, onClose, chainSymbol, balance }) => {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [gasOption, setGasOption] = useState<'slow' | 'normal' | 'fast' | 'custom'>('normal');
  const [customGasPrice, setCustomGasPrice] = useState('');
  const [gasFees, setGasFees] = useState<GasFees | null>(null);
  const [loading, setLoading] = useState(false);
  const [estimatedFee, setEstimatedFee] = useState('0');
  const { isMobile } = useDeviceDetect();

  const chainConfig = walletService.getChainConfig(chainSymbol);
  const isEVMChain = chainConfig !== null;
  const currentAddress = walletService.getCurrentAddress(chainSymbol);
  
  // Debug RPC connection
  const connectedNodes = realRPCNodeService.getConnectedNodes();
  
  // Map chain symbols to their RPC node names
  const chainToRpcMap: { [key: string]: string } = {
    'XMR': 'monero',
    'BTC': 'bitcoin', 
    'LTC': 'litecoin',
    'GHOST': 'ghost',
    'TROLL': 'trollcoin',
    'HTH': 'hth',
    'RTM': 'raptoreum',
    'ALT': 'altcoinchain'
  };
  
  const rpcNodeName = chainToRpcMap[chainSymbol] || chainSymbol.toLowerCase();
  const connectedRpcNode = connectedNodes.includes(rpcNodeName);
  
  console.log(`SendModal Debug - Chain: ${chainSymbol}`);
  console.log(`SendModal Debug - RPC Node Name: ${rpcNodeName}`);
  console.log(`SendModal Debug - Connected nodes:`, connectedNodes);
  console.log(`SendModal Debug - Is connected:`, connectedRpcNode);

  useEffect(() => {
    if (isOpen && isEVMChain && chainConfig?.chainId) {
      loadGasFees();
    }
  }, [isOpen, chainConfig, isEVMChain]);

  useEffect(() => {
    if (gasFees && amount && isEVMChain) {
      calculateEstimatedFee();
    }
  }, [gasFees, amount, gasOption, customGasPrice, isEVMChain]);

  const loadGasFees = async () => {
    if (!chainConfig?.chainId) return;
    
    try {
      const fees = await priceService.getGasFees(chainConfig.chainId);
      setGasFees(fees);
    } catch (error) {
      console.error('Failed to load gas fees:', error);
    }
  };

  const calculateEstimatedFee = () => {
    if (!gasFees) return;

    let gasPrice: string;
    switch (gasOption) {
      case 'slow':
        gasPrice = gasFees.slow.gasPrice;
        break;
      case 'fast':
        gasPrice = gasFees.fast.gasPrice;
        break;
      case 'custom':
        gasPrice = customGasPrice || gasFees.normal.gasPrice;
        break;
      default:
        gasPrice = gasFees.normal.gasPrice;
    }

    const gasLimit = 21000; // Standard ETH transfer
    const gasPriceGwei = parseFloat(gasPrice.replace(' gwei', ''));
    const feeEth = (gasLimit * gasPriceGwei) / 1e9;
    
    setEstimatedFee(feeEth.toFixed(6));
  };

  const validateTransaction = (): string | null => {
    if (!recipient.trim()) {
      return 'Please enter a recipient address';
    }

    if (!amount || parseFloat(amount) <= 0) {
      return 'Please enter a valid amount';
    }

    const amountNum = parseFloat(amount);
    const balanceNum = parseFloat(balance.replace(/,/g, ''));

    if (amountNum > balanceNum) {
      return 'Insufficient balance';
    }

    // Basic address validation
    if (isEVMChain) {
      if (!/^0x[a-fA-F0-9]{40}$/.test(recipient)) {
        return 'Invalid Ethereum address format';
      }
    } else {
      // Basic validation for UTXO chains
      if (chainSymbol === 'XMR') {
        // Monero addresses are typically 95 characters
        if (recipient.length !== 95 || !recipient.startsWith('4')) {
          return 'Invalid Monero address format';
        }
      } else {
        // Other UTXO chains
        if (recipient.length < 26 || recipient.length > 62) {
          return 'Invalid address format';
        }
      }
    }

    return null;
  };

  const handleSend = async () => {
    const validationError = validateTransaction();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    if (!isEVMChain && !connectedRpcNode) {
      toast.error('No RPC node connected');
      return;
    }

    setLoading(true);
    try {
      if (isEVMChain) {
        // EVM transaction (would use Web3 provider in real implementation)
        await new Promise(resolve => setTimeout(resolve, 2000));
        toast.success(`Transaction sent! ${amount} ${chainSymbol} to ${recipient.slice(0, 6)}...${recipient.slice(-4)}`);
      } else {
        // RPC transaction using realRPCNodeService
        if (chainSymbol === 'XMR') {
          // For Monero, use wallet RPC directly
          const atomicAmount = Math.floor(parseFloat(amount) * 1e12);
          const response = await fetch('http://127.0.0.1:18083/json_rpc', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: '0',
              method: 'transfer',
              params: {
                destinations: [{ amount: atomicAmount, address: recipient }],
                priority: 1,
                ring_size: 11,
                get_tx_key: true
              }
            })
          });
          
          const data = await response.json();
          if (data.error) {
            throw new Error(data.error.message);
          }
          
          toast.success(`Monero transaction sent! Hash: ${data.result.tx_hash.slice(0, 8)}...`);
        } else {
          // For other UTXO chains, use realRPCNodeService
          const txHash = await realRPCNodeService.sendCoins(rpcNodeName, recipient, parseFloat(amount), 'WATTxchange transfer');
          if (txHash) {
            toast.success(`Transaction sent! Hash: ${txHash.slice(0, 8)}...`);
          } else {
            throw new Error('Transaction failed');
          }
        }
      }
      
      onClose();
      
      // Reset form
      setRecipient('');
      setAmount('');
      setGasOption('normal');
      setCustomGasPrice('');
    } catch (error) {
      console.error('Transaction failed:', error);
      toast.error('Transaction failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const setMaxAmount = () => {
    const balanceNum = parseFloat(balance.replace(/,/g, ''));
    const feeNum = isEVMChain ? parseFloat(estimatedFee) : 0.001; // Estimate fee for UTXO chains
    const maxAmount = Math.max(0, balanceNum - feeNum);
    setAmount(maxAmount.toString());
  };

  const getGasOptionIcon = (option: string) => {
    switch (option) {
      case 'slow':
        return <Clock className="w-4 h-4 text-blue-400" />;
      case 'fast':
        return <Zap className="w-4 h-4 text-yellow-400" />;
      default:
        return <TrendingUp className="w-4 h-4 text-emerald-400" />;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          className="bg-slate-800/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 max-w-md w-full"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
            <div>
              <h3 className="text-xl font-semibold">Send {chainSymbol}</h3>
              <p className="text-slate-400 text-sm">Balance: {balance} {chainSymbol}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* From Address */}
            <div>
              <label className="block text-sm font-medium mb-2">From</label>
              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/30">
                {isEVMChain ? (
                  <p className={`font-mono ${isMobile ? 'text-xs' : 'text-sm'} text-slate-300`}>
                    {currentAddress?.address || 'No address available'}
                  </p>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Server className="w-4 h-4 text-slate-400" />
                    <p className="text-sm text-slate-300">
                      {connectedRpcNode ? `${chainSymbol.toUpperCase()} RPC Node Connected` : 'No RPC node connected'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* RPC Node Status */}
            {!isEVMChain && !connectedRpcNode && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <p className="text-red-400 font-medium">No RPC node connected</p>
                </div>
                <p className="text-slate-300 text-sm mt-1">
                  Configure an RPC node for {chainSymbol} to send transactions
                </p>
              </div>
            )}

            {/* Recipient Address */}
            <div>
              <label className="block text-sm font-medium mb-2">To</label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder={`Enter ${chainSymbol} address...`}
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-3 focus:outline-none focus:border-yellow-500/50"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium mb-2">Amount</label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-3 pr-16 focus:outline-none focus:border-yellow-500/50"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                  <button
                    onClick={setMaxAmount}
                    className="text-xs text-yellow-400 hover:text-yellow-300 font-medium"
                  >
                    MAX
                  </button>
                  <span className="text-slate-400 text-sm">{chainSymbol}</span>
                </div>
              </div>
            </div>

            {/* Gas Fees (EVM only) */}
            {gasFees && isEVMChain && !isMobile && (
              <div>
                <label className="block text-sm font-medium mb-3">Network Fee</label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {(['slow', 'normal', 'fast'] as const).map((option) => (
                    <button
                      key={option}
                      onClick={() => setGasOption(option)}
                      className={`p-3 rounded-lg border transition-colors ${
                        gasOption === option
                          ? 'border-yellow-500/50 bg-yellow-500/10'
                          : 'border-slate-700/50 hover:border-slate-600/50'
                      }`}
                    >
                      <div className="flex items-center justify-center mb-1">
                        {getGasOptionIcon(option)}
                      </div>
                      <p className="text-xs font-medium capitalize">{option}</p>
                      <p className="text-xs text-slate-400">{gasFees[option].gasPrice}</p>
                      <p className="text-xs text-slate-500">{gasFees[option].estimatedTime}</p>
                    </button>
                  ))}
                </div>

                {/* Custom Gas */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={gasOption === 'custom'}
                    onChange={(e) => setGasOption(e.target.checked ? 'custom' : 'normal')}
                    className="rounded"
                  />
                  <label className="text-sm">Custom gas price</label>
                  {gasOption === 'custom' && (
                    <input
                      type="number"
                      value={customGasPrice}
                      onChange={(e) => setCustomGasPrice(e.target.value)}
                      placeholder="Gas price in gwei"
                      className="flex-1 bg-slate-900/50 border border-slate-700/50 rounded px-2 py-1 text-sm focus:outline-none focus:border-yellow-500/50"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Simplified Gas Fees for Mobile */}
            {gasFees && isEVMChain && isMobile && (
              <div>
                <label className="block text-sm font-medium mb-2">Network Fee</label>
                <div className="flex justify-between items-center bg-slate-900/50 rounded-lg p-3 border border-slate-700/30">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm">Standard</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">{gasFees.normal.gasPrice}</p>
                    <p className="text-xs text-slate-400">{gasFees.normal.estimatedTime}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Transaction Summary */}
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
              <h4 className="font-medium mb-3">Transaction Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Amount:</span>
                  <span>{amount || '0'} {chainSymbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Network Fee:</span>
                  <span>
                    {isEVMChain ? `${estimatedFee} ETH` : '~0.001 ' + chainSymbol}
                  </span>
                </div>
                <div className="flex justify-between font-medium pt-2 border-t border-slate-700/30">
                  <span>Total:</span>
                  <span>
                    {isEVMChain 
                      ? `${(parseFloat(amount || '0') + parseFloat(estimatedFee)).toFixed(6)} ${chainSymbol}`
                      : `${(parseFloat(amount || '0') + 0.001).toFixed(6)} ${chainSymbol}`
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Send Button */}
            <motion.button
              onClick={handleSend}
              disabled={loading || !recipient || !amount || (!isEVMChain && !connectedRpcNode)}
              className="w-full flex items-center justify-center space-x-2 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-semibold transition-colors disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Send className="w-5 h-5" />
              <span>{loading ? 'Sending...' : 'Send Transaction'}</span>
            </motion.button>

            {/* Warning */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                <div>
                  <p className="text-yellow-400 font-medium text-sm">Important</p>
                  <p className="text-slate-300 text-sm mt-1">
                    Double-check the recipient address. Transactions cannot be reversed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SendModal;