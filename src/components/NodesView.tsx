import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Server, Play, Square, Settings, Terminal, Wifi, WifiOff, Download, HardDrive, Cpu, Activity, FolderOpen } from 'lucide-react';
import toast from 'react-hot-toast';

interface NodeConfig {
  id: string;
  name: string;
  symbol: string;
  chainId?: number;
  rpcPort: number;
  p2pPort: number;
  dataDir: string;
  executable: string;
  startCommand: string;
  status: 'stopped' | 'starting' | 'running' | 'syncing' | 'synced' | 'error';
  syncProgress: number;
  peers: number;
  blockHeight: number;
  diskUsage: string;
  logo: string | (() => JSX.Element);
  enodes?: string[];
  walletFile?: string;
  consensusType: 'PoW' | 'PoS';
  installInstructions?: string[];
}

const NodesView: React.FC = () => {
  const [nodes, setNodes] = useState<NodeConfig[]>([
    {
      id: 'altcoinchain',
      name: 'Altcoinchain',
      symbol: 'ALT',
      chainId: 2330,
      rpcPort: 8645,
      p2pPort: 30303,
      dataDir: './data/altcoinchain',
      executable: 'geth',
      startCommand: 'geth --mine --http --networkid 2330 --datadir ./data/altcoinchain --http.addr 0.0.0.0 --http.port 8645 --http.api eth,net,web3,personal,miner',
      status: 'stopped',
      syncProgress: 0,
      peers: 0,
      blockHeight: 0,
      diskUsage: '0 GB',
      logo: () => <img src="/Altcoinchain logo.png" alt="ALT" className="w-8 h-8 object-contain rounded-full" />,
      enodes: [
        'enode://86bc0c13add4487c1e6ff2b3d25e88c6d52f096f838abcc8ca7ed1d105d9fbcd447a9915898ad41776a72702bdad5572d84cbb4fd0b724ebe22c2266b193b7d9@2600:1700:5250:1c60:8bc1:e4ce:5e8b:8a1b:31303',
        'enode://3ef1a6a9af348f5be08462705f04435795c8b4cdec4294e416f6ab724ecc134ba7692976eeb2463e8ed3cd29b7cdb20ecc78882189d1c55d1f465cecfb1f2abc@23.245.133.56:30303'
      ],
      consensusType: 'PoW'
    },
    {
      id: 'bitcoin',
      name: 'Bitcoin Core',
      symbol: 'BTC',
      rpcPort: 8332,
      p2pPort: 8333,
      dataDir: './data/bitcoin',
      executable: 'bitcoind',
      startCommand: 'bitcoind -daemon -datadir=./data/bitcoin -rpcport=8332 -port=8333',
      status: 'stopped',
      syncProgress: 0,
      peers: 0,
      blockHeight: 0,
      diskUsage: '0 GB',
      logo: () => <img src="/BTC logo.png" alt="BTC" className="w-8 h-8 object-contain" />,
      consensusType: 'PoW'
    },
    {
      id: 'ethereum',
      name: 'Ethereum (Geth)',
      symbol: 'ETH',
      chainId: 1,
      rpcPort: 8545,
      p2pPort: 30303,
      dataDir: './data/ethereum',
      executable: 'geth',
      startCommand: 'geth --http --http.addr 0.0.0.0 --http.port 8545 --datadir ./data/ethereum',
      status: 'stopped',
      syncProgress: 0,
      peers: 0,
      blockHeight: 0,
      diskUsage: '0 GB',
      logo: () => <img src="/ETH logo.png" alt="ETH" className="w-8 h-8 object-contain" />,
      consensusType: 'PoW'
    },
    {
      id: 'litecoin',
      name: 'Litecoin Core',
      symbol: 'LTC',
      rpcPort: 9332,
      p2pPort: 9333,
      dataDir: './data/litecoin',
      executable: 'litecoind',
      startCommand: 'litecoind -daemon -datadir=./data/litecoin -rpcport=9332 -port=9333',
      status: 'stopped',
      syncProgress: 0,
      peers: 0,
      blockHeight: 0,
      diskUsage: '0 GB',
      logo: () => <img src="/LTC logo.png" alt="LTC" className="w-8 h-8 object-contain" />,
      consensusType: 'PoW'
    },
    {
      id: 'monero',
      name: 'Monero Daemon',
      symbol: 'XMR',
      rpcPort: 18081,
      p2pPort: 18080,
      dataDir: './data/monero',
      executable: 'monerod',
      startCommand: 'monerod --data-dir ./data/monero --rpc-bind-ip 0.0.0.0 --rpc-bind-port 18081 --p2p-bind-port 18080 --detach',
      status: 'stopped',
      syncProgress: 0,
      peers: 0,
      blockHeight: 0,
      diskUsage: '0 GB',
      logo: () => <img src="/XMR logo.png" alt="XMR" className="w-8 h-8 object-contain" />,
      consensusType: 'PoW'
    },
    {
      id: 'trollcoin',
      name: 'Trollcoin Core',
      symbol: 'TROLL',
      rpcPort: 9666,
      p2pPort: 9667,
      dataDir: './data/trollcoin',
      executable: 'trollcoind',
      startCommand: 'trollcoind -daemon -datadir=./data/trollcoin -rpcport=9666 -port=9667',
      status: 'stopped',
      syncProgress: 0,
      peers: 0,
      blockHeight: 0,
      diskUsage: '0 GB',
      logo: () => <img src="/TROLL logo.png" alt="TROLL" className="w-8 h-8 object-contain" />,
      consensusType: 'PoW',
      installInstructions: [
        'git clone https://github.com/TrollCoin2/TrollCoin-2.0.git',
        'cd TrollCoin-2.0',
        'sudo apt-get install build-essential libboost-all-dev libssl-dev libcurl4-openssl-dev libminiupnpc-dev libdb++-dev libstdc++6 make',
        'cd src/',
        'make -f makefile.unix USE_UPNP=1',
        'strip trollcoind',
        'sudo cp trollcoind /usr/local/bin/',
        'mkdir -p ~/.trollcoin',
        'echo "rpcuser=trollrpc" >> ~/.trollcoin/trollcoin.conf',
        'echo "rpcpassword=$(openssl rand -hex 32)" >> ~/.trollcoin/trollcoin.conf',
        'echo "rpcallowip=127.0.0.1" >> ~/.trollcoin/trollcoin.conf',
        'echo "server=1" >> ~/.trollcoin/trollcoin.conf',
        'echo "daemon=1" >> ~/.trollcoin/trollcoin.conf'
      ]
    },
    {
      id: 'ghost',
      name: 'GHOST Core',
      symbol: 'GHOST',
      rpcPort: 51725,
      p2pPort: 51728,
      dataDir: './data/ghost',
      executable: 'ghostd',
      startCommand: 'ghostd -daemon -datadir=./data/ghost -rpcport=51725 -port=51728 -staking=1',
      status: 'stopped',
      syncProgress: 0,
      peers: 0,
      blockHeight: 0,
      diskUsage: '0 GB',
      logo: () => <img src="/GHOST logo.png" alt="GHOST" className="w-8 h-8 object-contain" />,
      consensusType: 'PoS',
      installInstructions: [
        'git clone https://github.com/ghost-coin/ghost-core.git',
        'cd ghost-core',
        'git checkout master',
        './autogen.sh',
        './configure --disable-tests --disable-bench --without-gui',
        'make -j$(nproc)',
        'sudo make install',
        'mkdir -p ~/.ghost',
        'echo "rpcuser=ghostrpc" >> ~/.ghost/ghost.conf',
        'echo "rpcpassword=$(openssl rand -hex 32)" >> ~/.ghost/ghost.conf',
        'echo "rpcallowip=127.0.0.1" >> ~/.ghost/ghost.conf',
        'echo "server=1" >> ~/.ghost/ghost.conf',
        'echo "daemon=1" >> ~/.ghost/ghost.conf',
        'echo "staking=1" >> ~/.ghost/ghost.conf'
      ]
    }
  ]);

  const [selectedNode, setSelectedNode] = useState<string>('trollcoin');
  const [showConsole, setShowConsole] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [showInstallInstructions, setShowInstallInstructions] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
      case 'synced':
        return 'text-emerald-400 bg-emerald-500/20';
      case 'syncing':
      case 'starting':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'error':
        return 'text-red-400 bg-red-500/20';
      default:
        return 'text-slate-400 bg-slate-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
      case 'synced':
        return <Wifi className="w-4 h-4" />;
      case 'syncing':
      case 'starting':
        return <Activity className="w-4 h-4 animate-pulse" />;
      case 'error':
        return <WifiOff className="w-4 h-4" />;
      default:
        return <Square className="w-4 h-4" />;
    }
  };

  const startNode = async (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    setNodes(prev => prev.map(n => 
      n.id === nodeId ? { ...n, status: 'starting' } : n
    ));

    addConsoleOutput(`Starting ${node.name}...`);
    addConsoleOutput(`Command: ${node.startCommand}`);

    if (node.id === 'ghost') {
      addConsoleOutput('GHOST is a Proof-of-Stake (PoS) cryptocurrency');
      addConsoleOutput('Enabling staking mode for block validation...');
    }

    if (node.id === 'trollcoin') {
      addConsoleOutput('Trollcoin is a Proof-of-Work (PoW) cryptocurrency');
      addConsoleOutput('Starting Trollcoin daemon with RPC enabled...');
      addConsoleOutput('Connecting to Trollcoin network peers...');
    }

    try {
      // Simulate node startup
      setTimeout(() => {
        setNodes(prev => prev.map(n => 
          n.id === nodeId ? { ...n, status: 'syncing', peers: 1 } : n
        ));
        addConsoleOutput(`${node.name} started successfully`);
        
        if (nodeId === 'altcoinchain' && node.enodes) {
          addConsoleOutput('Adding Altcoinchain enodes...');
          node.enodes.forEach((enode, index) => {
            setTimeout(() => {
              addConsoleOutput(`admin.addPeer("${enode}")`);
            }, (index + 1) * 1000);
          });
        }

        if (nodeId === 'ghost') {
          addConsoleOutput('Loading GHOST wallet...');
          addConsoleOutput('Staking enabled - ready to validate blocks');
          addConsoleOutput('Connecting to GHOST network peers...');
        }

        if (nodeId === 'trollcoin') {
          addConsoleOutput('Trollcoin daemon started successfully');
          addConsoleOutput('RPC server listening on port 9666');
          addConsoleOutput('P2P network listening on port 9667');
          addConsoleOutput('Synchronizing with Trollcoin blockchain...');
        }
      }, 2000);

      // Simulate sync progress
      let progress = 0;
      const syncInterval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress >= 100) {
          progress = 100;
          clearInterval(syncInterval);
          setNodes(prev => prev.map(n => 
            n.id === nodeId ? { 
              ...n, 
              status: 'synced', 
              syncProgress: 100,
              peers: Math.floor(Math.random() * 20) + 5,
              blockHeight: Math.floor(Math.random() * 1000000) + 500000
            } : n
          ));
          addConsoleOutput(`${node.name} fully synced!`);
          
          if (nodeId === 'ghost') {
            addConsoleOutput('GHOST node is now staking and validating blocks');
          }
          
          if (nodeId === 'trollcoin') {
            addConsoleOutput('Trollcoin node fully synchronized');
            addConsoleOutput('Ready for mining and transactions');
          }
        } else {
          setNodes(prev => prev.map(n => 
            n.id === nodeId ? { 
              ...n, 
              syncProgress: Math.floor(progress),
              peers: Math.floor(Math.random() * 10) + 1,
              blockHeight: Math.floor((progress / 100) * 1000000)
            } : n
          ));
        }
      }, 1000);

      toast.success(`${node.name} started successfully`);
    } catch (error) {
      setNodes(prev => prev.map(n => 
        n.id === nodeId ? { ...n, status: 'error' } : n
      ));
      addConsoleOutput(`Error starting ${node.name}: ${error}`);
      toast.error(`Failed to start ${node.name}`);
    }
  };

  const stopNode = async (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    setNodes(prev => prev.map(n => 
      n.id === nodeId ? { 
        ...n, 
        status: 'stopped', 
        syncProgress: 0, 
        peers: 0,
        blockHeight: 0 
      } : n
    ));

    addConsoleOutput(`${node.name} stopped`);
    if (nodeId === 'ghost') {
      addConsoleOutput('GHOST staking stopped');
    }
    if (nodeId === 'trollcoin') {
      addConsoleOutput('Trollcoin daemon stopped');
    }
    toast.success(`${node.name} stopped`);
  };

  const loadWallet = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    // Simulate wallet loading
    addConsoleOutput(`Loading wallet for ${node.name}...`);
    
    if (nodeId === 'ghost') {
      addConsoleOutput('ghost-cli loadwallet "default"');
      addConsoleOutput('Wallet loaded successfully');
      addConsoleOutput('Staking status: Active');
    } else if (nodeId === 'trollcoin') {
      addConsoleOutput('trollcoind loadwallet "default"');
      addConsoleOutput('Wallet loaded successfully');
      addConsoleOutput('Ready for Trollcoin transactions');
    } else {
      addConsoleOutput(`${node.executable} loadwallet "default"`);
      addConsoleOutput('Wallet loaded successfully');
    }

    toast.success(`Wallet loaded for ${node.name}`);
  };

  const addConsoleOutput = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setConsoleOutput(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const selectedNodeData = nodes.find(n => n.id === selectedNode);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h2 className="text-3xl font-bold">Blockchain Nodes</h2>
          <p className="text-slate-400 mt-1">Manage your full node infrastructure</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <motion.button
            onClick={() => setShowConsole(!showConsole)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              showConsole ? 'bg-yellow-600 text-white' : 'bg-slate-700 hover:bg-slate-600'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Terminal className="w-4 h-4" />
            <span>Console</span>
          </motion.button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Node List */}
        <motion.div
          className="lg:col-span-1 space-y-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h3 className="text-lg font-semibold mb-4">Available Nodes</h3>
          {nodes.map((node, index) => {
            const LogoComponent = typeof node.logo === 'function' ? node.logo : () => <span>{node.logo}</span>;
            return (
              <motion.button
                key={node.id}
                onClick={() => setSelectedNode(node.id)}
                className={`w-full p-4 rounded-xl border transition-all duration-200 ${
                  selectedNode === node.id
                    ? 'border-yellow-500/50 bg-yellow-500/10'
                    : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600/50'
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -2 }}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <LogoComponent />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium">{node.name}</p>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm text-slate-400">{node.symbol}</p>
                      <span className={`text-xs px-2 py-1 rounded ${
                        node.consensusType === 'PoS' ? 'bg-purple-500/20 text-purple-400' : 'bg-orange-500/20 text-orange-400'
                      }`}>
                        {node.consensusType}
                      </span>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs ${getStatusColor(node.status)}`}>
                    {getStatusIcon(node.status)}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Node Details */}
        <motion.div
          className="lg:col-span-3"
          key={selectedNode}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {selectedNodeData && (
            <div className="space-y-6">
              {/* Node Header */}
              <div className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {typeof selectedNodeData.logo === 'function' ? (
                        <selectedNodeData.logo />
                      ) : (
                        <div className="w-12 h-12 flex items-center justify-center text-2xl font-bold bg-slate-700 rounded-lg">
                          {selectedNodeData.logo}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">{selectedNodeData.name}</h3>
                      <div className="flex items-center space-x-3">
                        <p className="text-slate-400">{selectedNodeData.symbol} Full Node</p>
                        <span className={`text-sm px-3 py-1 rounded-full ${
                          selectedNodeData.consensusType === 'PoS' 
                            ? 'bg-purple-500/20 text-purple-400' 
                            : 'bg-orange-500/20 text-orange-400'
                        }`}>
                          {selectedNodeData.consensusType}
                        </span>
                      </div>
                      {selectedNodeData.chainId && (
                        <p className="text-sm text-yellow-400">Chain ID: {selectedNodeData.chainId}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className={`px-3 py-2 rounded-lg ${getStatusColor(selectedNodeData.status)}`}>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(selectedNodeData.status)}
                        <span className="capitalize">{selectedNodeData.status}</span>
                      </div>
                    </div>
                    
                    {selectedNodeData.status === 'stopped' ? (
                      <motion.button
                        onClick={() => startNode(selectedNodeData.id)}
                        className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Play className="w-4 h-4" />
                        <span>Start</span>
                      </motion.button>
                    ) : (
                      <motion.button
                        onClick={() => stopNode(selectedNodeData.id)}
                        className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Square className="w-4 h-4" />
                        <span>Stop</span>
                      </motion.button>
                    )}

                    <motion.button
                      onClick={() => loadWallet(selectedNodeData.id)}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FolderOpen className="w-4 h-4" />
                      <span>Load Wallet</span>
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Installation Instructions for GHOST and Trollcoin */}
              {(selectedNodeData.id === 'ghost' || selectedNodeData.id === 'trollcoin') && selectedNodeData.installInstructions && (
                <div className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold">
                      {selectedNodeData.id === 'ghost' ? 'GHOST Core Installation' : 'Trollcoin Installation'}
                    </h4>
                    <motion.button
                      onClick={() => setShowInstallInstructions(!showInstallInstructions)}
                      className="text-sm text-blue-400 hover:text-blue-300"
                      whileHover={{ scale: 1.05 }}
                    >
                      {showInstallInstructions ? 'Hide' : 'Show'} Instructions
                    </motion.button>
                  </div>
                  
                  {showInstallInstructions && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-3"
                    >
                      <p className="text-slate-400 text-sm mb-4">
                        {selectedNodeData.id === 'ghost' 
                          ? 'Follow these steps to compile and install GHOST Core from source:'
                          : 'Follow these steps to compile and install Trollcoin from source:'
                        }
                      </p>
                      <div className="bg-black/50 rounded-lg p-4 font-mono text-sm">
                        {selectedNodeData.installInstructions.map((instruction, index) => (
                          <div key={index} className="mb-2">
                            <span className="text-emerald-400">$ </span>
                            <span className="text-slate-300">{instruction}</span>
                          </div>
                        ))}
                      </div>
                      {selectedNodeData.id === 'ghost' && (
                        <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                          <p className="text-purple-400 font-medium mb-2">PoS Staking Information:</p>
                          <ul className="text-sm text-slate-300 space-y-1">
                            <li>• GHOST uses Proof-of-Stake consensus</li>
                            <li>• Staking requires holding GHOST coins in your wallet</li>
                            <li>• Rewards are earned by validating blocks</li>
                            <li>• Keep your wallet unlocked for staking</li>
                          </ul>
                        </div>
                      )}
                      {selectedNodeData.id === 'trollcoin' && (
                        <div className="mt-4 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                          <p className="text-orange-400 font-medium mb-2">Trollcoin Mining Information:</p>
                          <ul className="text-sm text-slate-300 space-y-1">
                            <li>• Trollcoin uses Proof-of-Work consensus</li>
                            <li>• Mining rewards are earned by solving blocks</li>
                            <li>• Compatible with CPU and GPU mining</li>
                            <li>• RPC interface for mining pool integration</li>
                          </ul>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              )}

              {/* Node Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Sync Progress</p>
                      <p className="text-2xl font-bold">{selectedNodeData.syncProgress}%</p>
                    </div>
                    <Download className="w-8 h-8 text-blue-400" />
                  </div>
                  {selectedNodeData.syncProgress > 0 && (
                    <div className="mt-3 bg-slate-900/50 rounded-full h-2">
                      <div 
                        className="bg-blue-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${selectedNodeData.syncProgress}%` }}
                      />
                    </div>
                  )}
                </div>

                <div className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Connected Peers</p>
                      <p className="text-2xl font-bold">{selectedNodeData.peers}</p>
                    </div>
                    <Wifi className="w-8 h-8 text-emerald-400" />
                  </div>
                </div>

                <div className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Block Height</p>
                      <p className="text-2xl font-bold">{selectedNodeData.blockHeight.toLocaleString()}</p>
                    </div>
                    <Cpu className="w-8 h-8 text-purple-400" />
                  </div>
                </div>

                <div className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Disk Usage</p>
                      <p className="text-2xl font-bold">{selectedNodeData.diskUsage}</p>
                    </div>
                    <HardDrive className="w-8 h-8 text-yellow-400" />
                  </div>
                </div>
              </div>

              {/* Node Configuration */}
              <div className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
                <h4 className="text-lg font-semibold mb-4">Configuration</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">RPC Port</label>
                    <input 
                      type="number" 
                      value={selectedNodeData.rpcPort}
                      className="w-full bg-slate-900/50 border border-slate-700/50 rounded px-3 py-2"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">P2P Port</label>
                    <input 
                      type="number" 
                      value={selectedNodeData.p2pPort}
                      className="w-full bg-slate-900/50 border border-slate-700/50 rounded px-3 py-2"
                      readOnly
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-slate-400 mb-1">Data Directory</label>
                    <input 
                      type="text" 
                      value={selectedNodeData.dataDir}
                      className="w-full bg-slate-900/50 border border-slate-700/50 rounded px-3 py-2"
                      readOnly
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-slate-400 mb-1">Start Command</label>
                    <textarea 
                      value={selectedNodeData.startCommand}
                      className="w-full bg-slate-900/50 border border-slate-700/50 rounded px-3 py-2 h-20 text-sm font-mono"
                      readOnly
                    />
                  </div>
                </div>

                {/* Altcoinchain Enodes */}
                {selectedNodeData.id === 'altcoinchain' && selectedNodeData.enodes && (
                  <div className="mt-6">
                    <h5 className="text-md font-semibold mb-3">Altcoinchain Enodes</h5>
                    <div className="space-y-2">
                      {selectedNodeData.enodes.map((enode, index) => (
                        <div key={index} className="bg-slate-900/50 rounded p-3">
                          <p className="text-xs font-mono text-slate-300 break-all">{enode}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* GHOST Specific Configuration */}
                {selectedNodeData.id === 'ghost' && (
                  <div className="mt-6">
                    <h5 className="text-md font-semibold mb-3">GHOST PoS Configuration</h5>
                    <div className="bg-slate-900/50 rounded p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-slate-400">Staking Status:</p>
                          <p className="text-emerald-400 font-medium">Enabled</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Consensus:</p>
                          <p className="text-purple-400 font-medium">Proof-of-Stake</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Wallet Required:</p>
                          <p className="text-yellow-400 font-medium">Yes (for staking)</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Block Time:</p>
                          <p className="text-blue-400 font-medium">~60 seconds</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Trollcoin Specific Configuration */}
                {selectedNodeData.id === 'trollcoin' && (
                  <div className="mt-6">
                    <h5 className="text-md font-semibold mb-3">Trollcoin PoW Configuration</h5>
                    <div className="bg-slate-900/50 rounded p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-slate-400">Mining Status:</p>
                          <p className="text-orange-400 font-medium">Ready</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Consensus:</p>
                          <p className="text-orange-400 font-medium">Proof-of-Work</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Algorithm:</p>
                          <p className="text-yellow-400 font-medium">Scrypt</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Block Time:</p>
                          <p className="text-blue-400 font-medium">~60 seconds</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Console */}
      {showConsole && (
        <motion.div
          className="bg-black/90 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold">Node Console</h4>
            <button
              onClick={() => setConsoleOutput([])}
              className="text-sm text-slate-400 hover:text-white"
            >
              Clear
            </button>
          </div>
          <div className="bg-black rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm">
            {consoleOutput.map((line, index) => (
              <div key={index} className="text-green-400 mb-1">
                {line}
              </div>
            ))}
            {consoleOutput.length === 0 && (
              <div className="text-slate-500">Console output will appear here...</div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default NodesView;