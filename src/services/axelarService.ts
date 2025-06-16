import { ethers } from 'ethers';

interface AxelarNetwork {
  name: string;
  chainId: number;
  rpcUrl: string;
  gatewayAddress: string;
  gasServiceAddress: string;
  supportedTokens: string[];
  icon: string;
}

interface CrossChainTransfer {
  id: string;
  sourceChain: string;
  destinationChain: string;
  sourceToken: string;
  destinationToken: string;
  amount: string;
  recipient: string;
  status: 'pending' | 'confirmed' | 'executed' | 'failed';
  txHash?: string;
  timestamp: Date;
}

interface AxelarMessage {
  id: string;
  sourceChain: string;
  destinationChain: string;
  payload: string;
  status: 'pending' | 'approved' | 'executed' | 'failed';
  commandId?: string;
  timestamp: Date;
}

class AxelarService {
  // Axelar RPC endpoints
  private rpcEndpoint = 'https://rpc-axelar.imperator.co:443';
  private restEndpoint = 'https://rest-axelar.imperator.co';
  private gmpEndpoint = 'https://api.gmp.axelarscan.io';

  // Supported networks for cross-chain operations
  private supportedNetworks: Record<string, AxelarNetwork> = {
    ethereum: {
      name: 'Ethereum',
      chainId: 1,
      rpcUrl: 'https://ethereum.publicnode.com',
      gatewayAddress: '0x4F4495243837681061C4743b74B3eEdf548D56A5',
      gasServiceAddress: '0x2d5d7d31F671F86C782533cc367F14109a082712',
      supportedTokens: ['USDC', 'USDT', 'WETH', 'WBTC', 'DAI'],
      icon: '/ETH logo.png'
    },
    polygon: {
      name: 'Polygon',
      chainId: 137,
      rpcUrl: 'https://polygon.publicnode.com',
      gatewayAddress: '0x6f015F16De9fC8791b234eF68D486d2bF203FBA8',
      gasServiceAddress: '0x2d5d7d31F671F86C782533cc367F14109a082712',
      supportedTokens: ['USDC', 'USDT', 'WETH', 'WMATIC', 'WATT'],
      icon: '/MATIC logo.png'
    },
    avalanche: {
      name: 'Avalanche',
      chainId: 43114,
      rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
      gatewayAddress: '0x5029C0EFf6C34351a0CEc334542cDb22c7928f78',
      gasServiceAddress: '0x2d5d7d31F671F86C782533cc367F14109a082712',
      supportedTokens: ['USDC', 'USDT', 'WAVAX', 'WETH'],
      icon: '/AVAX logo.png'
    },
    fantom: {
      name: 'Fantom',
      chainId: 250,
      rpcUrl: 'https://rpc.ftm.tools',
      gatewayAddress: '0x304acf330bbE08d1e512eefaa92F6a57871fD895',
      gasServiceAddress: '0x2d5d7d31F671F86C782533cc367F14109a082712',
      supportedTokens: ['USDC', 'WFTM', 'WETH'],
      icon: '/FTM logo.png'
    },
    arbitrum: {
      name: 'Arbitrum',
      chainId: 42161,
      rpcUrl: 'https://arb1.arbitrum.io/rpc',
      gatewayAddress: '0xe432150cce91c13a887f7D836923d5597adD8E31',
      gasServiceAddress: '0x2d5d7d31F671F86C782533cc367F14109a082712',
      supportedTokens: ['USDC', 'USDT', 'WETH'],
      icon: '/ARB logo.png'
    },
    optimism: {
      name: 'Optimism',
      chainId: 10,
      rpcUrl: 'https://mainnet.optimism.io',
      gatewayAddress: '0xe432150cce91c13a887f7D836923d5597adD8E31',
      gasServiceAddress: '0x2d5d7d31F671F86C782533cc367F14109a082712',
      supportedTokens: ['USDC', 'USDT', 'WETH'],
      icon: '/OP logo.png'
    },
    binance: {
      name: 'BNB Chain',
      chainId: 56,
      rpcUrl: 'https://bsc-dataseed.binance.org',
      gatewayAddress: '0x304acf330bbE08d1e512eefaa92F6a57871fD895',
      gasServiceAddress: '0x2d5d7d31F671F86C782533cc367F14109a082712',
      supportedTokens: ['USDC', 'USDT', 'WBNB', 'WETH'],
      icon: '/BNB logo.png'
    },
    base: {
      name: 'Base',
      chainId: 8453,
      rpcUrl: 'https://mainnet.base.org',
      gatewayAddress: '0xe432150cce91c13a887f7D836923d5597adD8E31',
      gasServiceAddress: '0x2d5d7d31F671F86C782533cc367F14109a082712',
      supportedTokens: ['USDC', 'WETH'],
      icon: '/BASE logo.png'
    },
    altcoinchain: {
      name: 'Altcoinchain',
      chainId: 2330,
      rpcUrl: 'https://99.248.100.186:8645/',
      gatewayAddress: '0x347aAc6D939f98854110Ff48dC5B7beB52D86445', // Custom gateway
      gasServiceAddress: '0xae168Ce47cebca9abbC5107a58df0532f1afa4d6', // Custom gas service
      supportedTokens: ['ALT', 'WATT', 'USDT', 'wBTC', 'wETH'],
      icon: '/Altcoinchain logo.png'
    }
  };

