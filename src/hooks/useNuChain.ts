import { useState, useEffect } from 'react';
import { contractService } from '../services/contractService';
import { nuChainService } from '../services/nuChainService';
import { useWallet } from './useWallet';
import toast from 'react-hot-toast';

interface ValidatorData {
  address: string;
  stakedAmount: string;
  commission: number;
  uptime: number;
  isActive: boolean;
  isJailed: boolean;
  totalBlocks: number;
  delegatedAmount: string;
}

interface MiningPoolData {
  poolId: number;
  name: string;
  host: string;
  wattLocked: string;
  totalMiners: number;
  totalHashRate: number;
  feePercentage: number;
  isActive: boolean;
  uptime: number;
}

interface MiningRigData {
  rigId: number;
  owner: string;
  componentTokenIds: number[];
  totalHashRate: number;
  totalPowerConsumption: number;
  efficiency: number;
  hasGenesisBadge: boolean;
  isActive: boolean;
  poolId: number;
  totalEarnings: string;
}

export const useNuChain = () => {
  const { provider, signer, isConnected, address } = useWallet();
  const [validators, setValidators] = useState<ValidatorData[]>([]);
  const [miningPools, setMiningPools] = useState<MiningPoolData[]>([]);
  const [myRigs, setMyRigs] = useState<MiningRigData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize contract service when wallet connects
  useEffect(() => {
    if (provider && isConnected) {
      contractService.initialize(provider, signer || undefined);
    }
  }, [provider, signer, isConnected]);

  // Validator Operations
  const registerValidator = async (stake: string, commission: number): Promise<boolean> => {
    if (!isConnected || !signer) {
      toast.error('Please connect your wallet');
      return false;
    }

    setLoading(true);
    try {
      const success = await contractService.registerValidator(stake, commission);
      if (success) {
        toast.success('Validator registered successfully!');
        await refreshValidators();
      }
      return success;
    } catch (error) {
      console.error('Failed to register validator:', error);
      toast.error('Failed to register validator');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const delegateToValidator = async (validatorAddress: string, amount: string): Promise<boolean> => {
    if (!isConnected || !signer) {
      toast.error('Please connect your wallet');
      return false;
    }

    setLoading(true);
    try {
      const success = await contractService.delegateToValidator(validatorAddress, amount);
      if (success) {
        toast.success('Delegation successful!');
        await refreshValidators();
      }
      return success;
    } catch (error) {
      console.error('Failed to delegate:', error);
      toast.error('Failed to delegate tokens');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const refreshValidators = async () => {
    try {
      // In a real implementation, this would fetch from the contract
      // For now, using mock data
      const mockValidators: ValidatorData[] = [
        {
          address: '0x1234567890abcdef1234567890abcdef12345678',
          stakedAmount: '125000',
          commission: 5,
          uptime: 99.8,
          isActive: true,
          isJailed: false,
          totalBlocks: 12847,
          delegatedAmount: '50000'
        },
        {
          address: '0x2345678901bcdef1234567890abcdef123456789',
          stakedAmount: '98500',
          commission: 3,
          uptime: 99.9,
          isActive: true,
          isJailed: false,
          totalBlocks: 11234,
          delegatedAmount: '75000'
        }
      ];
      setValidators(mockValidators);
    } catch (error) {
      console.error('Failed to refresh validators:', error);
      setError('Failed to load validators');
    }
  };

  // Mining Pool Operations
  const createMiningPool = async (name: string): Promise<boolean> => {
    if (!isConnected || !signer) {
      toast.error('Please connect your wallet');
      return false;
    }

    setLoading(true);
    try {
      const success = await contractService.createMiningPool(name);
      if (success) {
        toast.success('Mining pool created successfully!');
        await refreshMiningPools();
      }
      return success;
    } catch (error) {
      console.error('Failed to create mining pool:', error);
      toast.error('Failed to create mining pool');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const joinMiningPool = async (poolId: number, rigId: number, hashRate: number): Promise<boolean> => {
    if (!isConnected || !signer) {
      toast.error('Please connect your wallet');
      return false;
    }

    setLoading(true);
    try {
      const success = await contractService.joinMiningPool(poolId, rigId, hashRate);
      if (success) {
        toast.success('Joined mining pool successfully!');
        await refreshMiningPools();
        await refreshMyRigs();
      }
      return success;
    } catch (error) {
      console.error('Failed to join mining pool:', error);
      toast.error('Failed to join mining pool');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const refreshMiningPools = async () => {
    try {
      // Mock data for now
      const mockPools: MiningPoolData[] = [
        {
          poolId: 1,
          name: 'Alpha Mining Pool',
          host: '0x1234567890abcdef1234567890abcdef12345678',
          wattLocked: '100000',
          totalMiners: 156,
          totalHashRate: 2400,
          feePercentage: 2,
          isActive: true,
          uptime: 99.8
        },
        {
          poolId: 2,
          name: 'Beta Mining Pool',
          host: '0x2345678901bcdef1234567890abcdef123456789',
          wattLocked: '150000',
          totalMiners: 203,
          totalHashRate: 3100,
          feePercentage: 1.5,
          isActive: true,
          uptime: 99.9
        }
      ];
      setMiningPools(mockPools);
    } catch (error) {
      console.error('Failed to refresh mining pools:', error);
      setError('Failed to load mining pools');
    }
  };

  // NFT Mining Rig Operations
  const configureRig = async (componentTokenIds: number[]): Promise<number | null> => {
    if (!isConnected || !signer) {
      toast.error('Please connect your wallet');
      return null;
    }

    setLoading(true);
    try {
      const rigId = await contractService.configureRig(componentTokenIds);
      if (rigId !== null) {
        toast.success('Mining rig configured successfully!');
        await refreshMyRigs();
      }
      return rigId;
    } catch (error) {
      console.error('Failed to configure rig:', error);
      toast.error('Failed to configure mining rig');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const startMining = async (rigId: number, poolId: number): Promise<boolean> => {
    if (!isConnected || !signer) {
      toast.error('Please connect your wallet');
      return false;
    }

    setLoading(true);
    try {
      const success = await contractService.startMining(rigId, poolId);
      if (success) {
        toast.success('Mining started successfully!');
        await refreshMyRigs();
      }
      return success;
    } catch (error) {
      console.error('Failed to start mining:', error);
      toast.error('Failed to start mining');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const stopMining = async (rigId: number): Promise<boolean> => {
    if (!isConnected || !signer) {
      toast.error('Please connect your wallet');
      return false;
    }

    setLoading(true);
    try {
      const success = await contractService.stopMining(rigId);
      if (success) {
        toast.success('Mining stopped successfully!');
        await refreshMyRigs();
      }
      return success;
    } catch (error) {
      console.error('Failed to stop mining:', error);
      toast.error('Failed to stop mining');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // WATT Deposit Operations
  const depositWatt = async (rigId: number, amount: string): Promise<boolean> => {
    if (!isConnected || !signer) {
      toast.error('Please connect your wallet');
      return false;
    }

    setLoading(true);
    try {
      const success = await contractService.depositWatt(rigId, amount);
      if (success) {
        toast.success('WATT deposited successfully!');
        await refreshMyRigs();
      }
      return success;
    } catch (error) {
      console.error('Failed to deposit WATT:', error);
      toast.error('Failed to deposit WATT');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Claim Mining Rewards
  const claimMiningRewards = async (rigId: number): Promise<boolean> => {
    if (!isConnected || !signer) {
      toast.error('Please connect your wallet');
      return false;
    }

    setLoading(true);
    try {
      const success = await contractService.claimMiningRewards(rigId);
      if (success) {
        toast.success('Mining rewards claimed successfully!');
        await refreshMyRigs();
      }
      return success;
    } catch (error) {
      console.error('Failed to claim mining rewards:', error);
      toast.error('Failed to claim mining rewards');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Register Pool Operator
  const registerPoolOperator = async (): Promise<boolean> => {
    if (!isConnected || !signer) {
      toast.error('Please connect your wallet');
      return false;
    }

    setLoading(true);
    try {
      const success = await contractService.registerPoolOperator();
      if (success) {
        toast.success('Pool operator registered successfully!');
      }
      return success;
    } catch (error) {
      console.error('Failed to register pool operator:', error);
      toast.error('Failed to register pool operator');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Estimate WATT Usage
  const estimateWattUsage = async (componentTokenIds: number[]): Promise<string> => {
    try {
      return await contractService.estimateWattUsage(componentTokenIds);
    } catch (error) {
      console.error('Failed to estimate WATT usage:', error);
      return '0';
    }
  };

  const refreshMyRigs = async () => {
    if (!address) return;

    try {
      // Mock data for now
      const mockRigs: MiningRigData[] = [
        {
          rigId: 1,
          owner: address,
          componentTokenIds: [1, 3, 4], // PC Case, XL1 Processor, TX120 GPU
          totalHashRate: 187,
          totalPowerConsumption: 612,
          wattPerBlock: '0.000000436',
          isActive: true,
          poolId: 1,
          accumulatedNU: '2.47',
          lastClaimBlock: 12847,
          wattBalance: '1000.0',
          isPoolOperator: false
        },
        {
          rigId: 2,
          owner: address,
          componentTokenIds: [1, 3, 5], // PC Case, XL1 Processor, GP50 GPU
          totalHashRate: 225,
          totalPowerConsumption: 575,
          wattPerBlock: '0.000000410',
          isActive: false,
          poolId: 0,
          accumulatedNU: '1.83',
          lastClaimBlock: 11234,
          wattBalance: '500.0',
          isPoolOperator: false
        }
      ];
      setMyRigs(mockRigs);
    } catch (error) {
      console.error('Failed to refresh rigs:', error);
      setError('Failed to load mining rigs');
    }
  };

  // Network Operations
  const addNuChainToWallet = async (): Promise<boolean> => {
    try {
      const success = await nuChainService.addNuChainToWallet();
      if (success) {
        toast.success('nuChain network added to wallet!');
      }
      return success;
    } catch (error) {
      console.error('Failed to add nuChain to wallet:', error);
      toast.error('Failed to add nuChain network');
      return false;
    }
  };

  // zkRollup Operations
  const submitZkProof = async (
    stateRoot: string,
    transactionRoot: string,
    blockNumber: number,
    proof: string
  ): Promise<boolean> => {
    if (!isConnected || !signer) {
      toast.error('Please connect your wallet');
      return false;
    }

    setLoading(true);
    try {
      const success = await contractService.submitZkProof(stateRoot, transactionRoot, blockNumber, proof);
      if (success) {
        toast.success('zkProof submitted successfully!');
      }
      return success;
    } catch (error) {
      console.error('Failed to submit zkProof:', error);
      toast.error('Failed to submit zkProof');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    if (isConnected && contractService.isInitialized()) {
      refreshValidators();
      refreshMiningPools();
      refreshMyRigs();
    }
  }, [isConnected, address]);

  return {
    // State
    validators,
    miningPools,
    myRigs,
    loading,
    error,

    // Validator operations
    registerValidator,
    delegateToValidator,
    refreshValidators,

    // Mining pool operations
    createMiningPool,
    joinMiningPool,
    refreshMiningPools,

    // NFT mining rig operations
    configureRig,
    startMining,
    stopMining,
    refreshMyRigs,
    
    // WATT operations
    depositWatt,
    claimMiningRewards,
    registerPoolOperator,
    estimateWattUsage,

    // Network operations
    addNuChainToWallet,

    // Utility
    isConnected: isConnected && contractService.isInitialized()
  };
};