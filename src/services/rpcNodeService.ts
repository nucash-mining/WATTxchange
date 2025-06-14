interface RPCNodeConfig {
  id: string;
  name: string;
  symbol: string;
  host: string;
  port: number;
  username: string;
  password: string;
  ssl: boolean;
  isConnected: boolean;
  lastPing: Date | null;
  blockHeight: number;
  peers: number;
}

interface RPCResponse {
  result?: any;
  error?: {
    code: number;
    message: string;
  };
  id: number;
}

class RPCNodeService {
  private nodes: Map<string, RPCNodeConfig> = new Map();
  private requestId = 1;

  // Default node configurations for UTXO chains
  private defaultNodes: Record<string, Partial<RPCNodeConfig>> = {
    BTC: {
      name: 'Bitcoin Core',
      symbol: 'BTC',
      port: 8332,
    },
    LTC: {
      name: 'Litecoin Core', 
      symbol: 'LTC',
      port: 9332,
    },
    XMR: {
      name: 'Monero Daemon',
      symbol: 'XMR', 
      port: 18081,
    },
    GHOST: {
      name: 'GHOST Core',
      symbol: 'GHOST',
      port: 51725,
    },
    TROLL: {
      name: 'Trollcoin Core',
      symbol: 'TROLL',
      port: 9666,
    }
  };

  constructor() {
    this.loadSavedNodes();
  }

  private loadSavedNodes() {
    try {
      const saved = localStorage.getItem('rpc_nodes');
      if (saved) {
        const nodes = JSON.parse(saved);
        for (const [key, config] of Object.entries(nodes)) {
          this.nodes.set(key, config as RPCNodeConfig);
        }
      }
    } catch (error) {
      console.error('Failed to load saved nodes:', error);
    }
  }

  private saveNodes() {
    try {
      const nodes = Object.fromEntries(this.nodes);
      localStorage.setItem('rpc_nodes', JSON.stringify(nodes));
    } catch (error) {
      console.error('Failed to save nodes:', error);
    }
  }

  addNode(config: Omit<RPCNodeConfig, 'isConnected' | 'lastPing' | 'blockHeight' | 'peers'>): boolean {
    try {
      const nodeConfig: RPCNodeConfig = {
        ...config,
        isConnected: false,
        lastPing: null,
        blockHeight: 0,
        peers: 0
      };

      this.nodes.set(config.id, nodeConfig);
      this.saveNodes();
      return true;
    } catch (error) {
      console.error('Failed to add node:', error);
      return false;
    }
  }

  updateNode(id: string, updates: Partial<RPCNodeConfig>): boolean {
    try {
      const existing = this.nodes.get(id);
      if (!existing) return false;

      const updated = { ...existing, ...updates };
      this.nodes.set(id, updated);
      this.saveNodes();
      return true;
    } catch (error) {
      console.error('Failed to update node:', error);
      return false;
    }
  }

  removeNode(id: string): boolean {
    try {
      const deleted = this.nodes.delete(id);
      if (deleted) {
        this.saveNodes();
      }
      return deleted;
    } catch (error) {
      console.error('Failed to remove node:', error);
      return false;
    }
  }

  getNode(id: string): RPCNodeConfig | null {
    return this.nodes.get(id) || null;
  }

  getAllNodes(): RPCNodeConfig[] {
    return Array.from(this.nodes.values());
  }

  getNodesBySymbol(symbol: string): RPCNodeConfig[] {
    return Array.from(this.nodes.values()).filter(node => node.symbol === symbol);
  }

  async testConnection(id: string): Promise<boolean> {
    const node = this.nodes.get(id);
    if (!node) return false;

    try {
      const response = await this.makeRPCCall(node, 'getblockchaininfo', []);
      const isConnected = !response.error;
      
      this.updateNode(id, {
        isConnected,
        lastPing: new Date(),
        blockHeight: response.result?.blocks || 0
      });

      return isConnected;
    } catch (error) {
      console.error(`Connection test failed for ${id}:`, error);
      this.updateNode(id, {
        isConnected: false,
        lastPing: new Date()
      });
      return false;
    }
  }

  async getBalance(nodeId: string, address?: string): Promise<number> {
    const node = this.nodes.get(nodeId);
    if (!node || !node.isConnected) return 0;

    try {
      let method = 'getbalance';
      let params: any[] = [];

      // Different RPC methods for different coins
      switch (node.symbol) {
        case 'XMR':
          method = 'get_balance';
          params = [];
          break;
        case 'BTC':
        case 'LTC':
        case 'GHOST':
        case 'TROLL':
          method = 'getbalance';
          params = address ? [address] : [];
          break;
      }

      const response = await this.makeRPCCall(node, method, params);
      
      if (response.error) {
        console.error(`Balance request failed:`, response.error);
        return 0;
      }

      // Handle different response formats
      if (node.symbol === 'XMR') {
        return (response.result?.balance || 0) / 1e12; // Convert from atomic units
      } else {
        return response.result || 0;
      }
    } catch (error) {
      console.error(`Failed to get balance for ${nodeId}:`, error);
      return 0;
    }
  }

