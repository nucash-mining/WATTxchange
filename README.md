# WATTxchange - Multi-Chain DeFi Hub & nuChain L2

![WATTxchange Logo](./public/WATTxchange%20logo.png)

A comprehensive multi-chain DeFi platform featuring blockchain node management, decentralized exchange, NFT mining, atomic swaps, and the revolutionary nuChain L2 zkRollup sidechain.

## 🌟 Features

- **Multi-Chain Wallet** - Support for 8+ blockchains with real-time price feeds
- **Blockchain Node Management** - Full and light nodes for Bitcoin, Ethereum, Litecoin, Monero, Altcoinchain, GHOST, and Trollcoin
- **Decentralized Exchange** - Powered by Swapin.co across 10 networks
- **NFT Mining Game** - Virtual mining with real hardware component NFTs
- **Atomic Swaps** - Trustless P2P cryptocurrency trading
- **nuChain L2** - Custom zkRollup sidechain with Sonic Labs technology
- **Tech Marketplace** - Rent mining hardware and applications

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- MetaMask or compatible Web3 wallet
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/nucash-mining/wattxchange.git
cd wattxchange

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

## 🔗 Supported Networks

### Primary Networks
- **Altcoinchain** (Chain ID: 2330) - Primary network with ALT and WATT tokens
- **nuChain L2** (Chain ID: 2331) - Custom zkRollup sidechain
- **Polygon** - NFT mining components storage

### Swapin.co DEX Networks
- EGAZ (1234)
- PlanQ (7070) 
- OctaSpace (800001)
- PartyChain (1773)
- EGEM (1987)
- ETHO (1313114)
- DOGEchain (2000)
- Fantom (250)

## 🏗️ Blockchain Node Setup

### System Requirements

**Minimum Requirements:**
- 4 CPU cores
- 8 GB RAM
- 500 GB SSD storage
- 50 Mbps internet

**Recommended for Full Nodes:**
- 8+ CPU cores
- 32 GB RAM
- 2 TB NVMe SSD
- 100+ Mbps internet

### Node Installation Guides

#### Bitcoin Core

```bash
# Download Bitcoin Core
wget https://bitcoin.org/bin/bitcoin-core-25.0/bitcoin-25.0-x86_64-linux-gnu.tar.gz
tar -xzf bitcoin-25.0-x86_64-linux-gnu.tar.gz
sudo install -m 0755 -o root -g root -t /usr/local/bin bitcoin-25.0/bin/*

# Create data directory
mkdir -p ~/.bitcoin

# Configure bitcoin.conf
cat > ~/.bitcoin/bitcoin.conf << EOF
server=1
daemon=1
rpcuser=bitcoinrpc
rpcpassword=$(openssl rand -hex 32)
rpcallowip=127.0.0.1
datadir=$HOME/.bitcoin
EOF

# Start Bitcoin node
bitcoind -daemon
```

#### Ethereum (Geth)

```bash
# Install Geth
sudo add-apt-repository -y ppa:ethereum/ethereum
sudo apt-get update
sudo apt-get install ethereum

# Create data directory
mkdir -p ~/.ethereum

# Start Ethereum node
geth --http --http.addr 0.0.0.0 --http.port 8545 --datadir ~/.ethereum
```

#### Litecoin Core

```bash
# Download Litecoin Core
wget https://download.litecoin.org/litecoin-0.21.2.2/linux/litecoin-0.21.2.2-x86_64-linux-gnu.tar.gz
tar -xzf litecoin-0.21.2.2-x86_64-linux-gnu.tar.gz
sudo install -m 0755 -o root -g root -t /usr/local/bin litecoin-0.21.2.2/bin/*

# Configure litecoin.conf
mkdir -p ~/.litecoin
cat > ~/.litecoin/litecoin.conf << EOF
server=1
daemon=1
rpcuser=litecoinrpc
rpcpassword=$(openssl rand -hex 32)
rpcallowip=127.0.0.1
EOF

# Start Litecoin node
litecoind -daemon
```

