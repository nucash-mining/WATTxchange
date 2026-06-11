import { ethers } from 'ethers';

// Chain configurations
export const BRIDGE_CHAINS = {
  wattx: {
    id: 8889,
    name: 'WATTx Mainnet',
    rpc: 'http://127.0.0.1:23889',
    wattToken: '0x0000000000000000000000000000000000000000', // Native or wrapped WATT
    bridgePool: '0x0000000000000000000000000000000000000000', // Deploy and update
    explorer: 'http://localhost:3000',
    isMainnet: true
  },
  polygon: {
    id: 137,
    name: 'Polygon',
    rpc: 'https://polygon-rpc.com',
    wattToken: '0xE960d5076cd3169C343Ee287A2c3380A222e5839',
    bridgePool: '0x0000000000000000000000000000000000000000', // Deploy and update
    explorer: 'https://polygonscan.com',
    isMainnet: false
  },
  altcoinchain: {
    id: 2330,
    name: 'Altcoinchain',
    rpc: 'http://127.0.0.1:8545',
    wattToken: '0x6645143e49B3a15d8F205658903a55E520444698',
    bridgePool: '0x0000000000000000000000000000000000000000', // Deploy and update
    explorer: 'https://explorer.altcoinchain.org',
    isMainnet: false
  }
};

// Bridge Pool ABI (simplified for frontend)
const BRIDGE_POOL_ABI = [
  'function bridge(uint256 destChain, address recipient, uint256 amount) external',
  'function release(bytes32 transferId, address recipient, uint256 amount, uint256 sourceChain) external',
  'function addLiquidity(uint256 amount) external',
  'function getAvailableLiquidity() view returns (uint256)',
  'function getPoolStats() view returns (uint256 totalLocked, uint256 totalReleased, uint256 totalFees, uint256 availableLiquidity, uint256 pendingCount)',
  'function bridgeFee() view returns (uint256)',
  'function minBridgeAmount() view returns (uint256)',
  'function maxBridgeAmount() view returns (uint256)',
  'function processedTransfers(bytes32) view returns (bool)',
  'function getPendingRelease(bytes32 transferId) view returns (address recipient, uint256 amount, uint256 sourceChain, uint256 timestamp, bool processed)',
  'event BridgeInitiated(bytes32 indexed transferId, address indexed sender, address indexed recipient, uint256 amount, uint256 fee, uint256 sourceChain, uint256 destChain, uint256 timestamp)',
  'event BridgeCompleted(bytes32 indexed transferId, address indexed recipient, uint256 amount, uint256 sourceChain, uint256 destChain, uint256 timestamp)',
  'event BridgePending(bytes32 indexed transferId, address indexed recipient, uint256 amount, uint256 sourceChain, string reason)'
];

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)'
];

export type ChainKey = 'wattx' | 'polygon' | 'altcoinchain';

export interface BridgeQuote {
  sourceChain: ChainKey;
  destChain: ChainKey;
  inputAmount: string;
  outputAmount: string;
  fee: string;
  feePercent: number;
  estimatedTime: string;
  availableLiquidity: string;
  hasLiquidity: boolean;
}

export interface PoolStats {
  totalLocked: string;
  totalReleased: string;
  totalFees: string;
  availableLiquidity: string;
  pendingCount: number;
}

export interface BridgeTransaction {
  transferId: string;
  sender: string;
  recipient: string;
  amount: string;
  fee: string;
  sourceChain: number;
  destChain: number;
  timestamp: number;
  status: 'pending' | 'completed' | 'queued';
  txHash?: string;
}

class WATTxBridgeService {
  private providers: Map<ChainKey, ethers.JsonRpcProvider> = new Map();

  constructor() {
    // Initialize providers
    for (const [key, chain] of Object.entries(BRIDGE_CHAINS)) {
      try {
        this.providers.set(key as ChainKey, new ethers.JsonRpcProvider(chain.rpc));
      } catch (err) {
        console.warn(`Failed to initialize provider for ${key}:`, err);
      }
    }
  }

  /**
   * Get provider for a chain
   */
  getProvider(chain: ChainKey): ethers.JsonRpcProvider | undefined {
    return this.providers.get(chain);
  }

