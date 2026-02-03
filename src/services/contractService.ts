import { ethers } from 'ethers';
import { nuChainService } from './nuChainService';

interface ContractConfig {
  address: string;
  abi: any[];
}

class ContractService {
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;
  private contracts: Map<string, ethers.Contract> = new Map();

  // Contract addresses (will be updated after deployment)
  private contractAddresses = {
    miningRigConfigurator: '0x0000000000000000000000000000000000000000',
    miningPoolHost: '0x0000000000000000000000000000000000000000',
    crossChainValidator: '0x0000000000000000000000000000000000000000',
    nuChainL2: '0x0000000000000000000000000000000000000000',
    nuToken: '0x0000000000000000000000000000000000000000',
    wattToken: '0x6645143e49B3a15d8F205658903a55E520444698', // Existing WATT on Altcoinchain
    polygonNFTs: '0x970a8b10147e3459d3cbf56329b76ac18d329728' // Existing NFTs on Polygon
  };

  async initialize(provider: ethers.Provider, signer?: ethers.Signer) {
    this.provider = provider;
    this.signer = signer || null;
    
    // Initialize contracts
    await this.initializeContracts();
  }

  private async initializeContracts() {
    if (!this.provider) return;

    try {
      // Mining Rig Configurator Contract
      if (this.contractAddresses.miningRigConfigurator !== '0x0000000000000000000000000000000000000000') {
        const rigContract = new ethers.Contract(
          this.contractAddresses.miningRigConfigurator,
          this.getMiningRigABI(),
          this.signer || this.provider
        );
        this.contracts.set('miningRigConfigurator', rigContract);
      }

      // Mining Pool Host Contract
      if (this.contractAddresses.miningPoolHost !== '0x0000000000000000000000000000000000000000') {
        const poolContract = new ethers.Contract(
          this.contractAddresses.miningPoolHost,
          this.getMiningPoolHostABI(),
          this.signer || this.provider
        );
        this.contracts.set('miningPoolHost', poolContract);
      }

      // Cross-Chain Validator
      if (this.contractAddresses.crossChainValidator !== '0x0000000000000000000000000000000000000000') {
        const validatorContract = new ethers.Contract(
          this.contractAddresses.crossChainValidator,
          this.getCrossChainValidatorABI(),
          this.signer || this.provider
        );
        this.contracts.set('crossChainValidator', validatorContract);
      }

      // nuChain L2
      if (this.contractAddresses.nuChainL2 !== '0x0000000000000000000000000000000000000000') {
        const nuChainContract = new ethers.Contract(
          this.contractAddresses.nuChainL2,
          this.getNuChainL2ABI(),
          this.signer || this.provider
        );
        this.contracts.set('nuChainL2', nuChainContract);
      }

      console.log('✅ Contracts initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize contracts:', error);
    }
  }

  // Validator Operations
  async registerValidator(stake: string, commission: number): Promise<boolean> {
    try {
      const contract = this.contracts.get('validator');
      if (!contract || !this.signer) return false;

      const stakeWei = ethers.parseEther(stake);
      const tx = await contract.registerValidator(stakeWei, commission * 100); // Convert to basis points
      await tx.wait();

      console.log('✅ Validator registered successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to register validator:', error);
      return false;
    }
  }

  async delegateToValidator(validatorAddress: string, amount: string): Promise<boolean> {
    try {
      const contract = this.contracts.get('validator');
      if (!contract || !this.signer) return false;

      const amountWei = ethers.parseEther(amount);
      const tx = await contract.delegate(validatorAddress, amountWei);
      await tx.wait();

      console.log('✅ Delegation successful');
      return true;
    } catch (error) {
      console.error('❌ Failed to delegate:', error);
      return false;
    }
  }

  async getValidatorInfo(address: string): Promise<any> {
    try {
      const contract = this.contracts.get('validator');
      if (!contract) return null;

      const info = await contract.getValidatorInfo(address);
      return {
        validatorAddress: info.validatorAddress,
        stakedAmount: ethers.formatEther(info.stakedAmount),
        commission: info.commission / 100, // Convert from basis points
        uptime: info.uptime / 100,
        lastBlockTime: new Date(Number(info.lastBlockTime) * 1000),
        totalBlocks: Number(info.totalBlocks),
        delegatedAmount: ethers.formatEther(info.delegatedAmount),
        isActive: info.isActive,
        isJailed: info.isJailed
      };
    } catch (error) {
      console.error('❌ Failed to get validator info:', error);
      return null;
    }
  }

  // Mining Pool Operations
  async createMiningPool(name: string): Promise<boolean> {
    try {
      const contract = this.contracts.get('miningPoolHost');
      if (!contract || !this.signer) return false;

      const tx = await contract.createPool(name);
      await tx.wait();

      console.log('✅ Mining pool created successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to create mining pool:', error);
      return false;
    }
  }

