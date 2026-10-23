// Cross-chain swaps through the WATTxchange swap router (same router as the WATTxchain
// wallet): THORChain, the WATT/WTX desk, Exolix (incl. Monero), SwapinDEX and Uniswap
// are quoted in parallel and ranked by what you receive. Non-custodial throughout.
import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import { ArrowDownUp, Copy, ExternalLink, ShieldCheck, Wallet } from 'lucide-react';
import { ethers } from 'ethers';
import { EVM_CHAINS } from '../../config/evmChains';
import { walletOn, connectedAccount } from '../../services/marketsService';
import { thorDepositEvm, type ThorQuote } from '../../services/aggregators';
import { wattWtxBridgeService, type BridgeSwap } from '../../services/wattWtxBridgeService';

const ROUTER = 'https://bridge.wattxchange.app/router';
const LS = 'wxc.xchain.swaps.v1';
const COINS = ['WTX', 'WATT', 'BTC', 'ETH', 'XMR', 'USDC', 'USDT', 'LTC', 'DOGE', 'BCH', 'AVAX', 'ATOM', 'RUNE', 'SOL', 'TRX', 'XRP', 'ADA', 'DOT', 'TON', 'ZEC', 'DASH', 'POL', 'ARB', 'XLM', 'ETC'];
// coins we can send straight from an EVM wallet, and how
const THOR_EVM: Record<string, { chainId: number; asset: string }> = {
  ETH: { chainId: 1, asset: 'ETH.ETH' },
  USDC: { chainId: 1, asset: 'ETH.USDC-0XA0B86991C6218B36C1D19D4A2E9EB0CE3606EB48' },
  USDT: { chainId: 1, asset: 'ETH.USDT-0XDAC17F958D2EE523A2206206994597C13D831EC7' },
  AVAX: { chainId: 43114, asset: 'AVAX.AVAX' },
};
const PLAIN_EVM: Record<string, { chainId: number; token: string | null; decimals: number }> = {
  ETH: { chainId: 1, token: null, decimals: 18 },
  USDC: { chainId: 1, token: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 },
  USDT: { chainId: 1, token: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
  POL: { chainId: 137, token: null, decimals: 18 },
  ARB: { chainId: 42161, token: '0x912CE59144191C1204E64559FE8253a0e49E6548', decimals: 18 },
};
const EVM_RECEIVE = new Set(['ETH', 'USDC', 'USDT', 'AVAX', 'WATT', 'POL', 'ARB']);
const PROVIDER_NAME: Record<string, string> = { thorchain: 'THORChain', 'wattx-desk': 'WATTxchange desk', exolix: 'Exolix', swapin: 'SwapinDEX', uniswap: 'Uniswap', gleecdex: 'GleecDEX', sideshift: 'SideShift', changenow: 'ChangeNOW' };
const fmt = (v: number | null | undefined) => (v == null || !Number.isFinite(v) ? '—' : Number(v.toPrecision(8)).toLocaleString(undefined, { maximumFractionDigits: 8 }));
const copy = (t: string, w: string) => { void navigator.clipboard.writeText(t); toast.success(`${w} copied`); };
const errText = (e: unknown) => { const x = e as { code?: string; shortMessage?: string; message?: string }; return x.code === 'ACTION_REJECTED' ? 'Cancelled in the wallet.' : x.shortMessage ?? x.message ?? String(e); };

interface Route { provider: string; outAmount: number; feeOut?: number; etaSeconds?: number | null; minAmount?: number | null; maxAmount?: number | null; custody?: string; platformFee?: { bps: number; status: string } }
interface RSwap {
  id: string; provider: string; from: string; to: string; amount: string | number; destination: string; expectedOut: number; state: string; createdAt: string;
  depositAddress?: string | null; memo?: string | null; router?: string | null; expiry?: number | null; lockParams?: BridgeSwap['lockParams'] | null;
  deskSwapId?: string; txid?: string; instructions?: string; live?: { state?: string; hashIn?: string; hashOut?: string; payoutTx?: string };
}

async function api<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${ROUTER}${path}`, body ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : undefined);
  const j = await res.json().catch(() => ({}));
  if (!res.ok || j.error) throw new Error(j.error ?? `HTTP ${res.status}`);
  return j as T;
}

function SwapCard({ id, onRemove }: { id: string; onRemove: () => void }) {
  const [s, setS] = useState<RSwap | null>(null);
  const [txid, setTxid] = useState('');
  const [step, setStep] = useState<string | null>(null);
  const [desk, setDesk] = useState<BridgeSwap | null>(null);
  const load = () => api<{ swap: RSwap }>(`/swap/${id}`).then((r) => {
    setS(r.swap);
    if (r.swap.provider === 'wattx-desk' && r.swap.deskSwapId) wattWtxBridgeService.getSwap(r.swap.deskSwapId).then(setDesk).catch(() => {});
  }).catch(() => {});
  useEffect(() => { load(); const t = setInterval(load, 15_000); return () => clearInterval(t); }, [id]);
  if (!s) return <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-sm text-slate-400">Loading swap {id}…</div>;
  const state = s.live?.state ?? s.state;
  const waiting = state === 'awaiting_deposit' || state === 'created';
  const done = state === 'completed' || state === 'paid' || state === 'done';
  const thorEvm = s.provider === 'thorchain' ? THOR_EVM[s.from] : undefined;
  const plainEvm = s.provider === 'exolix' ? PLAIN_EVM[s.from] : undefined;
  const isLock = s.provider === 'wattx-desk' && s.lockParams;

  const sendFromWallet = async () => {
    setStep('Opening your wallet…');
    try {
      let hash: string;
      if (thorEvm) {
        const signer = await walletOn(EVM_CHAINS[thorEvm.chainId]);
        const q = { inbound_address: s.depositAddress!, router: s.router ?? undefined, memo: s.memo ?? '', expiry: s.expiry ?? Math.floor(Date.now() / 1000) + 900 } as unknown as ThorQuote;
        hash = await thorDepositEvm({ signer, from: thorEvm.asset, amountIn: String(s.amount), quote: q, onStep: setStep });
        await api(`/swap/${s.id}/sent`, { txid: hash.replace(/^0x/, '').toUpperCase() });
      } else if (plainEvm) {
        const signer = await walletOn(EVM_CHAINS[plainEvm.chainId]);
        const to = ethers.getAddress(s.depositAddress!);
        setStep('Confirm the transfer in your wallet…');
        if (!plainEvm.token) hash = (await signer.sendTransaction({ to, value: ethers.parseEther(String(s.amount)) })).hash;
        else hash = (await new ethers.Contract(plainEvm.token, ['function transfer(address,uint256) returns (bool)'], signer).transfer(to, ethers.parseUnits(String(s.amount), plainEvm.decimals))).hash;
      } else if (isLock) {
        const signer = await walletOn(EVM_CHAINS[s.lockParams!.chainId]);
        setStep('Approve and lock WATT in your wallet…');
        hash = await wattWtxBridgeService.lockWatt(signer, { id: s.deskSwapId, lockParams: s.lockParams } as BridgeSwap, String(s.amount));
        // pay the desk's relay fee right away from the same wallet
        const d = desk ?? (s.deskSwapId ? await wattWtxBridgeService.getSwap(s.deskSwapId) : null);
        if (d?.relayFee && !d.relayFeePaid) {
          setStep(`Confirm the ${d.relayFee.amount} ${d.relayFee.coin} relay fee…`);
          try { setDesk(await wattWtxBridgeService.payRelayFee(signer, d, hash)); } catch (e) { toast.error(`Fee not recorded: ${errText(e)}. Use “Pay fee” below.`); }
        }
      } else return;
      toast.success(`Sent (${hash.slice(0, 10)}…). The swap continues on its own.`);
      load();
    } catch (e) { toast.error(errText(e)); } finally { setStep(null); }
  };
  const markSent = async () => {
    try { await api(`/swap/${s.id}/sent`, { txid: txid.trim().replace(/^0x/, '') }); setTxid(''); toast.success('Tracking your deposit.'); load(); } catch (e) { toast.error(errText(e)); }
  };
  // WATT<->WTX desk payouts wait for a small relay fee in the chain's gas coin (POL/ALT)
  const fee = desk?.relayFee && !desk.relayFeePaid ? desk.relayFee : null;
  const feePayer = desk ? (desk.direction === 'WTX_TO_WATT' ? desk.destAddress : desk.evm?.sender) : null;
  const FEE_CHAIN: Record<string, number> = { polygon: 137, alt: 2330 };
  const payFee = async () => {
    if (!desk || !fee) return;
    setStep('Confirm the relay fee in your wallet…');
    try {
      const signer = await walletOn(EVM_CHAINS[FEE_CHAIN[fee.chain]]);
      setDesk(await wattWtxBridgeService.payRelayFee(signer, desk));
      toast.success('Relay fee paid. The payout goes out next.');
    } catch (e) { toast.error(errText(e)); } finally { setStep(null); }
  };
  const evmLabel = thorEvm ? EVM_CHAINS[thorEvm.chainId].name : plainEvm ? EVM_CHAINS[plainEvm.chainId].name : isLock ? EVM_CHAINS[s.lockParams!.chainId]?.name : '';

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
      <div className="flex justify-between gap-2">
        <div>
          <div className="font-semibold">{fmt(Number(s.amount))} {s.from} → ≈{fmt(s.expectedOut)} {s.to}</div>
          <div className="text-xs text-slate-500">via {PROVIDER_NAME[s.provider] ?? s.provider} · {new Date(s.createdAt).toLocaleString()} · to {s.destination.slice(0, 8)}…{s.destination.slice(-6)}</div>
        </div>
        {(done || state === 'expired' || state === 'refunded') && <button onClick={onRemove} className="text-xs text-slate-500 hover:text-slate-300">Remove</button>}
      </div>
      <div className={`text-sm ${done ? 'text-emerald-400' : waiting ? 'text-yellow-300' : 'text-sky-300'}`}>
        {done ? 'Done: paid out to your address.' : waiting ? (s.txid ? 'Deposit sent, waiting for it to confirm.' : 'Waiting for your deposit.') : state === 'expired' ? 'Expired: no deposit arrived in time.' : `In progress (${state.replace(/_/g, ' ')}).`}
      </div>
      {waiting && !s.txid && (s.depositAddress || isLock) && (
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          {s.depositAddress && <div className="bg-white p-2 rounded-lg shrink-0"><QRCodeSVG value={s.depositAddress} size={120} /></div>}
          <div className="min-w-0 space-y-2 text-sm flex-1">
            {s.depositAddress && <>
              <div>Send exactly <b>{fmt(Number(s.amount))} {s.from}</b> to:</div>
              <button onClick={() => copy(s.depositAddress!, 'Deposit address')} className="w-full text-left font-mono text-xs break-all bg-slate-950 border border-slate-800 rounded p-2 hover:border-yellow-600">{s.depositAddress} <Copy className="inline w-3 h-3" /></button>
            </>}
            {s.memo && (
              <button onClick={() => copy(s.memo!, 'Memo')} className="w-full text-left font-mono text-xs break-all bg-slate-950 border border-orange-600 rounded p-2">
                Memo (required{s.provider === 'thorchain' ? ', as an OP_RETURN / memo field' : ''}): {s.memo} <Copy className="inline w-3 h-3" />
              </button>
            )}
            {s.provider === 'thorchain' && !thorEvm && <div className="text-xs text-orange-300">Your wallet must put the memo in the transaction (e.g. Electrum “OP_RETURN”, Ctrl, Vultisig, ASGARDEX). Without it THORChain refunds you. Then paste the transaction ID below so we can track it.</div>}
            {(thorEvm || plainEvm || isLock) && (
              <button disabled={!!step} onClick={sendFromWallet} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black font-semibold text-sm disabled:opacity-50">
                <Wallet className="w-4 h-4" />{step ?? (isLock ? `Lock ${fmt(Number(s.amount))} WATT from wallet (${evmLabel})` : `Send from wallet (${evmLabel})`)}
              </button>
            )}
            {s.provider === 'thorchain' && (
              <div className="flex gap-2">
                <input value={txid} onChange={(e) => setTxid(e.target.value)} placeholder="Paid from another wallet? Paste the transaction ID" className="flex-1 min-w-0 bg-slate-950 border border-slate-800 rounded px-2 py-1.5 font-mono text-xs" />
                <button onClick={markSent} disabled={txid.trim().length < 20} className="px-3 rounded bg-slate-700 text-xs disabled:opacity-40">Track</button>
              </div>
            )}
          </div>
        </div>
      )}
      {fee && (
        <div className="bg-slate-950 border border-yellow-700/50 rounded-lg p-3 text-sm space-y-2">
          <div>Relay fee: <b>{fee.amount} {fee.coin}</b> (covers the payout’s gas). The payout waits until it’s paid.</div>
          {feePayer ? (
            <button disabled={!!step} onClick={payFee} className="px-3 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black font-semibold text-sm disabled:opacity-50">{step ?? `Pay ${fee.amount} ${fee.coin}`}</button>
          ) : <div className="text-xs text-slate-400">Lock your WATT first; the fee is paid from the same wallet.</div>}
        </div>
      )}
      {s.instructions && waiting && <div className="text-[11px] text-slate-500">{s.instructions}</div>}
      <div className="flex gap-4 text-xs">
        {s.txid && s.provider === 'thorchain' && <a href={`https://thorchain.net/tx/${s.txid}`} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-yellow-400 inline-flex items-center gap-1">Track on THORChain <ExternalLink className="w-3 h-3" /></a>}
        {s.live?.hashOut && <a href={s.live.hashOut} target="_blank" rel="noopener noreferrer" className="text-emerald-400 inline-flex items-center gap-1">Payout tx <ExternalLink className="w-3 h-3" /></a>}
      </div>
    </div>
  );
}

