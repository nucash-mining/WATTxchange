// Client for the WATT <-> WTX bridge desk (watt-wtx-bridge daemon).
//
// The desk swaps WATT on Polygon / Altcoinchain / BSV against native WTX on
// WATTxchain at a posted rate. EVM in-legs are HTLCVault locks to the desk
// under a desk-issued hashlock: the desk pays WTX out FIRST and only then
// claims the lock, so a dead desk leaves your WATT refundable after the
// timeout — never stranded. BSV and WTX in-legs are watched deposit
// addresses; all out-legs are direct sends.
import { ethers } from 'ethers';
import { HTLC_VAULT_ABI } from '../config/bridgeContracts';

const API_BASE =
  (import.meta as { env?: Record<string, string> }).env?.VITE_WATT_BRIDGE_API ??
  'http://127.0.0.1:8791';

export type BridgeChainKey = 'alt' | 'polygon' | 'bsv';

export interface BridgeInfo {
  rate: { wtxPerWatt: number; feeBps: number };
  limits: { minWatt: string; maxWatt: string; minWtx: string; maxWtx: string };
  operator: string;
  bsv: { enabled: boolean; wattTokenId: string };
  chains: Record<
    string,
    { enabled: boolean; chainId: number; watt: string; vault: string; confirmations: number }
  >;
  floats: Record<string, string | null>;
  /** WTX chain liveness. When `advancing` is false, mining has stalled and WTX
   *  deposits won't confirm until it resumes. */
  wtxChain?: {
    height: number;
    tipTime: number;
    tipAgeSeconds: number;
    advancing: boolean;
  } | null;
}

export interface BridgeSwap {
  id: string;
  direction: 'WATT_TO_WTX' | 'WTX_TO_WATT' | 'EVM_TO_EVM';
  sourceChain?: BridgeChainKey;
  destChain?: BridgeChainKey;
  state: string;
  createdAt: string;
  wtxAddress?: string;
  destAddress?: string;
  bsvDepositAddress?: string;
  wtxDepositAddress?: string;
  wattBase?: string;
  wtxSats?: string;
  wtxTxid?: string;
  payoutTx?: string;
  claimTx?: string;
  instructions?: string;
  /** Relay fee, paid separately in the chain's gas coin (POL on Polygon, ALT
   *  on Altcoinchain). The EVM payout waits until it is paid and verified. */
  relayFee?: { chain: 'alt' | 'polygon'; coin: 'POL' | 'ALT'; wei: string; amount: string; payTo: string } | null;
  relayFeePaid?: { txHash: string; from: string; wei: string; at: string } | null;
  feeNote?: string;
  /** EVM lock details once the desk has seen the lock (sender = fee payer). */
  evm?: { sender?: string };
  /** Live WTX-deposit progress (present on WTX_TO_WATT swaps still confirming). */
  deposit?: {
    seen: boolean;
    confirmations: number;
    required: number;
    amountSats?: string;
    txid?: string | null;
  };
  lockParams?: {
    vault: string;
    wattToken: string;
    recipient: string;
    hashlock: string;
    suggestedTimeout: number;
    minTimeout: number;
    chainId: number;
  };
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'content-type': 'application/json' },
    ...init,
  });
  const body = (await res.json()) as T & { error?: string };
  if (!res.ok) throw new Error(body.error ?? `bridge api ${res.status}`);
  return body;
}

class WattWtxBridgeService {
  /** The desk's live quote: exactly what it would pay right now (same pricing as the payout). */
  async quote(q: { direction: 'WATT_TO_WTX' | 'WTX_TO_WATT' | 'EVM_TO_EVM'; amount: string; sourceChain?: string; destChain?: string }):
    Promise<{ amountOut: string; mode: string; relayFee?: { amount: string; coin: string } | null }> {
    const qs = new URLSearchParams({ direction: q.direction, amount: q.amount, ...(q.sourceChain ? { sourceChain: q.sourceChain } : {}), ...(q.destChain ? { destChain: q.destChain } : {}) });
    const res = await fetch(`${API_BASE}/api/quote?${qs}`);
    const body = await res.json() as { amountOut?: string; mode?: string; relayFee?: { amount: string; coin: string } | null; error?: string; detail?: string };
    if (!res.ok || !body.amountOut) throw new Error((body.detail ?? body.error ?? `quote ${res.status}`).replace(/^limit:\s*/, ''));
    return { amountOut: body.amountOut, mode: body.mode ?? '', relayFee: body.relayFee ?? null };
  }

