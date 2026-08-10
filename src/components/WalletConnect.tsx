import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Zap, LogOut, User } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';
import { useDeviceDetect } from '../hooks/useDeviceDetect';
import AuthModal from './auth/AuthModal';
import { authService } from '../services/authService';
import type { ConnectResult } from '../services/walletConnectors';

const WalletConnect: React.FC = () => {
  const { isConnected, address, chainId, balance, altBalance, wattBalance, connectWallet, disconnectWallet, switchToAltcoinchain } =
    useWallet();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  // seed-account session (non-custodial Universal Wallet) is separate from an
  // injected EVM wallet connection; either counts as "signed in".
  const [seedSession, setSeedSession] = useState<{ username: string; address: string } | null>(
    authService.getSession() ? { username: authService.getSession()!.username, address: authService.getSession()!.address } : null
  );
  const { isMobile } = useDeviceDetect();

  const formatAddress = (addr: string) => (isMobile ? `${addr.slice(0, 4)}…${addr.slice(-3)}` : `${addr.slice(0, 6)}…${addr.slice(-4)}`);
  const isAltcoinchain = chainId === 2330;
  const signedIn = isConnected || !!seedSession;
  const shownAddress = seedSession?.address ?? address ?? '';

  const onWalletAuth = async (r: ConnectResult) => {
    setShowAuth(false);
    if (r.kind === 'evm-injected') {
      // keep the app's shared EVM provider/state in sync
      try { await connectWallet(); } catch { /* user already approved in the modal */ }
    }
    // Solana / others: the connect result address is shown via seedSession-less path;
    // surface it as the active address for display.
    if (r.kind !== 'evm-injected') setSeedSession({ username: r.walletName, address: r.address });
  };

  const signOut = () => {
    authService.logout();
    setSeedSession(null);
    if (isConnected) disconnectWallet();
    setIsDropdownOpen(false);
  };

  return (
    <div className="relative">
      {!signedIn ? (
        <motion.button
          onClick={() => setShowAuth(true)}
          className={`flex items-center space-x-2 ${isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-2'} bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors font-medium touch-target`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Wallet className="w-4 h-4" />
          <span>{isMobile ? 'Sign in' : 'Sign in'}</span>
        </motion.button>
      ) : (
        <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-3'}`}>
          {isConnected && !isAltcoinchain && (
            <motion.button
              onClick={switchToAltcoinchain}
              className={`flex items-center space-x-2 ${isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'} bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors touch-target`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Zap className="w-4 h-4" />
              <span>{isMobile ? 'ALT' : 'Switch to ALT'}</span>
            </motion.button>
          )}

          <div
            className={`bg-slate-900/50 rounded-lg ${isMobile ? 'px-2 py-1' : 'px-3 py-2'} cursor-pointer hover:bg-slate-800/50 transition-colors touch-target`}
            onClick={() => setIsDropdownOpen((v) => !v)}
          >
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
              <span className={`font-medium ${isMobile ? 'text-sm' : ''}`}>
                {seedSession ? seedSession.username : shownAddress ? formatAddress(shownAddress) : 'Connected'}
              </span>
            </div>
            {isConnected && (
              <div className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-slate-400`}>
                {isAltcoinchain ? (
                  <div className="space-y-1">
                    <div>ALT: {parseFloat(altBalance || '0').toFixed(4)}</div>
                    <div>WATT: {parseFloat(wattBalance || '0').toFixed(4)}</div>
                  </div>
                ) : (
                  <div>{parseFloat(balance || '0').toFixed(4)} ETH</div>
                )}
              </div>
            )}
          </div>

          {isDropdownOpen && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-slate-800 rounded-lg shadow-lg border border-slate-700 z-50">
              <div className="p-3 border-b border-slate-700">
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <User className="w-3 h-3" /> {seedSession ? 'Account' : isAltcoinchain ? 'Altcoinchain' : 'Connected wallet'}
                </p>
                <p className="font-medium truncate">{seedSession ? seedSession.username : shownAddress}</p>
              </div>
              {seedSession && (
                <button
                  onClick={() => { setShowAuth(true); setIsDropdownOpen(false); }}
                  className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-yellow-400"
                >
                  Manage account / back up seed
                </button>
              )}
              <div className="p-3">
                <button onClick={signOut} className="w-full text-left text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 touch-target">
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onSeedAuth={(s) => { setSeedSession(s); setShowAuth(false); }}
          onWalletAuth={onWalletAuth}
        />
      )}
    </div>
  );
};

export default WalletConnect;
