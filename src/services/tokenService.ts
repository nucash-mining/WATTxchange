interface Token {
  symbol: string;
  name: string;
  address?: string;
  decimals: number;
  logo: string;
  isNative: boolean;
  chainId?: number;
}

interface TokenList {
  [chainSymbol: string]: Token[];
}

class TokenService {
  private tokens: TokenList = {
    ETH: [
      {
        symbol: 'ETH',
        name: 'Ethereum',
        decimals: 18,
        logo: '/ETH logo.png',
        isNative: true,
        chainId: 1
      },
      {
        symbol: 'wBTC',
        name: 'Wrapped Bitcoin',
        address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
        decimals: 8,
        logo: '/BTC logo.png',
        isNative: false,
        chainId: 1
      },
      {
        symbol: 'wXMR',
        name: 'Wrapped Monero',
        address: '0x8dAEBADE922dF735c38C80C7eBD708Af50815fAa',
        decimals: 12,
        logo: '/XMR logo.png',
        isNative: false,
        chainId: 1
      },
      {
        symbol: 'wGHOST',
        name: 'Wrapped GHOST',
        address: '0x4C327471C44B2dacD6E90525f9D629bd2e4f662C',
        decimals: 8,
        logo: '/GHOST logo.png',
        isNative: false,
        chainId: 1
      },
      {
        symbol: 'wLTC',
        name: 'Wrapped Litecoin',
        address: '0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1',
        decimals: 8,
        logo: '/LTC logo.png',
        isNative: false,
        chainId: 1
      },
      {
        symbol: 'USDT',
        name: 'Tether USD',
        address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        decimals: 6,
        logo: '/USDT logo.png',
        isNative: false,
        chainId: 1
      },
      {
        symbol: 'DAI',
        name: 'Dai Stablecoin',
        address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        decimals: 18,
        logo: '/DAI logo.png',
        isNative: false,
        chainId: 1
      }
    ],
    ALT: [
      {
        symbol: 'ALT',
        name: 'Altcoinchain',
        decimals: 18,
        logo: '/Altcoinchain logo.png',
        isNative: true,
        chainId: 2330
      },
      {
        symbol: 'wALT',
        name: 'Wrapped ALT',
        address: '0x48721ADeFE5b97101722c0866c2AffCE797C32b6',
        decimals: 18,
        logo: '/Altcoinchain logo.png',
        isNative: false,
        chainId: 2330
      },
      {
        symbol: 'WATT',
        name: 'WATT Token',
        address: '0x6645143e49B3a15d8F205658903a55E520444698',
        decimals: 18,
        logo: '/WATT logo.png',
        isNative: false,
        chainId: 2330
      },
      {
        symbol: 'AltPEPE',
        name: 'AltPEPE Token',
        address: '0xd350ecd60912913cc15d312ef38adeca909ecdd5',
        decimals: 18,
        logo: '/PEPE logo.png',
        isNative: false,
        chainId: 2330
      },
      {
        symbol: 'AltPEPI',
        name: 'AltPEPI Token',
        address: '0xbb1f8b3a73a0b5084af9a95e748f9d84ddba6e88',
        decimals: 18,
        logo: '/PEPI logo.png',
        isNative: false,
        chainId: 2330
      },
      {
        symbol: 'SCAM',
        name: 'SCAM Token',
        address: '0x75b37574c2317ccba905e2c628d949710627c20a',
        decimals: 18,
        logo: '/SCAM logo.png',
        isNative: false,
        chainId: 2330
      },
      {
        symbol: 'SWAPD',
        name: 'SWAPD Token',
        address: '0x67e7ebda5cba73f5830538b03e678a1b45517dd7',
        decimals: 18,
        logo: '/SWAPD logo.png',
        isNative: false,
        chainId: 2330
      },
      {
        symbol: 'MALT',
        name: 'MALT Token',
        address: '0xaf5d066eb3e4147325d3ed23f94bc925fbf3b9ef',
        decimals: 18,
        logo: '/MALT logo.png',
        isNative: false,
        chainId: 2330
      },
      {
        symbol: 'wBTC',
        name: 'Wrapped Bitcoin',
        address: '0x48721ADeFE5b97101722c0866c2AffCE797C32b6',
        decimals: 8,
        logo: '/BTC logo.png',
        isNative: false,
        chainId: 2330
      },
      {
        symbol: 'wETH',
        name: 'Wrapped Ethereum',
        address: '0x347aAc6D939f98854110Ff48dC5B7beB52D86445',
        decimals: 18,
        logo: '/ETH logo.png',
        isNative: false,
        chainId: 2330
      },
      {
        symbol: 'wXMR',
        name: 'Wrapped Monero',
        address: '0xae168Ce47cebca9abbC5107a58df0532f1afa4d6',
        decimals: 12,
        logo: '/XMR logo.png',
        isNative: false,
        chainId: 2330
      },
      {
        symbol: 'wGHOST',
        name: 'Wrapped GHOST',
        address: '0x426b13031851947ce04C51670a6E9C622B18aa3C',
        decimals: 8,
        logo: '/GHOST logo.png',
        isNative: false,
        chainId: 2330
      },
      {
        symbol: 'wTROLL',
        name: 'Wrapped Trollcoin',
        address: '0xCF110A9F7c705604190f9Dd6FDf0FC79D00D569B',
        decimals: 8,
        logo: '/TROLL logo.png',
        isNative: false,
        chainId: 2330
      },
      {
        symbol: 'USDT',
        name: 'Tether USD',
        address: '0x5a03b79b6F4cbb1eC8276a87b74a9304D05442C7',
        decimals: 6,
        logo: '/USDT logo.png',
        isNative: false,
        chainId: 2330
      }
    ],
    MATIC: [
      {
        symbol: 'MATIC',
        name: 'Polygon',
        decimals: 18,
        logo: '/MATIC logo.png',
        isNative: true,
        chainId: 137
      },
      {
        symbol: 'WATT',
        name: 'WATT Token',
        address: '0xE960d5076cd3169C343Ee287A2c3380A222e5839',
        decimals: 18,
        logo: '/WATT logo.png',
        isNative: false,
        chainId: 137
      },
      {
        symbol: 'wS',
        name: 'Wrapped Sonic',
        address: '0x970a8b10147e3459d3cbf56329b76ac18d329728',
        decimals: 18,
        logo: '/S logo.png',
        isNative: false,
        chainId: 137
      },
      {
        symbol: 'wNU',
        name: 'Wrapped NU Token',
        address: '0xcbfcA68D10B2ec60a0FB2Bc58F7F0Bfd32CD5275',
        decimals: 18,
        logo: '/NU logo.png',
        isNative: false,
        chainId: 137
      },
      {
        symbol: 'USDT',
        name: 'Tether USD',
        address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
        decimals: 6,
        logo: '/USDT logo.png',
        isNative: false,
        chainId: 137
      },
      {
        symbol: 'DAI',
        name: 'Dai Stablecoin',
        address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
        decimals: 18,
        logo: '/DAI logo.png',
        isNative: false,
        chainId: 137
      }
    ]
  };

