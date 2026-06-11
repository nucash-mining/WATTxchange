/**
 * Deploy WATTxBridgePool contracts to all three chains
 *
 * Usage:
 *   npx hardhat run scripts/deployBridgePools.js --network <network>
 *
 * Or run for each network:
 *   CHAIN=wattx npx hardhat run scripts/deployBridgePools.js
 *   CHAIN=polygon npx hardhat run scripts/deployBridgePools.js
 *   CHAIN=altcoinchain npx hardhat run scripts/deployBridgePools.js
 */

const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

// Chain configurations
const CHAINS = {
  wattx: {
    id: 8889,
    name: 'WATTx Mainnet',
    wattToken: '0x0000000000000000000000000000000000000000', // Update with actual token
    isMainnet: true
  },
  polygon: {
    id: 137,
    name: 'Polygon',
    wattToken: '0xE960d5076cd3169C343Ee287A2c3380A222e5839',
    isMainnet: false
  },
  altcoinchain: {
    id: 2330,
    name: 'Altcoinchain',
    wattToken: '0x6645143e49B3a15d8F205658903a55E520444698',
    isMainnet: false
  }
};

async function main() {
  const chainName = process.env.CHAIN || 'altcoinchain';
  const chain = CHAINS[chainName];

  if (!chain) {
    console.error(`Unknown chain: ${chainName}`);
    console.log('Available chains:', Object.keys(CHAINS).join(', '));
    process.exit(1);
  }

  console.log(`\n========================================`);
  console.log(`Deploying WATTxBridgePool to ${chain.name}`);
  console.log(`========================================\n`);

  const [deployer] = await ethers.getSigners();
  console.log('Deployer address:', deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log('Deployer balance:', ethers.formatEther(balance), 'ETH/Native\n');

  // Get contract factory
  const WATTxBridgePool = await ethers.getContractFactory('WATTxBridgePool');

  // Deploy
  console.log('Deploying WATTxBridgePool...');
  console.log('  WATT Token:', chain.wattToken);
  console.log('  Chain ID:', chain.id);
  console.log('  Is Mainnet:', chain.isMainnet);

  const bridgePool = await WATTxBridgePool.deploy(
    chain.wattToken,
    chain.id,
    chain.isMainnet
  );

  await bridgePool.waitForDeployment();
  const poolAddress = await bridgePool.getAddress();

  console.log('\n✓ WATTxBridgePool deployed to:', poolAddress);

  // Save deployment info
  const deploymentInfo = {
    network: chainName,
    chainId: chain.id,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      WATTxBridgePool: {
        address: poolAddress,
        wattToken: chain.wattToken,
        isMainnet: chain.isMainnet
      }
    }
  };

  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentPath = path.join(deploymentsDir, `bridge-pool-${chainName}.json`);
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log('\n✓ Deployment info saved to:', deploymentPath);

  // Verify contract info
  console.log('\n----------------------------------------');
  console.log('Contract Verification Info:');
  console.log('----------------------------------------');
  console.log('Contract:', 'WATTxBridgePool');
  console.log('Address:', poolAddress);
  console.log('Constructor Args:');
  console.log('  _wattToken:', chain.wattToken);
  console.log('  _chainId:', chain.id);
  console.log('  _isMainnet:', chain.isMainnet);
  console.log('----------------------------------------\n');

  // Post-deployment setup
  console.log('Post-deployment setup:');
  console.log('1. Add relayer addresses using addRelayer()');
  console.log('2. Add initial liquidity using addLiquidity()');
  console.log('3. Update bridge pool addresses in:');
  console.log('   - src/services/wattxBridgeService.ts');
  console.log('   - src/components/DeFiHubView.tsx');
  console.log('');
  console.log('To add a relayer:');
  console.log(`  await bridgePool.addRelayer("0xRELAYER_ADDRESS")`);
  console.log('');
  console.log('To add liquidity:');
  console.log(`  await wattToken.approve(bridgePool.address, amount)`);
  console.log(`  await bridgePool.addLiquidity(amount)`);

  return poolAddress;
}

main()
  .then((address) => {
    console.log('\n✓ Deployment complete!');
    console.log('Bridge Pool Address:', address);
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Deployment failed:', error);
    process.exit(1);
  });
