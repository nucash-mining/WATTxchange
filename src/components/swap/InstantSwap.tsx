// Instant Swap — non-custodial best-price aggregator UI over swapRouterService.
// Quotes across your own WATT/WTX rails + THORChain, hands the user the winning
// route's OWN deposit address. We never take custody, so there's no wallet to
// connect and nothing sensitive here — just an address to send to.
import { useCallback, useEffect, useState } from 'react';
import { ArrowDownUp, Copy, Loader2, ExternalLink, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { swapRouterService, type SwapRoute, type RouterSwap } from '../../services/swapRouterService';

const coins = swapRouterService.coins;
const copy = (t: string, label: string) => { navigator.clipboard.writeText(t); toast.success(`${label} copied`); };

const InstantSwap: React.FC = () => {
  const [from, setFrom] = useState('BTC');
  const [to, setTo] = useState('ETH');
  const [amount, setAmount] = useState('');
  const [destination, setDestination] = useState('');
  const [route, setRoute] = useState<SwapRoute | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [quoteErr, setQuoteErr] = useState<string | null>(null);
  const [swap, setSwap] = useState<RouterSwap | null>(null);
  const [creating, setCreating] = useState(false);
  const [txidInput, setTxidInput] = useState('');

  // Debounced best-price quote whenever the pair/amount changes.
  useEffect(() => {
    setRoute(null); setQuoteErr(null);
    const amt = parseFloat(amount);
    if (!(amt > 0) || from === to) return;
    setQuoting(true);
    const h = setTimeout(async () => {
      try {
        const q = await swapRouterService.quote(from, to, amount);
        if (q.best) setRoute(q.best);
        else setQuoteErr(q.errors?.[0]?.error || q.note || 'no route for this pair');
      } catch (e) { setQuoteErr(e instanceof Error ? e.message : 'quote failed'); }
      finally { setQuoting(false); }
    }, 500);
    return () => clearTimeout(h);
  }, [from, to, amount]);

  // Poll the created swap's status.
  const refresh = useCallback(async (id: string) => {
    try { setSwap(await swapRouterService.getSwap(id)); } catch { /* transient */ }
  }, []);
  useEffect(() => {
    if (!swap || ['completed', 'refunded', 'expired'].includes(swap.state)) return;
    const t = setInterval(() => refresh(swap.id), 8000);
    return () => clearInterval(t);
  }, [swap, refresh]);

  const flip = () => { setFrom(to); setTo(from); setRoute(null); setSwap(null); };

  const create = async () => {
    if (!destination.trim()) { toast.error(`Enter your ${to} receive address`); return; }
    setCreating(true);
    try {
      const s = await swapRouterService.createSwap(from, to, amount, destination.trim());
      setSwap(s);
      toast.success('Swap created — send your deposit');
    } catch (e) { toast.error(e instanceof Error ? e.message : 'create failed'); }
    finally { setCreating(false); }
  };

  const markSent = async () => {
    if (!swap || !txidInput.trim()) return;
    try { setSwap(await swapRouterService.attachTxid(swap.id, txidInput.trim())); toast.success('Tracking your deposit'); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'failed'); }
  };

  const box = 'rounded-lg border border-yellow-900/40 bg-black/50 p-4';
  const sel = 'bg-black/60 border border-yellow-900/50 rounded px-2 py-1.5 text-yellow-200 font-mono text-sm';

  return (
    <div className="space-y-4">
      <div className={box}>
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-4 h-4 text-green-500" />
          <span className="text-xs font-mono text-yellow-300/80">
            NON-CUSTODIAL AGGREGATOR — best price across your rails + THORChain. You send to the route&apos;s own address; we never hold your funds.
          </span>
        </div>

        {/* From */}
        <label className="text-[10px] font-mono text-yellow-700">YOU SEND</label>
        <div className="flex gap-2 mt-1">
          <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" inputMode="decimal"
            className="flex-1 bg-black/60 border border-yellow-900/50 rounded px-3 py-2 text-yellow-100 font-mono" />
          <select value={from} onChange={(e) => setFrom(e.target.value)} className={sel}>
            {coins.map((c) => <option key={c} value={c} className="bg-black">{c}</option>)}
          </select>
        </div>

        <div className="flex justify-center my-2">
          <button onClick={flip} className="p-1.5 rounded-full border border-yellow-900/50 hover:bg-yellow-950/40">
            <ArrowDownUp className="w-4 h-4 text-yellow-500" />
          </button>
        </div>

        {/* To */}
        <label className="text-[10px] font-mono text-yellow-700">YOU RECEIVE</label>
        <div className="flex gap-2 mt-1 items-center">
          <div className="flex-1 bg-black/40 border border-yellow-900/30 rounded px-3 py-2 font-mono text-yellow-100">
            {quoting ? <Loader2 className="w-4 h-4 animate-spin inline" />
              : route ? `≈ ${route.outAmount.toLocaleString(undefined, { maximumFractionDigits: 8 })}`
              : <span className="text-yellow-800">—</span>}
          </div>
          <select value={to} onChange={(e) => setTo(e.target.value)} className={sel}>
            {coins.map((c) => <option key={c} value={c} className="bg-black">{c}</option>)}
          </select>
        </div>

        {route && (
          <div className="mt-2 text-[11px] font-mono text-yellow-600 flex flex-wrap gap-x-4">
            <span>via <span className="text-yellow-300">{route.provider}</span></span>
            {route.etaSeconds ? <span>~{Math.round(route.etaSeconds / 60)} min</span> : null}
            <span className="text-green-600">{route.custody}</span>
          </div>
        )}
        {quoteErr && <div className="mt-2 text-[11px] font-mono text-amber-400">{quoteErr}</div>}

        {/* GleecDEX wins → trustless in-browser atomic swap: hand off to the DEX tab */}
        {!swap && route?.provider === 'gleecdex' && (
          <>
            <p className="mt-4 text-[11px] font-mono text-green-500/90">
              ✓ Best price is on your GleecDEX — this runs as a trustless atomic swap in your browser (no deposit to anyone).
            </p>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('wattx:goto-dex', { detail: { base: from, rel: to } }))}
              className="w-full mt-2 py-2.5 rounded font-mono text-sm bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold">
              TRADE ON GLEECDEX →
            </button>
          </>
        )}

        {/* Destination + create for custodial-handoff routes (THORChain/desk/providers) */}
        {!swap && route && route.provider !== 'gleecdex' && (
          <>
            <label className="text-[10px] font-mono text-yellow-700 block mt-4">YOUR {to} RECEIVE ADDRESS</label>
            <input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder={`Your ${to} address`}
              className="w-full mt-1 bg-black/60 border border-yellow-900/50 rounded px-3 py-2 text-yellow-100 font-mono text-sm" />
            <button onClick={create} disabled={creating || !destination.trim()}
              className="w-full mt-3 py-2.5 rounded font-mono text-sm bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold disabled:opacity-40">
              {creating ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'CREATE SWAP'}
            </button>
          </>
        )}
      </div>

      {/* Deposit + status */}
      {swap && (
        <div className={box}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-yellow-300">{swap.from} → {swap.to}</span>
            <span className={`text-xs font-mono ${swap.state === 'completed' ? 'text-green-400' : 'text-yellow-400'}`}>
              {swap.state === 'created' && swap.live?.deposit?.seen
                ? `deposit detected — ${swap.live.deposit.confirmations}/${swap.live.deposit.required} conf`
                : swap.state.replace(/_/g, ' ')}
            </span>
          </div>

          {swap.depositAddress ? (
            <>
              <p className="text-[11px] text-yellow-700 font-mono mb-1">SEND EXACTLY {swap.amount} {swap.depositCoin || swap.from} TO:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 break-all text-yellow-100 text-xs bg-black/60 rounded px-2 py-1.5">{swap.depositAddress}</code>
                <button onClick={() => copy(swap.depositAddress!, 'Address')}><Copy className="w-4 h-4 text-yellow-500" /></button>
              </div>
              {swap.memo && (
                <div className="mt-2">
                  <p className="text-[11px] text-amber-400 font-mono mb-1">⚠ INCLUDE THIS MEMO (required, or funds are lost):</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 break-all text-amber-200 text-xs bg-black/60 rounded px-2 py-1.5">{swap.memo}</code>
                    <button onClick={() => copy(swap.memo!, 'Memo')}><Copy className="w-4 h-4 text-yellow-500" /></button>
                  </div>
                </div>
              )}
            </>
          ) : swap.lockParams ? (
            <p className="text-xs text-yellow-600 font-mono">{swap.instructions}</p>
          ) : null}

          {/* THORChain: track by the user's send txid */}
          {swap.provider === 'thorchain' && swap.state !== 'completed' && (
            <div className="mt-3">
              <p className="text-[10px] font-mono text-yellow-700">ALREADY SENT? PASTE YOUR TX HASH TO TRACK:</p>
              <div className="flex gap-2 mt-1">
                <input value={txidInput} onChange={(e) => setTxidInput(e.target.value)} placeholder="deposit tx hash"
                  className="flex-1 bg-black/60 border border-yellow-900/50 rounded px-2 py-1.5 text-yellow-100 font-mono text-xs" />
                <button onClick={markSent} className="px-3 rounded font-mono text-xs border border-yellow-700 text-yellow-300">TRACK</button>
              </div>
            </div>
          )}

          {swap.expectedOut != null && (
            <p className="mt-3 text-[11px] font-mono text-yellow-700">
              You&apos;ll receive ≈ {swap.expectedOut.toLocaleString(undefined, { maximumFractionDigits: 8 })} {swap.to} at{' '}
              <span className="text-yellow-400">{swap.destination.slice(0, 10)}…</span>
            </p>
          )}
          <p className="mt-2 text-[10px] font-mono text-yellow-900 flex items-center gap-1">
            <ExternalLink className="w-3 h-3" /> swap id {swap.id}
          </p>
        </div>
      )}
    </div>
  );
};

export default InstantSwap;
