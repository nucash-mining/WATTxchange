// Hyperliquid trading inside WATTxchange (no trip to app.hyperliquid.xyz).
//
// Same model as Hyperliquid's own site: the user's wallet signs ONE "approve agent" message,
// which authorises a trading key that lives in this browser. That key signs orders; it can
// trade but can never withdraw. Funds stay in the user's Hyperliquid account.
// USDC deposits go from Arbitrum to Hyperliquid's bridge contract.
import { ethers } from 'ethers';

export const HL_API = 'https://api.hyperliquid.xyz';
export const HL_BRIDGE = '0x2Df1c51E09aECF9cacB7bc98cB1742757f163dF7'; // Arbitrum, Bridge2
export const ARB_USDC = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831';
const ZERO = '0x0000000000000000000000000000000000000000';

// ------------------------------------------------------------------ msgpack ----
// Minimal encoder matching Python msgpack.packb (which Hyperliquid hashes): maps keep
// insertion order, ints use the smallest uint/int form, strings use str8/16/32.
type Pk = null | boolean | number | string | Pk[] | { [k: string]: Pk };
export function msgpack(v: Pk): Uint8Array {
  const out: number[] = [];
  const u = (n: number, bytes: number) => { for (let i = bytes - 1; i >= 0; i--) out.push(Number((BigInt(n) >> BigInt(8 * i)) & 0xffn)); };
  const enc = (x: Pk) => {
    if (x === null) out.push(0xc0);
    else if (x === true) out.push(0xc3);
    else if (x === false) out.push(0xc2);
    else if (typeof x === 'number') {
      if (!Number.isInteger(x)) throw new Error('msgpack: floats are not allowed in actions');
      if (x >= 0) {
        if (x < 0x80) out.push(x);
        else if (x < 0x100) { out.push(0xcc); u(x, 1); }
        else if (x < 0x10000) { out.push(0xcd); u(x, 2); }
        else if (x < 0x100000000) { out.push(0xce); u(x, 4); }
        else { out.push(0xcf); u(x, 8); }
      } else {
        if (x >= -32) out.push(0x100 + x);
        else if (x >= -128) { out.push(0xd0); u(0x100 + x, 1); }
        else if (x >= -32768) { out.push(0xd1); u(0x10000 + x, 2); }
        else { out.push(0xd2); u(0x100000000 + x, 4); }
      }
    } else if (typeof x === 'string') {
      const b = new TextEncoder().encode(x);
      if (b.length < 32) out.push(0xa0 | b.length);
      else if (b.length < 0x100) { out.push(0xd9); u(b.length, 1); }
      else if (b.length < 0x10000) { out.push(0xda); u(b.length, 2); }
      else { out.push(0xdb); u(b.length, 4); }
      out.push(...b);
    } else if (Array.isArray(x)) {
      if (x.length < 16) out.push(0x90 | x.length); else { out.push(0xdc); u(x.length, 2); }
      x.forEach(enc);
    } else {
      const keys = Object.keys(x).filter((k) => x[k] !== undefined);
      if (keys.length < 16) out.push(0x80 | keys.length); else { out.push(0xde); u(keys.length, 2); }
      for (const k of keys) { enc(k); enc(x[k]); }
    }
  };
  enc(v);
  return new Uint8Array(out);
}

// ------------------------------------------------------------------ signing ----

/** Hash of an L1 action (orders etc.), as Hyperliquid computes it. */
export function actionHash(action: Pk, nonce: number, vault: string | null = null): string {
  const a = msgpack(action);
  const n = new Uint8Array(8); new DataView(n.buffer).setBigUint64(0, BigInt(nonce));
  const v = vault ? ethers.concat(['0x01', vault]) : '0x00';
  return ethers.keccak256(ethers.concat([a, n, v]));
}

/** Agent (trading key) signature over an L1 action: the "phantom agent" EIP-712 message. */
export async function signL1(agent: ethers.Wallet, action: Pk, nonce: number) {
  const sig = await agent.signTypedData(
    { name: 'Exchange', version: '1', chainId: 1337, verifyingContract: ZERO },
    { Agent: [{ name: 'source', type: 'string' }, { name: 'connectionId', type: 'bytes32' }] },
    { source: 'a', connectionId: actionHash(action, nonce) },
  );
  const s = ethers.Signature.from(sig);
  return { r: s.r, s: s.s, v: s.v };
}

