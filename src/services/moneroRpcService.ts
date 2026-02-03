import { ethers } from 'ethers';

export interface MoneroWallet {
  address: string;
  balance: string;
  unlocked_balance: string;
  label?: string;
}

export interface MoneroTransaction {
  txid: string;
  height: number;
  timestamp: number;
  amount: string;
  fee: string;
  type: 'in' | 'out' | 'pool';
  confirmations: number;
  double_spend_seen: boolean;
  unlock_time: number;
}

export interface MoneroMiningPool {
  host: string;
  port: number;
  username: string;
  password: string;
  ssl: boolean;
}

export interface MoneroMiningStatus {
  active: boolean;
  speed: number;
  threads_count: number;
  address: string;
  is_background_mining_enabled: boolean;
  background_mining_speed: number;
  background_mining_active: boolean;
}

export interface MoneroNodeInfo {
  version: string;
  release: boolean;
  nettype: string;
  height: number;
  target_height: number;
  difficulty: string;
  target: string;
  tx_count: number;
  tx_pool_size: number;
  alt_blocks_count: number;
  outgoing_connections_count: number;
  incoming_connections_count: number;
  white_peerlist_size: number;
  grey_peerlist_size: number;
  testnet: boolean;
  nettype: string;
  top_block_hash: string;
  cumulative_difficulty: string;
  block_size_limit: number;
  block_weight_limit: number;
  start_time: number;
}

export class MoneroRpcService {
  private rpcUrl: string;
  private rpcUsername: string;
  private rpcPassword: string;
  private walletRpcUrl: string;
  private walletRpcUsername: string;
  private walletRpcPassword: string;

  constructor(config: {
    nodeRpcUrl?: string;
    nodeRpcUsername?: string;
    nodeRpcPassword?: string;
    walletRpcUrl?: string;
    walletRpcUsername?: string;
    walletRpcPassword?: string;
  }) {
    this.rpcUrl = config.nodeRpcUrl || 'http://127.0.0.1:18081';
    this.rpcUsername = config.nodeRpcUsername || '';
    this.rpcPassword = config.nodeRpcPassword || '';
    this.walletRpcUrl = config.walletRpcUrl || 'http://127.0.0.1:18083';
    this.walletRpcUsername = config.walletRpcUsername || '';
    this.walletRpcPassword = config.walletRpcPassword || '';
  }

