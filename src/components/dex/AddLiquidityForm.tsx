import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, ArrowDown, AlertTriangle, Info, Wallet, RefreshCw } from 'lucide-react';
import { useWallet } from '../../hooks/useWallet';
import { swapinService } from '../../services/swapinService';
import TokenSelector from './TokenSelector';
import toast from 'react-hot-toast';

interface AddLiquidityFormProps {
  selectedPool?: any;
  onClose: () => void;
  chainId: number;
}

const AddLiquidityForm: React.FC<AddLiquidityFormProps> = ({ selectedPool, onClose, chainId }) => {
  const [token1Amount, setToken1Amount] = useState('');
  const [token2Amount, setToken2Amount] = useState('');
  const [token1, setToken1] = useState(selectedPool ? selectedPool.token0 : 'ALT');
  const [token2, setToken2] = useState(selectedPool ? selectedPool.token1 : 'WATT');
  const [token1Balance, setToken1Balance] = useState('0');
  const [token2Balance, setToken2Balance] = useState('0');
  const [isLoading, setIsLoading] = useState(false);
  const [feeTier, setFeeTier] = useState(selectedPool ? selectedPool.fee : 0.3);
  const { isConnected, address, switchToAltcoinchain } = useWallet();

  // Initialize with selected pool or default values
  useEffect(() => {
    if (selectedPool) {
      // Set tokens based on selected pool
      setToken1(selectedPool.token0);
      setToken2(selectedPool.token1);
      setFeeTier(selectedPool.fee);
    }
    
    // Simulate fetching balances
    simulateFetchBalances();
  }, [selectedPool]);

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
    if (chainId !== 2330) {
      try {
        const switched = await switchToAltcoinchain();
        if (!switched) {
          toast.error('Please switch to Altcoinchain network');
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

  const handleToken1Change = (newToken: string) => {
    setToken1(newToken);
    // Reset amounts when token changes
    setToken1Amount('');
    setToken2Amount('');
    // Simulate fetching new balances
    simulateFetchBalances();
  };

  const handleToken2Change = (newToken: string) => {
    setToken2(newToken);
    // Reset amounts when token changes
    setToken1Amount('');
    setToken2Amount('');
    // Simulate fetching new balances
    simulateFetchBalances();
  };

  return (
    <div className="space-y-6">
      {/* Fee Tier Selection (for new pools) */}
      {!selectedPool && (
        <div>
          <label className="block text-sm font-medium mb-2">Fee Tier</label>
          <div className="grid grid-cols-4 gap-2">
            {[0.01, 0.05, 0.3, 1.0].map((fee) => (
              <button
                key={fee}
                onClick={() => setFeeTier(fee)}
                className={`p-3 border rounded-lg text-center transition-colors ${
                  feeTier === fee
                    ? 'bg-blue-600/20 border-blue-500/50 text-blue-400'
                    : 'bg-slate-900/50 border-slate-700/50 hover:border-blue-500/50'
                }`}
              >
                <div className="font-medium">{fee}%</div>
                <div className="text-xs text-slate-400">
                  {fee === 0.01 ? 'Stable Pairs' : 
                   fee === 0.05 ? 'Standard' : 
                   fee === 0.3 ? 'Most Pairs' : 
                   'Exotic Pairs'}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Token 1 Input */}
      <div>
        <div className="flex items-center justify-between mb-2">
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
            
            <TokenSelector
              selectedToken={token1}
              onSelectToken={handleToken1Change}
              excludeToken={token2}
              chainId={chainId}
            />
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
      <div>
        <div className="flex items-center justify-between mb-2">
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
            
            <TokenSelector
              selectedToken={token2}
              onSelectToken={handleToken2Change}
              excludeToken={token1}
              chainId={chainId}
            />
          </div>
        </div>
      </div>

      {/* Price Range (simplified) */}
      <div>
        <label className="block text-sm font-medium mb-2">Price Range</label>
        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm">Full Range</span>
            <div className="flex items-center space-x-1">
              <input type="checkbox" checked className="rounded" />
              <span className="text-sm">Use full range</span>
            </div>
          </div>
          <p className="text-xs text-slate-400">
            Liquidity will be allocated across the full price range, earning fees on all trades but with less capital efficiency.
          </p>
        </div>
      </div>

      {/* Pool Information */}
      {token1Amount && token2Amount && (
        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Exchange Rate</span>
            <span>1 {token1} = {(parseFloat(token2Amount) / parseFloat(token1Amount)).toFixed(6)} {token2}</span>
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
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <Info className="w-5 h-5 text-blue-400 mt-0.5" />
          <div>
            <p className="text-blue-400 font-medium">Altcoinchain Liquidity</p>
            <p className="text-sm text-slate-300 mt-1">
              You're adding liquidity on Altcoinchain using Swapin.co's Uniswap V4 compatible contracts.
              {selectedPool?.address && (
                <span> Pool address: <span className="font-mono text-xs">{selectedPool.address}</span></span>
              )}
            </p>
          </div>
        </div>
      </div>

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
  );
};

export default AddLiquidityForm;