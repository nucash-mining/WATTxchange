import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Check, Copy, AlertTriangle, Wallet, ArrowRight, Terminal, Cpu, HardDrive, Server } from 'lucide-react';
import toast from 'react-hot-toast';
import { useWallet } from '../../hooks/useWallet';

interface MinerSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  app: any;
}

const MinerSetupModal: React.FC<MinerSetupModalProps> = ({ isOpen, onClose, app }) => {
  const [step, setStep] = useState(1);
  const [selectedCoin, setSelectedCoin] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState(0);
  const [minerScript, setMinerScript] = useState('');
  const { isConnected, address } = useWallet();

  useEffect(() => {
    if (isOpen && app) {
      // Reset state when modal opens
      setStep(1);
      setSelectedCoin(app.coins && app.coins.length > 0 ? app.coins[0] : '');
      setIsDownloading(false);
      setIsInstalling(false);
      setInstallProgress(0);
      
      // Auto-fill wallet address if connected
      if (isConnected && address) {
        setWalletAddress(address);
      }
    }
  }, [isOpen, app, isConnected, address]);

  // Listen for global progress reset events
  useEffect(() => {
    const handleResetProgress = () => {
      setInstallProgress(0);
      setIsInstalling(false);
      setIsDownloading(false);
      setStep(1);
    };

    window.addEventListener('resetProgress', handleResetProgress);
    return () => window.removeEventListener('resetProgress', handleResetProgress);
  }, []);

  // Force completion if progress gets stuck
  useEffect(() => {
    if (isInstalling && installProgress > 0 && installProgress < 100) {
      const timeout = setTimeout(() => {
        setInstallProgress(100);
        setIsInstalling(false);
        setStep(3);
        generateMinerScript();
        toast.success('Miner installed successfully');
      }, 10000); // Force complete after 10 seconds
      
      return () => clearTimeout(timeout);
    }
  }, [isInstalling, installProgress]);

  const handleDownload = () => {
    if (!selectedCoin) {
      toast.error('Please select a coin to mine');
      return;
    }
    
    setIsDownloading(true);
    
    // Simulate download
    setTimeout(() => {
      setIsDownloading(false);
      setStep(2);
      toast.success(`${app.name} downloaded successfully`);
    }, 2000);
  };

  const handleInstall = () => {
    setIsInstalling(true);

    // Simulate installation with guaranteed completion
    const progressSteps = [20, 40, 60, 80, 100];
    let currentStep = 0;
    
    const interval = setInterval(() => {
      if (currentStep < progressSteps.length) {
        const progress = progressSteps[currentStep];
        setInstallProgress(progress);
        currentStep++;
        
        if (progress >= 100) {
          clearInterval(interval);
          setIsInstalling(false);
          setStep(3);
          generateMinerScript();
          toast.success('Miner installed successfully');
        }
      }
    }, 1000);
  };

  const generateMinerScript = () => {
    let script = '';
    
    // Generate appropriate script based on selected coin
    switch (selectedCoin) {
      case 'ALT':
        script = `#!/bin/sh
# export GPU_MAX_HEAP_SIZE=100
# export GPU_MAX_USE_SYNC_OBJECTS=1
# export GPU_SINGLE_ALLOC_PERCENT=100
# export GPU_MAX_ALLOC_PERCENT=100
# export GPU_MAX_SINGLE_ALLOC_PERCENT=100
# export GPU_ENABLE_LARGE_ALLOCATION=100
# export GPU_MAX_WORKGROUP_SIZE=1024
reset

./SRBMiner-MULTI --algorithm ethash --pool alt.mineyguys.com:8008 --wallet ${walletAddress} --password x --cpu-threads -1 --log-file ./Logs/log-ALT.txt`;
        break;
      case 'HTH':
        script = `#!/bin/sh
./t-rex -a x25x -o stratum+tcp://stratum.monminepool.org:3178 -u ${walletAddress}.1337 -p c=HTH`;
        break;
      case 'XMR':
        script = `#!/bin/sh
./xmrig -o pool.supportxmr.com:3333 -u ${walletAddress} -p x -k --coin monero`;
        break;
      default:
        script = `#!/bin/sh
# Generic mining script for ${selectedCoin}
# Replace with appropriate pool and algorithm settings
./miner --algorithm auto --pool auto.pool.com:3333 --wallet ${walletAddress} --password x`;
    }
    
    setMinerScript(script);
  };

  const copyScript = () => {
    navigator.clipboard.writeText(minerScript);
    toast.success('Mining script copied to clipboard');
  };

  const getAppIcon = () => {
    if (!app) return <Cpu />;
    
    switch (app.name) {
      case 'SRB Miner':
        return <Cpu className="w-8 h-8 text-yellow-400" />;
      case 'T-Rex Miner':
        return <HardDrive className="w-8 h-8 text-emerald-400" />;
      case 'XMRig':
        return <Server className="w-8 h-8 text-blue-400" />;
      default:
        return <Cpu className="w-8 h-8 text-yellow-400" />;
    }
  };

  if (!isOpen || !app) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <AnimatePresence>
        <motion.div
          className="bg-gray-900/90 backdrop-blur-xl rounded-2xl border border-gray-700/50 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gray-800/50 rounded-lg">
                {getAppIcon()}
              </div>
              <div>
                <h3 className="text-xl font-semibold">{app.name}</h3>
                <p className="text-gray-400 text-sm">{app.description}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Step 1: Coin Selection */}
            {step === 1 && (
              <div className="space-y-6">
                <h4 className="text-lg font-semibold">Select Coin to Mine</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {app.coins && app.coins.map((coin: string) => (
                    <motion.button
                      key={coin}
                      onClick={() => setSelectedCoin(coin)}
                      className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors ${
                        selectedCoin === coin
                          ? 'border-yellow-500/50 bg-yellow-500/10'
                          : 'border-gray-700/50 hover:border-gray-600/50 bg-gray-800/30'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                        <span className="text-lg font-bold">{coin.charAt(0)}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{coin}</p>
                        <p className="text-sm text-gray-400">
                          {coin === 'ALT' ? 'Ethash Algorithm' : 
                           coin === 'HTH' ? 'x25x Algorithm' :
                           coin === 'XMR' ? 'RandomX Algorithm' : 'Auto-detected Algorithm'}
                        </p>
                      </div>
                      {selectedCoin === coin && (
                        <Check className="w-5 h-5 text-yellow-400" />
                      )}
                    </motion.button>
                  ))}
                </div>

                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/30">
                  <h5 className="font-medium mb-3">Hardware Requirements</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Recommended GPU:</span>
                      <span>NVIDIA RTX 2000+ or AMD RX 5000+</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Minimum RAM:</span>
                      <span>8GB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Storage Required:</span>
                      <span>500MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">OS Support:</span>
                      <span>Windows 10/11, Linux, macOS</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <motion.button
                    onClick={handleDownload}
                    disabled={isDownloading || !selectedCoin}
                    className="flex items-center space-x-2 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors disabled:opacity-50"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isDownloading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Downloading...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5" />
                        <span>Download Miner</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            )}

            {/* Step 2: Installation */}
            {step === 2 && (
              <div className="space-y-6">
                <h4 className="text-lg font-semibold">Install Mining Software</h4>
                
                <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/30">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-yellow-600/20 rounded-full flex items-center justify-center">
                        <span className="text-yellow-400 font-medium">1</span>
                      </div>
                      <div>
                        <p className="font-medium">Extract the downloaded archive</p>
                        <p className="text-sm text-gray-400">Unzip the files to a location of your choice</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-yellow-600/20 rounded-full flex items-center justify-center">
                        <span className="text-yellow-400 font-medium">2</span>
                      </div>
                      <div>
                        <p className="font-medium">Run the installer</p>
                        <p className="text-sm text-gray-400">Follow the installation wizard</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-yellow-600/20 rounded-full flex items-center justify-center">
                        <span className="text-yellow-400 font-medium">3</span>
                      </div>
                      <div>
                        <p className="font-medium">Configure antivirus exceptions</p>
                        <p className="text-sm text-gray-400">Add the mining software to your antivirus whitelist</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-yellow-600/20 rounded-full flex items-center justify-center">
                        <span className="text-yellow-400 font-medium">4</span>
                      </div>
                      <div>
                        <p className="font-medium">Complete installation</p>
                        <p className="text-sm text-gray-400">The miner will be ready to configure after installation</p>
                      </div>
                    </div>
                  </div>

                  {isInstalling && (
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Installing...</span>
                        <span className="text-sm">{installProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${installProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                    <div>
                      <p className="text-yellow-400 font-medium">Security Notice</p>
                      <p className="text-sm text-gray-300 mt-1">
                        Mining software may be flagged by antivirus programs as potentially unwanted programs (PUPs).
                        This is a false positive due to the nature of cryptocurrency mining. You may need to add an exception
                        in your antivirus software.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <motion.button
                    onClick={handleInstall}
                    disabled={isInstalling}
                    className="flex items-center space-x-2 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors disabled:opacity-50"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isInstalling ? (
                      <span>Installing... ({installProgress}%)</span>
                    ) : (
                      <span>Simulate Installation</span>
                    )}
                  </motion.button>
                </div>
              </div>
            )}

            {/* Step 3: Configuration */}
            {step === 3 && (
              <div className="space-y-6">
                <h4 className="text-lg font-semibold">Configure Mining Script</h4>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Wallet Address</label>
                  <div className="flex">
                    <input
                      type="text"
                      value={walletAddress}
                      onChange={(e) => setWalletAddress(e.target.value)}
                      placeholder="Enter your wallet address"
                      className="flex-1 bg-gray-900/50 border border-gray-700/50 rounded-l-lg px-3 py-3 focus:outline-none focus:border-yellow-500/50"
                      onBlur={generateMinerScript}
                    />
                    {isConnected && (
                      <button
                        onClick={() => {
                          setWalletAddress(address || '');
                          setTimeout(generateMinerScript, 100);
                        }}
                        className="bg-gray-700 hover:bg-gray-600 px-4 rounded-r-lg transition-colors"
                      >
                        <Wallet className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {isConnected && (
                    <p className="text-xs text-gray-400 mt-1">Connected wallet: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Mining Script</label>
                    <button
                      onClick={copyScript}
                      className="flex items-center space-x-1 text-xs text-yellow-400 hover:text-yellow-300"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </button>
                  </div>
                  <div className="bg-gray-900/70 rounded-lg p-4 border border-gray-700/50 font-mono text-sm overflow-x-auto">
                    <pre className="whitespace-pre-wrap">{minerScript}</pre>
                  </div>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/30">
                  <h5 className="font-medium mb-3">How to Run</h5>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-yellow-600/20 rounded-full flex items-center justify-center mt-0.5">
                        <span className="text-yellow-400 font-medium text-xs">1</span>
                      </div>
                      <div>
                        <p className="font-medium">Save the script</p>
                        <p className="text-sm text-gray-400">Save the above script as a .sh file (Linux/macOS) or .bat file (Windows)</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-yellow-600/20 rounded-full flex items-center justify-center mt-0.5">
                        <span className="text-yellow-400 font-medium text-xs">2</span>
                      </div>
                      <div>
                        <p className="font-medium">Make it executable</p>
                        <p className="text-sm text-gray-400">On Linux/macOS: <code className="bg-gray-900 px-1 rounded">chmod +x script.sh</code></p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-yellow-600/20 rounded-full flex items-center justify-center mt-0.5">
                        <span className="text-yellow-400 font-medium text-xs">3</span>
                      </div>
                      <div>
                        <p className="font-medium">Run the script</p>
                        <p className="text-sm text-gray-400">Double-click the script file or run it from the terminal</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <Terminal className="w-5 h-5 text-blue-400 mt-0.5" />
                    <div>
                      <p className="text-blue-400 font-medium">Mining Information</p>
                      <p className="text-sm text-gray-300 mt-1">
                        You're now set up to mine {selectedCoin}! The script is configured to connect to an optimal mining pool
                        for {selectedCoin}. Your earnings will be sent directly to the wallet address you provided.
                        Mining rewards typically appear after 1-24 hours depending on the coin and network difficulty.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <motion.button
                    onClick={onClose}
                    className="flex items-center space-x-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Check className="w-5 h-5" />
                    <span>Finish Setup</span>
                  </motion.button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default MinerSetupModal;