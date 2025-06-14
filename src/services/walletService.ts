import { ethers } from 'ethers';

interface WalletAddress {
  address: string;
  privateKey: string;
  publicKey: string;
  derivationPath: string;
  qrCode: string;
}

interface ChainConfig {
  name: string;
  symbol: string;
  chainId?: number;
  derivationPath: string;
  addressType: 'ethereum';
}

class WalletService {
  private mnemonic: string | null = null;
  private addresses: Map<string, WalletAddress[]> = new Map();
  private currentAddressIndex: Map<string, number> = new Map();

  // Only support EVM-compatible chains for wallet generation
  private chainConfigs: Record<string, ChainConfig> = {
    ETH: {
      name: 'Ethereum',
      symbol: 'ETH',
      chainId: 1,
      derivationPath: "m/44'/60'/0'/0",
      addressType: 'ethereum'
    },
    ALT: {
      name: 'Altcoinchain',
      symbol: 'ALT',
      chainId: 2330,
      derivationPath: "m/44'/60'/0'/0",
      addressType: 'ethereum'
    },
    WATT: {
      name: 'WATT Token',
      symbol: 'WATT',
      chainId: 2330,
      derivationPath: "m/44'/60'/0'/0",
      addressType: 'ethereum'
    }
  };

  async initializeFromMnemonic(mnemonic: string): Promise<boolean> {
    try {
      // Validate mnemonic
      if (!ethers.Mnemonic.isValidMnemonic(mnemonic)) {
        throw new Error('Invalid mnemonic phrase');
      }

      this.mnemonic = mnemonic;
      
      // Generate addresses for all supported chains
      for (const [symbol, config] of Object.entries(this.chainConfigs)) {
        await this.generateAddressForChain(symbol, 0);
      }

      return true;
    } catch (error) {
      console.error('Failed to initialize wallet:', error);
      return false;
    }
  }

  async initializeFromPrivateKey(privateKey: string, chainSymbol: string): Promise<boolean> {
    try {
      const config = this.chainConfigs[chainSymbol];
      if (!config) {
        throw new Error(`Unsupported chain: ${chainSymbol}`);
      }

      const wallet = new ethers.Wallet(privateKey);
      const address = wallet.address;
      const publicKey = wallet.publicKey;

      // Generate QR code data URL
      const qrCode = `data:image/svg+xml;base64,${btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
          <rect width="200" height="200" fill="white"/>
          <text x="100" y="100" text-anchor="middle" font-family="monospace" font-size="8" fill="black">
            ${address}
          </text>
        </svg>
      `)}`;

      const walletAddress: WalletAddress = {
        address,
        privateKey,
        publicKey,
        derivationPath: config.derivationPath + '/0',
        qrCode
      };

      if (!this.addresses.has(chainSymbol)) {
        this.addresses.set(chainSymbol, []);
      }
      this.addresses.get(chainSymbol)!.push(walletAddress);
      this.currentAddressIndex.set(chainSymbol, 0);

      return true;
    } catch (error) {
      console.error('Failed to initialize from private key:', error);
      return false;
    }
  }

  async initializeFromProvider(): Promise<boolean> {
    try {
      if (!window.ethereum) {
        throw new Error('No Web3 provider found');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      // For provider-based wallets, we can only get Ethereum-compatible addresses
      const ethereumChains = ['ETH', 'ALT', 'WATT'];
      
      for (const symbol of ethereumChains) {
        // Generate QR code data URL
        const qrCode = `data:image/svg+xml;base64,${btoa(`
          <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
            <rect width="200" height="200" fill="white"/>
            <text x="100" y="100" text-anchor="middle" font-family="monospace" font-size="8" fill="black">
              ${address}
            </text>
          </svg>
        `)}`;
        
        const walletAddress: WalletAddress = {
          address,
          privateKey: '', // Not available from provider
          publicKey: '', // Not available from provider
          derivationPath: this.chainConfigs[symbol].derivationPath + '/0',
          qrCode
        };

        if (!this.addresses.has(symbol)) {
          this.addresses.set(symbol, []);
        }
        this.addresses.get(symbol)!.push(walletAddress);
        this.currentAddressIndex.set(symbol, 0);
      }

      return true;
    } catch (error) {
      console.error('Failed to initialize from provider:', error);
      return false;
    }
  }

  private async generateAddressForChain(chainSymbol: string, index: number): Promise<WalletAddress> {
    if (!this.mnemonic) {
      throw new Error('Wallet not initialized');
    }

    const config = this.chainConfigs[chainSymbol];
    if (!config) {
      throw new Error(`Unsupported chain: ${chainSymbol}`);
    }

    const derivationPath = `${config.derivationPath}/${index}`;
    const hdNode = ethers.HDNodeWallet.fromMnemonic(
      ethers.Mnemonic.fromPhrase(this.mnemonic),
      derivationPath
    );
    
    const address = hdNode.address;
    const privateKey = hdNode.privateKey;
    const publicKey = hdNode.publicKey;

    // Generate QR code data URL
    const qrCode = `data:image/svg+xml;base64,${btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
        <rect width="200" height="200" fill="white"/>
        <text x="100" y="100" text-anchor="middle" font-family="monospace" font-size="8" fill="black">
          ${address}
        </text>
      </svg>
    `)}`;

    const walletAddress: WalletAddress = {
      address,
      privateKey,
      publicKey,
      derivationPath,
      qrCode
    };

    if (!this.addresses.has(chainSymbol)) {
      this.addresses.set(chainSymbol, []);
    }
    this.addresses.get(chainSymbol)!.push(walletAddress);

    return walletAddress;
  }

  async generateNewAddress(chainSymbol: string): Promise<WalletAddress> {
    const currentIndex = this.currentAddressIndex.get(chainSymbol) || 0;
    const newIndex = currentIndex + 1;
    
    const newAddress = await this.generateAddressForChain(chainSymbol, newIndex);
    this.currentAddressIndex.set(chainSymbol, newIndex);
    
    return newAddress;
  }

  getCurrentAddress(chainSymbol: string): WalletAddress | null {
    const addresses = this.addresses.get(chainSymbol);
    const currentIndex = this.currentAddressIndex.get(chainSymbol) || 0;
    
    if (!addresses || addresses.length === 0) {
      return null;
    }
    
    return addresses[currentIndex] || null;
  }

  getAllAddresses(chainSymbol: string): WalletAddress[] {
    return this.addresses.get(chainSymbol) || [];
  }

  getSupportedChains(): string[] {
    return Object.keys(this.chainConfigs);
  }

  getChainConfig(chainSymbol: string): ChainConfig | null {
    return this.chainConfigs[chainSymbol] || null;
  }

  isInitialized(): boolean {
    return this.addresses.size > 0;
  }

  clear(): void {
    this.mnemonic = null;
    this.addresses.clear();
    this.currentAddressIndex.clear();
  }
}

export const walletService = new WalletService();
export type { WalletAddress, ChainConfig };