#!/usr/bin/env node
/**
 * genConfig.mjs — Generate the Komodo DeFi Framework (kdf/mm2) runtime config
 * from the shared coin source of truth.
 *
 * Outputs into the target dir (default: ./.mm2):
 *   - coins      : the kdf coins file (chain params; app-only `verified` stripped)
 *   - MM2.json   : the daemon config (gui, netid, rpc, passphrase, db dir)
 *
 * The app (src/config/mm2Coins.ts) reads the SAME JSON, so the daemon and UI
 * can't drift on address bytes.
 *
 * Env:
 *   MM2_PASSPHRASE   (required) BIP39 seed phrase for the trading wallet
 *   MM2_RPC_PASSWORD (required) RPC password the app uses to talk to kdf
 *   MM2_NETID        (default 7777)
 *   MM2_DATADIR      (default <repo>/.mm2)
 *   MM2_RPCIP        (default 127.0.0.1)
 *   MM2_RPCPORT      (default 7783)
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..');
const dataPath = join(repoRoot, 'src', 'config', 'mm2Coins.data.json');

const passphrase = process.env.MM2_PASSPHRASE;
const rpcPassword = process.env.MM2_RPC_PASSWORD;
if (!passphrase || !rpcPassword) {
  console.error(
    'ERROR: set MM2_PASSPHRASE (wallet seed) and MM2_RPC_PASSWORD before generating config.'
  );
  process.exit(1);
}

const netid = Number(process.env.MM2_NETID || 7777);
const dataDir = process.env.MM2_DATADIR || join(repoRoot, '.mm2');
const rpcip = process.env.MM2_RPCIP || '127.0.0.1';
const rpcport = Number(process.env.MM2_RPCPORT || 7783);

const { coins } = JSON.parse(readFileSync(dataPath, 'utf8'));

// kdf coins file: drop app-only fields, warn on unverified address bytes.
const unverified = [];
const kdfCoins = coins.map((c) => {
  const { verified, ...kdf } = c;
  if (!verified) unverified.push(kdf.coin);
  return kdf;
});

mkdirSync(dataDir, { recursive: true });

writeFileSync(join(dataDir, 'coins'), JSON.stringify(kdfCoins, null, 2));

const mm2Json = {
  gui: 'WATTxchange',
  netid,
  rpc_password: rpcPassword,
  passphrase,
  dbdir: join(dataDir, 'db'),
  rpcip,
  rpcport,
  rpc_local_only: false,
  i_am_seed: false
};
writeFileSync(join(dataDir, 'MM2.json'), JSON.stringify(mm2Json, null, 2));

console.log(`✔ wrote ${join(dataDir, 'coins')} (${kdfCoins.length} coins)`);
console.log(`✔ wrote ${join(dataDir, 'MM2.json')}`);
if (unverified.length) {
  console.warn(
    `⚠ UNVERIFIED address bytes for: ${unverified.join(', ')} — confirm with ` +
      `electrumx/derive-params.sh before trading these on mainnet.`
  );
}
