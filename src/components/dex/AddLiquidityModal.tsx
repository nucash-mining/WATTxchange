import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, ArrowDown, AlertTriangle, Info, Wallet, RefreshCw } from 'lucide-react';
import { useWallet } from '../../hooks/useWallet';
import { swapinService } from '../../services/swapinService';
import toast from 'react-hot-toast';

interface AddLiquidityModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPool?: any;
}

const AddLiquidityModal: React.FC<AddLiquidityModalProps> = ({ isOpen, onClose, selectedPool }) => {
  const [token1Amount, setToken1Amount] = useState('');
  const [token2Amount, setToken2Amount] = useState('');
  const [token1, setToken1] = useState<any>(null);
  const [token2, setToken2] = useState<any>(null);
  const [token1Balance, setToken1Balance] = useState('0');
  const [token2Balance, setToken2Balance] = useState('0');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<any>(null);
  const { isConnected, address, chainId, switchToAltcoinchain } = useWallet();

  // Initialize with selected pool or default values
  useEffect(() => {
    if (isOpen) {
      if (selectedPool) {
        // Set tokens based on selected pool
        setToken1({
          symbol: selectedPool.token1,
          name: selectedPool.token1,
          icon: selectedPool.token1Icon
        });
        
        setToken2({
          symbol: selectedPool.token2,
          name: selectedPool.token2,
          icon: selectedPool.token2Icon
        });
        
        // Set network
        const network = swapinService.getNetwork(selectedPool.chainId);
        setSelectedNetwork(network);
        
        // Reset amounts
        setToken1Amount('');
        setToken2Amount('');
      } else {
        // Default to Altcoinchain network
        const altcoinchain = swapinService.getNetwork(2330);
        setSelectedNetwork(altcoinchain);
        
        // Default tokens
        setToken1({
          symbol: 'ALT',
          name: 'Altcoinchain',
          icon: () => <img src="/Altcoinchain logo.png" alt="ALT" className="w-6 h-6 object-contain rounded-full" />
        });
        
        setToken2({
          symbol: 'WATT',
          name: 'WATT Token',
          icon: () => <img src="/WATT logo.png" alt="WATT" className="w-6 h-6 object-contain" />
        });
      }
      
      // Simulate fetching balances
      simulateFetchBalances();
    }
  }, [isOpen, selectedPool]);

  const simulateFetchBalances = () => {
    // Simulate API call to get balances
    setToken1Balance((Math.random() * 100).toFixed(4));
    setToken2Balance((Math.random() * 1000).toFixed(4));
  };

  const handleToken1AmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setToken1Amount(value);
    
    // Calculate token2 amount based on price ratio (simplified)
    if (value && !isNaN(parseFloat(value))) {
      const ratio = 1.5; // Example ratio, would be fetched from pool or price oracle
      setToken2Amount((parseFloat(value) * ratio).toFixed(6));
    } else {
      setToken2Amount('');
    }
  };

  const handleToken2AmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setToken2Amount(value);
    
    // Calculate token1 amount based on price ratio (simplified)
    if (value && !isNaN(parseFloat(value))) {
      const ratio = 0.667; // Inverse of the above ratio
      setToken1Amount((parseFloat(value) * ratio).toFixed(6));
    } else {
      setToken1Amount('');
    }
  };

  const handleAddLiquidity = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }
    
    if (!token1Amount || !token2Amount) {
      toast.error('Please enter both token amounts');
      return;
    }
    
    // Check if user is on the correct network
    if (chainId !== selectedNetwork?.chainId) {
      try {
        const switched = await swapinService.switchToNetwork(selectedNetwork.chainId);
        if (!switched) {
          toast.error(`Please switch to ${selectedNetwork.name} network`);
          return;
        }
      } catch (error) {
        toast.error('Failed to switch network');
        return;
      }
    }
    
    setIsLoading(true);
    
    try {
      // Simulate adding liquidity
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Liquidity added successfully!');
      onClose();
    } catch (error) {
      console.error('Failed to add liquidity:', error);
      toast.error('Failed to add liquidity');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMaxToken1 = () => {
    setToken1Amount(token1Balance);
    const ratio = 1.5; // Example ratio
    setToken2Amount((parseFloat(token1Balance) * ratio).toFixed(6));
  };

  const handleMaxToken2 = () => {
    setToken2Amount(token2Balance);
    const ratio = 0.667; // Inverse ratio
    setToken1Amount((parseFloat(token2Balance) * ratio).toFixed(6));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <AnimatePresence>
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
              <h3 className="text-xl font-semibold">Add Liquidity</h3>
              <p className="text-slate-400 text-sm">
                {selectedNetwork?.name || 'Select Network'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Network Info */}
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center">
                    <span className="text-lg">{selectedNetwork?.name === 'Altcoinchain' ? '🔗' : '🌐'}</span>
                  </div>
                  <div>
                    <p className="font-medium">{selectedNetwork?.name}</p>
                    <p className="text-xs text-slate-400">Chain ID: {selectedNetwork?.chainId}</p>
                  </div>
                </div>
                
                {chainId !== selectedNetwork?.chainId && (
                  <button
                    onClick={() => swapinService.switchToNetwork(selectedNetwork?.chainId)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs transition-colors"
                  >
                    Switch Network
                  </button>
                )}
              </div>
            </div>

            {/* Token 1 Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">You Provide</label>
                <div className="flex items-center space-x-1 text-xs text-slate-400">
                  <span>Balance: {token1Balance}</span>
                  <button
                    onClick={handleMaxToken1}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    MAX
                  </button>
                </div>
              </div>
              
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    value={token1Amount}
                    onChange={handleToken1AmountChange}
                    placeholder="0.0"
                    className="flex-1 bg-transparent text-xl font-bold outline-none"
                  />
                  
                  <div className="flex items-center space-x-2 bg-slate-800 rounded-lg px-3 py-2">
                    {token1?.icon && <token1.icon />}
                    <span>{token1?.symbol}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Plus Icon */}
            <div className="flex justify-center">
              <div className="bg-slate-800 rounded-full p-2">
                <Plus className="w-5 h-5" />
              </div>
            </div>

            {/* Token 2 Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">You Provide</label>
                <div className="flex items-center space-x-1 text-xs text-slate-400">
                  <span>Balance: {token2Balance}</span>
                  <button
                    onClick={handleMaxToken2}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    MAX
                  </button>
                </div>
              </div>
              
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    value={token2Amount}
                    onChange={handleToken2AmountChange}
                    placeholder="0.0"
                    className="flex-1 bg-transparent text-xl font-bold outline-none"
                  />
                  
                  <div className="flex items-center space-x-2 bg-slate-800 rounded-lg px-3 py-2">
                    {token2?.icon && <token2.icon />}
                    <span>{token2?.symbol}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pool Information */}
            {token1Amount && token2Amount && (
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Exchange Rate</span>
                  <span>1 {token1?.symbol} = {(parseFloat(token2Amount) / parseFloat(token1Amount)).toFixed(6)} {token2?.symbol}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Share of Pool</span>
                  <span>~0.01%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Estimated APR</span>
                  <span className="text-emerald-400">24.5%</span>
                </div>
              </div>
            )}

            {/* Altcoinchain Info */}
            {selectedNetwork?.name === 'Altcoinchain' && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <Info className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-blue-400 font-medium">Altcoinchain Liquidity</p>
                    <p className="text-sm text-slate-300 mt-1">
                      You're adding liquidity on Altcoinchain using Swapin.co's Uniswap V2 compatible contracts.
                      {selectedPool?.address && (
                        <span> Pool address: <span className="font-mono text-xs">{selectedPool.address}</span></span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Warning */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                <div>
                  <p className="text-yellow-400 font-medium">Price Impact Warning</p>
                  <p className="text-sm text-slate-300 mt-1">
                    When you add liquidity, you will receive pool tokens representing your position.
                    These tokens automatically earn fees proportional to your share of the pool and can be redeemed at any time.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              onClick={handleAddLiquidity}
              disabled={isLoading || !token1Amount || !token2Amount || !isConnected}
              className="w-full flex items-center justify-center space-x-2 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Adding Liquidity...</span>
                </>
              ) : !isConnected ? (
                <>
                  <Wallet className="w-5 h-5" />
                  <span>Connect Wallet</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  <span>Add Liquidity</span>
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default AddLiquidityModal;