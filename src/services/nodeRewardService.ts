import { ethers } from 'ethers';

interface NodeReward {
  nodeId: string;
  blockchain: string;
  blocksValidated: number;
  wattEarned: number;
  lastRewardBlock: number;
  isActive: boolean;
}

interface BlockValidationEvent {
  nodeId: string;
  blockchain: string;
  blockNumber: number;
  timestamp: Date;
  wattReward: number;
}

class NodeRewardService {
  private nodeRewards: Map<string, NodeReward> = new Map();
  private validationHistory: BlockValidationEvent[] = [];
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map();
  
  // WATT reward per block validated
  private readonly WATT_PER_BLOCK = 1.0;
  
  // Contract addresses for WATT token
  private readonly WATT_CONTRACT_ADDRESSES = {
    2330: '0x6645143e49B3a15d8F205658903a55E520444698', // Altcoinchain
    137: '0xE960d5076cd3169C343Ee287A2c3380A222e5839'   // Polygon
  };

  constructor() {
    this.loadSavedRewards();
  }

  private loadSavedRewards() {
    try {
      const saved = localStorage.getItem('node_rewards');
      if (saved) {
        const data = JSON.parse(saved);
        this.nodeRewards = new Map(data.rewards || []);
        this.validationHistory = (data.history || []).map((event: any) => ({
          ...event,
          timestamp: new Date(event.timestamp)
        }));
      }
    } catch (error) {
      console.error('Failed to load saved rewards:', error);
    }
  }

