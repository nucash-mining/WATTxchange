/**
 * MM2 Service - Komodo DeFi Framework Integration
 *
 * This service integrates with the Komodo DeFi Framework (mm2/kdf) for trustless
 * atomic swaps between WATTx and other cryptocurrencies.
 *
 * API Documentation: https://developers.komodoplatform.com/basic-docs/atomicdex-api-20/
 */

import { WATTXCHANGE_COINS, getCoinConfig, electrumFor, toKdfCoinsFile } from '../config/mm2Coins';
import { getEndpoint, tradeableCoins } from '../config/nodeEndpoints';
import { bootKdf, kdfRpc, kdfIsUp } from '../kdf/kdfClient';

interface MM2Config {
  gui: string;
  netid: number;
  rpc_password: string;
  passphrase?: string;
  coins?: CoinConfig[];
}

interface CoinConfig {
  coin: string;
  name: string;
  fname: string;
  rpcport?: number;
  pubtype: number;
  p2shtype: number;
  wiftype: number;
  txfee: number;
  mm2?: number;
  required_confirmations?: number;
  avg_blocktime?: number;
  protocol?: {
    type: string;
    protocol_data?: {
      platform?: string;
      contract_address?: string;
    };
  };
  electrum?: ElectrumServer[];
  nodes?: RPCNode[];
}

interface ElectrumServer {
  url: string;
  protocol?: 'TCP' | 'SSL' | 'WSS';
}

interface RPCNode {
  url: string;
}

interface OrderBookEntry {
  coin: string;
  address: string;
  price: string;
  price_rat: [string, string];
  price_fraction: { numer: string; denom: string };
  max_volume: string;
  max_volume_rat: [string, string];
  max_volume_fraction: { numer: string; denom: string };
  min_volume: string;
  min_volume_rat: [string, string];
  min_volume_fraction: { numer: string; denom: string };
  pubkey: string;
  age: number;
  zcredits: number;
  uuid: string;
  is_mine: boolean;
}

interface OrderBookResponse {
  askdepth: number;
  asks: OrderBookEntry[];
  base: string;
  biddepth: number;
  bids: OrderBookEntry[];
  netid: number;
  numasks: number;
  numbids: number;
  rel: string;
  timestamp: number;
}

interface SwapStatus {
  uuid: string;
  my_order_uuid: string;
  events: SwapEvent[];
  my_info: {
    my_coin: string;
    other_coin: string;
    my_amount: string;
    other_amount: string;
    started_at: number;
  };
  maker_coin: string;
  taker_coin: string;
  maker_amount: string;
  taker_amount: string;
  type: 'Maker' | 'Taker';
  recoverable: boolean;
  success_events: string[];
  error_events: string[];
}

interface SwapEvent {
  event: {
    type: string;
    data?: any;
  };
  timestamp: number;
}

interface MyOrder {
  uuid: string;
  base: string;
  rel: string;
  max_base_vol: string;
  max_base_vol_rat: [string, string];
  min_base_vol: string;
  min_base_vol_rat: [string, string];
  price: string;
  price_rat: [string, string];
  created_at: number;
  updated_at: number | null;
  order_type: {
    type: 'FillOrKill' | 'GoodTillCancelled';
  };
  conf_settings: {
    base_confs: number;
    base_nota: boolean;
    rel_confs: number;
    rel_nota: boolean;
  };
}

interface Balance {
  address: string;
  balance: string;
  unspendable_balance: string;
  coin: string;
}

interface MM2Error {
  error: string;
  error_path: string;
  error_trace: string;
  error_type: string;
}

type MM2Response<T> = T | MM2Error;

class MM2Service {
  private rpcUrl: string = 'http://127.0.0.1:7783';
  private rpcPassword: string = '';
  private userpass: string = '';
  private isRunning: boolean = false;

