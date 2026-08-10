// WATT <-> WTX bridge panel: swap WATT on Polygon / Altcoinchain / BSV
// against native WTX on WATTxchain at the desk's posted rate.
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowDownUp, Zap, Copy, RefreshCw } from 'lucide-react';
import { useWallet } from '../../hooks/useWallet';
import {
  wattWtxBridgeService,
  type BridgeInfo,
  type BridgeSwap,
  type BridgeChainKey,
} from '../../services/wattWtxBridgeService';

const cardCls = 'bg-gray-900/80 border border-gray-800 rounded-xl p-5';
const inputCls =
  'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:border-yellow-500 focus:outline-none';
const btnCls =
  'inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed';

const CHAIN_LABELS: Record<BridgeChainKey, string> = {
  alt: 'Altcoinchain',
  polygon: 'Polygon',
  bsv: 'BSV',
};

const ACTIVE_STATES = ['created', 'locked', 'paying', 'paid', 'claiming', 'received'];

const STATE_TEXT: Record<string, string> = {
  created: 'waiting for your deposit / lock',
  locked: 'lock detected — desk is paying WTX',
  paying: 'payout in flight',
  paid: 'WTX paid — desk claiming the lock',
  claiming: 'desk claiming the lock',
  received: 'deposit confirmed — payout next',
  completed: 'completed',
  refunded: 'refunded to sender',
  expired: 'expired (no deposit seen)',
  expired_lock: 'lock timed out — refund it on-chain',
  invalid_lock: 'lock did not match the intent — refund after timeout',
  needs_review: 'held for operator review',
  awaiting_float: 'queued: desk float refilling',
};

function loadIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem('wattWtxSwaps') ?? '[]') as string[];
  } catch {
    return [];
  }
}

function copy(text: string, label: string) {
  void navigator.clipboard.writeText(text);
  toast.success(`${label} copied`);
}

