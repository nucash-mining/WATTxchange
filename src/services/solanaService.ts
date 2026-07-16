// Solana integration: Phantom wallet connect, balances and cluster health
// over plain JSON-RPC (no @solana/web3.js — keeps the bundle small; the HTLC
// leg lives in solanaHtlcService which encodes its own instructions).

export interface SolanaWalletState {
  connected: boolean;
  publicKey: string | null; // base58
}

interface PhantomProvider {
  isPhantom?: boolean;
  publicKey?: { toString(): string };
  connect(opts?: { onlyIfTrusted?: boolean }): Promise<{ publicKey: { toString(): string } }>;
  disconnect(): Promise<void>;
  signAndSendTransaction(tx: unknown): Promise<{ signature: string }>;
  on(event: string, cb: (...args: unknown[]) => void): void;
}

const LAMPORTS_PER_SOL = 1_000_000_000;

class SolanaService {
  private rpcUrls = [
    'https://api.mainnet-beta.solana.com',
    'https://solana-rpc.publicnode.com',
  ];
  private rpcIndex = 0;
  private idCounter = 1;

  get provider(): PhantomProvider | null {
    const w = window as unknown as { phantom?: { solana?: PhantomProvider }; solana?: PhantomProvider };
    const p = w.phantom?.solana ?? w.solana;
    return p?.isPhantom ? p : null;
  }

  isWalletAvailable(): boolean {
    return this.provider !== null;
  }

  async connectWallet(): Promise<SolanaWalletState> {
    const provider = this.provider;
    if (!provider) {
      throw new Error('Phantom wallet not found — install it from phantom.app');
    }
    const res = await provider.connect();
    return { connected: true, publicKey: res.publicKey.toString() };
  }

  async disconnectWallet(): Promise<void> {
    await this.provider?.disconnect();
  }

  private async rpc<T>(method: string, params: unknown[] = []): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt < this.rpcUrls.length; attempt++) {
      const url = this.rpcUrls[(this.rpcIndex + attempt) % this.rpcUrls.length];
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: this.idCounter++, method, params }),
          signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) throw new Error(`Solana RPC ${res.status}`);
        const body = await res.json();
        if (body.error) throw new Error(body.error.message ?? 'Solana RPC error');
        this.rpcIndex = (this.rpcIndex + attempt) % this.rpcUrls.length;
        return body.result as T;
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError instanceof Error ? lastError : new Error('All Solana RPCs failed');
  }

  /** SOL balance for a base58 address, in SOL. */
  async getBalance(address: string): Promise<number> {
    const result = await this.rpc<{ value: number }>('getBalance', [address]);
    return result.value / LAMPORTS_PER_SOL;
  }

  async getSlot(): Promise<number> {
    return this.rpc<number>('getSlot');
  }

  /** Cluster reachability — used as the "node connected" light for SOL. */
  async isHealthy(): Promise<boolean> {
    try {
      await this.getSlot();
      return true;
    } catch {
      return false;
    }
  }
}

export const solanaService = new SolanaService();
