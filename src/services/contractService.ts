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
    validator: '0x0000000000000000000000000000000000000000',
    miningPoolFactory: '0x0000000000000000000000000000000000000000',
    nftMiningRigs: '0x0000000000000000000000000000000000000000',
    zkRollupBridge: '0x0000000000000000000000000000000000000000',
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
      // Validator Contract
      if (this.contractAddresses.validator !== '0x0000000000000000000000000000000000000000') {
        const validatorContract = new ethers.Contract(
          this.contractAddresses.validator,
          this.getValidatorABI(),
          this.signer || this.provider
        );
        this.contracts.set('validator', validatorContract);
      }

      // Mining Pool Factory
      if (this.contractAddresses.miningPoolFactory !== '0x0000000000000000000000000000000000000000') {
        const poolContract = new ethers.Contract(
          this.contractAddresses.miningPoolFactory,
          this.getMiningPoolABI(),
          this.signer || this.provider
        );
        this.contracts.set('miningPoolFactory', poolContract);
      }

      // NFT Mining Rigs
      if (this.contractAddresses.nftMiningRigs !== '0x0000000000000000000000000000000000000000') {
        const nftContract = new ethers.Contract(
          this.contractAddresses.nftMiningRigs,
          this.getNFTMiningABI(),
          this.signer || this.provider
        );
        this.contracts.set('nftMiningRigs', nftContract);
      }

      // zkRollup Bridge
      if (this.contractAddresses.zkRollupBridge !== '0x0000000000000000000000000000000000000000') {
        const bridgeContract = new ethers.Contract(
          this.contractAddresses.zkRollupBridge,
          this.getZkRollupABI(),
          this.signer || this.provider
        );
        this.contracts.set('zkRollupBridge', bridgeContract);
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
  async createMiningPool(name: string, wattAmount: string, feePercentage: number, minPayout: string): Promise<boolean> {
    try {
      const contract = this.contracts.get('miningPoolFactory');
      if (!contract || !this.signer) return false;

      const wattWei = ethers.parseEther(wattAmount);
      const minPayoutWei = ethers.parseEther(minPayout);
      const tx = await contract.createPool(name, wattWei, feePercentage * 100, minPayoutWei);
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
      const contract = this.contracts.get('miningPoolFactory');
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
      const contract = this.contracts.get('miningPoolFactory');
      if (!contract) return null;

      const info = await contract.getPoolInfo(poolId);
      return {
        poolId: Number(info.poolId),
        host: info.host,
        name: info.name,
        wattLocked: ethers.formatEther(info.wattLocked),
        createdAt: new Date(Number(info.createdAt) * 1000),
        lastHeartbeat: new Date(Number(info.lastHeartbeat) * 1000),
        totalMiners: Number(info.totalMiners),
        totalHashRate: Number(info.totalHashRate),
        feePercentage: Number(info.feePercentage) / 100,
        minPayout: ethers.formatEther(info.minPayout),
        isActive: info.isActive,
        uptime: Number(info.uptime) / 100,
        blocksConnected: Number(info.blocksConnected),
        totalBlocks: Number(info.totalBlocks)
      };
    } catch (error) {
      console.error('❌ Failed to get pool info:', error);
      return null;
    }
  }

  // NFT Mining Rig Operations
  async configureRig(componentTokenIds: number[]): Promise<number | null> {
    try {
      const contract = this.contracts.get('nftMiningRigs');
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
      const contract = this.contracts.get('nftMiningRigs');
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
      const contract = this.contracts.get('nftMiningRigs');
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
      const contract = this.contracts.get('nftMiningRigs');
      if (!contract) return null;

      const info = await contract.getRigInfo(rigId);
      return {
        rigId: Number(info.rigId),
        owner: info.owner,
        componentTokenIds: info.componentTokenIds.map((id: any) => Number(id)),
        totalHashRate: Number(info.totalHashRate),
        totalPowerConsumption: Number(info.totalPowerConsumption),
        efficiency: Number(info.efficiency),
        hasGenesisBadge: info.hasGenesisBadge,
        createdAt: new Date(Number(info.createdAt) * 1000),
        isActive: info.isActive,
        poolId: Number(info.poolId),
        totalEarnings: ethers.formatEther(info.totalEarnings)
      };
    } catch (error) {
      console.error('❌ Failed to get rig info:', error);
      return null;
    }
  }

  // zkRollup Operations
  async submitZkProof(stateRoot: string, transactionRoot: string, blockNumber: number, proof: string): Promise<boolean> {
    try {
      const contract = this.contracts.get('zkRollupBridge');
      if (!contract || !this.signer) return false;

      const tx = await contract.submitZkProof(stateRoot, transactionRoot, blockNumber, proof);
      await tx.wait();

      console.log('✅ zkProof submitted successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to submit zkProof:', error);
      return false;
    }
  }

  async getZkRollupStatus(): Promise<any> {
    try {
      const contract = this.contracts.get('zkRollupBridge');
      if (!contract) return null;

      const [stateRoot, blockNumber] = await contract.getCurrentState();
      return {
        currentStateRoot: stateRoot,
        lastVerifiedBlock: Number(blockNumber),
        timestamp: new Date()
      };
    } catch (error) {
      console.error('❌ Failed to get zkRollup status:', error);
      return null;
    }
  }

  // Contract ABIs
  private getValidatorABI() {
    return [
      'function registerValidator(uint256 _stake, uint256 _commission) external',
      'function delegate(address _validator, uint256 _amount) external',
      'function undelegate(address _validator, uint256 _amount) external',
      'function claimRewards(address _validator) external',
      'function getValidatorInfo(address _validator) external view returns (tuple)',
      'function getValidatorCount() external view returns (uint256)',
      'function getTotalStaked() external view returns (uint256)',
      'event ValidatorRegistered(address indexed validator, uint256 stake)',
      'event Delegated(address indexed delegator, address indexed validator, uint256 amount)',
      'event RewardsClaimed(address indexed user, uint256 amount)'
    ];
  }

  private getMiningPoolABI() {
    return [
      'function createPool(string memory _name, uint256 _wattAmount, uint256 _feePercentage, uint256 _minPayout) external',
      'function joinPool(uint256 _poolId, uint256 _rigId, uint256 _hashRate) external',
      'function leavePool(uint256 _poolId) external',
      'function sendHeartbeat(uint256 _poolId) external',
      'function claimRewards(uint256 _poolId) external',
      'function getPoolInfo(uint256 _poolId) external view returns (tuple)',
      'function getPoolMiners(uint256 _poolId) external view returns (address[])',
      'function getMinerInfo(uint256 _poolId, address _miner) external view returns (tuple)',
      'event PoolCreated(uint256 indexed poolId, address indexed host, string name, uint256 wattLocked)',
      'event MinerJoined(uint256 indexed poolId, address indexed miner, uint256 rigId, uint256 hashRate)',
      'event RewardsDistributed(uint256 indexed poolId, uint256 totalRewards)'
    ];
  }

  private getNFTMiningABI() {
    return [
      'function configureRig(uint256[] memory _componentTokenIds) external returns (uint256)',
      'function startMining(uint256 _rigId, uint256 _poolId) external',
      'function stopMining(uint256 _rigId) external',
      'function getRigInfo(uint256 _rigId) external view returns (tuple)',
      'function getUserRigs(address _user) external view returns (uint256[])',
      'function getComponentInfo(uint256 _tokenId) external view returns (tuple)',
      'event RigConfigured(uint256 indexed rigId, address indexed owner, uint256[] components)',
      'event RigStartedMining(uint256 indexed rigId, uint256 poolId)',
      'event RigStoppedMining(uint256 indexed rigId)'
    ];
  }

  private getZkRollupABI() {
    return [
      'function submitZkProof(bytes32 _stateRoot, bytes32 _transactionRoot, uint256 _blockNumber, bytes memory _proof) external',
      'function verifyProof(uint256 _proofId) external',
      'function challengeProof(uint256 _proofId) external',
      'function getCurrentState() external view returns (bytes32 stateRoot, uint256 blockNumber)',
      'function getProofInfo(uint256 _proofId) external view returns (tuple)',
      'event ProofSubmitted(uint256 indexed proofId, bytes32 stateRoot, address validator)',
      'event ProofVerified(uint256 indexed proofId, bytes32 stateRoot)',
      'event StateRootUpdated(bytes32 oldRoot, bytes32 newRoot, uint256 blockNumber)'
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