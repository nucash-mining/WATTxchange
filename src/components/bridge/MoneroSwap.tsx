// Monero bridge: swap XMR <-> any coin (EVM or UTXO wallets) in-app, HoudiniSwap-style.
import React, { useEffect, useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowDownUp, Copy, ExternalLink, ShieldCheck, RefreshCw, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  swapCoins, swapRate, createSwap, swapStatus, validAddress, statusInfo, sendDeposit, EVM_NETWORK_CHAIN,
  type SwapCoin, type SwapAsset, type SwapRate, type SwapOrder,
} from '../../services/instantSwap';
import { EVM_CHAINS } from '../../config/evmChains';
import { walletOn, connectedAccount } from '../../services/marketsService';

export const LS_ORDERS = 'wxc.xmrswap.orders.v1';
const POPULAR = ['XMR', 'BTC', 'ETH', 'USDT', 'USDC', 'LTC', 'SOL', 'BNB', 'POL', 'DOGE', 'TRX', 'BCH', 'ZEC', 'DASH', 'XRP', 'ADA', 'TON', 'ARB'];
const fmt = (v: number | null | undefined) => (v == null || !Number.isFinite(v) ? '—' : Number(v.toPrecision(8)).toLocaleString(undefined, { maximumFractionDigits: 8 }));
const copy = (t: string, what: string) => { void navigator.clipboard.writeText(t); toast.success(`${what} copied`); };
const loadOrders = (): string[] => { try { return JSON.parse(localStorage.getItem(LS_ORDERS) ?? '[]'); } catch { return []; } };

