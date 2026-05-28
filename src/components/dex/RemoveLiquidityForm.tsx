import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Minus, RefreshCw, AlertTriangle, Info } from 'lucide-react';
import { useWallet } from '../../hooks/useWallet';
import toast from 'react-hot-toast';

interface Position {
  id: string;
  pool: {
    token0: string;
    token1: string;
    fee: number;
  };
  liquidity: string;
  token0Amount: string;
  token1Amount: string;
  uncollectedFees: string;
}

interface RemoveLiquidityFormProps {
  position: Position;
  onClose: () => void;
}

const RemoveLiquidityForm: React.FC<RemoveLiquidityFormProps> = ({ position, onClose }) => {
  const [removeAmount, setRemoveAmount] = useState(50); // percentage
  const [isLoading, setIsLoading] = useState(false);
  const [collectFees, setCollectFees] = useState(true);
  const { isConnected, switchToAltcoinchain, signTransaction } = useWallet();

  const getTokenIcon = (symbol: string) => {
    switch (symbol) {
      case 'ALT':
        return <img src="/Altcoinchain logo.png" alt="ALT" className="w-6 h-6 object-contain rounded-full" />;
      case 'wALT':
        return <img src="/Altcoinchain logo.png" alt="wALT" className="w-6 h-6 object-contain rounded-full" />;
      case 'WATT':
        return <img src="/WATT logo.png" alt="WATT" className="w-6 h-6 object-contain" />;
      case 'AltPEPE':
        return <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold">P</div>;
      case 'AltPEPI':
        return <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center text-xs font-bold">P</div>;
      case 'SCAM':
        return <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold">S</div>;
      case 'SWAPD':
        return <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs font-bold">S</div>;
      case 'MALT':
        return <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold">M</div>;
      case 'USDT':
        return <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-xs font-bold">U</div>;
      default:
        return <div className="w-6 h-6 bg-slate-500 rounded-full flex items-center justify-center text-xs font-bold">{symbol[0]}</div>;
    }
  };

  const handleRemoveLiquidity = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Create transaction details for signing
      const transactionDetails = {
        type: 'removeLiquidity',
        positionId: position.id,
        token0: position.pool.token0,
        token1: position.pool.token1,
        removePercentage: removeAmount,
        collectFees
      };

      // Request permission to sign the transaction
      const signed = await signTransaction(transactionDetails);
      
      if (signed) {
        toast.success(`Removed ${removeAmount}% of your liquidity`);
        if (collectFees) {
          toast.success(`Collected ${position.uncollectedFees} in fees`);
        }
        onClose();
      } else {
        toast.error('Transaction cancelled or failed');
      }
    } catch (error) {
      console.error('Failed to remove liquidity:', error);
      toast.error('Failed to remove liquidity');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate token amounts based on removal percentage
  const token0Amount = parseFloat(position.token0Amount.replace(/,/g, '')) * removeAmount / 100;
  const token1Amount = parseFloat(position.token1Amount.replace(/,/g, '')) * removeAmount / 100;

  return (
    <div className="space-y-6">
      {/* Position Info */}
      <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              {getTokenIcon(position.pool.token0)}
              {getTokenIcon(position.pool.token1)}
            </div>
            <h4 className="font-semibold">{position.pool.token0}/{position.pool.token1}</h4>
            <span className="text-xs bg-slate-700/50 px-2 py-1 rounded">
              {position.pool.fee}%
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-slate-400 text-sm">Liquidity</p>
            <p className="font-bold">{position.liquidity}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Uncollected Fees</p>
            <p className="font-bold text-emerald-400">{position.uncollectedFees}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">{position.pool.token0}</p>
            <p className="font-bold">{position.token0Amount}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">{position.pool.token1}</p>
            <p className="font-bold">{position.token1Amount}</p>
          </div>
        </div>
      </div>

      {/* Amount to Remove */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">Amount to Remove</label>
          <span className="text-sm">{removeAmount}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={removeAmount}
          onChange={(e) => setRemoveAmount(parseInt(e.target.value))}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between mt-1 text-xs text-slate-400">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* You Will Receive */}
      <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
        <h4 className="font-medium mb-3">You Will Receive</h4>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              {getTokenIcon(position.pool.token0)}
              <span>{position.pool.token0}</span>
            </div>
            <span className="font-medium">
              {token0Amount.toFixed(4)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              {getTokenIcon(position.pool.token1)}
              <span>{position.pool.token1}</span>
            </div>
            <span className="font-medium">
              {token1Amount.toFixed(4)}
            </span>
          </div>
        </div>
      </div>

      {/* Collect Fees Option */}
      <div className="flex items-center space-x-2">
        <input 
          type="checkbox" 
          checked={collectFees} 
          onChange={() => setCollectFees(!collectFees)}
          className="rounded" 
        />
        <label className="text-sm">Collect {position.uncollectedFees} in uncollected fees</label>
      </div>

      {/* Info */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <Info className="w-5 h-5 text-blue-400 mt-0.5" />
          <div>
            <p className="text-blue-400 font-medium">Removing Liquidity</p>
            <p className="text-sm text-slate-300 mt-1">
              When you remove liquidity, your position tokens are burned and you receive the underlying assets back.
              You can also collect any uncollected fees earned by your position.
            </p>
          </div>
        </div>
      </div>

      {/* Transaction Signing Notice */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
          <div>
            <p className="text-yellow-400 font-medium">Transaction Signing Required</p>
            <p className="text-sm text-slate-300 mt-1">
              Removing liquidity requires signing a transaction with your wallet. You'll need to confirm the transaction
              to withdraw your tokens. Make sure to review all details before signing.
            </p>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <motion.button
        onClick={handleRemoveLiquidity}
        disabled={isLoading || removeAmount === 0}
        className="w-full flex items-center justify-center space-x-2 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors disabled:opacity-50"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {isLoading ? (
          <>
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Removing Liquidity...</span>
          </>
        ) : (
          <>
            <Minus className="w-5 h-5" />
            <span>Remove Liquidity</span>
          </>
        )}
      </motion.button>
    </div>
  );
};

export default RemoveLiquidityForm;