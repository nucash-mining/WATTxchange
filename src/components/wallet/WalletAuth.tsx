import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Key, Wallet, Eye, EyeOff, Download, Upload } from 'lucide-react';
import { walletService } from '../../services/walletService';
import toast from 'react-hot-toast';

interface WalletAuthProps {
  onAuthenticated: () => void;
}

const WalletAuth: React.FC<WalletAuthProps> = ({ onAuthenticated }) => {
  const [authMethod, setAuthMethod] = useState<'provider' | 'mnemonic' | 'privateKey'>('provider');
  const [mnemonic, setMnemonic] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [selectedChain, setSelectedChain] = useState('ETH');
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [loading, setLoading] = useState(false);

  const supportedChains = walletService.getSupportedChains();

  const handleProviderAuth = async () => {
    setLoading(true);
    try {
      const success = await walletService.initializeFromProvider();
      if (success) {
        toast.success('Connected to Web3 provider!');
        onAuthenticated();
      } else {
        toast.error('Failed to connect to Web3 provider');
      }
    } catch (error) {
      console.error('Provider auth error:', error);
      toast.error('Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleMnemonicAuth = async () => {
    if (!mnemonic.trim()) {
      toast.error('Please enter a valid mnemonic phrase');
      return;
    }

    setLoading(true);
    try {
      const success = await walletService.initializeFromMnemonic(mnemonic.trim());
      if (success) {
        toast.success('Wallet initialized from mnemonic!');
        onAuthenticated();
      } else {
        toast.error('Invalid mnemonic phrase');
      }
    } catch (error) {
      console.error('Mnemonic auth error:', error);
      toast.error('Failed to initialize wallet');
    } finally {
      setLoading(false);
    }
  };

  const handlePrivateKeyAuth = async () => {
    if (!privateKey.trim()) {
      toast.error('Please enter a valid private key');
      return;
    }

    setLoading(true);
    try {
      const success = await walletService.initializeFromPrivateKey(privateKey.trim(), selectedChain);
      if (success) {
        toast.success(`Wallet initialized for ${selectedChain}!`);
        onAuthenticated();
      } else {
        toast.error('Invalid private key');
      }
    } catch (error) {
      console.error('Private key auth error:', error);
      toast.error('Failed to initialize wallet');
    } finally {
      setLoading(false);
    }
  };

  const generateMnemonic = () => {
    // Generate a simple 12-word mnemonic for demo purposes
    const words = [
      'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
      'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid',
      'acoustic', 'acquire', 'across', 'act', 'action', 'actor', 'actress', 'actual'
    ];
    
    const mnemonicWords = [];
    for (let i = 0; i < 12; i++) {
      const randomIndex = Math.floor(Math.random() * words.length);
      mnemonicWords.push(words[randomIndex]);
    }
    
    setMnemonic(mnemonicWords.join(' '));
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <motion.div
        className="bg-slate-800/30 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50 max-w-md w-full"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img src="/WATTxchange logo.png" alt="WATTxchange" className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-emerald-400 bg-clip-text text-transparent">
            WATTxchange
          </h2>
          <p className="text-slate-400 mt-2">Connect your wallet to continue</p>
          <p className="text-slate-500 text-sm mt-1">EVM chains only (ETH, ALT, WATT)</p>
        </div>

        {/* Authentication Method Selection */}
        <div className="flex space-x-2 mb-6 bg-slate-900/50 rounded-lg p-1">
          <button
            onClick={() => setAuthMethod('provider')}
            className={`flex-1 py-2 px-3 rounded-md text-sm transition-colors ${
              authMethod === 'provider'
                ? 'bg-yellow-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Provider
          </button>
          <button
            onClick={() => setAuthMethod('mnemonic')}
            className={`flex-1 py-2 px-3 rounded-md text-sm transition-colors ${
              authMethod === 'mnemonic'
                ? 'bg-yellow-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Mnemonic
          </button>
          <button
            onClick={() => setAuthMethod('privateKey')}
            className={`flex-1 py-2 px-3 rounded-md text-sm transition-colors ${
              authMethod === 'privateKey'
                ? 'bg-yellow-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Private Key
          </button>
        </div>

        {/* Provider Authentication */}
        {authMethod === 'provider' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <p className="text-slate-300 text-sm">
              Connect using MetaMask, Rabby, or other Web3 wallet providers.
            </p>
            <motion.button
              onClick={handleProviderAuth}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-semibold transition-colors disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Wallet className="w-5 h-5" />
              <span>{loading ? 'Connecting...' : 'Connect Wallet'}</span>
            </motion.button>
          </motion.div>
        )}

        {/* Mnemonic Authentication */}
        {authMethod === 'mnemonic' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium mb-2">Mnemonic Phrase</label>
              <textarea
                value={mnemonic}
                onChange={(e) => setMnemonic(e.target.value)}
                placeholder="Enter your 12 or 24 word mnemonic phrase..."
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-3 h-24 resize-none focus:outline-none focus:border-yellow-500/50"
              />
            </div>
            
            <div className="flex space-x-2">
              <motion.button
                onClick={generateMnemonic}
                className="flex items-center space-x-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Download className="w-4 h-4" />
                <span>Generate</span>
              </motion.button>
            </div>

            <motion.button
              onClick={handleMnemonicAuth}
              disabled={loading || !mnemonic.trim()}
              className="w-full py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-semibold transition-colors disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? 'Initializing...' : 'Initialize Wallet'}
            </motion.button>
          </motion.div>
        )}

        {/* Private Key Authentication */}
        {authMethod === 'privateKey' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium mb-2">Blockchain</label>
              <select
                value={selectedChain}
                onChange={(e) => setSelectedChain(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-500/50"
              >
                {supportedChains.map(chain => (
                  <option key={chain} value={chain}>{chain}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Private Key</label>
              <div className="relative">
                <input
                  type={showPrivateKey ? 'text' : 'password'}
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  placeholder="Enter your private key..."
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-3 pr-10 focus:outline-none focus:border-yellow-500/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPrivateKey(!showPrivateKey)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPrivateKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <motion.button
              onClick={handlePrivateKeyAuth}
              disabled={loading || !privateKey.trim()}
              className="w-full py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-semibold transition-colors disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? 'Initializing...' : 'Initialize Wallet'}
            </motion.button>
          </motion.div>
        )}

        {/* UTXO Chain Notice */}
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-blue-400 text-sm">
            <strong>UTXO Chains:</strong> Bitcoin, Litecoin, Monero, GHOST, and Trollcoin require RPC node connections for balance and transaction management. Configure these in the RPC Node Manager after authentication.
          </p>
        </div>

        {/* Security Notice */}
        <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-yellow-400 text-sm">
            <strong>Security Notice:</strong> Your private keys and mnemonic phrases are stored locally and never transmitted to our servers.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default WalletAuth;