  /**
   * Get bridge pool contract
   */
  getBridgePool(chain: ChainKey, signerOrProvider?: ethers.Signer | ethers.Provider): ethers.Contract | null {
    const chainConfig = BRIDGE_CHAINS[chain];
    if (!chainConfig.bridgePool || chainConfig.bridgePool === '0x0000000000000000000000000000000000000000') {
      return null;
    }

    const provider = signerOrProvider || this.providers.get(chain);
    if (!provider) return null;

    return new ethers.Contract(chainConfig.bridgePool, BRIDGE_POOL_ABI, provider);
  }

  /**
   * Get WATT token contract
   */
  getWattToken(chain: ChainKey, signerOrProvider?: ethers.Signer | ethers.Provider): ethers.Contract | null {
    const chainConfig = BRIDGE_CHAINS[chain];
    if (!chainConfig.wattToken || chainConfig.wattToken === '0x0000000000000000000000000000000000000000') {
      return null;
    }

    const provider = signerOrProvider || this.providers.get(chain);
    if (!provider) return null;

    return new ethers.Contract(chainConfig.wattToken, ERC20_ABI, provider);
  }

  /**
   * Get pool statistics for a chain
   */
  async getPoolStats(chain: ChainKey): Promise<PoolStats | null> {
    try {
      const pool = this.getBridgePool(chain);
      if (!pool) return null;

      const stats = await pool.getPoolStats();

      return {
        totalLocked: ethers.formatEther(stats.totalLocked),
        totalReleased: ethers.formatEther(stats.totalReleased),
        totalFees: ethers.formatEther(stats.totalFees),
        availableLiquidity: ethers.formatEther(stats.availableLiquidity),
        pendingCount: Number(stats.pendingCount)
      };
    } catch (err) {
      console.error(`Failed to get pool stats for ${chain}:`, err);
      return null;
    }
  }

  /**
   * Get available liquidity on a chain
   */
  async getAvailableLiquidity(chain: ChainKey): Promise<string> {
    try {
      const pool = this.getBridgePool(chain);
      if (!pool) return '0';

      const liquidity = await pool.getAvailableLiquidity();
      return ethers.formatEther(liquidity);
    } catch (err) {
      console.error(`Failed to get liquidity for ${chain}:`, err);
      return '0';
    }
  }

  /**
   * Get WATT balance for an address on a chain
   */
  async getWattBalance(chain: ChainKey, address: string): Promise<string> {
    try {
      const token = this.getWattToken(chain);
      if (!token) return '0';

      const balance = await token.balanceOf(address);
      return ethers.formatEther(balance);
    } catch (err) {
      console.error(`Failed to get WATT balance on ${chain}:`, err);
      return '0';
    }
  }

  /**
   * Get a quote for bridging
   */
  async getBridgeQuote(
    sourceChain: ChainKey,
    destChain: ChainKey,
    amount: string
  ): Promise<BridgeQuote | null> {
    try {
      if (sourceChain === destChain) return null;
      if (!amount || parseFloat(amount) <= 0) return null;

      const sourcePool = this.getBridgePool(sourceChain);
      const destPool = this.getBridgePool(destChain);

      // Get fee from source pool
      let feePercent = 0.1; // Default 0.1%
      if (sourcePool) {
        try {
          const feeBps = await sourcePool.bridgeFee();
          feePercent = Number(feeBps) / 100;
        } catch {}
      }

      // Calculate amounts
      const inputAmountBN = ethers.parseEther(amount);
      const feeBN = (inputAmountBN * BigInt(Math.floor(feePercent * 100))) / BigInt(10000);
      const outputAmountBN = inputAmountBN - feeBN;

      // Get destination liquidity
      let availableLiquidity = '0';
      if (destPool) {
        try {
          const liq = await destPool.getAvailableLiquidity();
          availableLiquidity = ethers.formatEther(liq);
        } catch {}
      }

      const hasLiquidity = parseFloat(availableLiquidity) >= parseFloat(ethers.formatEther(outputAmountBN));

      return {
        sourceChain,
        destChain,
        inputAmount: amount,
        outputAmount: ethers.formatEther(outputAmountBN),
        fee: ethers.formatEther(feeBN),
        feePercent,
        estimatedTime: hasLiquidity ? '2-5 minutes' : '5-30 minutes (pending liquidity)',
        availableLiquidity,
        hasLiquidity
      };
    } catch (err) {
      console.error('Failed to get bridge quote:', err);
      return null;
    }
  }

