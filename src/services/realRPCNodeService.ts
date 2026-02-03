/**
 * Real RPC Node Service
 * Actually connects to UTXO blockchain nodes and sends real commands
 */

export interface RPCResponse {
  result?: any;
  error?: {
    code: number;
    message: string;
  };
  id: string;
}

export interface NodeStatus {
  connected: boolean;
  synced: boolean;
  blockHeight: number;
  networkHashrate: number;
  difficulty: number;
  lastBlockTime: string;
  peers: number;
  version: string;
}

export interface WalletInfo {
  balance: number;
  unspentOutputs: Array<{
    txid: string;
    vout: number;
    amount: number;
    scriptPubKey: string;
  }>;
  addresses: string[];
  transactions: Array<{
    txid: string;
    amount: number;
    confirmations: number;
    time: number;
  }>;
}

export interface MiningInfo {
  blocks: number;
  currentblocksize: number;
  currentblocktx: number;
  difficulty: number;
  networkhashps: number;
  pooledtx: number;
  chain: string;
  warnings: string;
}

export class RealRPCNodeService {
  private static instance: RealRPCNodeService;
  private nodeConnections: Map<string, { url: string; username: string; password: string }> = new Map();

  public static getInstance(): RealRPCNodeService {
    if (!RealRPCNodeService.instance) {
      RealRPCNodeService.instance = new RealRPCNodeService();
    }
    return RealRPCNodeService.instance;
  }

