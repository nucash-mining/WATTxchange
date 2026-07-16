// Real on-chain price/volume history for SwapinDEX (UniswapV2) pairs on
// Altcoinchain 2330. Enumerates every pair from the live factory and turns
// each pair's full Sync-event history into OHLC candles (Swap events supply
// real volume). Event counts on ALT are small (max ~750 per pair), so a
// single full-range eth_getLogs per pair is fine over the tunnel RPC.
import { ethers } from 'ethers';
import { ALTCOINCHAIN, SWAPIN_LIVE, ALT_TOKENS } from '../config/altcoinchainContracts';

const SYNC_TOPIC = ethers.id('Sync(uint112,uint112)');
const SWAP_TOPIC = ethers.id('Swap(address,uint256,uint256,uint256,uint256,address)');

const FACTORY_ABI = [
  'function allPairsLength() view returns (uint256)',
  'function allPairs(uint256) view returns (address)',
  'function getPair(address tokenA, address tokenB) view returns (address)',
];
const PAIR_ABI = [
  'function token0() view returns (address)',
  'function token1() view returns (address)',
  'function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
];
const ERC20_ABI = [
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
];

export interface PairInfo {
  address: string;
  token0: string;         // address
  token1: string;         // address
  symbol0: string;        // display symbol (app naming when known)
  symbol1: string;
  decimals0: number;
  decimals1: number;
  reserve0: number;       // human units
  reserve1: number;
  /** token1 per token0 at current reserves */
  midPrice: number;
  syncCount?: number;
}

export interface Candle {
  time: number;   // unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number; // base-token units swapped in the bucket
}

interface PricePoint {
  block: number;
  price: number;  // quote per base
}

// Friendly names for tokens whose on-chain symbol differs from app naming.
const APP_SYMBOLS = new Map<string, string>(
  Object.entries(ALT_TOKENS).map(([sym, addr]) => [addr.toLowerCase(), sym])
);
// On-chain PEPE/PEPI on ALT are the AltPEPE/AltPEPI tokens.
const SYMBOL_ALIASES: Record<string, string> = { WALT: 'wALT', PEPE: 'AltPEPE', PEPI: 'AltPEPI' };

const PAIR_CACHE_KEY = 'wxc.pairList.v1';
const PAIR_CACHE_TTL = 10 * 60 * 1000;

class PairHistoryService {
  private provider = new ethers.JsonRpcProvider(ALTCOINCHAIN.rpcUrls[0], ALTCOINCHAIN.chainId, {
    staticNetwork: true,
  });
  private factory = new ethers.Contract(SWAPIN_LIVE.UniswapV2Factory, FACTORY_ABI, this.provider);
  private pairsPromise: Promise<PairInfo[]> | null = null;
  private historyCache = new Map<string, { at: number; points: PricePoint[]; swaps: { block: number; vol0: number; vol1: number }[] }>();
  private anchorCache: { at: number; latestBlock: number; latestTs: number; secPerBlock: number } | null = null;

  private displaySymbol(address: string, onchain: string): string {
    const app = APP_SYMBOLS.get(address.toLowerCase());
    if (app) return app;
    return SYMBOL_ALIASES[onchain] ?? onchain;
  }

  /** Every pair the live factory knows about, with live reserves. Cached. */
  async getAllPairs(force = false): Promise<PairInfo[]> {
    if (!force) {
      if (this.pairsPromise) return this.pairsPromise;
      try {
        const cached = JSON.parse(localStorage.getItem(PAIR_CACHE_KEY) ?? 'null');
        if (cached && Date.now() - cached.at < PAIR_CACHE_TTL) {
          this.pairsPromise = Promise.resolve(cached.pairs as PairInfo[]);
          return this.pairsPromise;
        }
      } catch { /* fall through to network */ }
    }
    this.pairsPromise = this.fetchAllPairs();
    this.pairsPromise
      .then((pairs) => {
        try { localStorage.setItem(PAIR_CACHE_KEY, JSON.stringify({ at: Date.now(), pairs })); } catch { /* quota */ }
      })
      .catch(() => { this.pairsPromise = null; });
    return this.pairsPromise;
  }

