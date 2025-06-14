import { ethers } from 'ethers';
import * as bitcoin from 'bitcoinjs-lib';
import { ECPairFactory } from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import QRCode from 'qrcode';

const ECPair = ECPairFactory(ecc);

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
  addressType: 'ethereum' | 'bitcoin' | 'monero';
  network?: any;
}

class WalletService {
  private mnemonic: string | null = null;
  private addresses: Map<string, WalletAddress[]> = new Map();
  private currentAddressIndex: Map<string, number> = new Map();

  private chainConfigs: Record<string, ChainConfig> = {
    BTC: {
      name: 'Bitcoin',
      symbol: 'BTC',
      derivationPath: "m/44'/0'/0'/0",
      addressType: 'bitcoin',
      network: bitcoin.networks.bitcoin
    },
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
    LTC: {
      name: 'Litecoin',
      symbol: 'LTC',
      derivationPath: "m/44'/2'/0'/0",
      addressType: 'bitcoin',
      network: bitcoin.networks.litecoin
    },
    XMR: {
      name: 'Monero',
      symbol: 'XMR',
      derivationPath: "m/44'/128'/0'/0",
      addressType: 'monero'
    },
    GHOST: {
      name: 'GHOST',
      symbol: 'GHOST',
      derivationPath: "m/44'/0'/0'/0",
      addressType: 'bitcoin',
      network: bitcoin.networks.bitcoin
    },
    TROLL: {
      name: 'Trollcoin',
      symbol: 'TROLL',
      derivationPath: "m/44'/0'/0'/0",
      addressType: 'bitcoin',
      network: bitcoin.networks.bitcoin
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

      let address: string;
      let publicKey: string;

      if (config.addressType === 'ethereum') {
        const wallet = new ethers.Wallet(privateKey);
        address = wallet.address;
        publicKey = wallet.publicKey;
      } else if (config.addressType === 'bitcoin') {
        const keyPair = ECPair.fromPrivateKey(Buffer.from(privateKey.replace('0x', ''), 'hex'));
        const { address: btcAddress } = bitcoin.payments.p2pkh({ 
          pubkey: keyPair.publicKey, 
          network: config.network 
        });
        address = btcAddress!;
        publicKey = keyPair.publicKey.toString('hex');
      } else {
        throw new Error(`Address generation not implemented for ${config.addressType}`);
      }

      const qrCode = await QRCode.toDataURL(address);

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
        const qrCode = await QRCode.toDataURL(address);
        
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
    let address: string;
    let privateKey: string;
    let publicKey: string;

    if (config.addressType === 'ethereum') {
      const hdNode = ethers.HDNodeWallet.fromMnemonic(
        ethers.Mnemonic.fromPhrase(this.mnemonic),
        derivationPath
      );
      address = hdNode.address;
      privateKey = hdNode.privateKey;
      publicKey = hdNode.publicKey;
    } else if (config.addressType === 'bitcoin') {
      const seed = ethers.Mnemonic.fromPhrase(this.mnemonic).computeSeed();
      const root = bitcoin.bip32.fromSeed(seed, config.network);
      const child = root.derivePath(derivationPath);
      
      if (!child.privateKey) {
        throw new Error('Failed to derive private key');
      }

      const keyPair = ECPair.fromPrivateKey(child.privateKey, { network: config.network });
      const { address: btcAddress } = bitcoin.payments.p2pkh({ 
        pubkey: keyPair.publicKey, 
        network: config.network 
      });
      
      address = btcAddress!;
      privateKey = child.privateKey.toString('hex');
      publicKey = keyPair.publicKey.toString('hex');
    } else if (config.addressType === 'monero') {
      // Simplified Monero address generation (would need proper Monero libraries)
      const seed = ethers.Mnemonic.fromPhrase(this.mnemonic).computeSeed();
      const hash = ethers.keccak256(seed);
      address = '4' + hash.slice(2, 66); // Simplified Monero address format
      privateKey = hash;
      publicKey = hash.slice(0, 64);
    } else {
      throw new Error(`Address generation not implemented for ${config.addressType}`);
    }

    const qrCode = await QRCode.toDataURL(address);

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