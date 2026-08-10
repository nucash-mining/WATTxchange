import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ArrowRight,
  Copy,
  Link2,
  Lock,
  RefreshCw,
  ShieldCheck,
  Undo2,
  Package,
} from 'lucide-react';
import { ethers } from 'ethers';
import { BRIDGE_DEPLOYMENTS, WRAPPED_FACTORY_ABI, WRAPPED_TOKEN_ABI } from '../config/bridgeContracts';
import { htlcBridgeService, type HtlcStage } from '../services/htlcBridgeService';
import { useWallet } from '../hooks/useWallet';
import WattWtxBridge from './bridge/WattWtxBridge';

// A locally-remembered HTLC leg. The preimage only exists in this browser —
// losing it before the counterparty claims means waiting out the refund path.
interface StoredSwap {
  chainId: number;
  swapId: string;
  hashlock: string;
  preimage: string | null; // null when we are the counterparty (secret unknown)
  timeout: number;
  asset: string;
  valueWei: string;
  sender: string;
  recipient: string;
  txHash: string;
  createdAt: number;
  stage?: HtlcStage;
}

const STORE_KEY = 'htlc_bridge_swaps_v1';

function loadSwaps(): StoredSwap[] {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveSwaps(swaps: StoredSwap[]) {
  localStorage.setItem(STORE_KEY, JSON.stringify(swaps));
}

function chainName(chainId: number): string {
  return BRIDGE_DEPLOYMENTS.find((d) => d.chainId === chainId)?.name ?? `chain ${chainId}`;
}

function copy(text: string, label: string) {
  navigator.clipboard.writeText(text);
  toast.success(`${label} copied`);
}

const inputCls =
  'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500';
const cardCls = 'bg-gray-900/80 border border-gray-800 rounded-xl p-5';
const btnCls =
  'flex items-center justify-center space-x-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed';

export default function BridgeView() {
  const wallet = useWallet();
  const available = useMemo(() => BRIDGE_DEPLOYMENTS.filter((d) => !!d.vault), []);
  const unavailable = useMemo(() => BRIDGE_DEPLOYMENTS.filter((d) => !d.vault), []);

  const [fromChain, setFromChain] = useState<number>(available[0]?.chainId ?? 2330);
  const [swaps, setSwaps] = useState<StoredSwap[]>(loadSwaps);
  const [busy, setBusy] = useState(false);

  // ── initiator lock form ────────────────────────────────────────────────────
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [timeoutHours, setTimeoutHours] = useState('24');
  const [asset, setAsset] = useState(''); // empty = native coin
  // counterparty mode: lock against a hashlock somebody else generated
  const [existingHashlock, setExistingHashlock] = useState('');

  // ── claim / refund forms ───────────────────────────────────────────────────
  const [claimSwapId, setClaimSwapId] = useState('');
  const [claimPreimage, setClaimPreimage] = useState('');
  const [refundSwapId, setRefundSwapId] = useState('');

  // ── wrap / unwrap ──────────────────────────────────────────────────────────
  const [underlying, setUnderlying] = useState('');
  const [wrapperAddr, setWrapperAddr] = useState<string | null>(null);
  const [wrapAmount, setWrapAmount] = useState('');

  const persist = useCallback((next: StoredSwap[]) => {
    setSwaps(next);
    saveSwaps(next);
  }, []);

  const requireSigner = useCallback(
    (chainId: number): ethers.JsonRpcSigner => {
      if (!wallet.isConnected || !wallet.signer) throw new Error('Connect your wallet first');
      if (wallet.chainId !== chainId) {
        throw new Error(`Switch your wallet to ${chainName(chainId)} (chain ${chainId}) first`);
      }
      return wallet.signer;
    },
    [wallet.isConnected, wallet.signer, wallet.chainId]
  );

  const doLock = async () => {
    setBusy(true);
    try {
      const signer = requireSigner(fromChain);
      if (!ethers.isAddress(recipient)) throw new Error('Invalid recipient address');
      const amountWei = ethers.parseEther(amount || '0');
      if (amountWei <= 0n) throw new Error('Enter an amount');
      const hours = Number(timeoutHours);
      if (!Number.isFinite(hours) || hours < 1 || hours > 720) throw new Error('Timeout must be 1-720 hours');

      const initiator = existingHashlock === '';
      const secret = initiator ? htlcBridgeService.generateSecret() : null;
      const hashlock = initiator ? secret!.hashlock : existingHashlock;
      if (!/^0x[0-9a-fA-F]{64}$/.test(hashlock)) throw new Error('Hashlock must be 32 bytes hex');

      const timeoutSec = Math.floor(Date.now() / 1000) + hours * 3600;
      const assetAddr = asset.trim() === '' ? ethers.ZeroAddress : asset.trim();
      if (assetAddr !== ethers.ZeroAddress && !ethers.isAddress(assetAddr)) throw new Error('Invalid token address');

      const leg = await htlcBridgeService.lock(signer, fromChain, {
        recipient,
        hashlock,
        timeoutSec,
        asset: assetAddr,
        amountWei,
      });

      persist([
        {
          chainId: leg.chainId,
          swapId: leg.swapId,
          hashlock: leg.hashlock,
          preimage: secret?.preimage ?? null,
          timeout: leg.timeout,
          asset: leg.asset,
          valueWei: leg.value.toString(),
          sender: leg.sender,
          recipient: leg.recipient,
          txHash: leg.txHash,
          createdAt: Date.now(),
          stage: 'LOCKED',
        },
        ...swaps,
      ]);
      toast.success(`Locked on ${chainName(fromChain)} — swap ${leg.swapId.slice(0, 10)}…`);
      if (initiator) {
        toast('Secret saved in this browser. Back it up before sharing the hashlock!', { icon: '⚠️', duration: 8000 });
      }
      setAmount('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const doClaim = async (chainId: number, swapId: string, preimage: string) => {
    setBusy(true);
    try {
      const signer = requireSigner(chainId);
      const tx = await htlcBridgeService.claim(signer, chainId, swapId, preimage);
      toast.success(`Claimed — ${tx.slice(0, 14)}…`);
      await refreshStages();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const doRefund = async (chainId: number, swapId: string) => {
    setBusy(true);
    try {
      const signer = requireSigner(chainId);
      const tx = await htlcBridgeService.refund(signer, chainId, swapId);
      toast.success(`Refunded — ${tx.slice(0, 14)}…`);
      await refreshStages();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const refreshStages = useCallback(async () => {
    const next = await Promise.all(
      loadSwaps().map(async (s) => {
        try {
          return { ...s, stage: await htlcBridgeService.stage(s.chainId, s.swapId) };
        } catch {
          return s;
        }
      })
    );
    persist(next);
  }, [persist]);

  useEffect(() => {
    if (swaps.length > 0) void refreshStages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lookupWrapper = async () => {
    try {
      const d = htlcBridgeService.deployment(fromChain);
      if (!d?.factory) throw new Error(`Factory not deployed on ${chainName(fromChain)}`);
      if (!ethers.isAddress(underlying)) throw new Error('Invalid token address');
      const provider = new ethers.JsonRpcProvider(d.rpcUrl, d.chainId, { staticNetwork: true });
      const factory = new ethers.Contract(d.factory, WRAPPED_FACTORY_ABI, provider);
      const w: string = await factory.wrapperOf(underlying);
      setWrapperAddr(w === ethers.ZeroAddress ? null : w);
      toast.success(w === ethers.ZeroAddress ? 'No wrapper yet — deploy one below' : `Wrapper: ${w.slice(0, 12)}…`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  const deployWrapper = async () => {
    setBusy(true);
    try {
      const signer = requireSigner(fromChain);
      const d = htlcBridgeService.deployment(fromChain)!;
      const factory = new ethers.Contract(d.factory!, WRAPPED_FACTORY_ABI, signer);
      const tx = await factory.deployWrapper(underlying);
      await tx.wait();
      await lookupWrapper();
      toast.success('Wrapper deployed');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const wrapOrUnwrap = async (unwrap: boolean) => {
    setBusy(true);
    try {
      const signer = requireSigner(fromChain);
      if (!wrapperAddr) throw new Error('Look up the wrapper first');
      const amt = ethers.parseEther(wrapAmount || '0');
      if (amt <= 0n) throw new Error('Enter an amount');
      const wrapper = new ethers.Contract(wrapperAddr, WRAPPED_TOKEN_ABI, signer);
      if (unwrap) {
        const tx = await wrapper.unwrap(amt);
        await tx.wait();
      } else {
        const erc20 = new ethers.Contract(
          underlying,
          ['function approve(address,uint256) returns (bool)', 'function allowance(address,address) view returns (uint256)'],
          signer
        );
        const owner = await signer.getAddress();
        const allowance: bigint = await erc20.allowance(owner, wrapperAddr);
        if (allowance < amt) {
          const atx = await erc20.approve(wrapperAddr, amt);
          await atx.wait();
        }
        const tx = await wrapper.wrap(amt);
        await tx.wait();
      }
      toast.success(unwrap ? 'Unwrapped' : 'Wrapped');
      setWrapAmount('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const now = Math.floor(Date.now() / 1000);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center space-x-2">
            <Link2 className="w-6 h-6 text-yellow-500" />
            <span>Bridge</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Trust-minimized HTLC transfers — no custodian, no admin keys. Two locks under one secret;
            worst case is a refund after timeout.
          </p>
        </div>
        <button onClick={() => void refreshStages()} className={`${btnCls} bg-gray-800 hover:bg-gray-700 text-gray-200`}>
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* WATT <-> WTX desk */}
      <WattWtxBridge />

      {/* Chain selector */}
      <div className={cardCls}>
        <h2 className="font-semibold mb-3">Networks</h2>
        <div className="flex flex-wrap gap-2">
          {available.map((d) => (
            <button
              key={d.chainId}
              onClick={() => setFromChain(d.chainId)}
              className={`px-3 py-1.5 rounded-lg text-sm border ${
                fromChain === d.chainId
                  ? 'border-yellow-500 bg-yellow-500/10 text-yellow-400'
                  : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-500'
              }`}
            >
              {d.name} · {d.nativeSymbol}
            </button>
          ))}
          {unavailable.map((d) => (
            <span
              key={d.chainId}
              title="Vault not deployed yet"
              className="px-3 py-1.5 rounded-lg text-sm border border-gray-800 bg-gray-900 text-gray-600 cursor-not-allowed"
            >
              {d.name} · soon
            </span>
          ))}
        </div>
        {wallet.isConnected && wallet.chainId !== fromChain && (
          <p className="text-xs text-amber-400 mt-3">
            Wallet is on chain {wallet.chainId} — switch to {chainName(fromChain)} ({fromChain}) to sign.
            {fromChain === 2330 && (
              <button onClick={() => wallet.switchToAltcoinchain()} className="ml-2 underline hover:text-amber-300">
                Switch now
              </button>
            )}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Lock */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cardCls}>
          <h2 className="font-semibold mb-1 flex items-center space-x-2">
            <Lock className="w-4 h-4 text-yellow-500" />
            <span>Lock on {chainName(fromChain)}</span>
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            Leave the hashlock empty to start a swap (a fresh secret is generated and kept in this
            browser). Paste the initiator's hashlock to lock the counter-leg — use a{' '}
            <span className="text-gray-300">shorter timeout</span> than theirs.
          </p>
          <div className="space-y-3">
            <input className={inputCls} placeholder="Recipient address (0x…)" value={recipient} onChange={(e) => setRecipient(e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <input className={inputCls} placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
              <input className={inputCls} placeholder="Timeout (hours)" value={timeoutHours} onChange={(e) => setTimeoutHours(e.target.value)} />
            </div>
            <input className={inputCls} placeholder="Token address (empty = native coin)" value={asset} onChange={(e) => setAsset(e.target.value)} />
            <input className={inputCls} placeholder="Existing hashlock (empty = I'm the initiator)" value={existingHashlock} onChange={(e) => setExistingHashlock(e.target.value)} />
            <button onClick={() => void doLock()} disabled={busy || !wallet.isConnected} className={`${btnCls} w-full bg-yellow-500 hover:bg-yellow-400 text-black`}>
              <Lock className="w-4 h-4" />
              <span>{existingHashlock ? 'Lock counter-leg' : 'Generate secret & lock'}</span>
            </button>
          </div>
        </motion.div>

        {/* Claim / refund */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cardCls}>
          <h2 className="font-semibold mb-1 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            <span>Claim / Refund on {chainName(fromChain)}</span>
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            Claiming reveals the preimage on-chain — the counterparty then uses it to claim the other
            leg. Refund only works after the leg's timeout has passed.
          </p>
          <div className="space-y-3">
            <input className={inputCls} placeholder="Swap ID (0x…)" value={claimSwapId} onChange={(e) => setClaimSwapId(e.target.value)} />
            <input className={inputCls} placeholder="Preimage (0x…, for claim)" value={claimPreimage} onChange={(e) => setClaimPreimage(e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => void doClaim(fromChain, claimSwapId, claimPreimage)}
                disabled={busy || !claimSwapId || !claimPreimage}
                className={`${btnCls} bg-green-600 hover:bg-green-500 text-white`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Claim</span>
              </button>
              <button
                onClick={() => {
                  setRefundSwapId(claimSwapId);
                  void doRefund(fromChain, claimSwapId || refundSwapId);
                }}
                disabled={busy || !claimSwapId}
                className={`${btnCls} bg-gray-700 hover:bg-gray-600 text-white`}
              >
                <Undo2 className="w-4 h-4" />
                <span>Refund</span>
              </button>
            </div>
          </div>

          {/* Wrap / unwrap */}
          <div className="mt-6 pt-4 border-t border-gray-800">
            <h3 className="text-sm font-semibold mb-2 flex items-center space-x-2">
              <Package className="w-4 h-4 text-blue-400" />
              <span>Wrapped tokens</span>
            </h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input className={inputCls} placeholder="Underlying token address" value={underlying} onChange={(e) => setUnderlying(e.target.value)} />
                <button onClick={() => void lookupWrapper()} className={`${btnCls} bg-gray-800 hover:bg-gray-700 text-gray-200 whitespace-nowrap`}>
                  Look up
                </button>
              </div>
              {wrapperAddr === null && underlying && (
                <button onClick={() => void deployWrapper()} disabled={busy} className={`${btnCls} w-full bg-blue-600 hover:bg-blue-500 text-white`}>
                  Deploy wrapper (CREATE2, same address on every chain)
                </button>
              )}
              {wrapperAddr && (
                <>
                  <p className="text-xs text-gray-400 break-all">
                    Wrapper: {wrapperAddr}{' '}
                    <button onClick={() => copy(wrapperAddr, 'Wrapper address')} className="text-gray-500 hover:text-gray-300">
                      <Copy className="w-3 h-3 inline" />
                    </button>
                  </p>
                  <div className="flex gap-2">
                    <input className={inputCls} placeholder="Amount" value={wrapAmount} onChange={(e) => setWrapAmount(e.target.value)} />
                    <button onClick={() => void wrapOrUnwrap(false)} disabled={busy} className={`${btnCls} bg-blue-600 hover:bg-blue-500 text-white`}>
                      Wrap
                    </button>
                    <button onClick={() => void wrapOrUnwrap(true)} disabled={busy} className={`${btnCls} bg-gray-700 hover:bg-gray-600 text-white`}>
                      Unwrap
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* My swaps */}
      <div className={cardCls}>
        <h2 className="font-semibold mb-3">My swaps</h2>
        {swaps.length === 0 ? (
          <p className="text-sm text-gray-500">No swaps yet. Lock funds above to start one.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-800">
                  <th className="py-2 pr-4">Chain</th>
                  <th className="py-2 pr-4">Swap ID</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4">Role</th>
                  <th className="py-2 pr-4">Stage</th>
                  <th className="py-2 pr-4">Timeout</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {swaps.map((s) => {
                  const expired = now > s.timeout;
                  const mineToClaim = wallet.address?.toLowerCase() === s.recipient.toLowerCase();
                  const mineToRefund = wallet.address?.toLowerCase() === s.sender.toLowerCase();
                  return (
                    <tr key={`${s.chainId}-${s.swapId}`} className="border-b border-gray-800/60">
                      <td className="py-2 pr-4 text-gray-300">{chainName(s.chainId)}</td>
                      <td className="py-2 pr-4 font-mono text-xs text-gray-400">
                        {s.swapId.slice(0, 10)}…{' '}
                        <button onClick={() => copy(s.swapId, 'Swap ID')} className="text-gray-600 hover:text-gray-300">
                          <Copy className="w-3 h-3 inline" />
                        </button>
                      </td>
                      <td className="py-2 pr-4 text-gray-300">
                        {ethers.formatEther(BigInt(s.valueWei))}{' '}
                        {s.asset === ethers.ZeroAddress ? BRIDGE_DEPLOYMENTS.find((d) => d.chainId === s.chainId)?.nativeSymbol : 'tokens'}
                      </td>
                      <td className="py-2 pr-4 text-gray-400">{s.preimage ? 'initiator' : 'counterparty'}</td>
                      <td className="py-2 pr-4">
                        <span
                          className={
                            s.stage === 'CLAIMED'
                              ? 'text-green-400'
                              : s.stage === 'REFUNDED'
                              ? 'text-gray-400'
                              : expired
                              ? 'text-amber-400'
                              : 'text-blue-400'
                          }
                        >
                          {s.stage ?? 'LOCKED'}
                          {s.stage === 'LOCKED' && expired ? ' (expired)' : ''}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-gray-500 text-xs">{new Date(s.timeout * 1000).toLocaleString()}</td>
                      <td className="py-2 space-x-2 whitespace-nowrap">
                        {s.preimage && (
                          <button onClick={() => copy(s.preimage!, 'Preimage')} className="text-xs text-yellow-500 hover:text-yellow-400 underline">
                            secret
                          </button>
                        )}
                        <button onClick={() => copy(s.hashlock, 'Hashlock')} className="text-xs text-gray-400 hover:text-gray-200 underline">
                          hashlock
                        </button>
                        {s.stage === 'LOCKED' && mineToClaim && s.preimage && (
                          <button onClick={() => void doClaim(s.chainId, s.swapId, s.preimage!)} disabled={busy} className="text-xs text-green-400 hover:text-green-300 underline">
                            claim
                          </button>
                        )}
                        {s.stage === 'LOCKED' && mineToRefund && expired && (
                          <button onClick={() => void doRefund(s.chainId, s.swapId)} disabled={busy} className="text-xs text-amber-400 hover:text-amber-300 underline">
                            refund
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-gray-600 mt-3 flex items-center space-x-1">
          <ArrowRight className="w-3 h-3" />
          <span>
            Cross-chain flow: initiator locks (long timeout) → counterparty locks the other chain
            (short timeout) → initiator claims there (revealing the secret) → counterparty claims here.
          </span>
        </p>
      </div>
    </div>
  );
}
