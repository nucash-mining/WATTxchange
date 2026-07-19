// Live merged-mining hashrate stats from the pool's collector service
// (stats.wattxchange.app — polls the WATTx stratum dashboards and each parent
// chain's real network hashrate).

const STATS_BASE = 'https://stats.wattxchange.app:3345';

export interface ChainNetStats {
  net: string;            // 'testnet' | 'regtest'
  port: number;
  miners: number;
  shares: number;
  rejected: number;
  parent_blocks: number;
}

export interface ChainHashrate {
  chain: string;          // e.g. 'bitcoin'
  algo: string;           // e.g. 'sha256d'
  unit: string;           // 'H/s' | 'Sol/s'
  total_hashps: number | null;
  wattx_hashps: number;
  pct_of_chain: number | null;
  nets: ChainNetStats[];
}

export interface HashrateSnapshot {
  updated: number;
  wtx_block_reward: { testnet: number | null; regtest: number | null };
  chains: ChainHashrate[];
}

export interface HistoryPoint {
  t: number;
  total: number | null;
  wattx: number;
}

export type HashrateHistory = Record<string, HistoryPoint[]>;

class HashrateStatsService {
  async getCurrent(): Promise<HashrateSnapshot> {
    const res = await fetch(`${STATS_BASE}/api/hashrate`, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) throw new Error(`stats API HTTP ${res.status}`);
    return res.json();
  }

  async getHistory(): Promise<HashrateHistory> {
    const res = await fetch(`${STATS_BASE}/api/history`, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) throw new Error(`stats API HTTP ${res.status}`);
    return res.json();
  }
}

const UNITS = ['', 'K', 'M', 'G', 'T', 'P', 'E', 'Z'];

/** 1.23e21, 'H/s' -> "1.23 ZH/s" */
export function formatHashrate(v: number | null | undefined, unit = 'H/s'): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—';
  if (v === 0) return `0 ${unit}`;
  const tier = Math.min(Math.floor(Math.log10(Math.abs(v)) / 3), UNITS.length - 1);
  const scaled = v / 10 ** (tier * 3);
  return `${scaled >= 100 ? scaled.toFixed(0) : scaled.toFixed(2)} ${UNITS[Math.max(tier, 0)]}${unit}`;
}

/** Share of chain as a readable percentage, down to very small fractions. */
export function formatPct(pct: number | null | undefined): string {
  if (pct === null || pct === undefined || !Number.isFinite(pct)) return '—';
  if (pct === 0) return '0%';
  if (pct >= 0.01) return `${pct.toFixed(2)}%`;
  return `${pct.toExponential(2)}%`;
}

export const hashrateStatsService = new HashrateStatsService();
