import React, { useCallback, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { Activity, Clock, Users, Coins, Pickaxe, Shield, Fuel, Vote, ArrowLeftRight, ExternalLink, Layers } from 'lucide-react';
import { NUCHAIN, MINING } from '../../config/nuchainBridges';
import { SHIELDED } from '../../config/nuchainShielded';

// Live nuChain overview: everything here is read from the chain (CometBFT RPC,
// Cosmos REST, EVM JSON-RPC) and the bridge API, refreshed every 10 seconds.
const RPC = NUCHAIN.rpc, REST = NUCHAIN.rest, EVM = SHIELDED.rpc;
const BRIDGE = (import.meta.env.VITE_WTX_BRIDGE as string | undefined) || 'https://bridge-nu.wattxchange.app';
const POT = '0x0000000000000000000000000000000000004E55';
const HALVING = 210_000;

type Block = { height: number; time: string; txs: number; proposer: string; hash: string };
type Data = {
  height: number; blockTime: number; validators: number; bondedNU: number; supplyNU: number;
  potNU: number; totalPaidNU: number; claims: number; lastClaimed: number; gasGwei: number;
  proposal?: { id: string; title: string; status: string; end: string; yes: string };
  notes: number; bridge?: { backingWTX: number; wWTXSupply: number; fullyBacked: boolean };
  blocks: Block[];
};

const j = async (u: string) => { const r = await fetch(u); if (!r.ok) throw new Error(`${r.status} ${u}`); return r.json(); };
const fmt = (n: number, d = 0) => n.toLocaleString(undefined, { maximumFractionDigits: d });
const ago = (t: string) => { const s = Math.max(0, Math.round((Date.now() - new Date(t).getTime()) / 1000)); return s < 60 ? `${s}s ago` : `${Math.round(s / 60)}m ago`; };

async function load(): Promise<Data> {
  const evm = new ethers.JsonRpcProvider(EVM, SHIELDED.chainId, { staticNetwork: true });
  const pot = new ethers.Contract(POT, ['function lastClaimedHeight() view returns (uint256)', 'function totalPaid() view returns (uint256)',
    'function claims() view returns (uint256)'], evm);
  const pool = new ethers.Contract(SHIELDED.pool, ['function nextIndex() view returns (uint32)'], evm);
  const status = await j(`${RPC}/status`);
  const height = Number(status.result.sync_info.latest_block_height);
  const [chain, vals, stake, supply, potBal, lastC, paid, claims, gas, props, notes, bridge] = await Promise.all([
    j(`${RPC}/blockchain?minHeight=${Math.max(1, height - 19)}&maxHeight=${height}`),
    j(`${REST}/cosmos/staking/v1beta1/validators?status=BOND_STATUS_BONDED&pagination.limit=200`),
    j(`${REST}/cosmos/staking/v1beta1/pool`),
    j(`${REST}/cosmos/bank/v1beta1/supply/by_denom?denom=${NUCHAIN.nativeDenom}`),
    evm.getBalance(POT), pot.lastClaimedHeight(), pot.totalPaid(), pot.claims(),
    evm.getFeeData(),
    j(`${REST}/cosmos/gov/v1/proposals?pagination.reverse=true&pagination.limit=1`).catch(() => null),
    pool.nextIndex().catch(() => 0),
    j(`${BRIDGE}/status`).catch(() => null),
  ]);
  const metas = chain.result.block_metas as { header: { height: string; time: string; proposer_address: string }; num_txs: string; block_id: { hash: string } }[];
  const times = metas.map((m) => new Date(m.header.time).getTime()).sort((a, b) => a - b);
  const blockTime = times.length > 1 ? (times[times.length - 1] - times[0]) / 1000 / (times.length - 1) : 0;
  const p = props?.proposals?.[0];
  return {
    height, blockTime,
    validators: vals.validators.length,
    bondedNU: Number(ethers.formatEther(stake.pool.bonded_tokens)),
    supplyNU: Number(ethers.formatEther(supply.amount.amount)),
    potNU: Number(ethers.formatEther(potBal)), totalPaidNU: Number(ethers.formatEther(paid)),
    claims: Number(claims), lastClaimed: Number(lastC),
    gasGwei: Number(ethers.formatUnits(gas.gasPrice ?? 0n, 'gwei')),
    proposal: p ? { id: p.id, title: p.title, status: String(p.status).replace('PROPOSAL_STATUS_', '').replace('_', ' ').toLowerCase(),
      end: p.voting_end_time, yes: p.final_tally_result?.yes_count ?? '0' } : undefined,
    notes: Number(notes),
    bridge: bridge ? { backingWTX: bridge.backingWTX, wWTXSupply: bridge.wWTXSupply, fullyBacked: bridge.fullyBacked } : undefined,
    blocks: metas.slice(0, 8).map((m) => ({ height: Number(m.header.height), time: m.header.time, txs: Number(m.num_txs),
      proposer: m.header.proposer_address, hash: m.block_id.hash })),
  };
}

const Card: React.FC<{ icon: React.ElementType; label: string; value: string; sub?: string; color: string }> = ({ icon: Icon, label, value, sub, color }) => (
  <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
    <div className="flex items-center justify-between">
      <span className="text-slate-400 text-sm">{label}</span>
      <Icon className={`w-5 h-5 ${color}`} />
    </div>
    <div className="text-2xl font-bold mt-1 text-white">{value}</div>
    {sub && <div className={`text-xs mt-1 ${color}`}>{sub}</div>}
  </div>
);

const NuChainDashboard: React.FC = () => {
  const [d, setD] = useState<Data | null>(null);
  const [err, setErr] = useState('');
  const refresh = useCallback(() => { load().then((x) => { setD(x); setErr(''); }).catch((e) => setErr((e as Error).message)); }, []);
  useEffect(() => { refresh(); const t = setInterval(refresh, 10000); return () => clearInterval(t); }, [refresh]);

  if (!d) return <div className="text-slate-400 p-6">{err ? `Could not reach nuChain: ${err}` : 'Loading live nuChain data...'}</div>;

  const halvings = Math.floor((d.height - 1) / HALVING);
  const reward = MINING.initialReward / 2 ** halvings;
  const nextHalving = (halvings + 1) * HALVING + 1;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card icon={Activity} label="Block height" value={fmt(d.height)} sub="live" color="text-blue-400" />
        <Card icon={Clock} label="Block time" value={`${d.blockTime.toFixed(2)}s`} sub="average of the last 20 blocks" color="text-purple-400" />
        <Card icon={Users} label="Validators" value={fmt(d.validators)} sub={`${fmt(d.bondedNU, 2)} NU staked`} color="text-emerald-400" />
        <Card icon={Coins} label="NU supply" value={fmt(d.supplyNU)} sub={`of ${fmt(MINING.maxSupply)} max, no pre-mine`} color="text-yellow-400" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card icon={Pickaxe} label="Block reward" value={`${reward} NU`} sub={`halves at block ${fmt(nextHalving)} (${fmt(nextHalving - d.height)} to go)`} color="text-orange-400" />
        <Card icon={Layers} label="Mining pot" value={`${fmt(d.potNU, 2)} NU`} sub={`${fmt(d.claims)} claims, ${fmt(d.totalPaidNU)} NU paid to miners`} color="text-cyan-400" />
        <Card icon={Fuel} label="Gas price" value={d.gasGwei > 0 ? `${fmt(d.gasGwei, 2)} gwei` : 'free'} sub={d.gasGwei > 0 ? 'EIP-1559 base fee' : 'fees switch on with proposal 1'} color="text-pink-400" />
        <Card icon={Shield} label="Private pool" value={`${fmt(d.notes)} notes`} sub="Groth16 shielded notes" color="text-violet-400" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-white">Latest blocks</h3>
            <a className="text-xs text-cyan-400 inline-flex items-center gap-1" href="https://nu-exp.wattxchange.app" target="_blank" rel="noopener noreferrer">Explorer <ExternalLink size={12} /></a>
          </div>
          <div className="space-y-2">
            {d.blocks.map((b) => (
              <a key={b.height} href={`https://nu-exp.wattxchange.app/#/block/${b.height}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between bg-slate-900/50 hover:bg-slate-900 rounded-lg px-3 py-2 text-sm">
                <span className="text-blue-300 font-mono">#{fmt(b.height)}</span>
                <span className="text-slate-500 font-mono hidden md:inline">{b.hash.slice(0, 10)}...</span>
                <span className="text-slate-300">{b.txs} tx</span>
                <span className="text-slate-500">{ago(b.time)}</span>
              </a>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          {d.proposal && (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
              <div className="flex items-center gap-2 font-semibold text-white mb-2"><Vote size={16} className="text-amber-400" /> Governance</div>
              <div className="text-sm text-slate-200">#{d.proposal.id} {d.proposal.title}</div>
              <div className="text-xs text-slate-400 mt-1 capitalize">{d.proposal.status}{d.proposal.status.includes('voting') ? `, ends ${new Date(d.proposal.end).toLocaleString()}` : ''}</div>
            </div>
          )}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
            <div className="flex items-center gap-2 font-semibold text-white mb-2"><ArrowLeftRight size={16} className="text-cyan-400" /> WTX bridge</div>
            {d.bridge ? (
              <div className="text-sm text-slate-300">{d.bridge.backingWTX} WTX held for {d.bridge.wWTXSupply} wWTX
                <span className={d.bridge.fullyBacked ? 'text-emerald-400' : 'text-red-400'}> ({d.bridge.fullyBacked ? 'fully backed' : 'check backing'})</span></div>
            ) : <div className="text-sm text-slate-500">bridge status unavailable</div>}
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 text-sm text-slate-300 space-y-1">
            <div className="font-semibold text-white mb-1">Mining</div>
            <div>zhash (equihash 144,5), merged with BitcoinZ and WATTx</div>
            <div>Last claimed block: {d.lastClaimed ? fmt(d.lastClaimed) : 'none yet'}</div>
            <div className="text-xs text-slate-400">Unclaimed rewards roll over to the next miner.</div>
          </div>
        </div>
      </div>
      {err && <div className="text-xs text-amber-400">Last refresh failed: {err}</div>}
    </div>
  );
};

export default NuChainDashboard;
