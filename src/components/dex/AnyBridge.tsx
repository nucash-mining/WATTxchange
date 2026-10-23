// One bridge for every coin. Each request is quoted on every real route we have, best first:
//  - the WATTxchange swap router: THORChain (BTC, ETH, LTC, DOGE, BCH, ATOM, USDC/USDT…),
//    the WATT<->WTX desk, Exolix, SwapinDEX, Uniswap
//  - Exolix directly: ~500 coins on ~95 networks incl. Monero, Sonic, Solana, Tron…
//  - the desk's WATT Polygon <-> Altcoinchain leg
// Nothing is custodied by WATTxchange; every route is executed in-app.
import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowDownUp, RefreshCw, ShieldCheck } from 'lucide-react';
import { ethers } from 'ethers';
import { swapCoins, swapRate, createSwap as exolixCreate, validAddress, EVM_NETWORK_CHAIN, type SwapCoin, type SwapAsset, type SwapNetwork } from '../../services/instantSwap';
import { connectedAccount, walletOn } from '../../services/marketsService';
import { EVM_CHAINS } from '../../config/evmChains';
import { wattWtxBridgeService, type BridgeSwap } from '../../services/wattWtxBridgeService';
import { AssetPicker, OrderCard, LS_ORDERS } from '../bridge/MoneroSwap';
import { SwapCard, api, PROVIDER_NAME, LS as LS_ROUTER } from './CrossChainSwap';

const LS_DESK = 'wxc.anybridge.desk.v1';
const EVM_RE = '^0x[a-fA-F0-9]{40}$';
const net = (network: string, name: string, addressRegex: string): SwapNetwork =>
  ({ network, name, shortName: network, addressRegex, memoNeeded: false, memoName: '', memoRegex: '', contract: null, isDefault: true });
// our own coins, not on any exchange
const OWN: SwapCoin[] = [
  { code: 'WTX', name: 'WATTx', icon: `${import.meta.env.BASE_URL}WTX logo.png`, networks: [net('WTX', 'WATTxchain', '^W[1-9A-HJ-NP-Za-km-z]{25,40}$')] },
  { code: 'WATT', name: 'WATT', icon: `${import.meta.env.BASE_URL}WATT logo.png`, networks: [net('POLYGON', 'Polygon', EVM_RE), net('ALT', 'Altcoinchain', EVM_RE)] },
];
// (coin, network) -> the router's ticker
const ROUTER: Record<string, string> = {
  'BTC|BTC': 'BTC', 'ETH|ETH': 'ETH', 'LTC|LTC': 'LTC', 'DOGE|DOGE': 'DOGE', 'BCH|BCH': 'BCH', 'ATOM|ATOM': 'ATOM',
  'USDC|ETH': 'USDC', 'USDT|ETH': 'USDT', 'XMR|XMR': 'XMR', 'SOL|SOL': 'SOL', 'TRX|TRX': 'TRX', 'XRP|XRP': 'XRP',
  'ADA|ADA': 'ADA', 'DOT|DOT': 'DOT', 'TON|TON': 'TON', 'ZEC|ZEC': 'ZEC', 'DASH|DASH': 'DASH', 'POL|MATIC': 'POL',
  'ARB|ARBITRUM': 'ARB', 'XLM|XLM': 'XLM', 'ETC|ETC': 'ETC', 'WTX|WTX': 'WTX', 'WATT|POLYGON': 'WATT', 'WATT|ALT': 'WATT',
};
const tick = (a: SwapAsset | null) => (a ? ROUTER[`${a.coin.code}|${a.net.network}`] : undefined);
const isOwn = (a: SwapAsset | null) => !!a && OWN.some((c) => c.code === a.coin.code);
const wattChain = (a: SwapAsset) => (a.net.network === 'ALT' ? 'alt' : 'polygon');
const fmt = (v: number | null | undefined) => (v == null || !Number.isFinite(v) ? '—' : Number(v.toPrecision(8)).toLocaleString(undefined, { maximumFractionDigits: 8 }));
const load = (k: string): string[] => { try { return JSON.parse(localStorage.getItem(k) ?? '[]'); } catch { return []; } };
const errText = (e: unknown) => { const x = e as { code?: string; shortMessage?: string; message?: string }; return x.code === 'ACTION_REJECTED' ? 'Cancelled in the wallet.' : x.shortMessage ?? x.message ?? String(e); };

interface Route { key: string; kind: 'router' | 'exolix' | 'desk'; provider: string; outAmount: number; detail: string; minAmount?: number | null }

