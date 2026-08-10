// AuthModal — GleecDEX-style hybrid sign-in.
//   Account (seed): Sign in / Create / Import, with a forced seed-backup step.
//   Connect wallet: EIP-6963 injected (MetaMask/Rabby/Trust…), Phantom, hardware.
import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff, Copy, ShieldCheck, KeyRound, Wallet, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../../services/authService';
import {
  startInjectedDiscovery,
  listInjectedWallets,
  connectInjected,
  hasSolanaWallet,
  connectSolana,
  HARDWARE_HINTS,
  type ConnectResult,
} from '../../services/walletConnectors';

type Tab = 'signin' | 'create' | 'import' | 'connect';

interface Props {
  onClose: () => void;
  onSeedAuth: (session: { username: string; address: string }) => void;
  onWalletAuth: (result: ConnectResult) => void;
}

const input =
  'w-full px-3 py-2 rounded-lg bg-slate-900/70 border border-slate-700 focus:border-yellow-500 outline-none text-sm';
const primaryBtn =
  'w-full px-4 py-2.5 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-slate-900 font-medium disabled:opacity-40';

const AuthModal: React.FC<Props> = ({ onClose, onSeedAuth, onWalletAuth }) => {
  const [tab, setTab] = useState<Tab>(() => (authService.lastUsername() ? 'signin' : 'create'));
  const [username, setUsername] = useState(authService.lastUsername() ?? '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [seedInput, setSeedInput] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [backup, setBackup] = useState<{ mnemonic: string; username: string; address: string } | null>(null);
  const [ackBackup, setAckBackup] = useState(false);

  const [injectedWallets, setInjectedWallets] = useState(listInjectedWallets());
  useEffect(() => {
    startInjectedDiscovery();
    const t = setInterval(() => setInjectedWallets(listInjectedWallets()), 800);
    return () => clearInterval(t);
  }, []);

  const accounts = useMemo(() => authService.listAccounts(), []);

  const doCreate = async () => {
    if (password !== confirm) return toast.error('Passwords do not match');
    setBusy(true);
    try {
      const { mnemonic, address } = await authService.createAccount(username, password);
      setBackup({ mnemonic, username: username.trim().toLowerCase(), address });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const doSignin = async () => {
    setBusy(true);
    try {
      const s = await authService.login(username, password);
      toast.success(`Signed in as ${s.username}`);
      onSeedAuth({ username: s.username, address: s.address });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const doImport = async () => {
    setBusy(true);
    try {
      const save = username.trim() && password ? { username, password } : undefined;
      const { address } = await authService.importSeed(seedInput, save);
      toast.success('Seed imported');
      onSeedAuth({ username: username.trim().toLowerCase() || 'imported', address });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const finishBackup = () => {
    if (!backup) return;
    toast.success(`Account created — signed in as ${backup.username}`);
    onSeedAuth({ username: backup.username, address: backup.address });
  };

  const doConnect = async (fn: () => Promise<ConnectResult>) => {
    setBusy(true);
    try {
      const r = await fn();
      toast.success(`Connected ${r.walletName}`);
      onWalletAuth(r);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-md rounded-2xl bg-slate-800 border border-slate-700 shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <h2 className="font-semibold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-yellow-500" /> Sign in to WATTxchange
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Seed-backup gate (after create) */}
        <AnimatePresence>
          {backup ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-5 space-y-4">
              <div className="flex items-start gap-2 text-amber-400 text-sm">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>Write these 12 words down and keep them offline. They are the ONLY way to recover this account — no one can reset them for you.</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {backup.mnemonic.split(' ').map((w, i) => (
                  <div key={i} className="px-2 py-1.5 rounded-md bg-slate-900/70 border border-slate-700 text-sm">
                    <span className="text-slate-500 mr-1">{i + 1}.</span>
                    {w}
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(backup.mnemonic);
                  toast.success('Copied — store it somewhere safe');
                }}
                className="text-xs text-slate-300 hover:text-yellow-400 flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" /> Copy seed phrase
              </button>
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" checked={ackBackup} onChange={(e) => setAckBackup(e.target.checked)} />
                I have backed up my seed phrase
              </label>
              <button className={primaryBtn} disabled={!ackBackup} onClick={finishBackup}>
                Continue
              </button>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* tabs */}
              <div className="flex px-5 pt-4 gap-1 text-sm">
                {(['signin', 'create', 'import', 'connect'] as Tab[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`px-3 py-1.5 rounded-lg capitalize ${
                      tab === t ? 'bg-yellow-500/15 text-yellow-400' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t === 'signin' ? 'Sign in' : t === 'connect' ? 'Connect' : t}
                  </button>
                ))}
              </div>

              <div className="p-5 space-y-3">
                {tab !== 'connect' && (
                  <>
                    {tab === 'import' && (
                      <textarea
                        className={input + ' h-20 resize-none font-mono'}
                        placeholder="Enter your 12/24-word seed phrase"
                        value={seedInput}
                        onChange={(e) => setSeedInput(e.target.value)}
                      />
                    )}
                    <input
                      className={input}
                      placeholder={tab === 'import' ? 'Username (optional — to save on this device)' : 'Username'}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoComplete="username"
                      list={tab === 'signin' ? 'wattx-accounts' : undefined}
                    />
                    {tab === 'signin' && (
                      <datalist id="wattx-accounts">
                        {accounts.map((a) => (
                          <option key={a} value={a} />
                        ))}
                      </datalist>
                    )}
                    <div className="relative">
                      <input
                        className={input + ' pr-10'}
                        type={showPw ? 'text' : 'password'}
                        placeholder={tab === 'import' ? 'Password (optional — to save)' : 'Password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((v) => !v)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                      >
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {tab === 'create' && (
                      <input
                        className={input}
                        type={showPw ? 'text' : 'password'}
                        placeholder="Confirm password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        autoComplete="new-password"
                      />
                    )}

                    {tab === 'signin' && (
                      <button className={primaryBtn} disabled={busy} onClick={doSignin}>
                        <KeyRound className="w-4 h-4 inline mr-1" /> Sign in
                      </button>
                    )}
                    {tab === 'create' && (
                      <button className={primaryBtn} disabled={busy} onClick={doCreate}>
                        Create account
                      </button>
                    )}
                    {tab === 'import' && (
                      <button className={primaryBtn} disabled={busy} onClick={doImport}>
                        Import seed
                      </button>
                    )}
                    <p className="text-[11px] text-slate-500">
                      Non-custodial: your seed is encrypted with your password and never leaves this browser.
                    </p>
                  </>
                )}

                {tab === 'connect' && (
                  <div className="space-y-2">
                    {injectedWallets.length === 0 && !hasSolanaWallet() && (
                      <p className="text-sm text-slate-400">
                        No wallet extensions detected. Install MetaMask, Rabby, Trust, or Phantom.
                      </p>
                    )}
                    {injectedWallets.map((w) => (
                      <button
                        key={w.info.rdns}
                        disabled={busy}
                        onClick={() => doConnect(() => connectInjected(w.info.rdns))}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-900/70 border border-slate-700 hover:border-yellow-500"
                      >
                        {w.info.icon ? (
                          <img src={w.info.icon} alt="" className="w-6 h-6 rounded" />
                        ) : (
                          <Wallet className="w-6 h-6 text-yellow-500" />
                        )}
                        <span className="text-sm">{w.info.name}</span>
                      </button>
                    ))}
                    {hasSolanaWallet() && (
                      <button
                        disabled={busy}
                        onClick={() => doConnect(connectSolana)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-900/70 border border-slate-700 hover:border-yellow-500"
                      >
                        <Wallet className="w-6 h-6 text-purple-400" />
                        <span className="text-sm">Phantom (Solana)</span>
                      </button>
                    )}
                    <div className="pt-2 border-t border-slate-700 mt-2">
                      {HARDWARE_HINTS.map((h) => (
                        <p key={h.name} className="text-[11px] text-slate-500">
                          <span className="text-slate-300">{h.name}:</span> {h.how}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default AuthModal;