  /**
   * Connect to a real UTXO blockchain node
   */
  async connectToNode(
    chain: string,
    rpcUrl: string,
    rpcUsername: string,
    rpcPassword: string
  ): Promise<boolean> {
    try {
      console.log(`=== CONNECTING TO ${chain.toUpperCase()} NODE ===`);
      console.log(`URL: ${rpcUrl}`);
      console.log(`Username: "${rpcUsername}"`);
      console.log(`Password: "${rpcPassword}"`);
      
      // Use different RPC methods for different chains
      let method = 'getblockchaininfo';
      if (chain.toLowerCase() === 'monero') {
        method = 'get_info';
      }
      
      console.log(`Using RPC method: ${method}`);
      
      // Test the connection with a simple RPC call
      const response = await this.makeRPCCall(rpcUrl, rpcUsername, rpcPassword, method, []);
      
      console.log(`=== RPC RESPONSE ===`);
      console.log(JSON.stringify(response, null, 2));
      
      if (response.error) {
        console.error(`=== CONNECTION FAILED ===`);
        console.error(`Error:`, response.error);
        return false;
      }

      // Store the connection details
      this.nodeConnections.set(chain.toLowerCase(), {
        url: rpcUrl,
        username: rpcUsername,
        password: rpcPassword
      });

      console.log(`=== CONNECTION SUCCESSFUL ===`);
      console.log(`Stored connection for ${chain.toLowerCase()}`);
      console.log(`Current connected nodes:`, Array.from(this.nodeConnections.keys()));
      return true;
    } catch (error) {
      console.error(`=== CONNECTION EXCEPTION ===`);
      console.error(`Chain: ${chain}`);
      console.error(`Error:`, error);
      console.error(`Error type:`, typeof error);
      console.error(`Error message:`, error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  /**
   * Get node status and blockchain info
   */
  async getNodeStatus(chain: string): Promise<NodeStatus | null> {
    const connection = this.nodeConnections.get(chain.toLowerCase());
    if (!connection) {
      throw new Error(`No connection found for ${chain}. Please connect first.`);
    }

    try {
      if (chain.toLowerCase() === 'monero') {
        // Use Monero-specific RPC methods
        const [info, connections] = await Promise.all([
          this.makeRPCCall(connection.url, connection.username, connection.password, 'get_info', []),
          this.makeRPCCall(connection.url, connection.username, connection.password, 'get_connections', [])
        ]);

        if (info.error || connections.error) {
          throw new Error('Failed to get Monero node status');
        }

        return {
          connected: true,
          synced: info.result.synchronized,
          blockHeight: info.result.height,
          networkHashrate: info.result.difficulty,
          difficulty: info.result.difficulty,
          lastBlockTime: new Date(info.result.top_block_timestamp * 1000).toISOString(),
          peers: connections.result.connections ? connections.result.connections.length : 0,
          version: info.result.version || 'Unknown'
        };
      } else {
        // Use Bitcoin-style RPC methods for other chains
        const [blockchainInfo, networkInfo, miningInfo] = await Promise.all([
          this.makeRPCCall(connection.url, connection.username, connection.password, 'getblockchaininfo', []),
          this.makeRPCCall(connection.url, connection.username, connection.password, 'getnetworkinfo', []),
          this.makeRPCCall(connection.url, connection.username, connection.password, 'getmininginfo', [])
        ]);

        if (blockchainInfo.error || networkInfo.error || miningInfo.error) {
          throw new Error('Failed to get node status');
        }

        return {
          connected: true,
          synced: blockchainInfo.result.verificationprogress === 1,
          blockHeight: blockchainInfo.result.blocks,
          networkHashrate: miningInfo.result.networkhashps || 0,
          difficulty: blockchainInfo.result.difficulty,
          lastBlockTime: new Date(blockchainInfo.result.mediantime * 1000).toISOString(),
          peers: networkInfo.result.connections || 0,
          version: networkInfo.result.subversion || 'Unknown'
        };
      }
    } catch (error) {
      console.error(`Error getting node status for ${chain}:`, error);
      return null;
    }
  }

  /**
   * Get wallet information
   */
  async getWalletInfo(chain: string): Promise<WalletInfo | null> {
    const connection = this.nodeConnections.get(chain.toLowerCase());
    if (!connection) {
      throw new Error(`No connection found for ${chain}. Please connect first.`);
    }

    try {
      if (chain.toLowerCase() === 'monero') {
        // Note: Monero RPC doesn't provide wallet info without a wallet being loaded
        // For now, return a placeholder that indicates wallet needs to be loaded separately
        return {
          balance: 0,
          unspentOutputs: [],
          addresses: [],
          transactions: []
        };
      } else {
        // Use Bitcoin-style RPC methods for other chains
        const [balance, unspent, addresses, transactions] = await Promise.all([
          this.makeRPCCall(connection.url, connection.username, connection.password, 'getbalance', []),
          this.makeRPCCall(connection.url, connection.username, connection.password, 'listunspent', []),
          this.makeRPCCall(connection.url, connection.username, connection.password, 'getaddressesbyaccount', ['']),
          this.makeRPCCall(connection.url, connection.username, connection.password, 'listtransactions', ['*', 10])
        ]);

        if (balance.error || unspent.error || addresses.error || transactions.error) {
          throw new Error('Failed to get wallet info');
        }

        return {
          balance: balance.result || 0,
          unspentOutputs: unspent.result || [],
          addresses: addresses.result || [],
          transactions: transactions.result || []
        };
      }
    } catch (error) {
      console.error(`Error getting wallet info for ${chain}:`, error);
      return null;
    }
  }

  /**
   * Create a new address
   */
  async createNewAddress(chain: string, label?: string): Promise<string | null> {
    const connection = this.nodeConnections.get(chain.toLowerCase());
    if (!connection) {
      throw new Error(`No connection found for ${chain}. Please connect first.`);
    }

    try {
      const response = await this.makeRPCCall(
        connection.url,
        connection.username,
        connection.password,
        'getnewaddress',
        label ? [label] : []
      );

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.result;
    } catch (error) {
      console.error(`Error creating new address for ${chain}:`, error);
      return null;
    }
  }

  /**
   * Send coins to an address
   */
  async sendCoins(chain: string, toAddress: string, amount: number, comment?: string): Promise<string | null> {
    const connection = this.nodeConnections.get(chain.toLowerCase());
    if (!connection) {
      throw new Error(`No connection found for ${chain}. Please connect first.`);
    }

    try {
      if (chain.toLowerCase() === 'monero') {
        // Use Monero-specific transfer method
        const atomicAmount = Math.floor(amount * 1e12); // Convert XMR to atomic units
        const response = await this.makeRPCCall(
          connection.url,
          connection.username,
          connection.password,
          'transfer',
          [{
            destinations: [{ amount: atomicAmount, address: toAddress }],
            priority: 1,
            ring_size: 11,
            get_tx_key: true
          }]
        );

        if (response.error) {
          throw new Error(response.error.message);
        }

        return response.result.tx_hash; // Returns transaction hash
      } else {
        // Use Bitcoin-style sendtoaddress for other chains
        const response = await this.makeRPCCall(
          connection.url,
          connection.username,
          connection.password,
          'sendtoaddress',
          [toAddress, amount, comment || '', '', false]
        );

        if (response.error) {
          throw new Error(response.error.message);
        }

        return response.result; // Returns transaction ID
      }
    } catch (error) {
      console.error(`Error sending coins for ${chain}:`, error);
      return null;
    }
  }

  /**
   * Get transaction details
   */
  async getTransaction(chain: string, txid: string): Promise<any | null> {
    const connection = this.nodeConnections.get(chain.toLowerCase());
    if (!connection) {
      throw new Error(`No connection found for ${chain}. Please connect first.`);
    }

    try {
      const response = await this.makeRPCCall(
        connection.url,
        connection.username,
        connection.password,
        'gettransaction',
        [txid]
      );

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.result;
    } catch (error) {
      console.error(`Error getting transaction for ${chain}:`, error);
      return null;
    }
  }

  /**
   * Start mining (if supported by the node)
   */
  async startMining(chain: string, address: string, threads?: number): Promise<boolean> {
    const connection = this.nodeConnections.get(chain.toLowerCase());
    if (!connection) {
      throw new Error(`No connection found for ${chain}. Please connect first.`);
    }

    try {
      const response = await this.makeRPCCall(
        connection.url,
        connection.username,
        connection.password,
        'setgenerate',
        [true, threads || 1]
      );

      if (response.error) {
        // Try alternative mining command
        const altResponse = await this.makeRPCCall(
          connection.url,
          connection.username,
          connection.password,
          'generate',
          [1]
        );
        
        if (altResponse.error) {
          throw new Error('Mining not supported or failed to start');
        }
      }

      return true;
    } catch (error) {
      console.error(`Error starting mining for ${chain}:`, error);
      return false;
    }
  }

  /**
   * Stop mining
   */
  async stopMining(chain: string): Promise<boolean> {
    const connection = this.nodeConnections.get(chain.toLowerCase());
    if (!connection) {
      throw new Error(`No connection found for ${chain}. Please connect first.`);
    }

    try {
      const response = await this.makeRPCCall(
        connection.url,
        connection.username,
        connection.password,
        'setgenerate',
        [false]
      );

      return !response.error;
    } catch (error) {
      console.error(`Error stopping mining for ${chain}:`, error);
      return false;
    }
  }

  /**
   * Get mining information
   */
  async getMiningInfo(chain: string): Promise<MiningInfo | null> {
    const connection = this.nodeConnections.get(chain.toLowerCase());
    if (!connection) {
      throw new Error(`No connection found for ${chain}. Please connect first.`);
    }

    try {
      if (chain.toLowerCase() === 'monero') {
        // Monero doesn't have traditional mining info via daemon RPC
        // Return placeholder data
        return {
          blocks: 0,
          currentblocksize: 0,
          currentblocktx: 0,
          difficulty: 0,
          networkhashps: 0,
          pooledtx: 0,
          chain: 'monero',
          warnings: 'Mining info not available via Monero daemon RPC'
        };
      } else {
        const response = await this.makeRPCCall(
          connection.url,
          connection.username,
          connection.password,
          'getmininginfo',
          []
        );

        if (response.error) {
          throw new Error(response.error.message);
        }

        return response.result;
      }
    } catch (error) {
      console.error(`Error getting mining info for ${chain}:`, error);
      return null;
    }
  }

  /**
   * Get block information
   */
  async getBlock(chain: string, blockHash: string): Promise<any | null> {
    const connection = this.nodeConnections.get(chain.toLowerCase());
    if (!connection) {
      throw new Error(`No connection found for ${chain}. Please connect first.`);
    }

    try {
      const response = await this.makeRPCCall(
        connection.url,
        connection.username,
        connection.password,
        'getblock',
        [blockHash]
      );

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.result;
    } catch (error) {
      console.error(`Error getting block for ${chain}:`, error);
      return null;
    }
  }

  /**
   * Get the latest block hash
   */
  async getBestBlockHash(chain: string): Promise<string | null> {
    const connection = this.nodeConnections.get(chain.toLowerCase());
    if (!connection) {
      throw new Error(`No connection found for ${chain}. Please connect first.`);
    }

    try {
      const response = await this.makeRPCCall(
        connection.url,
        connection.username,
        connection.password,
        'getbestblockhash',
        []
      );

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.result;
    } catch (error) {
      console.error(`Error getting best block hash for ${chain}:`, error);
      return null;
    }
  }

  /**
   * Make a raw RPC call to the node
   */
  private async makeRPCCall(
    url: string,
    username: string,
    password: string,
    method: string,
    params: any[] = []
  ): Promise<RPCResponse> {
    // Map localhost URLs to proxy paths to avoid CORS issues
    let proxyUrl = url;
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
      const portMap: { [key: string]: string } = {
        '8332': '/api/bitcoin-rpc',
        '9332': '/api/litecoin-rpc',
        '18081': '/api/monero-rpc',
        '51725': '/api/ghost-rpc',
        '51726': '/api/trollcoin-rpc',
        '51727': '/api/hth-rpc',
        '51728': '/api/raptoreum-rpc',
        '8545': '/api/altcoinchain-rpc'
      };
      
      // Extract port from URL
      const portMatch = url.match(/:(\d+)/);
      if (portMatch && portMap[portMatch[1]]) {
        proxyUrl = portMap[portMatch[1]];
      }
    }

    const rpcRequest = {
      jsonrpc: '2.0',
      id: Date.now().toString(),
      method: method,
      params: params
    };

    // Prepare headers
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json'
    };

    // Only add Authorization header if username and password are provided
    if (username && password) {
      const auth = btoa(`${username}:${password}`);
      headers['Authorization'] = `Basic ${auth}`;
    }

    try {
      console.log(`Making RPC call to ${proxyUrl} (original: ${url}) with method ${method}`);
      console.log(`Headers:`, headers);
      console.log(`Request body:`, JSON.stringify(rpcRequest));
      
      // Ensure we're using the correct RPC endpoint
      const rpcUrl = proxyUrl.startsWith('/api/') 
        ? (method === 'get_info' || method === 'get_connections' || method === 'transfer' 
           ? `${proxyUrl}/json_rpc` 
           : proxyUrl)
        : (proxyUrl.endsWith('/json_rpc') ? proxyUrl : `${proxyUrl}/json_rpc`);
      
      console.log(`Final RPC URL: ${rpcUrl}`);
      
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(rpcRequest),
      });

      console.log(`Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP Error Response:`, errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`RPC Response data:`, data);
      return data;
    } catch (error) {
      console.error('RPC call failed:', error);
      
      // Check if it's a CORS error
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.error('CORS Error detected. This is likely a browser security restriction.');
        return {
          error: {
            code: -1,
            message: 'CORS Error: Browser blocked the request. Try using a different browser or disable CORS protection.'
          },
          id: rpcRequest.id
        };
      }
      
