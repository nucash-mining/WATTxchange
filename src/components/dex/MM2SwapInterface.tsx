/**
 * MM2SwapInterface — UI for the Komodo DeFi Framework (mm2/kdf) atomic-swap
 * engine that the WATTxchange ElectrumX fleet exists to serve.
 *
 * Unlike the EVM WATT bridge (DeFiHubView's other tabs), these are trustless
 * HTLC atomic swaps: no custodian, no wrapped asset, no relayer. kdf locks each
 * leg on its native chain and only releases on secret reveal. This component is
 * the front end for that engine — connect to the local kdf daemon, enable
 * coins over their ElectrumX/EVM endpoints, read the decentralized orderbook,
 * and place taker swaps.
 *
 * Requires a local kdf daemon (see scripts/start-mm2.sh) on 127.0.0.1:7783.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowDownUp,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Radio,
  ShieldCheck,
  Power,
  Copy
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useMM2 } from '../../hooks/useMM2';
import { getCoinConfig } from '../../config/mm2Coins';
import { getEndpoint } from '../../config/nodeEndpoints';

// Match the DeFiHubView "Virtual Boy" red aesthetic.
const vb = {
  glow: { textShadow: '0 0 10px #eab308, 0 0 20px #eab308', color: '#eab308' },
  glowSubtle: { textShadow: '0 0 5px #eab308, 0 0 10px #a16207', color: '#fcd34d' },
  boxGlow: { boxShadow: '0 0 10px #eab308, inset 0 0 10px rgba(234,179,8,0.1)', border: '1px solid #eab308' },
  greenGlow: { textShadow: '0 0 8px #00ff00', color: '#00ff00' }
} as const;

const toastStyle = (ok = false) => ({
  background: '#1a0000',
  color: ok ? '#00ff00' : '#eab308',
  border: `1px solid ${ok ? '#00ff00' : '#eab308'}`
});

/** Per-coin badge: verified bytes + ElectrumX/EVM readiness. */
const CoinBadges: React.FC<{ coin: string }> = ({ coin }) => {
  const cfg = getCoinConfig(coin);
  const ep = getEndpoint(coin);
  const isEvm = cfg?.protocol.type === 'ETH' || cfg?.protocol.type === 'ERC20';
  const ready = isEvm ? !!ep?.evmRpc : !!ep?.electrumReady;
  return (
    <div className="flex items-center gap-1.5">
      {cfg && !cfg.verified && (
        <span title="Address bytes not yet confirmed against the live node"
          className="text-[9px] px-1 py-0.5 rounded border border-yellow-600 text-yellow-400">
          UNVERIFIED
        </span>
      )}
      {(cfg?.is_testnet || ep?.testnet) && (
        <span title="Live infrastructure runs this coin's TESTNET until mainnet launch"
          className="text-[9px] px-1 py-0.5 rounded border border-orange-500 text-orange-400">
          TESTNET
        </span>
      )}
      <span
        title={ready ? (isEvm ? 'EVM RPC live' : 'ElectrumX live') : 'Endpoint reserved — server not up yet'}
        className="text-[9px] px-1 py-0.5 rounded border"
        style={ready
          ? { borderColor: '#00aa00', color: '#00ff00' }
          : { borderColor: '#aa6600', color: '#ffaa33' }}>
        {isEvm ? 'EVM' : ready ? 'ELECTRUM' : 'PENDING'}
      </span>
    </div>
  );
};

