import { ethers } from 'ethers';
import { rpcNodeService } from './rpcNodeService';

interface AtomicSwapOrder {
  id: string;
  maker: string;
  type: 'buy' | 'sell';
  sendToken: string;
  receiveToken: string;
  sendAmount: string;
  receiveAmount: string;
  rate: string;
  timelock: string;
  status: 'active' | 'matched' | 'completed' | 'expired' | 'cancelled';
  createdAt: Date;
  expiresAt: Date;
  hashLock?: string;
  secretKey?: string;
  swapId?: string;
  txHash?: string;
}

interface SwapDetails {
  id: string;
  maker: string;
  taker: string | null;
  sendChain: string;
  receiveChain: string;
  sendToken: string;
  receiveToken: string;
  sendAmount: string;
  receiveAmount: string;
  depositAddress?: string;
  hashLock: string;
  timelock: number;
  status: 'pending' | 'confirmed' | 'completed' | 'expired' | 'cancelled';
  secretKey?: string;
  txHash?: string;
}

class AtomicSwapService {
  private atomicSwapContract: ethers.Contract | null = null;
  private orderBookContract: ethers.Contract | null = null;
  private utxoHelperContract: ethers.Contract | null = null;
  
  // Contract addresses
  private contractAddresses = {
    atomicSwap: '0x0000000000000000000000000000000000000000', // To be deployed
    orderBook: '0x0000000000000000000000000000000000000000', // To be deployed
    utxoHelper: '0x0000000000000000000000000000000000000000' // To be deployed
  };

  // Initialize contracts
  async initialize(provider: ethers.Provider, signer?: ethers.Signer) {
    try {
      if (this.contractAddresses.atomicSwap !== '0x0000000000000000000000000000000000000000') {
        this.atomicSwapContract = new ethers.Contract(
          this.contractAddresses.atomicSwap,
          this.getAtomicSwapABI(),
          signer || provider
        );
      }
      
      if (this.contractAddresses.orderBook !== '0x0000000000000000000000000000000000000000') {
        this.orderBookContract = new ethers.Contract(
          this.contractAddresses.orderBook,
          this.getOrderBookABI(),
          signer || provider
        );
      }
      
      if (this.contractAddresses.utxoHelper !== '0x0000000000000000000000000000000000000000') {
        this.utxoHelperContract = new ethers.Contract(
          this.contractAddresses.utxoHelper,
          this.getUTXOHelperABI(),
          signer || provider
        );
      }
      
      console.log('✅ Atomic swap contracts initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize atomic swap contracts:', error);
      return false;
    }
  }