  private async fetchAllPairs(): Promise<PairInfo[]> {
    const n = Number(await this.factory.allPairsLength());
    const idx = Array.from({ length: n }, (_, i) => i);
    const pairs = await Promise.all(
      idx.map(async (i) => {
        try {
          const address: string = await this.factory.allPairs(i);
          const pair = new ethers.Contract(address, PAIR_ABI, this.provider);
          const [t0, t1, reserves] = await Promise.all([pair.token0(), pair.token1(), pair.getReserves()]);
          const [meta0, meta1] = await Promise.all([this.tokenMeta(t0), this.tokenMeta(t1)]);
          const r0 = Number(ethers.formatUnits(reserves[0], meta0.decimals));
          const r1 = Number(ethers.formatUnits(reserves[1], meta1.decimals));
          return {
            address,
            token0: t0,
            token1: t1,
            symbol0: this.displaySymbol(t0, meta0.symbol),
            symbol1: this.displaySymbol(t1, meta1.symbol),
            decimals0: meta0.decimals,
            decimals1: meta1.decimals,
            reserve0: r0,
            reserve1: r1,
            midPrice: r0 > 0 ? r1 / r0 : 0,
          } as PairInfo;
        } catch (error) {
          console.warn(`pairHistoryService: failed to read pair #${i}`, error);
          return null;
        }
      })
    );
    return pairs.filter((p): p is PairInfo => p !== null);
  }

  private tokenMetaCache = new Map<string, { symbol: string; decimals: number }>();
  private async tokenMeta(address: string): Promise<{ symbol: string; decimals: number }> {
    const key = address.toLowerCase();
    const hit = this.tokenMetaCache.get(key);
    if (hit) return hit;
    const erc20 = new ethers.Contract(address, ERC20_ABI, this.provider);
    const [symbol, decimals] = await Promise.all([
      erc20.symbol().catch(() => `${address.slice(0, 6)}…`),
      erc20.decimals().then(Number).catch(() => 18),
    ]);
    const meta = { symbol, decimals };
    this.tokenMetaCache.set(key, meta);
    return meta;
  }

  /** Resolve the pair address for two token addresses (zero address if none). */
  async findPair(tokenA: string, tokenB: string): Promise<string | null> {
    try {
      const pair: string = await this.factory.getPair(tokenA, tokenB);
      return pair === ethers.ZeroAddress ? null : pair;
    } catch {
      return null;
    }
  }

  /** Block-number → unix-time mapping anchored at the chain tip. */
  private async anchors() {
    if (this.anchorCache && Date.now() - this.anchorCache.at < 5 * 60 * 1000) return this.anchorCache;
    const latestBlock = await this.provider.getBlockNumber();
    const span = Math.min(200_000, latestBlock - 1);
    const [tip, past] = await Promise.all([
      this.provider.getBlock(latestBlock),
      this.provider.getBlock(latestBlock - span),
    ]);
    const secPerBlock = tip && past && span > 0 ? (tip.timestamp - past.timestamp) / span : 61;
    this.anchorCache = {
      at: Date.now(),
      latestBlock,
      latestTs: tip?.timestamp ?? Math.floor(Date.now() / 1000),
      secPerBlock: secPerBlock > 0 ? secPerBlock : 61,
    };
    return this.anchorCache;
  }

  private blockToTime(block: number, a: { latestBlock: number; latestTs: number; secPerBlock: number }): number {
    return Math.floor(a.latestTs - (a.latestBlock - block) * a.secPerBlock);
  }

  /**
   * Full price history for a pair from its Sync events, plus real swap volume.
   * `invert` charts token0-per-token1 instead of the native token1-per-token0.
   */
  async getHistory(pair: PairInfo, invert = false): Promise<PricePoint[]> {
    const raw = await this.rawHistory(pair);
    if (!invert) return raw.points;
    return raw.points.map((p) => ({ block: p.block, price: p.price > 0 ? 1 / p.price : 0 }));
  }

