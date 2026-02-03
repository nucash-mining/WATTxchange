/**
 * MM2 Service - Komodo DeFi Framework Integration
 *
 * This service integrates with the Komodo DeFi Framework (mm2/kdf) for trustless
 * atomic swaps between WATTx and other cryptocurrencies.
 *
 * API Documentation: https://developers.komodoplatform.com/basic-docs/atomicdex-api-20/
 */

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
    // Generate a random userpass for this session
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    this.userpass = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    this.rpcPassword = this.userpass;
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
   * Make an RPC call to mm2
   */
  private async rpcCall<T>(method: string, params: Record<string, any> = {}): Promise<MM2Response<T>> {
    try {
      const body = {
        userpass: this.userpass,
        method,
        ...params
      };

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
      const servers = options.electrumServers || coinConfig.electrum || [];

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
