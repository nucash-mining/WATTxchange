/**
 * mm2Coins.ts — Komodo DeFi Framework (mm2/kdf) coin configuration for the
 * full WATTxchange trading set.
 *
 * mm2 performs trustless HTLC atomic swaps. For every coin it must know the
 * exact address bytes (pubtype / p2shtype / wiftype); a wrong byte makes the
 * engine derive the wrong addresses and the swap silently fails. The values
 * below are tagged `verified: true` only when sourced directly from that coin's
 * chainparams.cpp on this machine. Unverified entries carry best-known public
 * values and MUST be confirmed against the live node before mainnet swaps —
 * run electrumx/derive-params.sh against the coin's daemon to read the real
 * bytes + genesis hash, then flip `verified: true` in mm2Coins.data.json.
 *
 * Verified from local sources:
 *   WTX   pub 135 p2sh 137 wif 239   (WATTx TESTNET — the live fleet runs
 *         testnet until mainnet launch; p2pkh/p2sh confirmed 2026-07-15
 *         against live wattxd, wif from src/chainparams. Mainnet bytes for
 *         later: pub 73 p2sh 75 wif 128.)
 *   TROLL pub 66  p2sh 5   wif 153   (TrollCoin-2.0/src/chainparams.cpp)
 *   HTH   pub 100 p2sh 40  wif 228   (helpthehomelesscoin/src/chainparams.cpp)
 *   BITN  pub 25  p2sh 22  wif 158   (derived 2026-07-12 from live bitnetd
 *         mainnet wallet: getnewaddress/createmultisig/dumpprivkey decode)
 *   BTCZ  taddr 28 pub 184 p2sh 189 wif 128, txversion 4, overwintered 1
 *         (derived 2026-07-12 from live bitcoinzd mainnet wallet, same method)
 *   BTC/LTC/DOGE/KMD — canonical, well-known.
 */

import { getEndpoint, type ElectrumEndpoint } from './nodeEndpoints';
import coinsData from './mm2Coins.data.json';

export interface KdfCoinConfig {
  coin: string;
  name: string;
  fname: string;
  rpcport: number;
  pubtype: number;
  p2shtype: number;
  wiftype: number;
  txfee: number;
  dust?: number;
  /** Zcash-family two-byte address prefix (BTCZ t-addrs: 28). */
  taddr?: number;
  /** Zcash-family transaction version (BTCZ: 4). */
  txversion?: number;
  /** Zcash-family Overwinter/Sapling flag (BTCZ: 1). */
  overwintered?: number;
  /** True when this entry targets the coin's testnet chain (e.g. WTX). */
  is_testnet?: boolean;
  mm2: 1;
  required_confirmations: number;
  requires_notarization?: boolean;
  avg_blocktime: number;
  decimals?: number;
  protocol: {
    type: 'UTXO' | 'QTUM' | 'ETH' | 'ERC20';
    protocol_data?: {
      platform?: string;
      contract_address?: string;
    };
  };
  /** EVM chain id for ETH/ERC20-family coins. */
  chain_id?: number;
  /** True only when address bytes are confirmed against this coin's source. */
  verified: boolean;
}

/**
 * The coin set, sourced from mm2Coins.data.json — the single source of truth
 * shared with the daemon launcher (scripts/mm2/genConfig.mjs) so the app and
 * kdf can never disagree on chain bytes.
 */
export const WATTXCHANGE_COINS: KdfCoinConfig[] =
  (coinsData.coins as KdfCoinConfig[]);

/** Look up a coin config by ticker (case-insensitive). */
export function getCoinConfig(coin: string): KdfCoinConfig | undefined {
  return WATTXCHANGE_COINS.find((c) => c.coin === coin.toUpperCase());
}

/** Coins whose address bytes still need confirmation against the live node. */
export function unverifiedCoins(): string[] {
  return WATTXCHANGE_COINS.filter((c) => !c.verified).map((c) => c.coin);
}

/** Electrum servers for a coin, resolved from the node endpoint registry. */
export function electrumFor(coin: string): ElectrumEndpoint[] {
  return getEndpoint(coin)?.electrum ?? [];
}

/**
 * Emit a Komodo DeFi Framework `coins` file (the JSON array kdf reads at
 * startup). Strips the app-only `verified` flag.
 */
export function toKdfCoinsFile(): Omit<KdfCoinConfig, 'verified'>[] {
  return WATTXCHANGE_COINS.map(({ verified, ...kdf }) => {
    void verified;
    return kdf;
  });
}
