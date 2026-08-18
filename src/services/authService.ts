// authService — GleecDEX-style hybrid, non-custodial auth.
//
// Two ways in:
//   1. Account (seed): username + password. A BIP39 mnemonic is generated (or
//      imported), encrypted client-side with the password (PBKDF2 → AES-GCM),
//      and stored in localStorage. The password never leaves the browser and
//      the plaintext seed is only ever held in memory. Users are prompted to
//      back the seed up on creation and can reveal it later with their password.
//   2. Connect wallet: an external signer (handled by walletConnectors.ts).
//
// This service owns ONLY the seed-vault half. On unlock it hands the decrypted
// mnemonic to walletService so the rest of the app (address derivation, kdf
// passphrase, etc.) works exactly as before.
import { ethers } from 'ethers';
import { walletService } from './walletService';

const VAULT_PREFIX = 'wattx.vault.'; // one entry per username
const SESSION_KEY = 'wattx.session'; // last-signed-in username (not the seed)
const PBKDF2_ITERATIONS = 210_000;

interface VaultBlob {
  v: 1;
  username: string;
  createdAt: string;
  kdf: { salt: string; iterations: number };
  iv: string;
  ciphertext: string; // AES-GCM of the mnemonic (UTF-8)
}

export interface AuthSession {
  method: 'seed';
  username: string;
  /** primary EVM address derived from the seed */
  address: string;
}

const enc = new TextEncoder();
const dec = new TextDecoder();
const b64 = (buf: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(buf as ArrayBuffer)));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function deriveKey(password: string, salt: Uint8Array, iterations: number): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

class AuthService {
  private session: AuthSession | null = null;

  /** Usernames that have an encrypted vault on this device. */
  listAccounts(): string[] {
    const out: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(VAULT_PREFIX)) out.push(k.slice(VAULT_PREFIX.length));
    }
    return out;
  }

  hasAccount(username: string): boolean {
    return !!localStorage.getItem(VAULT_PREFIX + username.toLowerCase());
  }

  getSession(): AuthSession | null {
    return this.session;
  }

  lastUsername(): string | null {
    return localStorage.getItem(SESSION_KEY);
  }

  /** Create a brand-new account with a freshly generated seed. Returns the
   *  mnemonic so the UI can force a backup step. */
  async createAccount(username: string, password: string): Promise<{ mnemonic: string; address: string }> {
    username = username.trim().toLowerCase();
    if (!username) throw new Error('Choose a username');
    if (this.hasAccount(username)) throw new Error('That username already exists on this device');
    if (password.length < 8) throw new Error('Password must be at least 8 characters');
    const mnemonic = ethers.Mnemonic.fromEntropy(ethers.randomBytes(16)).phrase; // 12 words
    const address = await this.persist(username, password, mnemonic);
    return { mnemonic, address };
  }

  /** Import an existing seed and optionally save it under a username/password. */
  async importSeed(
    mnemonic: string,
    opts?: { username?: string; password?: string }
  ): Promise<{ address: string }> {
    mnemonic = mnemonic.trim().replace(/\s+/g, ' ');
    if (!ethers.Mnemonic.isValidMnemonic(mnemonic)) throw new Error('Invalid seed phrase');
    if (opts?.username && opts?.password) {
      const address = await this.persist(opts.username.trim().toLowerCase(), opts.password, mnemonic);
      return { address };
    }
    // ephemeral (not saved) — just unlock this session
    const address = await this.unlockWithMnemonic(opts?.username?.trim().toLowerCase() || 'imported', mnemonic);
    return { address };
  }

  /** Sign in to a saved account. */
  async login(username: string, password: string): Promise<AuthSession> {
    username = username.trim().toLowerCase();
    const raw = localStorage.getItem(VAULT_PREFIX + username);
    if (!raw) throw new Error('No account with that username on this device');
    const vault = JSON.parse(raw) as VaultBlob;
    let mnemonic: string;
    try {
      const key = await deriveKey(password, unb64(vault.kdf.salt), vault.kdf.iterations);
      const pt = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: unb64(vault.iv) },
        key,
        unb64(vault.ciphertext)
      );
      mnemonic = dec.decode(pt);
    } catch {
      throw new Error('Wrong password');
    }
    await this.unlockWithMnemonic(username, mnemonic);
    return this.session!;
  }

  /** Reveal the seed for backup — requires the password again. */
  async revealSeed(username: string, password: string): Promise<string> {
    username = username.trim().toLowerCase();
    const raw = localStorage.getItem(VAULT_PREFIX + username);
    if (!raw) throw new Error('No such account');
    const vault = JSON.parse(raw) as VaultBlob;
    try {
      const key = await deriveKey(password, unb64(vault.kdf.salt), vault.kdf.iterations);
      const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(vault.iv) }, key, unb64(vault.ciphertext));
      return dec.decode(pt);
    } catch {
      throw new Error('Wrong password');
    }
  }

  logout(): void {
    this.session = null;
    walletService.clear();
    localStorage.removeItem(SESSION_KEY);
    // kdf can't hot-swap seeds in-page, so a full reload is the only clean way
    // to drop the logged-in wallet from the running engine.
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('wattx:auth'));
  }

  /** Remove a saved account from this device (does not touch on-chain funds). */
  removeAccount(username: string): void {
    localStorage.removeItem(VAULT_PREFIX + username.trim().toLowerCase());
  }

  // --- internals ---
  private async persist(username: string, password: string, mnemonic: string): Promise<string> {
    if (password.length < 8) throw new Error('Password must be at least 8 characters');
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt, PBKDF2_ITERATIONS);
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(mnemonic));
    const vault: VaultBlob = {
      v: 1,
      username,
      createdAt: new Date().toISOString(),
      kdf: { salt: b64(salt), iterations: PBKDF2_ITERATIONS },
      iv: b64(iv),
      ciphertext: b64(ct),
    };
    localStorage.setItem(VAULT_PREFIX + username, JSON.stringify(vault));
    return this.unlockWithMnemonic(username, mnemonic);
  }

  private async unlockWithMnemonic(username: string, mnemonic: string): Promise<string> {
    const ok = await walletService.initializeFromMnemonic(mnemonic);
    if (!ok) throw new Error('Failed to load wallet from seed');
    const address = ethers.HDNodeWallet.fromPhrase(mnemonic).address;
    this.session = { method: 'seed', username, address };
    localStorage.setItem(SESSION_KEY, username);
    // Notify the DEX engine that a wallet seed is now available so it can boot
    // kdf with the user's seed (deriving their real, funded addresses).
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('wattx:auth'));
    return address;
  }
}

export const authService = new AuthService();
export default authService;
