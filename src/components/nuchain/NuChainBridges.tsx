import React, { useEffect, useState } from 'react';
import { ArrowLeftRight, ExternalLink, Wallet } from 'lucide-react';
import { NUCHAIN, HUB, MINING, BRIDGE_CHAINS, TOKEN_HOMES, KEPLR_CHAIN_INFO, LaneStatus } from '../../config/nuchainBridges';

const STATUS_LABEL: Record<LaneStatus, { text: string; cls: string }> = {
  'live': { text: 'Live', cls: 'bg-emerald-500/20 text-emerald-300' },
  'pending-connect': { text: 'Connecting', cls: 'bg-yellow-500/20 text-yellow-300' },
  'pending-funding': { text: 'Awaiting gas', cls: 'bg-orange-500/20 text-orange-300' },
  'pending-deploy': { text: 'Planned', cls: 'bg-slate-600/40 text-slate-300' },
};

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

async function rpc(method: string, params: unknown[]) {
  const r = await fetch(NUCHAIN.evmRpc, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error.message);
  return j.result as string;
}

const NuChainBridges: React.FC = () => {
  const [height, setHeight] = useState<number | null>(null);
  const [solLocks, setSolLocks] = useState<number | null>(null);
  const [pot, setPot] = useState<number | null>(null);
  const [online, setOnline] = useState<boolean | null>(null);
  const [keplrMsg, setKeplrMsg] = useState('');

  useEffect(() => {
    let stop = false;
    const tick = async () => {
      try {
        const h = await rpc('eth_blockNumber', []);
        // SolanaGateway.lockNonce() selector
        const n = await rpc('eth_call', [{ to: HUB.solanaGateway, data: '0xb5a9096e' }, 'latest']);
        const p = await rpc('eth_getBalance', [MINING.pot, 'latest']);
        if (!stop) { setHeight(parseInt(h, 16)); setSolLocks(parseInt(n, 16)); setPot(Number(BigInt(p) / 10n ** 14n) / 1e4); setOnline(true); }
      } catch {
        if (!stop) setOnline(false);
      }
    };
    tick();
    const t = setInterval(tick, 5000);
    return () => { stop = true; clearInterval(t); };
  }, []);

  const addToKeplr = async () => {
    const k = (window as unknown as { keplr?: { experimentalSuggestChain: (c: unknown) => Promise<void>; enable: (id: string) => Promise<void> } }).keplr;
    if (!k) { setKeplrMsg('Keplr extension not found.'); return; }
    try {
      await k.experimentalSuggestChain(KEPLR_CHAIN_INFO);
      await k.enable(NUCHAIN.cosmosChainId);
      setKeplrMsg('nuChain added to Keplr.');
    } catch (e) {
      setKeplrMsg(`Keplr: ${(e as Error).message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/30 rounded-xl p-5 border border-slate-700/50">
          <p className="text-slate-400 text-sm">Mining pot</p>
          <p className="text-2xl font-bold">{pot !== null ? `${pot.toLocaleString()} NU` : '–'}</p>
          <p className="text-sm text-slate-400">
            {height !== null ? `${MINING.initialReward / 2 ** Math.floor((height - 1) / MINING.halvingInterval)} NU per block` : 'zhash 144,5 merged with BTCZ + WTX'}
          </p>
        </div>
        <div className="bg-slate-800/30 rounded-xl p-5 border border-slate-700/50">
          <p className="text-slate-400 text-sm">nuChain status</p>
          <p className="text-2xl font-bold">
            {online === null ? '…' : online ? 'Online' : 'Endpoint unreachable'}
          </p>
          <p className="text-sm text-slate-400">{height !== null ? `Block ${height.toLocaleString()}` : NUCHAIN.evmRpc}</p>
        </div>
        <div className="bg-slate-800/30 rounded-xl p-5 border border-slate-700/50">
          <p className="text-slate-400 text-sm">Connected chains</p>
          <p className="text-2xl font-bold">{BRIDGE_CHAINS.filter((c) => c.status === 'live').length} / {BRIDGE_CHAINS.length}</p>
          <p className="text-sm text-slate-400">Hub and spoke through nuChain</p>
        </div>
        <div className="bg-slate-800/30 rounded-xl p-5 border border-slate-700/50">
          <p className="text-slate-400 text-sm">Solana gateway transfers</p>
          <p className="text-2xl font-bold">{solLocks ?? '–'}</p>
          <p className="text-sm text-slate-400">{short(HUB.solanaGateway)}</p>
        </div>
      </div>

      <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2"><ArrowLeftRight className="w-5 h-5 text-cyan-400" /> WTX, WATT and ALT bridges</h3>
          <button onClick={addToKeplr} className="flex items-center gap-2 px-4 py-2 rounded-md bg-purple-600 hover:bg-purple-500 text-white text-sm">
            <Wallet className="w-4 h-4" /> Add nuChain to Keplr
          </button>
        </div>
        {keplrMsg && <p className="text-sm text-slate-300 mb-3">{keplrMsg}</p>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          {TOKEN_HOMES.map((t) => (
            <div key={t.symbol} className="bg-slate-900/50 rounded-lg p-4">
              <p className="font-semibold">{t.symbol}</p>
              <p className="text-xs text-slate-400">Home: {t.home}</p>
              <p className="text-xs text-slate-500 mt-1">On nuChain: <span className="font-mono">{short(HUB.tokens[t.symbol])}</span></p>
            </div>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-slate-400 text-left">
              <tr><th className="py-2">Chain</th><th>ID</th><th>Status</th><th>Notes</th></tr>
            </thead>
            <tbody>
              {BRIDGE_CHAINS.map((c) => (
                <tr key={c.id} className="border-t border-slate-700/50">
                  <td className="py-2">{c.name}</td>
                  <td className="font-mono text-slate-400">{c.id}</td>
                  <td><span className={`px-2 py-0.5 rounded text-xs ${STATUS_LABEL[c.status].cls}`}>{STATUS_LABEL[c.status].text}</span></td>
                  <td className="text-slate-400">{c.note ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50 text-xs text-slate-400 space-y-1">
        <p>Hub endpoint: <span className="font-mono">{HUB.endpoint}</span></p>
        <p>Hub owner (2-of-2 multisig): <span className="font-mono">{HUB.multisig}</span></p>
        <p>Solana gateway: <span className="font-mono">{HUB.solanaGateway}</span></p>
        <p>Cosmos chain-id {NUCHAIN.cosmosChainId} · EVM chain-id {NUCHAIN.evmChainId} · native {NUCHAIN.nativeSymbol}</p>
        <p>
          <a className="text-cyan-400 inline-flex items-center gap-1" href={NUCHAIN.explorer} target="_blank" rel="noreferrer">
            Bridges in the nuChain explorer <ExternalLink className="w-3 h-3" />
          </a>
        </p>
      </div>
    </div>
  );
};

export default NuChainBridges;