#### Monero Daemon

```bash
# Download Monero
wget https://downloads.getmonero.org/cli/monero-linux-x64-v0.18.3.1.tar.bz2
tar -xjf monero-linux-x64-v0.18.3.1.tar.bz2
sudo cp monero-x86_64-linux-gnu-v0.18.3.1/* /usr/local/bin/

# Start Monero daemon
monerod --data-dir ~/.monero --rpc-bind-ip 0.0.0.0 --rpc-bind-port 18081 --detach
```

#### Altcoinchain Node

```bash
# Clone Altcoinchain repository
git clone https://github.com/altcoinchain/altcoinchain.git
cd altcoinchain

# Build from source
./autogen.sh
./configure --disable-tests --disable-bench --without-gui
make -j$(nproc)
sudo make install

# Configure altcoin.conf
mkdir -p ~/.altcoin
cat > ~/.altcoin/altcoin.conf << EOF
server=1
daemon=1
rpcuser=altcoinrpc
rpcpassword=$(openssl rand -hex 32)
rpcallowip=127.0.0.1
addnode=2600:1700:5250:1c60:8bc1:e4ce:5e8b:8a1b
addnode=23.245.133.56
EOF

# Start Altcoinchain node
altcoind -daemon
```

#### GHOST Core (Proof-of-Stake)

```bash
# Clone GHOST Core repository
git clone https://github.com/ghost-coin/ghost-core.git
cd ghost-core
git checkout master

# Build dependencies and compile
./autogen.sh
./configure --disable-tests --disable-bench --without-gui
make -j$(nproc)
sudo make install

# Configure GHOST
mkdir -p ~/.ghost
cat > ~/.ghost/ghost.conf << EOF
rpcuser=ghostrpc
rpcpassword=$(openssl rand -hex 32)
rpcallowip=127.0.0.1
server=1
daemon=1
staking=1
EOF

# Start GHOST node with staking
ghostd -daemon -staking=1
```

**GHOST Staking Setup:**
```bash
# Create or load wallet
ghost-cli createwallet "staking_wallet"

# Unlock wallet for staking
ghost-cli walletpassphrase "your_passphrase" 0 true

# Check staking status
ghost-cli getstakinginfo
```

#### Trollcoin Core (Proof-of-Work)

```bash
# Clone Trollcoin repository
git clone https://github.com/TrollCoin2/TrollCoin-2.0.git
cd TrollCoin-2.0

# Install dependencies
sudo apt-get install build-essential libboost-all-dev libssl-dev libcurl4-openssl-dev libminiupnpc-dev libdb++-dev libstdc++6 make

# Build Trollcoin daemon
cd src/
make -f makefile.unix USE_UPNP=1
strip trollcoind
sudo cp trollcoind /usr/local/bin/

# Configure trollcoin.conf
mkdir -p ~/.trollcoin
cat > ~/.trollcoin/trollcoin.conf << EOF
rpcuser=trollrpc
rpcpassword=$(openssl rand -hex 32)
rpcallowip=127.0.0.1
server=1
daemon=1
EOF

# Start Trollcoin node
trollcoind -daemon
```

**Trollcoin Mining Setup:**
```bash
# Check mining info
trollcoind getmininginfo

# Generate new address
trollcoind getnewaddress

# Start mining (CPU)
trollcoind setgenerate true 1
```

### Node Management Commands

#### Start All Nodes
```bash
# Bitcoin
bitcoind -daemon

# Ethereum
geth --http --http.addr 0.0.0.0 --http.port 8545 --datadir ~/.ethereum &

# Litecoin
litecoind -daemon

# Monero
monerod --data-dir ~/.monero --rpc-bind-ip 0.0.0.0 --rpc-bind-port 18081 --detach

# Altcoinchain
altcoind -daemon

# GHOST (with staking)
ghostd -daemon -staking=1

# Trollcoin
trollcoind -daemon
```

