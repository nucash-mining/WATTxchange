// Client for the trust-minimized HTLC bridge (contracts/src/HTLCVault.sol).
// A cross-chain transfer = two locks under one sha256(preimage):
//   1. initiator generates a secret, locks on chain A for the counterparty
//      with a LONG timeout;
//   2. counterparty locks on chain B for the initiator with a SHORTER timeout;
//   3. initiator claims on B (revealing the preimage on-chain);
//   4. counterparty claims on A with the revealed preimage.
// No custodian ever holds funds; the worst case is a refund after timeout.
// SHA-256 hashlocks are portable to Bitcoin-script HTLCs and the Solana HTLC
// program, so the same secret drives EVM, UTXO and SOL legs.
import { ethers } from 'ethers';
import {
  bridgeDeployment,
  HTLC_VAULT_ABI,
  type BridgeDeployment,
} from '../config/bridgeContracts';

export interface HtlcSwapLeg {
  chainId: number;
  swapId: string;
  hashlock: string;
  timeout: number;     // unix seconds
  asset: string;       // ZeroAddress = native
  value: bigint;
  sender: string;
  recipient: string;
  txHash: string;
}

export type HtlcStage = 'INVALID' | 'LOCKED' | 'CLAIMED' | 'REFUNDED';
const STAGES: HtlcStage[] = ['INVALID', 'LOCKED', 'CLAIMED', 'REFUNDED'];

class HtlcBridgeService {
  private providers = new Map<number, ethers.JsonRpcProvider>();

  deployment(chainId: number): BridgeDeployment | null {
    return bridgeDeployment(chainId);
  }

  isAvailable(chainId: number): boolean {
    return !!bridgeDeployment(chainId)?.vault;
  }

  private provider(chainId: number): ethers.JsonRpcProvider {
    let p = this.providers.get(chainId);
    if (!p) {
      const d = bridgeDeployment(chainId);
      if (!d) throw new Error(`No bridge config for chain ${chainId}`);
      p = new ethers.JsonRpcProvider(d.rpcUrl, chainId, { staticNetwork: true });
      this.providers.set(chainId, p);
    }
    return p;
  }

  private vault(chainId: number, signerOrNothing?: ethers.Signer): ethers.Contract {
    const d = bridgeDeployment(chainId);
    if (!d?.vault) throw new Error(`HTLC vault not deployed on ${d?.name ?? chainId}`);
    return new ethers.Contract(d.vault, HTLC_VAULT_ABI, signerOrNothing ?? this.provider(chainId));
  }

  /** Fresh cryptographically-random secret + its sha256 hashlock. */
  generateSecret(): { preimage: string; hashlock: string } {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    const preimage = ethers.hexlify(bytes);
    const hashlock = ethers.sha256(preimage);
    return { preimage, hashlock };
  }

  /**
   * Lock funds on `chainId`. Native coin when `asset` is the zero address
   * (amount sent as value); ERC-20 otherwise (approve is handled here).
   */
  async lock(
    signer: ethers.Signer,
    chainId: number,
    params: {
      recipient: string;
      hashlock: string;
      timeoutSec: number;   // absolute unix seconds
      asset?: string;       // default native
      amountWei: bigint;
    }
  ): Promise<HtlcSwapLeg> {
    const asset = params.asset ?? ethers.ZeroAddress;
    const vault = this.vault(chainId, signer);
    const sender = await signer.getAddress();
    const nonce = BigInt(ethers.hexlify(crypto.getRandomValues(new Uint8Array(8))));

    if (asset !== ethers.ZeroAddress) {
      const erc20 = new ethers.Contract(
        asset,
        ['function allowance(address,address) view returns (uint256)', 'function approve(address,uint256) returns (bool)'],
        signer
      );
      const allowance: bigint = await erc20.allowance(sender, await vault.getAddress());
      if (allowance < params.amountWei) {
        const tx = await erc20.approve(await vault.getAddress(), params.amountWei);
        await tx.wait();
      }
    }

    const tx = await vault.lock(
      params.recipient,
      params.hashlock,
      params.timeoutSec,
      asset,
      params.amountWei,
      nonce,
      { value: asset === ethers.ZeroAddress ? params.amountWei : 0n }
    );
    const receipt = await tx.wait();

    // swapID is the first topic of the Locked event
    const lockedTopic = ethers.id('Locked(bytes32,address,address,bytes32,uint256,address,uint256)');
    const log = receipt.logs.find((l: ethers.Log) => l.topics[0] === lockedTopic);
    const swapId = log ? log.topics[1] : ethers.ZeroHash;

    return {
      chainId,
      swapId,
      hashlock: params.hashlock,
      timeout: params.timeoutSec,
      asset,
      value: params.amountWei,
      sender,
      recipient: params.recipient,
      txHash: tx.hash,
    };
  }

  /** Claim a locked leg with the preimage (must be the recipient, pre-timeout). */
  async claim(signer: ethers.Signer, chainId: number, swapId: string, preimage: string): Promise<string> {
    const tx = await this.vault(chainId, signer).claim(swapId, preimage);
    await tx.wait();
    return tx.hash;
  }

  /** Refund an expired leg (must be the sender, post-timeout). */
  async refund(signer: ethers.Signer, chainId: number, swapId: string): Promise<string> {
    const tx = await this.vault(chainId, signer).refund(swapId);
    await tx.wait();
    return tx.hash;
  }

  async stage(chainId: number, swapId: string): Promise<HtlcStage> {
    const s: bigint = await this.vault(chainId).stageOf(swapId);
    return STAGES[Number(s)] ?? 'INVALID';
  }

  /**
   * Watch a leg for its preimage reveal. Resolves with the preimage as soon
   * as the counterparty claims — this is what lets our side claim the other
   * leg. Polls; resolves null if the leg times out first.
   */
  async waitForPreimage(chainId: number, swapId: string, timeoutSec: number, pollMs = 15000): Promise<string | null> {
    const vault = this.vault(chainId);
    const deadline = timeoutSec * 1000;
    for (;;) {
      const preimage: string = await vault.preimages(swapId);
      if (preimage && preimage !== ethers.ZeroHash) return preimage;
      if (Date.now() > deadline) return null;
      await new Promise((r) => setTimeout(r, pollMs));
    }
  }
}

export const htlcBridgeService = new HtlcBridgeService();
