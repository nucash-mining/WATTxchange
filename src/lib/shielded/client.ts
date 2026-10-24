// Browser client for the nuChain ShieldedPool: notes, Merkle paths, Groth16 proofs.
// The note secret never leaves the browser; only the proof goes to the relayer.
import { ethers } from 'ethers';
import { poseidon2, poseidon3, FIELD } from './poseidon';
import { SHIELDED } from '../../config/nuchainShielded';

export const LEVELS = 20;
export type Note = { token: string; amount: bigint; secret: bigint; salt: bigint; ownerHash: bigint; commitment: bigint };
export type Owner = { secret: bigint; salt: bigint; ownerHash: bigint };
export type Leaf = { commitment: bigint; index: number; token: string; amount: bigint; ownerHash: bigint; kind: number };
export type Proof = { a: string[]; b: string[][]; c: string[] };

const coder = ethers.AbiCoder.defaultAbiCoder();
const rand = (): bigint => {
  const b = new Uint8Array(31); crypto.getRandomValues(b);
  return BigInt('0x' + Array.from(b, (x) => x.toString(16).padStart(2, '0')).join(''));
};

export const provider = () => new ethers.JsonRpcProvider(SHIELDED.rpc, SHIELDED.chainId, { staticNetwork: true });
export const POOL_ABI = [
  'event NoteAdded(uint256 indexed commitment, uint32 leafIndex, address token, uint256 amount, uint256 ownerHash, uint8 kind)',
  'function depositNative(uint256) payable',
  'function deposit(address,uint256,uint256)',
  'function nullifierSpent(uint256) view returns (bool)',
];

// ---------------------------------------------------------------- notes
export function noteFrom(token: string, amount: bigint, secret: bigint, salt: bigint): Note {
  const ownerHash = poseidon2([secret, salt]);
  const commitment = poseidon3([BigInt(token), amount, ownerHash]);
  return { token: ethers.getAddress(token), amount, secret, salt, ownerHash, commitment };
}
export const newNote = (token: string, amount: bigint) => noteFrom(token, amount, rand(), rand());
export function newOwner(): Owner { const secret = rand(), salt = rand(); return { secret, salt, ownerHash: poseidon2([secret, salt]) }; }
export const encodeNote = (n: Note) => `nunote-${n.token}-${n.amount}-${n.secret.toString(16)}-${n.salt.toString(16)}`;
export function decodeNote(s: string): Note {
  const [tag, token, amount, secret, salt] = s.trim().split('-');
  if (tag !== 'nunote' || !token || !amount || !secret || !salt) throw new Error('That is not a nuChain note (expected nunote-...)');
  return noteFrom(token, BigInt(amount), BigInt('0x' + secret), BigInt('0x' + salt));
}
export const nullifierOf = (n: Note) => poseidon2([n.commitment, n.secret]);
export const relayerFee = (amount: bigint) => (amount * SHIELDED.relayerFeeBps + 9999n) / 10000n;
export const symbolOf = (token: string) => (ethers.getAddress(token) === ethers.getAddress(SHIELDED.wnu) ? 'NU' : 'wWTX');
export const fmtAmount = (token: string, a: bigint) =>
  symbolOf(token) === 'NU' ? ethers.formatEther(a) : ethers.formatUnits(a, 8);

// ---------------------------------------------------------------- tree
let zerosCache: bigint[] | null = null;
function zeros(): bigint[] {
  if (zerosCache) return zerosCache;
  let z = BigInt(ethers.keccak256(ethers.toUtf8Bytes('nuchain-shielded-pool'))) % FIELD;
  const out: bigint[] = [];
  for (let i = 0; i < LEVELS; i++) { out.push(z); z = poseidon2([z, z]); }
  return (zerosCache = out);
}

export async function fetchLeaves(): Promise<Leaf[]> {
  const p = provider();
  const pool = new ethers.Contract(SHIELDED.pool, POOL_ABI, p);
  const head = await p.getBlockNumber();
  const out: Leaf[] = [];
  for (let from = SHIELDED.deployBlock; from <= head; from += 5000) {
    const evs = await pool.queryFilter(pool.filters.NoteAdded(), from, Math.min(head, from + 4999));
    for (const e of evs as ethers.EventLog[]) {
      out.push({ commitment: e.args.commitment, index: Number(e.args.leafIndex), token: e.args.token,
        amount: e.args.amount, ownerHash: e.args.ownerHash, kind: Number(e.args.kind) });
    }
  }
  return out.sort((a, b) => a.index - b.index);
}

