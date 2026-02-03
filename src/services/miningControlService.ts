/**
 * Mining Control Service
 * Handles starting/stopping mining and adjusting core count
 */

interface MiningConfig {
  enabled: boolean;
  threads: number;
  address: string;
}

interface MiningStatus {
  isActive: boolean;
  threads: number;
  address: string;
  hashrate?: number;
  lastBlockFound?: Date;
}

class MiningControlService {
  private config: MiningConfig = {
    enabled: false,
    threads: 4,
    address: ''
  };

  private status: MiningStatus = {
    isActive: false,
    threads: 0,
    address: ''
  };

  /**
   * Start mining with specified configuration
   */
  async startMining(threads: number, address?: string): Promise<boolean> {
    try {
      console.log('🚀 Starting mining with', threads, 'threads...');
      
      // Get wallet address if not provided
      if (!address) {
        address = await this.getWalletAddress();
      }

      if (!address) {
        throw new Error('No wallet address available');
      }

      // Update config
      this.config = {
        enabled: true,
        threads,
        address
      };

      // Restart daemon with mining enabled
      const success = await this.restartDaemonWithMining(threads, address);
      
      if (success) {
        this.status = {
          isActive: true,
          threads,
          address
        };
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to start mining:', error);
      return false;
    }
  }

  /**
   * Stop mining
   */
  async stopMining(): Promise<boolean> {
    try {
      console.log('🛑 Stopping mining...');
      
      // Update config
      this.config.enabled = false;
      
      // Restart daemon without mining
      const success = await this.restartDaemonWithoutMining();
      
      if (success) {
        this.status = {
          isActive: false,
          threads: 0,
          address: ''
        };
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to stop mining:', error);
      return false;
    }
  }

  /**
   * Get current mining status
   */
  async getMiningStatus(): Promise<MiningStatus> {
    try {
      // Check if daemon is running
      const daemonRunning = await this.isDaemonRunning();
      
      if (!daemonRunning) {
        this.status.isActive = false;
        return this.status;
      }

      // Try to get mining info from logs
      const miningInfo = await this.getMiningInfoFromLogs();
      
      this.status = {
        ...this.status,
        ...miningInfo
      };

      return this.status;
    } catch (error) {
      console.error('Failed to get mining status:', error);
      return this.status;
    }
  }

  /**
   * Get wallet address from wallet RPC
   */
  private async getWalletAddress(): Promise<string | null> {
    try {
      const response = await fetch('http://127.0.0.1:18083/json_rpc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: '0',
          method: 'get_address'
        })
      });

      const data = await response.json();
      return data.result?.address || null;
    } catch (error) {
      console.error('Failed to get wallet address:', error);
      return null;
    }
  }

  /**
   * Check if daemon is running
   */
  private async isDaemonRunning(): Promise<boolean> {
    try {
      const response = await fetch('http://127.0.0.1:18081/json_rpc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: '0',
          method: 'get_info'
        })
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get mining info from daemon logs
   */
  private async getMiningInfoFromLogs(): Promise<Partial<MiningStatus>> {
    try {
      // This would need to be implemented with a backend service
      // For now, return basic info
      return {
        isActive: this.config.enabled,
        threads: this.config.threads,
        address: this.config.address
      };
    } catch (error) {
      console.error('Failed to get mining info from logs:', error);
      return {};
    }
  }

  /**
   * Restart daemon with mining enabled
   */
  private async restartDaemonWithMining(threads: number, address: string): Promise<boolean> {
    try {
      console.log(`🔄 Restarting daemon with mining: ${threads} threads, address: ${address.substring(0, 10)}...`);
      
      // This would need to be implemented with a backend service
      // For now, we'll use a simple approach
      
      // Kill existing daemon
      await this.killDaemon();
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Start daemon with mining
      const success = await this.startDaemonWithMining(threads, address);
      
      return success;
    } catch (error) {
      console.error('Failed to restart daemon with mining:', error);
      return false;
    }
  }

  /**
   * Restart daemon without mining
   */
  private async restartDaemonWithoutMining(): Promise<boolean> {
    try {
      console.log('🔄 Restarting daemon without mining...');
      
      // Kill existing daemon
      await this.killDaemon();
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Start daemon without mining
      const success = await this.startDaemonWithoutMining();
      
      return success;
    } catch (error) {
      console.error('Failed to restart daemon without mining:', error);
      return false;
    }
  }

  /**
   * Kill the daemon process
   */
  private async killDaemon(): Promise<void> {
    try {
      // Send request to backend to kill daemon
      const response = await fetch('/api/mining/kill-daemon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to kill daemon');
      }
    } catch (error) {
      console.error('Failed to kill daemon:', error);
      throw error;
    }
  }

  /**
   * Start daemon with mining
   */
  private async startDaemonWithMining(threads: number, address: string): Promise<boolean> {
    try {
      const response = await fetch('/api/mining/start-daemon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threads,
          address,
          mining: true
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to start daemon with mining:', error);
      return false;
    }
  }

  /**
   * Start daemon without mining
   */
  private async startDaemonWithoutMining(): Promise<boolean> {
    try {
      const response = await fetch('/api/mining/start-daemon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mining: false
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to start daemon without mining:', error);
      return false;
    }
  }

  /**
   * Get available CPU cores
   */
  getAvailableCores(): number {
    return navigator.hardwareConcurrency || 4;
  }

  /**
   * Get current configuration
   */
  getConfig(): MiningConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const miningControlService = new MiningControlService();
export default miningControlService;
