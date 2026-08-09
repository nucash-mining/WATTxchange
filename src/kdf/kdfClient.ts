/**
 * In-browser Komodo DeFi Framework (kdf) transport.
 *
 * Runs the GleecBTC/Komodo kdf build (v3.0.0-beta WASM, kdflib_bg.wasm) directly
 * in the browser so WATTxchange.app is a real non-custodial DEX — private keys
 * and swap state never leave the page. Replaces the old design that POSTed to a
 * native kdf daemon at http://127.0.0.1:7783 (which only worked if the visitor
 * happened to run kdf locally).
 *
 * Browsers can't open raw TCP, so every coin must be activated against a WSS
 * Electrum endpoint — the electrum-*.wattxchange.app:443 relays already stood up
 * on the node server. See src/config/nodeEndpoints.ts.
 */

// wasm-pack "web" glue. The default export initialises the module; the named
// exports are the kdf C-ABI surface.
// @ts-ignore - shipped .js with a sibling .d.ts, no types resolution needed here
import initWasm, {
  mm2_main,
  mm2_main_status,
  mm2_rpc,
  mm2_version,
  MainStatus,
} from './kdflib.js';

export interface KdfBootConf {
  gui: string;
  netid: number;
  passphrase: string;
  rpc_password: string;
  coins: unknown[];
  seednodes?: string[];
}

export type KdfLogSink = (level: number, line: string) => void;

let wasmInit: Promise<unknown> | null = null;
let bootInFlight: Promise<void> | null = null;

/** Idempotently fetch + instantiate kdflib_bg.wasm. */
function ensureWasm(): Promise<unknown> {
  if (!wasmInit) wasmInit = initWasm();
  return wasmInit;
}

/** True once the framework's RPC layer is accepting calls. */
export function kdfIsUp(): boolean {
  try {
    return mm2_main_status() === MainStatus.RpcIsUp;
  } catch {
    return false;
  }
}

/**
 * Boot kdf in-browser and block until its RPC is up. Safe to call repeatedly —
 * a second call while already running resolves immediately.
 */
export function bootKdf(conf: KdfBootConf, onLog?: KdfLogSink): Promise<void> {
  if (bootInFlight) return bootInFlight;

  bootInFlight = (async () => {
    await ensureWasm();
    if (kdfIsUp()) return;

    const params = {
      conf: { mm2: 1, ...conf },
      log_level: 3,
    };
    const logCb = (level: number, line: string) => {
      onLog?.(level, line);
    };

    try {
      // Resolves when the framework has started spinning up its event loop.
      await mm2_main(params, logCb);
    } catch (e: unknown) {
      // AlreadyRunning (code 1) is benign; anything else that didn't actually
      // bring RPC up is a real failure. The wasm-bindgen error is an opaque
      // object with `code` and `message` getters — extract them so callers see
      // the real kdf reason (e.g. missing seednode) instead of "[object Object]".
      const err = e as { code?: number; message?: string; error?: string };
      const alreadyRunning = typeof e === 'object' && e !== null && err.code === 1;
      if (!alreadyRunning && !kdfIsUp()) {
        bootInFlight = null;
        const detail = err?.message ?? err?.error ?? (e instanceof Error ? e.message : String(e));
        throw new Error(`kdf mm2_main failed: ${detail}`);
      }
    }

    const deadline = Date.now() + 45_000;
    while (!kdfIsUp()) {
      if (Date.now() > deadline) {
        bootInFlight = null;
        throw new Error('kdf did not reach RpcIsUp within 45s');
      }
      await new Promise((r) => setTimeout(r, 250));
    }
  })();

  return bootInFlight;
}

/**
 * Issue a single kdf RPC. `payload` is the full legacy body including
 * `userpass` and `method`, or a v2 `{ userpass, mmrpc:'2.0', method, params }`.
 */
export async function kdfRpc<T = unknown>(payload: Record<string, unknown>): Promise<T> {
  await ensureWasm();
  return (await mm2_rpc(payload)) as T;
}

/** Synchronous version string once the module is loaded. */
export async function kdfVersion(): Promise<string> {
  await ensureWasm();
  const v = mm2_version() as { result?: string } | string;
  return typeof v === 'string' ? v : v.result ?? JSON.stringify(v);
}
