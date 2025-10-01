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

interface CoinMarketCapResponse {
  data: {
    [key: string]: {
      quote: {
        USD: {
          price: number;
          percent_change_24h: number;
          volume_24h: number;
          market_cap: number;
        };
      };
    };
  };
}

interface CoinGeckoResponse {
  [key: string]: {
    usd: number;
    usd_24h_change: number;
    usd_24h_vol: number;
    usd_market_cap: number;
  };
}

interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  marketCap: number;
  lastUpdated: Date;
  source: string;
}

interface GasFees {
  slow: { gasPrice: string; estimatedTime: string };
  normal: { gasPrice: string; estimatedTime: string };
  fast: { gasPrice: string; estimatedTime: string };
  custom?: { gasPrice: string; estimatedTime: string };
}

class PriceService {
  private cache = new Map<string, { data: PriceData; timestamp: number }>();
  private cacheTimeout = 30000; // 30 seconds
  private gasFeeCache = new Map<number, { data: GasFees; timestamp: number }>();
  private gasCacheTimeout = 15000; // 15 seconds

  // API configurations
  private apis = {
    coinMarketCap: {
      baseUrl: 'https://pro-api.coinmarketcap.com/v1',
      key: import.meta.env.VITE_CMC_API_KEY || '',
      symbolMap: {
        'ALT': 'ALT',
        'BTC': 'BTC',
        'ETH': 'ETH',
        'LTC': 'LTC',
        'XMR': 'XMR',
        'DOGE': 'DOGE',
        'GHOST': 'GHOST',
        'TROLL': 'TROLL',
        'HTH': 'HTH',
        'RTM': 'RTM'
      }
    },
    coinGecko: {
      baseUrl: 'https://api.coingecko.com/api/v3',
      symbolMap: {
        'ALT': 'altcoinchain',
        'BTC': 'bitcoin',
        'ETH': 'ethereum',
        'LTC': 'litecoin',
        'XMR': 'monero',
        'DOGE': 'dogecoin',
        'GHOST': 'ghost',
        'TROLL': 'trollcoin',
        'HTH': 'help-the-homeless',
        'RTM': 'raptoreum'
      }
    },
    coinPaprika: {
      baseUrl: 'https://api.coinpaprika.com/v1',
      symbolMap: {
        'ALT': 'alt-altcoinchain',
        'BTC': 'btc-bitcoin',
        'ETH': 'eth-ethereum',
        'LTC': 'ltc-litecoin',
        'XMR': 'xmr-monero',
        'DOGE': 'doge-dogecoin',
        'GHOST': 'ghost-ghost',
        'TROLL': 'troll-trollcoin',
        'HTH': 'hth-help-the-homeless',
        'RTM': 'rtm-raptoreum'
      }
    },
    xeggex: {
      baseUrl: 'https://api.xeggex.com/api/v2',
      key: '66bba1cd7ab93af0c1869e2b6c26e572',
      secret: 'adbfd5ef52be687bb42b952b978d77d8fd8b5470c8ab24ee'
    }
  };

  // Exchange rates - 100,000 ALT = 0.00016 BTC
  private readonly ALT_TO_BTC_RATE = 0.00016 / 100000;