#### Check Node Status
```bash
# Bitcoin
bitcoin-cli getblockchaininfo

# Ethereum
geth attach --exec "eth.syncing"

# Litecoin
litecoin-cli getblockchaininfo

# Monero
monerod status

# Altcoinchain
altcoin-cli getblockchaininfo

# GHOST
ghost-cli getblockchaininfo
ghost-cli getstakinginfo

# Trollcoin
trollcoind getblockchaininfo
trollcoind getmininginfo
```

#### Stop All Nodes
```bash
# Bitcoin
bitcoin-cli stop

# Ethereum
geth attach --exec "admin.stopRPC()"

# Litecoin
litecoin-cli stop

# Monero
monerod exit

# Altcoinchain
altcoin-cli stop

# GHOST
ghost-cli stop

# Trollcoin
trollcoind stop
```

## 🔗 nuChain L2 Setup

### Overview

nuChain is a custom Layer 2 zkRollup sidechain that combines:
- **Sonic Labs technology** for 1-second block times
- **Altcoinchain consensus** validation for security
- **NFT mining pools** with real hardware components
- **Proof-of-Stake validators** with 100,000 NU minimum stake

### Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   nuChain L2    │    │   Altcoinchain   │    │    Polygon      │
│                 │    │                  │    │                 │
│ • Validators    │◄──►│ • zkProof        │    │ • NFT Mining    │
│ • Mining Pools  │    │   Validation     │    │   Components    │
│ • NU Token      │    │ • State Roots    │    │ • WATT Token    │
│ • 1s blocks     │    │ • Security       │    │ • Genesis Badge │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Smart Contract Deployment

#### 1. Deploy Core Contracts

```bash
# Navigate to contract deployment in WATTxchange
# Go to nuChain L2 → Contracts tab
# Click "Deploy All" to deploy:
# - NU Token Contract
# - Validator Contract  
# - Mining Pool Factory
# - NFT Mining Rigs Contract
# - zkRollup Bridge Contract
```

#### 2. Contract Addresses (Post-Deployment)

```javascript
// nuChain L2 Contracts (Chain ID: 2331)
const NUCHAIN_CONTRACTS = {
  nuToken: "0x...", // NU Token (native currency)
  validator: "0x...", // Validator staking contract
  miningPoolFactory: "0x...", // Mining pool management
  nftMiningRigs: "0x...", // NFT rig configuration
  zkRollupBridge: "0x...", // Altcoinchain validation bridge
};

// External Dependencies
const EXTERNAL_CONTRACTS = {
  wattToken: "0x6645143e49B3a15d8F205658903a55E520444698", // WATT on Altcoinchain
  polygonNFTs: "0x970a8b10147e3459d3cbf56329b76ac18d329728", // Mining NFTs on Polygon
};
```

### Validator Node Setup

#### Requirements (Sonic Labs Compatible)
- **Hardware**: 8+ CPU cores, 32+ GB RAM, 1+ TB NVMe SSD
- **Network**: 100+ Mbps internet connection
- **Stake**: 100,000 NU tokens minimum
- **Uptime**: 99.5% requirement

#### Installation

```bash
# Clone nuChain node software
git clone https://github.com/your-org/nuchain-node.git
cd nuchain-node

# Install dependencies
npm install

# Configure validator
cp config.example.json config.json
# Edit config.json with your validator settings

# Generate validator keys
npm run generate-keys

# Start validator node
npm run start:validator
```

#### Validator Configuration

```json
{
  "validator": {
    "address": "0x...",
    "privateKey": "0x...",
    "stake": "100000000000000000000000",
    "commission": 500
  },
  "network": {
    "chainId": 2331,
    "rpcUrl": "https://rpc.nuchain.network",
    "altcoinchainRpc": "https://99.248.100.186:8645/"
  },
  "mining": {
    "enabled": true,
    "gasPrice": "1000000000",
    "gasLimit": "8000000"
  }
}
```

