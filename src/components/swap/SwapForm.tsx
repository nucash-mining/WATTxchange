import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpDown, Clock, Shield, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const SwapForm: React.FC = () => {
  const [sendAmount, setSendAmount] = useState('');
  const [receiveAmount, setReceiveAmount] = useState('');
  const [sendToken, setSendToken] = useState('BTC');
  const [receiveToken, setReceiveToken] = useState('ETH');

  const tokens = [
    { 
      symbol: 'BTC', 
      name: 'Bitcoin', 
      balance: '0.05432',
      icon: () => <img src="/BTC logo.png" alt="BTC" className="w-6 h-6 object-contain" />
    },
    { 
      symbol: 'ETH', 
      name: 'Ethereum', 
      balance: '2.1847',
      icon: () => <img src="/ETH logo.png" alt="ETH" className="w-6 h-6 object-contain" />
    },
    { 
      symbol: 'ALT', 
      name: 'Altcoin', 
      balance: '1,234.56',
      icon: () => <img src="/Altcoinchain logo.png" alt="ALT" className="w-6 h-6 object-contain rounded-full" />
    },
    { 
      symbol: 'LTC', 
      name: 'Litecoin', 
      balance: '12.67',
      icon: () => <img src="/LTC logo.png" alt="LTC" className="w-6 h-6 object-contain" />
    },
    { 
      symbol: 'XMR', 
      name: 'Monero', 
      balance: '5.234',
      icon: () => <img src="/XMR logo.png" alt="XMR" className="w-6 h-6 object-contain" />
    },
    { 
      symbol: 'WATT', 
      name: 'WATT Token', 
      balance: '56.7',
      icon: () => <img src="/WATT logo.png" alt="WATT" className="w-6 h-6 object-contain" />
    },
    { 
      symbol: 'GHOST', 
      name: 'GHOST', 
      balance: '1,250.75',
      icon: () => <img src="/GHOST logo.png" alt="GHOST" className="w-6 h-6 object-contain" />
    },
    { 
      symbol: 'TROLL', 
      name: 'Trollcoin', 
      balance: '15,420.69',
      icon: () => <img src="/TROLL logo.png" alt="TROLL" className="w-6 h-6 object-contain" />
    }
  ];

  const handleSwapTokens = () => {
    const tempToken = sendToken;
    setSendToken(receiveToken);
    setReceiveToken(tempToken);
    
    const tempAmount = sendAmount;
    setSendAmount(receiveAmount);
    setReceiveAmount(tempAmount);
  };

  const handleCreateSwap = () => {
    if (!sendAmount || !receiveAmount) {
      toast.error('Please enter both amounts');
      return;
    }
    
    toast.success('Atomic swap initiated successfully!');
    setSendAmount('');
    setReceiveAmount('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Swap Form */}
      <motion.div
        className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <h3 className="text-xl font-semibold mb-6">Create Atomic Swap</h3>

        <div className="space-y-6">
          {/* Send Section */}
          <div className="space-y-3">
            <label className="block text-sm text-slate-400">You Send</label>
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
              <div className="flex items-center justify-between mb-2">
                <input
                  type="number"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  placeholder="0.00"
                  className="bg-transparent text-2xl font-bold outline-none flex-1"
                />
                <select
                  value={sendToken}
                  onChange={(e) => setSendToken(e.target.value)}
                  className="bg-slate-800 rounded px-3 py-2 outline-none flex items-center space-x-2"
                >
                  {tokens.map(token => (
                    <option key={token.symbol} value={token.symbol}>
                      {token.symbol}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-between text-sm text-slate-400">
                <span>≈ $0.00</span>
                <span>Balance: {tokens.find(t => t.symbol === sendToken)?.balance}</span>
              </div>
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

          {/* Receive Section */}
          <div className="space-y-3">
            <label className="block text-sm text-slate-400">You Receive</label>
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
              <div className="flex items-center justify-between mb-2">
                <input
                  type="number"
                  value={receiveAmount}
                  onChange={(e) => setReceiveAmount(e.target.value)}
                  placeholder="0.00"
                  className="bg-transparent text-2xl font-bold outline-none flex-1"
                />
                <select
                  value={receiveToken}
                  onChange={(e) => setReceiveToken(e.target.value)}
                  className="bg-slate-800 rounded px-3 py-2 outline-none"
                >
                  {tokens.map(token => (
                    <option key={token.symbol} value={token.symbol}>
                      {token.symbol}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-between text-sm text-slate-400">
                <span>≈ $0.00</span>
                <span>Balance: {tokens.find(t => t.symbol === receiveToken)?.balance}</span>
              </div>
            </div>
          </div>

          {/* Swap Details */}
          <div className="bg-slate-900/50 rounded-lg p-4 space-y-2 border border-slate-700/30">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Exchange Rate</span>
              <span>1 {sendToken} ≈ 16.5 {receiveToken}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Network Fee</span>
              <span>0.001 {sendToken}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Estimated Time</span>
              <span>10-15 minutes</span>
            </div>
            {(sendToken === 'GHOST' || receiveToken === 'GHOST') && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">GHOST Type</span>
                <span className="text-purple-400">Proof-of-Stake</span>
              </div>
            )}
            {(sendToken === 'TROLL' || receiveToken === 'TROLL') && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">TROLL Type</span>
                <span className="text-orange-400">Proof-of-Work</span>
              </div>
            )}
          </div>

          {/* Create Swap Button */}
          <motion.button
            onClick={handleCreateSwap}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Create Atomic Swap
          </motion.button>
        </div>
      </motion.div>

      {/* Swap Information */}
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
        {/* Supported Tokens */}
        <div className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
          <h4 className="text-lg font-semibold mb-4">Supported Tokens</h4>
          <div className="grid grid-cols-2 gap-3">
            {tokens.map((token) => {
              const IconComponent = token.icon;
              return (
                <div key={token.symbol} className="flex items-center space-x-3 p-3 bg-slate-900/30 rounded-lg">
                  <IconComponent />
                  <div>
                    <p className="font-medium">{token.symbol}</p>
                    <div className="flex items-center space-x-2">
                      <p className="text-xs text-slate-400">{token.name}</p>
                      {token.symbol === 'GHOST' && (
                        <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
                          PoS
                        </span>
                      )}
                      {token.symbol === 'TROLL' && (
                        <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded">
                          PoW
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
          <h4 className="text-lg font-semibold mb-4">How Atomic Swaps Work</h4>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">1</div>
              <div>
                <p className="font-medium">Hash Time Lock Contract</p>
                <p className="text-sm text-slate-400">Both parties lock funds in secure smart contracts</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">2</div>
              <div>
                <p className="font-medium">Secret Reveal</p>
                <p className="text-sm text-slate-400">Atomic revelation enables simultaneous fund release</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">3</div>
              <div>
                <p className="font-medium">Trustless Exchange</p>
                <p className="text-sm text-slate-400">No intermediaries needed - code executes automatically</p>
              </div>
            </div>
          </div>
        </div>

        {/* Security Features */}
        <div className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
          <h4 className="text-lg font-semibold mb-4">Security Features</h4>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 text-emerald-400" />
              <span className="text-sm">Trustless execution</span>
            </div>
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-blue-400" />
              <span className="text-sm">Time-locked contracts</span>
            </div>
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              <span className="text-sm">Automatic refunds on timeout</span>
            </div>
          </div>
        </div>

        {/* GHOST PoS Notice */}
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
          <div className="flex items-start space-x-2">
            <img src="/GHOST logo.png" alt="GHOST" className="w-5 h-5 mt-0.5" />
            <div>
              <p className="font-medium text-purple-400">GHOST Proof-of-Stake</p>
              <p className="text-sm text-slate-300 mt-1">
                GHOST uses PoS consensus. Swaps may take longer due to block validation times.
                Ensure sufficient network confirmations for secure atomic swaps.
              </p>
            </div>
          </div>
        </div>

        {/* Trollcoin PoW Notice */}
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
          <div className="flex items-start space-x-2">
            <img src="/TROLL logo.png" alt="TROLL" className="w-5 h-5 mt-0.5" />
            <div>
              <p className="font-medium text-orange-400">Trollcoin Proof-of-Work</p>
              <p className="text-sm text-slate-300 mt-1">
                Trollcoin uses PoW consensus with Scrypt algorithm. Mining-based validation 
                provides strong security for atomic swap transactions.
              </p>
            </div>
          </div>
        </div>

        {/* Warnings */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-400">Important Notice</p>
              <p className="text-sm text-slate-300 mt-1">
                Atomic swaps are irreversible. Double-check all details before proceeding.
                Ensure you have sufficient network fees for both blockchains.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SwapForm;