  private saveRewards() {
    try {
      const data = {
        rewards: Array.from(this.nodeRewards.entries()),
        history: this.validationHistory
      };
      localStorage.setItem('node_rewards', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save rewards:', error);
    }
  }

  // Start monitoring a node for block validation
  startMonitoring(nodeId: string, blockchain: string, rpcConfig: any): boolean {
    try {
      // Initialize node reward tracking
      if (!this.nodeRewards.has(nodeId)) {
        this.nodeRewards.set(nodeId, {
          nodeId,
          blockchain,
          blocksValidated: 0,
          wattEarned: 0,
          lastRewardBlock: 0,
          isActive: true
        });
      }

      // Start monitoring interval
      const interval = setInterval(async () => {
        await this.checkForNewBlocks(nodeId, blockchain, rpcConfig);
      }, 60000); // Check every minute

      this.monitoringIntervals.set(nodeId, interval);
      
      console.log(`Started monitoring ${blockchain} node: ${nodeId}`);
      return true;
    } catch (error) {
      console.error(`Failed to start monitoring ${nodeId}:`, error);
      return false;
    }
  }

  // Stop monitoring a node
  stopMonitoring(nodeId: string): boolean {
    try {
      const interval = this.monitoringIntervals.get(nodeId);
      if (interval) {
        clearInterval(interval);
        this.monitoringIntervals.delete(nodeId);
      }

      // Mark as inactive
      const reward = this.nodeRewards.get(nodeId);
      if (reward) {
        reward.isActive = false;
        this.nodeRewards.set(nodeId, reward);
      }

      this.saveRewards();
      console.log(`Stopped monitoring node: ${nodeId}`);
      return true;
    } catch (error) {
      console.error(`Failed to stop monitoring ${nodeId}:`, error);
      return false;
    }
  }

  // Check for new blocks and award WATT
  private async checkForNewBlocks(nodeId: string, blockchain: string, rpcConfig: any) {
    try {
      const currentBlock = await this.getCurrentBlockHeight(blockchain, rpcConfig);
      const reward = this.nodeRewards.get(nodeId);
      
      if (!reward || !currentBlock) return;

      // Check if we have new blocks
      if (currentBlock > reward.lastRewardBlock) {
        const newBlocks = currentBlock - reward.lastRewardBlock;
        const wattReward = newBlocks * this.WATT_PER_BLOCK;

        // Update reward tracking
        reward.blocksValidated += newBlocks;
        reward.wattEarned += wattReward;
        reward.lastRewardBlock = currentBlock;
        
        this.nodeRewards.set(nodeId, reward);

        // Record validation event
        const event: BlockValidationEvent = {
          nodeId,
          blockchain,
          blockNumber: currentBlock,
          timestamp: new Date(),
          wattReward
        };
        
        this.validationHistory.unshift(event);
        
        // Keep only last 1000 events
        if (this.validationHistory.length > 1000) {
          this.validationHistory = this.validationHistory.slice(0, 1000);
        }

        this.saveRewards();

        console.log(`Node ${nodeId} validated ${newBlocks} blocks, earned ${wattReward} WATT`);
        
        // In a real implementation, this would call a smart contract to mint WATT tokens
        await this.distributeMockWATTReward(nodeId, wattReward);
      }
    } catch (error) {
      console.error(`Error checking blocks for ${nodeId}:`, error);
    }
  }

  // Get current block height for different blockchains
  private async getCurrentBlockHeight(blockchain: string, rpcConfig: any): Promise<number | null> {
    try {
      switch (blockchain.toLowerCase()) {
        case 'bitcoin':
        case 'btc':
          return await this.getBitcoinBlockHeight(rpcConfig);
        case 'ethereum':
        case 'eth':
          return await this.getEthereumBlockHeight(rpcConfig);
        case 'litecoin':
        case 'ltc':
          return await this.getLitecoinBlockHeight(rpcConfig);
        case 'monero':
        case 'xmr':
          return await this.getMoneroBlockHeight(rpcConfig);
        case 'altcoinchain':
        case 'alt':
          return await this.getAltcoinchainBlockHeight(rpcConfig);
        case 'ghost':
          return await this.getGhostBlockHeight(rpcConfig);
        case 'trollcoin':
        case 'troll':
          return await this.getTrollcoinBlockHeight(rpcConfig);
        case 'hth':
          return await this.getHTHBlockHeight(rpcConfig);
        case 'raptoreum':
        case 'rtm':
          return await this.getRaptoreumBlockHeight(rpcConfig);
        default:
          console.warn(`Unsupported blockchain: ${blockchain}`);
          return null;
      }
    } catch (error) {
      console.error(`Failed to get block height for ${blockchain}:`, error);
      return null;
    }
  }

  // Blockchain-specific block height methods
  private async getBitcoinBlockHeight(rpcConfig: any): Promise<number | null> {
    try {
      const response = await this.makeRPCCall(rpcConfig, 'getblockchaininfo', []);
      return response.result?.blocks || null;
    } catch (error) {
      console.error('Bitcoin RPC error:', error);
      return null;
    }
  }

  private async getEthereumBlockHeight(rpcConfig: any): Promise<number | null> {
    try {
      const provider = new ethers.JsonRpcProvider(rpcConfig.url);
      return await provider.getBlockNumber();
    } catch (error) {
      console.error('Ethereum RPC error:', error);
      return null;
    }
  }

  private async getLitecoinBlockHeight(rpcConfig: any): Promise<number | null> {
    try {
      const response = await this.makeRPCCall(rpcConfig, 'getblockchaininfo', []);
      return response.result?.blocks || null;
    } catch (error) {
      console.error('Litecoin RPC error:', error);
      return null;
    }
  }

  private async getMoneroBlockHeight(rpcConfig: any): Promise<number | null> {
    try {
      const response = await this.makeRPCCall(rpcConfig, 'get_info', []);
      return response.result?.height || null;
    } catch (error) {
      console.error('Monero RPC error:', error);
      return null;
    }
  }

  private async getAltcoinchainBlockHeight(rpcConfig: any): Promise<number | null> {
    try {
      const provider = new ethers.JsonRpcProvider('http://99.248.100.186:8645');
      return await provider.getBlockNumber();
    } catch (error) {
      console.error('Altcoinchain RPC error:', error);
      return null;
    }
  }

  private async getGhostBlockHeight(rpcConfig: any): Promise<number | null> {
    try {
      const response = await this.makeRPCCall(rpcConfig, 'getblockchaininfo', []);
      return response.result?.blocks || null;
    } catch (error) {
      console.error('GHOST RPC error:', error);
      return null;
    }
  }

  private async getTrollcoinBlockHeight(rpcConfig: any): Promise<number | null> {
    try {
      const response = await this.makeRPCCall(rpcConfig, 'getblockchaininfo', []);
      return response.result?.blocks || null;
    } catch (error) {
      console.error('Trollcoin RPC error:', error);
      return null;
    }
  }

  private async getHTHBlockHeight(rpcConfig: any): Promise<number | null> {
    try {
      const response = await this.makeRPCCall(rpcConfig, 'getblockchaininfo', []);
      return response.result?.blocks || null;
    } catch (error) {
      console.error('HTH RPC error:', error);
      return null;
    }
  }

  private async getRaptoreumBlockHeight(rpcConfig: any): Promise<number | null> {
    try {
      const response = await this.makeRPCCall(rpcConfig, 'getblockchaininfo', []);
      return response.result?.blocks || null;
    } catch (error) {
      console.error('Raptoreum RPC error:', error);
      return null;
    }
  }

  // Generic RPC call method
  private async makeRPCCall(rpcConfig: any, method: string, params: any[]): Promise<any> {
    const url = `${rpcConfig.ssl ? 'https' : 'http'}://${rpcConfig.host}:${rpcConfig.port}`;
    
    const requestBody = {
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params
    };

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add basic auth if credentials provided
    if (rpcConfig.username && rpcConfig.password) {
      const auth = btoa(`${rpcConfig.username}:${rpcConfig.password}`);
      headers['Authorization'] = `Basic ${auth}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  // Mock WATT reward distribution (replace with actual smart contract call)
  private async distributeMockWATTReward(nodeId: string, amount: number): Promise<boolean> {
    try {
      // In a real implementation, this would call a smart contract to mint WATT tokens
      console.log(`Distributing ${amount} WATT to node ${nodeId}`);
      
      // Simulate contract call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return true;
    } catch (error) {
      console.error(`Failed to distribute WATT reward:`, error);
      return false;
    }
  }

  // Get node reward information
  getNodeReward(nodeId: string): NodeReward | null {
    return this.nodeRewards.get(nodeId) || null;
  }

  // Get all node rewards
  getAllNodeRewards(): NodeReward[] {
    return Array.from(this.nodeRewards.values());
  }

  // Get validation history
  getValidationHistory(limit: number = 100): BlockValidationEvent[] {
    return this.validationHistory.slice(0, limit);
  }

  // Get total WATT earned across all nodes
  getTotalWATTEarned(): number {
    return Array.from(this.nodeRewards.values())
      .reduce((total, reward) => total + reward.wattEarned, 0);
  }

  // Get total blocks validated across all nodes
  getTotalBlocksValidated(): number {
    return Array.from(this.nodeRewards.values())
      .reduce((total, reward) => total + reward.blocksValidated, 0);
  }

  // Get active nodes count
  getActiveNodesCount(): number {
    return Array.from(this.nodeRewards.values())
      .filter(reward => reward.isActive).length;
  }

  // Reset all rewards (for testing)
  resetAllRewards(): void {
    this.nodeRewards.clear();
    this.validationHistory = [];
    this.saveRewards();
  }
}

export const nodeRewardService = new NodeRewardService();
export type { NodeReward, BlockValidationEvent };