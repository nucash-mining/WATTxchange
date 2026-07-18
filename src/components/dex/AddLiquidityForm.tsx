import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, AlertTriangle, Info, Wallet, RefreshCw } from 'lucide-react';
import { useWallet } from '../../hooks/useWallet';
import { ammV2Service, type PairInfo } from '../../services/ammV2Service';
import TokenSelector from './TokenSelector';
import toast from 'react-hot-toast';

interface AddLiquidityFormProps {
  selectedPool?: {
    id: string;
    name: string;
    token0: string;
    token1: string;
    reserve0: string;
    reserve1: string;
    totalSupply: string;
  };
  onClose: () => void;
  chainId: number;
}

const SLIPPAGE_PCT = 1;

const AddLiquidityForm: React.FC<AddLiquidityFormProps> = ({ selectedPool, onClose, chainId }) => {
  const [token1Amount, setToken1Amount] = useState('');
  const [token2Amount, setToken2Amount] = useState('');
  const [token1, setToken1] = useState(selectedPool ? selectedPool.token0 : 'ALT');
  const [token2, setToken2] = useState(selectedPool ? selectedPool.token1 : 'WATT');
  const [token1Balance, setToken1Balance] = useState<string | null>(null);
  const [token2Balance, setToken2Balance] = useState<string | null>(null);
  const [pairInfo, setPairInfo] = useState<PairInfo | null>(null);
  const [pairLoaded, setPairLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { isConnected, address, chainId: walletChainId, signer, switchToAltcoinchain, connectWallet } = useWallet();

  // Live pool state + wallet balances for the selected pair
  const refreshPair = useCallback(async () => {
    setPairLoaded(false);
    setPairInfo(null);
    try {
      const info = await ammV2Service.getPairInfo(token1, token2);
      setPairInfo(info);
    } catch (error) {
      console.warn('AddLiquidity: pair lookup failed', error);
    } finally {
      setPairLoaded(true);
    }
  }, [token1, token2]);

  useEffect(() => {
    void refreshPair();
  }, [refreshPair]);

  useEffect(() => {
    let cancelled = false;
    if (!address) {
      setToken1Balance(null);
      setToken2Balance(null);
      return;
    }
    (async () => {
      try {
        const [b1, b2] = await Promise.all([
          ammV2Service.balanceOf(address, token1),
          ammV2Service.balanceOf(address, token2),
        ]);
        if (!cancelled) {
          setToken1Balance(b1);
          setToken2Balance(b2);
        }
      } catch (error) {
        console.warn('AddLiquidity: balance fetch failed', error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [address, token1, token2]);

  const rate = pairInfo && pairInfo.rate > 0 ? pairInfo.rate : null;

  const handleToken1AmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setToken1Amount(value);
    if (rate && value && !isNaN(parseFloat(value))) {
      setToken2Amount((parseFloat(value) * rate).toFixed(6));
    } else if (rate) {
      setToken2Amount('');
    }
  };

  const handleToken2AmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setToken2Amount(value);
    if (rate && value && !isNaN(parseFloat(value))) {
      setToken1Amount((parseFloat(value) / rate).toFixed(6));
    } else if (rate) {
      setToken1Amount('');
    }
  };

  const handleAddLiquidity = async () => {
    if (!isConnected) {
      connectWallet();
      return;
    }
    if (!token1Amount || !token2Amount) {
      toast.error('Please enter both token amounts');
      return;
    }
    if (walletChainId !== 2330) {
      const switched = await switchToAltcoinchain().catch(() => false);
      if (!switched) {
        toast.error('Please switch to Altcoinchain network');
        return;
      }
    }
    if (!signer) {
      toast.error('Wallet signer unavailable — reconnect your wallet');
      return;
    }

    setIsLoading(true);
    try {
      const txHash = await ammV2Service.addLiquidity(
        signer,
        token1,
        token2,
        token1Amount,
        token2Amount,
        SLIPPAGE_PCT
      );
      toast.success(`Liquidity added — ${txHash.slice(0, 14)}…`);
      onClose();
    } catch (error: any) {
      console.error('Failed to add liquidity:', error);
      const msg = error?.shortMessage || error?.reason || error?.message || '';
      toast.error(
        /user rejected|denied/i.test(msg)
          ? 'Transaction cancelled in wallet'
          : `Add liquidity failed: ${msg.slice(0, 120)}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleMaxToken1 = () => {
    if (!token1Balance) return;
    setToken1Amount(token1Balance);
    if (rate) setToken2Amount((parseFloat(token1Balance) * rate).toFixed(6));
  };

  const handleMaxToken2 = () => {
    if (!token2Balance) return;
    setToken2Amount(token2Balance);
    if (rate) setToken1Amount((parseFloat(token2Balance) / rate).toFixed(6));
  };

  const handleToken1Change = (newToken: string) => {
    setToken1(newToken);
    setToken1Amount('');
    setToken2Amount('');
  };

  const handleToken2Change = (newToken: string) => {
    setToken2(newToken);
    setToken1Amount('');
    setToken2Amount('');
  };

  const fmtBalance = (b: string | null) =>
    b === null ? '—' : parseFloat(b).toLocaleString(undefined, { maximumFractionDigits: 4 });

  const shareOfPool =
    pairInfo && token1Amount && parseFloat(token1Amount) > 0
      ? parseFloat(token1Amount) / (parseFloat(pairInfo.reserveA) + parseFloat(token1Amount))
      : null;

  return (
    <div className="space-y-6">
      {/* Token 1 Input */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">You Provide</label>
          <div className="flex items-center space-x-1 text-xs text-slate-400">
            <span>Balance: {fmtBalance(token1Balance)}</span>
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
            <span>Balance: {fmtBalance(token2Balance)}</span>
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

      {/* New-pool notice */}
      {pairLoaded && !pairInfo && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
            <p className="text-sm text-slate-300">
              This pair has no pool yet. Adding liquidity creates it, and the ratio of your two
              amounts sets the <span className="text-amber-400">initial price</span> — double-check it.
            </p>
          </div>
        </div>
      )}

      {/* Pool Information */}
      {token1Amount && token2Amount && (
        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Exchange Rate</span>
            <span>1 {token1} = {(parseFloat(token2Amount) / parseFloat(token1Amount)).toFixed(6)} {token2}</span>
          </div>
          {rate && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Pool Rate</span>
              <span>1 {token1} = {rate.toFixed(6)} {token2}</span>
            </div>
          )}
          {shareOfPool !== null && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Share of Pool</span>
              <span>{(shareOfPool * 100).toFixed(shareOfPool < 0.0001 ? 6 : 4)}%</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">LP Fee Tier</span>
            <span>0.3% (Uniswap V2)</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Slippage Tolerance</span>
            <span>{SLIPPAGE_PCT}%</span>
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
              You're adding liquidity on Altcoinchain using Swapin.co's Uniswap V2 compatible contracts.
              Fees accrue to your LP tokens automatically on every trade.
              {pairInfo && (
                <span> Pool address: <span className="font-mono text-xs">{pairInfo.pairAddress}</span></span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <motion.button
        onClick={handleAddLiquidity}
        disabled={isLoading || (isConnected && (!token1Amount || !token2Amount))}
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
