import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cpu, MemoryStick as Memory, HardDrive, Wifi, Monitor, RefreshCw, Check, AlertTriangle, Zap } from 'lucide-react';
import { hardwareDetectionService, HardwareSpecs } from '../../services/hardwareDetectionService';
import toast from 'react-hot-toast';

interface HardwareScannerProps {
  onScanComplete?: (specs: HardwareSpecs) => void;
}

const HardwareScanner: React.FC<HardwareScannerProps> = ({ onScanComplete }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [systemSpecs, setSystemSpecs] = useState<HardwareSpecs | null>(null);
  const [selectedComponents, setSelectedComponents] = useState<{
    cpu: boolean;
    gpu: boolean;
    memory: boolean;
    storage: boolean;
    network: boolean;
  }>({
    cpu: true,
    gpu: true,
    memory: true,
    storage: false,
    network: false
  });
  
  // Resource allocation sliders
  const [resourceAllocation, setResourceAllocation] = useState({
    cpuCores: 0,
    cpuUsage: 80, // percentage
    gpuUsage: 90, // percentage
    memoryUsage: 70, // percentage
    storageSpace: 10, // GB
    networkBandwidth: 50 // percentage
  });

  useEffect(() => {
    // Auto-scan on component mount
    handleScan();
  }, []);

  const handleScan = async () => {
    setIsScanning(true);
    try {
      const specs = await hardwareDetectionService.detectSystemHardware();
      setSystemSpecs(specs);
      
      // Set default resource allocation based on detected specs
      setResourceAllocation({
        cpuCores: Math.max(1, Math.floor(specs.cpu.cores * 0.75)), // 75% of available cores
        cpuUsage: 80,
        gpuUsage: 90,
        memoryUsage: 70,
        storageSpace: Math.min(100, Math.floor(specs.storage.available * 0.1)), // 10% of available storage
        networkBandwidth: 50
      });
      
      if (onScanComplete) {
        onScanComplete(specs);
      }
      
      toast.success('System scan completed successfully');
    } catch (error) {
      console.error('Failed to scan system:', error);
      toast.error('Failed to scan system');
    } finally {
      setIsScanning(false);
    }
  };

  const calculateEstimatedEarnings = (): string => {
    if (!systemSpecs) return '0';
    
    // Calculate based on selected components and allocation
    let estimate = 0;
    
    if (selectedComponents.cpu) {
      // CPU earnings: cores × speed × usage × rate
      const cpuEarnings = resourceAllocation.cpuCores * systemSpecs.cpu.speed * 
                         (resourceAllocation.cpuUsage / 100) * 713633.13824723;
      estimate += cpuEarnings;
    }
    
    if (selectedComponents.gpu) {
      // GPU earnings: CUDA cores × usage × rate
      const gpuEarnings = systemSpecs.gpu.cudaCores * 
                         (resourceAllocation.gpuUsage / 100) * 713633.13824723 / 1000;
      estimate += gpuEarnings;
    }
    
    if (selectedComponents.memory) {
      // Memory earnings: GB × usage × rate
      const memoryEarnings = (systemSpecs.memory.total * resourceAllocation.memoryUsage / 100) * 
                            713633.13824723 / 100;
      estimate += memoryEarnings;
    }
    
    return estimate.toFixed(8);
  };

  const handleComponentToggle = (component: keyof typeof selectedComponents) => {
    setSelectedComponents(prev => ({
      ...prev,
      [component]: !prev[component]
    }));
  };

  const handleResourceChange = (resource: keyof typeof resourceAllocation, value: number) => {
    setResourceAllocation(prev => ({
      ...prev,
      [resource]: value
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Hardware Scanner</h3>
        <motion.button
          onClick={handleScan}
          disabled={isScanning}
          className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors disabled:opacity-50"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
          <span>{isScanning ? 'Scanning...' : 'Scan System'}</span>
        </motion.button>
      </div>

      {systemSpecs ? (
        <div className="space-y-6">
          {/* Component Selection */}
          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/30">
            <h4 className="font-medium text-yellow-400 mb-4">Select Components to Share</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <motion.button
                onClick={() => handleComponentToggle('cpu')}
                className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-colors ${
                  selectedComponents.cpu
                    ? 'border-yellow-500/50 bg-yellow-500/10'
                    : 'border-gray-700/50 hover:border-gray-600/50 bg-gray-800/30'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Cpu className={`w-8 h-8 mb-2 ${selectedComponents.cpu ? 'text-yellow-400' : 'text-gray-400'}`} />
                <span className="font-medium">CPU</span>
                <span className="text-xs text-gray-400 mt-1">{systemSpecs.cpu.cores} Cores</span>
              </motion.button>
              
              <motion.button
                onClick={() => handleComponentToggle('gpu')}
                className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-colors ${
                  selectedComponents.gpu
                    ? 'border-emerald-500/50 bg-emerald-500/10'
                    : 'border-gray-700/50 hover:border-gray-600/50 bg-gray-800/30'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Monitor className={`w-8 h-8 mb-2 ${selectedComponents.gpu ? 'text-emerald-400' : 'text-gray-400'}`} />
                <span className="font-medium">GPU</span>
                <span className="text-xs text-gray-400 mt-1">{systemSpecs.gpu.model.split(' ').slice(-1)[0]}</span>
              </motion.button>
              
              <motion.button
                onClick={() => handleComponentToggle('memory')}
                className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-colors ${
                  selectedComponents.memory
                    ? 'border-blue-500/50 bg-blue-500/10'
                    : 'border-gray-700/50 hover:border-gray-600/50 bg-gray-800/30'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Memory className={`w-8 h-8 mb-2 ${selectedComponents.memory ? 'text-blue-400' : 'text-gray-400'}`} />
                <span className="font-medium">Memory</span>
                <span className="text-xs text-gray-400 mt-1">{systemSpecs.memory.total} GB</span>
              </motion.button>
              
              <motion.button
                onClick={() => handleComponentToggle('storage')}
                className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-colors ${
                  selectedComponents.storage
                    ? 'border-purple-500/50 bg-purple-500/10'
                    : 'border-gray-700/50 hover:border-gray-600/50 bg-gray-800/30'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <HardDrive className={`w-8 h-8 mb-2 ${selectedComponents.storage ? 'text-purple-400' : 'text-gray-400'}`} />
                <span className="font-medium">Storage</span>
                <span className="text-xs text-gray-400 mt-1">{systemSpecs.storage.available} GB free</span>
              </motion.button>
              
              <motion.button
                onClick={() => handleComponentToggle('network')}
                className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-colors ${
                  selectedComponents.network
                    ? 'border-orange-500/50 bg-orange-500/10'
                    : 'border-gray-700/50 hover:border-gray-600/50 bg-gray-800/30'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Wifi className={`w-8 h-8 mb-2 ${selectedComponents.network ? 'text-orange-400' : 'text-gray-400'}`} />
                <span className="font-medium">Network</span>
                <span className="text-xs text-gray-400 mt-1">{systemSpecs.network.download} Mbps</span>
              </motion.button>
            </div>
          </div>

          {/* Resource Allocation */}
          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/30">
            <h4 className="font-medium text-yellow-400 mb-4">Resource Allocation</h4>
            
            {/* CPU Cores Slider */}
            {selectedComponents.cpu && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">CPU Cores</label>
                  <span className="text-sm bg-gray-900/50 px-2 py-1 rounded">
                    {resourceAllocation.cpuCores} / {systemSpecs.cpu.cores} cores
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max={systemSpecs.cpu.cores}
                  step="1"
                  value={resourceAllocation.cpuCores}
                  onChange={(e) => handleResourceChange('cpuCores', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between mt-1 text-xs text-gray-400">
                  <span>1 core</span>
                  <span>{Math.floor(systemSpecs.cpu.cores / 2)} cores</span>
                  <span>{systemSpecs.cpu.cores} cores</span>
                </div>
              </div>
            )}
            
            {/* CPU Usage Slider */}
            {selectedComponents.cpu && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">CPU Usage Limit</label>
                  <span className="text-sm bg-gray-900/50 px-2 py-1 rounded">
                    {resourceAllocation.cpuUsage}%
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={resourceAllocation.cpuUsage}
                  onChange={(e) => handleResourceChange('cpuUsage', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between mt-1 text-xs text-gray-400">
                  <span>10%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            )}
            
            {/* GPU Usage Slider */}
            {selectedComponents.gpu && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">GPU Usage Limit</label>
                  <span className="text-sm bg-gray-900/50 px-2 py-1 rounded">
                    {resourceAllocation.gpuUsage}%
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={resourceAllocation.gpuUsage}
                  onChange={(e) => handleResourceChange('gpuUsage', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between mt-1 text-xs text-gray-400">
                  <span>10%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            )}
            
            {/* Memory Usage Slider */}
            {selectedComponents.memory && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Memory Usage Limit</label>
                  <span className="text-sm bg-gray-900/50 px-2 py-1 rounded">
                    {resourceAllocation.memoryUsage}%
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="90"
                  step="5"
                  value={resourceAllocation.memoryUsage}
                  onChange={(e) => handleResourceChange('memoryUsage', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between mt-1 text-xs text-gray-400">
                  <span>10%</span>
                  <span>50%</span>
                  <span>90%</span>
                </div>
              </div>
            )}
            
            {/* Storage Space Slider */}
            {selectedComponents.storage && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Storage Space</label>
                  <span className="text-sm bg-gray-900/50 px-2 py-1 rounded">
                    {resourceAllocation.storageSpace} GB
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max={Math.min(500, systemSpecs.storage.available)}
                  step="1"
                  value={resourceAllocation.storageSpace}
                  onChange={(e) => handleResourceChange('storageSpace', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between mt-1 text-xs text-gray-400">
                  <span>1 GB</span>
                  <span>{Math.min(500, systemSpecs.storage.available) / 2} GB</span>
                  <span>{Math.min(500, systemSpecs.storage.available)} GB</span>
                </div>
              </div>
            )}
            
            {/* Network Bandwidth Slider */}
            {selectedComponents.network && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Network Bandwidth Limit</label>
                  <span className="text-sm bg-gray-900/50 px-2 py-1 rounded">
                    {resourceAllocation.networkBandwidth}%
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="90"
                  step="5"
                  value={resourceAllocation.networkBandwidth}
                  onChange={(e) => handleResourceChange('networkBandwidth', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between mt-1 text-xs text-gray-400">
                  <span>10%</span>
                  <span>50%</span>
                  <span>90%</span>
                </div>
              </div>
            )}
          </div>

          {/* Estimated Earnings */}
          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/30">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-yellow-400">Estimated Earnings</h4>
              <div className="flex items-center space-x-1 text-emerald-400">
                <Zap className="w-4 h-4" />
                <span className="text-sm font-medium">Per Hour</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-3xl font-bold text-yellow-400 mb-2">
                  {calculateEstimatedEarnings()} WATT
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Daily (24h):</span>
                    <span>{(parseFloat(calculateEstimatedEarnings()) * 24).toFixed(8)} WATT</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Weekly:</span>
                    <span>{(parseFloat(calculateEstimatedEarnings()) * 24 * 7).toFixed(8)} WATT</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Monthly:</span>
                    <span>{(parseFloat(calculateEstimatedEarnings()) * 24 * 30).toFixed(8)} WATT</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-900/30 rounded-lg p-4">
                <h5 className="font-medium mb-3">Earnings Breakdown</h5>
                <div className="space-y-2 text-sm">
                  {selectedComponents.cpu && (
                    <div className="flex justify-between">
                      <div className="flex items-center space-x-2">
                        <Cpu className="w-4 h-4 text-yellow-400" />
                        <span>CPU ({resourceAllocation.cpuCores} cores):</span>
                      </div>
                      <span>{(resourceAllocation.cpuCores * systemSpecs.cpu.speed * resourceAllocation.cpuUsage / 100 * 713633.13824723).toFixed(8)} WATT/hr</span>
                    </div>
                  )}
                  
                  {selectedComponents.gpu && (
                    <div className="flex justify-between">
                      <div className="flex items-center space-x-2">
                        <Monitor className="w-4 h-4 text-emerald-400" />
                        <span>GPU ({resourceAllocation.gpuUsage}%):</span>
                      </div>
                      <span>{(systemSpecs.gpu.cudaCores * resourceAllocation.gpuUsage / 100 * 713633.13824723 / 1000).toFixed(8)} WATT/hr</span>
                    </div>
                  )}
                  
                  {selectedComponents.memory && (
                    <div className="flex justify-between">
                      <div className="flex items-center space-x-2">
                        <Memory className="w-4 h-4 text-blue-400" />
                        <span>Memory ({resourceAllocation.memoryUsage}%):</span>
                      </div>
                      <span>{(systemSpecs.memory.total * resourceAllocation.memoryUsage / 100 * 713633.13824723 / 1000).toFixed(8)} WATT/hr</span>
                    </div>
                  )}
                  
                  {selectedComponents.storage && (
                    <div className="flex justify-between">
                      <div className="flex items-center space-x-2">
                        <HardDrive className="w-4 h-4 text-purple-400" />
                        <span>Storage ({resourceAllocation.storageSpace} GB):</span>
                      </div>
                      <span>{(resourceAllocation.storageSpace * 713633.13824723 / 100).toFixed(8)} WATT/hr</span>
                    </div>
                  )}
                  
                  {selectedComponents.network && (
                    <div className="flex justify-between">
                      <div className="flex items-center space-x-2">
                        <Wifi className="w-4 h-4 text-orange-400" />
                        <span>Network ({resourceAllocation.networkBandwidth}%):</span>
                      </div>
                      <span>{(systemSpecs.network.download * resourceAllocation.networkBandwidth / 100 * 713633.13824723 / 1000).toFixed(8)} WATT/hr</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* System Information */}
          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/30">
            <h4 className="font-medium text-yellow-400 mb-4">Detected System Specifications</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="font-medium text-yellow-400 mb-3">CPU</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Model:</span>
                    <span>{systemSpecs.cpu.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Cores/Threads:</span>
                    <span>{systemSpecs.cpu.cores}/{systemSpecs.cpu.threads}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Speed:</span>
                    <span>{systemSpecs.cpu.speed} GHz (Turbo: {systemSpecs.cpu.maxSpeed} GHz)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Architecture:</span>
                    <span>{systemSpecs.cpu.architecture}</span>
                  </div>
                </div>
              </div>

              <div>
                <h5 className="font-medium text-emerald-400 mb-3">GPU</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Model:</span>
                    <span>{systemSpecs.gpu.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Memory:</span>
                    <span>{systemSpecs.gpu.memory} GB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">CUDA Cores:</span>
                    <span>{systemSpecs.gpu.cudaCores}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Driver:</span>
                    <span>{systemSpecs.gpu.driver}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
              <div>
                <p className="text-yellow-400 font-medium">Security Information</p>
                <p className="text-sm text-gray-300 mt-1">
                  The hardware rental client runs in a secure sandbox with strict resource limits. You can adjust how much of your system resources to share,
                  and the client will automatically throttle when you're using your computer. Your personal data remains private and secure.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : isScanning ? (
        <div className="bg-gray-800/50 rounded-lg p-12 border border-gray-700/30 flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-6"></div>
          <h3 className="text-xl font-semibold mb-2">Scanning System</h3>
          <p className="text-gray-400 text-center max-w-md">
            Detecting CPU, GPU, memory, storage, and network capabilities...
          </p>
        </div>
      ) : (
        <div className="bg-gray-800/50 rounded-lg p-12 border border-gray-700/30 flex flex-col items-center justify-center">
          <AlertTriangle className="w-16 h-16 text-yellow-400 mb-6" />
          <h3 className="text-xl font-semibold mb-2">No Hardware Detected</h3>
          <p className="text-gray-400 text-center max-w-md mb-6">
            We couldn't detect your system specifications. Please click the "Scan System" button to try again.
          </p>
          <motion.button
            onClick={handleScan}
            className="flex items-center space-x-2 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RefreshCw className="w-5 h-5" />
            <span>Scan System</span>
          </motion.button>
        </div>
      )}

    </div>
  );
};

export default HardwareScanner;