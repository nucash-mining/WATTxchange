// In-app trade panels for Hyperliquid (spot + perps) and THORChain (native cross-chain).
import React, { useEffect, useMemo, useState } from 'react';
import { ethers } from 'ethers';
import { ShieldCheck, Copy, ExternalLink, KeyRound } from 'lucide-react';
import { EVM_CHAINS } from '../../config/evmChains';
import { walletOn, balanceOf, type Market } from '../../services/marketsService';
import * as HL from '../../services/hyperliquid';
import {
  thorAssets, thorQuote, thorDepositEvm, thorStatus, thorEvmChain, thorSymbol, thorChainOf, thorAddressHint,
  type ThorQuote,
} from '../../services/aggregators';

const fmt = (v: number | null | undefined, d = 6) => (v == null || !Number.isFinite(v) ? '—' : Number(v.toPrecision(d)).toLocaleString(undefined, { maximumFractionDigits: 8 }));
const btn = 'w-full py-3 rounded-lg font-semibold disabled:opacity-50';
const errText = (e: unknown) => {
  const x = e as { code?: string; shortMessage?: string; message?: string };
  return x.code === 'ACTION_REJECTED' ? 'Cancelled in the wallet.' : x.shortMessage ?? x.message ?? String(e);
};

// ================================================================ Hyperliquid ====

