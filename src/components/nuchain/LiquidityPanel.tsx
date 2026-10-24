import React, { useCallback, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { Droplets, Wallet } from 'lucide-react';
import { SHIELDED } from '../../config/nuchainShielded';
import { connectNuChain } from '../../lib/shielded/wallet';

// Add liquidity to the wWTX/NU pool (NuSwapPair). Native NU is wrapped to WNU in
// the same flow. With an empty pool, the amounts you enter set the starting price.
const PAIR_ABI = [
  'function token0() view returns (address)', 'function reserve0() view returns (uint112)', 'function reserve1() view returns (uint112)',
  'function totalSupply() view returns (uint256)', 'function balanceOf(address) view returns (uint256)',
  'function addLiquidity(uint256,uint256,uint256,address) returns (uint256)',
  'function removeLiquidity(uint256,uint256,uint256,address) returns (uint256,uint256)',
];
const ERC20 = ['function approve(address,uint256) returns (bool)', 'function allowance(address,address) view returns (uint256)',
  'function balanceOf(address) view returns (uint256)'];

const LiquidityPanel: React.FC = () => {
  const [res, setRes] = useState<{ wwtx: bigint; nu: bigint; wwtxIs0: boolean } | null>(null);
  const [wAmt, setWAmt] = useState(''); const [nAmt, setNAmt] = useState('');
  const [msg, setMsg] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const [lp, setLp] = useState<string>('');

  const load = useCallback(async () => {
    const p = new ethers.JsonRpcProvider(SHIELDED.rpc, SHIELDED.chainId, { staticNetwork: true });
    const pair = new ethers.Contract(SHIELDED.pair, PAIR_ABI, p);
    const [t0, r0, r1] = await Promise.all([pair.token0(), pair.reserve0(), pair.reserve1()]);
    const wwtxIs0 = ethers.getAddress(t0) === ethers.getAddress(SHIELDED.wwtx);
    setRes({ wwtx: wwtxIs0 ? r0 : r1, nu: wwtxIs0 ? r1 : r0, wwtxIs0 });
  }, []);
  useEffect(() => { load().catch(() => {}); }, [load]);

  const empty = !res || res.wwtx === 0n;
  const price = res && !empty ? Number(ethers.formatEther(res.nu)) / Number(ethers.formatUnits(res.wwtx, 8)) : null;

  // keep the ratio when the pool already has liquidity
  const onW = (v: string) => { setWAmt(v); if (price && v && !isNaN(Number(v))) setNAmt((Number(v) * price).toFixed(6)); };
  const onN = (v: string) => { setNAmt(v); if (price && v && !isNaN(Number(v))) setWAmt((Number(v) / price).toFixed(8)); };

  const add = async () => {
    setErr(''); setMsg(''); setBusy(true);
    try {
      const signer = await connectNuChain(); const me = await signer.getAddress();
      const w = ethers.parseUnits(wAmt, 8), n = ethers.parseEther(nAmt);
      const wwtx = new ethers.Contract(SHIELDED.wwtx, ERC20, signer);
      const wnu = new ethers.Contract(SHIELDED.wnu, [...ERC20, 'function deposit() payable'], signer);
      if ((await wwtx.balanceOf(me)) < w) throw new Error('Not enough wWTX in this wallet (bridge WTX first)');
      const haveWnu: bigint = await wnu.balanceOf(me);
      if (haveWnu < n) { setMsg('Wrapping NU (confirm in wallet)...'); await (await wnu.deposit({ value: n - haveWnu })).wait(); }
      if ((await wwtx.allowance(me, SHIELDED.pair)) < w) { setMsg('Approve wWTX (confirm in wallet)...'); await (await wwtx.approve(SHIELDED.pair, w)).wait(); }
      if ((await wnu.allowance(me, SHIELDED.pair)) < n) { setMsg('Approve WNU (confirm in wallet)...'); await (await wnu.approve(SHIELDED.pair, n)).wait(); }
      const pair = new ethers.Contract(SHIELDED.pair, PAIR_ABI, signer);
      const [a0, a1] = res?.wwtxIs0 !== false ? [w, n] : [n, w];
      setMsg('Adding liquidity (confirm in wallet)...');
      await (await pair.addLiquidity(a0, a1, 0, me)).wait();
      setLp(ethers.formatEther(await pair.balanceOf(me)));
      setMsg(`Added ${wAmt} wWTX and ${nAmt} NU to the pool.`);
      await load();
    } catch (e) { setErr((e as { shortMessage?: string }).shortMessage || (e as Error).message); setMsg(''); }
    setBusy(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-white font-semibold"><Droplets size={18} className="text-cyan-400" /> wWTX / NU pool</div>
      <div className="text-sm text-slate-300">
        {empty ? 'The pool is empty. The first deposit sets the starting price: the ratio of NU to wWTX you add is the price of 1 wWTX in NU.'
          : `Pool: ${ethers.formatUnits(res!.wwtx, 8)} wWTX and ${ethers.formatEther(res!.nu)} NU (1 wWTX = ${price!.toFixed(4)} NU). Amounts are kept at the current ratio.`}
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-slate-400 mb-1">wWTX</div>
          <input value={wAmt} onChange={(e) => onW(e.target.value)} placeholder="100"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-200" />
        </div>
        <div>
          <div className="text-xs text-slate-400 mb-1">NU</div>
          <input value={nAmt} onChange={(e) => onN(e.target.value)} placeholder="1000"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-200" />
        </div>
      </div>
      {empty && wAmt && nAmt && Number(wAmt) > 0 && <div className="text-xs text-amber-300">Starting price: 1 wWTX = {(Number(nAmt) / Number(wAmt)).toFixed(4)} NU</div>}
      <button disabled={!wAmt || !nAmt || busy} onClick={add}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-medium">
        <Wallet size={16} /> Add liquidity
      </button>
      {lp && <div className="text-xs text-slate-400">Your LP tokens: {lp}</div>}
      {msg && <div className="text-sm text-emerald-400">{msg}</div>}
      {err && <div className="text-sm text-red-400 break-words">{err}</div>}
    </div>
  );
};

export default LiquidityPanel;