  // Fallback prices for when APIs are unavailable
  private fallbackPrices: Record<string, Partial<PriceData>> = {
    ALT: { symbol: 'ALT', price: 0.000173, changePercent24h: 0, volume24h: 1000000, marketCap: 173000 },
    BTC: { symbol: 'BTC', price: 50000, changePercent24h: 2.0, volume24h: 500, marketCap: 1000000000000 },
    ETH: { symbol: 'ETH', price: 3500, changePercent24h: 2.9, volume24h: 2000, marketCap: 420000000000 },
    LTC: { symbol: 'LTC', price: 120, changePercent24h: 4.3, volume24h: 800, marketCap: 8800000000 },
    XMR: { symbol: 'XMR', price: 180, changePercent24h: -2.7, volume24h: 300, marketCap: 3300000000 },
    DOGE: { symbol: 'DOGE', price: 0.08, changePercent24h: 6.7, volume24h: 50000, marketCap: 11000000000 },
    GHOST: { symbol: 'GHOST', price: 2.25, changePercent24h: 7.1, volume24h: 125000, marketCap: 45000000 },
    TROLL: { symbol: 'TROLL', price: 0.000045, changePercent24h: 7.1, volume24h: 2500000, marketCap: 900000 },
    HTH: { symbol: 'HTH', price: 0.00012, changePercent24h: 3.5, volume24h: 150000, marketCap: 1200000 },
    RTM: { symbol: 'RTM', price: 0.00085, changePercent24h: 2.8, volume24h: 350000, marketCap: 8500000 },
    BNB: { symbol: 'BNB', price: 310, changePercent24h: 1.8, volume24h: 2500000, marketCap: 47000000000 },
    MATIC: { symbol: 'MATIC', price: 0.42, changePercent24h: 3.2, volume24h: 850000, marketCap: 4200000000 },
    AVAX: { symbol: 'AVAX', price: 24.5, changePercent24h: 2.1, volume24h: 420000, marketCap: 9500000000 },
    OP: { symbol: 'OP', price: 1.85, changePercent24h: 4.7, volume24h: 180000, marketCap: 1900000000 }
  };