  async joinMiningPool(poolId: number, rigId: number, hashRate: number): Promise<boolean> {
    try {
      const contract = this.contracts.get('miningPoolHost');
      if (!contract || !this.signer) return false;

      const tx = await contract.joinPool(poolId, rigId, hashRate);
      await tx.wait();

      console.log('✅ Joined mining pool successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to join mining pool:', error);
      return false;
    }
  }

  async sendPoolHeartbeat(poolId: number): Promise<boolean> {
    try {
      const contract = this.contracts.get('miningPoolFactory');
      if (!contract || !this.signer) return false;

      const tx = await contract.sendHeartbeat(poolId);
      await tx.wait();

      console.log('✅ Pool heartbeat sent');
      return true;
    } catch (error) {
      console.error('❌ Failed to send heartbeat:', error);
      return false;
    }
  }

  async getPoolInfo(poolId: number): Promise<any> {
    try {
      const contract = this.contracts.get('miningPoolHost');
      if (!contract) return null;

      const info = await contract.getPoolInfo(poolId);
      return {
        poolId: Number(info.poolId),
        host: info.host,
        name: info.name,
        wattLocked: ethers.formatEther(info.wattLocked),
        createdAt: new Date(Number(info.createdAt) * 1000),
        lastClaimBlock: Number(info.lastClaimBlock),
        activeRigs: Number(info.activeRigs),
        totalHashRate: Number(info.totalHashRate),
        accumulatedRewards: ethers.formatEther(info.accumulatedRewards),
        isActive: info.isActive
      };
    } catch (error) {
      console.error('❌ Failed to get pool info:', error);
      return null;
    }
  }

  // NFT Mining Rig Operations
  async configureRig(componentTokenIds: number[]): Promise<number | null> {
    try {
      const contract = this.contracts.get('miningRigConfigurator');
      if (!contract || !this.signer) return null;

      const tx = await contract.configureRig(componentTokenIds);
      const receipt = await tx.wait();

      // Extract rig ID from event logs
      const event = receipt.logs.find((log: any) => 
        log.topics[0] === ethers.id('RigConfigured(uint256,address,uint256[])')
      );
      
      if (event) {
        const rigId = Number(event.topics[1]);
        console.log('✅ Rig configured successfully, ID:', rigId);
        return rigId;
      }

      return null;
    } catch (error) {
      console.error('❌ Failed to configure rig:', error);
      return null;
    }
  }

  async startMining(rigId: number, poolId: number): Promise<boolean> {
    try {
      const contract = this.contracts.get('miningRigConfigurator');
      if (!contract || !this.signer) return false;

      const tx = await contract.startMining(rigId, poolId);
      await tx.wait();

      console.log('✅ Mining started successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to start mining:', error);
      return false;
    }
  }

  async stopMining(rigId: number): Promise<boolean> {
    try {
      const contract = this.contracts.get('miningRigConfigurator');
      if (!contract || !this.signer) return false;

      const tx = await contract.stopMining(rigId);
      await tx.wait();

      console.log('✅ Mining stopped successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to stop mining:', error);
      return false;
    }
  }

  async getRigInfo(rigId: number): Promise<any> {
    try {
      const contract = this.contracts.get('miningRigConfigurator');
      if (!contract) return null;

      const info = await contract.getRigInfo(rigId);
      return {
        rigId: Number(info.rigId),
        owner: info.owner,
        componentTokenIds: info.componentTokenIds.map((id: any) => Number(id)),
        totalHashRate: Number(info.totalHashRate),
        totalPowerConsumption: Number(info.totalPowerConsumption),
        wattPerBlock: ethers.formatUnits(info.wattPerBlock, 18),
        isActive: info.isActive,
        poolId: Number(info.poolId),
        accumulatedNU: ethers.formatEther(info.accumulatedNU),
        lastClaimBlock: Number(info.lastClaimBlock),
        wattBalance: ethers.formatEther(info.wattBalance),
        isPoolOperator: info.isPoolOperator
      };
    } catch (error) {
      console.error('❌ Failed to get rig info:', error);
      return null;
    }
  }

  // WATT Deposit Operations
  async depositWatt(rigId: number, amount: string): Promise<boolean> {
    try {
      const contract = this.contracts.get('miningRigConfigurator');
      if (!contract || !this.signer) return false;

      const amountWei = ethers.parseEther(amount);
      const tx = await contract.depositWatt(rigId, amountWei);
      await tx.wait();

      console.log('✅ WATT deposited successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to deposit WATT:', error);
      return false;
    }
  }

  // Claim Rewards Operations
  async claimMiningRewards(rigId: number): Promise<boolean> {
    try {
      const contract = this.contracts.get('miningRigConfigurator');
      if (!contract || !this.signer) return false;

      const tx = await contract.claimRewards(rigId);
      await tx.wait();

      console.log('✅ Mining rewards claimed successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to claim mining rewards:', error);
      return false;
    }
  }

  // Pool Operator Operations
  async registerPoolOperator(): Promise<boolean> {
    try {
      const contract = this.contracts.get('miningRigConfigurator');
      if (!contract || !this.signer) return false;

      const tx = await contract.registerPoolOperator();
      await tx.wait();

      console.log('✅ Pool operator registered successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to register pool operator:', error);
      return false;
    }
  }

