import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cpu, MemoryStick as Memory, HardDrive, Zap, Clock, AlertCircle, Check, Wallet } from 'lucide-react';
import { useWallet } from '../../hooks/useWallet';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';

// Mining Rig Contract ABI (simplified)
const MINING_RIG_ABI = [
  'function configureRig(uint256[] memory _componentTokenIds) external returns (uint256)',
  'function depositWatt(uint256 _rigId, uint256 _amount) external',
  'function startMining(uint256 _rigId, uint256 _poolId) external',
  'function stopMining(uint256 _rigId) external',
  'function dismantleRig(uint256 _rigId) external',
  'function getRigInfo(uint256 _rigId) external view returns (tuple)',
  'function calculateWattPerHour(uint256 powerConsumption) public pure returns (uint256)'
];

// NFT Contract ABI (simplified)
const NFT_ABI = [
  'function balanceOf(address account, uint256 id) external view returns (uint256)',
  'function setApprovalForAll(address operator, bool approved) external',
  'function isApprovedForAll(address account, address operator) external view returns (bool)'
];

// WATT Token ABI (simplified)
const WATT_ABI = [
  'function balanceOf(address account) external view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)'
];

interface NFT {
  id: number;
  name: string;
  type: 'GPU' | 'CPU' | 'PC Case' | 'Boost Item';
  hashRate: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';
  owned: number;
  selected: boolean;
  icon: React.ComponentType<{ className?: string }>;
  power: number;
}

interface MiningRigConfiguratorProps {
  onRigCreated?: (rigId: number) => void;
}

