import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cpu, MemoryStick as Memory, HardDrive, Wifi, Zap, Clock, Shield, Check, AlertTriangle, Download } from 'lucide-react';
import { hardwareRentalService, RentalContract } from '../../services/hardwareRentalService';
import HardwareScanner from './HardwareScanner';
import SystemMonitor from './SystemMonitor';
import toast from 'react-hot-toast';

const HardwareRentalDashboard: React.FC = () => {
  const [activeContracts, setActiveContracts] = useState<RentalContract[]>([]);
  const [isRenting, setIsRenting] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [uptime, setUptime] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);

  useEffect(() => {
    // Load active contracts
    const contracts = hardwareRentalService.getActiveContracts();
    setActiveContracts(contracts);
    
    // Check if already renting
    setIsRenting(contracts.length > 0);
    
    if (contracts.length > 0) {
      // Calculate total earnings
      const total = contracts.reduce((sum, contract) => sum + contract.totalEarned, 0);
      setTotalEarnings(total);
      
      // Set start time to earliest contract
      const earliest = contracts.reduce(
        (earliest, contract) => contract.startDate < earliest ? contract.startDate : earliest,
        new Date()
      );
      setStartTime(earliest);
      
      // Calculate uptime
      const now = new Date();
      const uptimeMs = now.getTime() - earliest.getTime();
      setUptime(uptimeMs / (1000 * 60 * 60)); // Convert to hours
    }
    
    // Simulate earnings updates
    const interval = setInterval(() => {
      if (contracts.length > 0) {
        setTotalEarnings(prev => prev + (713633.13824723 / 3600) * contracts.length); // Per second per contract
        setUptime(prev => prev + (1 / 3600)); // Add 1 second in hours
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const handleStartRenting = () => {
    setShowScanner(true);
  };

  const handleStopRenting = () => {
    // Confirm before stopping
    if (window.confirm('Are you sure you want to stop renting your hardware? This will terminate all active contracts.')) {
      // Update all contracts to terminated
      activeContracts.forEach(contract => {
        hardwareRentalService.updateContractStatus(contract.id, 'terminated');
      });
      
      setIsRenting(false);
      setActiveContracts([]);
      toast.success('Hardware rental stopped');
    }
  };

  const toggleRenting = () => {
    if (isRenting) {
      handleStopRenting();
    } else {
      handleStartRenting();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Hardware Rental Dashboard</h2>
          <p className="text-gray-400 mt-1">Rent out your hardware and earn WATT tokens</p>
        </div>
        
        <motion.button
          onClick={toggleRenting}
          className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors ${
            isRenting
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isRenting ? (
            <>
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              <span>Stop Renting</span>
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              <span>Start Renting</span>
            </>
          )}
        </motion.button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="flex items-center justify-between mb-2">
            <Zap className="w-6 h-6 text-yellow-400" />
            <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">
              WATT
            </span>
          </div>
          <p className="text-slate-400 text-sm">Total Earnings</p>
          <p className="text-2xl font-bold">{totalEarnings.toFixed(8)}</p>
          <p className="text-xs text-emerald-400">+{(713633.13824723 * activeContracts.length).toFixed(2)} WATT/hr</p>
        </motion.div>

        <motion.div
          className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-6 h-6 text-blue-400" />
            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
              Hours
            </span>
          </div>
          <p className="text-slate-400 text-sm">Total Uptime</p>
          <p className="text-2xl font-bold">{uptime.toFixed(2)}</p>
          <p className="text-xs text-blue-400">Since {startTime?.toLocaleDateString() || 'N/A'}</p>
        </motion.div>

        <motion.div
          className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-2">
            <Cpu className="w-6 h-6 text-emerald-400" />
            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">
              Active
            </span>
          </div>
          <p className="text-slate-400 text-sm">Active Contracts</p>
          <p className="text-2xl font-bold">{activeContracts.length}</p>
          <p className="text-xs text-emerald-400">
            {activeContracts.length > 0 ? 'Hardware being rented' : 'No active contracts'}
          </p>
        </motion.div>

        <motion.div
          className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-2">
            <Shield className="w-6 h-6 text-purple-400" />
            <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
              Secure
            </span>
          </div>
          <p className="text-slate-400 text-sm">Security Status</p>
          <p className="text-2xl font-bold">Protected</p>
          <p className="text-xs text-purple-400">Sandboxed Environment</p>
        </motion.div>
      </div>

      {/* System Monitor */}
      {isRenting && <SystemMonitor isActive={true} onToggle={toggleRenting} />}

      {/* Hardware Scanner */}
      {showScanner && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <HardwareScanner 
            onScanComplete={(specs) => {
              // Create a new rental contract
              const contract = hardwareRentalService.createRentalContract(
                '0x742d35Cc23c3a684194D92Bb99c8b77C7516E6Db', // Demo wallet address
                'CPU',
                specs
              );
              
              setActiveContracts(prev => [...prev, contract]);
              setIsRenting(true);
              setShowScanner(false);
              setStartTime(new Date());
              
              toast.success('Hardware rental started successfully!');
            }} 
          />
        </motion.div>
      )}

      {/* Active Contracts */}
      {activeContracts.length > 0 && (
        <motion.div
          className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-lg font-semibold mb-4">Active Rental Contracts</h3>
          <div className="space-y-4">
            {activeContracts.map((contract, index) => (
              <motion.div
                key={contract.id}
                className="bg-slate-900/30 rounded-lg p-4 border border-slate-700/30"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {contract.hardwareType === 'CPU' ? (
                      <Cpu className="w-5 h-5 text-yellow-400" />
                    ) : contract.hardwareType === 'GPU' ? (
                      <Memory className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <HardDrive className="w-5 h-5 text-blue-400" />
                    )}
                    <div>
                      <h4 className="font-medium">{contract.hardwareType} Rental</h4>
                      <p className="text-xs text-slate-400">ID: {contract.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      contract.status === 'active'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : contract.status === 'paused'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {contract.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400">Payment Rate:</p>
                    <p className="font-medium">{contract.paymentRate.toFixed(8)} WATT/hr</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Start Date:</p>
                    <p className="font-medium">{contract.startDate.toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Total Earned:</p>
                    <p className="font-medium text-yellow-400">{contract.totalEarned.toFixed(8)} WATT</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Last Payout:</p>
                    <p className="font-medium">{contract.lastPayout ? contract.lastPayout.toLocaleDateString() : 'None yet'}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Getting Started */}
      {!isRenting && !showScanner && (
        <motion.div
          className="bg-gradient-to-r from-yellow-600/20 to-emerald-600/20 rounded-xl p-6 border border-yellow-500/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold">Start Earning WATT Tokens</h3>
              <p className="text-gray-300 mt-2 max-w-2xl">
                Rent out your idle computing power and earn WATT tokens. Our secure client ensures your system remains protected while sharing resources.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="flex items-start space-x-2">
                  <Check className="w-4 h-4 text-emerald-400 mt-1" />
                  <div>
                    <p className="font-medium">Secure Sandbox</p>
                    <p className="text-xs text-gray-400">Your data remains private and secure</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <Check className="w-4 h-4 text-emerald-400 mt-1" />
                  <div>
                    <p className="font-medium">Automatic Throttling</p>
                    <p className="text-xs text-gray-400">Reduces usage when you're active</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <Check className="w-4 h-4 text-emerald-400 mt-1" />
                  <div>
                    <p className="font-medium">Daily Payouts</p>
                    <p className="text-xs text-gray-400">Earnings sent directly to your wallet</p>
                  </div>
                </div>
              </div>
            </div>
            <motion.button
              onClick={handleStartRenting}
              className="flex items-center space-x-2 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Download className="w-5 h-5" />
              <span>Get Started</span>
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Security Information */}
      <motion.div
        className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-slate-700/50 rounded-lg">
            <Shield className="w-6 h-6 text-purple-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">Security Information</h3>
            <p className="text-gray-300 mb-4">
              Our hardware rental client is designed with security as the top priority. Here's how we protect your system:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <Check className="w-4 h-4 text-emerald-400 mt-1" />
                  <div>
                    <p className="font-medium">Sandboxed Environment</p>
                    <p className="text-sm text-gray-400">All workloads run in isolated containers</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <Check className="w-4 h-4 text-emerald-400 mt-1" />
                  <div>
                    <p className="font-medium">Resource Limits</p>
                    <p className="text-sm text-gray-400">You control how much of your system is shared</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <Check className="w-4 h-4 text-emerald-400 mt-1" />
                  <div>
                    <p className="font-medium">Automatic Throttling</p>
                    <p className="text-sm text-gray-400">Reduces usage when you're using your computer</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <Check className="w-4 h-4 text-emerald-400 mt-1" />
                  <div>
                    <p className="font-medium">Data Privacy</p>
                    <p className="text-sm text-gray-400">No access to your personal files or data</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <Check className="w-4 h-4 text-emerald-400 mt-1" />
                  <div>
                    <p className="font-medium">Encrypted Communication</p>
                    <p className="text-sm text-gray-400">All network traffic is encrypted</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <Check className="w-4 h-4 text-emerald-400 mt-1" />
                  <div>
                    <p className="font-medium">Temperature Monitoring</p>
                    <p className="text-sm text-gray-400">Prevents overheating of your components</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Warning */}
      <motion.div
        className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-start space-x-2">
          <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
          <div>
            <p className="text-yellow-400 font-medium">Important Notice</p>
            <p className="text-sm text-gray-300 mt-1">
              Hardware rental may increase power consumption and system wear. The client is designed to minimize impact,
              but please ensure your system has adequate cooling. You can stop renting at any time.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default HardwareRentalDashboard;