function DeskCard({ id, onRemove }: { id: string; onRemove: () => void }) {
  const [s, setS] = useState<BridgeSwap | null>(null);
  useEffect(() => { const l = () => wattWtxBridgeService.getSwap(id).then(setS).catch(() => {}); l(); const t = setInterval(l, 15_000); return () => clearInterval(t); }, [id]);
  if (!s) return <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-sm text-slate-400">Loading {id}…</div>;
  const done = s.state === 'completed' || s.state === 'paid';
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-sm space-y-1">
      <div className="flex justify-between"><b>WATT {s.sourceChain} → {s.destChain}</b>{done && <button onClick={onRemove} className="text-xs text-slate-500">Remove</button>}</div>
      <div className={done ? 'text-emerald-400' : 'text-yellow-300'}>{done ? 'Done: WATT paid out.' : s.feeNote ?? s.state.replace(/_/g, ' ')}</div>
      <div className="text-xs text-slate-500">{s.id} · to {s.destAddress}</div>
    </div>
  );
}

export default function AnyBridge() {
  const [coins, setCoins] = useState<SwapCoin[]>(OWN);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [from, setFrom] = useState<SwapAsset | null>(null);
  const [to, setTo] = useState<SwapAsset | null>(null);
  const [amount, setAmount] = useState('');
  const [routes, setRoutes] = useState<Route[] | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [minHint, setMinHint] = useState<number | null>(null);
  const [pick, setPick] = useState<string | null>(null);
  const [dest, setDest] = useState('');
  const [memo, setMemo] = useState('');
  const [refund, setRefund] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [rIds, setRIds] = useState<string[]>(() => load(LS_ROUTER));
  const [xIds, setXIds] = useState<string[]>(() => load(LS_ORDERS));
  const [dIds, setDIds] = useState<string[]>(() => load(LS_DESK));
  useEffect(() => { localStorage.setItem(LS_ROUTER, JSON.stringify(rIds)); }, [rIds]);
  useEffect(() => { localStorage.setItem(LS_ORDERS, JSON.stringify(xIds)); }, [xIds]);
  useEffect(() => { localStorage.setItem(LS_DESK, JSON.stringify(dIds)); }, [dIds]);

  useEffect(() => {
    swapCoins().then((c) => {
      const all = [...OWN, ...c.filter((x) => !OWN.some((o) => o.code === x.code))];
      setCoins(all);
      const find = (code: string, n?: string) => { const coin = all.find((x) => x.code === code); return coin ? { coin, net: coin.networks.find((x) => x.network === n) ?? coin.networks.find((x) => x.isDefault) ?? coin.networks[0] } : null; };
      setFrom((f) => f ?? find('XMR')); setTo((t) => t ?? find('BTC'));
    }).catch((e) => { setLoadErr(e.message); setFrom((f) => f ?? { coin: OWN[1], net: OWN[1].networks[0] }); setTo((t) => t ?? { coin: OWN[0], net: OWN[0].networks[0] }); });
  }, []);
  useEffect(() => {
    if (!to || dest) return;
    if (EVM_NETWORK_CHAIN[to.net.network] || to.coin.code === 'WATT') connectedAccount().then((a) => a && setDest((d) => d || a));
  }, [to]);

  // quote every route that can do this pair, best first
  useEffect(() => {
    setRoutes(null); setPick(null); setMinHint(null);
    if (!from || !to || !(Number(amount) > 0)) return undefined;
    if (from.coin.code === to.coin.code && from.net.network === to.net.network) return undefined;
    let off = false;
    const t = setTimeout(async () => {
      setQuoting(true);
      const out: Route[] = [];
      const jobs: Promise<void>[] = [];
      const fT = tick(from), tT = tick(to);
      if (from.coin.code === 'WATT' && to.coin.code === 'WATT') {
        jobs.push(wattWtxBridgeService.quote({ direction: 'EVM_TO_EVM', amount, sourceChain: wattChain(from), destChain: wattChain(to) })
          .then((q) => { out.push({ key: 'desk', kind: 'desk', provider: 'wattx-desk', outAmount: Number(q.amountOut), detail: `WATTxchange desk · relay fee ${q.relayFee ? `${Number(q.relayFee.amount).toPrecision(2)} ${q.relayFee.coin}` : '—'}` }); }).catch(() => {}));
      } else if (fT && tT) {
        const chain = from.coin.code === 'WATT' ? wattChain(from) : to.coin.code === 'WATT' ? wattChain(to) : undefined;
        jobs.push(fetch(`https://bridge.wattxchange.app/router/quote?from=${fT}&to=${tT}&amount=${amount}${chain ? `&chain=${chain}` : ''}`).then((r) => r.json()).then((q) => {
          for (const r of q.routes ?? []) out.push({ key: `router:${r.provider}`, kind: 'router', provider: r.provider, outAmount: r.outAmount, minAmount: r.minAmount ?? null,
            detail: `${r.custody ?? ''}${r.etaSeconds ? ` · ~${Math.max(1, Math.round(r.etaSeconds / 60))} min` : ''}` });
        }).catch(() => {}));
      }
      if (!isOwn(from) && !isOwn(to)) {
        jobs.push(swapRate(from, to, amount).then((r) => {
          if (!(r.toAmount > 0) && r.minAmount && Number(amount) < r.minAmount) setMinHint(r.minAmount);
          if (r.toAmount > 0) out.push({ key: 'exolix', kind: 'exolix', provider: 'exolix', outAmount: r.toAmount, minAmount: r.minAmount, detail: `instant exchange, any network · min ${fmt(r.minAmount)} ${from.coin.code}` });
        }).catch(() => {}));
      }
      await Promise.all(jobs);
      if (off) return;
      // the router also quotes Exolix for its own tickers; keep one Exolix line
      const seen = new Set<string>();
      const list = out.sort((a, b) => b.outAmount - a.outAmount).filter((r) => { const k = r.provider; if (seen.has(k)) return false; seen.add(k); return true; });
      setRoutes(list); setPick(list[0]?.key ?? null); setQuoting(false);
    }, 450);
    return () => { off = true; clearTimeout(t); setQuoting(false); };
  }, [from, to, amount]);

  const chosen = routes?.find((r) => r.key === pick) ?? null;
  const addrOk = to ? validAddress(to.net, dest) : false;
  const tooSmall = chosen?.minAmount ? Number(amount) < chosen.minAmount : false;
  const flip = () => { setFrom(to); setTo(from); setDest(''); setMemo(''); setRefund(''); };

  const start = async () => {
    if (!from || !to || !chosen) return;
    try {
      if (chosen.kind === 'exolix') {
        setBusy('Creating the exchange…');
        const o = await exolixCreate({ from, to, amount, address: dest, memo, refund });
        setXIds((x) => [o.id, ...x.filter((i) => i !== o.id)].slice(0, 25));
      } else if (chosen.kind === 'router') {
        setBusy('Creating the swap…');
        const chain = from.coin.code === 'WATT' ? wattChain(from) : to.coin.code === 'WATT' ? wattChain(to) : undefined;
        const r = await api<{ swap: { id: string } }>('/swap', { from: tick(from), to: tick(to), amount: Number(amount), destination: dest.trim(), provider: chosen.provider, refund: refund.trim() || undefined, chain });
        setRIds((x) => [r.swap.id, ...x.filter((i) => i !== r.swap.id)].slice(0, 25));
      } else {
        // WATT Polygon <-> Altcoinchain: create, lock from the wallet, pay the relay fee
        setBusy('Creating the bridge…');
        const sw = await wattWtxBridgeService.createSwap({ direction: 'EVM_TO_EVM', sourceChain: wattChain(from), destChain: wattChain(to), destAddress: dest.trim() });
        setDIds((x) => [sw.id, ...x].slice(0, 25));
        const signer = await walletOn(EVM_CHAINS[wattChain(from) === 'alt' ? 2330 : 137]);
        setBusy('Approve and lock your WATT in the wallet…');
        const lockTx = await wattWtxBridgeService.lockWatt(signer, sw, amount);
        if (sw.relayFee) { setBusy('Confirm the relay fee…'); await wattWtxBridgeService.payRelayFee(signer, sw, lockTx); }
      }
      setAmount('');
      toast.success('Bridge started. Follow it below.');
    } catch (e) { toast.error(errText(e)); } finally { setBusy(null); }
  };

  const total = rIds.length + xIds.length + dIds.length;
  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-4">
        <div>
          <h2 className="text-xl font-bold">Bridge · any coin to any coin</h2>
          <p className="text-sm text-slate-400">Monero, Bitcoin, Ethereum, Sonic, Solana, Tron, WATT, WTX and {coins.length > 100 ? `${coins.length - 2} more` : 'hundreds more'}, across chains, to EVM or UTXO wallets. Every route is quoted and the best one is picked for you.</p>
        </div>
        {loadErr && <div className="text-xs text-orange-300">Exchange coin list unavailable ({loadErr}); WATT, WTX and THORChain routes still work.</div>}
        {coins.length <= 2 && !loadErr && <div className="text-sm text-slate-400 flex items-center gap-2"><RefreshCw className="w-4 h-4 animate-spin" /> Loading coins…</div>}
        <div className="bg-slate-950 rounded-lg p-3 space-y-2">
          <AssetPicker coins={coins} value={from} onChange={(a) => { setFrom(a); setRefund(''); }} label="You send" />
          <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(',', '.'))} placeholder="0.0" className="w-full bg-transparent text-2xl outline-none" />
        </div>
        <div className="flex justify-center -my-2"><button onClick={flip} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700"><ArrowDownUp className="w-4 h-4" /></button></div>
        <div className="bg-slate-950 rounded-lg p-3 space-y-2">
          <AssetPicker coins={coins} value={to} onChange={(a) => { setTo(a); setDest(''); setMemo(''); }} label="You receive" />
          <div className="text-2xl">{chosen ? fmt(chosen.outAmount) : '—'} <span className="text-base text-slate-400">{to?.coin.code}</span></div>
        </div>
        {quoting && <div className="text-xs text-slate-400">Comparing routes…</div>}
        {routes && routes.length === 0 && !quoting && <div className="text-xs text-orange-300">{minHint ? `The minimum for this pair is ${fmt(minHint)} ${from?.coin.code}.` : 'No route for this pair and amount right now. Try a larger amount or another network.'}</div>}
        {routes && routes.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs text-slate-500">Routes ({routes.length})</div>
            {routes.map((r, i) => (
              <button key={r.key} onClick={() => setPick(r.key)} className={`w-full flex justify-between items-center text-left px-3 py-2 rounded-lg border text-sm ${pick === r.key ? 'border-yellow-500 bg-yellow-500/10' : 'border-slate-800 hover:border-slate-600'}`}>
                <span>{PROVIDER_NAME[r.provider] ?? r.provider}{i === 0 && <span className="ml-2 text-[10px] text-emerald-400">BEST</span>}<span className="block text-[11px] text-slate-500">{r.detail}</span></span>
                <span className="font-semibold">{fmt(r.outAmount)} {to?.coin.code}</span>
              </button>
            ))}
          </div>
        )}
        {tooSmall && <div className="text-xs text-orange-300">Below this route’s minimum of {fmt(chosen!.minAmount)} {from?.coin.code}.</div>}
        <input value={dest} onChange={(e) => setDest(e.target.value)} placeholder={`Your ${to?.coin.code ?? ''} address (${to?.net.name ?? ''})`}
          className={`w-full bg-slate-950 border rounded-lg px-3 py-2 font-mono text-sm outline-none ${dest && !addrOk ? 'border-red-500' : 'border-slate-800 focus:border-yellow-600'}`} />
        {dest && !addrOk && <div className="text-xs text-red-400">That doesn’t look like a {to?.net.name} address.</div>}
        {to?.net.memoNeeded && <input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder={`${to.net.memoName || 'Memo'} (required)`} className="w-full bg-slate-950 border border-orange-600 rounded-lg px-3 py-2 font-mono text-sm outline-none" />}
        {chosen?.kind === 'exolix' && <input value={refund} onChange={(e) => setRefund(e.target.value)} placeholder={`Refund ${from?.coin.code} address (optional)`} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 font-mono text-xs outline-none" />}
        <button onClick={start} disabled={!!busy || !chosen || !addrOk || tooSmall || (to?.net.memoNeeded && !memo)} className="w-full py-3 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black font-semibold disabled:opacity-50">
          {busy ?? `Bridge ${from?.coin.code ?? ''} → ${to?.coin.code ?? ''}${chosen ? ` via ${PROVIDER_NAME[chosen.provider] ?? chosen.provider}` : ''}`}
        </button>
        <div className="text-[11px] text-slate-500 flex gap-1.5 items-start"><ShieldCheck className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-500" />
          <span>Routes: THORChain vaults, the WATTxchange desk (refundable HTLC locks), and Exolix one-time deposit addresses. WATTxchange never holds your coins. Double-check the receiving address.</span></div>
      </div>
      {total > 0 && (
        <div className="space-y-3">
          <div className="text-sm font-semibold text-slate-300">Your bridges</div>
          {dIds.map((id) => <DeskCard key={id} id={id} onRemove={() => setDIds((x) => x.filter((i) => i !== id))} />)}
          {rIds.map((id) => <SwapCard key={id} id={id} onRemove={() => setRIds((x) => x.filter((i) => i !== id))} />)}
          {xIds.map((id) => <OrderCard key={id} id={id} onRemove={() => setXIds((x) => x.filter((i) => i !== id))} />)}
        </div>
      )}
    </div>
  );
}