  /**
   * Check and approve WATT spending for bridge
   */
  async approveIfNeeded(
    chain: ChainKey,
    signer: ethers.Signer,
    amount: string
  ): Promise<boolean> {
    try {
      const chainConfig = BRIDGE_CHAINS[chain];
      const token = this.getWattToken(chain, signer);
      if (!token) return false;

      const userAddress = await signer.getAddress();
      const amountBN = ethers.parseEther(amount);

      const allowance = await token.allowance(userAddress, chainConfig.bridgePool);

      if (allowance < amountBN) {
        const tx = await token.approve(chainConfig.bridgePool, ethers.MaxUint256);
        await tx.wait();
      }

      return true;
    } catch (err) {
      console.error('Approval failed:', err);
      return false;
    }
  }

  /**
   * Execute bridge transaction
   */
  async bridge(
    sourceChain: ChainKey,
    destChain: ChainKey,
    recipient: string,
    amount: string,
    signer: ethers.Signer
  ): Promise<{ success: boolean; txHash?: string; transferId?: string; error?: string }> {
    try {
      const chainConfig = BRIDGE_CHAINS[destChain];
      const pool = this.getBridgePool(sourceChain, signer);

      if (!pool) {
        return { success: false, error: 'Bridge pool not available' };
      }

      // Approve if needed
      const approved = await this.approveIfNeeded(sourceChain, signer, amount);
      if (!approved) {
        return { success: false, error: 'Token approval failed' };
      }

      // Execute bridge
      const amountBN = ethers.parseEther(amount);
      const tx = await pool.bridge(chainConfig.id, recipient, amountBN);
      const receipt = await tx.wait();

      // Parse transfer ID from event
      let transferId: string | undefined;
      for (const log of receipt.logs) {
        try {
          const parsed = pool.interface.parseLog({ topics: log.topics as string[], data: log.data });
          if (parsed?.name === 'BridgeInitiated') {
            transferId = parsed.args.transferId;
            break;
          }
        } catch {}
      }

      return {
        success: true,
        txHash: receipt.hash,
        transferId
      };
    } catch (err: any) {
      console.error('Bridge failed:', err);
      return { success: false, error: err.message || 'Bridge transaction failed' };
    }
  }

  /**
   * Add liquidity to a bridge pool
   */
  async addLiquidity(
    chain: ChainKey,
    amount: string,
    signer: ethers.Signer
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const pool = this.getBridgePool(chain, signer);
      if (!pool) {
        return { success: false, error: 'Bridge pool not available' };
      }

      // Approve if needed
      const approved = await this.approveIfNeeded(chain, signer, amount);
      if (!approved) {
        return { success: false, error: 'Token approval failed' };
      }

      const amountBN = ethers.parseEther(amount);
      const tx = await pool.addLiquidity(amountBN);
      const receipt = await tx.wait();

      return { success: true, txHash: receipt.hash };
    } catch (err: any) {
      console.error('Add liquidity failed:', err);
      return { success: false, error: err.message || 'Add liquidity failed' };
    }
  }

  /**
   * Get bridge transaction status
   */
  async getTransferStatus(
    chain: ChainKey,
    transferId: string
  ): Promise<'unknown' | 'pending' | 'completed' | 'queued'> {
    try {
      const pool = this.getBridgePool(chain);
      if (!pool) return 'unknown';

      // Check if processed
      const processed = await pool.processedTransfers(transferId);
      if (processed) return 'completed';

      // Check if pending
      const pending = await pool.getPendingRelease(transferId);
      if (pending.recipient !== ethers.ZeroAddress && !pending.processed) {
        return 'queued';
      }

      return 'pending';
    } catch (err) {
      console.error('Failed to get transfer status:', err);
      return 'unknown';
    }
  }

  /**
   * Get all pool stats across chains
   */
  async getAllPoolStats(): Promise<Record<ChainKey, PoolStats | null>> {
    const results: Record<ChainKey, PoolStats | null> = {
      wattx: null,
      polygon: null,
      altcoinchain: null
    };

    await Promise.all(
      (Object.keys(BRIDGE_CHAINS) as ChainKey[]).map(async (chain) => {
        results[chain] = await this.getPoolStats(chain);
      })
    );

    return results;
  }
}

// Export singleton instance
export const wattxBridgeService = new WATTxBridgeService();
export default wattxBridgeService;