export function merklePath(leaves: Leaf[], index: number) {
  const z = zeros();
  let level = leaves.map((l) => BigInt(l.commitment));
  const pathElements: bigint[] = [], pathIndices: number[] = [];
  let i = index;
  for (let l = 0; l < LEVELS; l++) {
    pathElements.push(i % 2 === 0 ? (level[i + 1] ?? z[l]) : level[i - 1]);
    pathIndices.push(i % 2);
    const next: bigint[] = [];
    for (let k = 0; k < level.length; k += 2) next.push(poseidon2([level[k], level[k + 1] ?? z[l]]));
    level = next; i = Math.floor(i / 2);
  }
  const root = level.length ? level[0] : poseidon2([z[LEVELS - 1], z[LEVELS - 1]]);
  return { pathElements, pathIndices, root };
}

// --------------------------------------------------------- ext data
export function withdrawExt(recipient: string, relayer: string, fee: bigint, unwrap: boolean): bigint {
  return BigInt(ethers.keccak256(coder.encode(['string', 'uint256', 'address', 'address', 'address', 'uint256', 'bool'],
    ['withdraw', SHIELDED.chainId, SHIELDED.pool, recipient, relayer, fee, unwrap]))) % FIELD;
}
export function swapExt(minOut: bigint, outOwnerHash: bigint, relayer: string, fee: bigint): bigint {
  return BigInt(ethers.keccak256(coder.encode(['string', 'uint256', 'address', 'address', 'uint256', 'uint256', 'address', 'uint256'],
    ['swap', SHIELDED.chainId, SHIELDED.pool, SHIELDED.pair, minOut, outOwnerHash, relayer, fee]))) % FIELD;
}

// ----------------------------------------------------------- proving
type SnarkJs = { groth16: { fullProve: (i: unknown, w: string, z: string) => Promise<{ proof: any; publicSignals: string[] }> } };
let snarkPromise: Promise<SnarkJs> | null = null;
function loadSnarkjs(): Promise<SnarkJs> {
  const w = window as unknown as { snarkjs?: SnarkJs };
  if (w.snarkjs) return Promise.resolve(w.snarkjs);
  if (!snarkPromise) snarkPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SHIELDED.snarkjs; s.async = true;
    s.onload = () => (w.snarkjs ? resolve(w.snarkjs) : reject(new Error('snarkjs failed to load')));
    s.onerror = () => reject(new Error('could not load the zk prover'));
    document.head.appendChild(s);
  });
  return snarkPromise;
}

export async function prove(note: Note, leaves: Leaf[], extDataHash: bigint) {
  const leaf = leaves.find((l) => BigInt(l.commitment) === note.commitment);
  if (!leaf) throw new Error('This note is not in the pool (not deposited yet, or a different pool)');
  const { pathElements, pathIndices, root } = merklePath(leaves, leaf.index);
  const nullifierHash = nullifierOf(note);
  const input = {
    root: root.toString(), nullifierHash: nullifierHash.toString(), asset: BigInt(note.token).toString(),
    amount: note.amount.toString(), extDataHash: extDataHash.toString(),
    secret: note.secret.toString(), salt: note.salt.toString(),
    pathElements: pathElements.map(String), pathIndices: pathIndices.map(String),
  };
  const snarkjs = await loadSnarkjs();
  const { proof } = await snarkjs.groth16.fullProve(input, SHIELDED.wasm, SHIELDED.zkey);
  const p: Proof = {
    a: [proof.pi_a[0], proof.pi_a[1]],
    b: [[proof.pi_b[0][1], proof.pi_b[0][0]], [proof.pi_b[1][1], proof.pi_b[1][0]]],
    c: [proof.pi_c[0], proof.pi_c[1]],
  };
  return { proof: p, root, nullifierHash };
}

// ----------------------------------------------------------- relayer
const ser = (o: unknown) => JSON.stringify(o, (_, v) => (typeof v === 'bigint' ? v.toString() : v));
export async function relayerInfo(): Promise<{ relayer: string; feeBps: number }> {
  const r = await fetch(SHIELDED.relayer + '/info');
  if (!r.ok) throw new Error('relayer unreachable');
  return r.json();
}
export async function relay(action: 'withdraw' | 'swap', args: unknown[]): Promise<{ txHash: string }> {
  const r = await fetch(SHIELDED.relayer + '/relay', { method: 'POST', headers: { 'content-type': 'application/json' }, body: ser({ action, args }) });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j;
}