export default function WattWtxBridge() {
  const wallet = useWallet();
  const [info, setInfo] = useState<BridgeInfo | null>(null);
  const [infoError, setInfoError] = useState<string | null>(null);
  const [direction, setDirection] = useState<'WATT_TO_WTX' | 'WTX_TO_WATT' | 'EVM_TO_EVM'>('WATT_TO_WTX');
  const [chainKey, setChainKey] = useState<BridgeChainKey>('alt');
  const [destChainKey, setDestChainKey] = useState<BridgeChainKey>('polygon');
  const [amount, setAmount] = useState('');
  const [destAddr, setDestAddr] = useState('');
  const [busy, setBusy] = useState(false);
  const [swapIds, setSwapIds] = useState<string[]>(loadIds);
  const [swaps, setSwaps] = useState<Record<string, BridgeSwap>>({});

  const refreshInfo = useCallback(async () => {
    try {
      setInfo(await wattWtxBridgeService.info());
      setInfoError(null);
    } catch (e) {
      setInfoError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    void refreshInfo();
  }, [refreshInfo]);

  // poll tracked swaps while any is active
  useEffect(() => {
    let stop = false;
    const poll = async () => {
      const next: Record<string, BridgeSwap> = {};
      for (const id of swapIds) {
        try {
          const s = await wattWtxBridgeService.getSwap(id);
          if (s) next[id] = s;
        } catch {
          /* daemon offline — keep last known */
        }
      }
      if (!stop) setSwaps((prev) => ({ ...prev, ...next }));
    };
    void poll();
    const t = setInterval(() => {
      if (swapIds.some((id) => !swaps[id] || ACTIVE_STATES.includes(swaps[id].state))) void poll();
    }, 10000);
    return () => {
      stop = true;
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [swapIds]);

  const track = (id: string) => {
    const next = [id, ...swapIds].slice(0, 20);
    setSwapIds(next);
    localStorage.setItem('wattWtxSwaps', JSON.stringify(next));
  };

  const evmChains = useMemo(
    () =>
      Object.entries(info?.chains ?? {}).filter(([, c]) => c.enabled) as [
        BridgeChainKey,
        BridgeInfo['chains'][string],
      ][],
    [info]
  );
  const chainChoices: BridgeChainKey[] = useMemo(() => {
    const keys = evmChains.map(([k]) => k);
    if (info?.bsv.enabled) keys.push('bsv');
    return keys;
  }, [evmChains, info]);

  const rate = info?.rate.wtxPerWatt ?? 1;
  const feePct = (info?.rate.feeBps ?? 0) / 100;
  const estimate = useMemo(() => {
    const a = Number(amount);
    if (!Number.isFinite(a) || a <= 0) return null;
    const gross = direction === 'WATT_TO_WTX' ? a * rate : direction === 'WTX_TO_WATT' ? a / rate : a;
    return gross * (1 - feePct / 100);
  }, [amount, direction, rate, feePct]);

  const startSwap = async () => {
    setBusy(true);
    try {
      if (!info) throw new Error('bridge desk unreachable');
      if (direction === 'WATT_TO_WTX') {
        if (!destAddr.trim()) throw new Error('Enter your WTX (WATTxchain) address');
        const swap = await wattWtxBridgeService.createSwap({
          direction,
          sourceChain: chainKey,
          wtxAddress: destAddr.trim(),
        });
        track(swap.id);
        if (chainKey === 'bsv') {
          toast.success('Deposit address created — send WATT (BSV-21) to it');
        } else {
          // EVM leg: approve + lock in one go if the wallet is ready
          const chain = info.chains[chainKey];
          if (!wallet.isConnected || !wallet.signer) {
            toast('Intent created. Connect your wallet and lock from the tracker below.', { icon: 'ℹ️' });
          } else if (wallet.chainId !== chain.chainId) {
            toast.error(`Switch your wallet to ${CHAIN_LABELS[chainKey]} (chain ${chain.chainId}), then lock from the tracker`);
          } else {
            if (!amount) throw new Error('Enter the WATT amount to lock');
            const txHash = await wattWtxBridgeService.lockWatt(wallet.signer, swap, amount);
            toast.success(`WATT locked (${txHash.slice(0, 10)}…) — desk pays WTX after confirmations`);
          }
        }
      } else if (direction === 'WTX_TO_WATT') {
        if (!destAddr.trim()) throw new Error(`Enter your ${CHAIN_LABELS[chainKey]} WATT address`);
        const swap = await wattWtxBridgeService.createSwap({
          direction,
          destChain: chainKey,
          destAddress: destAddr.trim(),
        });
        track(swap.id);
        toast.success('Deposit address created — send WTX to it');
      } else {
        // EVM_TO_EVM: cross-EVM WATT. Lock WATT on the source chain; the desk
        // pays WATT on the destination chain from its float, then claims.
        if (chainKey === destChainKey) throw new Error('Pick two different chains');
        if (!destAddr.trim()) throw new Error(`Enter your ${CHAIN_LABELS[destChainKey]} WATT address`);
        const swap = await wattWtxBridgeService.createSwap({
          direction,
          sourceChain: chainKey,
          destChain: destChainKey,
          destAddress: destAddr.trim(),
        });
        track(swap.id);
        const chain = info.chains[chainKey];
        if (!wallet.isConnected || !wallet.signer) {
          toast('Intent created. Connect your wallet and lock from the tracker below.', { icon: 'ℹ️' });
        } else if (wallet.chainId !== chain.chainId) {
          toast.error(`Switch your wallet to ${CHAIN_LABELS[chainKey]} (chain ${chain.chainId}), then lock from the tracker`);
        } else {
          if (!amount) throw new Error('Enter the WATT amount to lock');
          const txHash = await wattWtxBridgeService.lockWatt(wallet.signer, swap, amount);
          toast.success(`WATT locked (${txHash.slice(0, 10)}…) — desk pays WATT on ${CHAIN_LABELS[destChainKey]} after confirmations`);
        }
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const lockFromTracker = async (swap: BridgeSwap) => {
    setBusy(true);
    try {
      if (!wallet.isConnected || !wallet.signer) throw new Error('Connect your wallet first');
      if (!swap.lockParams) throw new Error('not an EVM lock swap');
      if (wallet.chainId !== swap.lockParams.chainId)
        throw new Error(`Switch your wallet to chain ${swap.lockParams.chainId} first`);
      if (!amount) throw new Error('Enter the WATT amount above first');
      const txHash = await wattWtxBridgeService.lockWatt(wallet.signer, swap, amount);
      toast.success(`WATT locked (${txHash.slice(0, 10)}…)`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={cardCls}>
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-semibold flex items-center space-x-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          <span>WATT ⇄ WTX</span>
        </h2>
        <div className="flex items-center space-x-3">
          {info && (
            <span className="text-xs text-gray-400">
              1 WATT = {rate} WTX{feePct > 0 ? ` · fee ${feePct}%` : ' · no fee'}
            </span>
          )}
          <button
            onClick={() => void refreshInfo()}
            className="text-gray-400 hover:text-gray-200"
            title="Refresh desk info"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        Swap WATT on Polygon / Altcoinchain / BSV against native WTX on WATTxchain. EVM legs are
        refundable HTLC locks — if the desk ever goes dark, your WATT comes back after the timeout.
      </p>

      {infoError && (
        <p className="text-sm text-amber-400 mb-3">
          Bridge desk unreachable ({infoError}) — swaps are paused, on-chain refunds unaffected.
        </p>
      )}

      {/* mode selector */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {([
          ['WATT_TO_WTX', 'WATT → WTX'],
          ['WTX_TO_WATT', 'WTX → WATT'],
          ['EVM_TO_EVM', 'WATT ⇄ WATT (cross-chain)'],
        ] as const).map(([mode, label]) => (
          <button
            key={mode}
            onClick={() => setDirection(mode)}
            className={`${btnCls} ${
              direction === mode
                ? 'bg-yellow-500/10 border border-yellow-500 text-yellow-400'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-transparent'
            }`}
          >
            <ArrowDownUp className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* chain selector(s) */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-xs text-gray-500">{direction === 'EVM_TO_EVM' ? 'From' : 'Chain'}</span>
        {chainChoices
          .filter((k) => direction !== 'EVM_TO_EVM' || k !== 'bsv')
          .map((k) => (
            <button
              key={k}
              onClick={() => setChainKey(k)}
              className={`px-3 py-1.5 rounded-lg text-sm border ${
                chainKey === k
                  ? 'border-yellow-500 bg-yellow-500/10 text-yellow-400'
                  : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-500'
              }`}
            >
              {CHAIN_LABELS[k]}
            </button>
          ))}
        {direction === 'EVM_TO_EVM' && (
          <>
            <span className="text-xs text-gray-500 ml-1">To</span>
            {chainChoices
              .filter((k) => k !== 'bsv')
              .map((k) => (
                <button
                  key={`dst-${k}`}
                  onClick={() => setDestChainKey(k)}
                  disabled={k === chainKey}
                  className={`px-3 py-1.5 rounded-lg text-sm border disabled:opacity-30 ${
                    destChainKey === k
                      ? 'border-yellow-500 bg-yellow-500/10 text-yellow-400'
                      : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  {CHAIN_LABELS[k]}
                </button>
              ))}
          </>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-3 mb-3">
        <div>
          <label className="text-xs text-gray-400">
            Amount ({direction === 'WTX_TO_WATT' ? 'WTX' : 'WATT'})
          </label>
          <input
            className={inputCls}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="100"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs text-gray-400">
            {direction === 'WATT_TO_WTX'
              ? 'Your WTX (WATTxchain) address'
              : direction === 'EVM_TO_EVM'
              ? `Your WATT address on ${CHAIN_LABELS[destChainKey]}`
              : `Your WATT address on ${CHAIN_LABELS[chainKey]}`}
          </label>
          <input
            className={inputCls}
            value={destAddr}
            onChange={(e) => setDestAddr(e.target.value)}
            placeholder={direction === 'WATT_TO_WTX' ? 'W…' : chainKey === 'bsv' && direction !== 'EVM_TO_EVM' ? '1…' : '0x…'}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400">
          {estimate !== null && (
            <>
              You receive ≈{' '}
              <span className="text-gray-200">
                {estimate.toLocaleString(undefined, { maximumFractionDigits: 8 })}{' '}
                {direction === 'WATT_TO_WTX' ? 'WTX' : 'WATT'}
                {direction === 'EVM_TO_EVM' ? ` on ${CHAIN_LABELS[destChainKey]}` : ''}
              </span>
            </>
          )}
        </span>
        <button
          onClick={() => void startSwap()}
          disabled={busy || !info}
          className={`${btnCls} bg-yellow-500 hover:bg-yellow-400 text-gray-900`}
        >
          <span>{(direction === 'WATT_TO_WTX' && chainKey !== 'bsv') || direction === 'EVM_TO_EVM' ? 'Create & lock' : 'Create swap'}</span>
        </button>
      </div>

      {/* floats */}
      {info && (
        <p className="text-xs text-gray-600 mt-3">
          Desk float: {info.floats.wtx ?? '?'} WTX · {info.floats.altWatt ?? '?'} WATT (ALT) ·{' '}
          {info.floats.bsvWatt ?? '?'} WATT (BSV)
        </p>
      )}

      {/* tracker */}
      {swapIds.length > 0 && (
        <div className="mt-5 space-y-2">
          <h3 className="text-sm font-semibold text-gray-300">Your swaps</h3>
          {swapIds.map((id) => {
            const s = swaps[id];
            if (!s) return (
              <div key={id} className="text-xs text-gray-500">
                {id} — loading…
              </div>
            );
            const depositAddr = s.bsvDepositAddress ?? s.wtxDepositAddress;
            return (
              <div key={id} className="border border-gray-800 rounded-lg p-3 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 font-medium">
                    {s.direction === 'WATT_TO_WTX'
                      ? `WATT (${CHAIN_LABELS[s.sourceChain ?? 'alt']}) → WTX`
                      : `WTX → WATT (${CHAIN_LABELS[s.destChain ?? 'alt']})`}
                  </span>
                  <span
                    className={
                      s.state === 'completed'
                        ? 'text-green-400'
                        : ACTIVE_STATES.includes(s.state)
                          ? 'text-yellow-400'
                          : 'text-gray-500'
                    }
                  >
                    {STATE_TEXT[s.state] ?? s.state}
                  </span>
                </div>
                {depositAddr && s.state === 'created' && (
                  <div className="flex items-center space-x-2 text-gray-400">
                    <span>
                      Send {s.direction === 'WATT_TO_WTX' ? 'WATT (BSV-21)' : 'WTX'} to{' '}
                      <span className="text-gray-200 font-mono">{depositAddr}</span>
                    </span>
                    <button onClick={() => copy(depositAddr, 'Deposit address')}>
                      <Copy className="w-3 h-3 text-gray-500 hover:text-gray-300" />
                    </button>
                  </div>
                )}
                {s.lockParams && s.state === 'created' && (
                  <div className="flex items-center justify-between text-gray-400">
                    <span>Lock your WATT on {CHAIN_LABELS[s.sourceChain ?? 'alt']} to proceed.</span>
                    <button
                      onClick={() => void lockFromTracker(s)}
                      disabled={busy}
                      className="underline text-yellow-400 hover:text-yellow-300 disabled:opacity-50"
                    >
                      Lock now
                    </button>
                  </div>
                )}
                {s.wtxTxid && <div className="text-gray-500">WTX payout: {s.wtxTxid}</div>}
                {s.payoutTx && <div className="text-gray-500">WATT payout: {s.payoutTx}</div>}
                <div className="text-gray-600">{id}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
