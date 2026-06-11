/**
 * WATTx Bridge Relayer
 *
 * Watches for BridgeInitiated events on all chains and triggers
 * releases on destination chains.
 *
 * Usage:
 *   node scripts/bridgeRelayer.js
 *
 * Environment variables:
 *   RELAYER_PRIVATE_KEY - Private key of the relayer wallet
 *   POLYGON_RPC - Polygon RPC URL (default: https://polygon-rpc.com)
 *   WATTX_RPC - WATTx RPC URL (default: http://127.0.0.1:23889)
 *   ALTCOINCHAIN_RPC - Altcoinchain RPC URL (default: http://127.0.0.1:8545)
 */

const { ethers } = require('ethers');
require('dotenv').config();

// Chain configurations
const CHAINS = {
  polygon: {
    id: 137,
    name: 'Polygon',
    rpc: process.env.POLYGON_RPC || 'https://polygon-rpc.com',
    bridgePool: process.env.POLYGON_BRIDGE_POOL || '0x0000000000000000000000000000000000000000'
  },
  wattx: {
    id: 8889,
    name: 'WATTx',
    rpc: process.env.WATTX_RPC || 'http://127.0.0.1:23889',
    bridgePool: process.env.WATTX_BRIDGE_POOL || '0x0000000000000000000000000000000000000000'
  },
  altcoinchain: {
    id: 2330,
    name: 'Altcoinchain',
    rpc: process.env.ALTCOINCHAIN_RPC || 'http://127.0.0.1:8545',
    bridgePool: process.env.ALTCOINCHAIN_BRIDGE_POOL || '0x0000000000000000000000000000000000000000'
  }
};

// Bridge Pool ABI (events and release function)
const BRIDGE_POOL_ABI = [
  'event BridgeInitiated(bytes32 indexed transferId, address indexed sender, address indexed recipient, uint256 amount, uint256 fee, uint256 sourceChain, uint256 destChain, uint256 timestamp)',
  'event BridgeCompleted(bytes32 indexed transferId, address indexed recipient, uint256 amount, uint256 sourceChain, uint256 destChain, uint256 timestamp)',
  'event BridgePending(bytes32 indexed transferId, address indexed recipient, uint256 amount, uint256 sourceChain, string reason)',
  'function release(bytes32 transferId, address recipient, uint256 amount, uint256 sourceChain) external',
  'function processedTransfers(bytes32) view returns (bool)',
  'function getAvailableLiquidity() view returns (uint256)'
];

// Get chain config by ID
function getChainById(chainId) {
  return Object.values(CHAINS).find(c => c.id === chainId);
}

// Get chain key by ID
function getChainKeyById(chainId) {
  return Object.entries(CHAINS).find(([, c]) => c.id === chainId)?.[0];
}

class BridgeRelayer {
  constructor() {
    this.providers = {};
    this.wallets = {};
    this.contracts = {};
    this.pendingTransfers = new Map();
  }

  async initialize() {
    const privateKey = process.env.RELAYER_PRIVATE_KEY;
    if (!privateKey) {
      console.error('ERROR: RELAYER_PRIVATE_KEY environment variable not set');
      process.exit(1);
    }

    console.log('Initializing Bridge Relayer...\n');

    for (const [key, chain] of Object.entries(CHAINS)) {
      try {
        // Skip if bridge pool not configured
        if (chain.bridgePool === '0x0000000000000000000000000000000000000000') {
          console.log(`⚠ ${chain.name}: Bridge pool not configured, skipping`);
          continue;
        }

        const provider = new ethers.JsonRpcProvider(chain.rpc);
        const wallet = new ethers.Wallet(privateKey, provider);
        const contract = new ethers.Contract(chain.bridgePool, BRIDGE_POOL_ABI, wallet);

        this.providers[key] = provider;
        this.wallets[key] = wallet;
        this.contracts[key] = contract;

        // Test connection
        const blockNumber = await provider.getBlockNumber();
        console.log(`✓ ${chain.name}: Connected (block ${blockNumber})`);
        console.log(`  Bridge Pool: ${chain.bridgePool}`);
        console.log(`  Relayer: ${wallet.address}`);

        // Check liquidity
        const liquidity = await contract.getAvailableLiquidity();
        console.log(`  Liquidity: ${ethers.formatEther(liquidity)} WATT\n`);
      } catch (err) {
        console.error(`✗ ${chain.name}: Failed to connect - ${err.message}\n`);
      }
    }
  }

