// WATT <-> WTX bridge panel: swap WATT on Polygon / Altcoinchain / BSV
// against native WTX on WATTxchain at the desk's posted rate.
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowDownUp, Zap, Copy, RefreshCw } from 'lucide-react';
import { ethers } from 'ethers';
import { EVM_CHAINS } from '../../config/evmChains';
import { walletOn, walletChainId, onWalletChain } from '../../services/marketsService';
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

/**
 * A fresh signer on `chainId`. Asks the wallet which network it is on right now (the
 * shared wallet hook can hold a stale chain/signer after a network switch), switches
 * or adds the network if needed, and returns a signer bound to it.
 */
async function signerOn(chainId: number): Promise<ethers.JsonRpcSigner> {
  const chain = EVM_CHAINS[chainId];
  if (!chain) throw new Error(`unsupported chain ${chainId}`);
  return walletOn(chain);
}

/** Pay the swap's relay fee straight after locking (same wallet, same chain). */
async function autoPayFee(signer: ethers.JsonRpcSigner, swap: BridgeSwap, lockTx?: string): Promise<BridgeSwap | null> {
  if (!swap.relayFee) return null;
  toast(`Now confirm the ${swap.relayFee.amount} ${swap.relayFee.coin} relay fee in your wallet`, { icon: '⛽' });
  try {
    const s = await wattWtxBridgeService.payRelayFee(signer, swap, lockTx);
    toast.success('Relay fee paid — the payout goes out once the lock confirms');
    return s;
  } catch (e) {
    const x = e as { code?: string; message?: string };
    toast.error(x.code === 'ACTION_REJECTED' ? 'Fee not paid (cancelled). Use “Pay fee” on the swap below.' : `Fee not recorded: ${x.message}. Use “Pay fee” on the swap below.`);
    return null;
  }
}

function copy(text: string, label: string) {
  void navigator.clipboard.writeText(text);
  toast.success(`${label} copied`);
}