/** User-signed actions (approve agent, move USDC between spot and perps). */
async function signUser(signer: ethers.Signer, primaryType: string, fields: { name: string; type: string }[], message: Record<string, unknown>, chainId: number) {
  const sig = await signer.signTypedData(
    { name: 'HyperliquidSignTransaction', version: '1', chainId, verifyingContract: ZERO },
    { [primaryType]: fields },
    message,
  );
  const s = ethers.Signature.from(sig);
  return { r: s.r, s: s.s, v: s.v };
}

async function post(path: string, body: unknown) {
  const res = await fetch(`${HL_API}${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const text = await res.text();
  let json: unknown; try { json = JSON.parse(text); } catch { throw new Error(text || `Hyperliquid: HTTP ${res.status}`); }
  return json as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
}
export const info = (body: Record<string, unknown>) => post('/info', body);

async function exchange(action: Pk, nonce: number, signature: { r: string; s: string; v: number }) {
  const r = await post('/exchange', { action, nonce, signature, vaultAddress: null });
  if (r.status !== 'ok') throw new Error(typeof r.response === 'string' ? r.response : JSON.stringify(r.response ?? r));
  return r.response;
}

// --------------------------------------------------------------- agent keys ----

const agentKey = (user: string) => `wxc.hl.agent.v1:${user.toLowerCase()}`;
export function loadAgent(user: string): ethers.Wallet | null {
  try { const k = localStorage.getItem(agentKey(user)); return k ? new ethers.Wallet(k) : null; } catch { return null; }
}
export function forgetAgent(user: string) { try { localStorage.removeItem(agentKey(user)); } catch { /* ignore */ } }

/** Wallet signs once; a new trading key for this browser is authorised. */
export async function approveAgent(signer: ethers.Signer): Promise<ethers.Wallet> {
  const user = await signer.getAddress();
  const chainId = Number((await signer.provider!.getNetwork()).chainId);
  const agent = ethers.Wallet.createRandom();
  const nonce = Date.now();
  const action = {
    type: 'approveAgent', signatureChainId: `0x${chainId.toString(16)}`, hyperliquidChain: 'Mainnet',
    agentAddress: agent.address, agentName: 'WATTxchange', nonce,
  };
  const signature = await signUser(signer, 'HyperliquidTransaction:ApproveAgent', [
    { name: 'hyperliquidChain', type: 'string' }, { name: 'agentAddress', type: 'address' },
    { name: 'agentName', type: 'string' }, { name: 'nonce', type: 'uint64' },
  ], { hyperliquidChain: 'Mainnet', agentAddress: agent.address, agentName: 'WATTxchange', nonce }, chainId);
  await exchange(action, nonce, signature);
  localStorage.setItem(agentKey(user), agent.privateKey);
  return new ethers.Wallet(agent.privateKey);
}

/** Move USDC between the perps and spot balances (wallet-signed). */
export async function moveUsdc(signer: ethers.Signer, amount: string, toPerp: boolean) {
  const chainId = Number((await signer.provider!.getNetwork()).chainId);
  const nonce = Date.now();
  const action = { type: 'usdClassTransfer', signatureChainId: `0x${chainId.toString(16)}`, hyperliquidChain: 'Mainnet', amount, toPerp, nonce };
  const signature = await signUser(signer, 'HyperliquidTransaction:UsdClassTransfer', [
    { name: 'hyperliquidChain', type: 'string' }, { name: 'amount', type: 'string' },
    { name: 'toPerp', type: 'bool' }, { name: 'nonce', type: 'uint64' },
  ], { hyperliquidChain: 'Mainnet', amount, toPerp, nonce }, chainId);
  return exchange(action, nonce, signature);
}

// ------------------------------------------------------------------ markets ----

export interface HlAsset { asset: number; szDecimals: number; spot: boolean; midKey: string }
let metaCache: { perps: any; spot: any; at: number } | null = null; // eslint-disable-line @typescript-eslint/no-explicit-any
async function metas() {
  if (!metaCache || Date.now() - metaCache.at > 600_000) {
    const [perps, spot] = await Promise.all([info({ type: 'meta' }), info({ type: 'spotMeta' })]);
    metaCache = { perps, spot, at: Date.now() };
  }
  return metaCache;
}

/** coin = "BTC" for perps, "PURR/USDC" or "@107" for spot. */
export async function assetFor(coin: string, spot: boolean): Promise<HlAsset> {
  const { perps, spot: sm } = await metas();
  if (!spot) {
    const i = perps.universe.findIndex((u: { name: string }) => u.name === coin);
    if (i < 0) throw new Error(`${coin} is not a Hyperliquid perp.`);
    return { asset: i, szDecimals: perps.universe[i].szDecimals, spot: false, midKey: coin };
  }
  const pair = sm.universe.find((u: { name: string; index: number }) => u.name === coin || `@${u.index}` === coin);
  if (!pair) throw new Error(`${coin} is not a Hyperliquid spot pair.`);
  const base = sm.tokens.find((t: { index: number }) => t.index === pair.tokens[0]);
  return { asset: 10_000 + pair.index, szDecimals: base.szDecimals, spot: true, midKey: pair.name === 'PURR/USDC' ? 'PURR/USDC' : `@${pair.index}` };
}

export async function midPrice(a: HlAsset): Promise<number> {
  const mids = await info({ type: 'allMids' });
  const p = Number(mids[a.midKey]);
  if (!p) throw new Error('No live price for this market right now.');
  return p;
}

// Hyperliquid price rules: at most 5 significant figures and (6 perps / 8 spot) − szDecimals decimals.
const trim = (s: string) => (s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s) || '0';
export function fmtPrice(p: number, a: HlAsset): string {
  const maxDec = Math.max(0, (a.spot ? 8 : 6) - a.szDecimals);
  const sig = Number(p.toPrecision(5));
  return trim(sig.toFixed(maxDec));
}
export const fmtSize = (s: number, a: HlAsset) => trim((Math.floor(s * 10 ** a.szDecimals) / 10 ** a.szDecimals).toFixed(a.szDecimals));

/**
 * Market order as Hyperliquid's site does it: an immediate-or-cancel limit at the mid
 * price ± slippage. `size` is in the base coin.
 */
export async function marketOrder(agent: ethers.Wallet, a: HlAsset, isBuy: boolean, size: number, slippageBps: number, reduceOnly = false) {
  const mid = await midPrice(a);
  const px = mid * (isBuy ? 1 + slippageBps / 10_000 : 1 - slippageBps / 10_000);
  const sz = fmtSize(size, a);
  if (Number(sz) <= 0) throw new Error('Order size is below this market’s minimum step.');
  const action = {
    type: 'order',
    orders: [{ a: a.asset, b: isBuy, p: fmtPrice(px, a), s: sz, r: reduceOnly, t: { limit: { tif: 'Ioc' } } }],
    grouping: 'na',
  };
  const nonce = Date.now();
  const res = await exchange(action, nonce, await signL1(agent, action, nonce));
  const st = res?.data?.statuses?.[0];
  if (st?.error) throw new Error(st.error);
  if (st?.filled) return { size: Number(st.filled.totalSz), avgPx: Number(st.filled.avgPx) };
  throw new Error('Order was not filled (no liquidity inside your slippage). Try a larger slippage.');
}

export interface HlBalances { perpUsdc: number; spot: Record<string, number>; positions: Record<string, number> }
export async function balances(user: string): Promise<HlBalances> {
  const [perp, spot] = await Promise.all([info({ type: 'clearinghouseState', user }), info({ type: 'spotClearinghouseState', user })]);
  const positions: Record<string, number> = {};
  for (const p of perp.assetPositions ?? []) positions[p.position.coin] = Number(p.position.szi);
  const spotBal: Record<string, number> = {};
  for (const b of spot.balances ?? []) spotBal[b.coin] = Number(b.total) - Number(b.hold ?? 0);
  return { perpUsdc: Number(perp.withdrawable ?? 0), spot: spotBal, positions };
}

/** Deposit USDC from Arbitrum into the user's Hyperliquid account (min 5 USDC). */
export async function depositUsdc(signer: ethers.Signer, amount: string) {
  if (Number(amount) < 5) throw new Error('Hyperliquid’s minimum deposit is 5 USDC. Smaller deposits are lost.');
  const usdc = new ethers.Contract(ARB_USDC, ['function transfer(address,uint256) returns (bool)'], signer);
  const tx = await usdc.transfer(HL_BRIDGE, ethers.parseUnits(amount, 6));
  await tx.wait();
  return tx.hash as string;
}