export function AssetPicker({ coins, value, onChange, label }: { coins: SwapCoin[]; value: SwapAsset | null; onChange: (a: SwapAsset) => void; label: string }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    const rank = (c: SwapCoin) => { const i = POPULAR.indexOf(c.code); return i === -1 ? 999 : i; };
    return coins.filter((c) => !s || c.code.toLowerCase().includes(s) || c.name.toLowerCase().includes(s))
      .sort((a, b) => rank(a) - rank(b) || a.code.localeCompare(b.code)).slice(0, 80);
  }, [coins, q]);
  return (
    <div className="relative">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="flex gap-2">
        <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 min-w-[120px]">
          {value && <img src={value.coin.icon} alt="" className="w-5 h-5 rounded-full" />}
          <span className="font-semibold">{value?.coin.code ?? 'Select'}</span>
        </button>
        {value && value.coin.networks.length > 1 && (
          <select value={value.net.network} onChange={(e) => onChange({ coin: value.coin, net: value.coin.networks.find((n) => n.network === e.target.value)! })}
            className="flex-1 min-w-0 bg-slate-900 border border-slate-700 rounded-lg px-2 text-sm">
            {value.coin.networks.map((n) => <option key={n.network} value={n.network}>{n.name}</option>)}
          </select>
        )}
        {value && value.coin.networks.length === 1 && <span className="self-center text-xs text-slate-400">{value.net.name}</span>}
      </div>
      {open && (
        <div className="absolute z-20 mt-1 w-full max-w-sm bg-slate-950 border border-slate-700 rounded-lg shadow-xl">
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${coins.length} coins`} className="w-full bg-slate-900 border-b border-slate-800 rounded-t-lg px-3 py-2 text-sm outline-none" />
          <div className="max-h-72 overflow-y-auto">
            {list.map((c) => (
              <button key={c.code} onClick={() => { onChange({ coin: c, net: c.networks.find((n) => n.isDefault) ?? c.networks[0] }); setOpen(false); setQ(''); }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-800 text-left">
                <img src={c.icon} alt="" className="w-5 h-5 rounded-full" loading="lazy" />
                <span className="font-semibold text-sm">{c.code}</span><span className="text-xs text-slate-400 truncate">{c.name}</span>
                {c.networks.length > 1 && <span className="ml-auto text-[10px] text-slate-500">{c.networks.length} networks</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function OrderCard({ id, onRemove }: { id: string; onRemove: () => void }) {
  const [o, setO] = useState<SwapOrder | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  useEffect(() => {
    let off = false;
    const load = () => swapStatus(id).then((x) => { if (!off) { setO(x); setErr(null); } }).catch((e) => !off && setErr(e.message));
    load(); const t = setInterval(load, 15_000);
    return () => { off = true; clearInterval(t); };
  }, [id]);
  if (!o) return <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-sm text-slate-400">{err ? `Swap ${id}: ${err}` : `Loading swap ${id}…`}</div>;
  const st = statusInfo(o.status);
  const chainId = EVM_NETWORK_CHAIN[o.coinFrom.network];
  const canWallet = o.status === 'wait' && chainId && EVM_CHAINS[chainId];
  const payFromWallet = async () => {
    setSending(true);
    try {
      const signer = await walletOn(EVM_CHAINS[chainId]);
      const h = await sendDeposit(signer, o, o.coinFrom.contract);
      toast.success(`Deposit sent (${h.slice(0, 10)}…). The swap starts once it confirms.`);
    } catch (e) {
      const x = e as { code?: string; shortMessage?: string; message?: string };
      toast.error(x.code === 'ACTION_REJECTED' ? 'Cancelled in the wallet.' : x.shortMessage ?? x.message ?? String(e));
    } finally { setSending(false); }
  };
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
      <div className="flex justify-between items-start gap-2">
        <div>
          <div className="font-semibold">{fmt(o.amount)} {o.coinFrom.coinCode} → {fmt(o.amountTo)} {o.coinTo.coinCode}</div>
          <div className="text-xs text-slate-500">{o.coinFrom.networkName} → {o.coinTo.networkName} · swap {o.id} · {new Date(o.createdAt).toLocaleString()}</div>
        </div>
        {(st.done || st.bad) && <button onClick={onRemove} className="text-xs text-slate-500 hover:text-slate-300">Remove</button>}
      </div>
      <div className="flex gap-1">{[0, 1, 2, 3, 4].map((i) => <div key={i} className={`h-1.5 flex-1 rounded ${st.bad ? 'bg-red-500/60' : i <= st.step ? 'bg-yellow-400' : 'bg-slate-700'}`} />)}</div>
      <div className={`text-sm ${st.done ? 'text-emerald-400' : st.bad ? 'text-red-400' : 'text-yellow-300'}`}>{st.label}</div>
      {o.status === 'wait' && (
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <div className="bg-white p-2 rounded-lg shrink-0"><QRCodeSVG value={o.depositAddress} size={132} /></div>
          <div className="min-w-0 space-y-2 text-sm">
            <div>Send exactly <b>{fmt(o.amount)} {o.coinFrom.coinCode}</b> ({o.coinFrom.networkName}) to:</div>
            <button onClick={() => copy(o.depositAddress, 'Deposit address')} className="w-full text-left font-mono text-xs break-all bg-slate-950 border border-slate-800 rounded p-2 hover:border-yellow-600">
              {o.depositAddress} <Copy className="inline w-3 h-3 ml-1" />
            </button>
            {o.depositExtraId && (
              <button onClick={() => copy(o.depositExtraId!, 'Memo')} className="w-full text-left font-mono text-xs break-all bg-slate-950 border border-orange-600 rounded p-2">
                Memo / tag (required): {o.depositExtraId} <Copy className="inline w-3 h-3 ml-1" />
              </button>
            )}
            <div className="text-xs text-slate-500">Paying to {o.withdrawalAddress.slice(0, 10)}…{o.withdrawalAddress.slice(-6)}. The rate floats until your deposit confirms.</div>
            {canWallet && (
              <button disabled={sending} onClick={payFromWallet} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black font-semibold text-sm disabled:opacity-50">
                <Wallet className="w-4 h-4" />{sending ? 'Confirm in your wallet…' : `Send from wallet (${EVM_CHAINS[chainId].name})`}
              </button>
            )}
          </div>
        </div>
      )}
      {(o.hashIn?.link || o.hashOut?.link) && (
        <div className="flex gap-4 text-xs">
          {o.hashIn?.link && <a href={o.hashIn.link} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-yellow-400 inline-flex items-center gap-1">Deposit tx <ExternalLink className="w-3 h-3" /></a>}
          {o.hashOut?.link && <a href={o.hashOut.link} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline inline-flex items-center gap-1">Payout tx <ExternalLink className="w-3 h-3" /></a>}
        </div>
      )}
    </div>
  );
}

export default function MoneroSwap() {
  const [coins, setCoins] = useState<SwapCoin[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [from, setFrom] = useState<SwapAsset | null>(null);
  const [to, setTo] = useState<SwapAsset | null>(null);
  const [amount, setAmount] = useState('');
  const [rate, setRate] = useState<SwapRate | null>(null);
  const [rateErr, setRateErr] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [memo, setMemo] = useState('');
  const [refund, setRefund] = useState('');
  const [busy, setBusy] = useState(false);
  const [orders, setOrders] = useState<string[]>(loadOrders);

  useEffect(() => {
    swapCoins().then((c) => {
      setCoins(c);
      const pick = (code: string, net?: string) => { const coin = c.find((x) => x.code === code); return coin ? { coin, net: coin.networks.find((n) => n.network === net) ?? coin.networks.find((n) => n.isDefault) ?? coin.networks[0] } : null; };
      setFrom(pick('XMR')); setTo(pick('ETH', 'ETH'));
    }).catch((e) => setLoadErr(e.message));
  }, []);
  useEffect(() => { localStorage.setItem(LS_ORDERS, JSON.stringify(orders)); }, [orders]);
  // prefill the payout address with the connected EVM wallet when the target is an EVM network
  useEffect(() => {
    if (!to || address) return;
    if (EVM_NETWORK_CHAIN[to.net.network]) connectedAccount().then((a) => a && setAddress((x) => x || a));
  }, [to]);

  useEffect(() => {
    setRate(null); setRateErr(null);
    if (!from || !to || !(Number(amount) > 0)) return undefined;
    let off = false;
    const t = setTimeout(() => swapRate(from, to, amount).then((r) => !off && setRate(r)).catch((e) => !off && setRateErr(e.message)), 400);
    return () => { off = true; clearTimeout(t); };
  }, [from, to, amount]);

  const flip = () => { setFrom(to); setTo(from); setAddress(''); setMemo(''); setRefund(''); };
  const amt = Number(amount) || 0;
  const below = rate && rate.minAmount && amt < rate.minAmount;
  const above = rate && rate.maxAmount && amt > rate.maxAmount;
  const addrOk = to ? validAddress(to.net, address) : false;
  const refundOk = !refund || (from ? validAddress(from.net, refund) : true);
  const same = from && to && from.coin.code === to.coin.code && from.net.network === to.net.network;
  const ready = from && to && amt > 0 && rate && rate.toAmount > 0 && !below && !above && addrOk && refundOk && !same && (!to.net.memoNeeded || memo);

  const start = async () => {
    if (!from || !to) return;
    setBusy(true);
    try {
      const o = await createSwap({ from, to, amount, address, memo, refund });
      setOrders((x) => [o.id, ...x.filter((i) => i !== o.id)].slice(0, 20));
      setAmount('');
      toast.success('Swap created. Send your deposit to the address shown below.');
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-4">
        <div>
          <h2 className="text-xl font-bold">Monero Bridge · swap XMR ⇄ any coin</h2>
          <p className="text-sm text-slate-400">Send Monero and receive any of {coins.length || '500+'} coins in your own EVM or UTXO wallet (or the other way round). No account, no sign-up.</p>
        </div>
        {loadErr && <div className="text-sm text-red-400">Couldn’t load coins: {loadErr}</div>}
        {!coins.length && !loadErr && <div className="text-sm text-slate-400 flex items-center gap-2"><RefreshCw className="w-4 h-4 animate-spin" /> Loading coins…</div>}
        {coins.length > 0 && (
          <>
            <div className="bg-slate-950 rounded-lg p-3 space-y-2">
              <AssetPicker coins={coins} value={from} onChange={(a) => { setFrom(a); setRefund(''); }} label="You send" />
              <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(',', '.'))} placeholder="0.0" className="w-full bg-transparent text-2xl outline-none" />
              {rate && rate.minAmount > 0 && <div className="text-xs text-slate-500">Min {fmt(rate.minAmount)} · max {fmt(rate.maxAmount)} {from?.coin.code}</div>}
            </div>
            <div className="flex justify-center -my-2"><button onClick={flip} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700" title="Swap direction"><ArrowDownUp className="w-4 h-4" /></button></div>
            <div className="bg-slate-950 rounded-lg p-3 space-y-2">
              <AssetPicker coins={coins} value={to} onChange={(a) => { setTo(a); setAddress(''); setMemo(''); }} label="You receive (estimated)" />
              <div className="text-2xl">{rate && rate.toAmount > 0 ? fmt(rate.toAmount) : '—'} <span className="text-base text-slate-400">{to?.coin.code}</span></div>
              {rate && rate.rate > 0 && <div className="text-xs text-slate-500">1 {from?.coin.code} ≈ {fmt(rate.rate)} {to?.coin.code} · network fees included</div>}
              {rateErr && <div className="text-xs text-red-400">{rateErr}</div>}
              {below && <div className="text-xs text-orange-300">Below the minimum of {fmt(rate!.minAmount)} {from?.coin.code}.</div>}
              {above && <div className="text-xs text-orange-300">Above the maximum of {fmt(rate!.maxAmount)} {from?.coin.code}.</div>}
              {same && <div className="text-xs text-orange-300">Pick two different coins or networks.</div>}
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-500">Your {to?.coin.code} address ({to?.net.name})</label>
              <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder={`${to?.coin.code} address that receives the coins`}
                className={`w-full bg-slate-950 border rounded-lg px-3 py-2 font-mono text-sm outline-none ${address && !addrOk ? 'border-red-500' : 'border-slate-800 focus:border-yellow-600'}`} />
              {address && !addrOk && <div className="text-xs text-red-400">That doesn’t look like a {to?.net.name} address.</div>}
              {to?.net.memoNeeded && (
                <input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder={`${to.net.memoName || 'Memo'} (required by this network)`}
                  className="w-full bg-slate-950 border border-orange-600 rounded-lg px-3 py-2 font-mono text-sm outline-none" />
              )}
              <input value={refund} onChange={(e) => setRefund(e.target.value)} placeholder={`Refund ${from?.coin.code} address (optional, used if the swap can’t complete)`}
                className={`w-full bg-slate-950 border rounded-lg px-3 py-2 font-mono text-xs outline-none ${!refundOk ? 'border-red-500' : 'border-slate-800 focus:border-yellow-600'}`} />
            </div>
            <button onClick={start} disabled={!ready || busy} className="w-full py-3 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black font-semibold disabled:opacity-50">
              {busy ? 'Creating swap…' : `Swap ${from?.coin.code ?? ''} → ${to?.coin.code ?? ''}`}
            </button>
            <div className="text-[11px] text-slate-500 flex gap-1.5 items-start">
              <ShieldCheck className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-500" />
              <span>Swaps are filled by Exolix, an instant exchange (no account, no KYC for normal amounts). You send to a one-time deposit address and the coins go straight to the address you entered; WATTxchange never holds your funds. Always double-check the receiving address.</span>
            </div>
          </>
        )}
      </div>
      {orders.length > 0 && (
        <div className="space-y-3">
          <div className="text-sm font-semibold text-slate-300">Your swaps</div>
          {orders.map((id) => <OrderCard key={id} id={id} onRemove={() => setOrders((x) => x.filter((i) => i !== id))} />)}
        </div>
      )}
    </div>
  );
}
