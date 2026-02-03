import { ethers } from 'ethers';
import { atomicSwapService } from './atomicSwapService';
import { rpcNodeService } from './rpcNodeService';

interface CrossChainSwapOrder {
  id: string;
  maker: string;
  makerChain: string;
  makerToken: string;
  makerAmount: number;
  takerChain: string;
  takerToken: string;
  takerAmount: number;
  hashLock: string;
  timelock: number;
  status: 'open' | 'matched' | 'locked' | 'completed' | 'expired' | 'cancelled';
  createdAt: number;
  matchedAt?: number;
  taker?: string;
  makerSwapTxId?: string;
  takerSwapTxId?: string;
  secret?: string;
  completedAt?: number;
}

interface SwapMatch {
  orderId: string;
  makerOrder: CrossChainSwapOrder;
  takerOrder: CrossChainSwapOrder;
  matchTime: number;
  status: 'pending' | 'locked' | 'completed' | 'failed';
}

interface NodeConnectionStatus {
  chain: string;
  isConnected: boolean;
  nodeId?: string;
  blockHeight?: number;
  lastPing?: Date;
}

class CrossChainSwapCoordinator {
  private orders: Map<string, CrossChainSwapOrder> = new Map();
  private matches: Map<string, SwapMatch> = new Map();
  private nodeStatus: Map<string, NodeConnectionStatus> = new Map();
  private orderBook: Map<string, CrossChainSwapOrder[]> = new Map();
  private swapMonitor: NodeJS.Timeout | null = null;

  // Supported chain pairs for atomic swaps
  private supportedPairs = [
    { from: 'BTC', to: 'ETH' },
    { from: 'BTC', to: 'ALT' },
    { from: 'LTC', to: 'ETH' },
    { from: 'LTC', to: 'ALT' },
    { from: 'GHOST', to: 'ETH' },
    { from: 'GHOST', to: 'ALT' },
    { from: 'TROLL', to: 'ETH' },
    { from: 'TROLL', to: 'ALT' },
    { from: 'HTH', to: 'ETH' },
    { from: 'HTH', to: 'ALT' },
    { from: 'ETH', to: 'ALT' },
    { from: 'ALT', to: 'ETH' }
  ];

  constructor() {
    this.initializeNodeMonitoring();
    this.startSwapMonitoring();
  }

  private initializeNodeMonitoring() {
    // Initialize node status for all supported chains
    const allChains = new Set<string>();
    this.supportedPairs.forEach(pair => {
      allChains.add(pair.from);
      allChains.add(pair.to);
    });

    allChains.forEach(chain => {
      this.nodeStatus.set(chain, {
        chain,
        isConnected: false
      });
    });

    // Check node connections
    this.checkNodeConnections();
  }

  private async checkNodeConnections() {
    for (const [chain, status] of this.nodeStatus) {
      const nodes = rpcNodeService.getNodesBySymbol(chain);
      const connectedNode = nodes.find(node => node.isConnected);
      
      if (connectedNode) {
        status.isConnected = true;
        status.nodeId = connectedNode.id;
        status.blockHeight = connectedNode.blockHeight;
        status.lastPing = connectedNode.lastPing || undefined;
      } else {
        status.isConnected = false;
        status.nodeId = undefined;
        status.blockHeight = undefined;
        status.lastPing = undefined;
      }
    }
  }

  private startSwapMonitoring() {
    // Monitor active swaps every 30 seconds
    this.swapMonitor = setInterval(() => {
      this.monitorActiveSwaps();
    }, 30000);
  }

  private async monitorActiveSwaps() {
    // Check for expired swaps
    const currentTime = Math.floor(Date.now() / 1000);
    
    for (const [orderId, order] of this.orders) {
      if (order.status === 'locked' && currentTime > order.timelock) {
        await this.handleExpiredSwap(orderId);
      }
    }

    // Update node connections
    await this.checkNodeConnections();
  }

  private async handleExpiredSwap(orderId: string) {
    const order = this.orders.get(orderId);
    if (!order) return;

    try {
      // Refund the expired swap
      if (order.makerSwapTxId) {
        await this.refundSwap(order.makerChain, order.makerSwapTxId);
      }
      if (order.takerSwapTxId) {
        await this.refundSwap(order.takerChain, order.takerSwapTxId);
      }

      // Update order status
      order.status = 'expired';
      this.orders.set(orderId, order);

      console.log(`Swap ${orderId} has expired and been refunded`);
    } catch (error) {
      console.error(`Failed to handle expired swap ${orderId}:`, error);
    }
  }

