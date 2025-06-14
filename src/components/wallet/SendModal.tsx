import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, AlertTriangle, Zap, Clock, TrendingUp } from 'lucide-react';
import { walletService } from '../../services/walletService';
import { priceService, GasFees } from '../../services/priceService';
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

  const chainConfig = walletService.getChainConfig(chainSymbol);
  const currentAddress = walletService.getCurrentAddress(chainSymbol);

  useEffect(() => {
    if (isOpen && chainConfig?.chainId) {
      loadGasFees();
    }
  }, [isOpen, chainConfig]);

  useEffect(() => {
    if (gasFees && amount) {
      calculateEstimatedFee();
    }
  }, [gasFees, amount, gasOption, customGasPrice]);

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

    // Estimate gas limit based on transaction type
    const gasLimit = chainSymbol === 'ETH' || chainSymbol === 'ALT' || chainSymbol === 'WATT' ? 21000 : 250000;
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
    if (chainConfig?.addressType === 'ethereum') {
      if (!/^0x[a-fA-F0-9]{40}$/.test(recipient)) {
        return 'Invalid Ethereum address format';
      }
    } else if (chainConfig?.addressType === 'bitcoin') {
      if (recipient.length < 26 || recipient.length > 35) {
        return 'Invalid Bitcoin address format';
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

    setLoading(true);
    try {
      // In a real implementation, this would broadcast the transaction
      // For now, we'll simulate the transaction
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network delay
      
      toast.success(`Transaction sent! ${amount} ${chainSymbol} to ${recipient.slice(0, 6)}...${recipient.slice(-4)}`);
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
    const feeNum = parseFloat(estimatedFee);
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
                <p className="font-mono text-sm text-slate-300">
                  {currentAddress?.address || 'No address available'}
                </p>
              </div>
            </div>

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

            {/* Gas Fees */}
            {gasFees && (chainConfig?.addressType === 'ethereum') && (
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
                  <span>{estimatedFee} {chainConfig?.addressType === 'ethereum' ? 'ETH' : chainSymbol}</span>
                </div>
                <div className="flex justify-between font-medium pt-2 border-t border-slate-700/30">
                  <span>Total:</span>
                  <span>{(parseFloat(amount || '0') + parseFloat(estimatedFee)).toFixed(6)} {chainSymbol}</span>
                </div>
              </div>
            </div>

            {/* Send Button */}
            <motion.button
              onClick={handleSend}
              disabled={loading || !recipient || !amount}
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