      return {
        error: {
          code: -1,
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        id: rpcRequest.id
      };
    }
  }

  /**
   * Get list of connected nodes
   */
  getConnectedNodes(): string[] {
    return Array.from(this.nodeConnections.keys());
  }

  /**
   * Disconnect from a node
   */
  disconnectNode(chain: string): boolean {
    return this.nodeConnections.delete(chain.toLowerCase());
  }

  /**
   * Get default RPC settings for common chains
   */
  getDefaultRPCSettings(chain: string): { url: string; username: string; password: string; port: number } {
    const defaults: { [key: string]: { url: string; username: string; password: string; port: number } } = {
      bitcoin: {
        url: 'http://localhost:8332',
        username: 'bitcoin',
        password: 'bitcoin',
        port: 8332
      },
      litecoin: {
        url: 'http://localhost:9332',
        username: 'litecoin',
        password: 'litecoin',
        port: 9332
      },
      monero: {
        url: 'http://127.0.0.1:18081',
        username: '',
        password: '',
        port: 18081
      },
      ghost: {
        url: 'http://localhost:51725',
        username: 'ghost',
        password: 'ghost',
        port: 51725
      },
      trollcoin: {
        url: 'http://localhost:51726',
        username: 'trollcoin',
        password: 'trollcoin',
        port: 51726
      },
      hth: {
        url: 'http://localhost:51727',
        username: 'hth',
        password: 'hth',
        port: 51727
      },
      raptoreum: {
        url: 'http://localhost:51728',
        username: 'raptoreum',
        password: 'raptoreum',
        port: 51728
      },
      altcoinchain: {
        url: 'http://localhost:8545',
        username: 'altcoinchain',
        password: 'altcoinchain',
        port: 8545
      }
    };

    return defaults[chain.toLowerCase()] || {
      url: 'http://localhost:8332',
      username: 'rpcuser',
      password: 'rpcpassword',
      port: 8332
    };
  }
}

export const realRPCNodeService = RealRPCNodeService.getInstance();
