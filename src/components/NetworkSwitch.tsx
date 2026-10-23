// Network switch for the header (like stake.mining-game.wattxchange.app): shows the network
// the wallet is really on, follows switches made in the wallet, and switches/adds a
// network on pick.
import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { EVM_CHAINS } from '../config/evmChains';
import { walletOn, walletChainId, onWalletChain } from '../services/marketsService';

const ORDER = [137, 2330, 1, 42161, 8453, 10, 56, 43114, 146];
const DOT: Record<number, string> = { 137: '#8247e5', 2330: '#f59e0b', 1: '#627eea', 42161: '#28a0f0', 8453: '#0052ff', 10: '#ff0420', 56: '#f3ba2f', 43114: '#e84142', 146: '#fe9a4d' };

export default function NetworkSwitch({ compact = false }: { compact?: boolean }) {
  const [chainId, setChainId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    walletChainId().then(setChainId);
    const off = onWalletChain(setChainId);
    const t = setInterval(() => walletChainId().then((c) => setChainId((x) => (c !== x ? c : x))), 5000);
    return () => { off(); clearInterval(t); };
  }, []);
  useEffect(() => {
    const close = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const pick = async (id: number) => {
    setOpen(false);
    if (id === chainId) return;
    setBusy(true);
    try {
      await walletOn(EVM_CHAINS[id]);
      setChainId(id);
      toast.success(`Switched to ${EVM_CHAINS[id].name}`);
    } catch (e) {
      const x = e as { code?: number; message?: string };
      toast.error(x.code === 4001 ? 'Network switch cancelled in the wallet.' : x.message ?? 'Could not switch network');
    } finally { setBusy(false); }
  };

  const cur = chainId != null ? EVM_CHAINS[chainId] : undefined;
  const label = busy ? 'Switching…' : cur ? cur.name : chainId != null ? `Chain ${chainId}` : 'Network';
  return (
    <div className="relative" ref={box}>
      <button onClick={() => setOpen((v) => !v)} title="Switch network"
        className={`flex items-center gap-2 bg-gray-900/50 hover:bg-gray-800/50 border border-gray-700 rounded-lg transition-colors ${compact ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'}`}>
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: chainId != null ? DOT[chainId] ?? '#64748b' : '#64748b' }} />
        <span className="font-medium whitespace-nowrap">{compact && cur ? cur.native.symbol : label}</span>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-52 bg-gray-950 border border-gray-700 rounded-lg shadow-xl z-50 py-1">
          {ORDER.filter((id) => EVM_CHAINS[id]).map((id) => (
            <button key={id} onClick={() => void pick(id)} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-800 text-left">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: DOT[id] }} />
              <span className="flex-1">{EVM_CHAINS[id].name}</span>
              {id === chainId && <Check className="w-4 h-4 text-emerald-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
