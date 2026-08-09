/* Minimal hand-written types for the kdf (Komodo DeFi Framework) WASM glue.
 * Replaces the shipped wasm-bindgen .d.ts, which contains test symbols with
 * `::` that are not valid TypeScript. Only the surface WATTxchange uses is
 * declared here; the runtime kdflib.js is unchanged. */
export enum MainStatus {
  NotRunning = 0,
  NoContext = 1,
  NoRpc = 2,
  RpcIsUp = 3,
}
export function mm2_main(params: unknown, log_cb: (level: number, line: string) => void): Promise<number>;
export function mm2_main_status(): MainStatus;
export function mm2_rpc(payload: unknown): Promise<unknown>;
export function mm2_stop(): Promise<void>;
export function mm2_version(): unknown;
export function initSync(module: unknown): unknown;
export default function init(module_or_path?: unknown): Promise<unknown>;