### Mining Pool Host Setup

#### Requirements
- **WATT Tokens**: 100,000 WATT locked in contract
- **nuChain Node**: Running validator or full node
- **Monitoring**: 95%+ uptime requirement
- **Hardware**: Same as validator requirements

#### Setup Process

```bash
# 1. Lock WATT tokens in mining pool contract
# Use WATTxchange interface: nuChain L2 → Mining Pools → Create Pool

# 2. Configure mining pool node
cat > mining-pool-config.json << EOF
{
  "pool": {
    "name": "Your Mining Pool",
    "host": "0x...",
    "wattLocked": "100000000000000000000000",
    "feePercentage": 200,
    "minPayout": "100000000000000000"
  },
  "node": {
    "heartbeatInterval": 300000,
    "monitoringEnabled": true
  }
}
EOF

# 3. Start mining pool service
npm run start:mining-pool
```

### NFT Mining Rig Configuration

#### Supported Components (Polygon Network)

| Component | Token ID | Type | Hash Rate Bonus | Power | Rarity |
|-----------|----------|------|-----------------|-------|---------|
| PC Case NFT | 1 | Base | 0% | 0W | Common |
| XL1 Processor | 3 | CPU | +25% | 125W | Rare |
| TX120 GPU | 4 | GPU | +150% | 320W | Epic |
| GP50 GPU | 5 | GPU | +200% | 450W | Legendary |
| Genesis Badge | 2 | Boost | +50% Overclock | +25% Power | Mythic |

#### Rig Configuration Example

```javascript
// Example: High-Performance Mining Rig
const rigComponents = [
  1, // PC Case NFT (required)
  3, // XL1 Processor (required)
  4, // TX120 GPU (optional)
  2  // Genesis Badge (overclock boost)
];

// Calculated Performance:
// Base: 100 MH/s
// + XL1 Processor: +25% = 125 MH/s
// + TX120 GPU: +150% = 312.5 MH/s
// + Genesis Badge: +50% = 468.75 MH/s
// Total Power: 612W (with Genesis Badge +25%)
// Efficiency: 0.77 MH/W
```

### Network Configuration

#### Add nuChain to MetaMask

```javascript
// Network Details
{
  "chainId": "0x91B", // 2331 in hex
  "chainName": "nuChain L2",
  "nativeCurrency": {
    "name": "NU Token",
    "symbol": "NU",
    "decimals": 18
  },
  "rpcUrls": ["https://rpc.nuchain.network"],
  "blockExplorerUrls": ["https://explorer.nuchain.network"]
}
```

#### RPC Endpoints

```bash
# nuChain L2 RPC
https://rpc.nuchain.network

# WebSocket
wss://ws.nuchain.network

# Explorer API
https://api.explorer.nuchain.network
```

## 🎮 NFT Mining Game

### Component Contracts (Polygon)

```solidity
// Mining Hardware NFTs
Contract: 0x970a8b10147e3459d3cbf56329b76ac18d329728

Token IDs:
- 1: Free Mint PC Case (Base requirement)
- 2: Genesis Badge (Overclock boost)
- 3: XL1 Processor (CPU component)
- 4: TX120 GPU (High-end GPU)
- 5: GP50 GPU (Premium GPU)
```

### WATT Token Contracts

```solidity
// Polygon Network
WATT: 0xE960d5076cd3169C343Ee287A2c3380A222e5839

// Altcoinchain Network  
WATT: 0x6645143e49B3a15d8F205658903a55E520444698

// Mining Game Staking (Polygon)
Staking: 0xcbfcA68D10B2ec60a0FB2Bc58F7F0Bfd32CD5275

// Mining Game Staking (Altcoinchain)
Staking: 0xe463045318393095F11ed39f1a98332aBCc1A7b1
```

