interface HardwareSpecs {
  cpu: {
    model: string;
    cores: number;
    threads: number;
    speed: number;
    maxSpeed: number;
    architecture: string;
  };
  memory: {
    total: number;
    available: number;
    type: string;
  };
  gpu: {
    model: string;
    memory: number;
    driver: string;
    cudaCores: number;
  };
  storage: {
    total: number;
    available: number;
    type: string;
  };
  network: {
    download: number;
    upload: number;
    type: string;
  };
  os: {
    name: string;
    version: string;
    architecture: string;
  };
}

interface RentalContract {
  id: string;
  walletAddress: string;
  hardwareType: 'CPU' | 'GPU' | 'Server';
  specs: HardwareSpecs;
  paymentRate: number;
  startDate: Date;
  status: 'active' | 'paused' | 'terminated';
  totalEarned: number;
  lastPayout: Date | null;
}

interface MinerConfig {
  coin: string;
  algorithm: string;
  pool: string;
  port: number;
  walletAddress: string;
  minerPath: string;
  extraParams: string;
}

class HardwareRentalService {
  private contracts: RentalContract[] = [];
  private minerConfigs: Record<string, MinerConfig> = {
    ALT: {
      coin: 'ALT',
      algorithm: 'ethash',
      pool: 'alt.mineyguys.com',
      port: 8008,
      walletAddress: '',
      minerPath: './SRBMiner-MULTI',
      extraParams: '--cpu-threads -1 --log-file ./Logs/log-ALT.txt'
    },
    HTH: {
      coin: 'HTH',
      algorithm: 'x25x',
      pool: 'stratum.monminepool.org',
      port: 3178,
      walletAddress: '',
      minerPath: './t-rex',
      extraParams: '-p c=HTH'
    },
    XMR: {
      coin: 'XMR',
      algorithm: 'randomx',
      pool: 'pool.supportxmr.com',
      port: 3333,
      walletAddress: '',
      minerPath: './xmrig',
      extraParams: '-p x -k --coin monero'
    }
  };

  constructor() {
    this.loadContracts();
  }

