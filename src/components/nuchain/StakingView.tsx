import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Shield, Percent, Coins, TrendingUp, ExternalLink } from 'lucide-react';

// nuChain (Cosmos SDK + cosmos/evm) staking page.
// Reads live chain state from the REST API and delegates via Keplr.
// Chain: nuchain_28277-1 (CometBFT ~1s finality). Rewards come from x/mint
// inflation + tx fees, distributed by x/distribution to bonded stake.

const REST =
  (typeof window !== 'undefined' && window.location.hostname.endsWith('wattxchange.app'))
    ? 'https://api-nu.wattxchange.app'
    : 'http://127.0.0.1:1317';

const CHAIN_ID = 'nuchain_28277-1';

interface Validator {
  operator_address: string;
  description: { moniker: string };
  commission: { commission_rates: { rate: string } };
  tokens: string;
  status: string;
  jailed: boolean;
}

const fmt = (raw: string, exp = 18, dp = 2) =>
  (Number(raw) / 10 ** exp).toLocaleString(undefined, { maximumFractionDigits: dp });

const StakingView: React.FC = () => {
  const [validators, setValidators] = useState<Validator[]>([]);
  const [denom, setDenom] = useState('anu');
  const [display, setDisplay] = useState('NU');
  const [inflation, setInflation] = useState(0);
  const [bondedRatio, setBondedRatio] = useState(0);
  const [apr, setApr] = useState(0);
  const [reachable, setReachable] = useState<boolean | null>(null);
  const [addr, setAddr] = useState('');
  const [myDelegations, setMyDelegations] = useState<Record<string, string>>({});
  const [rewards, setRewards] = useState('0');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    try {
      const j = async (p: string) => (await fetch(REST + p)).json();
      const [pool, sparams, mint, infl, vals] = await Promise.all([
        j('/cosmos/staking/v1beta1/pool'),
        j('/cosmos/staking/v1beta1/params'),
        j('/cosmos/mint/v1beta1/params'),
        j('/cosmos/mint/v1beta1/inflation'),
        j('/cosmos/staking/v1beta1/validators?pagination.limit=200&status=BOND_STATUS_BONDED'),
      ]);
      setReachable(true);
      const base = sparams.params.bond_denom;
      setDenom(base);
      setDisplay(base.replace(/^a/, '').toUpperCase() || 'NU');
      const bonded = Number(pool.pool.bonded_tokens);
      const supply = bonded / (mint.params ? 1 : 1); // supply via bonded/ratio below
      const inf = Number(infl.inflation);
      setInflation(inf);
      // bonded ratio from pool vs total supply
      const totalSupply = await j(`/cosmos/bank/v1beta1/supply/by_denom?denom=${base}`)
        .then((s: any) => Number(s.amount?.amount || bonded)).catch(() => bonded);
      const ratio = totalSupply ? bonded / totalSupply : 0;
      setBondedRatio(ratio);
      // staking APR ≈ inflation / bondedRatio (community tax reduces it slightly)
      setApr(ratio > 0 ? (inf / ratio) : inf);
      setValidators((vals.validators || []).sort((a: Validator, b: Validator) => Number(b.tokens) - Number(a.tokens)));
    } catch (e) {
      setReachable(false);
    }
  }, []);

  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, [load]);

  const connectKeplr = async () => {
    const k = (window as any).keplr;
    if (!k) { setBusy('Install the Keplr wallet to stake NU.'); return; }
    try {
      await k.experimentalSuggestChain(await buildKeplrChain());
      await k.enable(CHAIN_ID);
      const signer = k.getOfflineSigner(CHAIN_ID);
      const [acct] = await signer.getAccounts();
      setAddr(acct.address);
      loadMine(acct.address);
    } catch (e: any) { setBusy(e.message); }
  };

  const loadMine = async (a: string) => {
    try {
      const d = await (await fetch(`${REST}/cosmos/staking/v1beta1/delegations/${a}`)).json();
      const m: Record<string, string> = {};
      (d.delegation_responses || []).forEach((r: any) => { m[r.delegation.validator_address] = r.balance.amount; });
      setMyDelegations(m);
      const r = await (await fetch(`${REST}/cosmos/distribution/v1beta1/delegators/${a}/rewards`)).json();
      setRewards(r.total?.[0]?.amount || '0');
    } catch { /* endpoint may be down */ }
  };

  const delegate = async (valoper: string) => {
    const k = (window as any).keplr;
    if (!k || !addr) { await connectKeplr(); return; }
    setBusy(`Delegating to ${valoper.slice(0, 16)}…`);
    try {
      const { SigningStargateClient } = await import('@cosmjs/stargate');
      const signer = k.getOfflineSigner(CHAIN_ID);
      const rpc = REST.replace('api-nu', 'rpc-nu');
      const client = await SigningStargateClient.connectWithSigner(rpc, signer);
      const amt = { denom, amount: String(Math.floor(Number(amount) * 1e18)) };
      await client.delegateTokens(addr, valoper, amt, 'auto', 'nuChain staking via WATTxchange');
      setBusy('Delegated ✓'); loadMine(addr); load();
    } catch (e: any) { setBusy(e.message.slice(0, 140)); }
  };

  const claimAll = async () => {
    const k = (window as any).keplr;
    if (!k || !addr) return;
    setBusy('Claiming rewards…');
    try {
      const { SigningStargateClient } = await import('@cosmjs/stargate');
      const signer = k.getOfflineSigner(CHAIN_ID);
      const client = await SigningStargateClient.connectWithSigner(REST.replace('api-nu', 'rpc-nu'), signer);
      const msgs = Object.keys(myDelegations).map((v) => ({
        typeUrl: '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
        value: { delegatorAddress: addr, validatorAddress: v },
      }));
      await client.signAndBroadcast(addr, msgs, 'auto');
      setBusy('Rewards claimed ✓'); loadMine(addr);
    } catch (e: any) { setBusy(e.message.slice(0, 140)); }
  };

  const totalStaked = Object.values(myDelegations).reduce((s, v) => s + Number(v), 0);

  return (
    <div className="space-y-6">
      {/* headline stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Percent} label="Staking APR" value={reachable ? `${(apr * 100).toFixed(1)}%` : '—'} color="text-emerald-400" />
        <StatCard icon={TrendingUp} label="Inflation" value={reachable ? `${(inflation * 100).toFixed(1)}%` : '—'} color="text-yellow-400" />
        <StatCard icon={Shield} label="Bonded" value={reachable ? `${(bondedRatio * 100).toFixed(0)}%` : '—'} color="text-purple-400" />
        <StatCard icon={Coins} label="Validators" value={reachable ? String(validators.length) : '—'} color="text-blue-400" />
      </div>

      {/* how rewards work */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-sm text-slate-300">
        <p className="font-semibold text-yellow-400 mb-1">How {display} staking rewards are earned</p>
        nuChain is a Cosmos-SDK proof-of-stake chain with ~1-second CometBFT finality. Each block, the{' '}
        <b>x/mint</b> module issues new {display} at the current inflation rate ({(inflation * 100).toFixed(1)}%),
        which rises when less than 67% is bonded and falls when more is — steering the network toward its security
        target. Those coins plus all transaction fees flow to <b>x/distribution</b>, which pays them to bonded
        validators in proportion to stake, minus each validator's commission; delegators earn their validator's
        rewards pro-rata. Rewards accrue every block and can be claimed anytime. Unbonding takes 21 days.
        <span className="block mt-1 text-slate-400">
          This is separate from WATTx's hybrid PoW/PoS + Trust Tiers — nuChain secures itself with BFT stake and
          anchors to WATTx for settlement.
        </span>
      </div>

      {/* wallet / my position */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm text-slate-400">Your position</p>
            {addr ? (
              <p className="text-sm">
                <span className="font-mono text-xs text-slate-300">{addr.slice(0, 14)}…{addr.slice(-6)}</span>
                {' · '}staked <b>{fmt(String(totalStaked))} {display}</b>
                {' · '}rewards <b className="text-emerald-400">{fmt(rewards)} {display}</b>
              </p>
            ) : <p className="text-sm text-slate-400">Connect Keplr to delegate and claim.</p>}
          </div>
          <div className="flex gap-2">
            {addr && Number(rewards) > 0 && (
              <button onClick={claimAll} className="px-3 py-1.5 rounded bg-emerald-500 text-slate-900 text-sm font-semibold">Claim rewards</button>
            )}
            <button onClick={connectKeplr} className="px-3 py-1.5 rounded bg-yellow-500 text-slate-900 text-sm font-semibold">
              {addr ? 'Refresh' : 'Connect Keplr'}
            </button>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`Amount of ${display} to delegate`}
            className="bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-sm w-64" />
          <span className="text-xs text-slate-400">choose a validator below →</span>
        </div>
        {busy && <p className="mt-2 text-xs text-slate-400">{busy}</p>}
      </div>

      {/* validators table */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
          <h3 className="font-semibold">Validators</h3>
          {reachable === false && <span className="text-xs text-red-400">nuChain REST unreachable — api-nu.wattxchange.app</span>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-400 border-b border-slate-700">
                <th className="text-left px-4 py-2">Validator</th>
                <th className="text-right px-4 py-2">Voting power</th>
                <th className="text-right px-4 py-2">Commission</th>
                <th className="text-right px-4 py-2">Your stake</th>
                <th className="text-right px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {validators.map((v) => (
                <tr key={v.operator_address} className="border-b border-slate-800 last:border-0">
                  <td className="px-4 py-2">
                    <span className="font-medium">{v.description.moniker || 'validator'}</span>
                    {v.jailed && <span className="ml-2 text-xs text-red-400">jailed</span>}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">{fmt(v.tokens)} {display}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{(Number(v.commission.commission_rates.rate) * 100).toFixed(1)}%</td>
                  <td className="px-4 py-2 text-right tabular-nums text-emerald-400">
                    {myDelegations[v.operator_address] ? fmt(myDelegations[v.operator_address]) : '—'}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => delegate(v.operator_address)}
                      className="px-2.5 py-1 rounded bg-slate-700 hover:bg-yellow-500 hover:text-slate-900 text-xs font-semibold transition-colors">
                      Delegate
                    </button>
                  </td>
                </tr>
              ))}
              {validators.length === 0 && reachable !== false && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">Loading validators…</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-slate-500 flex items-center gap-1">
        <ExternalLink size={12} /> Explorer: <a className="text-cyan-400" href="https://nu-exp.wattxchange.app">nu-exp.wattxchange.app</a>
        {' · '}Run a validator: bond {display}, keep &gt;95% uptime, set your commission.
      </p>
    </div>
  );
};

