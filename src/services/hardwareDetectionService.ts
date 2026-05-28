/**
 * Hardware Detection Service
 * 
 * This service provides methods to detect and analyze hardware components
 * for the hardware rental system.
 */

interface CPUInfo {
  model: string;
  cores: number;
  threads: number;
  speed: number;
  maxSpeed: number;
  architecture: string;
  temperature?: number;
  usage?: number;
}

interface GPUInfo {
  model: string;
  memory: number;
  driver: string;
  cudaCores: number;
  temperature?: number;
  usage?: number;
}

interface MemoryInfo {
  total: number;
  available: number;
  type: string;
  usage?: number;
}

interface StorageInfo {
  total: number;
  available: number;
  type: string;
  readSpeed?: number;
  writeSpeed?: number;
}

interface NetworkInfo {
  download: number;
  upload: number;
  type: string;
  latency?: number;
}

interface OSInfo {
  name: string;
  version: string;
  architecture: string;
}

export interface SystemInfo {
  cpu: CPUInfo;
  gpu: GPUInfo;
  memory: MemoryInfo;
  storage: StorageInfo;
  network: NetworkInfo;
  os: OSInfo;
    }

class HardwareDetectionService {
  /**
   * Detect all system hardware components
   */
  async detectSystemHardware(): Promise<SystemInfo> {
    try {
      // In a real implementation, this would use system APIs to detect hardware
      // For demo purposes, we'll simulate detection with mock data
      
      // Detect CPU
      const cpu = await this.detectCPU();
      
      // Detect GPU
      const gpu = await this.detectGPU();
      
      // Detect Memory
      const memory = await this.detectMemory();
      
      // Detect Storage
      const storage = await this.detectStorage();
      
      // Detect Network
      const network = await this.detectNetwork();
      
      // Detect OS
      const os = await this.detectOS();
      
      return {
        cpu,
        gpu,
        memory,
        storage,
        network,
        os
      };
    } catch (error) {
      console.error('Failed to detect system hardware:', error);
      throw new Error('Hardware detection failed');
    }
  }

  /**
   * Detect CPU information
   */
  private async detectCPU(): Promise<CPUInfo> {
    // In a real implementation, this would use system APIs
    // For demo purposes, we'll return mock data
    
    // Try to get some basic info from navigator
    const logicalCores = navigator.hardwareConcurrency || 8;
    
    // Simulate different CPU models based on core count
    let model = 'Intel Core i7';
    let maxSpeed = 4.2;
    
    if (logicalCores >= 16) {
      model = 'AMD Ryzen 9 5950X';
      maxSpeed = 4.9;
    } else if (logicalCores >= 12) {
      model = 'Intel Core i9-12900K';
      maxSpeed = 5.2;
    } else if (logicalCores >= 8) {
      model = 'AMD Ryzen 7 5800X';
      maxSpeed = 4.7;
    } else if (logicalCores >= 6) {
      model = 'Intel Core i5-12600K';
      maxSpeed = 4.9;
    } else if (logicalCores >= 4) {
      model = 'AMD Ryzen 5 5600X';
      maxSpeed = 4.6;
    }
    
    return {
      model,
      cores: Math.ceil(logicalCores / 2), // Estimate physical cores
      threads: logicalCores,
      speed: 3.4, // Base clock in GHz
      maxSpeed, // Turbo clock in GHz
      architecture: 'x86_64',
      temperature: 45 + Math.random() * 15, // Random temperature between 45-60°C
      usage: Math.random() * 30 // Random usage between 0-30%
    };
  }

  /**
   * Detect GPU information
   */
  private async detectGPU(): Promise<GPUInfo> {
    // In a real implementation, this would use system APIs
    // For demo purposes, we'll return mock data
    
    // Try to detect if WebGL is available to determine if GPU is present
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) {
      // No WebGL support, likely no GPU or very old one
      return {
        model: 'Integrated Graphics',
        memory: 1,
        driver: 'Unknown',
        cudaCores: 0,
        temperature: 40,
        usage: 0
      };
    }

    // Get renderer info if available
    // Type assertion to allow access to getExtension for WebGLRenderingContext
    const webgl = gl as WebGLRenderingContext;
    const debugInfo = webgl.getExtension && webgl.getExtension('WEBGL_debug_renderer_info');
    let gpuInfo = 'Unknown GPU';

    // Properly attempt to get the unmasked renderer string if possible
    if (
      debugInfo &&
      debugInfo.UNMASKED_RENDERER_WEBGL
    ) {
      try {
        const renderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        gpuInfo = renderer && typeof renderer === 'string' ? renderer : 'Unknown GPU';
      } catch (e) {
        gpuInfo = 'Unknown GPU';
      }
    }

    // Determine GPU model based on renderer info
    let model = 'Unknown GPU';
    let memory = 4;
    let cudaCores = 0;
    
