interface XeggeXTicker {
  symbol: string;
  lastPrice: string;
  priceChange: string;
  priceChangePercent: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
}

interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  lastUpdated: Date;
}

class PriceService {
  private baseUrl = 'https://api.xeggex.com/api/v2';
  private apiKey = '66bba1cd7ab93af0c1869e2b6c26e572';
  private apiSecret = 'adbfd5ef52be687bb42b952b978d77d8fd8b5470c8ab24ee';
  private cache = new Map<string, { data: PriceData; timestamp: number }>();
  private cacheTimeout = 30000; // 30 seconds

  // Exchange rates - 100,000 ALT = 0.00016 BTC
  private readonly ALT_TO_BTC_RATE = 0.00016 / 100000; // 0.0000000016 BTC per ALT

  // Fallback prices for when API is unavailable
  private fallbackPrices: Record<string, Partial<PriceData>> = {
    ALT: {
      symbol: 'ALT',
      price: 0.000173, // USD price
      change24h: 0,
      changePercent24h: 0,
      high24h: 0.000173,
      low24h: 0.000173,
      volume24h: 1000000,
    },
    BTC: {
      symbol: 'BTC',
      price: 50000,
      change24h: 1000,
      changePercent24h: 2.0,
      high24h: 51000,
      low24h: 49000,
      volume24h: 500,
    },
    ETH: {
      symbol: 'ETH',
      price: 3500,
      change24h: 100,
      changePercent24h: 2.9,
      high24h: 3600,
      low24h: 3400,
      volume24h: 2000,
    },
    LTC: {
      symbol: 'LTC',
      price: 120,
      change24h: 5,
      changePercent24h: 4.3,
      high24h: 125,
      low24h: 115,
      volume24h: 800,
    },
    XMR: {
      symbol: 'XMR',
      price: 180,
      change24h: -5,
      changePercent24h: -2.7,
      high24h: 185,
      low24h: 175,
      volume24h: 300,
    },
    DOGE: {
      symbol: 'DOGE',
      price: 0.08,
      change24h: 0.005,
      changePercent24h: 6.7,
      high24h: 0.085,
      low24h: 0.075,
      volume24h: 50000,
    },
    GHOST: {
      symbol: 'GHOST',
      price: 2.25,
      change24h: 0.15,
      changePercent24h: 7.1,
      high24h: 2.35,
      low24h: 2.10,
      volume24h: 125000,
    },
    TROLL: {
      symbol: 'TROLL',
      price: 0.000045,
      change24h: 0.000003,
      changePercent24h: 7.1,
      high24h: 0.000048,
      low24h: 0.000042,
      volume24h: 2500000,
    }
  };

  private createFallbackPrice(symbol: string): PriceData {
    const fallback = this.fallbackPrices[symbol];
    return {
      symbol,
      price: fallback?.price || 0,
      change24h: fallback?.change24h || 0,
      changePercent24h: fallback?.changePercent24h || 0,
      high24h: fallback?.high24h || 0,
      low24h: fallback?.low24h || 0,
      volume24h: fallback?.volume24h || 0,
      lastUpdated: new Date()
    };
  }

  // Convert ALT to BTC using the fixed exchange rate
  convertAltToBtc(altAmount: number): number {
    return altAmount * this.ALT_TO_BTC_RATE;
  }

  // Convert BTC to ALT using the fixed exchange rate
  convertBtcToAlt(btcAmount: number): number {
    return btcAmount / this.ALT_TO_BTC_RATE;
  }

  // Get ALT price in BTC
  getAltPriceInBtc(): number {
    return this.ALT_TO_BTC_RATE;
  }

  // Get ALT price in USD based on BTC rate
  getAltPriceInUsd(btcPriceUsd?: number): number {
    const btcPrice = btcPriceUsd || 50000;
    return this.ALT_TO_BTC_RATE * btcPrice;
  }

  private getAuthHeaders(): HeadersInit {
    return {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-API-KEY': this.apiKey,
    };
  }