const StatCard: React.FC<{ icon: any; label: string; value: string; color: string }> = ({ icon: Icon, label, value, color }) => (
  <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
    <div className="flex items-center justify-between">
      <span className="text-xs uppercase tracking-wide text-slate-400">{label}</span>
      <Icon size={16} className={color} />
    </div>
    <div className={`text-2xl font-bold mt-1 ${color}`}>{value}</div>
  </div>
);

async function buildKeplrChain() {
  return {
    chainId: CHAIN_ID,
    chainName: 'nuChain',
    rpc: 'https://rpc-nu.wattxchange.app',
    rest: REST,
    bip44: { coinType: 60 },
    bech32Config: {
      bech32PrefixAccAddr: 'cosmos', bech32PrefixAccPub: 'cosmospub',
      bech32PrefixValAddr: 'cosmosvaloper', bech32PrefixValPub: 'cosmosvaloperpub',
      bech32PrefixConsAddr: 'cosmosvalcons', bech32PrefixConsPub: 'cosmosvalconspub',
    },
    currencies: [{ coinDenom: 'NU', coinMinimalDenom: 'anu', coinDecimals: 18 }],
    feeCurrencies: [{ coinDenom: 'NU', coinMinimalDenom: 'anu', coinDecimals: 18, gasPriceStep: { low: 0.01, average: 0.025, high: 0.04 } }],
    stakeCurrency: { coinDenom: 'NU', coinMinimalDenom: 'anu', coinDecimals: 18 },
    features: ['eth-address-gen', 'eth-key-sign'],
  };
}

export default StakingView;
