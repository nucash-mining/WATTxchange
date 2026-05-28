/**
 * useMM2 Hook - React hook for Komodo DeFi Framework (mm2) integration
 *
 * Provides easy-to-use state management and methods for atomic swaps.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  mm2Service,
  Balance,
  OrderBookResponse,
  MyOrder,
  SwapStatus,
  CoinConfig
} from '../services/mm2Service';

interface MM2State {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  version: string | null;
  enabledCoins: string[];
  balances: Record<string, Balance>;
  orderbook: OrderBookResponse | null;
  myOrders: {
    maker: Record<string, MyOrder>;
    taker: Record<string, MyOrder>;
  };
  activeSwaps: string[];
  recentSwaps: SwapStatus[];
}

interface UseMM2Options {
  autoConnect?: boolean;
  pollInterval?: number;
  rpcUrl?: string;
  rpcPassword?: string;
}

interface UseMM2Return extends MM2State {
  // Connection
  connect: () => Promise<boolean>;
  disconnect: () => void;

  // Coins
  enableCoin: (coin: string) => Promise<Balance | null>;
  disableCoin: (coin: string) => Promise<boolean>;
  getBalance: (coin: string) => Promise<Balance | null>;
  refreshBalances: () => Promise<void>;

  // Orderbook
  fetchOrderbook: (base: string, rel: string) => Promise<OrderBookResponse | null>;
  getBestPrice: (side: 'buy' | 'sell') => string | null;

  // Orders
  createMakerOrder: (
    base: string,
    rel: string,
    price: string,
    volume: string
  ) => Promise<MyOrder | null>;
  createBuyOrder: (
    base: string,
    rel: string,
    price: string,
    volume: string
  ) => Promise<string | null>;
  createSellOrder: (
    base: string,
    rel: string,
    price: string,
    volume: string
  ) => Promise<string | null>;
  cancelOrder: (uuid: string) => Promise<boolean>;
  cancelAllOrders: () => Promise<boolean>;
  refreshOrders: () => Promise<void>;

  // Swaps
  getSwapStatus: (uuid: string) => Promise<SwapStatus | null>;
  refreshSwaps: () => Promise<void>;

  // Configuration
  getSupportedCoins: () => CoinConfig[];
  getWATTxConfig: () => CoinConfig;
}

export function useMM2(options: UseMM2Options = {}): UseMM2Return {
  const {
    autoConnect = true,
    pollInterval = 30000,
    rpcUrl,
    rpcPassword
  } = options;

  const [state, setState] = useState<MM2State>({
    isConnected: false,
    isLoading: false,
    error: null,
    version: null,
    enabledCoins: [],
    balances: {},
    orderbook: null,
    myOrders: { maker: {}, taker: {} },
    activeSwaps: [],
    recentSwaps: []
  });

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentPair = useRef<{ base: string; rel: string } | null>(null);

  // Initialize service with custom URL/password if provided
  useEffect(() => {
    if (rpcUrl) {
      mm2Service.setRpcUrl(rpcUrl);
    }
    if (rpcPassword) {
      mm2Service.setRpcPassword(rpcPassword);
    }
  }, [rpcUrl, rpcPassword]);

  // Connect to mm2
  const connect = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const isRunning = await mm2Service.checkStatus();

      if (isRunning) {
        const version = await mm2Service.getVersion();
        const enabledCoinsResult = await mm2Service.getEnabledCoins();

        setState(prev => ({
          ...prev,
          isConnected: true,
          isLoading: false,
          version,
          enabledCoins: enabledCoinsResult?.result.map(c => c.ticker) || []
        }));

        return true;
      } else {
        setState(prev => ({
          ...prev,
          isConnected: false,
          isLoading: false,
          error: 'mm2 is not running'
        }));
        return false;
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isConnected: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      }));
      return false;
    }
  }, []);

  // Disconnect
  const disconnect = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setState(prev => ({
      ...prev,
      isConnected: false,
      enabledCoins: [],
      balances: {},
      orderbook: null,
      myOrders: { maker: {}, taker: {} },
      activeSwaps: [],
      recentSwaps: []
    }));
  }, []);

  // Enable coin
  const enableCoin = useCallback(async (coin: string): Promise<Balance | null> => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const balance = await mm2Service.enableCoin(coin);

      if (balance) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          enabledCoins: [...prev.enabledCoins.filter(c => c !== coin), coin],
          balances: { ...prev.balances, [coin]: balance }
        }));
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: `Failed to enable ${coin}`
        }));
      }

      return balance;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to enable coin'
      }));
      return null;
    }
  }, []);

  // Disable coin
  const disableCoin = useCallback(async (coin: string): Promise<boolean> => {
    try {
      const success = await mm2Service.disableCoin(coin);

      if (success) {
        setState(prev => ({
          ...prev,
          enabledCoins: prev.enabledCoins.filter(c => c !== coin),
          balances: Object.fromEntries(
            Object.entries(prev.balances).filter(([key]) => key !== coin)
          )
        }));
      }

      return success;
    } catch {
      return false;
    }
  }, []);

  // Get balance
  const getBalance = useCallback(async (coin: string): Promise<Balance | null> => {
    try {
      const balance = await mm2Service.getBalance(coin);

      if (balance) {
        setState(prev => ({
          ...prev,
          balances: { ...prev.balances, [coin]: balance }
        }));
      }

      return balance;
    } catch {
      return null;
    }
  }, []);

  // Refresh all balances
  const refreshBalances = useCallback(async () => {
    for (const coin of state.enabledCoins) {
      await getBalance(coin);
    }
  }, [state.enabledCoins, getBalance]);

  // Fetch orderbook
  const fetchOrderbook = useCallback(async (
    base: string,
    rel: string
  ): Promise<OrderBookResponse | null> => {
    try {
      currentPair.current = { base, rel };
      const orderbook = await mm2Service.getOrderbook(base, rel);

      if (orderbook) {
        setState(prev => ({ ...prev, orderbook }));
      }

      return orderbook;
    } catch {
      return null;
    }
  }, []);

  // Get best price from current orderbook
  const getBestPrice = useCallback((side: 'buy' | 'sell'): string | null => {
    if (!state.orderbook) return null;
    return mm2Service.getBestPrice(state.orderbook, side);
  }, [state.orderbook]);

  // Create maker order
  const createMakerOrder = useCallback(async (
    base: string,
    rel: string,
    price: string,
    volume: string
  ): Promise<MyOrder | null> => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const order = await mm2Service.setPrice(base, rel, price, volume);

      if (order) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          myOrders: {
            ...prev.myOrders,
            maker: { ...prev.myOrders.maker, [order.uuid]: order }
          }
        }));
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to create order'
        }));
      }

      return order;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create order'
      }));
      return null;
    }
  }, []);

  // Create buy order
  const createBuyOrder = useCallback(async (
    base: string,
    rel: string,
    price: string,
    volume: string
  ): Promise<string | null> => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const result = await mm2Service.buy(base, rel, price, volume);

      setState(prev => ({ ...prev, isLoading: false }));

      return result?.result.uuid || null;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create buy order'
      }));
      return null;
    }
  }, []);

  // Create sell order
  const createSellOrder = useCallback(async (
    base: string,
    rel: string,
    price: string,
    volume: string
  ): Promise<string | null> => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const result = await mm2Service.sell(base, rel, price, volume);

      setState(prev => ({ ...prev, isLoading: false }));

      return result?.result.uuid || null;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create sell order'
      }));
      return null;
    }
  }, []);

  // Cancel order
  const cancelOrder = useCallback(async (uuid: string): Promise<boolean> => {
    try {
      const success = await mm2Service.cancelOrder(uuid);

      if (success) {
        setState(prev => ({
          ...prev,
          myOrders: {
            maker: Object.fromEntries(
              Object.entries(prev.myOrders.maker).filter(([key]) => key !== uuid)
            ),
            taker: Object.fromEntries(
              Object.entries(prev.myOrders.taker).filter(([key]) => key !== uuid)
            )
          }
        }));
      }

      return success;
    } catch {
      return false;
    }
  }, []);

  // Cancel all orders
  const cancelAllOrders = useCallback(async (): Promise<boolean> => {
    try {
      const result = await mm2Service.cancelAllOrders();

      if (result) {
        setState(prev => ({
          ...prev,
          myOrders: { maker: {}, taker: {} }
        }));
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }, []);

  // Refresh orders
  const refreshOrders = useCallback(async () => {
    try {
      const orders = await mm2Service.getMyOrders();

      if (orders) {
        setState(prev => ({
          ...prev,
          myOrders: {
            maker: orders.maker_orders,
            taker: orders.taker_orders
          }
        }));
      }
    } catch {
      // Ignore errors
    }
  }, []);

  // Get swap status
  const getSwapStatus = useCallback(async (uuid: string): Promise<SwapStatus | null> => {
    return mm2Service.getSwapStatus(uuid);
  }, []);

  // Refresh swaps
  const refreshSwaps = useCallback(async () => {
    try {
      const [active, recent] = await Promise.all([
        mm2Service.getActiveSwaps(),
        mm2Service.getRecentSwaps({ limit: 20 })
      ]);

      setState(prev => ({
        ...prev,
        activeSwaps: active?.uuids || [],
        recentSwaps: recent?.swaps || []
      }));
    } catch {
      // Ignore errors
    }
  }, []);

  // Get supported coins
  const getSupportedCoins = useCallback(() => {
    return mm2Service.getSupportedCoins();
  }, []);

  // Get WATTx config
  const getWATTxConfig = useCallback(() => {
    return mm2Service.getWATTxConfig();
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // Poll for updates when connected
  useEffect(() => {
    if (state.isConnected && pollInterval > 0) {
      pollIntervalRef.current = setInterval(async () => {
        await refreshBalances();
        await refreshOrders();
        await refreshSwaps();

        if (currentPair.current) {
          await fetchOrderbook(currentPair.current.base, currentPair.current.rel);
        }
      }, pollInterval);

      return () => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
      };
    }
  }, [state.isConnected, pollInterval, refreshBalances, refreshOrders, refreshSwaps, fetchOrderbook]);

  return {
    ...state,
    connect,
    disconnect,
    enableCoin,
    disableCoin,
    getBalance,
    refreshBalances,
    fetchOrderbook,
    getBestPrice,
    createMakerOrder,
    createBuyOrder,
    createSellOrder,
    cancelOrder,
    cancelAllOrders,
    refreshOrders,
    getSwapStatus,
    refreshSwaps,
    getSupportedCoins,
    getWATTxConfig
  };
}

export default useMM2;
