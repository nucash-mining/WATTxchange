interface MoneroNode {
  id: string;
  host: string;
  port: number;
  networkType: 'MAINNET' | 'STAGENET' | 'TESTNET';
  protocol: 'HTTP' | 'HTTPS';
  status: 'Online' | 'Offline';
  availability: number;
  lastChecked: string;
  location?: string;
  flags?: string[];
  feeEstimate?: number;
}

interface MoneroNodeResponse {
  height: number;
  status: string;
  version: string;
  info?: any;
}

class MoneroNodeService {
  private nodes: MoneroNode[] = [];
  private selectedNode: MoneroNode | null = null;
  private readonly requestId = 1;

  constructor() {
    this.initializeNodes();
  }

  private initializeNodes() {
    // Initialize with nodes from xmr.ditatompel.com screenshot
    this.nodes = [
      {
        id: 'node2-monerodevs',
        host: 'node2.monerodevs.org',
        port: 38089,
        networkType: 'STAGENET',
        protocol: 'HTTP',
        status: 'Online',
        availability: 100,
        lastChecked: '2s ago',
        location: 'France',
        flags: ['AS16276', 'OVH SAS']
      },
      {
        id: 'stagenet-xmr-tw',
        host: 'stagenet.xmr-tw.org',
        port: 38081,
        networkType: 'STAGENET',
        protocol: 'HTTP',
        status: 'Online',
        availability: 98.71,
        lastChecked: '24s ago',
        location: 'Taipei, Taiwan',
        flags: ['AS3462', 'Data Communication Business Group']
      },
      {
        id: 'kabn6mlzjlkd2c-onion',
        host: 'kabn6mlzjlkd2c6ywbdksf2lzm54iebxh4r4ehsnlrbr4ue5m7u6nvad.onion',
        port: 18089,
        networkType: 'MAINNET',
        protocol: 'HTTP',
        status: 'Online',
        availability: 95.98,
        lastChecked: '10s ago',
        flags: ['TOR']
      },
      {
        id: 'tsjo3qzevkrldv-onion',
        host: 'tsjo3qzevkrldvs5uqzwd4ml4y54awm3y6mp7evhjcz56qlhypj2lmyd.onion',
        port: 18089,
        networkType: 'MAINNET',
        protocol: 'HTTP',
        status: 'Online',
        availability: 100,
        lastChecked: '25s ago',
        flags: ['TOR']
      },
      {
        id: 'muuy3c4dpsszpz-onion',
        host: 'muuy3c4dpsszpzwl56wlmu36xjhlxlr4wnxnpfzzgz3r4oiwgjwazh6yd.onion',
        port: 18089,
        networkType: 'MAINNET',
        protocol: 'HTTP',
        status: 'Online',
        availability: 99.29,
        lastChecked: '38s ago',
        flags: ['TOR']
      },
      {
        id: 'crypto01-boldsuck',
        host: 'crypto-01.boldsuck.org',
        port: 18081,
        networkType: 'MAINNET',
        protocol: 'HTTP',
        status: 'Offline',
        availability: 8.22,
        lastChecked: '16s ago',
        location: 'Germany',
        flags: ['AS24961', 'WIIT AG']
      },
      {
        id: 'sdl23gxsslxjdcy-i2p',
        host: 'sdl23gxsslxjdcyjamm7mpzpj3bpdgjqvczuhgwrwi3mdhhcsazl2uja.b32.i2p',
        port: 18081,
        networkType: 'MAINNET',
        protocol: 'HTTP',
        status: 'Offline',
        availability: 73.34,
        lastChecked: '3s ago',
        flags: ['I2P']
      },
      {
        id: 'tht7auncw5ra2r-i2p',
        host: 'tht7auncw5ra2rc4p7xfvzwgfwkwztj4u5qndhpsmqokxpgxr5ila.b32.i2p',
        port: 18081,
        networkType: 'MAINNET',
        protocol: 'HTTP',
        status: 'Offline',
        availability: 75,
        lastChecked: '14s ago',
        flags: ['I2P']
      },
      {
        id: 'vyqpvzgewydhn-i2p',
        host: 'vyqpvzgewydhnr6x7kxugkxo4fhqww6ldbagzgaomv3vhpmlmjfopb2a.b32.i2p',
        port: 18081,
        networkType: 'MAINNET',
        protocol: 'HTTP',
        status: 'Offline',
        availability: 71.43,
        lastChecked: '14s ago',
        flags: ['I2P']
      }
    ];

    // Select the first online node by default
    const onlineNode = this.nodes.find(node => node.status === 'Online');
    if (onlineNode) {
      this.selectedNode = onlineNode;
    }
  }