  // Transport mode. In the browser kdf runs as WASM in-process (non-custodial,
  // keys never leave the page); set VITE_MM2_NATIVE=true to instead POST to a
  // local native kdf daemon at rpcUrl (desktop/Electron or dev against a node).
  private readonly useWasm: boolean =
    typeof window !== 'undefined' &&
    (import.meta as { env?: Record<string, string> }).env?.VITE_MM2_NATIVE !== 'true';
  // Private WATTx liquidity network. A browser WASM node cannot self-seed (no
  // inbound P2P), so it MUST bootstrap off a reachable kdf seed node on this
  // same netid, published as WSS multiaddrs in VITE_MM2_SEEDNODES. Stand up one
  // seed node (native kdf, i_am_seed=true) on the WATTxchange node server, then
  // set these two env vars — that is the only remaining step to a live orderbook.
  private netid: number =
    Number((import.meta as { env?: Record<string, string> }).env?.VITE_MM2_NETID) || 42;
  private seednodes: string[] = ((import.meta as { env?: Record<string, string> }).env
    ?.VITE_MM2_SEEDNODES || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  private wasmBooting: Promise<void> | null = null;

  // WATTx coin configuration
  private readonly WTX_CONFIG: CoinConfig = {
    coin: 'WTX',
    name: 'wattx',
    fname: 'WATTx',
    rpcport: 3889,
    pubtype: 73,      // 0x49 - addresses start with 'W'
    p2shtype: 75,     // 0x4b
    wiftype: 128,     // 0x80
    txfee: 100000,    // 0.001 WTX
    mm2: 1,
    required_confirmations: 3,
    avg_blocktime: 128,
    protocol: {
      type: 'QTUM'
    },
    electrum: [
      { url: 'electrum.wattxchange.app:50001', protocol: 'TCP' },
      { url: 'electrum.wattxchange.app:50002', protocol: 'SSL' }
    ]
  };

  // Common coins configuration
  private readonly SUPPORTED_COINS: CoinConfig[] = [
    this.WTX_CONFIG,
    {
      coin: 'BTC',
      name: 'bitcoin',
      fname: 'Bitcoin',
      rpcport: 8332,
      pubtype: 0,
      p2shtype: 5,
      wiftype: 128,
      txfee: 10000,
      mm2: 1,
      required_confirmations: 3,
      avg_blocktime: 600,
      protocol: { type: 'UTXO' },
      electrum: [
        { url: 'electrum.blockstream.info:50002', protocol: 'SSL' },
        { url: 'electrum3.bluewallet.io:50002', protocol: 'SSL' }
      ]
    },
    {
      coin: 'LTC',
      name: 'litecoin',
      fname: 'Litecoin',
      rpcport: 9332,
      pubtype: 48,
      p2shtype: 50,
      wiftype: 176,
      txfee: 100000,
      mm2: 1,
      required_confirmations: 3,
      avg_blocktime: 150,
      protocol: { type: 'UTXO' },
      electrum: [
        { url: 'electrum-ltc.bysh.me:50002', protocol: 'SSL' }
      ]
    },
    {
      coin: 'KMD',
      name: 'komodo',
      fname: 'Komodo',
      rpcport: 7771,
      pubtype: 60,
      p2shtype: 85,
      wiftype: 188,
      txfee: 10000,
      mm2: 1,
      required_confirmations: 2,
      avg_blocktime: 60,
      protocol: { type: 'UTXO' },
      electrum: [
        { url: 'electrum1.cipig.net:10001', protocol: 'TCP' },
        { url: 'electrum2.cipig.net:10001', protocol: 'TCP' }
      ]
    },
    {
      coin: 'DOGE',
      name: 'dogecoin',
      fname: 'Dogecoin',
      rpcport: 22555,
      pubtype: 30,
      p2shtype: 22,
      wiftype: 158,
      txfee: 100000000,
      mm2: 1,
      required_confirmations: 3,
      avg_blocktime: 60,
      protocol: { type: 'UTXO' },
      electrum: [
        { url: 'electrum1.cipig.net:10060', protocol: 'TCP' }
      ]
    }
  ];

  constructor() {
    this.generateUserpass();
  }

  private generateUserpass(): void {
    // kdf enforces a password policy on rpc_password (used at boot AND as the
    // `userpass` on every RPC): 8+ chars with an uppercase, lowercase, digit and
    // special char, must not contain the word "password", AND must not repeat the
    // same character three times in a row. A plain hex string frequently contains
    // a run like "000"/"aaa", so kdf rejected it intermittently at boot. Build the
    // secret character-by-character, guaranteeing every class and no triple-repeat.
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghijkmnopqrstuvwxyz';
    const digit = '23456789';
    const special = '@#%&*+=?';
    const all = upper + lower + digit + special;
    const pick = (set: string): string => {
      const r = new Uint32Array(1);
      crypto.getRandomValues(r);
      return set[r[0] % set.length];
    };
    // Seed one of each required class up front, then fill randomly.
    const required = [pick(upper), pick(lower), pick(digit), pick(special)];
    let pw = '';
    while (pw.length < 24) {
      const c = pw.length < required.length ? required[pw.length] : pick(all);
      // reject a char that would make three-in-a-row
      if (pw.length >= 2 && pw[pw.length - 1] === c && pw[pw.length - 2] === c) continue;
      pw += c;
    }
    this.userpass = pw;
    this.rpcPassword = pw;
  }

  /**
   * Set the RPC URL for mm2
   */
  setRpcUrl(url: string): void {
    this.rpcUrl = url;
  }

  /**
   * Set the RPC password
   */
  setRpcPassword(password: string): void {
    this.rpcPassword = password;
    this.userpass = password;
  }

  /**
   * Boot the in-browser kdf (WASM) engine and block until its RPC is up.
   * Idempotent. `passphrase` is the wallet seed; when omitted a random
   * view-only session seed is generated (fine for browsing orderbooks — no
   * user funds are exposed until they deposit to a derived address).
   */
  async startWasm(passphrase?: string): Promise<void> {
    if (!this.useWasm) return;
    if (kdfIsUp()) { this.isRunning = true; return; }
    if (this.wasmBooting) return this.wasmBooting;

    const seed = passphrase ?? this.generateSessionSeed();
    this.wasmBooting = bootKdf(
      {
        gui: 'WATTxchange',
        netid: this.netid,
        passphrase: seed,
        rpc_password: this.userpass,
        coins: toKdfCoinsFile(),
        ...(this.seednodes.length ? { seednodes: this.seednodes } : {}),
      },
      (level, line) => {
        if (level <= 2) console.warn('[kdf]', line);
      }
    ).then(() => { this.isRunning = true; });

    return this.wasmBooting;
  }

  private generateSessionSeed(): string {
    const words = new Uint32Array(8);
    crypto.getRandomValues(words);
    return 'wattxchange-session-' + Array.from(words, (w) => w.toString(16)).join('');
  }

  /**
   * Make an RPC call to kdf. In the browser this dispatches to the in-process
   * WASM engine; with VITE_MM2_NATIVE=true it POSTs to a native kdf daemon.
   */
  private async rpcCall<T>(method: string, params: Record<string, any> = {}): Promise<MM2Response<T>> {
    const body = {
      userpass: this.userpass,
      method,
      ...params
    };

    try {
      if (this.useWasm) {
        await this.startWasm();
        return (await kdfRpc<MM2Response<T>>(body));
      }

      const response = await fetch(this.rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data as MM2Response<T>;
    } catch (error) {
      console.error(`MM2 RPC error (${method}):`, error);
      throw error;
    }
  }

  /**
   * Check if mm2 is running and responding
   */
  async checkStatus(): Promise<boolean> {
    try {
      const response = await this.rpcCall<{ result: string }>('version');
      if ('result' in response) {
        this.isRunning = true;
        return true;
      }
      return false;
    } catch {
      this.isRunning = false;
      return false;
    }
  }

  /**
   * Get mm2 version
   */
  async getVersion(): Promise<string | null> {
    try {
      const response = await this.rpcCall<{ result: string }>('version');
      if ('result' in response) {
        return response.result;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Enable a coin for trading
   */
  async enableCoin(
    coin: string,
    options: {
      electrumServers?: ElectrumServer[];
      txHistory?: boolean;
    } = {}
  ): Promise<Balance | null> {
    try {
      const coinConfig = this.SUPPORTED_COINS.find(c => c.coin === coin);
      if (!coinConfig) {
        console.error(`Coin ${coin} not found in supported coins`);
        return null;
      }

      // Use provided electrum servers or defaults
      let servers = options.electrumServers || coinConfig.electrum || [];

      // In the browser, kdf-WASM can ONLY reach electrum over WS/WSS — it returns
      // an IRRECOVERABLE error for any TCP/SSL server ("'TCP' and 'SSL' are not
      // supported in a browser"), which aborts the whole enable even when a valid
      // WSS server is also listed. So drop non-websocket servers here.
      if (this.useWasm) {
        servers = servers.filter(s => s.protocol === 'WSS' || s.protocol === 'WS');
        if (servers.length === 0) {
          console.error(
            `enable ${coin}: no WS/WSS ElectrumX endpoint — a browser cannot use ` +
              `this coin's TCP/SSL servers. Add a WSS ElectrumX (see nodeEndpoints.ts).`
          );
          return null;
        }
      }

      const params = {
        coin,
        servers: servers.map(s => ({
          url: s.url,
          protocol: s.protocol || 'TCP'
        })),
        mm2: coinConfig.mm2 || 1,
        tx_history: options.txHistory ?? true,
        required_confirmations: coinConfig.required_confirmations || 3,
        requires_notarization: false
      };

      const response = await this.rpcCall<Balance>('electrum', params);

      if ('error' in response) {
        console.error(`Failed to enable ${coin}:`, response.error);
        return null;
      }

      return response as Balance;
    } catch (error) {
      console.error(`Error enabling coin ${coin}:`, error);
      return null;
    }
  }

  /**
   * Enable WATTx for trading
   */
  async enableWATTx(txHistory: boolean = true): Promise<Balance | null> {
    return this.enableCoin('WTX', { txHistory });
  }

  /**
   * Get balance for a coin
   */
  async getBalance(coin: string): Promise<Balance | null> {
    try {
      const response = await this.rpcCall<Balance>('my_balance', { coin });

      if ('error' in response) {
        console.error(`Failed to get balance for ${coin}:`, response.error);
        return null;
      }

      return response as Balance;
    } catch (error) {
      console.error(`Error getting balance for ${coin}:`, error);
      return null;
    }
  }

  /**
   * Get orderbook for a trading pair
   */
  async getOrderbook(base: string, rel: string): Promise<OrderBookResponse | null> {
    try {
      const response = await this.rpcCall<OrderBookResponse>('orderbook', { base, rel });

      if ('error' in response) {
        console.error(`Failed to get orderbook for ${base}/${rel}:`, response.error);
        return null;
      }

      return response as OrderBookResponse;
    } catch (error) {
      console.error(`Error getting orderbook for ${base}/${rel}:`, error);
      return null;
    }
  }

  /**
   * Create a maker order (set price)
   */
  async setPrice(
    base: string,
    rel: string,
    price: string,
    volume: string,
    options: {
      minVolume?: string;
      cancelPrevious?: boolean;
      baseConfs?: number;
      baseNota?: boolean;
      relConfs?: number;
      relNota?: boolean;
    } = {}
  ): Promise<MyOrder | null> {
    try {
      const params = {
        base,
        rel,
        price,
        volume,
        min_volume: options.minVolume,
        cancel_previous: options.cancelPrevious ?? true,
        conf_settings: {
          base_confs: options.baseConfs ?? 3,
          base_nota: options.baseNota ?? false,
          rel_confs: options.relConfs ?? 3,
          rel_nota: options.relNota ?? false
        }
      };

      const response = await this.rpcCall<{ result: MyOrder }>('setprice', params);

      if ('error' in response) {
        console.error(`Failed to set price:`, response.error);
        return null;
      }

      return (response as { result: MyOrder }).result;
    } catch (error) {
      console.error('Error setting price:', error);
      return null;
    }
  }

  /**
   * Create a buy order (taker order)
   */
  async buy(
    base: string,
    rel: string,
    price: string,
    volume: string,
    options: {
      orderType?: 'FillOrKill' | 'GoodTillCancelled';
      baseConfs?: number;
      baseNota?: boolean;
      relConfs?: number;
      relNota?: boolean;
    } = {}
  ): Promise<{ result: { uuid: string } } | null> {
    try {
      const params = {
        base,
        rel,
        price,
        volume,
        order_type: {
          type: options.orderType ?? 'GoodTillCancelled'
        },
        base_confs: options.baseConfs ?? 3,
        base_nota: options.baseNota ?? false,
        rel_confs: options.relConfs ?? 3,
        rel_nota: options.relNota ?? false
      };

      const response = await this.rpcCall<{ result: { uuid: string } }>('buy', params);

      if ('error' in response) {
        console.error(`Failed to create buy order:`, response.error);
        return null;
      }

      return response as { result: { uuid: string } };
    } catch (error) {
      console.error('Error creating buy order:', error);
      return null;
    }
  }

  /**
   * Create a sell order (taker order)
   */
  async sell(
    base: string,
    rel: string,
    price: string,
    volume: string,
    options: {
      orderType?: 'FillOrKill' | 'GoodTillCancelled';
      baseConfs?: number;
      baseNota?: boolean;
      relConfs?: number;
      relNota?: boolean;
    } = {}
  ): Promise<{ result: { uuid: string } } | null> {
    try {
      const params = {
        base,
        rel,
        price,
        volume,
        order_type: {
          type: options.orderType ?? 'GoodTillCancelled'
        },
        base_confs: options.baseConfs ?? 3,
        base_nota: options.baseNota ?? false,
        rel_confs: options.relConfs ?? 3,
        rel_nota: options.relNota ?? false
      };

      const response = await this.rpcCall<{ result: { uuid: string } }>('sell', params);

      if ('error' in response) {
        console.error(`Failed to create sell order:`, response.error);
        return null;
      }

      return response as { result: { uuid: string } };
    } catch (error) {
      console.error('Error creating sell order:', error);
      return null;
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(uuid: string): Promise<boolean> {
    try {
      const response = await this.rpcCall<{ result: string }>('cancel_order', { uuid });

      if ('error' in response) {
        console.error(`Failed to cancel order:`, response.error);
        return false;
      }

      return (response as { result: string }).result === 'success';
    } catch (error) {
      console.error('Error cancelling order:', error);
      return false;
    }
  }

  /**
   * Cancel all orders
   */
  async cancelAllOrders(cancelBy?: { type: 'All' | 'Pair' | 'Coin'; data?: { base?: string; rel?: string; coin?: string } }): Promise<{ cancelled: string[]; currently_matching: string[] } | null> {
    try {
      const params = cancelBy ? { cancel_by: cancelBy } : { cancel_by: { type: 'All' } };
      const response = await this.rpcCall<{ result: { cancelled: string[]; currently_matching: string[] } }>('cancel_all_orders', params);

      if ('error' in response) {
        console.error(`Failed to cancel all orders:`, response.error);
        return null;
      }

      return (response as { result: { cancelled: string[]; currently_matching: string[] } }).result;
    } catch (error) {
      console.error('Error cancelling all orders:', error);
      return null;
    }
  }

  /**
   * Get my orders
   */
  async getMyOrders(): Promise<{ maker_orders: Record<string, MyOrder>; taker_orders: Record<string, MyOrder> } | null> {
    try {
      const response = await this.rpcCall<{ result: { maker_orders: Record<string, MyOrder>; taker_orders: Record<string, MyOrder> } }>('my_orders');

      if ('error' in response) {
        console.error(`Failed to get my orders:`, response.error);
        return null;
      }

      return (response as { result: { maker_orders: Record<string, MyOrder>; taker_orders: Record<string, MyOrder> } }).result;
    } catch (error) {
      console.error('Error getting my orders:', error);
      return null;
    }
  }

  /**
   * Get swap status
   */
  async getSwapStatus(uuid: string): Promise<SwapStatus | null> {
    try {
      const response = await this.rpcCall<{ result: SwapStatus }>('my_swap_status', {
        params: { uuid }
      });

      if ('error' in response) {
        console.error(`Failed to get swap status:`, response.error);
        return null;
      }

      return (response as { result: SwapStatus }).result;
    } catch (error) {
      console.error('Error getting swap status:', error);
      return null;
    }
  }

  /**
   * Get recent swaps
   */
  async getRecentSwaps(
    options: {
      limit?: number;
      fromUuid?: string;
      myCoin?: string;
      otherCoin?: string;
      fromTimestamp?: number;
      toTimestamp?: number;
    } = {}
  ): Promise<{ swaps: SwapStatus[]; total: number } | null> {
    try {
      const params = {
        limit: options.limit ?? 10,
        from_uuid: options.fromUuid,
        my_coin: options.myCoin,
        other_coin: options.otherCoin,
        from_timestamp: options.fromTimestamp,
        to_timestamp: options.toTimestamp
      };

      const response = await this.rpcCall<{ result: { swaps: SwapStatus[]; total: number } }>('my_recent_swaps', params);

      if ('error' in response) {
        console.error(`Failed to get recent swaps:`, response.error);
        return null;
      }

      return (response as { result: { swaps: SwapStatus[]; total: number } }).result;
    } catch (error) {
      console.error('Error getting recent swaps:', error);
      return null;
    }
  }

  /**
   * Get active swaps
   */
  async getActiveSwaps(): Promise<{ uuids: string[] } | null> {
    try {
      const response = await this.rpcCall<{ result: { uuids: string[] } }>('active_swaps');

      if ('error' in response) {
        console.error(`Failed to get active swaps:`, response.error);
        return null;
      }

      return (response as { result: { uuids: string[] } }).result;
    } catch (error) {
      console.error('Error getting active swaps:', error);
      return null;
    }
  }

  /**
   * Get enabled coins
   */
  async getEnabledCoins(): Promise<{ result: Array<{ ticker: string; address: string }> } | null> {
    try {
      const response = await this.rpcCall<{ result: Array<{ ticker: string; address: string }> }>('get_enabled_coins');

      if ('error' in response) {
        console.error(`Failed to get enabled coins:`, response.error);
        return null;
      }

      return response as { result: Array<{ ticker: string; address: string }> };
    } catch (error) {
      console.error('Error getting enabled coins:', error);
      return null;
    }
  }

  /**
   * Disable a coin
   */
  async disableCoin(coin: string): Promise<boolean> {
    try {
      const response = await this.rpcCall<{ result: { coin: string } }>('disable_coin', { coin });

      if ('error' in response) {
        console.error(`Failed to disable coin ${coin}:`, response.error);
        return false;
      }

      return true;
    } catch (error) {
      console.error(`Error disabling coin ${coin}:`, error);
      return false;
    }
  }

  /**
   * Get WATTx configuration for mm2
   */
  getWATTxConfig(): CoinConfig {
    return this.WTX_CONFIG;
  }

  /**
   * Get all supported coins configurations
   */
  getSupportedCoins(): CoinConfig[] {
    return this.SUPPORTED_COINS;
  }

  /**
   * Generate mm2 startup configuration
   */
  generateMM2Config(passphrase: string, netid: number = 7777): MM2Config {
    return {
      gui: 'WATTxchange',
      netid,
      rpc_password: this.userpass,
      passphrase,
      coins: this.SUPPORTED_COINS
    };
  }

  /**
   * Calculate best price from orderbook
   */
  getBestPrice(orderbook: OrderBookResponse, side: 'buy' | 'sell'): string | null {
    if (side === 'buy') {
      // Best ask (lowest sell price)
      return orderbook.asks.length > 0 ? orderbook.asks[0].price : null;
    } else {
      // Best bid (highest buy price)
      return orderbook.bids.length > 0 ? orderbook.bids[0].price : null;
    }
  }

  /**
   * Calculate total volume available at a price level
   */
  getVolumeAtPrice(orderbook: OrderBookResponse, side: 'buy' | 'sell', maxPrice?: string): string {
    const entries = side === 'buy' ? orderbook.asks : orderbook.bids;
    let totalVolume = 0;

    for (const entry of entries) {
      if (maxPrice) {
        const price = parseFloat(entry.price);
        const limit = parseFloat(maxPrice);
        if (side === 'buy' && price > limit) break;
        if (side === 'sell' && price < limit) break;
      }
      totalVolume += parseFloat(entry.max_volume);
    }

    return totalVolume.toString();
  }

  /**
   * Format swap status to human-readable string
   */
  formatSwapStatus(swap: SwapStatus): string {
    const lastEvent = swap.events[swap.events.length - 1];
    const eventType = lastEvent?.event?.type || 'Unknown';

    const statusMap: Record<string, string> = {
      'Started': 'Swap started',
      'Negotiated': 'Negotiating...',
      'TakerFeeValidated': 'Validating taker fee...',
      'MakerPaymentReceived': 'Maker payment received',
      'MakerPaymentWaitConfirmStarted': 'Waiting for maker payment confirmations...',
      'MakerPaymentValidatedAndConfirmed': 'Maker payment confirmed',
      'TakerPaymentSent': 'Taker payment sent',
      'TakerPaymentSpent': 'Taker payment spent',
      'MakerPaymentSpent': 'Maker payment spent',
      'Finished': 'Swap completed successfully',
      'StartFailed': 'Swap failed to start',
      'NegotiateFailed': 'Negotiation failed',
      'TakerFeeValidateFailed': 'Taker fee validation failed',
      'MakerPaymentValidateFailed': 'Maker payment validation failed',
      'TakerPaymentTransactionFailed': 'Taker payment failed',
      'TakerPaymentWaitConfirmFailed': 'Taker payment confirmation failed',
      'TakerPaymentDataSendFailed': 'Failed to send taker payment data',
      'TakerPaymentWaitForSpendFailed': 'Failed waiting for taker payment spend',
      'MakerPaymentSpendFailed': 'Failed to spend maker payment',
      'TakerPaymentRefunded': 'Taker payment refunded',
      'MakerPaymentRefunded': 'Maker payment refunded'
    };

    return statusMap[eventType] || eventType;
  }

  // ---------------------------------------------------------------------------
  // WATTxchange wiring — drive the full coin set + swap lifecycle on our nodes.
  // ---------------------------------------------------------------------------

  /** Coins tradeable right now (EVM coins + UTXO coins with live ElectrumX). */
  getTradeableCoins(): string[] {
    return tradeableCoins();
  }

  /** Full WATTxchange coin set (includes coins still pending ElectrumX). */
  getWattxchangeCoins(): string[] {
    return WATTXCHANGE_COINS.map((c) => c.coin);
  }

  /**
   * Enable a coin using the WATTxchange node endpoints automatically:
   * - UTXO/QTUM coins are enabled over their ElectrumX servers.
   * - ETH/ERC20 coins are enabled over the chain's EVM RPC (requires the
   *   etomic swap contract address via VITE_<COIN>_SWAP_CONTRACT).
   */
  async enableCoinAuto(coin: string): Promise<Balance | null> {
    const cfg = getCoinConfig(coin);
    const endpoint = getEndpoint(coin);
    if (!cfg || !endpoint) {
      console.error(`enableCoinAuto: ${coin} not in WATTxchange config`);
      return null;
    }

    if (cfg.protocol.type === 'ETH' || cfg.protocol.type === 'ERC20') {
      const rpc = endpoint.evmRpc;
      if (!rpc) {
        console.error(`enableCoinAuto: no EVM RPC for ${coin}`);
        return null;
      }
      const swapContract =
        (import.meta as any).env?.[`VITE_${coin.toUpperCase()}_SWAP_CONTRACT`];
      if (!swapContract) {
        console.warn(
          `enableCoinAuto: VITE_${coin.toUpperCase()}_SWAP_CONTRACT not set — ` +
            `${coin} atomic swaps need the etomic swap contract deployed on chain.`
        );
      }
      const response = await this.rpcCall<Balance>('enable', {
        coin,
        urls: [rpc],
        swap_contract_address: swapContract,
        fallback_swap_contract: swapContract,
        tx_history: true
      });
      if ('error' in response) {
        console.error(`Failed to enable ${coin}:`, response.error);
        return null;
      }
      return response as Balance;
    }

    // UTXO / QTUM — needs a live ElectrumX server.
    const servers = electrumFor(coin);
    if (!endpoint.electrumReady || servers.length === 0) {
      console.error(
        `enableCoinAuto: ${coin} has no live ElectrumX yet (see electrumx/README.md)`
      );
      return null;
    }
    return this.enableCoin(coin, { electrumServers: servers, txHistory: true });
  }

  /** Withdraw + broadcast in one step. Returns the broadcast tx hash. */
  async withdraw(
    coin: string,
    to: string,
    amount: string | 'max'
  ): Promise<{ txHash: string } | null> {
    try {
      const withdrawParams =
        amount === 'max'
          ? { coin, to, max: true }
          : { coin, to, amount };
      const wres = await this.rpcCall<{ tx_hex: string }>('withdraw', withdrawParams);
      if ('error' in wres) {
        console.error(`withdraw ${coin} failed:`, wres.error);
        return null;
      }
      const txHex = (wres as { tx_hex: string }).tx_hex;
      const sres = await this.rpcCall<{ tx_hash: string }>('send_raw_transaction', {
        coin,
        tx_hex: txHex
      });
      if ('error' in sres) {
        console.error(`send_raw_transaction ${coin} failed:`, sres.error);
        return null;
      }
      return { txHash: (sres as { tx_hash: string }).tx_hash };
    } catch (error) {
      console.error(`withdraw error for ${coin}:`, error);
      return null;
    }
  }

  /** Address kdf derived for an enabled coin. */
  async getMyAddress(coin: string): Promise<string | null> {
    const balance = await this.getBalance(coin);
    return balance?.address ?? null;
  }

  /**
   * Place a taker trade (immediate swap against the orderbook).
   * `side: 'buy'` acquires `base` paying `rel`; `'sell'` sells `base` for `rel`.
   * Returns the swap uuid to track via waitForSwap().
   */
  async startTrade(
    side: 'buy' | 'sell',
    base: string,
    rel: string,
    price: string,
    volume: string
  ): Promise<string | null> {
    const res =
      side === 'buy'
        ? await this.buy(base, rel, price, volume)
        : await this.sell(base, rel, price, volume);
    return res?.result?.uuid ?? null;
  }

  /**
   * Poll a swap to completion. Resolves with the final status, calling
   * `onUpdate` on each state change. The HTLC escrow logic is handled by kdf:
   * it only releases each leg once the counterparty's on-chain payment is
   * confirmed and the secret is revealed.
   */
  async waitForSwap(
    uuid: string,
    options: {
      onUpdate?: (status: SwapStatus, human: string) => void;
      pollMs?: number;
      timeoutMs?: number;
    } = {}
  ): Promise<{ status: SwapStatus | null; success: boolean }> {
    const pollMs = options.pollMs ?? 5000;
    const timeoutMs = options.timeoutMs ?? 60 * 60 * 1000; // swaps can take a while
    const started = Date.now();
    let lastEvent = '';

    while (Date.now() - started < timeoutMs) {
      const status = await this.getSwapStatus(uuid);
      if (status) {
        const last = status.events[status.events.length - 1];
        const eventType = last?.event?.type || '';
        if (eventType !== lastEvent) {
          lastEvent = eventType;
          options.onUpdate?.(status, this.formatSwapStatus(status));
        }
        if (eventType === 'Finished') {
          // Success unless a terminal error event is present.
          const hadError = status.events.some(
            (e) => !!e.event?.type && status.error_events.includes(e.event.type)
          );
          return { status, success: !hadError };
        }
      }
      await new Promise((r) => setTimeout(r, pollMs));
    }
    return { status: await this.getSwapStatus(uuid), success: false };
  }
}

// Export singleton instance
export const mm2Service = new MM2Service();

// Export types
export type {
  MM2Config,
  CoinConfig,
  ElectrumServer,
  RPCNode,
  OrderBookEntry,
  OrderBookResponse,
  SwapStatus,
  SwapEvent,
  MyOrder,
  Balance,
  MM2Error
};
