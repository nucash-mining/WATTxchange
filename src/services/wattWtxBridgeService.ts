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
    if (bal < amountWei) throw new Error('insufficient WATT balance');
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
