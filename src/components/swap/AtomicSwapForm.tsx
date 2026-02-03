import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpDown, Clock, Shield, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';
import { useWallet } from '../../hooks/useWallet';
import { atomicSwapService, SwapDetails } from '../../services/atomicSwapService';
import { rpcNodeService } from '../../services/rpcNodeService';
import toast from 'react-hot-toast';
import QRCode from 'qrcode.react';

const AtomicSwapForm: React.FC = () => {
  const { isConnected, address, chainId, connectWallet } = useWallet();
  const [swapType, setSwapType] = useState<'evm-to-utxo' | 'utxo-to-evm' | 'evm-to-evm'>('evm-to-utxo');
  const [sendChain, setSendChain] = useState('ETH');
  const [receiveChain, setReceiveChain] = useState('BTC');
  const [sendAmount, setSendAmount] = useState('');
  const [receiveAmount, setReceiveAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [timelockHours, setTimelockHours] = useState('24');
  const [isCreatingSwap, setIsCreatingSwap] = useState(false);
  const [currentSwap, setCurrentSwap] = useState<SwapDetails | null>(null);
  const [swapStep, setSwapStep] = useState<'form' | 'created' | 'waiting' | 'completed'>('form');

  const evmChains = ['ETH', 'ALT', 'WATT', 'WTX'];
  const utxoChains = ['BTC', 'LTC', 'XMR', 'GHOST', 'TROLL', 'HTH', 'WTX'];

  // Update receive chain when swap type changes
  useEffect(() => {
    if (swapType === 'evm-to-utxo') {
      setSendChain('ETH');
      setReceiveChain('BTC');
    } else if (swapType === 'utxo-to-evm') {
      setSendChain('BTC');
      setReceiveChain('ETH');
    } else {
      setSendChain('ETH');
      setReceiveChain('ALT');
    }
  }, [swapType]);

  // Update recipient address with connected wallet address
  useEffect(() => {
    if (isConnected && address && swapType === 'utxo-to-evm') {
      setRecipientAddress(address);
    }
  }, [isConnected, address, swapType]);

  const handleSwapChains = () => {
    const tempChain = sendChain;
    setSendChain(receiveChain);
    setReceiveChain(tempChain);
    
    const tempAmount = sendAmount;
    setSendAmount(receiveAmount);
    setReceiveAmount(tempAmount);
    
    // Update swap type based on new chains
    if (evmChains.includes(sendChain) && utxoChains.includes(receiveChain)) {
      setSwapType('evm-to-utxo');
    } else if (utxoChains.includes(sendChain) && evmChains.includes(receiveChain)) {
      setSwapType('utxo-to-evm');
    } else {
      setSwapType('evm-to-evm');
    }
  };

  const handleCreateSwap = async () => {
    if (!isConnected) {
      connectWallet();
      return;
    }

    if (!sendAmount || !receiveAmount || !recipientAddress) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsCreatingSwap(true);

    try {
      let swapDetails: SwapDetails | null = null;
      
      if (swapType === 'evm-to-utxo') {
        // Create EVM to UTXO swap
        const timelock = Math.floor(Date.now() / 1000) + (parseInt(timelockHours) * 60 * 60);
        
        // Generate a random secret key
        const secretKey = atomicSwapService.generateSecretKey();
        const hashLock = atomicSwapService.generateHashLock(secretKey);
        
        // Create deposit address for UTXO chain
        const depositAddress = await generateDepositAddress(receiveChain);
        
        swapDetails = {
          id: `swap_${Date.now()}`,
          maker: address!,
          taker: null,
          sendChain,
          receiveChain,
          sendToken: sendChain,
          receiveToken: receiveChain,
          sendAmount,
          receiveAmount,
          depositAddress,
          hashLock,
          timelock,
          status: 'pending',
          secretKey
        };
      } else if (swapType === 'utxo-to-evm') {
        // Create UTXO to EVM swap
        swapDetails = await atomicSwapService.createUTXOSwap(
          sendChain,
          recipientAddress,
          sendAmount,
          Math.floor(Date.now() / 1000) + (parseInt(timelockHours) * 60 * 60)
        );
      } else {
        // Create EVM to EVM swap
        // This would use the AtomicSwap contract
        const timelock = Math.floor(Date.now() / 1000) + (parseInt(timelockHours) * 60 * 60);
        
        // Generate a random secret key
        const secretKey = atomicSwapService.generateSecretKey();
        const hashLock = atomicSwapService.generateHashLock(secretKey);
        
        swapDetails = {
          id: `swap_${Date.now()}`,
          maker: address!,
          taker: null,
          sendChain,
          receiveChain,
          sendToken: sendChain,
          receiveToken: receiveChain,
          sendAmount,
          receiveAmount,
          hashLock,
          timelock,
          status: 'pending',
          secretKey
        };
      }

      if (swapDetails) {
        setCurrentSwap(swapDetails);
        setSwapStep('created');
        toast.success('Atomic swap created successfully!');
      } else {
        throw new Error('Failed to create swap');
      }
    } catch (error) {
      console.error('Failed to create swap:', error);
      toast.error('Failed to create atomic swap');
    } finally {
      setIsCreatingSwap(false);
    }
  };

  const handleConfirmDeposit = () => {
    if (!currentSwap) return;
    
    // In a real implementation, this would verify the deposit transaction
    // For demo purposes, we'll just update the status
    setCurrentSwap({
      ...currentSwap,
      status: 'confirmed',
      txHash: `0x${Math.random().toString(16).substring(2, 66)}`
    });
    
    setSwapStep('waiting');
    toast.success('Deposit confirmed! Waiting for counterparty...');
  };

  const handleCompleteSwap = () => {
    if (!currentSwap) return;
    
    // In a real implementation, this would call the contract to complete the swap
    // For demo purposes, we'll just update the status
    setCurrentSwap({
      ...currentSwap,
      status: 'completed'
    });
    
    setSwapStep('completed');
    toast.success('Atomic swap completed successfully!');
  };

  const handleCancelSwap = () => {
    if (!currentSwap) return;
    
    // In a real implementation, this would call the contract to cancel the swap
    // For demo purposes, we'll just reset the form
    setCurrentSwap(null);
    setSwapStep('form');
    toast.success('Swap cancelled');
  };

  const generateDepositAddress = async (chain: string): Promise<string> => {
    // Check if we have an RPC node for this chain
    const nodes = rpcNodeService.getNodesBySymbol(chain);
    const connectedNode = nodes.find(node => node.isConnected);
    
    if (connectedNode) {
      // Generate address using RPC
      const address = await rpcNodeService.getNewAddress(connectedNode.id);
      if (address) return address;
    }
    
    // Return a mock address for demo purposes
    return getMockAddress(chain);
  };

  const getMockAddress = (chain: string): string => {
    switch (chain) {
      case 'BTC':
        return 'bc1q9h6tq79q93y47qpzg0f9znmf5fh3m5dvsxnm7r';
      case 'LTC':
        return 'ltc1qj08ys4ct2hzzc2hcz6h2hgrvlmsjynacp5xh9f';
      case 'XMR':
        return '44AFFq5kSiGBoZ4NMDwYtN18obc8AemS33DBLWs3H7otXft3XjrpDtQGv7SqSsaBYBb98uNbr2VBBEt7f2wfn3RVGQBEP3A';
      case 'GHOST':
        return 'Ghtd7LYP7FzYCxhLTCrLZBXUAmiP8ba2XC';
      case 'TROLL':
        return 'TRoLLcoinCcHUDSrh1Jb6QgFiEMfKxG4VM';
      case 'HTH':
        return 'HelpThehomeLesS1Jb6QgFiEMfKxG4VM';
      case 'WTX':
        return 'WYt8WATTxMaker1Jb6QgFiEMfKxG4VM';
      default:
        return '0x742d35Cc23c3a684194D92Bb99c8b77C7516E6Db';
    }
  };

  const getChainIcon = (chain: string) => {
    switch (chain) {
      case 'BTC':
        return <img src="/BTC logo.png" alt="BTC" className="w-6 h-6 object-contain" />;
      case 'ETH':
        return <img src="/ETH logo.png" alt="ETH" className="w-6 h-6 object-contain" />;
      case 'LTC':
        return <img src="/LTC logo.png" alt="LTC" className="w-6 h-6 object-contain" />;
      case 'XMR':
        return <img src="/XMR logo.png" alt="XMR" className="w-6 h-6 object-contain" />;
      case 'ALT':
        return <img src="/Altcoinchain logo.png" alt="ALT" className="w-6 h-6 object-contain rounded-full" />;
      case 'WATT':
        return <img src="/WATT logo.png" alt="WATT" className="w-6 h-6 object-contain" />;
      case 'GHOST':
        return <img src="/GHOST logo.png" alt="GHOST" className="w-6 h-6 object-contain" />;
      case 'TROLL':
        return <img src="/TROLL logo.png" alt="TROLL" className="w-6 h-6 object-contain" />;
      case 'HTH':
        return <img src="/HTH logo.webp" alt="HTH" className="w-6 h-6 object-contain" />;
      case 'WTX':
        return <img src="/WTX logo.png" alt="WTX" className="w-6 h-6 object-contain" />;
      default:
        return <div className="w-6 h-6 bg-slate-600 rounded-full flex items-center justify-center text-xs">{chain[0]}</div>;
    }
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

        {swapStep === 'form' && (
          <div className="space-y-6">
            {/* Swap Type Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium">Swap Type</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setSwapType('evm-to-utxo')}
                  className={`p-3 rounded-lg border transition-colors ${
                    swapType === 'evm-to-utxo'
                      ? 'border-blue-500/50 bg-blue-500/10 text-blue-400'
                      : 'border-slate-700/50 hover:border-slate-600/50'
                  }`}
                >
                  <p className="font-medium">EVM → UTXO</p>
                  <p className="text-xs text-slate-400">ETH to BTC, etc.</p>
                </button>
                <button
                  onClick={() => setSwapType('utxo-to-evm')}
                  className={`p-3 rounded-lg border transition-colors ${
                    swapType === 'utxo-to-evm'
                      ? 'border-blue-500/50 bg-blue-500/10 text-blue-400'
                      : 'border-slate-700/50 hover:border-slate-600/50'
                  }`}
                >
                  <p className="font-medium">UTXO → EVM</p>
                  <p className="text-xs text-slate-400">BTC to ETH, etc.</p>
                </button>
                <button
                  onClick={() => setSwapType('evm-to-evm')}
                  className={`p-3 rounded-lg border transition-colors ${
                    swapType === 'evm-to-evm'
                      ? 'border-blue-500/50 bg-blue-500/10 text-blue-400'
                      : 'border-slate-700/50 hover:border-slate-600/50'
                  }`}
                >
                  <p className="font-medium">EVM ↔ EVM</p>
                  <p className="text-xs text-slate-400">ETH to ALT, etc.</p>
                </button>
              </div>
            </div>

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
                    value={sendChain}
                    onChange={(e) => setSendChain(e.target.value)}
                    className="bg-slate-800 rounded px-3 py-2 outline-none flex items-center space-x-2"
                  >
                    {swapType === 'evm-to-utxo' || swapType === 'evm-to-evm' ? (
                      evmChains.map(chain => (
                        <option key={chain} value={chain}>{chain}</option>
                      ))
                    ) : (
                      utxoChains.map(chain => (
                        <option key={chain} value={chain}>{chain}</option>
                      ))
                    )}
                  </select>
                </div>
                <div className="flex justify-between text-sm text-slate-400">
                  <span>≈ $0.00</span>
                  <span>Balance: 0.00</span>
                </div>
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center">
              <motion.button
                onClick={handleSwapChains}
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
                    value={receiveChain}
                    onChange={(e) => setReceiveChain(e.target.value)}
                    className="bg-slate-800 rounded px-3 py-2 outline-none"
                  >
                    {swapType === 'utxo-to-evm' || swapType === 'evm-to-evm' ? (
                      evmChains.map(chain => (
                        <option key={chain} value={chain}>{chain}</option>
                      ))
                    ) : (
                      utxoChains.map(chain => (
                        <option key={chain} value={chain}>{chain}</option>
                      ))
                    )}
                  </select>
                </div>
                <div className="flex justify-between text-sm text-slate-400">
                  <span>≈ $0.00</span>
                  <span>Balance: 0.00</span>
                </div>
              </div>
            </div>

            {/* Recipient Address */}
            <div className="space-y-3">
              <label className="block text-sm font-medium">Recipient Address</label>
              <input
                type="text"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                placeholder={`Enter ${receiveChain} address...`}
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-3 focus:outline-none focus:border-blue-500/50"
              />
            </div>

            {/* Timelock */}
            <div className="space-y-3">
              <label className="block text-sm font-medium">Timelock (hours)</label>
              <input
                type="number"
                value={timelockHours}
                onChange={(e) => setTimelockHours(e.target.value)}
                min="1"
                max="72"
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-3 focus:outline-none focus:border-blue-500/50"
              />
              <p className="text-xs text-slate-400">
                The swap will automatically expire after this time if not completed.
              </p>
            </div>

            {/* Swap Details */}
            {sendAmount && receiveAmount && (
              <div className="bg-slate-900/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Exchange Rate</span>
                  <span>1 {sendChain} = {(parseFloat(receiveAmount) / parseFloat(sendAmount)).toFixed(6)} {receiveChain}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Timelock</span>
                  <span>{timelockHours} hours</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Network Fee</span>
                  <span>~0.001 {sendChain}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Route</span>
                  <div className="flex items-center space-x-1">
                    <span>{sendChain}</span>
                    <ArrowRight className="w-3 h-3" />
                    <span>{receiveChain}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Create Swap Button */}
            <motion.button
              onClick={handleCreateSwap}
              disabled={isCreatingSwap || !sendAmount || !receiveAmount || !recipientAddress}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {!isConnected ? 'Connect Wallet' : 
               isCreatingSwap ? 'Creating Swap...' :
               'Create Atomic Swap'}
            </motion.button>
          </div>
        )}

        {swapStep === 'created' && currentSwap && (
          <div className="space-y-6">
            <div className="text-center">
              <h4 className="text-lg font-semibold mb-2">Swap Created</h4>
              <p className="text-slate-400">
                {swapType === 'evm-to-utxo' ? 
                  'Send funds to the deposit address below:' : 
                  'Waiting for counterparty to accept the swap...'}
              </p>
            </div>

            {swapType === 'evm-to-utxo' && currentSwap.depositAddress && (
              <div className="flex flex-col items-center space-y-4">
                <div className="bg-white p-4 rounded-lg">
                  <QRCode value={currentSwap.depositAddress} size={200} />
                </div>
                
                <div className="bg-slate-900/50 rounded-lg p-4 w-full">
                  <p className="text-slate-400 text-sm mb-2">Deposit Address</p>
                  <p className="font-mono text-sm break-all">{currentSwap.depositAddress}</p>
                </div>
                
                <div className="bg-slate-900/50 rounded-lg p-4 w-full">
                  <p className="text-slate-400 text-sm mb-2">Amount to Send</p>
                  <p className="font-bold">{currentSwap.sendAmount} {currentSwap.sendToken}</p>
                </div>
                
                <div className="flex items-center space-x-2 text-sm text-yellow-400">
                  <Clock className="w-4 h-4" />
                  <span>Expires in {timelockHours} hours</span>
                </div>
                
                <motion.button
                  onClick={handleConfirmDeposit}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-semibold transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  I've Made the Deposit
                </motion.button>
                
                <motion.button
                  onClick={handleCancelSwap}
                  className="w-full py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel Swap
                </motion.button>
              </div>
            )}

            {swapType === 'utxo-to-evm' && (
              <div className="space-y-4">
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-2">Swap Details</p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Send:</span>
                      <span>{currentSwap.sendAmount} {currentSwap.sendToken}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Receive:</span>
                      <span>{currentSwap.receiveAmount} {currentSwap.receiveToken}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Recipient:</span>
                      <span className="font-mono text-xs">{currentSwap.taker || 'Waiting for taker...'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-2">Secret Key (Keep this safe!)</p>
                  <p className="font-mono text-xs break-all">{currentSwap.secretKey}</p>
                  <p className="text-xs text-yellow-400 mt-2">
                    <AlertTriangle className="w-3 h-3 inline mr-1" />
                    Do not share this key until the swap is completed!
                  </p>
                </div>
                
                <div className="flex items-center space-x-2 text-sm text-yellow-400">
                  <Clock className="w-4 h-4" />
                  <span>Expires in {timelockHours} hours</span>
                </div>
                
                <div className="flex space-x-2">
                  <motion.button
                    onClick={handleCompleteSwap}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-semibold transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Complete Swap
                  </motion.button>
                  
                  <motion.button
                    onClick={handleCancelSwap}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel Swap
                  </motion.button>
                </div>
              </div>
            )}

            {swapType === 'evm-to-evm' && (
              <div className="space-y-4">
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-2">Swap Details</p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Send:</span>
                      <span>{currentSwap.sendAmount} {currentSwap.sendToken}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Receive:</span>
                      <span>{currentSwap.receiveAmount} {currentSwap.receiveToken}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Recipient:</span>
                      <span className="font-mono text-xs">{recipientAddress}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-2">Secret Key (Keep this safe!)</p>
                  <p className="font-mono text-xs break-all">{currentSwap.secretKey}</p>
                  <p className="text-xs text-yellow-400 mt-2">
                    <AlertTriangle className="w-3 h-3 inline mr-1" />
                    Do not share this key until the swap is completed!
                  </p>
                </div>
                
                <div className="flex items-center space-x-2 text-sm text-yellow-400">
                  <Clock className="w-4 h-4" />
                  <span>Expires in {timelockHours} hours</span>
                </div>
                
                <div className="flex space-x-2">
                  <motion.button
                    onClick={handleConfirmDeposit}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-semibold transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Confirm Deposit
                  </motion.button>
                  
                  <motion.button
                    onClick={handleCancelSwap}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel Swap
                  </motion.button>
                </div>
              </div>
            )}
          </div>
        )}

        {swapStep === 'waiting' && currentSwap && (
          <div className="space-y-6">
            <div className="text-center">
              <h4 className="text-lg font-semibold mb-2">Waiting for Completion</h4>
              <p className="text-slate-400">
                The counterparty needs to complete the swap by revealing the secret key.
              </p>
            </div>
            
            <div className="flex justify-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            
            <div className="bg-slate-900/50 rounded-lg p-4">
              <p className="text-slate-400 text-sm mb-2">Swap Details</p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Send:</span>
                  <span>{currentSwap.sendAmount} {currentSwap.sendToken}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Receive:</span>
                  <span>{currentSwap.receiveAmount} {currentSwap.receiveToken}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className="text-yellow-400">Waiting for completion</span>
                </div>
                {currentSwap.txHash && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Transaction:</span>
                    <span className="font-mono text-xs">{currentSwap.txHash.substring(0, 10)}...</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex space-x-2">
              <motion.button
                onClick={handleCompleteSwap}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-semibold transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Complete Swap
              </motion.button>
              
              <motion.button
                onClick={handleCancelSwap}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Cancel Swap
              </motion.button>
            </div>
          </div>
        )}

        {swapStep === 'completed' && currentSwap && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold mb-2">Swap Completed!</h4>
              <p className="text-slate-400">
                The atomic swap has been successfully completed.
              </p>
            </div>
            
            <div className="bg-slate-900/50 rounded-lg p-4">
              <p className="text-slate-400 text-sm mb-2">Swap Details</p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Sent:</span>
                  <span>{currentSwap.sendAmount} {currentSwap.sendToken}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Received:</span>
                  <span>{currentSwap.receiveAmount} {currentSwap.receiveToken}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className="text-emerald-400">Completed</span>
                </div>
                {currentSwap.txHash && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Transaction:</span>
                    <span className="font-mono text-xs">{currentSwap.txHash.substring(0, 10)}...</span>
                  </div>
                )}
              </div>
            </div>
            
            <motion.button
              onClick={() => {
                setCurrentSwap(null);
                setSwapStep('form');
                setSendAmount('');
                setReceiveAmount('');
                setRecipientAddress('');
              }}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Create New Swap
            </motion.button>
          </div>
        )}
      </motion.div>

      {/* Swap Information */}
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
        {/* Swap Type Info */}
        <div className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
          <h4 className="text-lg font-semibold mb-4">
            {swapType === 'evm-to-utxo' ? 'EVM to UTXO Swap' :
             swapType === 'utxo-to-evm' ? 'UTXO to EVM Swap' :
             'EVM to EVM Swap'}
          </h4>
          
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="flex flex-col items-center">
              {getChainIcon(sendChain)}
              <span className="mt-2 font-medium">{sendChain}</span>
            </div>
            <ArrowRight className="w-6 h-6 text-slate-400" />
            <div className="flex flex-col items-center">
              {getChainIcon(receiveChain)}
              <span className="mt-2 font-medium">{receiveChain}</span>
            </div>
          </div>
          
          <p className="text-slate-300 mb-4">
            {swapType === 'evm-to-utxo' ? 
              `This swap allows you to exchange ${sendChain} for ${receiveChain} in a trustless manner using atomic swaps. You'll lock your ${sendChain} in a smart contract, and the counterparty will send ${receiveChain} to your address.` :
             swapType === 'utxo-to-evm' ?
              `This swap allows you to exchange ${sendChain} for ${receiveChain} in a trustless manner using atomic swaps. You'll send ${sendChain} to a deposit address, and the counterparty will release ${receiveChain} from a smart contract.` :
              `This swap allows you to exchange ${sendChain} for ${receiveChain} in a trustless manner using atomic swaps. Both tokens will be locked in smart contracts and released simultaneously.`}
          </p>
          
          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <Clock className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <p className="font-medium">Time-Locked Contracts</p>
                <p className="text-sm text-slate-400">Funds are locked for a specified time period, ensuring both parties have time to complete the swap.</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <Shield className="w-5 h-5 text-emerald-400 mt-0.5" />
              <div>
                <p className="font-medium">Trustless Security</p>
                <p className="text-sm text-slate-400">The swap uses cryptographic hash locks to ensure that either both parties receive their funds or neither does.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Chain-Specific Info */}
        {swapType === 'evm-to-utxo' && (
          <div className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
            <h4 className="text-lg font-semibold mb-4">{receiveChain} Information</h4>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                {getChainIcon(receiveChain)}
                <div>
                  <p className="font-medium">{receiveChain}</p>
                  <p className="text-sm text-slate-400">
                    {receiveChain === 'BTC' ? 'Bitcoin' :
                     receiveChain === 'LTC' ? 'Litecoin' :
                     receiveChain === 'XMR' ? 'Monero' :
                     receiveChain === 'GHOST' ? 'GHOST' :
                     receiveChain === 'TROLL' ? 'Trollcoin' :
                     receiveChain === 'HTH' ? 'Help The Homeless' :
                     receiveChain === 'WTX' ? 'WATTx' : receiveChain}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Confirmations Required:</span>
                  <span>
                    {receiveChain === 'BTC' ? '2 confirmations' :
                     receiveChain === 'LTC' ? '6 confirmations' :
                     receiveChain === 'XMR' ? '10 confirmations' :
                     receiveChain === 'GHOST' ? '10 confirmations' :
                     receiveChain === 'TROLL' ? '6 confirmations' :
                     receiveChain === 'HTH' ? '6 confirmations' :
                     receiveChain === 'WTX' ? '3 confirmations' : '1 confirmation'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Estimated Time:</span>
                  <span>
                    {receiveChain === 'BTC' ? '~20 minutes' :
                     receiveChain === 'LTC' ? '~15 minutes' :
                     receiveChain === 'XMR' ? '~20 minutes' :
                     receiveChain === 'GHOST' ? '~5 minutes' :
                     receiveChain === 'TROLL' ? '~10 minutes' :
                     receiveChain === 'HTH' ? '~10 minutes' :
                     receiveChain === 'WTX' ? '~6 minutes' : '~5 minutes'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Network Fee:</span>
                  <span>
                    {receiveChain === 'BTC' ? '~0.0001 BTC' :
                     receiveChain === 'LTC' ? '~0.001 LTC' :
                     receiveChain === 'XMR' ? '~0.0001 XMR' :
                     receiveChain === 'GHOST' ? '~0.01 GHOST' :
                     receiveChain === 'TROLL' ? '~1 TROLL' :
                     receiveChain === 'HTH' ? '~0.01 HTH' :
                     receiveChain === 'WTX' ? '~0.001 WTX' : '~0.001'}
                  </span>
                </div>
              </div>
              
              {receiveChain === 'GHOST' && (
                <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                  <p className="text-purple-400 text-sm">
                    <strong>GHOST uses Proof-of-Stake consensus.</strong> Swaps may take longer due to block validation times.
                    Ensure sufficient network confirmations for secure atomic swaps.
                  </p>
                </div>
              )}
              
              {receiveChain === 'TROLL' && (
                <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                  <p className="text-orange-400 text-sm">
                    <strong>Trollcoin uses Proof-of-Work consensus with Scrypt algorithm.</strong> Mining-based validation 
                    provides strong security for atomic swap transactions.
                  </p>
                </div>
              )}
              
              {receiveChain === 'HTH' && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-blue-400 text-sm">
                    <strong>Help The Homeless uses a hybrid PoW/Masternode consensus.</strong>
                    Masternode network provides additional security and faster transaction validation
                    for atomic swaps.
                  </p>
                </div>
              )}

              {receiveChain === 'WTX' && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <p className="text-amber-400 text-sm">
                    <strong>WATTx is a Qtum-based blockchain with smart contract support.</strong>
                    It uses a hybrid PoS/Prime Gap mining consensus (Gapcoin algorithm) providing
                    both EVM compatibility and UTXO transaction model for secure atomic swaps.
                    ElectrumX server: electrum.wattxchange.app
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Security Notice */}
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

export default AtomicSwapForm;