  async getPrice(symbol: string): Promise<PriceData | null> {
    try {
      // Check cache first
      const cached = this.cache.get(symbol);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }

      // Try to fetch from XeggeX API
      let priceData: PriceData;

      try {
        // For ALT, GHOST, and TROLL, we need to use the USDT pair
        const tradingPair = symbol === 'ALT' ? 'ALT_USDT' : 
                           symbol === 'GHOST' ? 'GHOST_USDT' :
                           symbol === 'TROLL' ? 'TROLL_USDT' :
                           `${symbol}_USDT`;
        
        const response = await fetch(`${this.baseUrl}/ticker/24hr?symbol=${tradingPair}`, {
          method: 'GET',
          headers: this.getAuthHeaders(),
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        
        if (!response.ok) {
          throw new Error(`XeggeX API error: ${response.status} ${response.statusText}`);
        }

        const ticker: XeggeXTicker = await response.json();
        
        // Validate the response data
        if (!ticker || typeof ticker.lastPrice !== 'string') {
          throw new Error('Invalid API response format');
        }

        priceData = {
          symbol: symbol,
          price: parseFloat(ticker.lastPrice) || 0,
          change24h: parseFloat(ticker.priceChange) || 0,
          changePercent24h: parseFloat(ticker.priceChangePercent) || 0,
          high24h: parseFloat(ticker.highPrice) || 0,
          low24h: parseFloat(ticker.lowPrice) || 0,
          volume24h: parseFloat(ticker.volume) || 0,
          lastUpdated: new Date()
        };

        // Validate parsed numbers
        if (isNaN(priceData.price) || priceData.price <= 0) {
          throw new Error('Invalid price data received');
        }

        console.log(`✅ XeggeX API success for ${symbol}:`, priceData);

      } catch (apiError) {
        console.warn(`⚠️ XeggeX API failed for ${symbol}, using fallback:`, apiError);
        // Use fallback data
        priceData = this.createFallbackPrice(symbol);
      }

      // Cache the result
      this.cache.set(symbol, { data: priceData, timestamp: Date.now() });
      
      return priceData;
    } catch (error) {
      console.error(`❌ Error in getPrice for ${symbol}:`, error);
      
      // Return fallback data as last resort
      return this.createFallbackPrice(symbol);
    }
  }

  async getMultiplePrices(symbols: string[]): Promise<Map<string, PriceData>> {
    const prices = new Map<string, PriceData>();
    
    // Process symbols in parallel but with individual error handling
    const promises = symbols.map(async (symbol) => {
      try {
        const price = await this.getPrice(symbol);
        if (price) {
          prices.set(symbol, price);
        }
      } catch (error) {
        console.error(`Failed to get price for ${symbol}:`, error);
        // Add fallback price even if individual fetch fails
        const fallbackPrice = this.createFallbackPrice(symbol);
        prices.set(symbol, fallbackPrice);
      }
    });

    await Promise.allSettled(promises); // Use allSettled to handle individual failures
    return prices;
  }

  // Get all available trading pairs from XeggeX
  async getTradingPairs(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/ticker/24hr`, {
        headers: this.getAuthHeaders(),
        signal: AbortSignal.timeout(10000)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const tickers: XeggeXTicker[] = await response.json();
      return Array.isArray(tickers) ? tickers.map(ticker => ticker.symbol) : [];
    } catch (error) {
      console.error('Error fetching trading pairs:', error);
      return ['ALT_USDT', 'BTC_USDT', 'ETH_USDT', 'LTC_USDT', 'GHOST_USDT', 'TROLL_USDT']; // Fallback pairs
    }
  }

  // Convert crypto price to USD using a reference rate
  async convertToUSD(symbol: string, amount: number): Promise<number> {
    const priceData = await this.getPrice(symbol);
    if (!priceData || isNaN(priceData.price)) return 0;
    
    return amount * priceData.price;
  }

  // Get exchange rate between two cryptocurrencies
  async getExchangeRate(fromSymbol: string, toSymbol: string): Promise<number> {
    if (fromSymbol === 'ALT' && toSymbol === 'BTC') {
      return this.ALT_TO_BTC_RATE;
    }
    
    if (fromSymbol === 'BTC' && toSymbol === 'ALT') {
      return 1 / this.ALT_TO_BTC_RATE;
    }

    // For other pairs, calculate via USD
    const fromPrice = await this.getPrice(fromSymbol);
    const toPrice = await this.getPrice(toSymbol);
    
    if (!fromPrice || !toPrice || isNaN(fromPrice.price) || isNaN(toPrice.price) || toPrice.price === 0) {
      return 0;
    }
    
    return fromPrice.price / toPrice.price;
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Test API connectivity
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/ticker/24hr?symbol=ALT_USDT`, {
        headers: this.getAuthHeaders(),
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const priceService = new PriceService();
export type { PriceData };