const MM2SwapInterface: React.FC = () => {
  const mm2 = useMM2({ autoConnect: true, pollInterval: 30000 });
  const {
    isConnected, isLoading, needsLogin, error, version,
    enabledCoins, balances, orderbook,
    activeSwaps, recentSwaps,
    tradeableCoins, wattxchangeCoins,
    connect, enableCoin, fetchOrderbook, getBestPrice, executeSwap
  } = mm2;

  const [base, setBase] = useState('WTX');
  const [rel, setRel] = useState('BTC');
  const [amount, setAmount] = useState('');
  const [enabling, setEnabling] = useState<string | null>(null);
  const [swapping, setSwapping] = useState(false);

  const tradeableSet = useMemo(() => new Set(tradeableCoins), [tradeableCoins]);

  // Pre-fill the pair when the Instant Swap tab hands off a GleecDEX route.
  useEffect(() => {
    const setPair = (e: Event) => {
      const d = (e as CustomEvent).detail as { base?: string; rel?: string } | undefined;
      if (d?.base) setBase(d.base);
      if (d?.rel) setRel(d.rel);
    };
    window.addEventListener('wattx:dex-pair', setPair);
    return () => window.removeEventListener('wattx:dex-pair', setPair);
  }, []);

  // Refresh the orderbook whenever the pair changes (and we're connected), then
  // keep polling. The very first fetch after connect often races the libp2p
  // handshake to the seed (the P2P link needs ~1s), so a single fetch reports
  // "no response from any peer". Polling makes it self-heal within a few seconds
  // and keeps the book fresh as orders arrive.
  useEffect(() => {
    if (!(isConnected && base && rel && base !== rel)) return;
    fetchOrderbook(base, rel);
    const id = setInterval(() => fetchOrderbook(base, rel), 6000);
    return () => clearInterval(id);
  }, [isConnected, base, rel, fetchOrderbook]);

  const bestAsk = getBestPrice('buy');   // price to acquire `base` paying `rel`
  const bestBid = getBestPrice('sell');  // price received selling `base` for `rel`
  const orderbookMatchesPair = orderbook?.base === base && orderbook?.rel === rel;

  const handleEnable = async (coin: string) => {
    if (!isConnected) {
      toast.error('kdf DAEMON NOT CONNECTED', { style: toastStyle() });
      return;
    }
    setEnabling(coin);
    const id = `enable-${coin}`;
    toast.loading(`ENABLING ${coin}...`, { id, style: toastStyle() });
    const bal = await enableCoin(coin);
    if (bal) {
      toast.success(`${coin} ENABLED`, { id, style: toastStyle(true) });
    } else {
      toast.error(`${coin} FAILED — check ElectrumX/RPC`, { id, style: toastStyle() });
    }
    setEnabling(null);
  };

  const handleSwap = async (side: 'buy' | 'sell') => {
    if (!isConnected) { toast.error('kdf DAEMON NOT CONNECTED', { style: toastStyle() }); return; }
    if (base === rel) { toast.error('PICK DIFFERENT COINS', { style: toastStyle() }); return; }
    if (!enabledCoins.includes(base) || !enabledCoins.includes(rel)) {
      toast.error('ENABLE BOTH COINS FIRST', { style: toastStyle() });
      return;
    }
    const price = side === 'buy' ? bestAsk : bestBid;
    if (!price) { toast.error('NO ORDERS ON BOOK', { style: toastStyle() }); return; }
    if (!amount || parseFloat(amount) <= 0) { toast.error('ENTER AN AMOUNT', { style: toastStyle() }); return; }

    setSwapping(true);
    const id = 'swap';
    toast.loading(`STARTING ${side.toUpperCase()} SWAP...`, { id, style: toastStyle() });
    const { uuid, success } = await executeSwap({
      side, base, rel, price, volume: amount,
      onStarted: (u) =>
        toast.loading(`SWAP ${u.slice(0, 8)} NEGOTIATING...`, { id, style: toastStyle() }),
      onUpdate: (_s, human) =>
        toast.loading(human.toUpperCase(), { id, style: toastStyle() })
    });
    if (success) {
      toast.success(`SWAP COMPLETE ${uuid?.slice(0, 8) ?? ''}`, { id, duration: 8000, style: toastStyle(true) });
      setAmount('');
    } else {
      toast.error(uuid ? `SWAP ${uuid.slice(0, 8)} DID NOT FINISH` : 'SWAP FAILED',
        { id, duration: 8000, style: toastStyle() });
    }
    setSwapping(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Connection banner */}
      <div className="p-4 rounded-lg bg-black/60" style={vb.boxGlow}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <Radio className={isConnected ? 'animate-pulse' : ''}
              style={isConnected ? vb.greenGlow : vb.glow} size={18} />
            <div>
              <div className="font-mono text-sm" style={isConnected ? vb.greenGlow : vb.glow}>
                {isConnected ? `kdf DAEMON ONLINE` : needsLogin ? 'kdf DAEMON — SIGN IN TO START' : 'kdf DAEMON STARTING…'}
              </div>
              <div className="text-[10px] font-mono text-yellow-300/70">
                {isConnected
                  ? `v${version ?? '?'} · trustless HTLC atomic swaps`
                  : needsLogin
                    ? 'The swap engine runs in your browser and boots from your wallet seed — sign in (top-right) to start it.'
                    : 'Booting the in-browser Komodo DeFi engine…'}
              </div>
            </div>
          </div>
          <button
            onClick={() =>
              needsLogin
                ? window.dispatchEvent(new Event('wattx:open-auth'))
                : connect()
            }
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-1.5 rounded font-mono text-xs disabled:opacity-50"
            style={vb.boxGlow}
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Power size={14} />}
            {isConnected ? 'RECONNECT' : needsLogin ? 'SIGN IN WITH SEED' : 'CONNECT'}
          </button>
        </div>
        {error && (
          <div className="mt-2 flex items-center gap-2 text-[11px] font-mono text-yellow-400">
            <AlertTriangle size={12} /> {error}
          </div>
        )}
        {needsLogin && (
          <div className="mt-2 flex items-center gap-2 text-[11px] font-mono text-yellow-300">
            <AlertTriangle size={12} />
            Sign in (top-right) with your seed to load your wallet — the DEX derives
            your real coin addresses and balances from it. Coins & balances stay empty
            until you do.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Coins */}
        <div className="p-4 rounded-lg bg-black/60" style={vb.boxGlow}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-mono text-sm" style={vb.glowSubtle}>COINS</h3>
            <span className="text-[10px] font-mono text-yellow-300/60">
              {enabledCoins.length}/{wattxchangeCoins.length} ENABLED
            </span>
          </div>
          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            {wattxchangeCoins.map((coin) => {
              const isEnabled = enabledCoins.includes(coin);
              const canTrade = tradeableSet.has(coin);
              const bal = balances[coin];
              return (
                <div key={coin}
                  className="p-2 rounded bg-yellow-950/20 border border-yellow-900/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-xs text-yellow-200 w-12">{coin}</span>
                    <CoinBadges coin={coin} />
                  </div>
                  <div className="flex items-center gap-2">
                    {isEnabled && (
                      <span className="font-mono text-[10px]" style={vb.greenGlow}>
                        {bal ? parseFloat(bal.balance).toFixed(4) : '✓'}
                      </span>
                    )}
                    <button
                      onClick={() => handleEnable(coin)}
                      disabled={isEnabled || !canTrade || enabling === coin || !isConnected}
                      title={!canTrade ? 'ElectrumX not live yet (see electrumx/README.md)' : ''}
                      className="px-2 py-1 rounded font-mono text-[10px] disabled:opacity-40"
                      style={isEnabled ? { color: '#00ff00', border: '1px solid #006600' } : vb.boxGlow}
                    >
                      {enabling === coin
                        ? <Loader2 size={11} className="animate-spin" />
                        : isEnabled ? 'ON' : canTrade ? 'ENABLE' : 'PENDING'}
                    </button>
                  </div>
                </div>
                {/* Deposit address (derived from your seed) — send funds here to trade */}
                {isEnabled && bal?.address && (
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="text-[9px] font-mono text-yellow-700 shrink-0">DEPOSIT</span>
                    <code className="text-[10px] font-mono text-yellow-300/80 truncate">{bal.address}</code>
                    <button
                      onClick={() => { navigator.clipboard.writeText(bal.address); toast.success(`${coin} address copied`, { style: toastStyle(true) }); }}
                      title={`Copy your ${coin} deposit address`}
                      className="shrink-0 p-0.5 hover:text-yellow-300 text-yellow-600"
                    >
                      <Copy size={11} />
                    </button>
                  </div>
                )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Swap */}
        <div className="p-4 rounded-lg bg-black/60" style={vb.boxGlow}>
          <h3 className="font-mono text-sm mb-3" style={vb.glowSubtle}>ATOMIC SWAP</h3>

          <div className="flex items-center gap-2 mb-3">
            <CoinSelect label="BASE" value={base} onChange={setBase} coins={wattxchangeCoins} />
            <button
              onClick={() => { setBase(rel); setRel(base); }}
              className="mt-5 p-1.5 rounded" style={vb.boxGlow} title="Flip pair">
              <ArrowDownUp size={14} style={vb.glow} />
            </button>
            <CoinSelect label="REL" value={rel} onChange={setRel} coins={wattxchangeCoins} />
          </div>

          {/* Orderbook summary */}
          <div className="grid grid-cols-2 gap-2 mb-3 text-center">
            <div className="p-2 rounded bg-yellow-950/20 border border-yellow-900/40">
              <div className="text-[9px] font-mono text-yellow-300/60">BEST ASK (BUY)</div>
              <div className="font-mono text-xs" style={vb.greenGlow}>
                {orderbookMatchesPair && bestAsk ? parseFloat(bestAsk).toPrecision(6) : '—'}
              </div>
            </div>
            <div className="p-2 rounded bg-yellow-950/20 border border-yellow-900/40">
              <div className="text-[9px] font-mono text-yellow-300/60">BEST BID (SELL)</div>
              <div className="font-mono text-xs" style={vb.glowSubtle}>
                {orderbookMatchesPair && bestBid ? parseFloat(bestBid).toPrecision(6) : '—'}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mb-3 text-[10px] font-mono text-yellow-300/60">
            <span>{orderbookMatchesPair ? `${orderbook?.numasks ?? 0} asks · ${orderbook?.numbids ?? 0} bids` : 'no book'}</span>
            <button onClick={() => fetchOrderbook(base, rel)}
              className="flex items-center gap-1 hover:text-yellow-200">
              <RefreshCw size={10} /> REFRESH
            </button>
          </div>

          <label className="block text-[10px] font-mono text-yellow-300/60 mb-1">VOLUME ({base})</label>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            inputMode="decimal"
            className="w-full px-3 py-2 mb-3 rounded bg-black/70 font-mono text-sm text-yellow-100 outline-none"
            style={vb.boxGlow}
          />

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleSwap('buy')}
              disabled={swapping || !isConnected}
              className="flex items-center justify-center gap-2 py-2.5 rounded font-mono text-xs disabled:opacity-40"
              style={{ border: '1px solid #00aa00', color: '#00ff00', textShadow: '0 0 6px #00ff00' }}
            >
              {swapping ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />}
              BUY {base}
            </button>
            <button
              onClick={() => handleSwap('sell')}
              disabled={swapping || !isConnected}
              className="flex items-center justify-center gap-2 py-2.5 rounded font-mono text-xs disabled:opacity-40"
              style={vb.boxGlow}
            >
              {swapping ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />}
              SELL {base}
            </button>
          </div>
          <p className="mt-2 text-[9px] font-mono text-yellow-300/50 leading-relaxed">
            Taker swap against the best resting order. kdf escrows both legs via
            HTLC — funds only move on secret reveal. No bridge, no custodian.
          </p>
        </div>
      </div>

      {/* Swaps */}
      <div className="p-4 rounded-lg bg-black/60" style={vb.boxGlow}>
        <h3 className="font-mono text-sm mb-3" style={vb.glowSubtle}>
          SWAPS {activeSwaps.length > 0 && (
            <span style={vb.greenGlow}>· {activeSwaps.length} ACTIVE</span>
          )}
        </h3>
        {recentSwaps.length === 0 && activeSwaps.length === 0 ? (
          <p className="text-[11px] font-mono text-yellow-300/50">No swaps yet.</p>
        ) : (
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {recentSwaps.map((s) => {
              const last = s.events[s.events.length - 1]?.event?.type ?? 'Pending';
              const done = last === 'Finished';
              const failed = s.error_events?.includes(last);
              return (
                <div key={s.uuid}
                  className="flex items-center justify-between p-2 rounded bg-yellow-950/20 border border-yellow-900/40 font-mono text-[11px]">
                  <span className="text-yellow-200">
                    {s.maker_coin}/{s.taker_coin} · {s.uuid.slice(0, 8)}
                  </span>
                  <span className="flex items-center gap-1"
                    style={failed ? vb.glow : done ? vb.greenGlow : vb.glowSubtle}>
                    {done && !failed ? <CheckCircle2 size={11} /> : failed ? <AlertTriangle size={11} /> : <Loader2 size={11} className="animate-spin" />}
                    {last}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};

const CoinSelect: React.FC<{
  label: string; value: string; onChange: (v: string) => void; coins: string[];
}> = ({ label, value, onChange, coins }) => (
  <div className="flex-1">
    <label className="block text-[10px] font-mono text-yellow-300/60 mb-1">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-2 py-2 rounded bg-black/70 font-mono text-sm text-yellow-100 outline-none"
      style={vb.boxGlow}
    >
      {coins.map((c) => <option key={c} value={c} className="bg-black">{c}</option>)}
    </select>
  </div>
);

export default MM2SwapInterface;