  async getNewAddress(nodeId: string): Promise<string | null> {
    const node = this.nodes.get(nodeId);
    if (!node || !node.isConnected) return null;

    try {
      let method = 'getnewaddress';
      let params: any[] = [];

      switch (node.symbol) {
        case 'XMR':
          method = 'get_address';
          params = [];
          break;
        case 'BTC':
        case 'LTC':
        case 'GHOST':
        case 'TROLL':
          method = 'getnewaddress';
          params = [];
          break;
      }

      const response = await this.makeRPCCall(node, method, params);
      
      if (response.error) {
        console.error(`Address generation failed:`, response.error);
        return null;
      }

      if (node.symbol === 'XMR') {
        return response.result?.address || null;
      } else {
        return response.result || null;
      }
    } catch (error) {
      console.error(`Failed to generate address for ${nodeId}:`, error);
      return null;
    }
  }

  async sendTransaction(nodeId: string, toAddress: string, amount: number): Promise<string | null> {
    const node = this.nodes.get(nodeId);
    if (!node || !node.isConnected) return null;

    try {
      let method = 'sendtoaddress';
      let params: any[] = [toAddress, amount];

      switch (node.symbol) {
        case 'XMR':
          method = 'transfer';
          params = [{
            destinations: [{ address: toAddress, amount: amount * 1e12 }] // Convert to atomic units
          }];
          break;
        case 'BTC':
        case 'LTC':
        case 'GHOST':
        case 'TROLL':
          method = 'sendtoaddress';
          params = [toAddress, amount];
          break;
      }

      const response = await this.makeRPCCall(node, method, params);
      
      if (response.error) {
        console.error(`Transaction failed:`, response.error);
        return null;
      }

      if (node.symbol === 'XMR') {
        return response.result?.tx_hash || null;
      } else {
        return response.result || null;
      }
    } catch (error) {
      console.error(`Failed to send transaction for ${nodeId}:`, error);
      return null;
    }
  }

  async getBlockchainInfo(nodeId: string): Promise<any> {
    const node = this.nodes.get(nodeId);
    if (!node || !node.isConnected) return null;

    try {
      let method = 'getblockchaininfo';
      
      if (node.symbol === 'XMR') {
        method = 'get_info';
      }

      const response = await this.makeRPCCall(node, method, []);
      
      if (response.error) {
        console.error(`Blockchain info request failed:`, response.error);
        return null;
      }

      return response.result;
    } catch (error) {
      console.error(`Failed to get blockchain info for ${nodeId}:`, error);
      return null;
    }
  }

  private async makeRPCCall(node: RPCNodeConfig, method: string, params: any[]): Promise<RPCResponse> {
    const url = `${node.ssl ? 'https' : 'http'}://${node.host}:${node.port}`;
    
    const requestBody = {
      jsonrpc: '2.0',
      id: this.requestId++,
      method,
      params
    };

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add basic auth if credentials provided
    if (node.username && node.password) {
      const auth = btoa(`${node.username}:${node.password}`);
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

  getDefaultNodeConfig(symbol: string): Partial<RPCNodeConfig> | null {
    return this.defaultNodes[symbol] || null;
  }

  async pingAllNodes(): Promise<void> {
    const nodes = Array.from(this.nodes.keys());
    await Promise.allSettled(nodes.map(id => this.testConnection(id)));
  }

  // Auto-discovery for local nodes
  async discoverLocalNodes(): Promise<RPCNodeConfig[]> {
    const discovered: RPCNodeConfig[] = [];
    const localhost = '127.0.0.1';

    for (const [symbol, config] of Object.entries(this.defaultNodes)) {
      try {
        const nodeConfig: RPCNodeConfig = {
          id: `local-${symbol.toLowerCase()}`,
          name: `Local ${config.name}`,
          symbol,
          host: localhost,
          port: config.port!,
          username: '',
          password: '',
          ssl: false,
          isConnected: false,
          lastPing: null,
          blockHeight: 0,
          peers: 0
        };

        // Test if node is running locally
        const testResponse = await fetch(`http://${localhost}:${config.port}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'getblockchaininfo',
            params: []
          }),
          signal: AbortSignal.timeout(5000)
        });

        if (testResponse.ok || testResponse.status === 401) { // 401 means auth required but node is running
          discovered.push(nodeConfig);
        }
      } catch (error) {
        // Node not running locally, skip
      }
    }

    return discovered;
  }
}

export const rpcNodeService = new RPCNodeService();
export type { RPCNodeConfig, RPCResponse };