    if (gpuInfo.includes('NVIDIA')) {
      if (gpuInfo.includes('RTX 30') || gpuInfo.includes('RTX 40')) {
        model = 'NVIDIA GeForce RTX 3080';
        memory = 10;
        cudaCores = 8704;
      } else if (gpuInfo.includes('RTX 20')) {
        model = 'NVIDIA GeForce RTX 2070';
        memory = 8;
        cudaCores = 2304;
      } else if (gpuInfo.includes('GTX 16')) {
        model = 'NVIDIA GeForce GTX 1660';
        memory = 6;
        cudaCores = 1408;
      } else if (gpuInfo.includes('GTX 10')) {
        model = 'NVIDIA GeForce GTX 1060';
        memory = 6;
        cudaCores = 1280;
      } else {
        model = 'NVIDIA GPU';
        memory = 4;
        cudaCores = 1024;
      }
    } else if (gpuInfo.includes('AMD') || gpuInfo.includes('Radeon')) {
      if (gpuInfo.includes('RX 6')) {
        model = 'AMD Radeon RX 6800 XT';
        memory = 16;
        cudaCores = 4608; // Stream processors
      } else if (gpuInfo.includes('RX 5')) {
        model = 'AMD Radeon RX 5700 XT';
        memory = 8;
        cudaCores = 2560; // Stream processors
      } else {
        model = 'AMD Radeon GPU';
        memory = 8;
        cudaCores = 2048; // Stream processors
      }
    } else if (gpuInfo.includes('Intel')) {
      model = 'Intel Integrated Graphics';
      memory = 2;
      cudaCores = 0;
    } else {
      // Use a default high-end GPU for demo purposes
      model = 'NVIDIA GeForce RTX 3080';
      memory = 10;
      cudaCores = 8704;
    }
    