  async connectToNode(nodeId: string): Promise<boolean> {
    const node = this.nodes.find(n => n.id === nodeId);
    if (!node) {
      console.error(`Node ${nodeId} not found`);
      return false;
    }

    try {
      // Test connection to the node
      const isConnected = await this.testNodeConnection(node);
      if (isConnected) {
        this.selectedNode = node;
        console.log(`Connected to Monero node: ${node.host}:${node.port}`);
        return true;
      } else {
        console.error(`Failed to connect to ${node.host}:${node.port}`);
        return false;
      }
    } catch (error) {
      console.error(`Connection error for ${nodeId}:`, error);
      return false;
    }
  }

  async testNodeConnection(node: MoneroNode): Promise<boolean> {
    try {
      const response = await this.makeRPCCall(node, 'get_info', []);
      return response.result && !response.error;
    } catch (error) {
      console.error(`Test connection failed for ${node.host}:`, error);
      return false;
    }
  }

  async getNodeInfo(): Promise<MoneroNodeResponse | null> {
    if (!this.selectedNode) {
      console.error('No node selected');
      return null;
    }

    try {
      const response = await this.makeRPCCall(this.selectedNode, 'get_info', []);
      
      if (response.error) {
        console.error('RPC call failed:', response.error);
        return null;
      }

      return {
        height: response.result?.height || 0,
        status: response.result?.status || 'unknown',
        version: response.result?.version || 'unknown',
        info: response.result
      };
    } catch (error) {
      console.error('Failed to get node info:', error);
      return null;
    }
  }

  async getBalance(address?: string): Promise<number> {
    if (!this.selectedNode) {
      console.error('No node selected');
      return 0;
    }

    try {
      const response = await this.makeRPCCall(this.selectedNode, 'get_balance', []);
      
      if (response.error) {
        console.error('Balance request failed:', response.error);
        return 0;
      }

      // Convert from atomic units to XMR
      return (response.result?.balance || 0) / 1e12;
    } catch (error) {
      console.error('Failed to get balance:', error);
      return 0;
    }
  }

  async getNewAddress(): Promise<string | null> {
    if (!this.selectedNode) {
      console.error('No node selected');
      return null;
    }

    try {
      const response = await this.makeRPCCall(this.selectedNode, 'create_address', [{
        account_index: 0,
        label: 'WATTxchange Address'
      }]);
      
      if (response.error) {
        console.error('Address generation failed:', response.error);
        return null;
      }

      return response.result?.address || null;
    } catch (error) {
      console.error('Failed to generate address:', error);
      return null;
    }
  }

  async sendTransaction(toAddress: string, amount: number): Promise<string | null> {
    if (!this.selectedNode) {
      console.error('No node selected');
      return null;
    }

    try {
      const response = await this.makeRPCCall(this.selectedNode, 'transfer', [{
        destinations: [{
          address: toAddress,
          amount: amount * 1e12 // Convert to atomic units
        }],
        account_index: 0,
        subaddr_indices: [],
        priority: 1, // Normal priority
        unlock_time: 0
      }]);
      
      if (response.error) {
        console.error('Transaction failed:', response.error);
        return null;
      }

      return response.result?.tx_hash || null;
    } catch (error) {
      console.error('Failed to send transaction:', error);
      return null;
    }
  }

  private async makeRPCCall(node: MoneroNode, method: string, params: any[]): Promise<any> {
    const url = `${node.protocol.toLowerCase()}://${node.host}:${node.port}/json_rpc`;
    
    const requestBody = {
      jsonrpc: '2.0',
      id: this.requestId,
      method,
      params: params.length === 1 ? params[0] : params
    };

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    try {
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
    } catch (error) {
      console.error(`RPC call failed to ${node.host}:${node.port}:`, error);
      throw error;
    }
  }

  getAllNodes(): MoneroNode[] {
    return [...this.nodes];
  }

  getSelectedNode(): MoneroNode | null {
    return this.selectedNode;
  }

  getOnlineNodes(): MoneroNode[] {
    return this.nodes.filter(node => node.status === 'Online');
  }

  getMainnetNodes(): MoneroNode[] {
    return this.nodes.filter(node => node.networkType === 'MAINNET');
  }

  getStagenetNodes(): MoneroNode[] {
    return this.nodes.filter(node => node.networkType === 'STAGENET');
  }

  async refreshNodeStatus(): Promise<void> {
    const promises = this.nodes.map(async (node) => {
      try {
        const isOnline = await this.testNodeConnection(node);
        node.status = isOnline ? 'Online' : 'Offline';
        node.lastChecked = 'Just now';
      } catch (error) {
        node.status = 'Offline';
        node.lastChecked = 'Error';
      }
    });

    await Promise.allSettled(promises);
  }
}

export const moneroNodeService = new MoneroNodeService();
export type { MoneroNode, MoneroNodeResponse };