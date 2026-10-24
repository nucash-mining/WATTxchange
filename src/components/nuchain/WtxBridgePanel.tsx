import React, { useCallback, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { ArrowDownUp, Copy, Wallet, ExternalLink, RefreshCw } from 'lucide-react';
import { SHIELDED } from '../../config/nuchainShielded';
import { connectNuChain } from '../../lib/shielded/wallet';

// WTX (WATTx mainnet) <-> wWTX (nuChain), via the bridge API at bridge-nu.
// Deposit: send WTX to your personal deposit address; wWTX is minted after 6 confirmations.
// Withdraw: burn wWTX on nuChain; the bridge sends WTX to your WATTx address.
export const BRIDGE_API = (import.meta.env.VITE_WTX_BRIDGE as string | undefined) || 'https://bridge-nu.wattxchange.app';

type DepositInfo = { wtxAddress: string; creditedWTX: number; receivedIncl0ConfWTX: number; review: string | null };
type BridgeStatus = { backingWTX: number; wWTXSupply: number; fullyBacked: boolean; confirmations: number; minDepositWTX: number };

const WtxBridgePanel: React.FC = () => {
  const [dir, setDir] = useState<'in' | 'out'>('in');
  const [nu, setNu] = useState('');
  const [dep, setDep] = useState<DepositInfo | null>(null);
  const [status, setStatus] = useState<BridgeStatus | null>(null);
  const [balance, setBalance] = useState<string>('');
  const [wtxTo, setWtxTo] = useState('');
  const [amount, setAmount] = useState('');
  const [msg, setMsg] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => { fetch(BRIDGE_API + '/status').then((r) => r.json()).then(setStatus).catch(() => {}); }, []);

  const loadBalance = useCallback(async (a: string) => {
    try {
      const t = new ethers.Contract(SHIELDED.wwtx, ['function balanceOf(address) view returns (uint256)'],
        new ethers.JsonRpcProvider(SHIELDED.rpc, SHIELDED.chainId, { staticNetwork: true }));
      setBalance(ethers.formatUnits(await t.balanceOf(a), 8));
    } catch { /* ignore */ }
  }, []);

  const useWallet = async () => {
    setErr('');
    try { const s = await connectNuChain(); const a = await s.getAddress(); setNu(a); loadBalance(a); }
    catch (e) { setErr((e as Error).message); }
  };

  const getAddress = async () => {
    setErr(''); setBusy(true);
    try {
      const r = await fetch(BRIDGE_API + '/deposit', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ nu: nu.trim() }) });
      const j = await r.json(); if (j.error) throw new Error(j.error);
      setDep({ wtxAddress: j.wtxAddress, creditedWTX: 0, receivedIncl0ConfWTX: 0, review: null });
      loadBalance(j.nu);
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };

  // live deposit progress
  useEffect(() => {
    if (!dep || !nu) return;
    const tick = async () => {
      try {
        const j = await (await fetch(`${BRIDGE_API}/deposit/${encodeURIComponent(nu.trim())}`)).json();
        if (!j.error) { setDep(j); loadBalance(j.nu); }
      } catch { /* ignore */ }
    };
    tick(); const t = setInterval(tick, 20000); return () => clearInterval(t);
  }, [dep?.wtxAddress, nu, loadBalance]); // eslint-disable-line react-hooks/exhaustive-deps

  const burn = async () => {
    setErr(''); setMsg(''); setBusy(true);
    try {
      const signer = await connectNuChain();
      const sats = ethers.parseUnits(amount, 8);
      const t = new ethers.Contract(SHIELDED.wwtx, ['function burnToWATTx(string,uint256) returns (bytes32)'], signer);
      setMsg('Confirm in your wallet...');
      const tx = await t.burnToWATTx(wtxTo.trim(), sats);
      setMsg('Waiting for nuChain...'); await tx.wait();
      setMsg(`Burned ${amount} wWTX. The bridge sends the WTX (minus the WATTx network fee) to ${wtxTo.trim()} within about a minute.`);
      loadBalance(await signer.getAddress());
    } catch (e) { setErr((e as { shortMessage?: string }).shortMessage || (e as Error).message); setMsg(''); }
    setBusy(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-2">
          <button onClick={() => setDir('in')} className={`px-4 py-2 rounded-md text-sm ${dir === 'in' ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-slate-300'}`}>WTX to wWTX</button>
          <button onClick={() => setDir('out')} className={`px-4 py-2 rounded-md text-sm ${dir === 'out' ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-slate-300'}`}>wWTX to WTX</button>
        </div>
        {status && <div className="text-xs text-slate-400">
          Bridge holds <b className="text-slate-200">{status.backingWTX} WTX</b> for <b className="text-slate-200">{status.wWTXSupply} wWTX</b>
          <span className={status.fullyBacked ? 'text-emerald-400' : 'text-red-400'}> ({status.fullyBacked ? 'fully backed' : 'check backing'})</span>
        </div>}
      </div>

      {dir === 'in' ? (<>
        <div>
          <div className="text-xs text-slate-400 mb-1">Your nuChain address (0x... or nu1...) that receives wWTX</div>
          <div className="flex gap-2">
            <input value={nu} onChange={(e) => { setNu(e.target.value); setDep(null); }} placeholder="0x..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 font-mono" />
            <button onClick={useWallet} className="flex items-center gap-1 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm text-slate-200">
              <Wallet size={14} /> Use wallet</button>
          </div>
        </div>
        {!dep ? (
          <button disabled={!nu || busy} onClick={getAddress}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-medium">
            <ArrowDownUp size={16} /> Get my WTX deposit address
          </button>
        ) : (
          <div className="bg-slate-900/70 border border-slate-700 rounded-lg p-4 space-y-2">
            <div className="text-sm text-slate-300">Send WTX (WATTx mainnet) to:</div>
            <div className="flex items-center gap-2">
              <code className="text-sm text-cyan-300 break-all">{dep.wtxAddress}</code>
              <button onClick={() => { navigator.clipboard.writeText(dep.wtxAddress); setCopied(true); }} className="text-slate-300 hover:text-white"><Copy size={14} /></button>
              {copied && <span className="text-xs text-slate-400">copied</span>}
            </div>
            <div className="text-xs text-slate-400">
              Minimum {status?.minDepositWTX ?? 0.001} WTX. wWTX is minted after {status?.confirmations ?? 6} confirmations (about 12 minutes).
              This address is yours: reuse it for every deposit.
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="text-slate-300">Seen: <b>{dep.receivedIncl0ConfWTX} WTX</b></span>
              <span className="text-slate-300">Minted: <b className="text-emerald-400">{dep.creditedWTX} wWTX</b></span>
              {balance && <span className="text-slate-300">Your wWTX balance: <b>{balance}</b></span>}
              <RefreshCw size={12} className="text-slate-500 self-center" />
            </div>
            {dep.review && <div className="text-xs text-red-400">Flagged for review: {dep.review}</div>}
          </div>
        )}
      </>) : (<>
        {balance && <div className="text-sm text-slate-300">Your wWTX balance: <b>{balance}</b></div>}
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-slate-400 mb-1">Amount of wWTX to send home</div>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="1.0"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-200" />
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">Your WATTx (WTX) address</div>
            <input value={wtxTo} onChange={(e) => setWtxTo(e.target.value)} placeholder="W..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 font-mono" />
          </div>
        </div>
        <button disabled={!amount || !wtxTo || busy} onClick={burn}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-medium">
          <Wallet size={16} /> Burn wWTX and receive WTX
        </button>
      </>)}
      {msg && <div className="text-sm text-emerald-400">{msg}</div>}
      {err && <div className="text-sm text-red-400 break-words">{err}</div>}
      <a className="text-xs text-cyan-400 inline-flex items-center gap-1" href={`https://nu-exp.wattxchange.app/#/address/${SHIELDED.wwtx}`} target="_blank" rel="noopener noreferrer">
        wWTX contract <ExternalLink size={12} /></a>
    </div>
  );
};

export default WtxBridgePanel;