### Mining Rewards Formula

```javascript
// Base mining calculation
function calculateMiningRewards(rig) {
  let baseHashRate = 100; // MH/s
  let totalPower = 50; // Base power consumption
  
  // Apply component bonuses
  rig.components.forEach(component => {
    if (component.type !== 'BOOST_ITEM') {
      baseHashRate += (baseHashRate * component.hashRateBonus) / 100;
      totalPower += component.powerConsumption;
    }
  });
  
  // Apply Genesis Badge overclock
  if (rig.hasGenesisBadge) {
    baseHashRate += (baseHashRate * 50) / 100; // +50% overclock
    totalPower += (totalPower * 25) / 100; // +25% power
  }
  
  // Calculate daily WATT rewards
  const efficiency = baseHashRate / totalPower;
  const dailyRewards = efficiency * 2.5; // Base multiplier
  
  return {
    hashRate: baseHashRate,
    powerConsumption: totalPower,
    efficiency: efficiency,
    dailyWattRewards: dailyRewards
  };
}
```

## 🔄 Atomic Swaps

### Supported Trading Pairs

- ALT/BTC (Fixed rate: 100,000 ALT = 0.00016 BTC)
- ALT/USDT
- XMR/BTC  
- WATT/ALT
- GHOST/BTC (PoS considerations)
- TROLL/BTC (PoW mining-based)
- ETH/ALT
- LTC/ETH

### GHOST PoS Considerations

GHOST uses Proof-of-Stake consensus, which affects atomic swap timing:
- **Block validation**: Longer confirmation times
- **Staking requirements**: Ensure sufficient network confirmations
- **Timelock adjustments**: Extended timeouts for PoS finality

### Trollcoin PoW Considerations

Trollcoin uses Proof-of-Work consensus with Scrypt algorithm:
- **Mining-based validation**: Strong security through computational work
- **Block confirmation**: Standard PoW confirmation times
- **Network hashrate**: Dependent on active miners
- **Atomic swap security**: Robust due to mining difficulty

## 🛠️ Development

### Project Structure

```
wattxchange/
├── src/
│   ├── components/          # React components
│   │   ├── nuchain/        # nuChain L2 components
│   │   ├── dex/            # DEX components
│   │   ├── mining/         # Mining game components
│   │   ├── swap/           # Atomic swap components
│   │   └── wallet/         # Wallet components
│   ├── contracts/          # Smart contracts
│   │   └── nuChain/        # nuChain L2 contracts
│   ├── hooks/              # React hooks
│   ├── services/           # API services
│   └── types/              # TypeScript types
├── public/                 # Static assets
└── docs/                   # Documentation
```

### Build Commands

```bash
# Development
npm run dev

# Production build
npm run build

# Linting
npm run lint

# Type checking
npm run type-check

# Contract compilation
npm run compile-contracts
```

### Environment Variables

```bash
# .env.local
VITE_ALTCOINCHAIN_RPC=https://99.248.100.186:8645/
VITE_NUCHAIN_RPC=https://rpc.nuchain.network
VITE_POLYGON_RPC=https://polygon-rpc.com
VITE_XEGGEX_API_KEY=your_api_key
VITE_XEGGEX_API_SECRET=your_api_secret
```

## 🔐 Security

### Smart Contract Security

- **ReentrancyGuard**: All state-changing functions protected
- **Access Control**: Owner-only administrative functions  
- **Input Validation**: Comprehensive parameter checking
- **Event Logging**: Complete audit trail
- **Timelock Contracts**: Critical parameter changes delayed

### Node Security