  async info(): Promise<BridgeInfo> {
    return await api<BridgeInfo>('/api/info');
  }

  async createSwap(body: {
    direction: 'WATT_TO_WTX' | 'WTX_TO_WATT' | 'EVM_TO_EVM';
    sourceChain?: BridgeChainKey;
    destChain?: BridgeChainKey;
    wtxAddress?: string;
    destAddress?: string;
  }): Promise<BridgeSwap> {
    const r = await api<{ swap: BridgeSwap }>('/api/swap', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return r.swap;
  }

  async getSwap(id: string): Promise<BridgeSwap | null> {
    const r = await api<{ swap: BridgeSwap | null }>(`/api/swap/${id}`);
    return r.swap;
  }

  /** Pay the relay fee: send the quoted POL/ALT to the desk, wait for it to
   *  mine, then hand the tx hash to the desk for verification. */
  /** Send the relay fee from `signer` and record it. `lockTx` (the WATT lock just sent)
   *  proves who locked, so the fee can be paid before the desk has seen the lock. */
  async payRelayFee(signer: ethers.Signer, swap: BridgeSwap, lockTx?: string): Promise<BridgeSwap> {
    const f = swap.relayFee;
    if (!f) throw new Error('this swap has no relay fee');
    const tx = await signer.sendTransaction({ to: f.payTo, value: BigInt(f.wei) });
    const rcpt = await tx.wait();
    const hash = (rcpt?.hash ?? tx.hash) as string;
    // the RPC behind the desk can lag a block or two behind the wallet's: retry briefly
    let last: unknown;
    for (let i = 0; i < 6; i++) {
      try { return await this.submitRelayFee(swap.id, hash, lockTx); } catch (e) {
        last = e;
        if (!/not found|not mined|try again/i.test(String((e as Error).message))) throw e;
        await new Promise((r) => setTimeout(r, 4000));
      }
    }
    throw last;
  }

  /** Report a relay-fee payment made from any wallet tool. */
  async submitRelayFee(id: string, txHash: string, lockTx?: string): Promise<BridgeSwap> {
    const r = await api<{ swap: BridgeSwap }>(`/api/swap/${id}/relayfee`, {
      method: 'POST',
      body: JSON.stringify({ txHash, ...(lockTx ? { lockTx } : {}) }),
    });
    return r.swap;
  }

  /** Approve WATT (if needed) then lock it in the vault per the desk's intent.
   *  Returns the lock tx hash. The random nonce keeps swapIDs unique. */
  async lockWatt(
    signer: ethers.Signer,
    swap: BridgeSwap,
    amountWatt: string,
    timeoutHours = 24
  ): Promise<string> {
    const lp = swap.lockParams;
    if (!lp) throw new Error('swap has no lock parameters');
    const amountWei = ethers.parseEther(amountWatt);
    if (amountWei <= 0n) throw new Error('enter an amount');
    const owner = await signer.getAddress();

    const erc20 = new ethers.Contract(
      lp.wattToken,
      [
        'function allowance(address, address) view returns (uint256)',
        'function approve(address, uint256) returns (bool)',
        'function balanceOf(address) view returns (uint256)',
      ],
      signer
    );
    const bal: bigint = await erc20.balanceOf(owner);
    if (bal < amountWei) {
      const chainId = Number((await signer.provider!.getNetwork()).chainId);
      throw new Error(`Wallet ${owner.slice(0, 6)}…${owner.slice(-4)} has ${Number(ethers.formatEther(bal)).toLocaleString()} WATT on chain ${chainId}, `
        + `less than the ${amountWatt} you entered. If your WATT is in another account, select that account in your wallet and try again.`);
    }
    const allowance: bigint = await erc20.allowance(owner, lp.vault);
    if (allowance < amountWei) {
      const atx = await erc20.approve(lp.vault, amountWei);
      await atx.wait();
    }

    const timeout = Math.max(
      lp.minTimeout + 600,
      Math.floor(Date.now() / 1000) + timeoutHours * 3600
    );
    const nonce = BigInt(ethers.hexlify(ethers.randomBytes(8)));
    const vault = new ethers.Contract(lp.vault, HTLC_VAULT_ABI, signer);
    const tx = await vault.lock(lp.recipient, lp.hashlock, timeout, lp.wattToken, amountWei, nonce);
    const rcpt = await tx.wait();
    return rcpt.hash as string;
  }
}

export const wattWtxBridgeService = new WattWtxBridgeService();
export default wattWtxBridgeService;
