interface AxelarNetwork {
  name: string;
  chainId: number;
  rpcUrl: string;
  gatewayAddress: string;
  gasServiceAddress: string;
  supportedTokens: string[];
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
      supportedTokens: ['USDC', 'USDT', 'WETH', 'WBTC', 'DAI']
    },
    polygon: {
      name: 'Polygon',
      chainId: 137,
      rpcUrl: 'https://polygon.publicnode.com',
      gatewayAddress: '0x6f015F16De9fC8791b234eF68D486d2bF203FBA8',
      gasServiceAddress: '0x2d5d7d31F671F86C782533cc367F14109a082712',
      supportedTokens: ['USDC', 'USDT', 'WETH', 'WMATIC']
    },
    altcoinchain: {
      name: 'Altcoinchain',
      chainId: 2330,
      rpcUrl: 'https://99.248.100.186:8645/',
      gatewayAddress: '0x347aAc6D939f98854110Ff48dC5B7beB52D86445', // Custom gateway
      gasServiceAddress: '0xae168Ce47cebca9abbC5107a58df0532f1afa4d6', // Custom gas service
      supportedTokens: ['ALT', 'WATT', 'USDT', 'wBTC', 'wETH']
    }
  };

  async getNetworkStatus(): Promise<{ connected: boolean; blockHeight: number; validators: number }> {
    try {
      const response = await fetch(`${this.restEndpoint}/cosmos/base/tendermint/v1beta1/node_info`);
      const data = await response.json();
      
      const statusResponse = await fetch(`${this.restEndpoint}/cosmos/base/tendermint/v1beta1/syncing`);
      const statusData = await statusResponse.json();

      return {
        connected: true,
        blockHeight: parseInt(statusData.syncing ? '0' : data.default_node_info?.other?.latest_block_height || '0'),
        validators: 75 // Approximate active validator count
      };
    } catch (error) {
      console.error('Failed to get Axelar network status:', error);
      return {
        connected: false,
        blockHeight: 0,
        validators: 0
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
      const response = await fetch(
        `${this.gmpEndpoint}/transfer-fee?sourceChain=${sourceChain}&destinationChain=${destinationChain}&asset=${token}&amount=${amount}`
      );
      const data = await response.json();
      
      return {
        fee: data.fee || '0.1',
        gasLimit: data.gasLimit || '200000'
      };
    } catch (error) {
      console.error('Failed to get transfer fee:', error);
      return {
        fee: '0.1',
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
      const transfer: CrossChainTransfer = {
        id: `axl_${Date.now()}`,
        sourceChain,
        destinationChain,
        sourceToken: token,
        destinationToken: token, // Assuming same token symbol
        amount,
        recipient,
        status: 'pending',
        timestamp: new Date()
      };

      // Simulate API call to Axelar
      console.log('Initiating cross-chain transfer:', transfer);
      
      return transfer;
    } catch (error) {
      console.error('Failed to initiate transfer:', error);
      throw error;
    }
  }

  async getTransferStatus(transferId: string): Promise<CrossChainTransfer | null> {
    try {
      const response = await fetch(`${this.gmpEndpoint}/gmp/${transferId}`);
      if (!response.ok) return null;
      
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
      const message: AxelarMessage = {
        id: `msg_${Date.now()}`,
        sourceChain: 'altcoinchain',
        destinationChain,
        payload,
        status: 'pending',
        timestamp: new Date()
      };

      // In a real implementation, this would call the Axelar Gateway
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
      if (!response.ok) return null;
      
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
    } catch (error) {
      console.error('Failed to get message status:', error);
      return null;
    }
  }

  getNetworkConfig(chainName: string): AxelarNetwork | null {
    return this.supportedNetworks[chainName.toLowerCase()] || null;
  }

  async estimateGasForMessage(
    destinationChain: string,
    payload: string
  ): Promise<{ gasLimit: string; gasPrice: string }> {
    try {
      const response = await fetch(
        `${this.gmpEndpoint}/gas-price/${destinationChain}`
      );
      const data = await response.json();
      
      return {
        gasLimit: '500000', // Default gas limit for messages
        gasPrice: data.gasPrice || '20000000000' // 20 gwei default
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
      const response = await fetch(`${this.gmpEndpoint}/gmp/search?size=${limit}&sort=-call.blockTimestamp`);
      const data = await response.json();
      
      return data.data?.map((item: any) => ({
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
      })) || [];
    } catch (error) {
      console.error('Failed to get recent transfers:', error);
      return [];
    }
  }
}

export const axelarService = new AxelarService();
export type { AxelarNetwork, CrossChainTransfer, AxelarMessage };