```bash
# Firewall configuration
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 8545/tcp    # Ethereum RPC
sudo ufw allow 8332/tcp    # Bitcoin RPC
sudo ufw allow 9332/tcp    # Litecoin RPC
sudo ufw allow 18081/tcp   # Monero RPC
sudo ufw allow 8645/tcp    # Altcoinchain RPC
sudo ufw allow 51725/tcp   # GHOST RPC
sudo ufw allow 9666/tcp    # Trollcoin RPC
sudo ufw enable

# SSL/TLS for RPC endpoints
# Use nginx reverse proxy with Let's Encrypt certificates
```

### Wallet Security

- **Hardware Wallet Support**: Ledger and Trezor integration
- **Multi-signature**: Support for multisig wallets
- **Seed Phrase Backup**: BIP39 mnemonic generation
- **Encryption**: Local storage encryption

## 📊 Monitoring

### Node Monitoring

```bash
# System monitoring
htop                    # CPU and memory usage
df -h                   # Disk usage
netstat -tulpn         # Network connections
journalctl -f          # System logs

# Blockchain monitoring
watch -n 5 'bitcoin-cli getblockchaininfo'
watch -n 5 'geth attach --exec "eth.syncing"'
watch -n 5 'ghost-cli getstakinginfo'
watch -n 5 'trollcoind getmininginfo'
```

### Performance Metrics

- **Block sync status**: Current vs network height
- **Peer connections**: Number of connected peers
- **Memory usage**: RAM consumption per node
- **Disk I/O**: Read/write operations
- **Network bandwidth**: Upload/download speeds
- **Mining hashrate**: For PoW chains (Trollcoin)
- **Staking status**: For PoS chains (GHOST)

## 🚨 Troubleshooting

### Common Issues

#### Node Sync Problems
```bash
# Bitcoin not syncing
bitcoin-cli getpeerinfo
bitcoin-cli addnode "node_ip:8333" "add"

# Ethereum sync stuck
geth removedb
geth --syncmode "fast"

# GHOST staking not working
ghost-cli walletpassphrase "passphrase" 0 true
ghost-cli getstakinginfo

# Trollcoin mining issues
trollcoind getmininginfo
trollcoind setgenerate true 1
```

#### Connection Issues
```bash
# Check RPC connectivity
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"getblockchaininfo","params":[],"id":1}' \
  http://localhost:8332/

# Test Trollcoin RPC
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"getinfo","params":[],"id":1}' \
  http://localhost:9666/

# Test network connectivity
telnet node_ip port_number
```

#### Performance Issues
```bash
# Increase database cache
bitcoind -dbcache=4000

# Optimize Ethereum
geth --cache=4096 --maxpeers=50

# Trollcoin optimization
trollcoind -dbcache=1000

# Monitor system resources
iostat -x 1
sar -u 1
```

### Log Locations

```bash
# Bitcoin
~/.bitcoin/debug.log

# Ethereum
~/.ethereum/geth.log

# Litecoin
~/.litecoin/debug.log

# Monero
~/.monero/monero.log

# Altcoinchain
~/.altcoin/debug.log

# GHOST
~/.ghost/debug.log

# Trollcoin
~/.trollcoin/debug.log
```

## 🤝 Contributing

### Development Setup

```bash
# Fork and clone repository
git clone https://github.com/your-username/wattxchange.git
cd wattxchange

# Create feature branch
git checkout -b feature/your-feature-name

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Submit pull request
git push origin feature/your-feature-name
```

### Code Standards

- **TypeScript**: Strict type checking enabled
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **Husky**: Pre-commit hooks
- **Conventional Commits**: Commit message format

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Website**: https://wattxchange.com
- **Documentation**: https://docs.wattxchange.com
- **GitHub**: https://github.com/your-org/wattxchange
- **Discord**: https://discord.gg/wattxchange
- **Twitter**: https://twitter.com/wattxchange

## 🆘 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Create GitHub issues for bugs and feature requests
- **Discord**: Join our community for real-time support
- **Email**: support@wattxchange.com

---

**Built with ❤️ by the WATTxchange Team**

*Revolutionizing DeFi with multi-chain infrastructure and NFT-powered mining*
