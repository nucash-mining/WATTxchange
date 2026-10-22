import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ethers } from 'ethers';
import { Droplets, RefreshCw, Search, ExternalLink, Plus, Minus, X, Wallet, AlertTriangle, Info, LineChart } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';
import PoolChart from './liquidity/PoolChart';
import { LP_CHAINS, LP_CHAINS_WITHOUT_AMM } from '../config/liquidityPools';
import {
  loadAllPools, loadPrices, priceTokens, units, walletBalances, addLiquidity, removeLiquidity,
  poolHasNativeSide, wrappedNativeOf, explorerTx, explorerAddress, type ChainLoad, type LpPool,
} from '../services/liquidityService';

const usd = (v: number | null | undefined) => {
  if (v == null || !Number.isFinite(v)) return '—';
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
  if (v >= 1) return `$${v.toFixed(2)}`;
  return v > 0 ? `$${v.toPrecision(3)}` : '$0';
};
const amt = (v: number) => {
  if (!Number.isFinite(v)) return '—';
  if (v === 0) return '0';
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(2)}K`;
  if (v >= 1) return v.toFixed(4).replace(/\.?0+$/, '');
  return v.toPrecision(4);
};
const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
const poolKey = (p: LpPool) => `${p.chain.chainId}:${p.address}`;

type Pricing = ReturnType<typeof priceTokens>;

const TokenBadge: React.FC<{ symbol: string }> = ({ symbol }) => (
  <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[9px] font-bold text-slate-200 shrink-0">
    {symbol.replace(/^w(?=[A-Z])/, '').replace(/\s.*$/, '').slice(0, 3).toUpperCase()}
  </div>
);

const LiquidityView: React.FC = () => {
  const { address, isConnected, connectWallet } = useWallet();
  const [loads, setLoads] = useState<ChainLoad[] | null>(null);
  const [feeds, setFeeds] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [chainFilter, setChainFilter] = useState<number | 'all'>('all');
  const [query, setQuery] = useState('');
  const [mineOnly, setMineOnly] = useState(false);
  const [showEmpty, setShowEmpty] = useState(false);
  const [action, setAction] = useState<{ pool: LpPool; mode: 'add' | 'remove' } | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [l, f] = await Promise.all([loadAllPools(address ?? null), loadPrices()]);
    setLoads(l);
    setFeeds(f);
    setLoading(false);
  }, [address]);

  useEffect(() => { refresh(); }, [refresh]);

  const allPools = useMemo(() => loads?.flatMap((l) => l.pools) ?? [], [loads]);
  const pricing = useMemo(() => priceTokens(allPools, feeds), [allPools, feeds]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allPools
      .filter((p) => chainFilter === 'all' || p.chain.chainId === chainFilter)
      .filter((p) => showEmpty || p.reserve0 > 0n)
      .filter((p) => !mineOnly || p.userLp > 0n)
      .filter((p) => !q || [p.token0.label, p.token1.label, p.token0.symbol, p.token1.symbol, p.address, p.dex.name, p.chain.name]
        .some((s) => s.toLowerCase().includes(q)))
      .sort((a, b) => (Number(b.userLp > 0n) - Number(a.userLp > 0n)) || ((pricing.tvl(b) ?? -1) - (pricing.tvl(a) ?? -1)));
  }, [allPools, chainFilter, showEmpty, mineOnly, query, pricing]);

  const totals = useMemo(() => {
    let tvl = 0, mine = 0, positions = 0;
    for (const p of allPools) {
      const t = pricing.tvl(p) ?? 0;
      tvl += t;
      if (p.userLp > 0n && p.totalSupply > 0n) {
        positions++;
        mine += t * (Number(p.userLp) / Number(p.totalSupply));
      }
    }
    return { tvl, mine, positions, live: allPools.filter((p) => p.reserve0 > 0n).length };
  }, [allPools, pricing]);

  const hiddenEmpty = allPools.filter((p) => p.reserve0 === 0n && (chainFilter === 'all' || p.chain.chainId === chainFilter)).length;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-cyan-500/20 border border-cyan-500/30">
            <Droplets className="w-8 h-8 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Liquidity Pools</h2>
            <p className="text-slate-400">Every pool on every chain, read live from the contracts.</p>
          </div>
        </div>
        <div className="flex gap-2">
          {!isConnected && (
            <button onClick={connectWallet} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black font-medium">
              <Wallet className="w-4 h-4" /> Connect wallet
            </button>
          )}
          <button onClick={refresh} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total value locked', value: usd(totals.tvl) },
          { label: 'Live pools', value: loads ? String(totals.live) : '—' },
          { label: 'Chains', value: String(LP_CHAINS.length) },
          { label: 'Your liquidity', value: isConnected ? `${usd(totals.mine)} · ${totals.positions}` : 'Connect wallet' },
        ].map((s) => (
          <div key={s.label} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-400">{s.label}</div>
            <div className="text-xl font-semibold mt-1">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-3 md:items-center">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[{ id: 'all' as const, name: 'All chains' }, ...LP_CHAINS.map((c) => ({ id: c.chainId, name: c.name }))].map((c) => (
            <button key={c.id} onClick={() => setChainFilter(c.id)}
              className={`px-3 py-2 rounded-lg text-sm whitespace-nowrap border ${chainFilter === c.id ? 'bg-cyan-600 border-cyan-500 text-white' : 'bg-slate-900/50 border-slate-800 text-slate-300'}`}>
              {c.name}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search token, pair address or DEX"
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900/50 border border-slate-800 focus:border-cyan-600 outline-none text-sm" />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-300 whitespace-nowrap">
          <input type="checkbox" checked={mineOnly} onChange={(e) => setMineOnly(e.target.checked)} /> My positions
        </label>
      </div>

      {loads?.filter((l) => l.error).map((l) => (
        <div key={l.chain.chainId} className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-300">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> Could not read {l.chain.name} pools: {l.error}
        </div>
      ))}

      {!loads ? (
        <div className="text-center text-slate-400 py-16">Reading pools from the chains…</div>
      ) : (
        <div className="space-y-3">
          {visible.map((p) => (
            <PoolCard key={poolKey(p)} pool={p} pricing={pricing} connected={isConnected}
              onAdd={() => (isConnected ? setAction({ pool: p, mode: 'add' }) : connectWallet())}
              onRemove={() => setAction({ pool: p, mode: 'remove' })} />
          ))}
          {visible.length === 0 && (
            <div className="text-center text-slate-400 py-10">{mineOnly ? 'You have no liquidity in these pools yet.' : 'No pools match.'}</div>
          )}
          {!showEmpty && hiddenEmpty > 0 && (
            <button onClick={() => setShowEmpty(true)} className="w-full text-sm text-slate-400 hover:text-white py-2">
              Show {hiddenEmpty} empty pool{hiddenEmpty === 1 ? '' : 's'}
            </button>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-3">
        {LP_CHAINS.flatMap((c) => (c.v3Pools ?? []).map((v3) => (
          <div key={v3.address} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-sm">
            <div className="font-medium">{v3.name} <span className="text-slate-500">· Uniswap v3 · {c.name}</span></div>
            <p className="text-slate-400 mt-1">Concentrated-liquidity pool. Positions are NFTs managed on Uniswap.</p>
            <div className="flex gap-4 mt-2">
              <a href={explorerAddress(c, v3.address)} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline inline-flex items-center gap-1">Contract <ExternalLink className="w-3 h-3" /></a>
              <a href={v3.manageUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline inline-flex items-center gap-1">Manage on Uniswap <ExternalLink className="w-3 h-3" /></a>
            </div>
          </div>
        )))}
        {LP_CHAINS_WITHOUT_AMM.map((c) => (
          <div key={c.name} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-sm flex gap-2">
            <Info className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <div><span className="font-medium">{c.name}:</span> <span className="text-slate-400">{c.note}</span></div>
          </div>
        ))}
      </div>

      {action && (
        <LiquidityDialog pool={action.pool} mode={action.mode} user={address} pricing={pricing}
          onClose={() => setAction(null)} onDone={() => { setAction(null); refresh(); }} />
      )}
    </div>
  );
};

const PoolCard: React.FC<{ pool: LpPool; pricing: Pricing; connected: boolean; onAdd: () => void; onRemove: () => void }> = ({ pool: p, pricing, connected, onAdd, onRemove }) => {
  const [open, setOpen] = useState(false);
  const r0 = units(p.reserve0, p.token0.decimals);
  const r1 = units(p.reserve1, p.token1.decimals);
  const tvl = pricing.tvl(p);
  const share = p.totalSupply > 0n ? Number(p.userLp) / Number(p.totalSupply) : 0;
  const pr0 = pricing.get(p, p.token0), pr1 = pricing.get(p, p.token1);

  return (
    <div className={`bg-slate-900/50 border rounded-xl p-4 ${p.userLp > 0n ? 'border-cyan-700/60' : 'border-slate-800'}`}>
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <button className="flex items-center gap-3 min-w-0 md:w-72 text-left" onClick={() => setOpen((v) => !v)}>
          <div className="flex -space-x-2"><TokenBadge symbol={p.token0.label} /><TokenBadge symbol={p.token1.label} /></div>
          <div className="min-w-0">
            <div className="font-semibold truncate">{p.token0.label} / {p.token1.label}</div>
            <div className="text-xs text-slate-400">{p.dex.name} · {p.chain.name} · {(p.dex.feeBps / 100).toFixed(2)}%</div>
          </div>
        </button>
        <div className="grid grid-cols-3 gap-3 flex-1 text-sm">
          <div><div className="text-xs text-slate-500">TVL</div><div>{usd(tvl)}</div></div>
          <div className="min-w-0"><div className="text-xs text-slate-500">Reserves</div>
            <div className="truncate">{amt(r0)} {p.token0.label}</div><div className="truncate">{amt(r1)} {p.token1.label}</div></div>
          <div><div className="text-xs text-slate-500">Your share</div>
            <div>{connected ? (share > 0 ? `${(share * 100).toPrecision(3)}%` : '—') : '—'}</div>
            {share > 0 && <div className="text-xs text-cyan-400">{usd(tvl != null ? tvl * share : null)}</div>}</div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setOpen((v) => !v)} title="Price chart"
            className={`flex items-center justify-center gap-1 px-3 py-2 rounded-lg border text-sm ${open ? 'bg-slate-700 border-slate-600' : 'bg-slate-800 hover:bg-slate-700 border-slate-700'}`}>
            <LineChart className="w-4 h-4" /> <span className="md:hidden lg:inline">Chart</span>
          </button>
          <button onClick={onAdd} className="flex-1 md:flex-none flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-sm font-medium">
            <Plus className="w-4 h-4" /> Add
          </button>
          {p.userLp > 0n && (
            <button onClick={onRemove} className="flex-1 md:flex-none flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm">
              <Minus className="w-4 h-4" /> Remove
            </button>
          )}
        </div>
      </div>
      {open && (
        <div className="mt-3 pt-3 border-t border-slate-800">
          <PoolChart pool={p} />
        </div>
      )}
      {open && (
        <div className="mt-3 pt-3 border-t border-slate-800 grid md:grid-cols-3 gap-3 text-xs text-slate-400">
          <div>Pair: <a className="text-cyan-400 hover:underline" href={explorerAddress(p.chain, p.address)} target="_blank" rel="noopener noreferrer">{short(p.address)}</a></div>
          {[p.token0, p.token1].map((t, i) => {
            const pr = i === 0 ? pr0 : pr1;
            return (
              <div key={t.address}>
                {t.label}: <a className="text-cyan-400 hover:underline" href={explorerAddress(p.chain, t.address)} target="_blank" rel="noopener noreferrer">{short(t.address)}</a>
                {pr && <> · {usd(pr.usd)}{pr.implied ? ' (implied)' : ''}</>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const LiquidityDialog: React.FC<{
  pool: LpPool; mode: 'add' | 'remove'; user: string | null; pricing: Pricing; onClose: () => void; onDone: () => void;
}> = ({ pool: p, mode, user, onClose, onDone }) => {
  const native = poolHasNativeSide(p);
  const [useNative, setUseNative] = useState(native);
  const [a0, setA0] = useState('');
  const [a1, setA1] = useState('');
  const [pct, setPct] = useState(100);
  const [slippage, setSlippage] = useState(100); // bps
  const [bal, setBal] = useState<{ b0: bigint; b1: bigint; native: bigint } | null>(null);
  const [step, setStep] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  useEffect(() => { if (user) walletBalances(p, user).then(setBal).catch(() => {}); }, [p, user]);

  const isNat = (i: 0 | 1) => useNative && (i === 0 ? p.token0 : p.token1).address.toLowerCase() === wrappedNativeOf(p);
  const label = (i: 0 | 1) => (isNat(i) ? p.chain.nativeSymbol : (i === 0 ? p.token0 : p.token1).label);
  const dec = (i: 0 | 1) => (i === 0 ? p.token0 : p.token1).decimals;
  const balOf = (i: 0 | 1) => (bal ? (isNat(i) ? bal.native : i === 0 ? bal.b0 : bal.b1) : null);
  const hasReserves = p.reserve0 > 0n && p.reserve1 > 0n;

  // Keep the two sides at the pool's ratio while typing.
  const typed = (i: 0 | 1, v: string) => {
    (i === 0 ? setA0 : setA1)(v);
    if (!hasReserves) return;
    try {
      const raw = ethers.parseUnits(v || '0', dec(i));
      const other = i === 0 ? (raw * p.reserve1) / p.reserve0 : (raw * p.reserve0) / p.reserve1;
      (i === 0 ? setA1 : setA0)(other === 0n ? '' : ethers.formatUnits(other, dec(i === 0 ? 1 : 0)));
    } catch { /* partial input */ }
  };
  const setMax = (i: 0 | 1) => {
    const b = balOf(i);
    if (b == null) return;
    // leave a little native coin for gas
    const usable = isNat(i) ? (b > ethers.parseEther('0.05') ? b - ethers.parseEther('0.05') : 0n) : b;
    typed(i, ethers.formatUnits(usable, dec(i)));
  };

  const lpOut = (p.userLp * BigInt(pct)) / 100n;
  const out0 = p.totalSupply > 0n ? (lpOut * p.reserve0) / p.totalSupply : 0n;
  const out1 = p.totalSupply > 0n ? (lpOut * p.reserve1) / p.totalSupply : 0n;

  const submit = async () => {
    setError(null);
    try {
      let hash: string;
      if (mode === 'add') {
        const x0 = ethers.parseUnits(a0 || '0', dec(0));
        const x1 = ethers.parseUnits(a1 || '0', dec(1));
        if (x0 === 0n || x1 === 0n) throw new Error('Enter an amount for both tokens.');
        const b0 = balOf(0), b1 = balOf(1);
        if (b0 != null && x0 > b0) throw new Error(`Not enough ${label(0)}.`);
        if (b1 != null && x1 > b1) throw new Error(`Not enough ${label(1)}.`);
        hash = await addLiquidity({ pool: p, amount0: x0, amount1: x1, useNative, slippageBps: slippage, onStep: setStep });
      } else {
        if (lpOut === 0n) throw new Error('Nothing to remove.');
        hash = await removeLiquidity({ pool: p, lpAmount: lpOut, receiveNative: useNative, slippageBps: slippage, onStep: setStep });
      }
      setTxHash(hash);
      setStep(null);
    } catch (err) {
      setStep(null);
      const e = err as { shortMessage?: string; message?: string; code?: string };
      setError(e.code === 'ACTION_REJECTED' ? 'Cancelled in wallet.' : (e.shortMessage ?? e.message ?? String(err)));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end md:items-center justify-center p-0 md:p-4" onClick={(e) => e.target === e.currentTarget && !step && onClose()}>
      <div className="w-full md:max-w-md bg-slate-900 border border-slate-700 rounded-t-2xl md:rounded-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{mode === 'add' ? 'Add liquidity' : 'Remove liquidity'}</h3>
            <div className="text-xs text-slate-400">{p.token0.label} / {p.token1.label} · {p.dex.name} · {p.chain.name}</div>
          </div>
          <button onClick={onClose} disabled={!!step} className="p-2 rounded-lg hover:bg-slate-800"><X className="w-5 h-5" /></button>
        </div>

        {txHash ? (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm">Done. The transaction is confirmed.</div>
            <a href={explorerTx(p.chain, txHash)} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline text-sm inline-flex items-center gap-1">
              View transaction <ExternalLink className="w-3 h-3" />
            </a>
            <button onClick={onDone} className="w-full py-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 font-medium">Close</button>
          </div>
        ) : (
          <>
            {mode === 'add' ? (
              <>
                {!hasReserves && (
                  <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-200 text-xs">
                    This pool is empty. The amounts you add set its starting price.
                  </div>
                )}
                {([0, 1] as const).map((i) => (
                  <div key={i} className="bg-slate-800/60 rounded-lg p-3">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>{label(i)}</span>
                      <button onClick={() => setMax(i)} className="hover:text-white">
                        Balance: {balOf(i) != null ? amt(units(balOf(i)!, dec(i))) : '…'} · Max
                      </button>
                    </div>
                    <input inputMode="decimal" value={i === 0 ? a0 : a1} onChange={(e) => typed(i, e.target.value.replace(',', '.'))}
                      placeholder="0.0" className="w-full bg-transparent text-xl outline-none" />
                  </div>
                ))}
              </>
            ) : (
              <>
                <div className="bg-slate-800/60 rounded-lg p-3">
                  <div className="text-xs text-slate-400">Amount</div>
                  <div className="text-2xl font-semibold">{pct}%</div>
                  <input type="range" min={1} max={100} value={pct} onChange={(e) => setPct(Number(e.target.value))} className="w-full" />
                  <div className="flex gap-2 mt-2">
                    {[25, 50, 75, 100].map((v) => (
                      <button key={v} onClick={() => setPct(v)} className={`flex-1 py-1 rounded text-sm ${pct === v ? 'bg-cyan-600' : 'bg-slate-700'}`}>{v}%</button>
                    ))}
                  </div>
                </div>
                <div className="text-sm text-slate-300 space-y-1">
                  <div className="flex justify-between"><span>You receive</span><span>{amt(units(out0, dec(0)))} {label(0)}</span></div>
                  <div className="flex justify-between"><span /><span>{amt(units(out1, dec(1)))} {label(1)}</span></div>
                </div>
              </>
            )}

            {native && (
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" checked={useNative} onChange={(e) => setUseNative(e.target.checked)} />
                {mode === 'add' ? `Pay with ${p.chain.nativeSymbol} instead of wrapped` : `Receive ${p.chain.nativeSymbol} instead of wrapped`}
              </label>
            )}
            <div className="flex items-center gap-2 text-xs text-slate-400">
              Slippage
              {[50, 100, 300].map((b) => (
                <button key={b} onClick={() => setSlippage(b)} className={`px-2 py-1 rounded ${slippage === b ? 'bg-cyan-600 text-white' : 'bg-slate-800'}`}>{b / 100}%</button>
              ))}
            </div>

            {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm break-words">{error}</div>}
            <button onClick={submit} disabled={!!step} className="w-full py-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 font-medium">
              {step ?? (mode === 'add' ? 'Add liquidity' : 'Remove liquidity')}
            </button>
            <p className="text-xs text-slate-500">
              Transactions go straight to the {p.dex.name} router ({short(p.dex.router)}) from your wallet. Your wallet is switched to {p.chain.name} if needed.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default LiquidityView;
