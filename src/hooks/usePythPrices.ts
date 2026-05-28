import { useState, useEffect } from 'react';
import { sonicService, SonicPriceFeed } from '../services/sonicService';

export interface PythPriceData {
  symbol: string;
  price: string;
  confidence: string;
  timestamp: number;
  change24h: string;
  volume24h: string;
}

export const usePythPrices = (symbols?: string[]) => {
  const [prices, setPrices] = useState<Record<string, PythPriceData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        setLoading(true);
        setError(null);

        const feeds = await sonicService.getPriceFeeds();
        
        const priceData: Record<string, PythPriceData> = {};
        
        feeds.forEach((feed: SonicPriceFeed) => {
          const symbol = feed.symbol.split('/')[0]; // Extract base symbol (e.g., BTC from BTC/USD)
          
          if (!symbols || symbols.includes(symbol)) {
            priceData[symbol] = {
              symbol: feed.symbol,
              price: feed.price,
              confidence: feed.confidence,
              timestamp: feed.timestamp,
              change24h: generateMockChange24h(),
              volume24h: generateMockVolume24h(symbol)
            };
          }
        });

        setPrices(priceData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch PYTH prices');
        console.error('Error fetching PYTH prices:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();

    // Set up polling for real-time updates
    const interval = setInterval(fetchPrices, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [symbols]);

  const getPrice = (symbol: string): PythPriceData | null => {
    return prices[symbol] || null;
  };

  const getPriceValue = (symbol: string): number => {
    const priceData = prices[symbol];
    return priceData ? parseFloat(priceData.price) : 0;
  };

  const getPriceChange = (symbol: string): number => {
    const priceData = prices[symbol];
    if (!priceData) return 0;
    
    const changeStr = priceData.change24h.replace('%', '');
    return parseFloat(changeStr);
  };

  const getVolume = (symbol: string): number => {
    const priceData = prices[symbol];
    if (!priceData) return 0;
    
    const volumeStr = priceData.volume24h.replace(/[,$]/g, '');
    return parseFloat(volumeStr);
  };

  const refreshPrices = async () => {
    try {
      setLoading(true);
      setError(null);

      const feeds = await sonicService.getPriceFeeds();
      
      const priceData: Record<string, PythPriceData> = {};
      
      feeds.forEach((feed: SonicPriceFeed) => {
        const symbol = feed.symbol.split('/')[0];
        
        if (!symbols || symbols.includes(symbol)) {
          priceData[symbol] = {
            symbol: feed.symbol,
            price: feed.price,
            confidence: feed.confidence,
            timestamp: feed.timestamp,
            change24h: generateMockChange24h(),
            volume24h: generateMockVolume24h(symbol)
          };
        }
      });

      setPrices(priceData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh PYTH prices');
      console.error('Error refreshing PYTH prices:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    prices,
    loading,
    error,
    getPrice,
    getPriceValue,
    getPriceChange,
    getVolume,
    refreshPrices
  };
};

// Helper functions for mock data generation
function generateMockChange24h(): string {
  const change = (Math.random() - 0.5) * 10; // -5% to +5%
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
}

function generateMockVolume24h(symbol: string): string {
  const baseVolumes: Record<string, number> = {
    'BTC': 25000000000, // $25B
    'ETH': 15000000000, // $15B
    'ALT': 50000000,    // $50M
    'WATT': 10000000,   // $10M
    'USDC': 5000000000  // $5B
  };

  const baseVolume = baseVolumes[symbol] || 1000000;
  const variation = 0.8 + Math.random() * 0.4; // 80% to 120% of base
  const volume = baseVolume * variation;

  if (volume >= 1000000000) {
    return `$${(volume / 1000000000).toFixed(1)}B`;
  } else if (volume >= 1000000) {
    return `$${(volume / 1000000).toFixed(1)}M`;
  } else if (volume >= 1000) {
    return `$${(volume / 1000).toFixed(1)}K`;
  } else {
    return `$${volume.toFixed(0)}`;
  }
}