export default function CrossChainSwap() {
  const [from, setFrom] = useState('BTC');
  const [to, setTo] = useState('ETH');
  const [amount, setAmount] = useState('');
  const [routes, setRoutes] = useState<Route[] | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [pick, setPick] = useState<string | null>(null);
  const [dest, setDest] = useState('');
  const [refund, setRefund] = useState('');
  const [busy, setBusy] = useState(false);
  const [ids, setIds] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem(LS) ?? '[]'); } catch { return []; } });
  useEffect(() => { localStorage.setItem(LS, JSON.stringify(ids)); }, [ids]);
  useEffect(() => { if (EVM_RECEIVE.has(to) && !dest) connectedAccount().then((a) => a && setDest((d) => d || a)); }, [to]);

  useEffect(() => {
    setRoutes(null); setNote(null); setPick(null);
    if (!(Number(amount) > 0) || from === to) return undefined;
    let off = false;
    const t = setTimeout(() => {
      fetch(`${ROUTER}/quote?from=${from}&to=${to}&amount=${amount}`).then((r) => r.json()).then((q) => {
        if (off) return;
        const rs: Route[] = q.routes ?? [];
        setRoutes(rs); setPick(rs[0]?.provider ?? null);
        setNote(rs.length ? null : q.note ?? (q.errors?.[0]?.error ? `No route: ${q.errors[0].error}` : 'No route for this pair right now.'));
      }).catch((e) => !off && setNote(errText(e)));
    }, 450);
    return () => { off = true; clearTimeout(t); };
  }, [from, to, amount]);

  const chosen = routes?.find((r) => r.provider === pick) ?? null;
  const tooSmall = chosen?.minAmount && Number(amount) < chosen.minAmount;
  const start = async () => {
    setBusy(true);
    try {
      const r = await api<{ swap: RSwap }>('/swap', { from, to, amount: Number(amount), destination: dest.trim(), provider: pick, refund: refund.trim() || undefined });
      setIds((x) => [r.swap.id, ...x.filter((i) => i !== r.swap.id)].slice(0, 25));
      setAmount('');
      toast.success('Swap created. Send your deposit below.');
    } catch (e) { toast.error(errText(e)); } finally { setBusy(false); }
  };
  const sel = (v: string, set: (s: string) => void) => (
    <select value={v} onChange={(e) => set(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 font-semibold">
      {COINS.map((c) => <option key={c}>{c}</option>)}
    </select>
  );
  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-4">
        <div>
          <h2 className="text-xl font-bold">Cross-chain swap</h2>
          <p className="text-sm text-slate-400">Native coins across chains: THORChain (BTC, ETH, LTC, DOGE, BCH, AVAX, ATOM, RUNE, USDC, USDT), the WATTxchange desk (WATT ⇄ WTX) and Exolix (XMR, SOL, TRX, XRP, ADA and more). Every route is quoted and the best one is picked for you.</p>
        </div>
        <div className="bg-slate-950 rounded-lg p-3 space-y-2">
          <div className="text-xs text-slate-500">You send</div>
          <div className="flex gap-2 items-center">{sel(from, setFrom)}
            <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(',', '.'))} placeholder="0.0" className="flex-1 min-w-0 bg-transparent text-2xl outline-none" /></div>
        </div>
        <div className="flex justify-center -my-2"><button onClick={() => { setFrom(to); setTo(from); setDest(''); }} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700"><ArrowDownUp className="w-4 h-4" /></button></div>
        <div className="bg-slate-950 rounded-lg p-3 space-y-2">
          <div className="text-xs text-slate-500">You receive</div>
          <div className="flex gap-2 items-center">{sel(to, (v) => { setTo(v); setDest(''); })}<div className="text-2xl">{chosen ? fmt(chosen.outAmount) : '—'}</div></div>
        </div>
        {from === to && <div className="text-xs text-orange-300">Pick two different coins.</div>}
        {note && <div className="text-xs text-orange-300">{note}</div>}
        {routes && routes.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs text-slate-500">Routes ({routes.length})</div>
            {routes.map((r, i) => (
              <button key={r.provider} onClick={() => setPick(r.provider)} className={`w-full flex justify-between items-center text-left px-3 py-2 rounded-lg border text-sm ${pick === r.provider ? 'border-yellow-500 bg-yellow-500/10' : 'border-slate-800 hover:border-slate-600'}`}>
                <span>{PROVIDER_NAME[r.provider] ?? r.provider}{i === 0 && <span className="ml-2 text-[10px] text-emerald-400">BEST</span>}
                  <span className="block text-[11px] text-slate-500">{r.custody}{r.etaSeconds ? ` · ~${Math.max(1, Math.round(r.etaSeconds / 60))} min` : ''}{r.minAmount ? ` · min ${fmt(r.minAmount)} ${from}` : ''}</span></span>
                <span className="font-semibold">{fmt(r.outAmount)} {to}</span>
              </button>
            ))}
          </div>
        )}
        {tooSmall && <div className="text-xs text-orange-300">Below this route’s minimum of {fmt(chosen!.minAmount)} {from}.</div>}
        <input value={dest} onChange={(e) => setDest(e.target.value)} placeholder={`Your ${to} receive address`} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 font-mono text-sm outline-none focus:border-yellow-600" />
        {pick === 'exolix' && <input value={refund} onChange={(e) => setRefund(e.target.value)} placeholder={`Refund ${from} address (optional)`} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 font-mono text-xs outline-none" />}
        <button onClick={start} disabled={busy || !chosen || !dest.trim() || !!tooSmall} className="w-full py-3 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black font-semibold disabled:opacity-50">
          {busy ? 'Creating swap…' : `Swap ${from} → ${to}${chosen ? ` via ${PROVIDER_NAME[chosen.provider] ?? chosen.provider}` : ''}`}
        </button>
        <div className="text-[11px] text-slate-500 flex gap-1.5 items-start"><ShieldCheck className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-500" />
          <span>THORChain swaps go to THORChain’s own vaults; WATT locks are refundable HTLCs; Exolix gives a one-time deposit address. WATTxchange never holds your coins.</span></div>
      </div>
      {ids.length > 0 && <div className="space-y-3"><div className="text-sm font-semibold text-slate-300">Your swaps</div>
        {ids.map((id) => <SwapCard key={id} id={id} onRemove={() => setIds((x) => x.filter((i) => i !== id))} />)}</div>}
    </div>
  );
}
