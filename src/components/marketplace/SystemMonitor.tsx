import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cpu, MemoryStick as Memory, HardDrive, Wifi, Activity, Thermometer } from 'lucide-react';

interface SystemMonitorProps {
  isActive?: boolean;
  onToggle?: () => void;
}

const SystemMonitor: React.FC<SystemMonitorProps> = ({ isActive = false, onToggle }) => {
  const [cpuUsage, setCpuUsage] = useState(0);
  const [memoryUsage, setMemoryUsage] = useState(0);
  const [gpuUsage, setGpuUsage] = useState(0);
  const [networkUsage, setNetworkUsage] = useState(0);
  const [cpuTemp, setCpuTemp] = useState(0);
  const [gpuTemp, setGpuTemp] = useState(0);
  const [earnings, setEarnings] = useState(0);

  useEffect(() => {
    if (!isActive) return;

    // Simulate resource monitoring
    const interval = setInterval(() => {
      // Generate random usage values when active
      setCpuUsage(Math.min(80, 40 + Math.random() * 30)); // 40-70% usage
      setMemoryUsage(Math.min(70, 30 + Math.random() * 20)); // 30-50% usage
      setGpuUsage(Math.min(90, 60 + Math.random() * 20)); // 60-80% usage
      setNetworkUsage(Math.min(50, 10 + Math.random() * 20)); // 10-30% usage
      
      // Simulate temperatures
      setCpuTemp(Math.min(80, 50 + Math.random() * 15)); // 50-65°C
      setGpuTemp(Math.min(85, 60 + Math.random() * 15)); // 60-75°C
      
      // Increment earnings
      setEarnings(prev => prev + (713633.13824723 / 3600)); // Per second
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive]);

  // Reset values when inactive
  useEffect(() => {
    if (!isActive) {
      setCpuUsage(0);
      setMemoryUsage(0);
      setGpuUsage(0);
      setNetworkUsage(0);
      setCpuTemp(0);
      setGpuTemp(0);
    }
  }, [isActive]);

  return (
    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/30">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">System Monitor</h3>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></div>
          <span className="text-sm">{isActive ? 'Active' : 'Inactive'}</span>
          {onToggle && (
            <motion.button
              onClick={onToggle}
              className={`px-3 py-1 rounded text-xs font-medium ${
                isActive 
                  ? 'bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30'
                  : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isActive ? 'Stop' : 'Start'}
            </motion.button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          {/* CPU Usage */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium">CPU Usage</span>
              </div>
              <span className="text-sm">{cpuUsage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${cpuUsage}%` }}
              ></div>
            </div>
          </div>

          {/* Memory Usage */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2">
                <Memory className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium">Memory Usage</span>
              </div>
              <span className="text-sm">{memoryUsage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${memoryUsage}%` }}
              ></div>
            </div>
          </div>

          {/* GPU Usage */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium">GPU Usage</span>
              </div>
              <span className="text-sm">{gpuUsage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-emerald-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${gpuUsage}%` }}
              ></div>
            </div>
          </div>

          {/* Network Usage */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2">
                <Wifi className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium">Network Usage</span>
              </div>
              <span className="text-sm">{networkUsage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-purple-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${networkUsage}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div>
          {/* Temperatures */}
          <div className="bg-gray-900/30 rounded-lg p-4 mb-4">
            <h4 className="font-medium mb-3">Temperatures</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Thermometer className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm">CPU Temperature</span>
                </div>
                <span className={`text-sm ${
                  cpuTemp > 75 ? 'text-red-400' : 
                  cpuTemp > 65 ? 'text-yellow-400' : 
                  'text-emerald-400'
                }`}>
                  {cpuTemp.toFixed(1)}°C
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Thermometer className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm">GPU Temperature</span>
                </div>
                <span className={`text-sm ${
                  gpuTemp > 80 ? 'text-red-400' : 
                  gpuTemp > 70 ? 'text-yellow-400' : 
                  'text-emerald-400'
                }`}>
                  {gpuTemp.toFixed(1)}°C
                </span>
              </div>
            </div>
          </div>

          {/* Earnings */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <h4 className="font-medium text-yellow-400 mb-3">Earnings</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Current Session:</span>
                <span className="font-medium">{earnings.toFixed(8)} WATT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Hourly Rate:</span>
                <span className="font-medium">{(713633.13824723).toFixed(8)} WATT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Next Payout:</span>
                <span className="font-medium">{new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemMonitor;