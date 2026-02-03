import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Cpu, Monitor, Server, Download, Check, Wallet, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useWallet } from '../../hooks/useWallet';
import HardwareScanner from './HardwareScanner';
import { HardwareSpecs } from '../../services/hardwareRentalService';

interface HardwareRentalModalProps {
  isOpen: boolean;
  onClose: () => void;
  app: any;
  onShowContract: () => void;
}

const HardwareRentalModal: React.FC<HardwareRentalModalProps> = ({ isOpen, onClose, app, onShowContract }) => {
  const [step, setStep] = useState(1);
  const [systemInfo, setSystemInfo] = useState<HardwareSpecs | null>(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState(0);
  const { isConnected, address } = useWallet();

  useEffect(() => {
    if (isOpen) {
      // Reset state when modal opens
      setStep(1);
      setIsDownloading(false);
      setIsInstalling(false);
      setInstallProgress(0);
      
      // Auto-fill wallet address if connected
      if (isConnected && address) {
        setWalletAddress(address);
      }
    }
  }, [isOpen, isConnected, address]);

  const handleScanComplete = (specs: HardwareSpecs) => {
    setSystemInfo(specs);
  };

  const handleDownload = () => {
    setIsDownloading(true);
    
    // Simulate download
    setTimeout(() => {
      setIsDownloading(false);
      setStep(2);
      toast.success('Client downloaded successfully');
    }, 2000);
  };

  const handleInstall = () => {
    setIsInstalling(true);
    
    // Simulate installation with guaranteed completion
    const progressSteps = [25, 50, 75, 100];
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
          toast.success('Client installed successfully');
        }
      }
    }, 1000);
  };

  const handleContinueToContract = () => {
    if (!walletAddress) {
      toast.error('Please enter your wallet address');
      return;
    }
    
    onShowContract();
  };

  const getAppIcon = () => {
    if (!app) return <Cpu />;
    
    switch (app.type) {
      case 'CPU':
        return <Cpu className="w-8 h-8 text-yellow-400" />;
      case 'GPU':
        return <Monitor className="w-8 h-8 text-emerald-400" />;
      case 'Server':
        return <Server className="w-8 h-8 text-blue-400" />;
      default:
        return <Cpu className="w-8 h-8 text-yellow-400" />;
    }
  };

  const getEstimatedEarnings = () => {
    if (!systemInfo || !app) return '0';
    
    let estimate = 0;
    
    switch (app.type) {
      case 'CPU':
        // Calculate based on CPU MHz and cores
        const totalMHz = systemInfo.cpu.cores * systemInfo.cpu.speed * 1000;
        estimate = totalMHz * 713633.13824723 / 1000; // per hour
        break;
      case 'GPU':
        // Calculate based on CUDA cores
        estimate = systemInfo.gpu.cudaCores * 713633.13824723 / 1000; // per hour
        break;
      case 'Server':
        // Fixed rate for server hosting
        estimate = 713633.13824723; // per hour
        break;
      default:
        estimate = 713633.13824723 / 2; // default fallback
    }
    
    return estimate.toFixed(8);
  };

  if (!isOpen || !app) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <AnimatePresence>
        <motion.div
          className="bg-gray-900/90 backdrop-blur-xl rounded-2xl border border-gray-700/50 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
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
            {/* Step 1: System Detection */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold">System Requirements</h4>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-emerald-400">Compatible System Detected</span>
                  </div>
                </div>

                {/* Hardware Scanner Component */}
                <HardwareScanner onScanComplete={handleScanComplete} />

                <div className="flex justify-end">
                  <motion.button
                    onClick={handleDownload}
                    disabled={isDownloading || !systemInfo}
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
                        <span>Download Client</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            )}

            {/* Step 2: Installation */}
            {step === 2 && (
              <div className="space-y-6">
                <h4 className="text-lg font-semibold">Install Hardware Rental Client</h4>
                
                <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/30">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-yellow-600/20 rounded-full flex items-center justify-center">
                        <span className="text-yellow-400 font-medium">1</span>
                      </div>
                      <div>
                        <p className="font-medium">Run the installer</p>
                        <p className="text-sm text-gray-400">Execute the downloaded file with administrator privileges</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-yellow-600/20 rounded-full flex items-center justify-center">
                        <span className="text-yellow-400 font-medium">2</span>
                      </div>
                      <div>
                        <p className="font-medium">Follow the installation wizard</p>
                        <p className="text-sm text-gray-400">Accept the license agreement and choose installation location</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-yellow-600/20 rounded-full flex items-center justify-center">
                        <span className="text-yellow-400 font-medium">3</span>
                      </div>
                      <div>
                        <p className="font-medium">Configure resource sharing</p>
                        <p className="text-sm text-gray-400">Set CPU, GPU, and memory limits for resource sharing</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-yellow-600/20 rounded-full flex items-center justify-center">
                        <span className="text-yellow-400 font-medium">4</span>
                      </div>
                      <div>
                        <p className="font-medium">Complete installation</p>
                        <p className="text-sm text-gray-400">The client will start automatically after installation</p>
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

            {/* Step 3: Wallet Configuration */}
            {step === 3 && (
              <div className="space-y-6">
                <h4 className="text-lg font-semibold">Connect Your Wallet</h4>
                
                <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/30">
                  <p className="mb-4">Enter your WATT wallet address to receive earnings from hardware rental:</p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">WATT Wallet Address</label>
                      <div className="flex">
                        <input
                          type="text"
                          value={walletAddress}
                          onChange={(e) => setWalletAddress(e.target.value)}
                          placeholder="0x..."
                          className="flex-1 bg-gray-900/50 border border-gray-700/50 rounded-l-lg px-3 py-3 focus:outline-none focus:border-yellow-500/50"
                        />
                        {isConnected && (
                          <button
                            onClick={() => setWalletAddress(address || '')}
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
                    
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                      <div className="flex items-start space-x-2">
                        <Check className="w-5 h-5 text-blue-400 mt-0.5" />
                        <div>
                          <p className="text-blue-400 font-medium">Earnings Information</p>
                          <p className="text-sm text-gray-300 mt-1">
                            You'll earn approximately <span className="text-yellow-400 font-medium">{getEstimatedEarnings()} WATT</span> per hour 
                            based on your system specifications. Earnings are calculated based on actual resource usage and 
                            are paid out automatically every 24 hours to your wallet.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <motion.button
                    onClick={handleContinueToContract}
                    className="flex items-center space-x-2 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ArrowRight className="w-5 h-5" />
                    <span>Continue to Contract</span>
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

export default HardwareRentalModal;