  // Create a new order
  async createOrder(
    fromChain: string,
    fromAsset: string,
    fromAmount: string,
    toChain: string,
    toAsset: string,
    toAmount: string,
    orderType: 'buy' | 'sell',
    expirationHours: number
  ): Promise<string | null> {
    try {
      if (!this.orderBookContract) {
        throw new Error('Order book contract not initialized');
      }
      
      const expiresAt = Math.floor(Date.now() / 1000) + (expirationHours * 60 * 60);
      
      const tx = await this.orderBookContract.createOrder(
        fromChain,
        fromAsset,
        ethers.parseUnits(fromAmount, 18), // Assuming 18 decimals
        toChain,
        toAsset,
        ethers.parseUnits(toAmount, 18), // Assuming 18 decimals
        orderType === 'buy' ? 0 : 1, // 0 for BUY, 1 for SELL
        expiresAt
      );
      
      const receipt = await tx.wait();
      
      // Extract order ID from event logs
      const event = receipt.logs.find((log: any) => 
        log.topics[0] === ethers.id('OrderCreated(bytes32,address,string,string,uint256,string,string,uint256,uint8,uint256)')
      );
      
      if (event) {
        const orderId = event.topics[1];
        return orderId;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to create order:', error);
      return null;
    }
  }

  // Get all orders
  async getOrders(): Promise<AtomicSwapOrder[]> {
    try {
      if (!this.orderBookContract) {
        // Return mock data if contract is not initialized
        return this.getMockOrders();
      }
      
      const orderIds = await this.orderBookContract.getAllOrders();
      const orders: AtomicSwapOrder[] = [];
      
      for (const id of orderIds) {
        const order = await this.orderBookContract.getOrder(id);
        
        orders.push({
          id: order.id,
          maker: order.maker,
          type: order.orderType === 0 ? 'buy' : 'sell',
          sendToken: order.fromAsset,
          receiveToken: order.toAsset,
          sendAmount: ethers.formatUnits(order.fromAmount, 18),
          receiveAmount: ethers.formatUnits(order.toAmount, 18),
          rate: (Number(order.toAmount) / Number(order.fromAmount)).toString(),
          timelock: ((order.expiresAt - order.createdAt) / 3600).toString() + ' hours',
          status: this.mapOrderStatus(order.status),
          createdAt: new Date(Number(order.createdAt) * 1000),
          expiresAt: new Date(Number(order.expiresAt) * 1000),
          swapId: order.swapId && order.swapId !== ethers.ZeroHash ? order.swapId : undefined,
          // Only include 'taker' if it exists in 'order' and is not the zero address
          ...(order.taker && order.taker !== ethers.ZeroAddress ? { taker: order.taker } : {})
        });
      }
      
      return orders;
    } catch (error) {
      console.error('Failed to get orders:', error);
      return this.getMockOrders();
    }
  }

  // Get open orders
  async getOpenOrders(): Promise<AtomicSwapOrder[]> {
    try {
      if (!this.orderBookContract) {
        // Return mock data if contract is not initialized
        return this.getMockOrders().filter(order => order.status === 'active');
      }
      
      const orderIds = await this.orderBookContract.getOpenOrders();
      const orders: AtomicSwapOrder[] = [];
      
      for (const id of orderIds) {
        const order = await this.orderBookContract.getOrder(id);
        
        orders.push({
          id: order.id,
          maker: order.maker,
          type: order.orderType === 0 ? 'buy' : 'sell',
          sendToken: order.fromAsset,
          receiveToken: order.toAsset,
          sendAmount: ethers.formatUnits(order.fromAmount, 18),
          receiveAmount: ethers.formatUnits(order.toAmount, 18),
          rate: (Number(order.toAmount) / Number(order.fromAmount)).toString(),
          timelock: ((order.expiresAt - order.createdAt) / 3600).toString() + ' hours',
          status: 'active',
          createdAt: new Date(Number(order.createdAt) * 1000),
          expiresAt: new Date(Number(order.expiresAt) * 1000)
        });
      }
      
      return orders;
    } catch (error) {
      console.error('Failed to get open orders:', error);
      return this.getMockOrders().filter(order => order.status === 'active');
    }
  }

  // Get user's orders
  async getUserOrders(address: string): Promise<AtomicSwapOrder[]> {
    try {
      if (!this.orderBookContract) {
        // Return mock data if contract is not initialized
        return this.getMockOrders().filter(order => order.maker === address);
      }
      
      const orderIds = await this.orderBookContract.getMakerOrders(address);
      const orders: AtomicSwapOrder[] = [];
      
      for (const id of orderIds) {
        const order = await this.orderBookContract.getOrder(id);
        
        orders.push({
          id: order.id,
          maker: order.maker,
          type: order.orderType === 0 ? 'buy' : 'sell',
          sendToken: order.fromAsset,
          receiveToken: order.toAsset,
          sendAmount: ethers.formatUnits(order.fromAmount, 18),
          receiveAmount: ethers.formatUnits(order.toAmount, 18),
          rate: (Number(order.toAmount) / Number(order.fromAmount)).toString(),
          timelock: ((order.expiresAt - order.createdAt) / 3600).toString() + ' hours',
          status: this.mapOrderStatus(order.status),
          createdAt: new Date(Number(order.createdAt) * 1000),
          expiresAt: new Date(Number(order.expiresAt) * 1000),
          swapId: order.swapId !== ethers.ZeroHash ? order.swapId : undefined,
          // taker: order.taker !== ethers.ZeroAddress ? order.taker : undefined
        });
      }
      
      return orders;
    } catch (error) {
      console.error('Failed to get user orders:', error);
      return this.getMockOrders().filter(order => order.maker === address);
    }
  }

  // Create an EVM atomic swap
  async createEVMSwap(
    tokenAddress: string,
    amount: string,
    recipient: string,
    timelock: number
  ): Promise<string | null> {
    try {
      if (!this.atomicSwapContract) {
        throw new Error('Atomic swap contract not initialized');
      }
      
      // Generate a random secret key
      const secretKey = ethers.randomBytes(32);
      const hashLock = ethers.sha256(secretKey);
      
      // Generate swap ID
      const signer = this.atomicSwapContract.runner && 'getAddress' in this.atomicSwapContract.runner 
        ? await (this.atomicSwapContract.runner as any).getAddress() 
        : '';
      const swapId = await this.atomicSwapContract.generateSwapId(
        signer,
        tokenAddress,
        ethers.parseUnits(amount, 18),
        hashLock,
        timelock,
        recipient
      );
      
      let tx;
      
      if (tokenAddress === ethers.ZeroAddress) {
        // Native currency swap
        tx = await this.atomicSwapContract.createNativeSwap(
          swapId,
          hashLock,
          timelock,
          recipient,
          { value: ethers.parseUnits(amount, 18) }
        );
      } else {
        // ERC20 token swap
        // First approve the contract to spend tokens
        const tokenContract = new ethers.Contract(
          tokenAddress,
          ['function approve(address spender, uint256 amount) external returns (bool)'],
          this.atomicSwapContract.runner
        );

        await (await tokenContract.approve(
          this.atomicSwapContract.address,
          ethers.parseUnits(amount, 18)
        )).wait();
        
        // Then create the swap
        tx = await this.atomicSwapContract.createTokenSwap(
          swapId,
          tokenAddress,
          ethers.parseUnits(amount, 18),
          hashLock,
          timelock,
          recipient
        );
      }
      
      await tx.wait();
      
      // Store the secret key securely (in a real app, this would be encrypted)
      localStorage.setItem(`swap_secret_${swapId}`, ethers.hexlify(secretKey));
      
      return swapId;
    } catch (error) {
      console.error('Failed to create EVM swap:', error);
      return null;
    }
  }

  // Create a UTXO atomic swap
  async createUTXOSwap(
    utxoChain: string,
    utxoAddress: string,
    utxoAmount: string,
    timelock: number
  ): Promise<SwapDetails | null> {
    try {
      if (!this.utxoHelperContract) {
        throw new Error('UTXO helper contract not initialized');
      }
      
      // Generate a random secret key
      const secretKey = ethers.randomBytes(32);
      const hashLock = ethers.sha256(secretKey);
      
      // Get chain enum value
      const chainEnum = this.getUTXOChainEnum(utxoChain);
      
      // Generate a deposit address (in a real app, this would be generated by the backend)
      const depositAddress = await this.generateDepositAddress(utxoChain);
      
      // Generate swap ID
      const signerAddress = this.utxoHelperContract.runner && 'getAddress' in this.utxoHelperContract.runner 
        ? await (this.utxoHelperContract.runner as any).getAddress() 
        : '';
      const swapId = await this.utxoHelperContract.generateUTXOSwapId(
        signerAddress,
        chainEnum,
        utxoAddress,
        ethers.parseUnits(utxoAmount, this.getUTXODecimals(utxoChain)),
        depositAddress,
        hashLock,
        timelock
      );
      
      // Create the swap
      const tx = await this.utxoHelperContract.createUTXOSwap(
        swapId,
        chainEnum,
        utxoAddress,
        ethers.parseUnits(utxoAmount, this.getUTXODecimals(utxoChain)),
        depositAddress,
        hashLock,
        timelock
      );
      
      await tx.wait();
      
      // Store the secret key securely (in a real app, this would be encrypted)
      localStorage.setItem(`swap_secret_${swapId}`, ethers.hexlify(secretKey));
      
      return {
        id: swapId,
        maker: this.utxoHelperContract.runner && 'getAddress' in this.utxoHelperContract.runner 
          ? await (this.utxoHelperContract.runner as any).getAddress() 
          : '',
        taker: null,
        sendChain: utxoChain,
        receiveChain: 'ETH', // Default to ETH, but could be any EVM chain
        sendToken: utxoChain,
        receiveToken: 'ETH',
        sendAmount: utxoAmount,
        receiveAmount: '0', // To be filled by taker
        depositAddress,
        hashLock: hashLock,
        timelock,
        status: 'pending',
        secretKey: ethers.hexlify(secretKey)
      };
    } catch (error) {
      console.error('Failed to create UTXO swap:', error);
      return null;
    }
  }

  // Complete an EVM atomic swap
  async completeEVMSwap(swapId: string, secretKey: string): Promise<boolean> {
    try {
      if (!this.atomicSwapContract) {
        throw new Error('Atomic swap contract not initialized');
      }
      
      const tx = await this.atomicSwapContract.completeSwap(swapId, secretKey);
      await tx.wait();
      
      return true;
    } catch (error) {
      console.error('Failed to complete EVM swap:', error);
      return false;
    }
  }

  // Complete a UTXO atomic swap
  async completeUTXOSwap(swapId: string, secretKey: string): Promise<boolean> {
    try {
      if (!this.utxoHelperContract) {
        throw new Error('UTXO helper contract not initialized');
      }
      
      const tx = await this.utxoHelperContract.completeUTXOSwap(swapId, secretKey);
      await tx.wait();
      
      return true;
    } catch (error) {
      console.error('Failed to complete UTXO swap:', error);
      return false;
    }
  }

  // Cancel an order
  async cancelOrder(orderId: string): Promise<boolean> {
    try {
      if (!this.orderBookContract) {
        throw new Error('Order book contract not initialized');
      }
      
      const tx = await this.orderBookContract.cancelOrder(orderId);
      await tx.wait();
      
      return true;
    } catch (error) {
      console.error('Failed to cancel order:', error);
      return false;
    }
  }

  // Fill an order
  async fillOrder(orderId: string, swapId: string): Promise<boolean> {
    try {
      if (!this.orderBookContract) {
        throw new Error('Order book contract not initialized');
      }
      
      const tx = await this.orderBookContract.fillOrder(orderId, swapId);
      await tx.wait();
      
      return true;
    } catch (error) {
      console.error('Failed to fill order:', error);
      return false;
    }
  }

  // Generate a deposit address for UTXO coins
  private async generateDepositAddress(chain: string): Promise<string> {
    try {
      // Check if we have an RPC node for this chain
      const nodes = rpcNodeService.getNodesBySymbol(chain);
      const connectedNode = nodes.find(node => node.isConnected);
      
      if (connectedNode) {
        // Generate address using RPC
        const address = await rpcNodeService.getNewAddress(connectedNode.id);
        return address || this.getMockDepositAddress(chain);
      } else {
        // Return a mock address for demo purposes
        return this.getMockDepositAddress(chain);
      }
    } catch (error) {
      console.error(`Failed to generate deposit address for ${chain}:`, error);
      return this.getMockDepositAddress(chain);
    }
  }

  // Get mock deposit address for demo purposes
  private getMockDepositAddress(chain: string): string {
    switch (chain) {
      case 'BTC':
        return 'bc1q9h6tq79q93y47qpzg0f9znmf5fh3m5dvsxnm7r';
      case 'LTC':
        return 'ltc1qj08ys4ct2hzzc2hcz6h2hgrvlmsjynacp5xh9f';
      case 'XMR':
        return '44AFFq5kSiGBoZ4NMDwYtN18obc8AemS33DBLWs3H7otXft3XjrpDtQGv7SqSsaBYBb98uNbr2VBBEt7f2wfn3RVGQBEP3A';
      case 'GHOST':
        return 'Ghtd7LYP7FzYCxhLTCrLZBXUAmiP8ba2XC';
      case 'TROLL':
        return 'TRoLLcoinCcHUDSrh1Jb6QgFiEMfKxG4VM';
      case 'HTH':
        return 'HelpThehomeLesS1Jb6QgFiEMfKxG4VM';
      case 'RTM':
        return 'RDLxkVuFY3LdFMJXuZJPXrH3GLJqFSYjMg';
      case 'WTX':
        return 'wx1qrpf2gkvrvgwnvy538ax7mdrcuva3sy06pal9kw';
      default:
        return '0x742d35Cc23c3a684194D92Bb99c8b77C7516E6Db';
    }
  }

  // Get UTXO chain enum value
  private getUTXOChainEnum(chain: string): number {
    switch (chain) {
      case 'BTC': return 0;
      case 'LTC': return 1;
      case 'XMR': return 2;
      case 'GHOST': return 3;
      case 'TROLL': return 4;
      case 'HTH': return 5;
      case 'RTM': return 6;
      case 'WTX': return 7;
      default: return 0;
    }
  }

  // Get UTXO decimals
  private getUTXODecimals(chain: string): number {
    switch (chain) {
      case 'BTC': return 8;
      case 'LTC': return 8;
      case 'XMR': return 12;
      case 'GHOST': return 8;
      case 'TROLL': return 8;
      case 'HTH': return 8;
      case 'RTM': return 8;
      case 'WTX': return 8;
      default: return 8;
    }
  }

  // Map order status from contract to UI
  private mapOrderStatus(status: number): 'active' | 'matched' | 'completed' | 'expired' | 'cancelled' {
    switch (status) {
      case 0: return 'active';
      case 1: return 'matched';
      case 2: return 'completed';
      case 3: return 'expired';
      case 4: return 'cancelled';
      default: return 'active';
    }
  }

  // Get mock orders for demo purposes
  private getMockOrders(): AtomicSwapOrder[] {
    return [
      {
        id: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        maker: '0x742d35Cc23c3a684194D92Bb99c8b77C7516E6Db',
        type: 'buy',
        sendToken: 'BTC',
        receiveToken: 'ETH',
        sendAmount: '0.5',
        receiveAmount: '8.25',
        rate: '16.5',
        timelock: '2 hours',
        status: 'active',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000)
      },
      {
        id: '0x2345678901abcdef2345678901abcdef2345678901abcdef2345678901abcdef',
        maker: '0x5678901234abcdef5678901234abcdef56789012',
        type: 'sell',
        sendToken: 'ETH',
        receiveToken: 'ALT',
        sendAmount: '1.5',
        receiveAmount: '750',
        rate: '500',
        timelock: '1.5 hours',
        status: 'active',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() + 1.5 * 60 * 60 * 1000)
      },
      {
        id: '0x3456789012abcdef3456789012abcdef3456789012abcdef3456789012abcdef',
        maker: '0x9abc123456defghi9abc123456defghi9abc1234',
        type: 'buy',
        sendToken: 'ALT',
        receiveToken: 'BTC',
        sendAmount: '5000',
        receiveAmount: '0.25',
        rate: '0.00005',
        timelock: '3 hours',
        status: 'matched',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000)
      },
      {
        id: '0x456789012abcdef456789012abcdef456789012abcdef456789012abcdef4567',
        maker: '0xdef0123456789abcdef0123456789abcdef01234',
        type: 'sell',
        sendToken: 'LTC',
        receiveToken: 'ETH',
        sendAmount: '5',
        receiveAmount: '0.425',
        rate: '0.085',
        timelock: '1 hour',
        status: 'expired',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        id: '0x567890123abcdef567890123abcdef567890123abcdef567890123abcdef5678',
        maker: '0xabc0123456789abcdef0123456789abcdef01234',
        type: 'buy',
        sendToken: 'RTM',
        receiveToken: 'BTC',
        sendAmount: '10000',
        receiveAmount: '0.05',
        rate: '0.000005',
        timelock: '4 hours',
        status: 'active',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000)
      }
    ];
  }

  // Get contract ABIs
  getAtomicSwapABI() {
    return [
      'function createTokenSwap(bytes32 _id, address _tokenContract, uint256 _amount, bytes32 _hashLock, uint256 _timelock, address _recipient) external',
      'function createNativeSwap(bytes32 _id, bytes32 _hashLock, uint256 _timelock, address _recipient) external payable',
      'function completeSwap(bytes32 _id, bytes32 _secretKey) external',
      'function refundSwap(bytes32 _id) external',
      'function cancelSwap(bytes32 _id) external',
      'function getSwap(bytes32 _id) external view returns (address maker, address tokenContract, uint256 amount, bytes32 hashLock, uint256 timelock, address recipient, uint8 status, bytes32 secretKey)',
      'function isValidSwap(bytes32 _id) external view returns (bool)',
      'function generateSwapId(address _maker, address _tokenContract, uint256 _amount, bytes32 _hashLock, uint256 _timelock, address _recipient) external pure returns (bytes32)',
      'event SwapCreated(bytes32 indexed id, address indexed maker, address tokenContract, uint256 amount, bytes32 hashLock, uint256 timelock, address recipient)',
      'event SwapCompleted(bytes32 indexed id, bytes32 secretKey)',
      'event SwapExpired(bytes32 indexed id)',
      'event SwapCancelled(bytes32 indexed id)'
    ];
  }

  getOrderBookABI() {
    return [
      'function createOrder(string memory _fromChain, string memory _fromAsset, uint256 _fromAmount, string memory _toChain, string memory _toAsset, uint256 _toAmount, uint8 _orderType, uint256 _expiresAt) external returns (bytes32)',
      'function fillOrder(bytes32 _orderId, bytes32 _swapId) external',
      'function cancelOrder(bytes32 _orderId) external',
      'function expireOrder(bytes32 _orderId) external',
      'function getOrder(bytes32 _orderId) external view returns (tuple(bytes32 id, address maker, string fromChain, string fromAsset, uint256 fromAmount, string toChain, string toAsset, uint256 toAmount, uint8 orderType, uint8 status, uint256 createdAt, uint256 expiresAt, address taker, bytes32 swapId))',
      'function getAllOrders() external view returns (bytes32[] memory)',
      'function getMakerOrders(address _maker) external view returns (bytes32[] memory)',
      'function getOpenOrders() external view returns (bytes32[] memory)',
      'function getOpenOrdersForPair(string memory _fromChain, string memory _fromAsset, string memory _toChain, string memory _toAsset) external view returns (bytes32[] memory)',
      'event OrderCreated(bytes32 indexed id, address indexed maker, string fromChain, string fromAsset, uint256 fromAmount, string toChain, string toAsset, uint256 toAmount, uint8 orderType, uint256 expiresAt)',
      'event OrderFilled(bytes32 indexed id, address indexed taker, bytes32 swapId)',
      'event OrderCancelled(bytes32 indexed id)',
      'event OrderExpired(bytes32 indexed id)'
    ];
  }

  getUTXOHelperABI() {
    return [
      'function createUTXOSwap(bytes32 _id, uint8 _utxoChain, string memory _utxoAddress, uint256 _utxoAmount, string memory _depositAddress, bytes32 _hashLock, uint256 _timelock) external',
      'function confirmUTXOSwap(bytes32 _id, string memory _txId) external',
      'function completeUTXOSwap(bytes32 _id, bytes32 _secretKey) external',
      'function expireUTXOSwap(bytes32 _id) external',
      'function cancelUTXOSwap(bytes32 _id) external',
      'function getUTXOSwap(bytes32 _id) external view returns (tuple(bytes32 id, address evmParticipant, uint8 utxoChain, string utxoAddress, uint256 utxoAmount, string depositAddress, bytes32 hashLock, uint256 timelock, uint8 status, string txId, bytes32 secretKey))',
      'function generateUTXOSwapId(address _evmParticipant, uint8 _utxoChain, string memory _utxoAddress, uint256 _utxoAmount, string memory _depositAddress, bytes32 _hashLock, uint256 _timelock) external pure returns (bytes32)',
      'function verifySecretKey(bytes32 _secretKey, bytes32 _hashLock) external pure returns (bool)',
      'function generateHashLock(bytes32 _secretKey) external pure returns (bytes32)',
      'event UTXOSwapCreated(bytes32 indexed id, address indexed evmParticipant, uint8 utxoChain, string utxoAddress, uint256 utxoAmount, string depositAddress, bytes32 hashLock, uint256 timelock)',
      'event UTXOSwapConfirmed(bytes32 indexed id, string txId)',
      'event UTXOSwapCompleted(bytes32 indexed id, bytes32 secretKey)',
      'event UTXOSwapExpired(bytes32 indexed id)',
      'event UTXOSwapCancelled(bytes32 indexed id)'
    ];
  }

  // Generate a random secret key
  generateSecretKey(): string {
    return ethers.hexlify(ethers.randomBytes(32));
  }

  // Generate a hash lock from a secret key
  generateHashLock(secretKey: string): string {
    return ethers.sha256(ethers.toUtf8Bytes(secretKey));
  }

  // Verify if a secret key matches a hash lock
  verifySecretKey(secretKey: string, hashLock: string): boolean {
    return ethers.sha256(ethers.toUtf8Bytes(secretKey)) === hashLock;
  }
}

export const atomicSwapService = new AtomicSwapService();
export type { AtomicSwapOrder, SwapDetails };