export function HyperliquidPanel({ market: m, spot }: { market: Market; spot: boolean }) {
  const arb = EVM_CHAINS[42161];
  const [account, setAccount] = useState<string | null>(null);
  const [agent, setAgent] = useState<ethers.Wallet | null>(null);
  const [bal, setBal] = useState<HL.HlBalances | null>(null);
  const [arbUsdc, setArbUsdc] = useState<number | null>(null);
  const [asset, setAsset] = useState<HL.HlAsset | null>(null);
  const [mid, setMid] = useState<number | null>(null);
  const [buy, setBuy] = useState(true);
  const [amount, setAmount] = useState('');
  const [slippage, setSlippage] = useState(100);
  const [step, setStep] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [showFund, setShowFund] = useState(false);
  const [dep, setDep] = useState('');
  const [tick, setTick] = useState(0);
  const coin = m.coin ?? m.base.symbol;

  useEffect(() => {
    let off = false;
    HL.assetFor(coin, spot).then((a) => { if (!off) setAsset(a); }).catch((e) => setError(errText(e)));
    return () => { off = true; };
  }, [coin, spot]);
  useEffect(() => {
    if (!asset) return undefined;
    const load = () => HL.midPrice(asset).then(setMid).catch(() => {});
    load(); const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [asset]);
  useEffect(() => {
    if (!account) return;
    HL.balances(account).then(setBal).catch(() => setBal(null));
    balanceOf(arb, HL.ARB_USDC, account).then((b) => setArbUsdc(Number(ethers.formatUnits(b, 6)))).catch(() => setArbUsdc(null));
  }, [account, tick]);

  const run = async (label: string, fn: () => Promise<string | void>) => {
    setError(null); setDone(null); setStep(label);
    try { const r = await fn(); if (r) setDone(r); setTick((t) => t + 1); } catch (e) { setError(errText(e)); } finally { setStep(null); }
  };
  const connect = () => run('Connecting…', async () => {
    const s = await walletOn(arb); const a = await s.getAddress();
    setAccount(a); setAgent(HL.loadAgent(a));
  });
  const enable = () => run('Sign the approval in your wallet…', async () => {
    const s = await walletOn(arb);
    try { setAgent(await HL.approveAgent(s)); }
    catch (e) {
      if (/deposit/i.test(errText(e))) { setShowFund(true); throw new Error('Your Hyperliquid account is empty. Deposit USDC first (below), then enable trading.'); }
      throw e;
    }
    return 'Trading enabled for this browser.';
  });
  const deposit = () => run('Confirm the USDC transfer in your wallet…', async () => {
    const h = await HL.depositUsdc(await walletOn(arb), dep);
    setDep('');
    return `Deposit sent (arrives in about a minute). Tx ${h.slice(0, 10)}…`;
  });
  const move = (toPerp: boolean, amt: string) => run('Sign in your wallet…', async () => {
    await HL.moveUsdc(await walletOn(arb), amt, toPerp);
    return `Moved ${amt} USDC to ${toPerp ? 'perps' : 'spot'}.`;
  });

  // Spot: buy spends USDC, sell spends the coin. Perps: size is in USDC either way.
  const size = useMemo(() => {
    const a = Number(amount); if (!a || !mid) return 0;
    return spot && !buy ? a : a / mid;
  }, [amount, mid, spot, buy]);
  const position = bal?.positions[coin] ?? 0;
  const available = spot ? (buy ? bal?.spot.USDC : bal?.spot[m.base.symbol]) : bal?.perpUsdc;

  const trade = () => run('Placing order…', async () => {
    if (!agent || !asset) throw new Error('Enable trading first.');
    try {
      const f = await HL.marketOrder(agent, asset, buy, size, slippage);
      setAmount('');
      return `Filled ${fmt(f.size)} ${m.base.symbol} at ${fmt(f.avgPx)} USDC.`;
    } catch (e) {
      if (/does not exist/i.test(errText(e)) && account) { HL.forgetAgent(account); setAgent(null); throw new Error('This browser’s trading key is no longer approved. Click “Enable trading” again.'); }
      throw e;
    }
  });
  const close = () => run('Closing position…', async () => {
    if (!agent || !asset) throw new Error('Enable trading first.');
    const f = await HL.marketOrder(agent, asset, position < 0, Math.abs(position), slippage, true);
    return `Closed ${fmt(f.size)} ${coin} at ${fmt(f.avgPx)}.`;
  });

  const sideA = spot ? `Buy ${m.base.symbol}` : 'Long';
  const sideB = spot ? `Sell ${m.base.symbol}` : 'Short';
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 bg-slate-950 rounded-lg p-1">
        <button onClick={() => setBuy(true)} className={`py-2 rounded-md text-sm font-semibold ${buy ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>{sideA}</button>
        <button onClick={() => setBuy(false)} className={`py-2 rounded-md text-sm font-semibold ${!buy ? 'bg-red-600 text-white' : 'text-slate-400'}`}>{sideB}</button>
      </div>
      <div className="bg-slate-950 rounded-lg p-3">
        <div className="flex justify-between text-xs text-slate-500">
          <span>{spot ? (buy ? 'You pay' : 'You sell') : 'Order size'}</span>
          {available != null && <button className="hover:text-slate-300" onClick={() => setAmount(String(Math.floor(available * 1e6) / 1e6))}>Available {fmt(available)}</button>}
        </div>
        <div className="flex items-center gap-2">
          <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(',', '.'))} placeholder="0.0" className="flex-1 bg-transparent text-xl outline-none min-w-0" />
          <span className="text-sm font-semibold">{spot && !buy ? m.base.symbol : 'USDC'}</span>
        </div>
        <div className="text-xs text-slate-500 mt-1">
          ≈ {fmt(size)} {m.base.symbol} at {fmt(mid)} USDC{!spot && ' · uses your account leverage setting'}
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-400">Slippage
        {[50, 100, 300].map((b) => <button key={b} onClick={() => setSlippage(b)} className={`px-2 py-1 rounded ${slippage === b ? 'bg-yellow-500 text-black' : 'bg-slate-800'}`}>{b / 100}%</button>)}
      </div>

      {!account ? (
        <button onClick={connect} disabled={!!step} className={`${btn} bg-yellow-500 hover:bg-yellow-400 text-black`}>{step ?? 'Connect wallet'}</button>
      ) : !agent ? (
        <button onClick={enable} disabled={!!step} className={`${btn} bg-yellow-500 hover:bg-yellow-400 text-black inline-flex items-center justify-center gap-2`}>
          <KeyRound className="w-4 h-4" />{step ?? 'Enable trading (one signature)'}
        </button>
      ) : (
        <button onClick={trade} disabled={!!step || !size} className={`${btn} ${buy ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'}`}>
          {step ?? (spot ? (buy ? `Buy ${m.base.symbol}` : `Sell ${m.base.symbol}`) : `${buy ? 'Long' : 'Short'} ${coin}`)}
        </button>
      )}
      {!spot && position !== 0 && agent && (
        <button onClick={close} disabled={!!step} className="w-full py-2 rounded-lg text-sm border border-slate-700 hover:bg-slate-800">
          Close {position > 0 ? 'long' : 'short'} {fmt(Math.abs(position))} {coin}
        </button>
      )}
      {error && <div className="text-xs text-red-400 break-words">{error}</div>}
      {done && <div className="text-xs text-emerald-400 break-words">{done}</div>}

      {account && (
        <div className="border-t border-slate-800 pt-3 space-y-2 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Hyperliquid balance</span>
            <button onClick={() => setShowFund((v) => !v)} className="text-yellow-400 hover:underline">{showFund ? 'Hide' : 'Deposit / move USDC'}</button>
          </div>
          <div className="flex justify-between"><span className="text-slate-500">Perps USDC</span><span>{fmt(bal?.perpUsdc ?? 0)}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Spot USDC</span><span>{fmt(bal?.spot.USDC ?? 0)}</span></div>
          {spot && <div className="flex justify-between"><span className="text-slate-500">Spot {m.base.symbol}</span><span>{fmt(bal?.spot[m.base.symbol] ?? 0)}</span></div>}
          {showFund && (
            <div className="space-y-2 bg-slate-950 rounded-lg p-2">
              <div className="text-slate-400">Deposit USDC from Arbitrum (you have {fmt(arbUsdc ?? 0)}). Minimum 5 USDC; it lands in your perps balance.</div>
              <div className="flex gap-2">
                <input inputMode="decimal" value={dep} onChange={(e) => setDep(e.target.value.replace(',', '.'))} placeholder="USDC" className="flex-1 min-w-0 bg-slate-900 border border-slate-800 rounded px-2 py-1.5" />
                <button onClick={deposit} disabled={!!step || Number(dep) < 5} className="px-3 rounded bg-yellow-500 text-black font-semibold disabled:opacity-50">Deposit</button>
              </div>
              <div className="flex gap-2">
                <button disabled={!!step || !bal?.perpUsdc} onClick={() => move(false, String(Math.floor((bal?.perpUsdc ?? 0) * 100) / 100))} className="flex-1 py-1.5 rounded border border-slate-700 disabled:opacity-40">Perps → Spot (all)</button>
                <button disabled={!!step || !bal?.spot.USDC} onClick={() => move(true, String(Math.floor((bal?.spot.USDC ?? 0) * 100) / 100))} className="flex-1 py-1.5 rounded border border-slate-700 disabled:opacity-40">Spot → Perps (all)</button>
              </div>
            </div>
          )}
        </div>
      )}
      <div className="text-[11px] text-slate-500 flex gap-1.5 items-start">
        <ShieldCheck className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-500" />
        <span>Orders go straight to Hyperliquid from this page. “Enable trading” approves a trading key kept in this browser; it can place orders but can never withdraw your funds.</span>
      </div>
    </div>
  );
}

