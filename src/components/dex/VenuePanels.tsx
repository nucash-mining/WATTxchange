// In-app trade panels for Hyperliquid (spot + perps) and THORChain (native cross-chain).
import React, { useEffect, useMemo, useState } from 'react';
import { ethers } from 'ethers';
import { ShieldCheck, Copy, ExternalLink, KeyRound } from 'lucide-react';
import { EVM_CHAINS } from '../../config/evmChains';
import { walletOn, balanceOf, connectedAccount, type Market } from '../../services/marketsService';
import * as HL from '../../services/hyperliquid';
import {
  thorAssets, thorQuote, thorDepositEvm, thorStatus, thorEvmChain, thorSymbol, thorChainOf, thorAddressHint,
  kyberQuote, kyberSwap, NATIVE,
  type ThorQuote,
} from '../../services/aggregators';

const fmt = (v: number | null | undefined, d = 6) => (v == null || !Number.isFinite(v) ? '—' : Number(v.toPrecision(d)).toLocaleString(undefined, { maximumFractionDigits: 8 }));
const btn = 'w-full py-3 rounded-lg font-semibold disabled:opacity-50';
const errText = (e: unknown) => {
  const x = e as { code?: string; shortMessage?: string; message?: string };
  return x.code === 'ACTION_REJECTED' ? 'Cancelled in the wallet.' : x.shortMessage ?? x.message ?? String(e);
};

// ================================================================ Hyperliquid ====