  private async makeRpcRequest(url: string, method: string, params: any = {}, useAuth: boolean = false): Promise<any> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (useAuth && this.rpcUsername && this.rpcPassword) {
        const auth = btoa(`${this.rpcUsername}:${this.rpcPassword}`);
        headers['Authorization'] = `Basic ${auth}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: '0',
          method,
          params,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`RPC error: ${data.error.message}`);
      }

      return data.result;
    } catch (error) {
      console.error(`RPC request failed for ${method}:`, error);
      throw error;
    }
  }

  // Node RPC Methods
  async getNodeInfo(): Promise<MoneroNodeInfo> {
    return await this.makeRpcRequest(this.rpcUrl + '/json_rpc', 'get_info');
  }

  async getMiningStatus(): Promise<MoneroMiningStatus> {
    return await this.makeRpcRequest(this.rpcUrl + '/json_rpc', 'mining_status');
  }

  async startMining(address: string, threadsCount: number, background: boolean = false): Promise<boolean> {
    const result = await this.makeRpcRequest(this.rpcUrl + '/json_rpc', 'start_mining', {
      miner_address: address,
      threads_count: threadsCount,
      do_background_mining: background,
      ignore_battery: true
    });
    return result.status === 'OK';
  }

  async stopMining(): Promise<boolean> {
    const result = await this.makeRpcRequest(this.rpcUrl + '/json_rpc', 'stop_mining');
    return result.status === 'OK';
  }

  async setMiningThreads(threadsCount: number): Promise<boolean> {
    const result = await this.makeRpcRequest(this.rpcUrl + '/json_rpc', 'set_mining_threads', {
      threads_count: threadsCount
    });
    return result.status === 'OK';
  }

  async getBlockTemplate(address: string, reserveSize: number = 60): Promise<any> {
    return await this.makeRpcRequest(this.rpcUrl + '/json_rpc', 'get_block_template', {
      wallet_address: address,
      reserve_size: reserveSize
    });
  }

  // Wallet RPC Methods
  async getWalletAddress(): Promise<string> {
    return await this.makeRpcRequest(this.walletRpcUrl + '/json_rpc', 'get_address');
  }

  async getWalletBalance(): Promise<{ balance: string; unlocked_balance: string }> {
    return await this.makeRpcRequest(this.walletRpcUrl + '/json_rpc', 'get_balance');
  }

  async getWalletAccounts(): Promise<MoneroWallet[]> {
    const accounts = await this.makeRpcRequest(this.walletRpcUrl + '/json_rpc', 'get_accounts');
    return accounts.subaddress_accounts.map((account: any) => ({
      address: account.base_address,
      balance: account.balance,
      unlocked_balance: account.unlocked_balance,
      label: account.label || `Account ${account.account_index}`
    }));
  }

  async getWalletTransactions(accountIndex: number = 0, subaddrIndices?: number[]): Promise<MoneroTransaction[]> {
    const params: any = {
      account_index: accountIndex,
      in: true,
      out: true,
      pending: true,
      failed: false,
      pool: true,
      filter_by_height: false
    };

    if (subaddrIndices) {
      params.subaddr_indices = subaddrIndices;
    }

    const result = await this.makeRpcRequest(this.walletRpcUrl + '/json_rpc', 'get_transfers', params);
    
    const transactions: MoneroTransaction[] = [];
    
    // Combine in, out, and pool transactions
    [...(result.in || []), ...(result.out || []), ...(result.pool || [])].forEach((tx: any) => {
      transactions.push({
        txid: tx.txid,
        height: tx.height || 0,
        timestamp: tx.timestamp,
        amount: tx.amount,
        fee: tx.fee || '0',
        type: tx.type || (tx.amount > 0 ? 'in' : 'out'),
        confirmations: tx.confirmations || 0,
        double_spend_seen: tx.double_spend_seen || false,
        unlock_time: tx.unlock_time || 0
      });
    });

    // Sort by timestamp (newest first)
    return transactions.sort((a, b) => b.timestamp - a.timestamp);
  }

  async createWallet(filename: string, password: string, language: string = 'English'): Promise<string> {
    const result = await this.makeRpcRequest(this.walletRpcUrl + '/json_rpc', 'create_wallet', {
      filename,
      password,
      language
    });
    return result.address;
  }

  async openWallet(filename: string, password: string): Promise<boolean> {
    try {
      await this.makeRpcRequest(this.walletRpcUrl + '/json_rpc', 'open_wallet', {
        filename,
        password
      });
      return true;
    } catch (error) {
      console.error('Failed to open wallet:', error);
      return false;
    }
  }

  async closeWallet(): Promise<boolean> {
    try {
      await this.makeRpcRequest(this.walletRpcUrl + '/json_rpc', 'close_wallet');
      return true;
    } catch (error) {
      console.error('Failed to close wallet:', error);
      return false;
    }
  }

  async sendTransaction(
    destinations: Array<{ address: string; amount: number }>,
    priority: number = 1,
    ring_size: number = 11,
    unlock_time: number = 0
  ): Promise<{ tx_hash: string; fee: string }> {
    return await this.makeRpcRequest(this.walletRpcUrl + '/json_rpc', 'transfer', {
      destinations,
      priority,
      ring_size,
      unlock_time,
      get_tx_key: true,
      get_tx_hex: true,
      get_tx_metadata: true
    });
  }

  // Mining Pool Management
  async getMiningPoolConfig(): Promise<MoneroMiningPool | null> {
    try {
      // This would typically be stored in configuration
      // For now, return a default pool configuration
      return {
        host: 'pool.minexmr.com',
        port: 4444,
        username: '', // Will be set to wallet address
        password: 'x',
        ssl: false
      };
    } catch (error) {
      console.error('Failed to get mining pool config:', error);
      return null;
    }
  }

  async setMiningPool(pool: MoneroMiningPool): Promise<boolean> {
    try {
      // In a real implementation, this would configure the mining pool
      // For now, we'll just return success
      console.log('Setting mining pool:', pool);
      return true;
    } catch (error) {
      console.error('Failed to set mining pool:', error);
      return false;
    }
  }

  // Connection Testing
  async testNodeConnection(): Promise<boolean> {
    try {
      await this.getNodeInfo();
      return true;
    } catch (error) {
      console.error('Node connection test failed:', error);
      return false;
    }
  }

  async testWalletConnection(): Promise<boolean> {
    try {
      await this.getWalletAddress();
      return true;
    } catch (error) {
      console.error('Wallet connection test failed:', error);
      return false;
    }
  }

  // Configuration Management
  updateConfig(config: {
    nodeRpcUrl?: string;
    nodeRpcUsername?: string;
    nodeRpcPassword?: string;
    walletRpcUrl?: string;
    walletRpcUsername?: string;
    walletRpcPassword?: string;
  }) {
    if (config.nodeRpcUrl) this.rpcUrl = config.nodeRpcUrl;
    if (config.nodeRpcUsername) this.rpcUsername = config.nodeRpcUsername;
    if (config.nodeRpcPassword) this.rpcPassword = config.nodeRpcPassword;
    if (config.walletRpcUrl) this.walletRpcUrl = config.walletRpcUrl;
    if (config.walletRpcUsername) this.walletRpcUsername = config.walletRpcUsername;
    if (config.walletRpcPassword) this.walletRpcPassword = config.walletRpcPassword;
  }
}

// Export singleton instance
export const moneroRpcService = new MoneroRpcService({
  nodeRpcUrl: process.env.MONERO_NODE_RPC_URL || 'http://127.0.0.1:18081',
  walletRpcUrl: process.env.MONERO_WALLET_RPC_URL || 'http://127.0.0.1:18083',
  nodeRpcUsername: process.env.MONERO_NODE_RPC_USERNAME || '',
  nodeRpcPassword: process.env.MONERO_NODE_RPC_PASSWORD || '',
  walletRpcUsername: process.env.MONERO_WALLET_RPC_USERNAME || '',
  walletRpcPassword: process.env.MONERO_WALLET_RPC_PASSWORD || '',
});