    return {
      model,
      memory,
      driver: '535.129.03',
      cudaCores,
      temperature: 50 + Math.random() * 20, // Random temperature between 50-70°C
      usage: Math.random() * 20 // Random usage between 0-20%
    };
  }

  /**
   * Detect memory information
   */
  private async detectMemory(): Promise<MemoryInfo> {
    // In a real implementation, this would use system APIs
    // For demo purposes, we'll return mock data
    
    // Try to estimate memory based on performance
    let totalMemory = 16; // Default to 16GB
    
    // Use performance.memory if available (Chrome only)
    if (performance && (performance as any).memory) {
      const memoryInfo = (performance as any).memory;
      totalMemory = Math.round(memoryInfo.jsHeapSizeLimit / (1024 * 1024 * 1024));
    }
    
    // Adjust based on device capabilities
    if (navigator.hardwareConcurrency) {
      if (navigator.hardwareConcurrency >= 16) {
        totalMemory = 32;
      } else if (navigator.hardwareConcurrency >= 8) {
        totalMemory = 16;
      } else if (navigator.hardwareConcurrency >= 4) {
        totalMemory = 8;
      } else {
        totalMemory = 4;
    }
  }

    return {
      total: totalMemory,
      available: Math.round(totalMemory * 0.7), // Assume 70% is available
      type: 'DDR4',
      usage: 30 + Math.random() * 20 // Random usage between 30-50%
    };
  }

  /**
   * Detect storage information
   */
  private async detectStorage(): Promise<StorageInfo> {
    // In a real implementation, this would use system APIs
    // For demo purposes, we'll return mock data
    
    return {
      total: 1000, // 1TB
      available: 650, // 650GB free
      type: 'NVMe SSD',
      readSpeed: 3500, // MB/s
      writeSpeed: 3000 // MB/s
    };
  }

  /**
   * Detect network information
   */
  private async detectNetwork(): Promise<NetworkInfo> {
    // In a real implementation, this would use system APIs
    // For demo purposes, we'll return mock data
    
    // Try to use the Network Information API if available
    let connectionType = 'unknown';
    let downloadSpeed = 100; // Mbps
    let uploadSpeed = 20; // Mbps
    
    if ('connection' in navigator && (navigator as any).connection) {
      const connection = (navigator as any).connection;
      
      if (connection.type) {
        connectionType = connection.type;
      }
      
      if (connection.downlink) {
        downloadSpeed = connection.downlink;
      }
      
      if (connection.uplink) {
        uploadSpeed = connection.uplink;
      } else {
        // Estimate upload as 20% of download if not available
        uploadSpeed = downloadSpeed * 0.2;
      }
    }
    
    // Map connection type to a more user-friendly name
    let networkType = 'Ethernet';
    if (connectionType === 'wifi') {
      networkType = 'Wi-Fi';
    } else if (connectionType === 'cellular') {
      networkType = '4G/5G';
    }
    
    return {
      download: downloadSpeed,
      upload: uploadSpeed,
      type: networkType,
      latency: 15 + Math.random() * 35 // Random latency between 15-50ms
    };
  }

  /**
   * Detect operating system information
   */
  private async detectOS(): Promise<OSInfo> {
    // In a real implementation, this would use system APIs
    // For demo purposes, we'll use navigator.userAgent
    
    const userAgent = navigator.userAgent;
    let name = 'Unknown';
    let version = 'Unknown';
    let architecture = 'x86_64';
    
    if (userAgent.includes('Windows')) {
      name = 'Windows';
      if (userAgent.includes('Windows NT 10.0')) {
        version = userAgent.includes('Windows NT 10.0; Win64') ? 'Windows 11' : 'Windows 10';
      } else if (userAgent.includes('Windows NT 6.3')) {
        version = 'Windows 8.1';
      } else if (userAgent.includes('Windows NT 6.2')) {
        version = 'Windows 8';
      } else if (userAgent.includes('Windows NT 6.1')) {
        version = 'Windows 7';
      }
    } else if (userAgent.includes('Mac OS X')) {
      name = 'macOS';
      const macOSVersion = userAgent.match(/Mac OS X ([0-9_]+)/);
      if (macOSVersion) {
        version = macOSVersion[1].replace(/_/g, '.');
      }
    } else if (userAgent.includes('Linux')) {
      name = 'Linux';
      if (userAgent.includes('Ubuntu')) {
        version = 'Ubuntu';
      } else if (userAgent.includes('Fedora')) {
        version = 'Fedora';
      } else {
        version = 'Distribution';
      }
    }
    
    // Check for 64-bit architecture
    if (userAgent.includes('x64') || userAgent.includes('x86_64') || userAgent.includes('Win64')) {
      architecture = 'x86_64';
    } else if (userAgent.includes('arm') || userAgent.includes('ARM')) {
      architecture = 'ARM';
    } else {
      architecture = 'x86';
    }
    
    return {
      name,
      version,
      architecture
    };
  }

  /**
   * Monitor system resource usage in real-time
   */
  async monitorResourceUsage(callback: (usage: {
    cpu: number;
    memory: number;
    gpu: number;
  }) => void): Promise<() => void> {
    // In a real implementation, this would use system APIs to monitor resources
    // For demo purposes, we'll simulate with random values
    
    const interval = setInterval(() => {
      const usage = {
        cpu: 5 + Math.random() * 20, // Random CPU usage between 5-25%
        memory: 30 + Math.random() * 20, // Random memory usage between 30-50%
        gpu: Math.random() * 15 // Random GPU usage between 0-15%
      };
      
      callback(usage);
    }, 1000);
    
    // Return a cleanup function
    return () => clearInterval(interval);
  }

  /**
   * Check if the system meets minimum requirements for hardware rental
   */
  async checkSystemRequirements(): Promise<{
    meetsRequirements: boolean;
    issues: string[];
  }> {
    try {
      const systemInfo = await this.detectSystemHardware();
      const issues: string[] = [];
      
      // Check CPU
      if (systemInfo.cpu.cores < 2) {
        issues.push('CPU must have at least 2 cores');
      }
      
      // Check Memory
      if (systemInfo.memory.total < 4) {
        issues.push('System must have at least 4GB of RAM');
      }
      
      // Check GPU if available
      if (systemInfo.gpu.memory < 2) {
        issues.push('GPU must have at least 2GB of VRAM');
      }
      
      // Check Storage
      if (systemInfo.storage.available < 10) {
        issues.push('At least 10GB of free storage space is required');
      }
      
      // Check Network
      if (systemInfo.network.download < 10) {
        issues.push('Internet connection must be at least 10 Mbps');
      }
      
      return {
        meetsRequirements: issues.length === 0,
        issues
      };
    } catch (error) {
      console.error('Failed to check system requirements:', error);
      return {
        meetsRequirements: false,
        issues: ['Failed to check system requirements']
      };
    }
  }

  /**
   * Calculate potential earnings based on system specifications
   */
  calculatePotentialEarnings(systemInfo: SystemInfo): {
    hourly: number;
    daily: number;
    monthly: number;
    breakdown: Record<string, number>;
  } {
    // Calculate CPU earnings
    const cpuEarnings = systemInfo.cpu.cores * systemInfo.cpu.speed * 1000 * 713633.13824723 / 1000;
    
    // Calculate GPU earnings
    let gpuEarnings = 0;
    if (systemInfo.gpu.cudaCores > 0) {
      gpuEarnings = systemInfo.gpu.cudaCores * 713633.13824723 / 1000;
    }
    
    // Calculate memory earnings
    const memoryEarnings = systemInfo.memory.total * 713633.13824723 / 100;
    
    // Calculate storage earnings
    const storageEarnings = systemInfo.storage.available * 713633.13824723 / 10000;
    
    // Calculate network earnings
    const networkEarnings = systemInfo.network.download * 713633.13824723 / 10000;
    
    // Calculate total hourly earnings
    const hourlyEarnings = cpuEarnings + gpuEarnings + memoryEarnings + storageEarnings + networkEarnings;
    
    return {
      hourly: hourlyEarnings,
      daily: hourlyEarnings * 24,
      monthly: hourlyEarnings * 24 * 30,
      breakdown: {
        cpu: cpuEarnings,
        gpu: gpuEarnings,
        memory: memoryEarnings,
        storage: storageEarnings,
        network: networkEarnings
      }
    };
  }
}

// Create a singleton instance
export const hardwareDetectionService = new HardwareDetectionService();
export type { SystemInfo as HardwareSpecs };