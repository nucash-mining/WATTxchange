/**
 * Direct deployment of WATTxBridgePool to Altcoinchain
 * Uses ethers.js directly with compiled bytecode
 *
 * Usage: node scripts/deployBridgePoolDirect.js
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const solc = require('solc');

// Altcoinchain WATT token address
const WATT_TOKEN = '0x6645143e49B3a15d8F205658903a55E520444698';
const CHAIN_ID = 2330;
const IS_MAINNET = false;

// RPC URL
const RPC_URL = process.env.ALTCOINCHAIN_RPC || 'https://alt-rpc2.minethepla.net';

// Contract source (simplified version without OpenZeppelin imports for direct deployment)
const CONTRACT_SOURCE = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract WATTxBridgePool {
    IERC20 public immutable wattToken;
    uint256 public immutable chainId;
    bool public immutable isMainnet;

    address public owner;
    mapping(address => bool) public relayers;
    mapping(uint256 => bool) public supportedChains;
    mapping(bytes32 => bool) public processedTransfers;

    uint256 public bridgeFee = 10; // 0.1% in basis points
    uint256 public minBridgeAmount = 0.001 ether;
    uint256 public maxBridgeAmount = 1000000 ether;
    uint256 public nonce;

    uint256 public totalLocked;
    uint256 public totalReleased;
    uint256 public totalFeesCollected;

    bool public paused;

    struct PendingRelease {
        address recipient;
        uint256 amount;
        uint256 sourceChain;
        uint256 timestamp;
        bool processed;
    }
    mapping(bytes32 => PendingRelease) public pendingReleases;
    bytes32[] public pendingReleaseIds;

    event BridgeInitiated(
        bytes32 indexed transferId,
        address indexed sender,
        address indexed recipient,
        uint256 amount,
        uint256 fee,
        uint256 sourceChain,
        uint256 destChain,
        uint256 timestamp
    );

    event BridgeCompleted(
        bytes32 indexed transferId,
        address indexed recipient,
        uint256 amount,
        uint256 sourceChain,
        uint256 destChain,
        uint256 timestamp
    );

    event BridgePending(
        bytes32 indexed transferId,
        address indexed recipient,
        uint256 amount,
        uint256 sourceChain,
        string reason
    );

    event LiquidityAdded(address indexed provider, uint256 amount);
    event LiquidityRemoved(address indexed provider, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyRelayer() {
        require(relayers[msg.sender], "Not relayer");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Paused");
        _;
    }

    constructor(address _wattToken, uint256 _chainId, bool _isMainnet) {
        require(_wattToken != address(0), "Invalid token");
        wattToken = IERC20(_wattToken);
        chainId = _chainId;
        isMainnet = _isMainnet;
        owner = msg.sender;
        relayers[msg.sender] = true;

        supportedChains[8889] = true;  // WATTx
        supportedChains[137] = true;   // Polygon
        supportedChains[2330] = true;  // Altcoinchain
    }

    function bridge(uint256 destChain, address recipient, uint256 amount) external whenNotPaused {
        require(supportedChains[destChain], "Unsupported chain");
        require(destChain != chainId, "Same chain");
        require(recipient != address(0), "Invalid recipient");
        require(amount >= minBridgeAmount, "Below minimum");
        require(amount <= maxBridgeAmount, "Above maximum");

        uint256 fee = (amount * bridgeFee) / 10000;
        uint256 netAmount = amount - fee;

        require(wattToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        totalLocked += amount;
        totalFeesCollected += fee;

        bytes32 transferId = keccak256(abi.encodePacked(
            chainId, destChain, msg.sender, recipient, netAmount, nonce++, block.timestamp
        ));

        emit BridgeInitiated(transferId, msg.sender, recipient, netAmount, fee, chainId, destChain, block.timestamp);
    }

    function release(bytes32 transferId, address recipient, uint256 amount, uint256 sourceChain) external onlyRelayer {
        require(!processedTransfers[transferId], "Already processed");
        require(supportedChains[sourceChain], "Unsupported source");
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Invalid amount");

        uint256 available = getAvailableLiquidity();

        if (available >= amount) {
            processedTransfers[transferId] = true;
            totalReleased += amount;
            require(wattToken.transfer(recipient, amount), "Transfer failed");
            emit BridgeCompleted(transferId, recipient, amount, sourceChain, chainId, block.timestamp);
        } else {
            pendingReleases[transferId] = PendingRelease(recipient, amount, sourceChain, block.timestamp, false);
            pendingReleaseIds.push(transferId);
            emit BridgePending(transferId, recipient, amount, sourceChain, "Insufficient liquidity");
        }
    }

    function processPendingReleases(uint256 maxToProcess) external {
        uint256 processed = 0;
        uint256 available = getAvailableLiquidity();

        for (uint256 i = 0; i < pendingReleaseIds.length && processed < maxToProcess; i++) {
            bytes32 transferId = pendingReleaseIds[i];
            PendingRelease storage pending = pendingReleases[transferId];

            if (!pending.processed && pending.amount <= available) {
                pending.processed = true;
                processedTransfers[transferId] = true;
                totalReleased += pending.amount;
                available -= pending.amount;
                require(wattToken.transfer(pending.recipient, pending.amount), "Transfer failed");
                emit BridgeCompleted(transferId, pending.recipient, pending.amount, pending.sourceChain, chainId, block.timestamp);
                processed++;
            }
        }
    }

    function addLiquidity(uint256 amount) external {
        require(amount > 0, "Zero amount");
        require(wattToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        emit LiquidityAdded(msg.sender, amount);
    }

    function removeLiquidity(uint256 amount, address recipient) external onlyOwner {
        require(amount <= getAvailableLiquidity(), "Insufficient liquidity");
        require(wattToken.transfer(recipient, amount), "Transfer failed");
        emit LiquidityRemoved(recipient, amount);
    }

    function withdrawFees(address recipient) external onlyOwner {
        uint256 fees = totalFeesCollected;
        require(fees > 0, "No fees");
        totalFeesCollected = 0;
        require(wattToken.transfer(recipient, fees), "Transfer failed");
    }

    function getAvailableLiquidity() public view returns (uint256) {
        uint256 balance = wattToken.balanceOf(address(this));
        return balance > totalFeesCollected ? balance - totalFeesCollected : 0;
    }

    function getPoolStats() external view returns (
        uint256 _totalLocked,
        uint256 _totalReleased,
        uint256 _totalFees,
        uint256 _availableLiquidity,
        uint256 _pendingCount
    ) {
        _totalLocked = totalLocked;
        _totalReleased = totalReleased;
        _totalFees = totalFeesCollected;
        _availableLiquidity = getAvailableLiquidity();
        for (uint256 i = 0; i < pendingReleaseIds.length; i++) {
            if (!pendingReleases[pendingReleaseIds[i]].processed) _pendingCount++;
        }
    }

    function addRelayer(address relayer) external onlyOwner {
        relayers[relayer] = true;
    }

    function removeRelayer(address relayer) external onlyOwner {
        relayers[relayer] = false;
    }

    function setBridgeFee(uint256 _fee) external onlyOwner {
        require(_fee <= 500, "Fee too high");
        bridgeFee = _fee;
    }

    function setSupportedChain(uint256 _chainId, bool _supported) external onlyOwner {
        supportedChains[_chainId] = _supported;
    }

    function pause() external onlyOwner { paused = true; }
    function unpause() external onlyOwner { paused = false; }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid owner");
        owner = newOwner;
    }
}
`;

async function compile() {
  console.log('Compiling contract...');

  const input = {
    language: 'Solidity',
    sources: {
      'WATTxBridgePool.sol': { content: CONTRACT_SOURCE }
    },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: 'london', // Use London EVM to avoid PUSH0 opcode
      outputSelection: {
        '*': { '*': ['abi', 'evm.bytecode'] }
      }
    }
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  if (output.errors) {
    const errors = output.errors.filter(e => e.severity === 'error');
    if (errors.length > 0) {
      console.error('Compilation errors:');
      errors.forEach(e => console.error(e.formattedMessage));
      process.exit(1);
    }
  }

  const contract = output.contracts['WATTxBridgePool.sol']['WATTxBridgePool'];
  return {
    abi: contract.abi,
    bytecode: contract.evm.bytecode.object
  };
}

async function deploy() {
  console.log('\n========================================');
  console.log('WATTxBridgePool Deployment to Altcoinchain');
  console.log('========================================\n');

  // Check for private key
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKey) {
    console.log('No DEPLOYER_PRIVATE_KEY found, using default hardhat account...');
  }

  // Connect to network
  console.log('Connecting to:', RPC_URL);
  const provider = new ethers.JsonRpcProvider(RPC_URL);

  let wallet;
  if (privateKey) {
    wallet = new ethers.Wallet(privateKey, provider);
  } else {
    // Try to get accounts from the node
    const accounts = await provider.send('eth_accounts', []);
    if (accounts.length === 0) {
      console.error('No accounts available. Set DEPLOYER_PRIVATE_KEY environment variable.');
      process.exit(1);
    }
    wallet = await provider.getSigner(accounts[0]);
  }

  const address = await wallet.getAddress();
  console.log('Deployer:', address);

  const balance = await provider.getBalance(address);
  console.log('Balance:', ethers.formatEther(balance), 'ALT\n');

  if (balance === 0n) {
    console.error('Deployer has no balance!');
    process.exit(1);
  }

  // Compile contract
  const { abi, bytecode } = await compile();
  console.log('Contract compiled successfully\n');

  // Deploy
  console.log('Deploying WATTxBridgePool...');
  console.log('  WATT Token:', WATT_TOKEN);
  console.log('  Chain ID:', CHAIN_ID);
  console.log('  Is Mainnet:', IS_MAINNET);

  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const contract = await factory.deploy(WATT_TOKEN, CHAIN_ID, IS_MAINNET);

  console.log('\nTransaction hash:', contract.deploymentTransaction().hash);
  console.log('Waiting for confirmation...');

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log('\n✓ WATTxBridgePool deployed to:', contractAddress);

  // Save deployment
  const deployment = {
    network: 'altcoinchain',
    chainId: CHAIN_ID,
    deployer: address,
    timestamp: new Date().toISOString(),
    contract: {
      name: 'WATTxBridgePool',
      address: contractAddress,
      wattToken: WATT_TOKEN,
      isMainnet: IS_MAINNET
    },
    abi: abi
  };

  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(deploymentsDir, 'bridge-pool-altcoinchain.json'),
    JSON.stringify(deployment, null, 2)
  );

  console.log('\n✓ Deployment saved to deployments/bridge-pool-altcoinchain.json');

  console.log('\n========================================');
  console.log('Deployment Complete!');
  console.log('========================================');
  console.log('Bridge Pool:', contractAddress);
  console.log('\nNext steps:');
  console.log('1. Update bridge pool address in src/services/wattxBridgeService.ts');
  console.log('2. Update bridge pool address in src/components/DeFiHubView.tsx');
  console.log('3. Add liquidity with addLiquidity()');
  console.log('4. Start the relayer: node scripts/bridgeRelayer.js');

  return contractAddress;
}

deploy()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Deployment failed:', err);
    process.exit(1);
  });
