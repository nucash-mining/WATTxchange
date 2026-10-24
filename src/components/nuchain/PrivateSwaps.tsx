import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ethers } from 'ethers';
import { Shield, ArrowLeftRight, Download, Copy, KeyRound, Wallet, AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';
import { SHIELDED, NUCHAIN_ADD_NETWORK } from '../../config/nuchainShielded';
import * as Z from '../../lib/shielded/client';

type Mode = 'deposit' | 'swap' | 'withdraw' | 'notes';
type Asset = 'NU' | 'wWTX';
const EXPLORER_TX = (h: string) => `https://nu-exp.wattxchange.app/#/tx/${h}`;
const STORE_KEY = 'nuchain-private-notes';
const PAIR_ABI = ['function quote(address,uint256) view returns (uint256)', 'function reserve0() view returns (uint112)',
  'function reserve1() view returns (uint112)', 'function token0() view returns (address)'];

function readStore(): string[] { try { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); } catch { return []; } }
function writeStore(v: string[]) { try { localStorage.setItem(STORE_KEY, JSON.stringify(v)); } catch { /* storage blocked */ } }

const download = (note: string) => {
  const blob = new Blob([`nuChain private note (whoever has this can spend it)\n\n${note}\n`], { type: 'text/plain' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `nuchain-note-${Date.now()}.txt`; a.click(); URL.revokeObjectURL(a.href);
};

const NoteBox: React.FC<{ note: string; title: string }> = ({ note, title }) => {
  const [copied, setCopied] = useState(false);
  return (
    <div className="bg-amber-500/10 border border-amber-500/40 rounded-lg p-4 space-y-2">
      <div className="flex items-center gap-2 text-amber-300 font-semibold"><KeyRound size={16} /> {title}</div>
      <p className="text-xs text-amber-200/80">This note is the money. Anyone who has it can spend it, and nobody can recover it if you lose it.</p>
      <code className="block text-xs break-all bg-slate-900/80 p-3 rounded text-slate-200">{note}</code>
      <div className="flex gap-2">
        <button onClick={() => { navigator.clipboard.writeText(note); setCopied(true); }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-sm text-slate-200">
          <Copy size={14} /> {copied ? 'Copied' : 'Copy'}
        </button>
        <button onClick={() => download(note)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-sm text-slate-200">
          <Download size={14} /> Download
        </button>
      </div>
    </div>
  );
};

const PrivateSwaps: React.FC = () => {
  const [mode, setMode] = useState<Mode>('deposit');
  const [account, setAccount] = useState<string>('');
  const [asset, setAsset] = useState<Asset>('NU');
  const [size, setSize] = useState<string>('10');
  const [pending, setPending] = useState<string>('');        // note created, awaiting "I saved it"
  const [saved, setSaved] = useState(false);
  const [noteInput, setNoteInput] = useState('');
  const [recipient, setRecipient] = useState('');
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ note?: string; tx?: string; text?: string } | null>(null);
  const [remember, setRemember] = useState<boolean>(() => readStore().length > 0);
  const [notes, setNotes] = useState<string[]>(() => readStore());
  const [noteStatus, setNoteStatus] = useState<Record<string, boolean>>({});
  const [stats, setStats] = useState<{ deposits: number; price?: string; relayerUp: boolean }>({ deposits: 0, relayerUp: false });
  const [preview, setPreview] = useState<{ text: string; spent?: boolean } | null>(null);

  const keepNote = useCallback((n: string) => {
    setNotes((prev) => { const next = prev.includes(n) ? prev : [n, ...prev]; if (remember) writeStore(next); return next; });
  }, [remember]);
  useEffect(() => { if (remember) writeStore(notes); else writeStore([]); }, [remember, notes]);

  // live stats: deposits in the pool, wWTX price, relayer health
  const loadStats = useCallback(async () => {
    try {
      const p = Z.provider();
      const pair = new ethers.Contract(SHIELDED.pair, PAIR_ABI, p);
      const [leaves, r0, r1, t0] = await Promise.all([Z.fetchLeaves(), pair.reserve0(), pair.reserve1(), pair.token0()]);
      let price: string | undefined;
      if (r0 > 0n && r1 > 0n) {
        const [wwtxR, nuR] = ethers.getAddress(t0) === ethers.getAddress(SHIELDED.wwtx) ? [r0, r1] : [r1, r0];
        price = (Number(ethers.formatEther(nuR)) / Number(ethers.formatUnits(wwtxR, 8))).toFixed(4);
      }
      let relayerUp = false; try { await Z.relayerInfo(); relayerUp = true; } catch { /* down */ }
      setStats({ deposits: leaves.length, price, relayerUp });
    } catch { /* RPC hiccup: keep last stats */ }
  }, []);
  useEffect(() => { loadStats(); const t = setInterval(loadStats, 30000); return () => clearInterval(t); }, [loadStats]);

  // preview a pasted note
  useEffect(() => {
    if (!noteInput.trim()) { setPreview(null); return; }
    try {
      const n = Z.decodeNote(noteInput);
      const text = `${Z.fmtAmount(n.token, n.amount)} ${Z.symbolOf(n.token)}`;
      setPreview({ text });
      const pool = new ethers.Contract(SHIELDED.pool, Z.POOL_ABI, Z.provider());
      pool.nullifierSpent(Z.nullifierOf(n)).then((spent: boolean) => setPreview({ text, spent })).catch(() => {});
    } catch (e) { setPreview({ text: (e as Error).message }); }
  }, [noteInput]);

  const reset = () => { setError(''); setStatus(''); setResult(null); };

  async function connect(): Promise<ethers.JsonRpcSigner> {
    const eth = (window as unknown as { ethereum?: ethers.Eip1193Provider & { request: (a: { method: string; params?: unknown[] }) => Promise<unknown> } }).ethereum;
    if (!eth) throw new Error('No browser wallet found (install MetaMask or similar)');
    try { await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: NUCHAIN_ADD_NETWORK.chainId }] }); }
    catch { await eth.request({ method: 'wallet_addEthereumChain', params: [NUCHAIN_ADD_NETWORK] }); }
    const bp = new ethers.BrowserProvider(eth);
    const signer = await bp.getSigner();
    setAccount(await signer.getAddress());
    return signer;
  }

  // ------------------------------------------------------------ deposit
  const createNote = () => {
    reset();
    const token = asset === 'NU' ? SHIELDED.wnu : SHIELDED.wwtx;
    const amount = ethers.parseUnits(size, SHIELDED.decimals[asset]);
    const n = Z.newNote(token, amount);
    setPending(Z.encodeNote(n)); setSaved(false);
  };
  const doDeposit = async () => {
    reset(); setBusy(true);
    try {
      const n = Z.decodeNote(pending);
      keepNote(pending);
      const signer = await connect();
      const pool = new ethers.Contract(SHIELDED.pool, Z.POOL_ABI, signer);
      if (asset === 'NU') {
        setStatus('Confirm the deposit in your wallet...');
        const tx = await pool.depositNative(n.ownerHash, { value: n.amount });
        setStatus('Waiting for nuChain...'); await tx.wait();
        setResult({ tx: tx.hash, text: `Deposited ${size} NU into the private pool.` });
      } else {
        const t = new ethers.Contract(SHIELDED.wwtx, ['function approve(address,uint256) returns (bool)'], signer);
        setStatus('Approve wWTX in your wallet...'); await (await t.approve(SHIELDED.pool, n.amount)).wait();
        setStatus('Confirm the deposit in your wallet...');
        const tx = await pool.deposit(SHIELDED.wwtx, n.amount, n.ownerHash);
        setStatus('Waiting for nuChain...'); await tx.wait();
        setResult({ tx: tx.hash, text: `Deposited ${size} wWTX into the private pool.` });
      }
      setPending(''); setStatus(''); loadStats();
    } catch (e) { setError((e as { shortMessage?: string }).shortMessage || (e as Error).message); setStatus(''); }
    setBusy(false);
  };

  // --------------------------------------------------------------- swap
  const doSwap = async () => {
    reset(); setBusy(true);
    try {
      const note = Z.decodeNote(noteInput);
      const { relayer } = await Z.relayerInfo();
      const tokenOut = Z.symbolOf(note.token) === 'NU' ? SHIELDED.wwtx : SHIELDED.wnu;
      const fee = Z.relayerFee(note.amount);
      const pair = new ethers.Contract(SHIELDED.pair, PAIR_ABI, Z.provider());
      const quoted: bigint = await pair.quote(note.token, note.amount - fee);
      const minOut = (quoted * 99n) / 100n;                                   // 1% slippage
      const owner = Z.newOwner();
      setStatus('Reading the pool...'); const leaves = await Z.fetchLeaves();
      setStatus('Generating the zero-knowledge proof in your browser (about 10-40 s)...');
      const pr = await Z.prove(note, leaves, Z.swapExt(minOut, owner.ownerHash, relayer, fee));
      setStatus('Relayer is submitting the private swap...');
      const r = await Z.relay('swap', [pr.proof, pr.root, pr.nullifierHash, SHIELDED.pair, note.token, note.amount, minOut, owner.ownerHash, relayer, fee]);
      setStatus('Finding your new note...');
      const out = (await Z.fetchLeaves()).find((l) => l.ownerHash === owner.ownerHash);
      if (!out) throw new Error(`Swap went through (${r.txHash}) but the output note was not found yet; refresh in a moment`);
      const nn = Z.encodeNote(Z.noteFrom(out.token, out.amount, owner.secret, owner.salt));
      keepNote(nn);
      setResult({ tx: r.txHash, note: nn, text: `Swapped privately into ${Z.fmtAmount(out.token, out.amount)} ${Z.symbolOf(tokenOut)}. Your old note is now spent.` });
      setNoteInput(''); setStatus(''); loadStats();
    } catch (e) { setError((e as Error).message); setStatus(''); }
    setBusy(false);
  };

  // ----------------------------------------------------------- withdraw
  const doWithdraw = async () => {
    reset(); setBusy(true);
    try {
      const note = Z.decodeNote(noteInput);
      const to = ethers.getAddress(recipient.trim());
      const { relayer } = await Z.relayerInfo();
      const fee = Z.relayerFee(note.amount);
      const unwrap = Z.symbolOf(note.token) === 'NU';
      setStatus('Reading the pool...'); const leaves = await Z.fetchLeaves();
      setStatus('Generating the zero-knowledge proof in your browser (about 10-40 s)...');
      const pr = await Z.prove(note, leaves, Z.withdrawExt(to, relayer, fee, unwrap));
      setStatus('Relayer is submitting the withdrawal...');
      const r = await Z.relay('withdraw', [pr.proof, pr.root, pr.nullifierHash, note.token, note.amount, to, relayer, fee, unwrap]);
      setResult({ tx: r.txHash, text: `Sent ${Z.fmtAmount(note.token, note.amount - fee)} ${Z.symbolOf(note.token)} to ${to}. Nothing links it to your deposit.` });
      setNoteInput(''); setStatus('');
    } catch (e) { setError((e as Error).message); setStatus(''); }
    setBusy(false);
  };

  const refreshNotes = async () => {
    const pool = new ethers.Contract(SHIELDED.pool, Z.POOL_ABI, Z.provider());
    const st: Record<string, boolean> = {};
    for (const n of notes) { try { st[n] = await pool.nullifierSpent(Z.nullifierOf(Z.decodeNote(n))); } catch { /* skip */ } }
    setNoteStatus(st);
  };
  useEffect(() => { if (mode === 'notes') refreshNotes(); }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const tabBtn = (m: Mode, label: string) => (
    <button key={m} onClick={() => { setMode(m); reset(); }}
      className={`px-4 py-2 rounded-md text-sm transition-colors ${mode === m ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}>
      {label}
    </button>
  );
  const sizes = useMemo(() => SHIELDED.sizes[asset], [asset]);

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <Shield className="text-purple-400 mt-1" size={28} />
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white">Private Swaps</h2>
            <p className="text-slate-300 text-sm mt-1">
              Deposit NU or wWTX into nuChain's shielded pool and get a secret note. Later, swap or withdraw it with a
              zero-knowledge proof made in your browser: it proves you own one of the notes without revealing which.
              A relayer submits the transaction and pays the gas, so the receiving address never needs NU.
            </p>
            <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-400">
              <span>Notes in pool: <b className="text-slate-200">{stats.deposits}</b></span>
              <span>1 wWTX = <b className="text-slate-200">{stats.price ? `${stats.price} NU` : 'no liquidity yet'}</b></span>
              <span>Relayer: <b className={stats.relayerUp ? 'text-emerald-400' : 'text-red-400'}>{stats.relayerUp ? 'online' : 'offline'}</b> (fee 0.3%)</span>
              <a className="text-cyan-400 inline-flex items-center gap-1" href={`https://nu-exp.wattxchange.app/#/address/${SHIELDED.pool}`} target="_blank" rel="noopener noreferrer">
                Pool contract <ExternalLink size={12} /></a>
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-xs text-amber-200">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <span>Beta. The zk setup was generated by a single party and will be redone as a multi-party ceremony; keep amounts small.
            Privacy grows with the number of notes in the pool, and swap output amounts are public.</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 bg-slate-800/50 rounded-lg p-1 w-fit">
        {tabBtn('deposit', 'Deposit')}{tabBtn('swap', 'Private swap')}{tabBtn('withdraw', 'Withdraw')}{tabBtn('notes', `My notes (${notes.length})`)}
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 space-y-4">
        {mode === 'deposit' && (<>
          <div className="flex gap-2">
            {(['NU', 'wWTX'] as Asset[]).map((a) => (
              <button key={a} onClick={() => { setAsset(a); setSize(SHIELDED.sizes[a][1]); setPending(''); }}
                className={`px-4 py-2 rounded-md text-sm ${asset === a ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-slate-300'}`}>{a}</button>
            ))}
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-2">Deposit size (fixed sizes keep every note identical)</div>
            <div className="flex flex-wrap gap-2">
              {sizes.map((s) => (
                <button key={s} onClick={() => { setSize(s); setPending(''); }}
                  className={`px-4 py-2 rounded-md text-sm ${size === s ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-300'}`}>{s} {asset}</button>
              ))}
            </div>
          </div>
          {!pending ? (
            <div className="space-y-2">
              <button onClick={createNote} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium">
                <Wallet size={16} /> Deposit {size} {asset}
              </button>
              <div className="text-xs text-slate-400">Step 1 of 2: this creates your secret note. You save it, then confirm the deposit in your wallet.</div>
            </div>
          ) : (<>
            <div className="text-xs text-slate-400">Step 2 of 2: save the note, then confirm the deposit.</div>
            <NoteBox note={pending} title="Save this note before depositing" />
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} /> I saved my note somewhere safe
            </label>
            <button disabled={!saved || busy} onClick={doDeposit}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-medium">
              <Wallet size={16} /> {account ? `Deposit ${size} ${asset}` : `Connect wallet and deposit ${size} ${asset}`}
            </button>
          </>)}
        </>)}

        {(mode === 'swap' || mode === 'withdraw') && (<>
          <div>
            <div className="text-xs text-slate-400 mb-1">Your note</div>
            <textarea value={noteInput} onChange={(e) => setNoteInput(e.target.value)} rows={3} placeholder="nunote-0x..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 font-mono" />
            {preview && <div className={`text-xs mt-1 ${preview.spent ? 'text-red-400' : 'text-slate-400'}`}>
              {preview.text}{preview.spent === true ? ' (already spent)' : preview.spent === false ? ' (unspent)' : ''}</div>}
            {notes.length > 0 && (
              <select onChange={(e) => e.target.value && setNoteInput(e.target.value)} value=""
                className="mt-2 bg-slate-900 border border-slate-700 rounded-md p-2 text-xs text-slate-300">
                <option value="">...or pick one of your saved notes</option>
                {notes.map((n) => { try { const d = Z.decodeNote(n); return <option key={n} value={n}>{Z.fmtAmount(d.token, d.amount)} {Z.symbolOf(d.token)} ({n.slice(-8)})</option>; } catch { return null; } })}
              </select>
            )}
          </div>
          {mode === 'withdraw' && (
            <div>
              <div className="text-xs text-slate-400 mb-1">Send to (use a fresh address for best privacy)</div>
              <input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="0x..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 font-mono" />
            </div>
          )}
          <button disabled={busy || !noteInput || preview?.spent === true || (mode === 'withdraw' && !recipient)}
            onClick={mode === 'swap' ? doSwap : doWithdraw}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-medium">
            {mode === 'swap' ? <><ArrowLeftRight size={16} /> Swap privately (NU and wWTX)</> : <><Shield size={16} /> Withdraw privately</>}
          </button>
          {mode === 'swap' && !stats.price && <div className="text-xs text-amber-300">The wWTX/NU pool has no liquidity yet, so swaps will fail until it is seeded.</div>}
        </>)}

        {mode === 'notes' && (<>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            Remember my notes in this browser (anyone with access to this browser could spend them)
          </label>
          <button onClick={refreshNotes} className="flex items-center gap-1 text-xs text-cyan-400"><RefreshCw size={12} /> Refresh status</button>
          {notes.length === 0 ? <div className="text-sm text-slate-400">No notes in this session.</div> : (
            <div className="space-y-2">
              {notes.map((n) => { try { const d = Z.decodeNote(n); return (
                <div key={n} className="flex items-center justify-between gap-3 bg-slate-900/70 rounded-lg p-3">
                  <div className="text-sm text-slate-200">{Z.fmtAmount(d.token, d.amount)} {Z.symbolOf(d.token)}
                    <span className={`ml-2 text-xs ${noteStatus[n] ? 'text-slate-500' : 'text-emerald-400'}`}>{n in noteStatus ? (noteStatus[n] ? 'spent' : 'unspent') : ''}</span></div>
                  <div className="flex gap-2">
                    <button onClick={() => navigator.clipboard.writeText(n)} className="text-xs text-slate-300 hover:text-white"><Copy size={14} /></button>
                    <button onClick={() => download(n)} className="text-xs text-slate-300 hover:text-white"><Download size={14} /></button>
                    <button onClick={() => setNotes(notes.filter((x) => x !== n))} className="text-xs text-red-400">remove</button>
                  </div>
                </div>); } catch { return null; } })}
            </div>
          )}
        </>)}

        {status && <div className="text-sm text-cyan-300 animate-pulse">{status}</div>}
        {error && <div className="text-sm text-red-400 break-words">{error}</div>}
        {result && (
          <div className="space-y-3">
            {result.text && <div className="text-sm text-emerald-400">{result.text}</div>}
            {result.tx && <a className="text-xs text-cyan-400 inline-flex items-center gap-1" href={EXPLORER_TX(result.tx)} target="_blank" rel="noopener noreferrer">
              View transaction <ExternalLink size={12} /></a>}
            {result.note && <NoteBox note={result.note} title="Your new note" />}
          </div>
        )}
      </div>
    </div>
  );
};

export default PrivateSwaps;