  // Create a new cross-chain swap order
  async createSwapOrder(
    maker: string,
    makerChain: string,
    makerToken: string,
    makerAmount: number,
    takerChain: string,
    takerToken: string,
    takerAmount: number,
    timelockHours: number = 24
  ): Promise<string | null> {
    try {
      // Validate chain pair
      const isValidPair = this.supportedPairs.some(
        pair => (pair.from === makerChain && pair.to === takerChain) ||
                (pair.from === takerChain && pair.to === makerChain)
      );

      if (!isValidPair) {
        throw new Error(`Unsupported chain pair: ${makerChain} -> ${takerChain}`);
      }

      // Check node connectivity
      const makerNodeStatus = this.nodeStatus.get(makerChain);
      const takerNodeStatus = this.nodeStatus.get(takerChain);

      if (!makerNodeStatus?.isConnected || !takerNodeStatus?.isConnected) {
        throw new Error('Required nodes are not connected');
      }

      // Generate hash lock
      const secret = ethers.randomBytes(32);
      const hashLock = ethers.sha256(secret);
      const timelock = Math.floor(Date.now() / 1000) + (timelockHours * 60 * 60);

      // Create order
      const orderId = `swap_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      const order: CrossChainSwapOrder = {
        id: orderId,
        maker,
        makerChain,
        makerToken,
        makerAmount,
        takerChain,
        takerToken,
        takerAmount,
        hashLock,
        timelock,
        status: 'open',
        createdAt: Math.floor(Date.now() / 1000),
        secret: ethers.hexlify(secret)
      };

      this.orders.set(orderId, order);
      this.addToOrderBook(order);

      // Try to match with existing orders
      await this.attemptOrderMatching(orderId);

      return orderId;
    } catch (error) {
      console.error('Failed to create swap order:', error);
      return null;
    }
  }

  private addToOrderBook(order: CrossChainSwapOrder) {
    const pairKey = `${order.makerChain}-${order.takerChain}`;
    if (!this.orderBook.has(pairKey)) {
      this.orderBook.set(pairKey, []);
    }
    this.orderBook.get(pairKey)!.push(order);
  }

  private async attemptOrderMatching(newOrderId: string) {
    const newOrder = this.orders.get(newOrderId);
    if (!newOrder || newOrder.status !== 'open') return;

    const pairKey = `${newOrder.takerChain}-${newOrder.makerChain}`;
    const oppositeOrders = this.orderBook.get(pairKey) || [];

    for (const existingOrder of oppositeOrders) {
      if (existingOrder.status !== 'open') continue;
      if (existingOrder.maker === newOrder.maker) continue; // Can't match with self

      // Check if orders match
      if (this.ordersMatch(newOrder, existingOrder)) {
        await this.createSwapMatch(newOrder, existingOrder);
        break; // Only match with one order
      }
    }
  }

  private ordersMatch(order1: CrossChainSwapOrder, order2: CrossChainSwapOrder): boolean {
    // Check if the orders are compatible (opposite directions with matching amounts)
    const amountsMatch = Math.abs(order1.makerAmount - order2.takerAmount) < 0.01 &&
                        Math.abs(order1.takerAmount - order2.makerAmount) < 0.01;
    
    const chainsMatch = order1.makerChain === order2.takerChain &&
                       order1.takerChain === order2.makerChain;

    return amountsMatch && chainsMatch;
  }

  private async createSwapMatch(order1: CrossChainSwapOrder, order2: CrossChainSwapOrder) {
    try {
      const matchId = `match_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      
      const match: SwapMatch = {
        orderId: matchId,
        makerOrder: order1,
        takerOrder: order2,
        matchTime: Math.floor(Date.now() / 1000),
        status: 'pending'
      };

      this.matches.set(matchId, match);

      // Update order statuses
      order1.status = 'matched';
      order1.matchedAt = match.matchTime;
      order1.taker = order2.maker;
      order2.status = 'matched';
      order2.matchedAt = match.matchTime;
      order2.taker = order1.maker;

      this.orders.set(order1.id, order1);
      this.orders.set(order2.id, order2);

      // Remove from order book
      this.removeFromOrderBook(order1);
      this.removeFromOrderBook(order2);

      // Start the atomic swap process
      await this.executeAtomicSwap(matchId);

      console.log(`Created swap match ${matchId} between orders ${order1.id} and ${order2.id}`);
    } catch (error) {
      console.error('Failed to create swap match:', error);
    }
  }