  // Initialize connection to Axelar network
  private axelarConnection: any = null;
  private isConnected: boolean = false;
  private lastBlockHeight: number = 0;
  private validatorCount: number = 0;
  private connectionAttempts: number = 0;
  private maxConnectionAttempts: number = 3;

  constructor() {
    this.initializeConnection();
  }

  private async initializeConnection() {
    try {
      // Simulate connecting to Axelar network
      this.connectionAttempts++;
      
      // Fetch network status to check connection
      const response = await fetch(`${this.restEndpoint}/cosmos/base/tendermint/v1beta1/node_info`, {
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      if (response.ok) {
        this.isConnected = true;
        console.log('✅ Connected to Axelar network');
        
        // Get latest block height
        const blockResponse = await fetch(`${this.restEndpoint}/cosmos/base/tendermint/v1beta1/blocks/latest`);
        if (blockResponse.ok) {
          const blockData = await blockResponse.json();
          this.lastBlockHeight = parseInt(blockData.block.header.height);
        }
        
        // Get validator count
        const validatorResponse = await fetch(`${this.restEndpoint}/cosmos/staking/v1beta1/validators?status=BOND_STATUS_BONDED&pagination.limit=100`);
        if (validatorResponse.ok) {
          const validatorData = await validatorResponse.json();
          this.validatorCount = validatorData.validators.length;
        }
      } else {
        this.isConnected = false;
        console.warn(`⚠️ Failed to connect to Axelar network: ${response.status} ${response.statusText}`);
        
        // Retry connection if under max attempts
        if (this.connectionAttempts < this.maxConnectionAttempts) {
          console.log(`Retrying connection (${this.connectionAttempts}/${this.maxConnectionAttempts})...`);
          setTimeout(() => this.initializeConnection(), 5000);
        }
      }
    } catch (error) {
      this.isConnected = false;
      console.error('❌ Error connecting to Axelar network:', error);
      
      // Retry connection if under max attempts
      if (this.connectionAttempts < this.maxConnectionAttempts) {
        console.log(`Retrying connection (${this.connectionAttempts}/${this.maxConnectionAttempts})...`);
        setTimeout(() => this.initializeConnection(), 5000);
      }
    }
  }

  async getNetworkStatus(): Promise<{ connected: boolean; blockHeight: number; validators: number }> {
    try {
      // If we're already connected, return cached status
      if (this.isConnected) {
        // Refresh block height
        const blockResponse = await fetch(`${this.restEndpoint}/cosmos/base/tendermint/v1beta1/blocks/latest`, {
          signal: AbortSignal.timeout(3000) // 3 second timeout
        });
        
        if (blockResponse.ok) {
          const blockData = await blockResponse.json();
          this.lastBlockHeight = parseInt(blockData.block.header.height);
        }
        
        return {
          connected: this.isConnected,
          blockHeight: this.lastBlockHeight,
          validators: this.validatorCount
        };
      }
      
      // Try to reconnect if not connected
      if (!this.isConnected && this.connectionAttempts < this.maxConnectionAttempts) {
        this.initializeConnection();
      }
      
      // Return current status
      return {
        connected: this.isConnected,
        blockHeight: this.lastBlockHeight,
        validators: this.validatorCount
      };
    } catch (error) {
      console.error('Failed to get Axelar network status:', error);
      return {
        connected: this.isConnected,
        blockHeight: this.lastBlockHeight,
        validators: this.validatorCount
      };
    }
  }

  async getSupportedChains(): Promise<string[]> {
    try {
      const response = await fetch(`${this.gmpEndpoint}/chains`);
      const data = await response.json();
      return data.map((chain: any) => chain.id);
    } catch (error) {
      console.error('Failed to get supported chains:', error);
      return Object.keys(this.supportedNetworks);
    }
  }

  async getTransferFee(
    sourceChain: string,
    destinationChain: string,
    token: string,
    amount: string
  ): Promise<{ fee: string; gasLimit: string }> {
    try {
      // Try to get actual fee from API
      const response = await fetch(
        `${this.gmpEndpoint}/transfer-fee?sourceChain=${sourceChain}&destinationChain=${destinationChain}&asset=${token}&amount=${amount}`,
        { signal: AbortSignal.timeout(3000) }
      );
      
      if (response.ok) {
        const data = await response.json();
        return {
          fee: data.fee || (parseFloat(amount) * 0.001).toFixed(6), // Default to 0.1% fee
          gasLimit: data.gasLimit || '200000'
        };
      }
      
      // Fallback to estimated fee
      return {
        fee: (parseFloat(amount) * 0.001).toFixed(6), // 0.1% fee
        gasLimit: '200000'
      };
    } catch (error) {
      console.error('Failed to get transfer fee:', error);
      return {
        fee: (parseFloat(amount) * 0.001).toFixed(6), // 0.1% fee
        gasLimit: '200000'
      };
    }
  }

  async initiateTransfer(
    sourceChain: string,
    destinationChain: string,
    token: string,
    amount: string,
    recipient: string
  ): Promise<CrossChainTransfer> {
    try {
      // In a real implementation, this would interact with Axelar Gateway contracts
      // For demo purposes, we'll create a mock transfer
      
      // Generate a random transaction hash
      const txHash = `0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;
      
      const transfer: CrossChainTransfer = {
        id: `axl_${Date.now()}`,
        sourceChain,
        destinationChain,
        sourceToken: token,
        destinationToken: token, // Assuming same token symbol
        amount,
        recipient,
        status: 'pending',
        txHash,
        timestamp: new Date()
      };

      // Simulate API call to Axelar
      console.log('Initiating cross-chain transfer:', transfer);
      
      // Store in local storage for demo persistence
      const savedTransfers = this.getSavedTransfers();
      savedTransfers.unshift(transfer);
      localStorage.setItem('axelar_transfers', JSON.stringify(savedTransfers));
      
      return transfer;
    } catch (error) {
      console.error('Failed to initiate transfer:', error);
      throw error;
    }
  }

  async getTransferStatus(transferId: string): Promise<CrossChainTransfer | null> {
    try {
      // Try to get from GMP API
      const response = await fetch(`${this.gmpEndpoint}/gmp/${transferId}`);
      
      if (response.ok) {
        const data = await response.json();
        
        return {
          id: transferId,
          sourceChain: data.call?.chain || '',
          destinationChain: data.call?.returnValues?.destinationChain || '',
          sourceToken: data.call?.returnValues?.symbol || '',
          destinationToken: data.call?.returnValues?.symbol || '',
          amount: data.call?.returnValues?.amount || '0',
          recipient: data.call?.returnValues?.destinationAddress || '',
          status: this.mapAxelarStatus(data.status),
          txHash: data.call?.transactionHash,
          timestamp: new Date(data.call?.blockTimestamp * 1000)
        };
      }
      
      // Check local storage for demo
      const savedTransfers = this.getSavedTransfers();
      const transfer = savedTransfers.find(t => t.id === transferId);
      
      if (transfer) {
        // Simulate status progression for demo
        const elapsedMinutes = (Date.now() - new Date(transfer.timestamp).getTime()) / (1000 * 60);
        
        if (elapsedMinutes > 5) {
          transfer.status = Math.random() > 0.1 ? 'executed' : 'failed';
        } else if (elapsedMinutes > 2) {
          transfer.status = 'confirmed';
        }
        
        return transfer;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get transfer status:', error);
      return null;
    }
  }

  private mapAxelarStatus(axelarStatus: string): 'pending' | 'confirmed' | 'executed' | 'failed' {
    switch (axelarStatus?.toLowerCase()) {
      case 'executed':
        return 'executed';
      case 'approved':
        return 'confirmed';
      case 'error':
      case 'failed':
        return 'failed';
      default:
        return 'pending';
    }
  }

  async sendGeneralMessage(
    destinationChain: string,
    destinationAddress: string,
    payload: string
  ): Promise<AxelarMessage> {
    try {
      // In a real implementation, this would call the Axelar Gateway
      const message: AxelarMessage = {
        id: `msg_${Date.now()}`,
        sourceChain: 'altcoinchain',
        destinationChain,
        payload,
        status: 'pending',
        timestamp: new Date()
      };
      
      console.log('Sending general message:', message);
      
      return message;
    } catch (error) {
      console.error('Failed to send general message:', error);
      throw error;
    }
  }

  async getMessageStatus(messageId: string): Promise<AxelarMessage | null> {
    try {
      // Query Axelar GMP API for message status
      const response = await fetch(`${this.gmpEndpoint}/gmp/${messageId}`);
      
      if (response.ok) {
        const data = await response.json();
        
        return {
          id: messageId,
          sourceChain: data.call?.chain || '',
          destinationChain: data.call?.returnValues?.destinationChain || '',
          payload: data.call?.returnValues?.payload || '',
          status: this.mapAxelarStatus(data.status),
          commandId: data.approved?.commandId,
          timestamp: new Date(data.call?.blockTimestamp * 1000)
        };
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get message status:', error);
      return null;
    }
  }

  getNetworkConfig(chainName: string): AxelarNetwork | null {
    return this.supportedNetworks[chainName.toLowerCase()] || null;
  }

  getAllNetworks(): AxelarNetwork[] {
    return Object.values(this.supportedNetworks);
  }

  async estimateGasForMessage(
    destinationChain: string,
    payload: string
  ): Promise<{ gasLimit: string; gasPrice: string }> {
    try {
      const response = await fetch(
        `${this.gmpEndpoint}/gas-price/${destinationChain}`
      );
      
      if (response.ok) {
        const data = await response.json();
        
        return {
          gasLimit: '500000', // Default gas limit for messages
          gasPrice: data.gasPrice || '20000000000' // 20 gwei default
        };
      }
      
      return {
        gasLimit: '500000',
        gasPrice: '20000000000'
      };
    } catch (error) {
      console.error('Failed to estimate gas:', error);
      return {
        gasLimit: '500000',
        gasPrice: '20000000000'
      };
    }
  }

  // Get supported tokens for a specific chain
  getSupportedTokens(chainName: string): string[] {
    const network = this.getNetworkConfig(chainName);
    return network?.supportedTokens || [];
  }

  // Check if a cross-chain route is supported
  isRouteSupported(sourceChain: string, destinationChain: string): boolean {
    const sourceNetwork = this.getNetworkConfig(sourceChain);
    const destNetwork = this.getNetworkConfig(destinationChain);
    return !!(sourceNetwork && destNetwork);
  }

  // Get all recent transfers for monitoring
  async getRecentTransfers(limit: number = 10): Promise<CrossChainTransfer[]> {
    try {
      // Try to get from GMP API
      const response = await fetch(`${this.gmpEndpoint}/gmp/search?size=${limit}&sort=-call.blockTimestamp`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.data && Array.isArray(data.data)) {
          return data.data.map((item: any) => ({
            id: item.call?.transactionHash || `transfer_${Date.now()}`,
            sourceChain: item.call?.chain || '',
            destinationChain: item.call?.returnValues?.destinationChain || '',
            sourceToken: item.call?.returnValues?.symbol || '',
            destinationToken: item.call?.returnValues?.symbol || '',
            amount: item.call?.returnValues?.amount || '0',
            recipient: item.call?.returnValues?.destinationAddress || '',
            status: this.mapAxelarStatus(item.status),
            txHash: item.call?.transactionHash,
            timestamp: new Date(item.call?.blockTimestamp * 1000)
          }));
        }
      }
      
      // Fallback to local storage for demo
      return this.getSavedTransfers().slice(0, limit);
    } catch (error) {
      console.error('Failed to get recent transfers:', error);
      return this.getSavedTransfers().slice(0, limit);
    }
  }

  // Get saved transfers from local storage (for demo)
  private getSavedTransfers(): CrossChainTransfer[] {
    try {
      const saved = localStorage.getItem('axelar_transfers');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((transfer: any) => ({
          ...transfer,
          timestamp: new Date(transfer.timestamp)
        }));
      }
      
      // Return mock data if nothing saved
      return this.getMockTransfers();
    } catch (error) {
      console.error('Failed to get saved transfers:', error);
      return this.getMockTransfers();
    }
  }

  // Get mock transfers for demo
  private getMockTransfers(): CrossChainTransfer[] {
    return [
      {
        id: 'axl_1234567890',
        sourceChain: 'ethereum',
        destinationChain: 'altcoinchain',
        sourceToken: 'USDT',
        destinationToken: 'USDT',
        amount: '100.00',
        recipient: '0x742d35Cc23c3a684194D92Bb99c8b77C7516E6Db',
        status: 'executed',
        txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        id: 'axl_0987654321',
        sourceChain: 'polygon',
        destinationChain: 'ethereum',
        sourceToken: 'WATT',
        destinationToken: 'WATT',
        amount: '50.00',
        recipient: '0x5678901234abcdef5678901234abcdef56789012',
        status: 'confirmed',
        txHash: '0x0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba',
        timestamp: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
      },
      {
        id: 'axl_abcdef1234',
        sourceChain: 'altcoinchain',
        destinationChain: 'polygon',
        sourceToken: 'ALT',
        destinationToken: 'ALT',
        amount: '1000.00',
        recipient: '0xabcdef1234567890abcdef1234567890abcdef12',
        status: 'pending',
        txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        timestamp: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
      }
    ];
  }
}

export const axelarService = new AxelarService();
export type { AxelarNetwork, CrossChainTransfer, AxelarMessage };