  // Estimate WATT usage
  async estimateWattUsage(componentTokenIds: number[]): Promise<string> {
    try {
      const contract = this.contracts.get('miningRigConfigurator');
      if (!contract) return '0';

      const wattPerDay = await contract.estimateWattUsagePerDay(componentTokenIds);
      return ethers.formatEther(wattPerDay);
    } catch (error) {
      console.error('❌ Failed to estimate WATT usage:', error);
      return '0';
    }
  }

  // Contract ABIs
  private getMiningRigABI() {
    return [
      'function configureRig(uint256[] memory _componentTokenIds) external returns (uint256)',
      'function startMining(uint256 _rigId, uint256 _poolId) external',
      'function stopMining(uint256 _rigId) external',
      'function depositWatt(uint256 _rigId, uint256 _amount) external',
      'function claimRewards(uint256 _rigId) external',
      'function registerPoolOperator() external',
      'function getRigInfo(uint256 _rigId) external view returns (tuple)',
      'function getUserRigs(address _user) external view returns (uint256[])',
      'function estimateWattUsagePerDay(uint256[] memory _componentTokenIds) external view returns (uint256)',
      'event RigConfigured(uint256 indexed rigId, address indexed owner, uint256[] components, uint256 hashRate, uint256 wattPerBlock)',
      'event RigStartedMining(uint256 indexed rigId, uint256 poolId)',
      'event RigStoppedMining(uint256 indexed rigId)',
      'event WattConsumed(uint256 indexed rigId, uint256 amount, uint256 blockNumber)',
      'event RewardsClaimed(address indexed miner, uint256 nuAmount, uint256 wattConsumed)'
    ];
  }

  private getMiningPoolHostABI() {
    return [
      'function createPool(string memory _name) external returns (uint256)',
      'function joinPool(uint256 _poolId, uint256 _rigId, uint256 _hashRate) external',
      'function leavePool(uint256 _poolId) external',
      'function claimPoolRewards(uint256 _poolId) external',
      'function distributePoolRewards(uint256 _poolId, uint256 _totalRewards) external',
      'function getPoolInfo(uint256 _poolId) external view returns (tuple)',
      'function getPoolMiners(uint256 _poolId) external view returns (address[])',
      'event PoolCreated(uint256 indexed poolId, address indexed host, string name, uint256 wattLocked)',
      'event MinerJoined(uint256 indexed poolId, address indexed miner, uint256 rigId, uint256 hashRate)',
      'event PoolRewardsClaimed(uint256 indexed poolId, address indexed host, uint256 nuAmount, uint256 wattConsumed)'
    ];
  }

  private getCrossChainValidatorABI() {
    return [
      'function receiveHashPowerData(uint256 _chainId, uint256 _totalHashPower, uint256 _activeRigs, address[] memory _activeMiners, uint256[] memory _minerHashPowers) external',
      'function setNuChainL2Contract(address _contract) external',
      'function addValidator(address _validator) external',
      'function getChainHashPower(uint256 _chainId) external view returns (tuple)',
      'function getCurrentNetworkHashPower() external view returns (uint256 polygon, uint256 altcoinchain, uint256 total)',
      'event HashPowerReceived(uint256 indexed chainId, uint256 totalHashPower, uint256 activeRigs)',
      'event ValidationSubmitted(uint256 indexed blockNumber, uint256 polygonHashPower, uint256 altcoinchainHashPower)'
    ];
  }

  private getNuChainL2ABI() {
    return [
      'function submitHashPowerData(uint256 _blockNumber, uint256 _polygonHashPower, uint256 _altcoinchainHashPower) external',
      'function updateMinerRewards(address _miner, uint256 _nuAmount, uint256 _hashPower) external',
      'function addValidator(address _validator) external',
      'function getChainData(uint256 _chainId) external view returns (tuple)',
      'function getBlockSubmission(uint256 _blockNumber) external view returns (tuple)',
      'function getMinerRewards(address _miner) external view returns (tuple)',
      'function getCurrentNetworkHashPower() external view returns (uint256 polygon, uint256 altcoinchain, uint256 total)',
      'event BlockSubmitted(uint256 indexed blockNumber, uint256 polygonHashPower, uint256 altcoinchainHashPower)',
      'event RewardsDistributed(uint256 indexed blockNumber, uint256 totalRewards, uint256 polygonShare, uint256 altcoinchainShare)',
      'event CrossChainMessage(uint256 indexed targetChain, bytes data)'
    ];
  }

  // Utility functions
  getContract(name: string): ethers.Contract | null {
    return this.contracts.get(name) || null;
  }

  updateContractAddress(name: string, address: string) {
    this.contractAddresses[name as keyof typeof this.contractAddresses] = address;
  }

  isInitialized(): boolean {
    return this.provider !== null;
  }
}

export const contractService = new ContractService();