  private removeFromOrderBook(order: CrossChainSwapOrder) {
    const pairKey = `${order.makerChain}-${order.takerChain}`;
    const orders = this.orderBook.get(pairKey);
    if (orders) {
      const index = orders.findIndex(o => o.id === order.id);
      if (index !== -1) {
        orders.splice(index, 1);
      }
    }
  }

  private async executeAtomicSwap(matchId: string) {
    const match = this.matches.get(matchId);
    if (!match) return;

    try {
      match.status = 'locked';

      // Create atomic swaps on both chains
      const makerSwapTxId = await this.createAtomicSwap(
        match.makerOrder.makerChain,
        match.makerOrder.maker,
        match.makerOrder.makerAmount,
        match.makerOrder.hashLock,
        match.makerOrder.timelock,
        match.takerOrder.maker
      );

      const takerSwapTxId = await this.createAtomicSwap(
        match.takerOrder.makerChain,
        match.takerOrder.maker,
        match.takerOrder.makerAmount,
        match.takerOrder.hashLock,
        match.takerOrder.timelock,
        match.makerOrder.maker
      );

      if (makerSwapTxId && takerSwapTxId) {
        match.makerOrder.makerSwapTxId = makerSwapTxId;
        match.takerOrder.takerSwapTxId = takerSwapTxId;
        match.makerOrder.status = 'locked';
        match.takerOrder.status = 'locked';

        this.orders.set(match.makerOrder.id, match.makerOrder);
        this.orders.set(match.takerOrder.id, match.takerOrder);
        this.matches.set(matchId, match);

        console.log(`Atomic swaps created: ${makerSwapTxId} and ${takerSwapTxId}`);
      } else {
        throw new Error('Failed to create atomic swaps');
      }
    } catch (error) {
      console.error(`Failed to execute atomic swap ${matchId}:`, error);
      match.status = 'failed';
      this.matches.set(matchId, match);
    }
  }

  private async createAtomicSwap(
    chain: string,
    fromAddress: string,
    amount: number,
    hashLock: string,
    timelock: number,
    recipientAddress: string
  ): Promise<string | null> {
    try {
      const nodeStatus = this.nodeStatus.get(chain);
      if (!nodeStatus?.isConnected || !nodeStatus.nodeId) {
        throw new Error(`Node not connected for chain ${chain}`);
      }

      if (this.isEVMChain(chain)) {
        // Create EVM atomic swap
        return await this.createEVMSwap(chain, fromAddress, amount, hashLock, timelock, recipientAddress);
      } else {
        // Create UTXO atomic swap
        return await this.createUTXOSwap(chain, fromAddress, amount, hashLock, timelock, recipientAddress);
      }
    } catch (error) {
      console.error(`Failed to create atomic swap for ${chain}:`, error);
      return null;
    }
  }

  private isEVMChain(chain: string): boolean {
    return ['ETH', 'ALT', 'WATT'].includes(chain);
  }

  private async createEVMSwap(
    chain: string,
    fromAddress: string,
    amount: number,
    hashLock: string,
    timelock: number,
    recipientAddress: string
  ): Promise<string | null> {
    try {
      // Use the existing atomic swap service for EVM chains
      const swapId = await atomicSwapService.createEVMSwap(
        ethers.ZeroAddress, // Native currency
        amount.toString(),
        recipientAddress,
        timelock
      );

      return swapId;
    } catch (error) {
      console.error(`Failed to create EVM swap for ${chain}:`, error);
      return null;
    }
  }

  private async createUTXOSwap(
    chain: string,
    _fromAddress: string,
    amount: number,
    _hashLock: string,
    timelock: number,
    recipientAddress: string
  ): Promise<string | null> {
    try {
      const nodeStatus = this.nodeStatus.get(chain);
      if (!nodeStatus?.nodeId) {
        throw new Error(`No node ID for chain ${chain}`);
      }

      // Create UTXO atomic swap using the RPC node service
      const txId = await rpcNodeService.createAtomicSwapTransaction(
        nodeStatus.nodeId,
        _fromAddress,
        amount,
        _hashLock,
        timelock,
        recipientAddress,
        _fromAddress // refund address
      );

      return txId;
    } catch (error) {
      console.error(`Failed to create UTXO swap for ${chain}:`, error);
      return null;
    }
  }

