/**
 * Mining API Service
 * Handles backend communication for mining control
 */

interface MiningApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

class MiningApiService {
  private baseUrl = '/api/mining';

  /**
   * Kill the Monero daemon
   */
  async killDaemon(): Promise<MiningApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/kill-daemon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        message: `Failed to kill daemon: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Start the Monero daemon
   */
  async startDaemon(config: {
    mining: boolean;
    threads?: number;
    address?: string;
  }): Promise<MiningApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/start-daemon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        message: `Failed to start daemon: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get mining status
   */
  async getMiningStatus(): Promise<MiningApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/status`);
      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        message: `Failed to get mining status: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

// Export singleton instance
export const miningApiService = new MiningApiService();
export default miningApiService;