export default function WattWtxBridge() {
  const [info, setInfo] = useState<BridgeInfo | null>(null);
  const [infoError, setInfoError] = useState<string | null>(null);
  const [direction, setDirection] = useState<'WATT_TO_WTX' | 'WTX_TO_WATT' | 'EVM_TO_EVM'>('WATT_TO_WTX');
  const [chainKey, setChainKey] = useState<BridgeChainKey>('alt');
  const [destChainKey, setDestChainKey] = useState<BridgeChainKey>('polygon');
  // Follow the wallet: if it's on Polygon or Altcoinchain, start the chain picker there
  // (otherwise "Create & lock" would build a swap for the other chain).
  useEffect(() => {
    const follow = (id: number | null) => {
      const key = id === 137 ? 'polygon' : id === 2330 ? 'alt' : null;
      if (!key) return;
      setChainKey((cur) => (cur === 'bsv' ? cur : key));
      setDestChainKey((cur) => (cur === key ? (key === 'polygon' ? 'alt' : 'polygon') : cur));
    };
    walletChainId().then(follow);
    return onWalletChain(follow);
  }, []);
  const [amount, setAmount] = useState('');
  const [destAddr, setDestAddr] = useState('');
  const [busy, setBusy] = useState(false);
  const [swapIds, setSwapIds] = useState<string[]>(loadIds);
  const [swaps, setSwaps] = useState<Record<string, BridgeSwap>>({});
  const [feeHash, setFeeHash] = useState<Record<string, string>>({});

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
    // Re-poll so the WTX-network-paused banner and floats stay current.
    const t = setInterval(() => void refreshInfo(), 30_000);
    return () => clearInterval(t);
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

  // What the desk will actually pay: its live quote (the payout uses the same pricing),
  // never the static config rate, which can differ from market pricing.
  const quoteArgs = useCallback((amt: string) => ({
    direction, amount: amt,
    ...(direction === 'WTX_TO_WATT' ? { destChain: chainKey } : { sourceChain: chainKey }),
    ...(direction === 'EVM_TO_EVM' ? { destChain: destChainKey } : {}),
  }), [direction, chainKey, destChainKey]);
  const [live, setLive] = useState<{ out: number; fee?: string } | null>(null);
  const [liveErr, setLiveErr] = useState<string | null>(null);
  useEffect(() => {
    setLive(null); setLiveErr(null);
    const a = Number(amount);
    if (!Number.isFinite(a) || a <= 0) return undefined;
    let off = false;
    const t = setTimeout(() => {
      wattWtxBridgeService.quote(quoteArgs(amount))
        .then((q) => { if (!off) setLive({ out: Number(q.amountOut), fee: q.relayFee ? `${Number(q.relayFee.amount).toPrecision(2)} ${q.relayFee.coin}` : undefined }); })
        .catch((e) => { if (!off) setLiveErr(e instanceof Error ? e.message : String(e)); });
    }, 400);
    return () => { off = true; clearTimeout(t); };
  }, [amount, quoteArgs]);
  const estimate = live?.out ?? null;
  // headline rate for the chosen direction, from a 1,000-unit quote
  const [unitRate, setUnitRate] = useState<number | null>(null);
  useEffect(() => {
    let off = false; setUnitRate(null);
    wattWtxBridgeService.quote(quoteArgs('1000')).then((q) => !off && setUnitRate(Number(q.amountOut) / 1000)).catch(() => {});
    return () => { off = true; };
  }, [quoteArgs, info]);
  const feePct = (info?.rate.feeBps ?? 0) / 100;

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
          if (!amount) throw new Error('Enter the WATT amount to lock');
          const signer = await signerOn(chain.chainId);
          const txHash = await wattWtxBridgeService.lockWatt(signer, swap, amount);
          toast.success(`WATT locked (${txHash.slice(0, 10)}…) — desk pays WTX after confirmations`);
          const paid = await autoPayFee(signer, swap, txHash);
          if (paid) setSwaps((prev) => ({ ...prev, [paid.id]: paid }));
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
        // the WATT lands in this EVM wallet; take its relay fee now, from that wallet
        const destId = info.chains[chainKey]?.chainId;
        if (swap.relayFee && destId) {
          try {
            const signer = await signerOn(destId);
            if ((await signer.getAddress()).toLowerCase() === destAddr.trim().toLowerCase()) {
              const paid = await autoPayFee(signer, swap);
              if (paid) setSwaps((prev) => ({ ...prev, [paid.id]: paid }));
            }
          } catch { /* the swap's own Pay fee button still works */ }
        }
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
        if (!amount) throw new Error('Enter the WATT amount to lock');
        const signer = await signerOn(chain.chainId);
        const txHash = await wattWtxBridgeService.lockWatt(signer, swap, amount);
        toast.success(`WATT locked (${txHash.slice(0, 10)}…) — desk pays WATT on ${CHAIN_LABELS[destChainKey]} after confirmations`);
        const paid = await autoPayFee(signer, swap, txHash);
        if (paid) setSwaps((prev) => ({ ...prev, [paid.id]: paid }));
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
      if (!swap.lockParams) throw new Error('not an EVM lock swap');
      if (!amount) throw new Error('Enter the WATT amount above first');
      const signer = await signerOn(swap.lockParams.chainId);
      const txHash = await wattWtxBridgeService.lockWatt(signer, swap, amount);
      toast.success(`WATT locked (${txHash.slice(0, 10)}…)`);
      if (!swap.relayFeePaid) {
        const paid = await autoPayFee(signer, swap, txHash);
        if (paid) setSwaps((prev) => ({ ...prev, [paid.id]: paid }));
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  // Relay fee: pay the quoted POL/ALT from the connected wallet, or report a
  // tx hash paid from elsewhere. The desk checks it on-chain before paying out.
  const payFee = async (swap: BridgeSwap) => {
    setBusy(true);
    try {
      const f = swap.relayFee;
      if (!f || !info) throw new Error('no relay fee on this swap');
      const chainId = info.chains[f.chain]?.chainId;
      if (!chainId) throw new Error(`unknown fee chain ${f.chain}`);
      const signer = await signerOn(chainId);
      const me = await signer.getAddress();
      const payer = swap.direction === 'WTX_TO_WATT' ? swap.destAddress : swap.evm?.sender;
      if (payer && payer.toLowerCase() !== me.toLowerCase())
        throw new Error(`Pay the fee from ${payer} (your wallet is on ${me.slice(0, 6)}…${me.slice(-4)})`);
      const s = await wattWtxBridgeService.payRelayFee(signer, swap);
      setSwaps((prev) => ({ ...prev, [s.id]: s }));
      toast.success('Relay fee paid — payout continues');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const submitFeeHash = async (swap: BridgeSwap) => {
    setBusy(true);
    try {
      const h = (feeHash[swap.id] ?? '').trim();
      if (!h) throw new Error('Paste the fee tx hash');
      const s = await wattWtxBridgeService.submitRelayFee(swap.id, h);
      setSwaps((prev) => ({ ...prev, [s.id]: s }));
      toast.success('Relay fee verified — payout continues');
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
              {unitRate == null ? 'live rate…' : direction === 'WTX_TO_WATT'
                ? `1 WTX ≈ ${unitRate.toPrecision(4)} WATT`
                : direction === 'WATT_TO_WTX' ? `1 WATT ≈ ${unitRate.toPrecision(4)} WTX` : `1 WATT → ${unitRate.toPrecision(4)} WATT`}
              {' · fee incl.'}{feePct > 0 ? ` ${feePct}%` : ''}
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

      {info?.wtxChain && !info.wtxChain.advancing && (
        <div className="text-sm text-amber-400 mb-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2">
          ⚠ WTX network paused — no new blocks for {Math.round(info.wtxChain.tipAgeSeconds / 60)} min.
          WTX deposits are safe but won&apos;t confirm (and WTX-leg swaps won&apos;t complete) until mining resumes.
        </div>
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
          {liveErr && <span className="text-orange-300">Can’t do this amount right now: {liveErr}</span>}
          {!liveErr && Number(amount) > 0 && estimate === null && <span className="text-gray-500">Getting the desk’s quote…</span>}
          {estimate !== null && (
            <>
              You receive ≈{' '}
              <span className="text-gray-200">
                {estimate.toLocaleString(undefined, { maximumFractionDigits: 8 })}{' '}
                {direction === 'WATT_TO_WTX' ? 'WTX' : 'WATT'}
                {direction === 'EVM_TO_EVM' ? ` on ${CHAIN_LABELS[destChainKey]}` : ''}
              </span>
              {(direction !== 'WATT_TO_WTX' || chainKey !== 'bsv') && !(direction === 'WTX_TO_WATT' && chainKey === 'bsv') && (
                <span className="text-gray-500"> · plus a {live?.fee ?? `small ${chainKey === 'polygon' ? 'POL' : 'ALT'}`} relay fee (gas at cost)</span>
              )}
            </>
          )}
        </span>
        <button
          onClick={() => void startSwap()}
          disabled={busy || !info || !!liveErr}
          className={`${btnCls} bg-yellow-500 hover:bg-yellow-400 text-gray-900`}
        >
          <span>{(direction === 'WATT_TO_WTX' && chainKey !== 'bsv') || direction === 'EVM_TO_EVM' ? `Create & lock on ${CHAIN_LABELS[chainKey]}` : 'Create swap'}</span>
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
                    {s.state === 'created' && s.deposit?.seen
                      ? `deposit detected — ${s.deposit.confirmations}/${s.deposit.required} confirmations`
                      : STATE_TEXT[s.state] ?? s.state}
                  </span>
                </div>
                {s.state === 'created' && s.deposit?.seen && (
                  <div className="text-gray-400">
                    Your deposit landed{s.deposit.confirmations >= s.deposit.required
                      ? ' — paying out now…'
                      : `; the bridge pays out after ${s.deposit.required} confirmations (WTX blocks ~2 min).`}
                  </div>
                )}
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
                {s.relayFee && !s.relayFeePaid && ACTIVE_STATES.includes(s.state) && (
                  <div className="space-y-1 text-gray-400">
                    <div className="flex items-center justify-between">
                      <span>
                        Relay fee: <span className="text-gray-200">{s.relayFee.amount} {s.relayFee.coin}</span> on{' '}
                        {CHAIN_LABELS[s.relayFee.chain]} to{' '}
                        <span className="font-mono text-gray-300">{s.relayFee.payTo}</span>
                        <button className="ml-1" onClick={() => copy(s.relayFee!.payTo, 'Fee address')}>
                          <Copy className="inline w-3 h-3 text-gray-500 hover:text-gray-300" />
                        </button>
                      </span>
                      {s.direction === 'WTX_TO_WATT' || s.evm?.sender ? (
                        <button
                          onClick={() => void payFee(s)}
                          disabled={busy}
                          className="underline text-yellow-400 hover:text-yellow-300 disabled:opacity-50"
                        >
                          Pay fee
                        </button>
                      ) : (
                        <span className="text-gray-500">pay after your lock confirms</span>
                      )}
                    </div>
                    <div className="text-gray-500">
                      Send it from {s.direction === 'WTX_TO_WATT' ? s.destAddress : 'the wallet that locked'}. The payout waits until it is verified.
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        className={`${inputCls} py-1 text-xs`}
                        placeholder="Paid from another wallet app? Paste the fee tx hash"
                        value={feeHash[s.id] ?? ''}
                        onChange={(e) => setFeeHash((p) => ({ ...p, [s.id]: e.target.value }))}
                      />
                      <button
                        onClick={() => void submitFeeHash(s)}
                        disabled={busy}
                        className="underline text-yellow-400 hover:text-yellow-300 disabled:opacity-50 whitespace-nowrap"
                      >
                        Submit
                      </button>
                    </div>
                  </div>
                )}
                {s.relayFeePaid && (
                  <div className="text-gray-500">Relay fee paid: {s.relayFee?.amount} {s.relayFee?.coin}</div>
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