/** Arbitrum tokens that can fund a Hyperliquid account (swapped to USDC via KyberSwap). */
const FUND_TOKENS: { symbol: string; address: string; decimals: number }[] = [
  { symbol: 'USDC', address: HL.ARB_USDC, decimals: 6 },
  { symbol: 'ETH', address: NATIVE, decimals: 18 },
  { symbol: 'USDT', address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', decimals: 6 },
  { symbol: 'WBTC', address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f', decimals: 8 },
  { symbol: 'ARB', address: '0x912CE59144191C1204E64559FE8253a0e49E6548', decimals: 18 },
  { symbol: 'DAI', address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', decimals: 18 },
  { symbol: 'WETH', address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', decimals: 18 },
  { symbol: 'LINK', address: '0xf97f4df75117a78c1A5a0DBb814Af92458539FB4', decimals: 18 },
  { symbol: 'USDC.e', address: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', decimals: 6 },
];

/** Wallet, trading key, balances and actions shared by the Hyperliquid panels. */
function useHyperliquid() {
  const arb = EVM_CHAINS[42161];
  const [account, setAccount] = useState<string | null>(null);
  const [agent, setAgent] = useState<ethers.Wallet | null>(null);
  const [bal, setBal] = useState<HL.HlBalances | null>(null);
  const [step, setStep] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  // pick up an already-connected wallet without a prompt
  useEffect(() => { connectedAccount().then((a) => { if (a) { setAccount((x) => x ?? a); setAgent((g) => g ?? HL.loadAgent(a)); } }); }, []);
  useEffect(() => {
    if (!account) return undefined;
    const load = () => HL.balances(account).then(setBal).catch(() => {});
    load(); const t = setInterval(load, 10_000);
    return () => clearInterval(t);
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
    try { setAgent(await HL.approveAgent(s)); } catch (e) {
      if (/deposit/i.test(errText(e))) throw new Error('Your Hyperliquid account is empty. Deposit first (below), then enable trading.');
      throw e;
    }
    return 'Trading enabled for this browser.';
  });
  /** Wraps an order so an expired trading key is cleared with a clear message. */
  const withAgent = async <T,>(fn: (a: ethers.Wallet) => Promise<T>): Promise<T> => {
    if (!agent) throw new Error('Enable trading first.');
    try { return await fn(agent); } catch (e) {
      if (/does not exist|not approved|User or API Wallet/i.test(errText(e)) && account) {
        HL.forgetAgent(account); setAgent(null);
        throw new Error('This browser’s trading key is no longer approved. Click “Enable trading” again.');
      }
      throw e;
    }
  };
  return { arb, account, agent, bal, step, error, done, tick, setTick, run, connect, enable, withAgent, setError };
}
type HlCtx = ReturnType<typeof useHyperliquid>;

function ActionButton({ hl, label, onClick, disabled, tone }: { hl: HlCtx; label: string; onClick: () => void; disabled?: boolean; tone: 'buy' | 'sell' }) {
  if (!hl.account) return <button onClick={hl.connect} disabled={!!hl.step} className={`${btn} bg-yellow-500 hover:bg-yellow-400 text-black`}>{hl.step ?? 'Connect wallet'}</button>;
  if (!hl.agent) {
    return (
      <button onClick={hl.enable} disabled={!!hl.step} className={`${btn} bg-yellow-500 hover:bg-yellow-400 text-black inline-flex items-center justify-center gap-2`}>
        <KeyRound className="w-4 h-4" />{hl.step ?? 'Enable trading (one signature)'}
      </button>
    );
  }
  return <button onClick={onClick} disabled={!!hl.step || disabled} className={`${btn} ${tone === 'buy' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'}`}>{hl.step ?? label}</button>;
}

function Status({ hl }: { hl: HlCtx }) {
  return <>
    {hl.error && <div className="text-xs text-red-400 break-words">{hl.error}</div>}
    {hl.done && <div className="text-xs text-emerald-400 break-words">{hl.done}</div>}
  </>;
}

/** Leverage slider + cross/isolated switch. */
function LeverageControl({ lev, setLev, max, cross, setCross, isolatedOnly, current }: {
  lev: number; setLev: (n: number) => void; max: number; cross: boolean; setCross: (b: boolean) => void; isolatedOnly: boolean; current: string | null;
}) {
  const marks = [1, 2, 3, 5, 10, 20, 25, 40, 50].filter((x) => x <= max);
  if (!marks.includes(max)) marks.push(max);
  const pct = max > 1 ? ((lev - 1) / (max - 1)) * 100 : 100;
  return (
    <div className="bg-slate-950 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between text-xs">
        <div className="grid grid-cols-2 bg-slate-900 rounded-md p-0.5">
          <button disabled={isolatedOnly} onClick={() => setCross(true)} className={`px-2.5 py-1 rounded ${cross && !isolatedOnly ? 'bg-slate-700 text-white' : 'text-slate-400'} disabled:opacity-40`}>Cross</button>
          <button onClick={() => setCross(false)} className={`px-2.5 py-1 rounded ${!cross || isolatedOnly ? 'bg-slate-700 text-white' : 'text-slate-400'}`}>Isolated</button>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-slate-500">Leverage</span>
          <input type="number" min={1} max={max} value={lev} onChange={(e) => setLev(Math.max(1, Math.min(max, Math.round(Number(e.target.value) || 1))))}
            className="w-12 bg-slate-900 border border-slate-800 rounded px-1 py-0.5 text-right font-semibold text-yellow-300" />
          <span className="font-semibold text-yellow-300">x</span>
        </div>
      </div>
      <input type="range" min={1} max={max} step={1} value={lev} onChange={(e) => setLev(Number(e.target.value))}
        aria-label="Leverage" className="w-full accent-yellow-400"
        style={{ background: `linear-gradient(to right, #facc15 ${pct}%, #334155 ${pct}%)`, height: 4, borderRadius: 4, appearance: 'none' }} />
      <div className="flex justify-between text-[10px] text-slate-500">
        {marks.map((x) => <button key={x} onClick={() => setLev(x)} className={x === lev ? 'text-yellow-300' : 'hover:text-slate-300'}>{x}x</button>)}
      </div>
      {current && <div className="text-[11px] text-slate-500">Account setting now: {current}. It’s updated to your choice when you place the order.</div>}
    </div>
  );
}

/** Rough isolated-margin liquidation price (Hyperliquid maintenance margin = half the initial margin at max leverage). */
const estLiq = (entry: number, lev: number, maxLev: number, long: boolean) => {
  const mm = 1 / (2 * maxLev), move = 1 / lev - mm;
  if (move <= 0) return null;
  return long ? entry * (1 - move) : entry * (1 + move);
};

function PositionCard({ p, mark, onClose, busy }: { p: HL.HlPosition; mark: number | null; onClose: (frac: number) => void; busy: boolean }) {
  const long = p.size > 0;
  return (
    <div className="bg-slate-950 rounded-lg p-3 text-xs space-y-1.5">
      <div className="flex justify-between items-center">
        <span className={`font-semibold ${long ? 'text-emerald-400' : 'text-red-400'}`}>{long ? 'Long' : 'Short'} {fmt(Math.abs(p.size))} {p.coin}</span>
        <span className="text-slate-400">{p.leverage}x {p.cross ? 'cross' : 'isolated'}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
        <span className="text-slate-500">Entry</span><span className="text-right">{fmt(p.entry)}</span>
        <span className="text-slate-500">Mark</span><span className="text-right">{fmt(mark)}</span>
        <span className="text-slate-500">Value</span><span className="text-right">${fmt(p.value)}</span>
        <span className="text-slate-500">PnL</span><span className={`text-right ${p.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{p.pnl >= 0 ? '+' : ''}{fmt(p.pnl, 4)} USDC ({p.roe.toFixed(1)}%)</span>
        <span className="text-slate-500">Liq. price</span><span className="text-right text-orange-300">{p.liq ? fmt(p.liq) : '—'}</span>
        <span className="text-slate-500">Margin</span><span className="text-right">${fmt(p.margin)}</span>
      </div>
      <div className="flex gap-2 pt-1">
        <button disabled={busy} onClick={() => onClose(0.5)} className="flex-1 py-1.5 rounded border border-slate-700 hover:bg-slate-800 disabled:opacity-50">Close 50%</button>
        <button disabled={busy} onClick={() => onClose(1)} className="flex-1 py-1.5 rounded border border-slate-700 hover:bg-slate-800 disabled:opacity-50">Close all</button>
      </div>
    </div>
  );
}

/** Account balance + "deposit with any coin" (Arbitrum token -> USDC via KyberSwap -> Hyperliquid bridge). */
function FundBox({ hl, spot, baseSymbol }: { hl: HlCtx; spot: boolean; baseSymbol: string }) {
  const [open, setOpen] = useState(false);
  const [tok, setTok] = useState(FUND_TOKENS[0]);
  const [amt, setAmt] = useState('');
  const [have, setHave] = useState<number | null>(null);
  const [est, setEst] = useState<number | null>(null);
  const [estErr, setEstErr] = useState<string | null>(null);
  const { arb, account, bal } = hl;
  const isUsdc = tok.address.toLowerCase() === HL.ARB_USDC.toLowerCase();

  useEffect(() => {
    if (!account || !open) return;
    balanceOf(arb, tok.address === NATIVE ? 'native' : tok.address, account)
      .then((b) => setHave(Number(ethers.formatUnits(b, tok.decimals)))).catch(() => setHave(null));
  }, [account, open, tok, hl.tick]);
  useEffect(() => {
    setEst(null); setEstErr(null);
    if (isUsdc) { setEst(Number(amt) || null); return undefined; }
    if (!(Number(amt) > 0)) return undefined;
    let off = false;
    const t = setTimeout(() => {
      kyberQuote(42161, tok.address, HL.ARB_USDC, ethers.parseUnits(amt, tok.decimals))
        .then((q) => { if (!off) setEst(Number(ethers.formatUnits(q.amountOut, 6))); })
        .catch((e) => { if (!off) setEstErr(errText(e)); });
    }, 350);
    return () => { off = true; clearTimeout(t); };
  }, [amt, tok]);

  const deposit = () => hl.run('Starting deposit…', async () => {
    const s = await walletOn(arb); const me = await s.getAddress();
    let usdc = amt;
    if (!isUsdc) {
      if ((est ?? 0) < 5.2) throw new Error('That swaps to under 5 USDC — Hyperliquid’s minimum deposit. Use a larger amount.');
      const before = await balanceOf(arb, HL.ARB_USDC, me);
      await kyberSwap({ chain: arb, signer: s, tokenIn: tok.address, tokenOut: HL.ARB_USDC, amountIn: ethers.parseUnits(amt, tok.decimals), slippageBps: 100, onStep: () => {} });
      const got = (await balanceOf(arb, HL.ARB_USDC, me)) - before;
      if (got <= 0n) throw new Error('The swap went through but no USDC arrived yet. Check your wallet, then deposit the USDC.');
      usdc = ethers.formatUnits(got, 6);
    }
    const h = await HL.depositUsdc(s, usdc);
    setAmt('');
    return `Deposited ${fmt(Number(usdc))} USDC to Hyperliquid (arrives in about a minute). Tx ${h.slice(0, 10)}…`;
  });
  const move = (toPerp: boolean, a: number) => hl.run('Sign in your wallet…', async () => {
    const amount = String(Math.floor(a * 100) / 100);
    await HL.moveUsdc(await walletOn(arb), amount, toPerp);
    return `Moved ${amount} USDC to ${toPerp ? 'perps' : 'spot'}.`;
  });

  if (!account) return null;
  return (
    <div className="border-t border-slate-800 pt-3 space-y-2 text-xs">
      <div className="flex justify-between text-slate-400">
        <span>Hyperliquid account</span>
        <button onClick={() => setOpen((v) => !v)} className="text-yellow-400 hover:underline">{open ? 'Hide' : 'Deposit with any coin'}</button>
      </div>
      <div className="flex justify-between"><span className="text-slate-500">Perps available</span><span>{fmt(bal?.perpUsdc ?? 0)} USDC</span></div>
      {!!bal?.accountValue && <div className="flex justify-between"><span className="text-slate-500">Account value</span><span>{fmt(bal.accountValue)} USDC</span></div>}
      <div className="flex justify-between"><span className="text-slate-500">Spot USDC</span><span>{fmt(bal?.spot.USDC ?? 0)}</span></div>
      {spot && <div className="flex justify-between"><span className="text-slate-500">Spot {baseSymbol}</span><span>{fmt(bal?.spot[baseSymbol] ?? 0)}</span></div>}
      {open && (
        <div className="space-y-2 bg-slate-950 rounded-lg p-2">
          <div className="text-slate-400">Pay with any coin in your wallet on Arbitrum. Non-USDC coins are swapped to USDC through KyberSwap, then deposited (minimum 5 USDC).</div>
          <div className="flex gap-2">
            <select value={tok.symbol} onChange={(e) => setTok(FUND_TOKENS.find((t) => t.symbol === e.target.value)!)} className="bg-slate-900 border border-slate-800 rounded px-2 py-1.5">
              {FUND_TOKENS.map((t) => <option key={t.symbol}>{t.symbol}</option>)}
            </select>
            <input inputMode="decimal" value={amt} onChange={(e) => setAmt(e.target.value.replace(',', '.'))} placeholder="Amount" className="flex-1 min-w-0 bg-slate-900 border border-slate-800 rounded px-2 py-1.5" />
          </div>
          <div className="flex justify-between text-slate-500">
            <button className="hover:text-slate-300" onClick={() => have != null && setAmt(String(tok.address === NATIVE ? Math.max(0, have - 0.0005) : have))}>Wallet: {fmt(have)} {tok.symbol}</button>
            <span>{estErr ? <span className="text-red-400">{estErr}</span> : est != null ? `≈ ${fmt(est)} USDC` : ''}</span>
          </div>
          <button onClick={deposit} disabled={!!hl.step || !(Number(amt) > 0) || (est ?? 0) < 5} className="w-full py-2 rounded bg-yellow-500 text-black font-semibold disabled:opacity-50">
            {hl.step ?? (isUsdc ? 'Deposit USDC' : `Swap ${tok.symbol} → USDC and deposit`)}
          </button>
          <div className="flex gap-2">
            <button disabled={!!hl.step || !bal?.perpUsdc} onClick={() => move(false, bal?.perpUsdc ?? 0)} className="flex-1 py-1.5 rounded border border-slate-700 disabled:opacity-40">Perps → Spot (all)</button>
            <button disabled={!!hl.step || !bal?.spot.USDC} onClick={() => move(true, bal?.spot.USDC ?? 0)} className="flex-1 py-1.5 rounded border border-slate-700 disabled:opacity-40">Spot → Perps (all)</button>
          </div>
        </div>
      )}
    </div>
  );
}

const SafetyNote = () => (
  <div className="text-[11px] text-slate-500 flex gap-1.5 items-start">
    <ShieldCheck className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-500" />
    <span>Orders go straight to Hyperliquid from this page. “Enable trading” approves a trading key kept in this browser; it can place orders and set leverage but can never withdraw your funds.</span>
  </div>
);

function useMid(asset: HL.HlAsset | null) {
  const [mid, setMid] = useState<number | null>(null);
  useEffect(() => {
    if (!asset) return undefined;
    const load = () => HL.midPrice(asset).then(setMid).catch(() => {});
    load(); const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, [asset]);
  return mid;
}

export function HyperliquidPanel({ market: m, spot }: { market: Market; spot: boolean }) {
  const hl = useHyperliquid();
  const coin = m.coin ?? m.base.symbol;
  const [asset, setAsset] = useState<HL.HlAsset | null>(null);
  const [assetErr, setAssetErr] = useState<string | null>(null);
  const mid = useMid(asset);
  const [buy, setBuy] = useState(true);
  const [amount, setAmount] = useState('');
  const [slippage, setSlippage] = useState(100);
  const [lev, setLev] = useState(5);
  const [cross, setCross] = useState(true);
  const [current, setCurrent] = useState<{ type: string; value: number } | null>(null);

  useEffect(() => {
    let off = false;
    HL.assetFor(coin, spot).then((a) => { if (off) return; setAsset(a); setLev((l) => Math.min(l, a.maxLeverage)); if (a.isolatedOnly) setCross(false); })
      .catch((e) => !off && setAssetErr(errText(e)));
    return () => { off = true; };
  }, [coin, spot]);
  // start the slider from the account's own leverage on this coin
  useEffect(() => {
    if (spot || !hl.account) return;
    HL.activeLeverage(hl.account, coin).then((c) => {
      if (!c) return;
      setCurrent(c); setLev(c.value); setCross(c.type === 'cross');
    });
  }, [hl.account, coin, spot, hl.tick]);

  const maxLev = asset?.maxLeverage ?? 1;
  const margin = Number(amount) || 0;
  const notional = spot ? margin : margin * lev;               // perps: amount is margin
  const size = !mid ? 0 : spot ? (buy ? margin / mid : margin) : notional / mid;
  const available = spot ? (buy ? hl.bal?.spot.USDC : hl.bal?.spot[m.base.symbol]) : hl.bal?.perpUsdc;
  const pos = hl.bal?.details[coin];
  const liq = !spot && mid && margin ? estLiq(mid, lev, maxLev, buy) : null;
  const tooSmall = !spot && margin > 0 && notional < HL.MIN_NOTIONAL;
  const tooBig = available != null && hl.agent && margin > available + 1e-9;

  const trade = () => hl.run('Placing order…', () => hl.withAgent(async (agent) => {
    if (!asset) throw new Error('Market not loaded yet.');
    if (!spot) {
      const isCross = cross && !asset.isolatedOnly;
      if (!current || current.value !== lev || (current.type === 'cross') !== isCross) {
        hl.setError(null);
        await HL.setLeverage(agent, asset, lev, isCross);
      }
    }
    const f = await HL.marketOrder(agent, asset, buy, size, slippage);
    setAmount('');
    return `Filled ${fmt(f.size)} ${m.base.symbol} at ${fmt(f.avgPx)} USDC${spot ? '' : ` · ${lev}x ${cross ? 'cross' : 'isolated'}`}.`;
  }));
  const close = (frac: number) => hl.run('Closing…', () => hl.withAgent(async (agent) => {
    if (!asset || !pos) throw new Error('No open position.');
    const f = await HL.marketOrder(agent, asset, pos.size < 0, Math.abs(pos.size) * frac, slippage, true);
    return `Closed ${fmt(f.size)} ${coin} at ${fmt(f.avgPx)}.`;
  }));

  const sideA = spot ? `Buy ${m.base.symbol}` : 'Long';
  const sideB = spot ? `Sell ${m.base.symbol}` : 'Short';
  const unit = spot && !buy ? m.base.symbol : 'USDC';
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 bg-slate-950 rounded-lg p-1">
        <button onClick={() => setBuy(true)} className={`py-2 rounded-md text-sm font-semibold ${buy ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>{sideA}</button>
        <button onClick={() => setBuy(false)} className={`py-2 rounded-md text-sm font-semibold ${!buy ? 'bg-red-600 text-white' : 'text-slate-400'}`}>{sideB}</button>
      </div>
      {assetErr && <div className="text-xs text-red-400">{assetErr}</div>}
      {!spot && asset && (
        <LeverageControl lev={Math.min(lev, maxLev)} setLev={setLev} max={maxLev} cross={cross} setCross={setCross} isolatedOnly={asset.isolatedOnly}
          current={current && hl.agent ? `${current.value}x ${current.type}` : null} />
      )}
      <div className="bg-slate-950 rounded-lg p-3">
        <div className="flex justify-between text-xs text-slate-500">
          <span>{spot ? (buy ? 'You pay' : 'You sell') : 'Margin'}</span>
          {available != null && <span>Available {fmt(available)} {unit}</span>}
        </div>
        <div className="flex items-center gap-2">
          <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(',', '.'))} placeholder="0.0" className="flex-1 bg-transparent text-xl outline-none min-w-0" />
          <span className="text-sm font-semibold">{unit}</span>
        </div>
        {available != null && available > 0 && (
          <div className="grid grid-cols-4 gap-1 mt-2">
            {[25, 50, 75, 100].map((p) => <button key={p} onClick={() => setAmount(String(Math.floor(available * p / 100 * 1e4) / 1e4))} className="py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px]">{p}%</button>)}
          </div>
        )}
        <div className="text-xs text-slate-500 mt-2 space-y-0.5">
          {!spot && <div className="flex justify-between"><span>Position size</span><span className="text-slate-300">${fmt(notional)} ≈ {fmt(size)} {m.base.symbol}</span></div>}
          {spot && <div>≈ {fmt(size)} {m.base.symbol} at {fmt(mid)} USDC</div>}
          {!spot && <div className="flex justify-between"><span>Price</span><span>{fmt(mid)} USDC</span></div>}
          {liq && <div className="flex justify-between"><span>Est. liquidation{cross ? ' (if isolated)' : ''}</span><span className="text-orange-300">{fmt(liq)}</span></div>}
        </div>
        {tooSmall && <div className="text-xs text-orange-300 mt-1">Hyperliquid’s minimum order is ${HL.MIN_NOTIONAL} of position size.</div>}
        {tooBig && <div className="text-xs text-orange-300 mt-1">More than you have available. Deposit below.</div>}
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-400">Slippage
        {[50, 100, 300].map((b) => <button key={b} onClick={() => setSlippage(b)} className={`px-2 py-1 rounded ${slippage === b ? 'bg-yellow-500 text-black' : 'bg-slate-800'}`}>{b / 100}%</button>)}
      </div>
      <ActionButton hl={hl} tone={buy ? 'buy' : 'sell'} onClick={trade} disabled={!size || tooSmall || !!tooBig}
        label={spot ? (buy ? `Buy ${m.base.symbol}` : `Sell ${m.base.symbol}`) : `${buy ? 'Long' : 'Short'} ${coin} · ${Math.min(lev, maxLev)}x`} />
      <Status hl={hl} />
      {!spot && pos && pos.size !== 0 && <PositionCard p={pos} mark={mid} onClose={close} busy={!!hl.step} />}
      <FundBox hl={hl} spot={spot} baseSymbol={m.base.symbol} />
      <SafetyNote />
    </div>
  );
}

/**
 * Cross pair on Hyperliquid perps, e.g. XMR/BTC: "Long" buys XMR and shorts BTC with equal
 * position size, so it profits when XMR outperforms BTC. Margin is split across both legs.
 */
export function HyperliquidPairPanel({ market: m }: { market: Market }) {
  const hl = useHyperliquid();
  const A = m.coin ?? m.base.symbol, B = m.quoteCoin ?? m.quote.symbol;
  const [assets, setAssets] = useState<[HL.HlAsset, HL.HlAsset] | null>(null);
  const [assetErr, setAssetErr] = useState<string | null>(null);
  const midA = useMid(assets?.[0] ?? null), midB = useMid(assets?.[1] ?? null);
  const [long, setLong] = useState(true);
  const [amount, setAmount] = useState('');
  const [slippage, setSlippage] = useState(100);
  const [lev, setLev] = useState(3);
  const [cross, setCross] = useState(true);

  useEffect(() => {
    let off = false;
    Promise.all([HL.assetFor(A, false), HL.assetFor(B, false)]).then((x) => {
      if (off) return; setAssets(x as [HL.HlAsset, HL.HlAsset]);
      const max = Math.min(x[0].maxLeverage, x[1].maxLeverage); setLev((l) => Math.min(l, max));
      if (x[0].isolatedOnly || x[1].isolatedOnly) setCross(false);
    }).catch((e) => !off && setAssetErr(errText(e)));
    return () => { off = true; };
  }, [A, B]);

  const maxLev = assets ? Math.min(assets[0].maxLeverage, assets[1].maxLeverage) : 1;
  const isolatedOnly = !!assets && (assets[0].isolatedOnly || assets[1].isolatedOnly);
  const margin = Number(amount) || 0;
  const perLeg = (margin * lev) / 2;
  const ratio = midA && midB ? midA / midB : null;
  const available = hl.bal?.perpUsdc;
  const posA = hl.bal?.details[A], posB = hl.bal?.details[B];
  const tooSmall = margin > 0 && perLeg < HL.MIN_NOTIONAL;
  const tooBig = available != null && hl.agent && margin > available + 1e-9;

  const trade = () => hl.run('Placing both legs…', () => hl.withAgent(async (agent) => {
    if (!assets || !midA || !midB) throw new Error('Prices not loaded yet.');
    const [a, b] = assets, isCross = cross && !isolatedOnly;
    await HL.setLeverage(agent, a, lev, isCross);
    await HL.setLeverage(agent, b, lev, isCross);
    const f1 = await HL.marketOrder(agent, a, long, perLeg / midA, slippage);
    try {
      const f2 = await HL.marketOrder(agent, b, !long, perLeg / midB, slippage);
      setAmount('');
      return `${long ? 'Long' : 'Short'} ${A}/${B} open: ${long ? 'bought' : 'sold'} ${fmt(f1.size)} ${A}, ${long ? 'shorted' : 'bought'} ${fmt(f2.size)} ${B} at ${lev}x.`;
    } catch (e) {
      // second leg failed: unwind the first so the user isn't left with a one-sided position
      try { await HL.marketOrder(agent, a, !long, f1.size, 300, true); } catch { /* reported below */ }
      throw new Error(`The ${B} leg failed (${errText(e)}), so the ${A} leg was closed again. Nothing is open.`);
    }
  }));
  const closePair = () => hl.run('Closing both legs…', () => hl.withAgent(async (agent) => {
    if (!assets) throw new Error('Market not loaded.');
    const out: string[] = [];
    for (const [asset, p] of [[assets[0], posA], [assets[1], posB]] as const) {
      if (!p || !p.size) continue;
      const f = await HL.marketOrder(agent, asset, p.size < 0, Math.abs(p.size), slippage, true);
      out.push(`${fmt(f.size)} ${p.coin}`);
    }
    if (!out.length) throw new Error('No open legs to close.');
    return `Closed ${out.join(' and ')}.`;
  }));

  const pairPnl = (posA?.pnl ?? 0) + (posB?.pnl ?? 0);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 bg-slate-950 rounded-lg p-1">
        <button onClick={() => setLong(true)} className={`py-2 rounded-md text-sm font-semibold ${long ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>Long {A}/{B}</button>
        <button onClick={() => setLong(false)} className={`py-2 rounded-md text-sm font-semibold ${!long ? 'bg-red-600 text-white' : 'text-slate-400'}`}>Short {A}/{B}</button>
      </div>
      <div className="text-[11px] text-slate-400">
        {long ? `Buys ${A} and shorts ${B} for the same amount: you profit when ${A} beats ${B}.` : `Shorts ${A} and buys ${B} for the same amount: you profit when ${B} beats ${A}.`}
      </div>
      {assetErr && <div className="text-xs text-red-400">{assetErr}</div>}
      {assets && <LeverageControl lev={Math.min(lev, maxLev)} setLev={setLev} max={maxLev} cross={cross} setCross={setCross} isolatedOnly={isolatedOnly} current={null} />}
      <div className="bg-slate-950 rounded-lg p-3">
        <div className="flex justify-between text-xs text-slate-500"><span>Margin</span>{available != null && <span>Available {fmt(available)} USDC</span>}</div>
        <div className="flex items-center gap-2">
          <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(',', '.'))} placeholder="0.0" className="flex-1 bg-transparent text-xl outline-none min-w-0" />
          <span className="text-sm font-semibold">USDC</span>
        </div>
        {available != null && available > 0 && (
          <div className="grid grid-cols-4 gap-1 mt-2">
            {[25, 50, 75, 100].map((p) => <button key={p} onClick={() => setAmount(String(Math.floor(available * p / 100 * 1e4) / 1e4))} className="py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px]">{p}%</button>)}
          </div>
        )}
        <div className="text-xs text-slate-500 mt-2 space-y-0.5">
          <div className="flex justify-between"><span>{A}/{B} price</span><span className="text-slate-300">{fmt(ratio)}</span></div>
          <div className="flex justify-between"><span>{long ? 'Long' : 'Short'} {A}</span><span>${fmt(perLeg)} ≈ {fmt(midA ? perLeg / midA : null)} {A}</span></div>
          <div className="flex justify-between"><span>{long ? 'Short' : 'Long'} {B}</span><span>${fmt(perLeg)} ≈ {fmt(midB ? perLeg / midB : null)} {B}</span></div>
        </div>
        {tooSmall && <div className="text-xs text-orange-300 mt-1">Each leg must be at least ${HL.MIN_NOTIONAL}. Raise the margin or leverage.</div>}
        {tooBig && <div className="text-xs text-orange-300 mt-1">More than you have available. Deposit below.</div>}
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-400">Slippage
        {[50, 100, 300].map((b) => <button key={b} onClick={() => setSlippage(b)} className={`px-2 py-1 rounded ${slippage === b ? 'bg-yellow-500 text-black' : 'bg-slate-800'}`}>{b / 100}%</button>)}
      </div>
      <ActionButton hl={hl} tone={long ? 'buy' : 'sell'} onClick={trade} disabled={!margin || tooSmall || !!tooBig || !midA || !midB}
        label={`${long ? 'Long' : 'Short'} ${A}/${B} · ${Math.min(lev, maxLev)}x`} />
      <Status hl={hl} />
      {(posA?.size || posB?.size) ? (
        <div className="bg-slate-950 rounded-lg p-3 text-xs space-y-1.5">
          <div className="flex justify-between"><span className="font-semibold">Open legs</span>
            <span className={pairPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>PnL {pairPnl >= 0 ? '+' : ''}{fmt(pairPnl, 4)} USDC</span></div>
          {[posA, posB].filter((p): p is HL.HlPosition => !!p && !!p.size).map((p) => (
            <div key={p.coin} className="flex justify-between text-slate-400">
              <span className={p.size > 0 ? 'text-emerald-400' : 'text-red-400'}>{p.size > 0 ? 'Long' : 'Short'} {fmt(Math.abs(p.size))} {p.coin}</span>
              <span>entry {fmt(p.entry)} · liq {p.liq ? fmt(p.liq) : '—'}</span>
            </div>
          ))}
          <div className="text-[11px] text-slate-500">Hyperliquid keeps one position per coin, so these include any other {A} or {B} trades you hold.</div>
          <button disabled={!!hl.step} onClick={closePair} className="w-full py-1.5 rounded border border-slate-700 hover:bg-slate-800 disabled:opacity-50">Close both legs</button>
        </div>
      ) : null}
      <FundBox hl={hl} spot={false} baseSymbol={A} />
      <SafetyNote />
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

