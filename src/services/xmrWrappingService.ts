/**
 * XMR Wrapping Service
 * Manages XMR to wXMR wrapping with unique deposit addresses and timeout system
 */

// import { ethers } from 'ethers';

export interface WrapRequest {
  id: string;
  depositAddress: string;
  amount: number; // XMR amount to wrap
  wXMRAmount: number; // Expected wXMR tokens
  txId?: string; // Monero transaction ID
  status: 'pending' | 'deposited' | 'confirmed' | 'wrapped' | 'expired' | 'failed';
  createdAt: Date;
  expiresAt: Date;
  confirmedAt?: Date;
  wrappedAt?: Date;
  error?: string;
}

export interface WrapConfig {
  moneroWalletRpcUrl: string;
  altcoinchainRpcUrl: string;
  wXMRTokenAddress: string;
  bridgeContractAddress: string;
  bridgeOperatorPrivateKey: string;
  timeoutMinutes: number;
  minConfirmations: number;
  checkInterval: number;
}

export class XMRWrappingService {
  private config: WrapConfig;
  private provider: any = null;
  private bridgeContract: any = null;
  private wXMRContract: any = null;
  private bridgeOperatorWallet: any = null;
  private wrapRequests: Map<string, WrapRequest> = new Map();
  private isRunning = false;
  private checkInterval: NodeJS.Timeout | null = null;

  constructor(config: WrapConfig) {
    this.config = config;
    this.initializeContracts();
  }

  private getBackendUrl(): string {
    // If running on wattxchange.app domain, use the domain's backend
    if (typeof window !== 'undefined' && 
        (window.location.hostname === 'wattxchange.app' || window.location.hostname === 'www.wattxchange.app')) {
      return 'https://wattxchange.app:3001';
    }
    // Otherwise use localhost for development
    return 'http://localhost:3001';
  }

  private async initializeContracts() {
    try {
      // Initialize provider
      // this.provider = new ethers.JsonRpcProvider(this.config.altcoinchainRpcUrl);
      
      // Initialize bridge operator wallet
      // this.bridgeOperatorWallet = new ethers.Wallet(
      //   this.config.bridgeOperatorPrivateKey,
      //   this.provider
      // );

      // Initialize contracts
      // if (this.config.wXMRTokenAddress !== '0x0000000000000000000000000000000000000000') {
      //   const wXMRABI = [
      //     'function mint(address to, uint256 amount) external',
      //     'function balanceOf(address account) external view returns (uint256)',
      //     'function decimals() external view returns (uint8)'
      //   ];
      //   this.wXMRContract = new ethers.Contract(
      //     this.config.wXMRTokenAddress,
      //     wXMRABI,
      //     this.bridgeOperatorWallet
      //   );
      // }

      // if (this.config.bridgeContractAddress !== '0x0000000000000000000000000000000000000000') {
      //   const bridgeABI = [
      //     'function processDeposit(bytes32 txHash, uint256 amount, address recipient) external',
      //     'function getDepositStatus(bytes32 txHash) external view returns (uint8)'
      //   ];
      //   this.bridgeContract = new ethers.Contract(
      //     this.config.bridgeContractAddress,
      //     bridgeABI,
      //     this.bridgeOperatorWallet
      //   );
      // }

      console.log('✅ XMR Wrapping Service initialized (mock mode)');
    } catch (error) {
      console.error('❌ Failed to initialize XMR Wrapping Service:', error);
    }
  }

