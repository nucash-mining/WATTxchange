import { useState, useEffect } from 'react';
import { priceService, PriceData } from '../services/priceService';

export const usePrices = (symbols: string[] = ['ALT', 'BTC', 'ETH', 'LTC', 'XMR', 'DOGE', 'GHOST', 'TROLL', 'HTH', 'RTM', 'BNB', 'MATIC', 'AVAX', 'OP'], refreshInterval: number = 30000) => {
  const [prices, setPrices] = useState<Map<string, PriceData>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);

  const fetchPrices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Test API connectivity first
      const isConnected = await priceService.testConnection();
      setApiConnected(isConnected);
      
      const priceData = await priceService.getMultiplePrices(symbols);
      
      // Validate that we got valid price data
      let hasValidPrices = false;
      priceData.forEach((price) => {
        if (price && !isNaN(price.price) && price.price > 0) {
          hasValidPrices = true;
        }
      });

      if (!hasValidPrices) {
        throw new Error('No valid price data received');
      }

      setPrices(priceData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching prices:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch prices');
      
      // If we have no prices at all, set fallback prices
      if (prices.size === 0) {
        const fallbackPrices = new Map<string, PriceData>();
        symbols.forEach(symbol => {
          fallbackPrices.set(symbol, {
            symbol,
            price: symbol === 'ALT' ? 0.000173 : 
                   symbol === 'BTC' ? 50000 :
                   symbol === 'ETH' ? 3500 :
                   symbol === 'LTC' ? 120 :
                   symbol === 'XMR' ? 180 :
                   symbol === 'DOGE' ? 0.08 :
                   symbol === 'GHOST' ? 2.25 : 
                   symbol === 'TROLL' ? 0.000045 :
                   symbol === 'HTH' ? 0.00012 : 0,
            change24h: 0,
            changePercent24h: 0,
            high24h: 0,
            low24h: 0,
            volume24h: 0,
            marketCap: 0,
            lastUpdated: new Date(),
            source: 'Fallback'
          });
        });
        setPrices(fallbackPrices);
        setLastUpdated(new Date());
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();

    const interval = setInterval(fetchPrices, refreshInterval);
    return () => clearInterval(interval);
  }, [symbols.join(','), refreshInterval]);

  const getPrice = (symbol: string): PriceData | null => {
    return prices.get(symbol) || null;
  };

  const formatPrice = (symbol: string, decimals: number = 6): string => {
    const price = getPrice(symbol);
    if (!price || isNaN(price.price)) return '$0.00';
    
    if (price.price < 0.01) {
      return `$${price.price.toFixed(decimals)}`;
    }
    return `$${price.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatChange = (symbol: string): { value: string; isPositive: boolean } => {
    const price = getPrice(symbol);
    if (!price || price.changePercent24h === null || price.changePercent24h === undefined || isNaN(price.changePercent24h)) {
      return { value: '0.00%', isPositive: true };
    }
    
    const isPositive = price.changePercent24h >= 0;
    const value = `${isPositive ? '+' : ''}${price.changePercent24h.toFixed(2)}%`;
    
    return { value, isPositive };
  };

  const getTotalValue = (balances: Record<string, number>): number => {
    let total = 0;
    Object.entries(balances).forEach(([symbol, balance]) => {
      const price = getPrice(symbol);
      if (price && !isNaN(price.price) && !isNaN(balance)) {
        total += price.price * balance;
      }
    });
    return total;
  };

  // Get exchange rate between two cryptocurrencies
  const getExchangeRate = async (fromSymbol: string, toSymbol: string): Promise<number> => {
    return await priceService.getExchangeRate(fromSymbol, toSymbol);
  };

  // Convert ALT to BTC using fixed rate
  const convertAltToBtc = (altAmount: number): number => {
    return priceService.convertAltToBtc(altAmount);
  };

  // Convert BTC to ALT using fixed rate
  const convertBtcToAlt = (btcAmount: number): number => {
    return priceService.convertBtcToAlt(btcAmount);
  };

  return {
    prices,
    loading,
    error,
    lastUpdated,
    apiConnected,
    getPrice,
    formatPrice,
    formatChange,
    getTotalValue,
    getExchangeRate,
    convertAltToBtc,
    convertBtcToAlt,
    refetch: fetchPrices
  };
};