  async startListening() {
    console.log('\n========================================');
    console.log('Starting Bridge Event Listeners');
    console.log('========================================\n');

    for (const [key, contract] of Object.entries(this.contracts)) {
      const chain = CHAINS[key];

      // Listen for BridgeInitiated events
      contract.on('BridgeInitiated', async (transferId, sender, recipient, amount, fee, sourceChain, destChain, timestamp, event) => {
        console.log(`\n[${new Date().toISOString()}] Bridge Initiated on ${chain.name}`);
        console.log(`  Transfer ID: ${transferId}`);
        console.log(`  From: ${sender}`);
        console.log(`  To: ${recipient}`);
        console.log(`  Amount: ${ethers.formatEther(amount)} WATT`);
        console.log(`  Source Chain: ${sourceChain} (${getChainById(Number(sourceChain))?.name})`);
        console.log(`  Dest Chain: ${destChain} (${getChainById(Number(destChain))?.name})`);

        // Queue the release
        await this.queueRelease({
          transferId,
          sender,
          recipient,
          amount,
          sourceChain: Number(sourceChain),
          destChain: Number(destChain),
          timestamp: Number(timestamp)
        });
      });

      console.log(`✓ Listening for events on ${chain.name}`);
    }
  }

  async queueRelease(transfer) {
    const destChainKey = getChainKeyById(transfer.destChain);
    const destContract = this.contracts[destChainKey];

    if (!destContract) {
      console.error(`  ✗ Destination chain ${transfer.destChain} not available`);
      this.pendingTransfers.set(transfer.transferId, transfer);
      return;
    }

    // Check if already processed
    const alreadyProcessed = await destContract.processedTransfers(transfer.transferId);
    if (alreadyProcessed) {
      console.log(`  ⚠ Transfer already processed`);
      return;
    }

    // Check destination liquidity
    const liquidity = await destContract.getAvailableLiquidity();
    if (liquidity < transfer.amount) {
      console.log(`  ⚠ Insufficient liquidity on destination, queuing...`);
      console.log(`    Required: ${ethers.formatEther(transfer.amount)} WATT`);
      console.log(`    Available: ${ethers.formatEther(liquidity)} WATT`);
      this.pendingTransfers.set(transfer.transferId, transfer);
      return;
    }

    // Execute release
    await this.executeRelease(transfer);
  }

  async executeRelease(transfer) {
    const destChainKey = getChainKeyById(transfer.destChain);
    const destChain = CHAINS[destChainKey];
    const destContract = this.contracts[destChainKey];

    try {
      console.log(`  → Executing release on ${destChain.name}...`);

      const tx = await destContract.release(
        transfer.transferId,
        transfer.recipient,
        transfer.amount,
        transfer.sourceChain
      );

      console.log(`  → TX submitted: ${tx.hash}`);

      const receipt = await tx.wait();

      console.log(`  ✓ Release confirmed in block ${receipt.blockNumber}`);

      // Remove from pending if it was there
      this.pendingTransfers.delete(transfer.transferId);
    } catch (err) {
      console.error(`  ✗ Release failed: ${err.message}`);

      // Queue for retry
      this.pendingTransfers.set(transfer.transferId, {
        ...transfer,
        retryCount: (transfer.retryCount || 0) + 1
      });
    }
  }

  async processPendingTransfers() {
    if (this.pendingTransfers.size === 0) return;

    console.log(`\n[${new Date().toISOString()}] Processing ${this.pendingTransfers.size} pending transfers...`);

    for (const [transferId, transfer] of this.pendingTransfers) {
      // Skip if too many retries
      if (transfer.retryCount >= 10) {
        console.log(`  ⚠ Transfer ${transferId.slice(0, 10)}... exceeded retry limit`);
        continue;
      }

      const destChainKey = getChainKeyById(transfer.destChain);
      const destContract = this.contracts[destChainKey];

      if (!destContract) continue;

      // Check liquidity
      const liquidity = await destContract.getAvailableLiquidity();
      if (liquidity >= transfer.amount) {
        await this.executeRelease(transfer);
      }
    }
  }

  async run() {
    await this.initialize();
    await this.startListening();

    // Process pending transfers every 30 seconds
    setInterval(() => this.processPendingTransfers(), 30000);

    console.log('\n========================================');
    console.log('Bridge Relayer Running');
    console.log('Press Ctrl+C to stop');
    console.log('========================================\n');
  }
}

// Main
const relayer = new BridgeRelayer();
relayer.run().catch(console.error);
