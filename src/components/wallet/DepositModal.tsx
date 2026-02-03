import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, ArrowRight, Info, Check } from 'lucide-react';
import { tokenService, Token } from '../../services/tokenService';
import toast from 'react-hot-toast';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  chainSymbol: string;
}

const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose, chainSymbol }) => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [depositAddress, setDepositAddress] = useState<string>('');
  const [depositNetwork, setDepositNetwork] = useState<string>('');
  const [depositMemo, setDepositMemo] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      // Load tokens for the chain
      const availableTokens = tokenService.getTokensForChain(chainSymbol);
      setTokens(availableTokens);
      
      // Set default token (native token)
      const nativeToken = availableTokens.find(t => t.isNative);
      setSelectedToken(nativeToken || availableTokens[0]);
      
      // Generate deposit address
      generateDepositAddress(nativeToken || availableTokens[0]);
    }
  }, [isOpen, chainSymbol]);

  const generateDepositAddress = (token: Token | null) => {
    if (!token) return;
    
    // In a real implementation, this would fetch from the wallet or generate a new address
    // For demo purposes, we'll use a mock address
    const mockAddress = '0x' + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    setDepositAddress(mockAddress);
    
    // Set deposit network based on token
    if (token.isNative) {
      setDepositNetwork(token.symbol);
    } else {
      setDepositNetwork(token.chainId === 1 ? 'Ethereum' : 
                        token.chainId === 137 ? 'Polygon' : 
                        token.chainId === 2330 ? 'Altcoinchain' : 'ERC-20');
    }
    
    // Set memo/tag if needed (for certain chains like XRP, XLM)
    setDepositMemo('');
  };

  const handleTokenChange = (tokenSymbol: string) => {
    const token = tokens.find(t => t.symbol === tokenSymbol);
    if (token) {
      setSelectedToken(token);
      generateDepositAddress(token);
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
              <h3 className="text-xl font-semibold">Deposit {selectedToken?.symbol || chainSymbol}</h3>
              <p className="text-slate-400 text-sm">
                Add funds to your WATTxchange wallet
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Token Selector */}
          <div className="p-6 border-b border-slate-700/50">
            <label className="block text-sm font-medium mb-2">Select Token</label>
            <select
              value={selectedToken?.symbol || ''}
              onChange={(e) => handleTokenChange(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500/50"
            >
              {tokens.map(token => (
                <option key={token.symbol} value={token.symbol}>
                  {token.symbol} - {token.name}
                </option>
              ))}
            </select>
          </div>

          {/* Deposit Address */}
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Deposit Address</label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={depositAddress}
                  readOnly
                  className="flex-1 bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-3 focus:outline-none focus:border-blue-500/50 font-mono text-sm"
                />
                <button
                  onClick={() => copyToClipboard(depositAddress)}
                  className="p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                >
                  {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Network Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Deposit Network</label>
              <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-3">
                <div className="flex items-center justify-between">
                  <span>{depositNetwork}</span>
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">
                    Recommended
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Only send {selectedToken?.symbol} on the {depositNetwork} network to this address
              </p>
            </div>

            {/* Memo/Tag (if applicable) */}
            {depositMemo && (
              <div>
                <label className="block text-sm font-medium mb-2">Memo/Tag (Required)</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={depositMemo}
                    readOnly
                    className="flex-1 bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-3 focus:outline-none focus:border-blue-500/50 font-mono text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(depositMemo)}
                    className="p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-xs text-red-400 mt-1">
                  This memo is required. Deposits without the correct memo may be lost.
                </p>
              </div>
            )}

            {/* QR Code */}
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-lg">
                <svg
                  width="200"
                  height="200"
                  viewBox="0 0 200 200"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Simple QR code representation */}
                  <rect width="200" height="200" fill="white" />
                  <rect x="50" y="50" width="100" height="100" fill="black" />
                  <rect x="60" y="60" width="80" height="80" fill="white" />
                  <rect x="70" y="70" width="60" height="60" fill="black" />
                  <rect x="80" y="80" width="40" height="40" fill="white" />
                  <rect x="90" y="90" width="20" height="20" fill="black" />
                </svg>
              </div>
            </div>

            {/* Warning */}
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <div className="flex items-start space-x-2">
                <Info className="w-5 h-5 text-yellow-400 mt-0.5" />
                <div>
                  <p className="text-yellow-400 font-medium">Important</p>
                  <p className="text-sm text-slate-300 mt-1">
                    Only send {selectedToken?.symbol} to this address. Sending any other asset may result in permanent loss.
                  </p>
                </div>
              </div>
            </div>

            {/* Deposit Instructions */}
            <div className="space-y-4">
              <h4 className="font-medium">How to Deposit</h4>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <div>
                    <p className="font-medium">Copy Address</p>
                    <p className="text-sm text-slate-400">Copy the deposit address shown above</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <div>
                    <p className="font-medium">Initiate Transfer</p>
                    <p className="text-sm text-slate-400">Go to your external wallet or exchange and send {selectedToken?.symbol}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <div>
                    <p className="font-medium">Wait for Confirmation</p>
                    <p className="text-sm text-slate-400">Funds will appear in your wallet after network confirmation</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DepositModal;