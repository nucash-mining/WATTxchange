// Client for the Solana HTLC program (src/solana/htlc_program). The SOL leg
// of an atomic swap uses the SAME sha256(preimage) hashlock as the EVM
// HTLCVault and Bitcoin-script HTLCs, so one secret settles both legs.
//
// The program is not deployed yet: PROGRAM_ID stays null until
// `cargo build-sbf && solana program deploy --final` has run, and every
// method here refuses to operate until then (never a custodial fallback).

export const SOLANA_HTLC_PROGRAM_ID: string | null = null;

export interface SolanaHtlcLockParams {
  senderBase58: string;
  recipientBase58: string;
  hashlockHex: string;   // 0x-prefixed sha256 digest — same value as the EVM leg
  timeoutSec: number;    // unix seconds; keep shorter/longer leg rules identical to EVM
  lamports: bigint;
  nonce: bigint;
}

/**
 * Byte layout helpers for the program's instructions. Kept dependency-free;
 * the actual transaction assembly/signing goes through Phantom's
 * signAndSendTransaction once the program is live.
 */
export function encodeLockInstruction(p: SolanaHtlcLockParams): Uint8Array {
  const out = new Uint8Array(1 + 88);
  out[0] = 0; // Lock
  out.set(hexToBytes(p.hashlockHex), 1);
  writeLeI64(out, 33, BigInt(p.timeoutSec));
  writeLeU64(out, 41, p.lamports);
  out.set(base58ToBytes(p.recipientBase58), 49);
  writeLeU64(out, 81, p.nonce);
  return out;
}

export function encodeClaimInstruction(preimageHex: string): Uint8Array {
  const out = new Uint8Array(1 + 32);
  out[0] = 1; // Claim
  out.set(hexToBytes(preimageHex), 1);
  return out;
}

export function encodeRefundInstruction(): Uint8Array {
  return new Uint8Array([2]); // Refund
}

export function isSolanaHtlcAvailable(): boolean {
  return SOLANA_HTLC_PROGRAM_ID !== null;
}

export function assertSolanaHtlcAvailable(): void {
  if (!isSolanaHtlcAvailable()) {
    throw new Error(
      'Solana HTLC program not deployed yet — SOL atomic swaps are disabled until then (no custodial fallback).'
    );
  }
}

// ---- tiny codecs (no external deps) ----

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (clean.length !== 64) throw new Error('expected 32-byte hex value');
  const out = new Uint8Array(32);
  for (let i = 0; i < 32; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return out;
}

const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
function base58ToBytes(s: string): Uint8Array {
  let n = 0n;
  for (const c of s) {
    const v = B58.indexOf(c);
    if (v < 0) throw new Error('bad base58');
    n = n * 58n + BigInt(v);
  }
  const bytes: number[] = [];
  while (n > 0n) {
    bytes.unshift(Number(n & 0xffn));
    n >>= 8n;
  }
  for (const c of s) {
    if (c === '1') bytes.unshift(0);
    else break;
  }
  if (bytes.length > 32) throw new Error('bad pubkey length');
  const out = new Uint8Array(32);
  out.set(bytes, 32 - bytes.length);
  return out;
}

function writeLeU64(buf: Uint8Array, offset: number, v: bigint): void {
  for (let i = 0; i < 8; i++) buf[offset + i] = Number((v >> BigInt(8 * i)) & 0xffn);
}

function writeLeI64(buf: Uint8Array, offset: number, v: bigint): void {
  writeLeU64(buf, offset, BigInt.asUintN(64, v));
}