// ================================================================== THORChain ====

export function ThorPanel({ market: m }: { market: Market }) {
  const pool = m.pool; // e.g. "BTC.BTC"
  const [assets, setAssets] = useState<string[]>([]);
  const [buy, setBuy] = useState(true);
  const defaultOther = pool === 'ETH.ETH' ? 'BTC.BTC' : 'ETH.ETH';
  const [other, setOther] = useState(defaultOther);
  const [amount, setAmount] = useState('');
  const [dest, setDest] = useState('');
  const [slippage, setSlippage] = useState(300);
  const [q, setQ] = useState<ThorQuote | null>(null);
  const [qErr, setQErr] = useState<string | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [step, setStep] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hash, setHash] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [manual, setManual] = useState<ThorQuote | null>(null);

  const from = buy ? other : pool;
  const to = buy ? pool : other;
  const fromChain = thorEvmChain(from);
  const toChain = thorEvmChain(to);

  useEffect(() => { thorAssets().then(setAssets).catch(() => setAssets([])); }, []);
  // A connected EVM wallet is the natural destination when receiving on an EVM chain.
  useEffect(() => { if (toChain && account && !dest) setDest(account); }, [toChain?.chainId, account]);
  useEffect(() => { setManual(null); setHash(null); setStatus(null); }, [from, to]);

  useEffect(() => {
    if (!amount || Number(amount) <= 0) { setQ(null); setQErr(null); return undefined; }
    let off = false;
    const t = setTimeout(() => {
      thorQuote(from, to, amount, dest.trim(), slippage)
        .then((r) => { if (!off) { setQ(r); setQErr(null); } })
        .catch((e) => { if (!off) { setQ(null); setQErr(errText(e)); } });
    }, 500);
    return () => { off = true; clearTimeout(t); };
  }, [from, to, amount, dest, slippage]);

  useEffect(() => {
    if (!hash) return undefined;
    const poll = async () => {
      const s = await thorStatus(hash).catch(() => null);
      const st = s?.stages;
      if (!st) return;
      setStatus(st.swap_finalised?.completed && st.outbound_signed?.completed !== false ? 'Swap complete — funds sent to your address.'
        : st.swap_status?.pending ? 'Swapping on THORChain…'
          : st.inbound_observed?.completed ? 'Deposit seen by THORChain, swapping…' : 'Waiting for THORChain to see the deposit…');
    };
    poll(); const t = setInterval(poll, 15_000);
    return () => clearInterval(t);
  }, [hash]);

  const connect = async () => {
    try { const s = await walletOn(fromChain ?? toChain ?? EVM_CHAINS[1]); setAccount(await s.getAddress()); } catch (e) { setError(errText(e)); }
  };
  const go = async () => {
    setError(null); setHash(null); setStatus(null);
    if (!dest.trim()) { setError(`Enter where to receive ${thorSymbol(to)}.`); return; }
    try {
      setStep('Getting a fresh quote…');
      const fresh = await thorQuote(from, to, amount, dest.trim(), slippage);
      if (!fromChain) { setManual(fresh); return; }
      const signer = await walletOn(fromChain);
      setHash(await thorDepositEvm({ signer, from, amountIn: amount, quote: fresh, onStep: setStep }));
      setAmount('');
    } catch (e) { setError(errText(e)); } finally { setStep(null); }
  };

  const outAmt = q ? Number(q.expected_amount_out) / 1e8 : null;
  const label = (a: string) => `${thorSymbol(a)} · ${thorChainOf(a)}`;
  const picker = (
    <select value={other} onChange={(e) => setOther(e.target.value)} className="bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-sm font-semibold max-w-[50%]">
      {(assets.length ? assets : [defaultOther]).filter((a) => a !== pool).map((a) => <option key={a} value={a}>{label(a)}</option>)}
    </select>
  );
  const copy = (s: string) => navigator.clipboard?.writeText(s).catch(() => {});

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 bg-slate-950 rounded-lg p-1">
        <button onClick={() => setBuy(true)} className={`py-2 rounded-md text-sm font-semibold ${buy ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>Buy {thorSymbol(pool)}</button>
        <button onClick={() => setBuy(false)} className={`py-2 rounded-md text-sm font-semibold ${!buy ? 'bg-red-600 text-white' : 'text-slate-400'}`}>Sell {thorSymbol(pool)}</button>
      </div>
      <div className="bg-slate-950 rounded-lg p-3">
        <div className="text-xs text-slate-500">You pay</div>
        <div className="flex items-center gap-2">
          <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(',', '.'))} placeholder="0.0" className="flex-1 bg-transparent text-xl outline-none min-w-0" />
          {buy ? picker : <span className="text-sm font-semibold">{label(pool)}</span>}
        </div>
      </div>
      <div className="bg-slate-950 rounded-lg p-3">
        <div className="text-xs text-slate-500">You receive (estimated)</div>
        <div className="flex items-center gap-2">
          <div className="flex-1 text-xl">{fmt(outAmt)}</div>
          {buy ? <span className="text-sm font-semibold">{label(pool)}</span> : picker}
        </div>
        {q && <div className="text-[11px] text-slate-500 mt-1">Fees {(q.fees.total_bps / 100).toFixed(2)}%{q.total_swap_seconds ? ` · about ${Math.max(1, Math.round(q.total_swap_seconds / 60))} min` : ''}</div>}
        {qErr && <div className="text-xs text-red-400 mt-1">Quote: {qErr}</div>}
      </div>
      <div>
        <div className="text-xs text-slate-500 mb-1">Receive {thorSymbol(to)} at</div>
        <input value={dest} onChange={(e) => setDest(e.target.value.trim())} placeholder={thorAddressHint(to)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-xs font-mono" />
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-400">Max slippage
        {[100, 300, 500].map((b) => <button key={b} onClick={() => setSlippage(b)} className={`px-2 py-1 rounded ${slippage === b ? 'bg-yellow-500 text-black' : 'bg-slate-800'}`}>{b / 100}%</button>)}
      </div>

      {fromChain && !account ? (
        <button onClick={connect} className={`${btn} bg-yellow-500 hover:bg-yellow-400 text-black`}>Connect wallet · {fromChain.name}</button>
      ) : (
        <button onClick={go} disabled={!!step || !q || !dest} className={`${btn} ${buy ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'}`}>
          {step ?? (fromChain ? `Swap ${thorSymbol(from)} → ${thorSymbol(to)}` : `Get ${thorSymbol(from)} deposit details`)}
        </button>
      )}
      {error && <div className="text-xs text-red-400 break-words">{error}</div>}
      {hash && fromChain && (
        <div className="text-xs space-y-1">
          <a href={`${fromChain.explorer}/tx/${hash}`} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline inline-flex items-center gap-1">Deposit sent · view transaction <ExternalLink className="w-3 h-3" /></a>
          <div className="text-slate-300">{status ?? 'Waiting for THORChain to see the deposit…'}</div>
        </div>
      )}
      {manual && (
        <div className="text-xs bg-slate-950 border border-yellow-600/40 rounded-lg p-3 space-y-2">
          <div className="text-yellow-300 font-semibold">Send exactly {amount} {thorSymbol(from)} from your {thorChainOf(from)} wallet</div>
          {[['To address', manual.inbound_address], ['Memo', manual.memo]].map(([k, v]) => (
            <div key={k}>
              <div className="text-slate-500">{k}</div>
              <div className="flex items-center gap-2"><code className="break-all flex-1">{v}</code><button onClick={() => copy(v)} title="Copy"><Copy className="w-3.5 h-3.5" /></button></div>
            </div>
          ))}
          <div className="text-slate-400">
            {thorChainOf(from) === 'THOR'
              ? 'Use a THORChain wallet’s “deposit” (MsgDeposit) with this memo, not a normal send.'
              : 'The memo must go in the transaction (OP_RETURN / memo field). Sending without it can lose the funds.'}
            {' '}Valid until {new Date(manual.expiry * 1000).toLocaleTimeString()}.
          </div>
        </div>
      )}
      <div className="text-[11px] text-slate-500 flex gap-1.5 items-start">
        <ShieldCheck className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-500" />
        <span>Native THORChain swap: your {thorSymbol(from)} goes to THORChain’s vault{fromChain ? ' through its router contract' : ''}, and THORChain sends {thorSymbol(to)} to your address. Quotes come from a THORChain node.</span>
      </div>
    </div>
  );
}