  private loadContracts() {
    try {
      const saved = localStorage.getItem('hardware_rental_contracts');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.contracts = parsed.map((contract: any) => ({
          ...contract,
          startDate: new Date(contract.startDate),
          lastPayout: contract.lastPayout ? new Date(contract.lastPayout) : null
        }));
      }
    } catch (error) {
      console.error('Failed to load contracts:', error);
    }
  }

  private saveContracts() {
    try {
      localStorage.setItem('hardware_rental_contracts', JSON.stringify(this.contracts));
    } catch (error) {
      console.error('Failed to save contracts:', error);
    }
  }

  detectSystemSpecs(): Promise<HardwareSpecs> {
    return new Promise((resolve) => {
      // In a real implementation, this would use system APIs to detect hardware
      // For demo purposes, we'll return mock data
      setTimeout(() => {
        resolve({
          cpu: {
            model: 'AMD Ryzen 9 5950X',
            cores: 16,
            threads: 32,
            speed: 3.4,
            maxSpeed: 4.9,
            architecture: 'x86_64'
          },
          memory: {
            total: 32,
            available: 28,
            type: 'DDR4'
          },
          gpu: {
            model: 'NVIDIA GeForce RTX 3080',
            memory: 10,
            driver: '535.129.03',
            cudaCores: 8704
          },
          storage: {
            total: 2000,
            available: 1250,
            type: 'NVMe SSD'
          },
          network: {
            download: 500,
            upload: 50,
            type: 'Ethernet'
          },
          os: {
            name: 'Windows 11 Pro',
            version: '22H2',
            architecture: '64-bit'
          }
        });
      }, 1000);
    });
  }

  calculateEstimatedEarnings(specs: HardwareSpecs, hardwareType: 'CPU' | 'GPU' | 'Server'): number {
    let estimate = 0;
    
    switch (hardwareType) {
      case 'CPU':
        // Calculate based on CPU MHz and cores
        const totalMHz = specs.cpu.cores * specs.cpu.speed * 1000;
        estimate = totalMHz * 713633.13824723 / 1000; // per hour
        break;
      case 'GPU':
        // Calculate based on CUDA cores
        estimate = specs.gpu.cudaCores * 713633.13824723 / 1000; // per hour
        break;
      case 'Server':
        // Fixed rate for server hosting
        estimate = 713633.13824723; // per hour
        break;
    }
    
    return estimate;
  }

  createRentalContract(walletAddress: string, hardwareType: 'CPU' | 'GPU' | 'Server', specs: HardwareSpecs): RentalContract {
    const paymentRate = this.calculateEstimatedEarnings(specs, hardwareType);
    
    const contract: RentalContract = {
      id: `WATT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      walletAddress,
      hardwareType,
      specs,
      paymentRate,
      startDate: new Date(),
      status: 'active',
      totalEarned: 0,
      lastPayout: null
    };
    
    this.contracts.push(contract);
    this.saveContracts();
    
    return contract;
  }

  getActiveContracts(): RentalContract[] {
    return this.contracts.filter(contract => contract.status === 'active');
  }

  getAllContracts(): RentalContract[] {
    return [...this.contracts];
  }

  updateContractStatus(contractId: string, status: 'active' | 'paused' | 'terminated'): boolean {
    const contract = this.contracts.find(c => c.id === contractId);
    if (!contract) return false;
    
    contract.status = status;
    this.saveContracts();
    
    return true;
  }

  recordPayout(contractId: string, amount: number): boolean {
    const contract = this.contracts.find(c => c.id === contractId);
    if (!contract) return false;
    
    contract.totalEarned += amount;
    contract.lastPayout = new Date();
    this.saveContracts();
    
    return true;
  }

  generateMinerScript(coin: string, walletAddress: string): string {
    const config = this.minerConfigs[coin];
    if (!config) return '';
    
    // Update wallet address
    config.walletAddress = walletAddress;
    
    let script = '';
    
    switch (coin) {
      case 'ALT':
        script = `export GPU_MAX_HEAP_SIZE=100
export GPU_MAX_USE_SYNC_OBJECTS=1
export GPU_SINGLE_ALLOC_PERCENT=100
export GPU_MAX_ALLOC_PERCENT=100
export GPU_MAX_SINGLE_ALLOC_PERCENT=100
export GPU_ENABLE_LARGE_ALLOCATION=100
export GPU_MAX_WORKGROUP_SIZE=1024
#!/bin/sh
reset

${config.minerPath} --algorithm ${config.algorithm} --pool ${config.pool}:${config.port} --wallet ${config.walletAddress} --password x ${config.extraParams}`;
        break;
      case 'HTH':
        script = `#!/bin/sh
${config.minerPath} -a ${config.algorithm} -o stratum+tcp://${config.pool}:${config.port} -u ${config.walletAddress}.1337 ${config.extraParams}`;
        break;
      case 'XMR':
        script = `#!/bin/sh
${config.minerPath} -o ${config.pool}:${config.port} -u ${config.walletAddress} ${config.extraParams}`;
        break;
      default:
        script = `#!/bin/sh
# Generic mining script for ${coin}
# Replace with appropriate pool and algorithm settings
./miner --algorithm auto --pool auto.pool.com:3333 --wallet ${walletAddress} --password x`;
    }
    
    return script;
  }

  getMinerDownloadUrl(coin: string): string {
    // In a real implementation, these would be actual download URLs
    switch (coin) {
      case 'ALT':
        return 'https://github.com/doktor83/SRBMiner-Multi/releases/download/2.4.8/SRBMiner-Multi-2-4-8-Linux.tar.xz';
      case 'HTH':
        return 'https://github.com/trexminer/T-Rex/releases/download/0.26.8/t-rex-0.26.8-linux.tar.gz';
      case 'XMR':
        return 'https://github.com/xmrig/xmrig/releases/download/v6.20.0/xmrig-6.20.0-linux-x64.tar.gz';
      default:
        return '#';
    }
  }

  getHardwareClientDownloadUrl(): string {
    // In a real implementation, this would be an actual download URL
    return 'https://wattxchange.com/downloads/hardware-rental-client-v1.0.0.zip';
  }
}

export const hardwareRentalService = new HardwareRentalService();
export type { HardwareSpecs, RentalContract, MinerConfig };