const MiningRigConfigurator: React.FC<MiningRigConfiguratorProps> = ({ onRigCreated }) => {
  const { isConnected, address, provider, signer, chainId } = useWallet();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [wattAmount, setWattAmount] = useState('');
  const [miningDuration, setMiningDuration] = useState('24'); // hours
  const [isCreatingRig, setIsCreatingRig] = useState(false);
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(false);
  const [wattBalance, setWattBalance] = useState('0');
  const [isApproved, setIsApproved] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [selectedChain, setSelectedChain] = useState<'polygon' | 'altcoinchain'>('altcoinchain');

  // Contract addresses
  const contractAddresses = {
    polygon: {
      nft: '0x970a8b10147e3459d3cbf56329b76ac18d329728',
      watt: '0xE960d5076cd3169C343Ee287A2c3380A222e5839',
      miningRig: '0x1234567890123456789012345678901234567890' // Placeholder - replace with actual deployed contract
    },
    altcoinchain: {
      nft: '0x970a8b10147e3459d3cbf56329b76ac18d329728', // Same address on both chains
      watt: '0x6645143e49B3a15d8F205658903a55E520444698',
      miningRig: '0x1234567890123456789012345678901234567890' // Placeholder - replace with actual deployed contract
    }
  };

  useEffect(() => {
    if (isConnected && provider) {
      loadNFTs();
      checkApprovals();
      loadWattBalance();
    }
  }, [isConnected, provider, address, selectedChain]);

  const loadNFTs = async () => {
    setIsLoadingNFTs(true);
    
    try {
      // In a real implementation, this would fetch from the blockchain
      // For now, we'll use mock data
      const mockNFTs: NFT[] = [
        {
          id: 1,
          name: 'Free Mint PC Case',
          type: 'PC Case',
          hashRate: '0 MH/s',
          rarity: 'Common',
          owned: 1,
          selected: false,
          icon: Monitor,
          power: 0
        },
        {
          id: 2,
          name: 'Genesis Badge',
          type: 'Boost Item',
          hashRate: '+50% Overclock',
          rarity: 'Mythic',
          owned: 1,
          selected: false,
          icon: Zap,
          power: 0
        },
        {
          id: 3,
          name: 'XL1 Processor',
          type: 'CPU',
          hashRate: '+25%',
          rarity: 'Rare',
          owned: 1,
          selected: false,
          icon: Cpu,
          power: 125
        },
        {
          id: 4,
          name: 'TX120 GPU',
          type: 'GPU',
          hashRate: '+150%',
          rarity: 'Epic',
          owned: 2,
          selected: false,
          icon: HardDrive,
          power: 320
        },
        {
          id: 5,
          name: 'GP50 GPU',
          type: 'GPU',
          hashRate: '+200%',
          rarity: 'Legendary',
          owned: 1,
          selected: false,
          icon: HardDrive,
          power: 450
        }
      ];
      
      setNfts(mockNFTs);
    } catch (error) {
      console.error('Failed to load NFTs:', error);
      toast.error('Failed to load NFTs');
    } finally {
      setIsLoadingNFTs(false);
    }
  };

  const checkApprovals = async () => {
    if (!provider || !address) return;
    
    try {
      const addresses = contractAddresses[selectedChain];
      
      // Skip approval checks for placeholder addresses
      if (addresses.miningRig === '0x1234567890123456789012345678901234567890') {
        console.log('Using placeholder contract addresses - skipping approval checks');
        setIsApproved(false);
        return;
      }
      
      // Check NFT approval
      const nftContract = new ethers.Contract(addresses.nft, NFT_ABI, provider);
      const isNftApproved = await nftContract.isApprovedForAll(address, addresses.miningRig);
      
      // Check WATT approval
      const wattContract = new ethers.Contract(addresses.watt, WATT_ABI, provider);
      const wattAllowance = await wattContract.allowance(address, addresses.miningRig);
      const isWattApproved = wattAllowance > ethers.parseEther('1000000'); // 1M WATT
      
      setIsApproved(isNftApproved && isWattApproved);
    } catch (error) {
      console.error('Failed to check approvals:', error);
    }
  };

  const loadWattBalance = async () => {
    if (!provider || !address) return;
    
    try {
      const wattContract = new ethers.Contract(
        contractAddresses[selectedChain].watt, 
        WATT_ABI, 
        provider
      );
      
      const balance = await wattContract.balanceOf(address);
      setWattBalance(ethers.formatEther(balance));
    } catch (error) {
      console.error('Failed to load WATT balance:', error);
    }
  };

  const approveContracts = async () => {
    if (!signer) {
      toast.error('Please connect your wallet');
      return;
    }
    
    const addresses = contractAddresses[selectedChain];
    
    // Check if using placeholder addresses
    if (addresses.miningRig === '0x1234567890123456789012345678901234567890') {
      toast.error('Mining Rig contract not deployed yet. Please wait for deployment.');
      return;
    }
    
    setIsApproving(true);
    
    try {
      // Approve NFT contract
      const nftContract = new ethers.Contract(addresses.nft, NFT_ABI, signer);
      const nftTx = await nftContract.setApprovalForAll(addresses.miningRig, true);
      await nftTx.wait();
      
      // Approve WATT contract
      const wattContract = new ethers.Contract(addresses.watt, WATT_ABI, signer);
      const wattTx = await wattContract.approve(
        addresses.miningRig, 
        ethers.parseEther('1000000000') // 1B WATT
      );
      await wattTx.wait();
      
      setIsApproved(true);
      toast.success('Contracts approved successfully');
    } catch (error) {
      console.error('Failed to approve contracts:', error);
      toast.error('Failed to approve contracts');
    } finally {
      setIsApproving(false);
    }
  };

  const toggleNFTSelection = (nftId: number) => {
    setNfts(nfts.map(nft => {
      if (nft.id === nftId) {
        // If already selected, deselect
        if (nft.selected) {
          return { ...nft, selected: false };
        }
        
        // Check if we're trying to select more than one PC Case
        if (nft.type === 'PC Case' && nfts.some(n => n.type === 'PC Case' && n.selected)) {
          toast.error('Only one PC Case allowed');
          return nft;
        }
        
        // Check if we're trying to select more than one Processor
        if (nft.type === 'CPU' && nfts.some(n => n.type === 'CPU' && n.selected)) {
          toast.error('Only one Processor allowed');
          return nft;
        }
        
        // Check if we're trying to select more than two GPUs
        if (nft.type === 'GPU' && nfts.filter(n => n.type === 'GPU' && n.selected).length >= 2) {
          toast.error('Maximum 2 GPUs allowed');
          return nft;
        }
        
        // Check if we're trying to select more than one Boost Item
        if (nft.type === 'Boost Item' && nfts.some(n => n.type === 'Boost Item' && n.selected)) {
          toast.error('Only one Boost Item allowed');
          return nft;
        }
        
        return { ...nft, selected: true };
      }
      return nft;
    }));
  };

  const calculateRigPerformance = () => {
    // Get selected NFTs
    const selectedComponents = nfts.filter(nft => nft.selected);
    
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

  const calculateWattPerHour = (powerConsumption: number) => {
    // Convert power consumption in watts to WATT tokens per hour
    // Using the specified rate: 713633.13824723 WATT/hour
    return powerConsumption * 713633.13824723;
  };

  const handleCreateRig = async () => {
    if (!signer) {
      toast.error('Please connect your wallet');
      return;
    }
    
    const addresses = contractAddresses[selectedChain];
    
    // Check if using placeholder addresses
    if (addresses.miningRig === '0x1234567890123456789012345678901234567890') {
      toast.error('Mining Rig contract not deployed yet. This is a demo - rig creation simulated.');
      
      // Simulate rig creation for demo purposes
      setTimeout(() => {
        toast.success('Demo: Mining rig created successfully!');
        // Reset form
        setNfts(nfts.map(nft => ({ ...nft, selected: false })));
        setWattAmount('');
        setMiningDuration('24');
        
        if (onRigCreated) {
          onRigCreated(Math.floor(Math.random() * 1000));
        }
      }, 2000);
      
      return;
    }
    
    setIsCreatingRig(true);
    
    try {
      // Validate rig configuration
      const performance = calculateRigPerformance();
      if (!performance.valid) {
        toast.error(performance.error || 'Invalid rig configuration');
        return;
      }
      
      // Validate WATT amount
      if (!wattAmount || parseFloat(wattAmount) <= 0) {
        toast.error('Please enter a valid WATT amount');
        return;
      }
      
      // Validate mining duration
      if (!miningDuration || parseInt(miningDuration) <= 0) {
        toast.error('Please enter a valid mining duration');
        return;
      }
      
      // Get selected component IDs
      const componentIds = nfts
        .filter(nft => nft.selected)
        .map(nft => nft.id);
      
      // Create mining rig
      const miningRigContract = new ethers.Contract(
        addresses.miningRig,
        MINING_RIG_ABI,
        signer
      );
      
      // Configure rig
      const tx1 = await miningRigContract.configureRig(componentIds);
      const receipt1 = await tx1.wait();
      
      // Extract rig ID from event logs
      const rigCreatedEvent = receipt1.logs.find(
        (log: any) => log.topics[0] === ethers.id('RigConfigured(uint256,address,uint256[])')
      );
      
      if (!rigCreatedEvent) {
        throw new Error('Failed to create rig: Event not found');
      }
      
      const rigId = parseInt(rigCreatedEvent.topics[1], 16);
      
      // Deposit WATT
      const tx2 = await miningRigContract.depositWatt(
        rigId,
        ethers.parseEther(wattAmount)
      );
      await tx2.wait();
      
      // Start mining
      const tx3 = await miningRigContract.startMining(rigId, 0); // Pool ID 0 for now
      await tx3.wait();
      
      toast.success('Mining rig created and started successfully!');
      
      // Reset form
      setNfts(nfts.map(nft => ({ ...nft, selected: false })));
      setWattAmount('');
      setMiningDuration('24');
      
      // Callback
      if (onRigCreated) {
        onRigCreated(rigId);
      }
    } catch (error) {
      console.error('Failed to create mining rig:', error);
      toast.error('Failed to create mining rig');
    } finally {
      setIsCreatingRig(false);
    }
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

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Configure Mining Rig</h3>
      
      {/* Chain Selection */}
      <div className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
        <h4 className="font-medium text-yellow-400 mb-3">Select Chain</h4>
        <div className="flex space-x-4">
          <button
            onClick={() => setSelectedChain('polygon')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              selectedChain === 'polygon'
                ? 'bg-purple-600/20 border border-purple-500/30 text-purple-400'
                : 'bg-slate-700/50 hover:bg-slate-600/50'
            }`}
          >
            <img src="/MATIC logo.png" alt="Polygon" className="w-5 h-5" />
            <span>Polygon</span>
          </button>
          <button
            onClick={() => setSelectedChain('altcoinchain')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              selectedChain === 'altcoinchain'
                ? 'bg-yellow-600/20 border border-yellow-500/30 text-yellow-400'
                : 'bg-slate-700/50 hover:bg-slate-600/50'
            }`}
          >
            <img src="/Altcoinchain logo.png" alt="Altcoinchain" className="w-5 h-5 rounded-full" />
            <span>Altcoinchain</span>
          </button>
        </div>
      </div>
      
      {/* Contract Status Notice */}
      <div className="bg-blue-600/20 border border-blue-500/30 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-6 h-6 text-blue-400 mt-1" />
          <div>
            <h4 className="font-semibold text-blue-400">Demo Mode</h4>
            <p className="text-slate-300 mt-1">
              Mining Rig contracts are not yet deployed. This interface demonstrates the functionality 
              and will be fully functional once contracts are deployed to the selected networks.
            </p>
          </div>
        </div>
      </div>
      
      {/* Approval Section */}
      {!isApproved && contractAddresses[selectedChain].miningRig !== '0x1234567890123456789012345678901234567890' && (
        <div className="bg-yellow-600/20 border border-yellow-500/30 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-yellow-400 mt-1" />
            <div>
              <h4 className="font-semibold text-yellow-400">Approval Required</h4>
              <p className="text-slate-300 mt-1 mb-4">
                You need to approve the Mining Rig contract to use your NFTs and WATT tokens.
              </p>
              <motion.button
                onClick={approveContracts}
                disabled={isApproving}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors disabled:opacity-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isApproving ? 'Approving...' : 'Approve Contracts'}
              </motion.button>
            </div>
          </div>
        </div>
      )}
      
      {/* Component Selection */}
      <div className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
        <h4 className="font-medium text-yellow-400 mb-3">Select Components</h4>
        
        {isLoadingNFTs ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {nfts.map((nft) => {
              const Icon = nft.icon;
              
              return (
                <motion.div
                  key={nft.id}
                  className={`relative bg-slate-900/50 rounded-lg p-4 border cursor-pointer transition-all duration-300 ${
                    nft.selected 
                      ? 'border-yellow-500/50 bg-yellow-500/5' 
                      : 'border-slate-700/50 hover:border-slate-600/50'
                  }`}
                  onClick={() => toggleNFTSelection(nft.id)}
                  whileHover={{ y: -2 }}
                >
                  {/* Rarity Gradient Border */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${getRarityColor(nft.rarity)} rounded-lg p-[1px] opacity-${nft.selected ? '100' : '30'}`}>
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
                      <div className="flex items-center space-x-2">
                        {nft.selected ? (
                          <div className="w-5 h-5 bg-yellow-500/20 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-yellow-400" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 border border-slate-700/50 rounded-full" />
                        )}
                        <span className="text-xs bg-slate-800/50 px-2 py-1 rounded">
                          x{nft.owned}
                        </span>
                      </div>
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
        )}
      </div>
      
      {/* Rig Performance */}
      {nfts.some(nft => nft.selected) && (
        <div className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
          <h4 className="font-medium text-yellow-400 mb-3">Rig Performance</h4>
          
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
      )}
      
      {/* WATT Deposit */}
      {nfts.some(nft => nft.selected) && calculateRigPerformance().valid && (
        <div className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
          <h4 className="font-medium text-yellow-400 mb-3">WATT Deposit</h4>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">WATT Balance:</span>
              <span className="font-medium">{parseFloat(wattBalance).toFixed(2)} WATT</span>
            </div>
            
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
        disabled={
          !isConnected || 
          !calculateRigPerformance().valid || 
          !wattAmount || 
          isCreatingRig
        }
        className="w-full py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-semibold transition-colors disabled:opacity-50"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {!isConnected ? (
          <span className="flex items-center justify-center space-x-2">
            <Wallet className="w-5 h-5" />
            <span>Connect Wallet</span>
          </span>
        ) : isCreatingRig ? (
          'Creating Rig...'
        ) : (
          'Create Mining Rig'
        )}
      </motion.button>
      
      {/* Built with Bolt.new badge */}
      <div className="flex justify-center mt-8">
        <a 
          href="https://bolt.new" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center space-x-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-colors border border-slate-700/50"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13 2L4.09 12.11C3.69 12.59 3.48 12.83 3.43 13.11C3.38 13.35 3.44 13.6 3.6 13.8C3.78 14.03 4.14 14.12 4.84 14.31L10.07 15.93C10.35 16.02 10.49 16.06 10.59 16.15C10.68 16.23 10.73 16.34 10.73 16.46C10.74 16.6 10.65 16.76 10.46 17.08L7.75 21.5" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14.7 14.5L16.7 14.5C17.2523 14.5 17.5284 14.5 17.7611 14.3891C17.9623 14.2929 18.1297 14.1255 18.2259 13.9243C18.3368 13.6916 18.3368 13.4155 18.3368 12.8632L18.3368 6.13678C18.3368 5.58451 18.3368 5.30837 18.2259 5.07568C18.1297 4.87446 17.9623 4.70708 17.7611 4.61083C17.5284 4.5 17.2523 4.5 16.7 4.5L14.7 4.5" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-yellow-400 font-medium">Built with Bolt.new</span>
        </a>
      </div>
    </div>
  );
};

export default MiningRigConfigurator;