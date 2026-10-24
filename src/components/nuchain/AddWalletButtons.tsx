import React, { useState } from 'react';
import { Wallet } from 'lucide-react';
import { connectNuChain } from '../../lib/shielded/wallet';
import { KEPLR_CHAIN_INFO, NUCHAIN } from '../../config/nuchainBridges';

// One-click network add: EVM wallets (Rabby, MetaMask, ...) via wallet_addEthereumChain,
// and Keplr via experimentalSuggestChain.
const AddWalletButtons: React.FC = () => {
  const [msg, setMsg] = useState('');
  const addEvm = async () => {
    try { const s = await connectNuChain(); setMsg(`nuChain added. Connected ${(await s.getAddress()).slice(0, 8)}...`); }
    catch (e) { setMsg((e as { shortMessage?: string }).shortMessage || (e as Error).message); }
  };
  const addKeplr = async () => {
    const k = (window as unknown as { keplr?: { experimentalSuggestChain: (c: unknown) => Promise<void>; enable: (id: string) => Promise<void> } }).keplr;
    if (!k) { setMsg('Keplr extension not found.'); return; }
    try { await k.experimentalSuggestChain(KEPLR_CHAIN_INFO); await k.enable(NUCHAIN.cosmosChainId); setMsg('nuChain added to Keplr.'); }
    catch (e) { setMsg(`Keplr: ${(e as Error).message}`); }
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button onClick={addEvm} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-purple-600 hover:bg-purple-500 text-white text-sm">
        <Wallet size={14} /> Add nuChain to Rabby / MetaMask</button>
      <button onClick={addKeplr} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm">
        <Wallet size={14} /> Add nuChain to Keplr</button>
      {msg && <span className="text-xs text-slate-400">{msg}</span>}
      <span className="text-xs text-slate-500 w-full">Manual: chain ID 28277, RPC https://evm-nu.wattxchange.app, symbol NU, explorer https://nu-exp.wattxchange.app</span>
    </div>
  );
};

export default AddWalletButtons;