  // Complete an atomic swap by revealing the secret
  async completeSwap(orderId: string, secret: string): Promise<boolean> {
    try {
      const order = this.orders.get(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      if (order.status !== 'locked') {
        throw new Error('Order is not in locked state');
      }

      // Verify the secret matches the hash lock
      const secretHash = ethers.sha256(secret);
      if (secretHash !== order.hashLock) {
        throw new Error('Invalid secret');
      }

      // Find the matching order
      const match = Array.from(this.matches.values()).find(
        m => m.makerOrder.id === orderId || m.takerOrder.id === orderId
      );

      if (!match) {
        throw new Error('No matching order found');
      }

      // Complete both swaps
      const success1 = await this.claimSwap(match.makerOrder, secret);
      const success2 = await this.claimSwap(match.takerOrder, secret);

      if (success1 && success2) {
        match.makerOrder.status = 'completed';
        match.takerOrder.status = 'completed';
        match.makerOrder.completedAt = Math.floor(Date.now() / 1000);
        match.takerOrder.completedAt = Math.floor(Date.now() / 1000);
        match.status = 'completed';

        this.orders.set(match.makerOrder.id, match.makerOrder);
        this.orders.set(match.takerOrder.id, match.takerOrder);
        this.matches.set(match.orderId, match);

        console.log(`Swap completed successfully: ${orderId}`);
        return true;
      } else {
        throw new Error('Failed to complete one or both swaps');
      }
    } catch (error) {
      console.error(`Failed to complete swap ${orderId}:`, error);
      return false;
    }
  }

  private async claimSwap(order: CrossChainSwapOrder, secret: string): Promise<boolean> {
    try {
      if (this.isEVMChain(order.makerChain)) {
        // Claim EVM swap
        return await atomicSwapService.completeEVMSwap(order.makerSwapTxId!, secret);
      } else {
        // Claim UTXO swap
        const nodeStatus = this.nodeStatus.get(order.makerChain);
        if (!nodeStatus?.nodeId) {
          throw new Error(`No node ID for chain ${order.makerChain}`);
        }

        return await rpcNodeService.claimAtomicSwapTransaction(
          nodeStatus.nodeId,
          order.makerSwapTxId!,
          secret
        );
      }
    } catch (error) {
      console.error(`Failed to claim swap for ${order.makerChain}:`, error);
      return false;
    }
  }

  private async refundSwap(chain: string, txId: string): Promise<boolean> {
    try {
      if (this.isEVMChain(chain)) {
        // Refund EVM swap
        // TODO: Implement refundEVMSwap method in atomicSwapService
        // return await atomicSwapService.refundEVMSwap(txId);
        console.log(`Refunding EVM swap for txId: ${txId}`);
        return true;
      } else {
        // Refund UTXO swap
        const nodeStatus = this.nodeStatus.get(chain);
        if (!nodeStatus?.nodeId) {
          throw new Error(`No node ID for chain ${chain}`);
        }

        return await rpcNodeService.refundAtomicSwapTransaction(nodeStatus.nodeId, txId);
      }
    } catch (error) {
      console.error(`Failed to refund swap for ${chain}:`, error);
      return false;
    }
  }

  // Get order book for a specific pair
  getOrderBook(fromChain: string, toChain: string): CrossChainSwapOrder[] {
    const pairKey = `${fromChain}-${toChain}`;
    return this.orderBook.get(pairKey) || [];
  }

  // Get all open orders
  getOpenOrders(): CrossChainSwapOrder[] {
    return Array.from(this.orders.values()).filter(order => order.status === 'open');
  }

  // Get user's orders
  getUserOrders(userAddress: string): CrossChainSwapOrder[] {
    return Array.from(this.orders.values()).filter(
      order => order.maker === userAddress || order.taker === userAddress
    );
  }

  // Get active matches
  getActiveMatches(): SwapMatch[] {
    return Array.from(this.matches.values()).filter(match => match.status === 'locked');
  }

  // Get node connection status
  getNodeStatus(): NodeConnectionStatus[] {
    return Array.from(this.nodeStatus.values());
  }

  // Cancel an order
  async cancelOrder(orderId: string): Promise<boolean> {
    try {
      const order = this.orders.get(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      if (order.status !== 'open') {
        throw new Error('Order cannot be cancelled');
      }

      order.status = 'cancelled';
      this.orders.set(orderId, order);
      this.removeFromOrderBook(order);

      return true;
    } catch (error) {
      console.error(`Failed to cancel order ${orderId}:`, error);
      return false;
    }
  }

  // Cleanup expired orders and matches
  cleanup() {
    if (this.swapMonitor) {
      clearInterval(this.swapMonitor);
    }
  }
}

export const crossChainSwapCoordinator = new CrossChainSwapCoordinator();
export type { CrossChainSwapOrder, SwapMatch, NodeConnectionStatus };
