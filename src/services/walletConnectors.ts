// walletConnectors — external wallet sign-in for the hybrid auth.
//
// EVM injected wallets are discovered via EIP-6963 (the standard every modern
// extension announces itself with), so MetaMask, Rabby, Trust, and any other
// injected wallet show up automatically with their real name + icon — no
// per-wallet hardcoding. Phantom (Solana) is detected via window.solana.
//
// Ledger / Trezor connect through the injected wallet that fronts them
// (MetaMask and Rabby both drive Ledger/Trezor) or through WalletConnect; we
// surface them as hints rather than shipping their heavy native SDKs here.
import { ethers } from 'ethers';

export interface Eip6963ProviderDetail {
  info: { uuid: string; name: string; icon: string; rdns: string };
  provider: any; // EIP-1193
}

export type ConnectorKind = 'evm-injected' | 'solana' | 'cosmos-vidulum';

export interface ConnectResult {
  kind: ConnectorKind;
  walletName: string;
  address: string;
  chainId?: number;
}

// --- EIP-6963 injected EVM discovery ---
const injected: Map<string, Eip6963ProviderDetail> = new Map();

export function startInjectedDiscovery(): void {
  if (typeof window === 'undefined') return;
  window.addEventListener('eip6963:announceProvider', (event: any) => {
    const detail = event.detail as Eip6963ProviderDetail;
    if (detail?.info?.uuid) injected.set(detail.info.rdns || detail.info.uuid, detail);
  });
  window.dispatchEvent(new Event('eip6963:requestProvider'));
}

export function listInjectedWallets(): Eip6963ProviderDetail[] {
  // Fallback: if nothing announced but a legacy window.ethereum exists, expose it.
  if (injected.size === 0 && (window as any).ethereum) {
    return [
      {
        info: { uuid: 'legacy', name: (window as any).ethereum.isRabby ? 'Rabby' : 'Browser Wallet', icon: '', rdns: 'legacy' },
        provider: (window as any).ethereum,
      },
    ];
  }
  return Array.from(injected.values());
}

export async function connectInjected(rdns: string): Promise<ConnectResult> {
  const detail = injected.get(rdns) || listInjectedWallets().find((d) => d.info.rdns === rdns || d.info.uuid === rdns);
  const eip1193 = detail?.provider ?? (window as any).ethereum;
  if (!eip1193) throw new Error('Wallet not found');
  const accounts: string[] = await eip1193.request({ method: 'eth_requestAccounts' });
  const chainIdHex: string = await eip1193.request({ method: 'eth_chainId' });
  return {
    kind: 'evm-injected',
    walletName: detail?.info.name ?? 'Wallet',
    address: ethers.getAddress(accounts[0]),
    chainId: parseInt(chainIdHex, 16),
  };
}

// --- Solana (Phantom / any window.solana) ---
export function hasSolanaWallet(): boolean {
  return typeof window !== 'undefined' && !!(window as any).solana;
}

export async function connectSolana(): Promise<ConnectResult> {
  const sol = (window as any).solana;
  if (!sol) throw new Error('No Solana wallet (Phantom) detected');
  const resp = await sol.connect();
  return {
    kind: 'solana',
    walletName: sol.isPhantom ? 'Phantom' : 'Solana Wallet',
    address: resp.publicKey.toString(),
  };
}

// --- Vidulum browser extension (Keplr-style Cosmos provider) ---
// window.vidulum exposes the Keplr API surface (enable/getKey/getOfflineSigner/
// signAmino/signDirect/experimentalSuggestChain). It is NOT EIP-1193, so it does
// not appear in the EIP-6963 injected list. Connecting = enable(chainId) then
// getKey(chainId); the user approves in the extension popup.
const VIDULUM_CHAIN_ID =
  (import.meta as { env?: Record<string, string> }).env?.VITE_VIDULUM_CHAIN_ID || 'vidulum-1';

export function hasVidulumWallet(): boolean {
  return typeof window !== 'undefined' && !!(window as any).vidulum;
}

export async function connectVidulum(chainId: string = VIDULUM_CHAIN_ID): Promise<ConnectResult> {
  const vdl = (window as any).vidulum;
  if (!vdl) throw new Error('Vidulum extension not detected');
  await vdl.enable(chainId); // user approves in the extension
  const key = await vdl.getKey(chainId);
  return {
    kind: 'cosmos-vidulum',
    walletName: 'Vidulum',
    address: key?.bech32Address ?? key?.address ?? '',
  };
}

/** Names of hardware wallets and how they connect in this build. */
export const HARDWARE_HINTS: { name: string; how: string }[] = [
  { name: 'Ledger', how: 'Connect via MetaMask or Rabby (both drive Ledger), or WalletConnect' },
  { name: 'Trezor', how: 'Connect via MetaMask or Rabby (both drive Trezor)' },
];