  async getPrice(symbol: string): Promise<PriceData | null> {
    try {
      // Check cache first
      const cached = this.cache.get(symbol);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }

      // Try multiple APIs and average the results
      const prices = await Promise.allSettled([
        this.fetchFromCoinMarketCap(symbol),
        this.fetchFromCoinGecko(symbol),
        this.fetchFromCoinPaprika(symbol),
        this.fetchFromXeggex(symbol)
      ]);

      const validPrices = prices
        .filter((result): result is PromiseFulfilledResult<PriceData> => 
          result.status === 'fulfilled' && result.value !== null
        )
        .map(result => result.value);

      if (validPrices.length === 0) {
        console.warn(`No valid prices found for ${symbol}, using fallback`);
        return this.createFallbackPrice(symbol);
      }

      // Calculate average price from multiple sources
      const averagePrice = this.calculateAveragePrice(validPrices);
      
      // Cache the result
      this.cache.set(symbol, { data: averagePrice, timestamp: Date.now() });
      
      return averagePrice;
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error);
      return this.createFallbackPrice(symbol);
    }
  }

  private async fetchFromCoinMarketCap(symbol: string): Promise<PriceData | null> {
    try {
      if (!this.apis.coinMarketCap.key) {
        throw new Error('CoinMarketCap API key not configured');
      }

      const cmcSymbol = this.apis.coinMarketCap.symbolMap[symbol];
      if (!cmcSymbol) return null;

      const response = await fetch(
        `${this.apis.coinMarketCap.baseUrl}/cryptocurrency/quotes/latest?symbol=${cmcSymbol}`,
        {
          headers: {
            'X-CMC_PRO_API_KEY': this.apis.coinMarketCap.key,
            'Accept': 'application/json'
          },
          signal: AbortSignal.timeout(10000)
        }
      );

      if (!response.ok) throw new Error(`CMC API error: ${response.status}`);

      const data: CoinMarketCapResponse = await response.json();
      const coinData = data.data[cmcSymbol];

      if (!coinData) return null;

      return {
        symbol,
        price: coinData.quote.USD.price,
        change24h: coinData.quote.USD.price * (coinData.quote.USD.percent_change_24h / 100),
        changePercent24h: coinData.quote.USD.percent_change_24h,
        high24h: coinData.quote.USD.price * 1.1, // Estimated
        low24h: coinData.quote.USD.price * 0.9, // Estimated
        volume24h: coinData.quote.USD.volume_24h,
        marketCap: coinData.quote.USD.market_cap,
        lastUpdated: new Date(),
        source: 'CoinMarketCap'
      };
    } catch (error) {
      console.warn(`CoinMarketCap API failed for ${symbol}:`, error);
      return null;
    }
  }

  private async fetchFromCoinGecko(symbol: string): Promise<PriceData | null> {
    try {
      const geckoId = this.apis.coinGecko.symbolMap[symbol];
      if (!geckoId) return null;

      const response = await fetch(
        `${this.apis.coinGecko.baseUrl}/simple/price?ids=${geckoId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`,
        { signal: AbortSignal.timeout(10000) }
      );

      if (!response.ok) throw new Error(`CoinGecko API error: ${response.status}`);

      const data: CoinGeckoResponse = await response.json();
      const coinData = data[geckoId];

      if (!coinData) return null;

      return {
        symbol,
        price: coinData.usd,
        change24h: coinData.usd * (coinData.usd_24h_change / 100),
        changePercent24h: coinData.usd_24h_change,
        high24h: coinData.usd * 1.1, // Estimated
        low24h: coinData.usd * 0.9, // Estimated
        volume24h: coinData.usd_24h_vol,
        marketCap: coinData.usd_market_cap,
        lastUpdated: new Date(),
        source: 'CoinGecko'
      };
    } catch (error) {
      console.warn(`CoinGecko API failed for ${symbol}:`, error);
      return null;
    }
  }

  private async fetchFromCoinPaprika(symbol: string): Promise<PriceData | null> {
    try {
      const paprikaId = this.apis.coinPaprika.symbolMap[symbol];
      if (!paprikaId) return null;

      const response = await fetch(
        `${this.apis.coinPaprika.baseUrl}/tickers/${paprikaId}`,
        { signal: AbortSignal.timeout(10000) }
      );

      if (!response.ok) throw new Error(`CoinPaprika API error: ${response.status}`);

      const data = await response.json();

      return {
        symbol,
        price: data.quotes.USD.price,
        change24h: data.quotes.USD.price * (data.quotes.USD.percent_change_24h / 100),
        changePercent24h: data.quotes.USD.percent_change_24h,
        high24h: data.quotes.USD.price * 1.1, // Estimated
        low24h: data.quotes.USD.price * 0.9, // Estimated
        volume24h: data.quotes.USD.volume_24h,
        marketCap: data.quotes.USD.market_cap,
        lastUpdated: new Date(),
        source: 'CoinPaprika'
      };
    } catch (error) {
      console.warn(`CoinPaprika API failed for ${symbol}:`, error);
      return null;
    }
  }

  private async fetchFromXeggex(symbol: string): Promise<PriceData | null> {
    try {
      const tradingPair = symbol === 'ALT' ? 'ALT_USDT' : 
                         symbol === 'GHOST' ? 'GHOST_USDT' :
                         symbol === 'TROLL' ? 'TROLL_USDT' :
                         symbol === 'HTH' ? 'HTH_USDT' :
                         symbol === 'RTM' ? 'RTM_USDT' :
                         `${symbol}_USDT`;
      
      const response = await fetch(
        `${this.apis.xeggex.baseUrl}/ticker/24hr?symbol=${tradingPair}`,
        {
          headers: {
            'Accept': 'application/json',
            'X-API-KEY': this.apis.xeggex.key,
          },
          signal: AbortSignal.timeout(10000)
        }
      );
      
      if (!response.ok) throw new Error(`XeggeX API error: ${response.status}`);

      const ticker: XeggeXTicker = await response.json();
      
      if (!ticker || typeof ticker.lastPrice !== 'string') {
        throw new Error('Invalid XeggeX response format');
      }

      return {
        symbol,
        price: parseFloat(ticker.lastPrice) || 0,
        change24h: parseFloat(ticker.priceChange) || 0,
        changePercent24h: parseFloat(ticker.priceChangePercent) || 0,
        high24h: parseFloat(ticker.highPrice) || 0,
        low24h: parseFloat(ticker.lowPrice) || 0,
        volume24h: parseFloat(ticker.volume) || 0,
        marketCap: 0, // Not provided by XeggeX
        lastUpdated: new Date(),
        source: 'XeggeX'
      };
    } catch (error) {
      console.warn(`XeggeX API failed for ${symbol}:`, error);
      return null;
    }
  }

  private calculateAveragePrice(prices: PriceData[]): PriceData {
    if (prices.length === 1) return prices[0];

    const avgPrice = prices.reduce((sum, p) => sum + p.price, 0) / prices.length;
    const avgChange = prices.reduce((sum, p) => sum + p.changePercent24h, 0) / prices.length;
    const avgVolume = prices.reduce((sum, p) => sum + p.volume24h, 0) / prices.length;
    const avgMarketCap = prices.reduce((sum, p) => sum + p.marketCap, 0) / prices.length;

    return {
      symbol: prices[0].symbol,
      price: avgPrice,
      change24h: avgPrice * (avgChange / 100),
      changePercent24h: avgChange,
      high24h: Math.max(...prices.map(p => p.high24h)),
      low24h: Math.min(...prices.map(p => p.low24h)),
      volume24h: avgVolume,
      marketCap: avgMarketCap,
      lastUpdated: new Date(),
      source: `Average of ${prices.map(p => p.source).join(', ')}`
    };
  }

  private createFallbackPrice(symbol: string): PriceData {
    const fallback = this.fallbackPrices[symbol];
    return {
      symbol,
      price: fallback?.price || 0,
      change24h: fallback?.price ? fallback.price * ((fallback.changePercent24h || 0) / 100) : 0,
      changePercent24h: fallback?.changePercent24h || 0,
      high24h: fallback?.price ? fallback.price * 1.1 : 0,
      low24h: fallback?.price ? fallback.price * 0.9 : 0,
      volume24h: fallback?.volume24h || 0,
      marketCap: fallback?.marketCap || 0,
      lastUpdated: new Date(),
      source: 'Fallback'
    };
  }

  async getGasFees(chainId: number): Promise<GasFees> {
    try {
      // Check cache first
      const cached = this.gasFeeCache.get(chainId);
      if (cached && Date.now() - cached.timestamp < this.gasCacheTimeout) {
        return cached.data;
      }

      let gasFees: GasFees;

      switch (chainId) {
        case 1: // Ethereum
          gasFees = await this.fetchEthereumGasFees();
          break;
        case 2330: // Altcoinchain
          gasFees = await this.fetchAltcoinchainGasFees();
          break;
        default:
          gasFees = this.getDefaultGasFees();
      }

      // Cache the result
      this.gasFeeCache.set(chainId, { data: gasFees, timestamp: Date.now() });
      
      return gasFees;
    } catch (error) {
      console.error(`Error fetching gas fees for chain ${chainId}:`, error);
      return this.getDefaultGasFees();
    }
  }

  private async fetchEthereumGasFees(): Promise<GasFees> {
    try {
      const response = await fetch('https://api.etherscan.io/api?module=gastracker&action=gasoracle');
      const data = await response.json();

      if (data.status === '1') {
        return {
          slow: { gasPrice: data.result.SafeGasPrice + ' gwei', estimatedTime: '5-10 min' },
          normal: { gasPrice: data.result.ProposeGasPrice + ' gwei', estimatedTime: '2-5 min' },
          fast: { gasPrice: data.result.FastGasPrice + ' gwei', estimatedTime: '< 2 min' }
        };
      }
    } catch (error) {
      console.warn('Failed to fetch Ethereum gas fees:', error);
    }

    return this.getDefaultGasFees();
  }

  private async fetchAltcoinchainGasFees(): Promise<GasFees> {
    // Altcoinchain typically has very low fees
    return {
      slow: { gasPrice: '1 gwei', estimatedTime: '1-2 min' },
      normal: { gasPrice: '2 gwei', estimatedTime: '30-60 sec' },
      fast: { gasPrice: '5 gwei', estimatedTime: '< 30 sec' }
    };
  }

  private getDefaultGasFees(): GasFees {
    return {
      slow: { gasPrice: '10 gwei', estimatedTime: '5-10 min' },
      normal: { gasPrice: '20 gwei', estimatedTime: '2-5 min' },
      fast: { gasPrice: '50 gwei', estimatedTime: '< 2 min' }
    };
  }

  async getMultiplePrices(symbols: string[]): Promise<Map<string, PriceData>> {
    const prices = new Map<string, PriceData>();
    
    const promises = symbols.map(async (symbol) => {
      try {
        const price = await this.getPrice(symbol);
        if (price) {
          prices.set(symbol, price);
        }
      } catch (error) {
        console.error(`Failed to get price for ${symbol}:`, error);
        const fallbackPrice = this.createFallbackPrice(symbol);
        prices.set(symbol, fallbackPrice);
      }
    });

    await Promise.allSettled(promises);
    return prices;
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

  clearCache(): void {
    this.cache.clear();
    this.gasFeeCache.clear();
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/ping', {
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const priceService = new PriceService();
export type { PriceData, GasFees };