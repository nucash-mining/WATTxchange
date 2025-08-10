import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Monitor, Cpu, HardDrive, Zap, Lock, Unlock, Plus, Clock, AlertCircle, Check } from 'lucide-react';
import { useWallet } from '../../hooks/useWallet';
import toast from 'react-hot-toast';

interface NFT {
  id: number;
  name: string;
  type: 'GPU' | 'CPU' | 'PC Case' | 'Boost Item';
  hashRate: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';
  staked: boolean;
  icon: React.ComponentType<{ className?: string }>;
  power: number;
}

interface MiningRig {
  id: string;
  name: string;
  components: NFT[];
  totalHashRate: number;
  powerConsumption: number;
  efficiency: number;
  status: 'mining' | 'idle' | 'paused';
  wattBalance: number;
  endTime: number;
}

const NFTStaking: React.FC = () => {
  const { isConnected, address } = useWallet();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [rigs, setRigs] = useState<MiningRig[]>([]);
  const [showCreateRig, setShowCreateRig] = useState(false);
  const [selectedNFTs, setSelectedNFTs] = useState<number[]>([]);
  const [wattAmount, setWattAmount] = useState('');
  const [miningDuration, setMiningDuration] = useState('24'); // hours
  const [isCreatingRig, setIsCreatingRig] = useState(false);

  useEffect(() => {
    // Load NFTs and rigs when wallet is connected
    if (isConnected) {
      loadNFTs();
      loadRigs();
    }
  }, [isConnected, address]);

  const loadNFTs = () => {
    // In a real implementation, this would fetch from the blockchain
    setNfts([
      {
        id: 1,
        name: 'Free Mint PC Case',
        type: 'PC Case',
        hashRate: '0 MH/s',
        rarity: 'Common',
        staked: false,
        icon: Monitor,
        power: 0
      },
      {
        id: 2,
        name: 'Genesis Badge',
        type: 'Boost Item',
        hashRate: '+50% Overclock',
        rarity: 'Mythic',
        staked: false,
        icon: Zap,
        power: 0
      },
      {
        id: 3,
        name: 'XL1 Processor',
        type: 'CPU',
        hashRate: '+25%',
        rarity: 'Rare',
        staked: false,
        icon: Cpu,
        power: 125
      },
      {
        id: 4,
        name: 'TX120 GPU',
        type: 'GPU',
        hashRate: '+150%',
        rarity: 'Epic',
        staked: false,
        icon: HardDrive,
        power: 320
      },
      {
        id: 5,
        name: 'GP50 GPU',
        type: 'GPU',
        hashRate: '+200%',
        rarity: 'Legendary',
        staked: false,
        icon: HardDrive,
        power: 450
      }
    ]);
  };

  const loadRigs = () => {
    // In a real implementation, this would fetch from the blockchain
    setRigs([
      {
        id: 'rig-1',
        name: 'Mining Rig Alpha',
        components: [
          {
            id: 1,
            name: 'Free Mint PC Case',
            type: 'PC Case',
            hashRate: '0 MH/s',
            rarity: 'Common',
            staked: true,
            icon: Monitor,
            power: 0
          },
          {
            id: 3,
            name: 'XL1 Processor',
            type: 'CPU',
            hashRate: '+25%',
            rarity: 'Rare',
            staked: true,
            icon: Cpu,
            power: 125
          },
          {
            id: 4,
            name: 'TX120 GPU',
            type: 'GPU',
            hashRate: '+150%',
            rarity: 'Epic',
            staked: true,
            icon: HardDrive,
            power: 320
          },
          {
            id: 2,
            name: 'Genesis Badge',
            type: 'Boost Item',
            hashRate: '+50% Overclock',
            rarity: 'Mythic',
            staked: true,
            icon: Zap,
            power: 0
          }
        ],
        totalHashRate: 468.75,
        powerConsumption: 612,
        efficiency: 0.77,
        status: 'mining',
        wattBalance: 1000000,
        endTime: Date.now() + 24 * 60 * 60 * 1000 // 24 hours from now
      }
    ]);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Mythic': return 'from-purple-500 to-pink-500';
      case 'Legendary': return 'from-yellow-500 to-orange-500';
      case 'Epic': return 'from-blue-500 to-purple-500';
      case 'Rare': return 'from-green-500 to-blue-500';
      case 'Common': return 'from-gray-500 to-gray-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const toggleNFTSelection = (nftId: number) => {
    if (selectedNFTs.includes(nftId)) {
      setSelectedNFTs(selectedNFTs.filter(id => id !== nftId));
    } else {
      setSelectedNFTs([...selectedNFTs, nftId]);
    }
  };

  const calculateRigPerformance = () => {
    // Get selected NFTs
    const selectedComponents = nfts.filter(nft => selectedNFTs.includes(nft.id));
    
    // Check if we have required components
    const hasPCCase = selectedComponents.some(nft => nft.type === 'PC Case');
    const hasCPU = selectedComponents.some(nft => nft.type === 'CPU');
    
    if (!hasPCCase || !hasCPU) {
      return {
        valid: false,
        hashRate: 0,
        powerConsumption: 0,
        efficiency: 0,
        error: !hasPCCase ? 'PC Case required' : 'Processor required'
      };
    }
    
    // Check if we have too many GPUs
    const gpuCount = selectedComponents.filter(nft => nft.type === 'GPU').length;
    if (gpuCount > 2) {
      return {
        valid: false,
        hashRate: 0,
        powerConsumption: 0,
        efficiency: 0,
        error: 'Maximum 2 GPUs allowed'
      };
    }
    
    // Calculate performance
    let baseHashRate = 100; // Base hash rate in MH/s
    let powerConsumption = 50; // Base power consumption in watts
    const hasGenesisBadge = selectedComponents.some(nft => nft.name === 'Genesis Badge');
    
    // First pass: calculate base performance
    for (const component of selectedComponents) {
      if (component.type === 'Boost Item') continue;
      
      // Add component bonuses
      if (component.hashRate.includes('+') && component.hashRate.includes('%')) {
        const bonus = parseInt(component.hashRate.replace('+', '').replace('%', ''));
        baseHashRate += (baseHashRate * bonus) / 100;
      }
      
      powerConsumption += component.power;
    }
    
    // Second pass: apply Genesis Badge if present
    if (hasGenesisBadge) {
      baseHashRate += (baseHashRate * 50) / 100; // 50% boost to total
      powerConsumption += (powerConsumption * 25) / 100; // 25% power increase
    }
    
    const efficiency = baseHashRate / powerConsumption;
    
    return {
      valid: true,
      hashRate: baseHashRate,
      powerConsumption,
      efficiency,
      error: null
    };
  };

  const handleCreateRig = () => {
    setIsCreatingRig(true);
    
    // Validate rig configuration
    const performance = calculateRigPerformance();
    if (!performance.valid) {
      toast.error(performance.error || 'Invalid rig configuration');
      setIsCreatingRig(false);
      return;
    }
    
    // Validate WATT amount
    if (!wattAmount || parseFloat(wattAmount) <= 0) {
      toast.error('Please enter a valid WATT amount');
      setIsCreatingRig(false);
      return;
    }
    
    // Validate mining duration
    if (!miningDuration || parseInt(miningDuration) <= 0) {
      toast.error('Please enter a valid mining duration');
      setIsCreatingRig(false);
      return;
    }
    
    // In a real implementation, this would interact with the blockchain
    setTimeout(() => {
      // Create new rig
      const newRig: MiningRig = {
        id: `rig-${Date.now()}`,
        name: `Mining Rig ${rigs.length + 1}`,
        components: nfts.filter(nft => selectedNFTs.includes(nft.id)).map(nft => ({...nft, staked: true})),
        totalHashRate: performance.hashRate,
        powerConsumption: performance.powerConsumption,
        efficiency: performance.efficiency,
        status: 'mining',
        wattBalance: parseFloat(wattAmount),
        endTime: Date.now() + parseInt(miningDuration) * 60 * 60 * 1000
      };
      
      setRigs([...rigs, newRig]);
      
      // Update NFTs as staked
      setNfts(nfts.map(nft => 
        selectedNFTs.includes(nft.id) ? {...nft, staked: true} : nft
      ));
      
      // Reset form
      setSelectedNFTs([]);
      setWattAmount('');
      setMiningDuration('24');
      setShowCreateRig(false);
      setIsCreatingRig(false);
      
      toast.success('Mining rig created successfully!');
    }, 2000);
  };

  const handleStopMining = (rigId: string) => {
    setRigs(rigs.map(rig => 
      rig.id === rigId ? {...rig, status: 'idle'} : rig
    ));
    toast.success('Mining stopped');
  };

  const handleStartMining = (rigId: string) => {
    setRigs(rigs.map(rig => 
      rig.id === rigId ? {...rig, status: 'mining'} : rig
    ));
    toast.success('Mining started');
  };

  const handleDismantle = (rigId: string) => {
    // Get the rig
    const rig = rigs.find(r => r.id === rigId);
    if (!rig) return;
    
    // Update NFTs as unstaked
    setNfts(nfts.map(nft => 
      rig.components.some(c => c.id === nft.id) ? {...nft, staked: false} : nft
    ));
    
    // Remove rig
    setRigs(rigs.filter(r => r.id !== rigId));
    
    toast.success('Rig dismantled and components returned');
  };

  const calculateWattPerHour = (powerConsumption: number) => {
    // Convert power consumption in watts to WATT tokens per hour
    // Using the specified rate: 713633.13824723 WATT/hour
    return powerConsumption * 713633.13824723;
  };

  const formatTimeLeft = (endTime: number) => {
    const now = Date.now();
    if (endTime <= now) return 'Expired';
    
    const secondsLeft = Math.floor((endTime - now) / 1000);
    const hours = Math.floor(secondsLeft / 3600);
    const minutes = Math.floor((secondsLeft % 3600) / 60);
    
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold">Your Mining Hardware NFTs</h3>
        <motion.button
          onClick={() => setShowCreateRig(!showCreateRig)}
          className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="w-4 h-4" />
          <span>{showCreateRig ? 'Cancel' : 'Create Rig'}</span>
        </motion.button>
      </div>

      {/* Create Rig Form */}
      {showCreateRig && (
        <motion.div
          className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <h4 className="text-xl font-semibold mb-4">Configure Mining Rig</h4>
          
          <div className="space-y-6">
            {/* Component Selection */}
            <div>
              <h5 className="font-medium text-yellow-400 mb-3">Select Components</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {nfts.filter(nft => !nft.staked).map((nft) => {
                  const Icon = nft.icon;
                  const isSelected = selectedNFTs.includes(nft.id);
                  
                  return (
                    <motion.div
                      key={nft.id}
                      className={`relative bg-slate-900/50 rounded-lg p-4 border cursor-pointer transition-all duration-300 ${
                        isSelected 
                          ? 'border-yellow-500/50 bg-yellow-500/5' 
                          : 'border-slate-700/50 hover:border-slate-600/50'
                      }`}
                      onClick={() => toggleNFTSelection(nft.id)}
                      whileHover={{ y: -2 }}
                    >
                      {/* Rarity Gradient Border */}
                      <div className={`absolute inset-0 bg-gradient-to-r ${getRarityColor(nft.rarity)} rounded-lg p-[1px] opacity-${isSelected ? '100' : '30'}`}>
                        <div className="bg-slate-900/90 rounded-lg h-full w-full" />
                      </div>

                      <div className="relative z-10 p-2">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Icon className="w-5 h-5 text-blue-400" />
                            <span className="text-xs px-2 py-1 bg-slate-800/50 rounded text-slate-300">
                              {nft.type}
                            </span>
                          </div>
                          {isSelected ? (
                            <div className="w-5 h-5 bg-yellow-500/20 rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 text-yellow-400" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 border border-slate-700/50 rounded-full" />
                          )}
                        </div>

                        {/* NFT Info */}
                        <div className="space-y-2">
                          <h4 className="font-medium">{nft.name}</h4>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">Rarity</span>
                            <span className={`font-medium bg-gradient-to-r ${getRarityColor(nft.rarity)} bg-clip-text text-transparent`}>
                              {nft.rarity}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">Hash Rate</span>
                            <span className="font-medium">{nft.hashRate}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">Power</span>
                            <div className="flex items-center space-x-1">
                              <Zap className="w-3 h-3 text-yellow-400" />
                              <span className="font-medium">{nft.power}W</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              
              {nfts.filter(nft => !nft.staked).length === 0 && (
                <div className="text-center py-8 bg-slate-900/30 rounded-lg border border-slate-700/30">
                  <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                  <p className="text-lg font-semibold">No Available Components</p>
                  <p className="text-slate-400 mt-2">All your NFTs are already staked in rigs</p>
                </div>
              )}
            </div>
            
            {/* Rig Performance */}
            {selectedNFTs.length > 0 && (
              <div>
                <h5 className="font-medium text-yellow-400 mb-3">Rig Performance</h5>
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
                  {(() => {
                    const performance = calculateRigPerformance();
                    
                    if (!performance.valid) {
                      return (
                        <div className="flex items-center space-x-2 text-red-400">
                          <AlertCircle className="w-5 h-5" />
                          <span>{performance.error}</span>
                        </div>
                      );
                    }
                    
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-slate-400 text-sm">Total Hash Rate</p>
                          <p className="text-xl font-bold text-blue-400">{performance.hashRate.toFixed(2)} MH/s</p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-sm">Power Consumption</p>
                          <p className="text-xl font-bold text-yellow-400">{performance.powerConsumption.toFixed(0)}W</p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-sm">Efficiency</p>
                          <p className="text-xl font-bold text-emerald-400">{performance.efficiency.toFixed(2)} MH/W</p>
                        </div>
                        <div className="md:col-span-3">
                          <p className="text-slate-400 text-sm">WATT Consumption</p>
                          <p className="text-lg font-bold text-purple-400">
                            {calculateWattPerHour(performance.powerConsumption).toFixed(8)} WATT/hour
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
            
            {/* WATT Deposit */}
            {selectedNFTs.length > 0 && calculateRigPerformance().valid && (
              <div>
                <h5 className="font-medium text-yellow-400 mb-3">WATT Deposit</h5>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">WATT Amount</label>
                    <input
                      type="number"
                      value={wattAmount}
                      onChange={(e) => setWattAmount(e.target.value)}
                      placeholder="Enter WATT amount"
                      className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-500/50"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Mining Duration (hours)</label>
                    <input
                      type="number"
                      value={miningDuration}
                      onChange={(e) => setMiningDuration(e.target.value)}
                      placeholder="Enter hours"
                      className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-500/50"
                    />
                  </div>
                  
                  <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
                    <p className="text-slate-400 text-sm mb-2">Summary</p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Hourly Cost:</span>
                        <span>
                          {calculateWattPerHour(calculateRigPerformance().powerConsumption).toFixed(8)} WATT
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total Cost:</span>
                        <span>
                          {(calculateWattPerHour(calculateRigPerformance().powerConsumption) * parseInt(miningDuration || '0')).toFixed(8)} WATT
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Mining Duration:</span>
                        <span>{miningDuration || '0'} hours</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Create Button */}
            <motion.button
              onClick={handleCreateRig}
              disabled={!calculateRigPerformance().valid || !wattAmount || isCreatingRig}
              className="w-full py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-semibold transition-colors disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isCreatingRig ? 'Creating Rig...' : 'Create Mining Rig'}
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Active Rigs */}
      {rigs.length > 0 && (
        <div>
          <h4 className="text-xl font-semibold mb-4">Your Active Rigs</h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {rigs.map((rig) => (
              <motion.div
                key={rig.id}
                className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-semibold">{rig.name}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`text-xs px-2 py-1 rounded ${
                        rig.status === 'mining' 
                          ? 'bg-emerald-500/20 text-emerald-400' 
                          : 'bg-slate-500/20 text-slate-400'
                      }`}>
                        {rig.status.toUpperCase()}
                      </span>
                      <span className="text-xs text-slate-400">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {formatTimeLeft(rig.endTime)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {rig.status === 'mining' ? (
                      <motion.button
                        onClick={() => handleStopMining(rig.id)}
                        className="px-3 py-1 bg-red-600/20 hover:bg-red-600/30 rounded text-xs font-medium transition-colors border border-red-500/30"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Stop
                      </motion.button>
                    ) : (
                      <motion.button
                        onClick={() => handleStartMining(rig.id)}
                        className="px-3 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 rounded text-xs font-medium transition-colors border border-emerald-500/30"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Start
                      </motion.button>
                    )}
                    <motion.button
                      onClick={() => handleDismantle(rig.id)}
                      className="px-3 py-1 bg-slate-700/50 hover:bg-slate-600/50 rounded text-xs font-medium transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Dismantle
                    </motion.button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-slate-400 text-xs">Hash Rate</p>
                    <p className="font-bold text-blue-400">{rig.totalHashRate.toFixed(2)} MH/s</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">Power</p>
                    <p className="font-bold text-yellow-400">{rig.powerConsumption}W</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">Efficiency</p>
                    <p className="font-bold text-emerald-400">{rig.efficiency.toFixed(2)} MH/W</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">WATT Balance</p>
                    <p className="font-bold text-purple-400">{rig.wattBalance.toFixed(2)}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium mb-2">Components</p>
                  <div className="grid grid-cols-2 gap-2">
                    {rig.components.map((component) => {
                      const Icon = component.icon;
                      return (
                        <div 
                          key={component.id}
                          className="flex items-center space-x-2 p-2 bg-slate-900/30 rounded-lg"
                        >
                          <Icon className="w-4 h-4 text-blue-400" />
                          <span className="text-xs truncate">{component.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Available NFTs */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Available NFTs</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {nfts.filter(nft => !nft.staked).map((nft, index) => {
            const Icon = nft.icon;
            return (
              <motion.div
                key={nft.id}
                className={`relative bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border transition-all duration-300 ${
                  nft.staked 
                    ? 'border-emerald-500/50 bg-emerald-500/5' 
                    : 'border-slate-700/50 hover:border-slate-600/50'
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -2 }}
              >
                {/* Rarity Gradient Border */}
                <div className={`absolute inset-0 bg-gradient-to-r ${getRarityColor(nft.rarity)} rounded-xl p-[1px]`}>
                  <div className="bg-slate-800/90 rounded-xl h-full w-full" />
                </div>

                <div className="relative z-10 p-4">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Icon className="w-6 h-6 text-blue-400" />
                      <span className="text-xs px-2 py-1 bg-slate-700/50 rounded text-slate-300">
                        {nft.type}
                      </span>
                    </div>
                    {nft.staked ? (
                      <Lock className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Unlock className="w-4 h-4 text-slate-400" />
                    )}
                  </div>

                  {/* NFT Info */}
                  <div className="space-y-3">
                    <h4 className="font-semibold">{nft.name}</h4>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Rarity</span>
                      <span className={`font-medium bg-gradient-to-r ${getRarityColor(nft.rarity)} bg-clip-text text-transparent`}>
                        {nft.rarity}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Hash Rate</span>
                      <span className="font-medium">{nft.hashRate}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Power</span>
                      <div className="flex items-center space-x-1">
                        <Zap className="w-3 h-3 text-yellow-400" />
                        <span className="font-medium">{nft.power}W</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
        
        {nfts.filter(nft => !nft.staked).length === 0 && (
          <div className="text-center py-12 bg-slate-800/30 backdrop-blur-xl rounded-xl border border-slate-700/50">
            <Lock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h4 className="text-lg font-semibold">All NFTs Staked</h4>
            <p className="text-slate-400 mt-2">All your NFTs are currently staked in mining rigs</p>
          </div>
        )}
      </div>

      {/* Staking Stats */}
      <motion.div
        className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h4 className="text-lg font-semibold mb-4">Staking Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-400">
              {rigs.reduce((total, rig) => total + rig.totalHashRate, 0).toFixed(2)} MH/s
            </p>
            <p className="text-slate-400 text-sm">Total Hash Rate</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-400">
              {rigs.reduce((total, rig) => total + rig.powerConsumption, 0)}W
            </p>
            <p className="text-slate-400 text-sm">Power Consumption</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-400">24.5 WATT/day</p>
            <p className="text-slate-400 text-sm">Estimated Rewards</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default NFTStaking;