  private customTokens: TokenList = {};

  constructor() {
    this.loadCustomTokens();
  }

  private loadCustomTokens() {
    try {
      const saved = localStorage.getItem('custom_tokens');
      if (saved) {
        this.customTokens = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load custom tokens:', error);
    }
  }

  private saveCustomTokens() {
    try {
      localStorage.setItem('custom_tokens', JSON.stringify(this.customTokens));
    } catch (error) {
      console.error('Failed to save custom tokens:', error);
    }
  }

  getTokensForChain(chainSymbol: string): Token[] {
    const defaultTokens = this.tokens[chainSymbol] || [];
    const customTokens = this.customTokens[chainSymbol] || [];
    return [...defaultTokens, ...customTokens];
  }

  getToken(chainSymbol: string, tokenSymbol: string): Token | null {
    const tokens = this.getTokensForChain(chainSymbol);
    return tokens.find(token => token.symbol === tokenSymbol) || null;
  }

  async addCustomToken(chainSymbol: string, contractAddress: string): Promise<boolean> {
    try {
      // In a real implementation, this would query the contract for token details
      // For now, we'll create a basic token entry
      const tokenSymbol = `TOKEN_${Date.now()}`;
      const customToken: Token = {
        symbol: tokenSymbol,
        name: `Custom Token (${contractAddress.slice(0, 6)}...)`,
        address: contractAddress,
        decimals: 18, // Default, should be queried from contract
        logo: '/placeholder-token.png',
        isNative: false
      };

      if (!this.customTokens[chainSymbol]) {
        this.customTokens[chainSymbol] = [];
      }

      // Check if token already exists
      const exists = this.customTokens[chainSymbol].some(
        token => token.address?.toLowerCase() === contractAddress.toLowerCase()
      );

      if (exists) {
        throw new Error('Token already exists');
      }

      this.customTokens[chainSymbol].push(customToken);
      this.saveCustomTokens();
      return true;
    } catch (error) {
      console.error('Failed to add custom token:', error);
      return false;
    }
  }

  removeCustomToken(chainSymbol: string, tokenAddress: string): boolean {
    try {
      if (!this.customTokens[chainSymbol]) return false;

      const index = this.customTokens[chainSymbol].findIndex(
        token => token.address?.toLowerCase() === tokenAddress.toLowerCase()
      );

      if (index === -1) return false;

      this.customTokens[chainSymbol].splice(index, 1);
      this.saveCustomTokens();
      return true;
    } catch (error) {
      console.error('Failed to remove custom token:', error);
      return false;
    }
  }

  getSupportedChains(): string[] {
    return Object.keys(this.tokens);
  }

  // Get token balance (placeholder for future implementation)
  async getTokenBalance(chainSymbol: string, tokenAddress: string, walletAddress: string): Promise<string> {
    // This would integrate with Web3 providers to get actual token balances
    return '0';
  }

  // Get token address by symbol
  getTokenAddress(chainSymbol: string, tokenSymbol: string): string | undefined {
    const token = this.getToken(chainSymbol, tokenSymbol);
    return token?.address;
  }
}

export const tokenService = new TokenService();
export type { Token };