  private async rawHistory(pair: PairInfo) {
    const key = pair.address.toLowerCase();
    const hit = this.historyCache.get(key);
    if (hit && Date.now() - hit.at < 60 * 1000) return hit;

    const scale0 = 10 ** pair.decimals0;
    const scale1 = 10 ** pair.decimals1;
    const [syncLogs, swapLogs] = await Promise.all([
      this.provider.send('eth_getLogs', [
        { address: pair.address, topics: [SYNC_TOPIC], fromBlock: '0x0', toBlock: 'latest' },
      ]) as Promise<{ blockNumber: string; data: string }[]>,
      this.provider.send('eth_getLogs', [
        { address: pair.address, topics: [SWAP_TOPIC], fromBlock: '0x0', toBlock: 'latest' },
      ]).catch(() => []) as Promise<{ blockNumber: string; data: string }[]>,
    ]);

    const points: PricePoint[] = [];
    for (const log of syncLogs) {
      const r0 = Number(BigInt('0x' + log.data.slice(2, 66))) / scale0;
      const r1 = Number(BigInt('0x' + log.data.slice(66, 130))) / scale1;
      if (r0 > 0 && r1 > 0) points.push({ block: parseInt(log.blockNumber, 16), price: r1 / r0 });
    }
    points.sort((a, b) => a.block - b.block);

    const swaps = swapLogs.map((log) => {
      const words = log.data.slice(2).match(/.{64}/g) ?? [];
      const amount0In = Number(BigInt('0x' + (words[0] ?? '0'))) / scale0;
      const amount1In = Number(BigInt('0x' + (words[1] ?? '0'))) / scale1;
      const amount0Out = Number(BigInt('0x' + (words[2] ?? '0'))) / scale0;
      const amount1Out = Number(BigInt('0x' + (words[3] ?? '0'))) / scale1;
      return {
        block: parseInt(log.blockNumber, 16),
        vol0: amount0In + amount0Out,
        vol1: amount1In + amount1Out,
      };
    }).sort((a, b) => a.block - b.block);

    const entry = { at: Date.now(), points, swaps };
    this.historyCache.set(key, entry);
    return entry;
  }

  /**
   * OHLC candles for a pair. Price is quote-per-base where base/quote follow
   * `invert` (false: base=token0). Buckets with no trades carry the last close
   * forward so the chart is continuous from first liquidity to now.
   */
  async getCandles(pair: PairInfo, stepSec: number, maxCandles: number, invert = false): Promise<Candle[]> {
    const [{ points, swaps }, a] = await Promise.all([this.rawHistory(pair), this.anchors()]);
    if (points.length === 0) return [];

    const px = (p: number) => (invert ? (p > 0 ? 1 / p : 0) : p);
    const timed = points.map((p) => ({ time: this.blockToTime(p.block, a), price: px(p.price) }));
    const volTimed = swaps.map((s) => ({ time: this.blockToTime(s.block, a), vol: invert ? s.vol1 : s.vol0 }));

    const now = a.latestTs;
    const firstTime = Math.max(timed[0].time, now - stepSec * maxCandles);
    const startBucket = Math.floor(firstTime / stepSec) * stepSec;

    // seed with the last price at/before the window start
    let lastPrice = timed[0].price;
    for (const t of timed) {
      if (t.time <= startBucket) lastPrice = t.price; else break;
    }

    const candles: Candle[] = [];
    let i = timed.findIndex((t) => t.time > startBucket);
    if (i < 0) i = timed.length;
    let v = volTimed.findIndex((t) => t.time > startBucket);
    if (v < 0) v = volTimed.length;

    for (let bucket = startBucket; bucket <= now; bucket += stepSec) {
      const end = bucket + stepSec;
      const open = lastPrice;
      let high = open, low = open, close = open, volume = 0;
      while (i < timed.length && timed[i].time < end) {
        const p = timed[i].price;
        if (p > high) high = p;
        if (p < low) low = p;
        close = p;
        i++;
      }
      while (v < volTimed.length && volTimed[v].time < end) {
        volume += volTimed[v].vol;
        v++;
      }
      candles.push({ time: bucket, open, high, low, close, volume });
      lastPrice = close;
    }
    return candles;
  }
}

export const pairHistoryService = new PairHistoryService();