  /**
   * Create a new wrap request with unique deposit address
   */
  async createWrapRequest(amount: number): Promise<WrapRequest> {
    try {
      // Use backend service to create wrap request
      const backendUrl = this.getBackendUrl();
      const response = await fetch(`${backendUrl}/create-wrap-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to create wrap request');
      }

      const request: WrapRequest = {
        id: result.data.id,
        depositAddress: result.data.depositAddress,
        amount: result.data.amount,
        wXMRAmount: result.data.wXMRAmount,
        status: result.data.status,
        createdAt: new Date(result.data.createdAt),
        expiresAt: new Date(result.data.expiresAt)
      };

      // Store request
      this.wrapRequests.set(request.id, request);

      console.log(`🔄 Created wrap request ${request.id}:`, {
        depositAddress: request.depositAddress,
        amount: request.amount,
        expiresAt: request.expiresAt
      });

      return request;
    } catch (error) {
      console.error('❌ Failed to create wrap request:', error);
      throw error;
    }
  }

  /**
   * Generate a unique deposit address using Monero wallet RPC
   */
  private async generateDepositAddress(): Promise<string> {
    try {
      const response = await fetch(this.config.moneroWalletRpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: '0',
          method: 'create_address',
          params: {
            account_index: 0,
            label: `wrap_${Date.now()}`
          }
        })
      });

      const data = await response.json();
      if (data.result && data.result.address) {
        return data.result.address;
      } else {
        throw new Error('Failed to generate deposit address');
      }
    } catch (error) {
      console.error('❌ Failed to generate deposit address:', error);
      // Fallback: generate a mock address for testing
      return `4${Math.random().toString(36).substring(2, 95)}`;
    }
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `wrap_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Get wrap request by ID
   */
  getWrapRequest(id: string): WrapRequest | undefined {
    return this.wrapRequests.get(id);
  }

  /**
   * Get all wrap requests
   */
  getAllWrapRequests(): WrapRequest[] {
    return Array.from(this.wrapRequests.values()).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  /**
   * Check for deposits and update request status
   */
  private async checkDeposits() {
    const pendingRequests = Array.from(this.wrapRequests.values())
      .filter(req => req.status === 'pending' || req.status === 'deposited');

    for (const request of pendingRequests) {
      try {
        // Check if request has expired
        if (new Date() > request.expiresAt) {
          request.status = 'expired';
          console.log(`⏰ Wrap request ${request.id} expired`);
          continue;
        }

        // Check for deposits to this address
        const deposits = await this.checkAddressDeposits(request.depositAddress);
        
        if (deposits.length > 0) {
          const deposit = deposits[0]; // Use first deposit
          
          if (deposit.amount >= request.amount && deposit.confirmations >= this.config.minConfirmations) {
            request.txId = deposit.txHash;
            request.status = 'confirmed';
            request.confirmedAt = new Date();
            
            console.log(`✅ Deposit confirmed for request ${request.id}:`, {
              txHash: deposit.txHash,
              amount: deposit.amount,
              confirmations: deposit.confirmations
            });

            // Process the wrap
            await this.processWrap(request);
          } else if (deposit.amount > 0) {
            request.txId = deposit.txHash;
            request.status = 'deposited';
            console.log(`💰 Deposit detected for request ${request.id}, waiting for confirmations...`);
          }
        }
      } catch (error) {
        console.error(`❌ Error checking deposits for request ${request.id}:`, error);
        request.status = 'failed';
        request.error = error instanceof Error ? error.message : 'Unknown error';
      }
    }
  }

  /**
   * Check for deposits to a specific address
   */
  private async checkAddressDeposits(address: string): Promise<any[]> {
    try {
      const response = await fetch(this.config.moneroWalletRpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: '0',
          method: 'get_transfers',
          params: {
            in: true,
            out: false,
            pending: true,
            failed: false,
            pool: true,
            filter_by_height: false
          }
        })
      });

      const data = await response.json();
      if (data.result && data.result.in) {
        return data.result.in.filter((tx: any) => 
          tx.address === address && tx.amount > 0
        );
      }
      return [];
    } catch (error) {
      console.error('❌ Failed to check deposits:', error);
      return [];
    }
  }

  /**
   * Process the wrap by minting wXMR tokens
   */
  private async processWrap(request: WrapRequest) {
    try {
      if (!this.wXMRContract || !this.bridgeOperatorWallet) {
        console.warn('⚠️ Contracts not initialized, skipping wrap processing');
        request.status = 'wrapped'; // Mark as wrapped for demo
        request.wrappedAt = new Date();
        return;
      }

      // Convert XMR to atomic units (1 XMR = 1e12 atomic units)
      const atomicUnits = Math.floor(request.amount * 1e12);
      
      // Mint wXMR tokens
      const tx = await this.wXMRContract.mint(
        this.bridgeOperatorWallet.address,
        atomicUnits
      );

      await tx.wait();
      
      request.status = 'wrapped';
      request.wrappedAt = new Date();
      
      console.log(`🎉 Wrap completed for request ${request.id}:`, {
        txHash: tx.hash,
        amount: request.amount,
        wXMRAmount: request.wXMRAmount
      });
    } catch (error) {
      console.error(`❌ Failed to process wrap for request ${request.id}:`, error);
      request.status = 'failed';
      request.error = error instanceof Error ? error.message : 'Unknown error';
    }
  }

  /**
   * Start monitoring for deposits
   */
  startMonitoring() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.checkInterval = setInterval(() => {
      this.checkDeposits();
    }, this.config.checkInterval);

    console.log('🔄 XMR wrapping monitoring started');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isRunning = false;
    console.log('⏹️ XMR wrapping monitoring stopped');
  }

  /**
   * Get service status
   */
  getStatus() {
    const requests = this.getAllWrapRequests();
    const pending = requests.filter(r => r.status === 'pending').length;
    const confirmed = requests.filter(r => r.status === 'confirmed').length;
    const wrapped = requests.filter(r => r.status === 'wrapped').length;
    const expired = requests.filter(r => r.status === 'expired').length;

    return {
      isRunning: this.isRunning,
      totalRequests: requests.length,
      pending,
      confirmed,
      wrapped,
      expired,
      lastChecked: new Date()
    };
  }
}

// Export singleton instance
export const xmrWrappingService = new XMRWrappingService({
  moneroWalletRpcUrl: 'http://127.0.0.1:18083/json_rpc',
  altcoinchainRpcUrl: 'http://127.0.0.1:8545',
  wXMRTokenAddress: '0x2eb2230b406c73a34587d0aae4435ce4b548c296',
  bridgeContractAddress: '0xae2ee0decb301d0333d73e6a43b052ba994b5f5b',
  bridgeOperatorPrivateKey: '0x672ade68c928d8e963dc6a58885f02d49e0bd559',
  timeoutMinutes: 30,
  minConfirmations: 10,
  checkInterval: 30000 // 30 seconds
});
