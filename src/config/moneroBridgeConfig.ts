/**
 * Monero Bridge Configuration
 * Update these values after deploying the contracts
 */

export interface MoneroBridgeConfig {
  // Altcoinchain Network
  altcoinchain: {
    rpcUrl: string;
    chainId: number;
    name: string;
    symbol: string;
    blockExplorer: string;
  };
  
  // Contract Addresses (update after deployment)
  contracts: {
    wXMRToken: string;
    bridge: string;
  };
  
  // Bridge Operator
  bridgeOperator: {
    privateKey: string; // Keep this secure!
    address: string;
  };
  
  // Monero Configuration
  monero: {
    walletRpcUrl: string;
    daemonRpcUrl: string;
    depositAddress: string; // Your Monero address for deposits
    minConfirmations: number;
    checkInterval: number; // milliseconds
  };
  
  // Security Settings
  security: {
    minDeposit: string; // in XMR
    maxDeposit: string; // in XMR
    minWithdrawal: string; // in XMR
    maxWithdrawal: string; // in XMR
    withdrawalDelay: number; // seconds
  };
  
  // Monitoring
  monitoring: {
    enableLogging: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    alertThresholds: {
      lowBackingRatio: number; // percentage
      highPendingTransactions: number;
    };
  };
}

// Default configuration - UPDATE THESE VALUES AFTER DEPLOYMENT
export const defaultMoneroBridgeConfig: MoneroBridgeConfig = {
  altcoinchain: {
    rpcUrl: 'http://localhost:8545', // Update to your Altcoinchain RPC
    chainId: 1337, // Update to Altcoinchain chain ID
    name: 'Altcoinchain',
    symbol: 'ALT',
    blockExplorer: 'https://explorer.altcoinchain.org' // Update if available
  },
  
  contracts: {
    wXMRToken: '0x0000000000000000000000000000000000000000', // UPDATE AFTER DEPLOYMENT
    bridge: '0x0000000000000000000000000000000000000000' // UPDATE AFTER DEPLOYMENT
  },
  
  bridgeOperator: {
    privateKey: process.env.BRIDGE_OPERATOR_PRIVATE_KEY || '', // Set in .env file
    address: '0x0000000000000000000000000000000000000000' // Will be derived from private key
  },
  
  monero: {
    walletRpcUrl: 'http://127.0.0.1:18083',
    daemonRpcUrl: 'http://127.0.0.1:18081',
    depositAddress: '4AsjKppNcHfJPekAPKVMsecyVT1v35MVn4N6dsXYSVTZHWsmC66u3sDT5NYavm5udMXHf32Ntb4N2bJqhnN4Gfq2GKZYmMK',
    minConfirmations: 10,
    checkInterval: 30000 // 30 seconds
  },
  
  security: {
    minDeposit: '0.001', // 0.001 XMR
    maxDeposit: '100', // 100 XMR
    minWithdrawal: '0.001', // 0.001 XMR
    maxWithdrawal: '100', // 100 XMR
    withdrawalDelay: 3600 // 1 hour
  },
  
  monitoring: {
    enableLogging: true,
    logLevel: 'info',
    alertThresholds: {
      lowBackingRatio: 0.95, // Alert if backing ratio drops below 95%
      highPendingTransactions: 10 // Alert if more than 10 pending transactions
    }
  }
};

// Environment-specific configurations
export const getMoneroBridgeConfig = (): MoneroBridgeConfig => {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return {
        ...defaultMoneroBridgeConfig,
        monitoring: {
          ...defaultMoneroBridgeConfig.monitoring,
          logLevel: 'warn'
        }
      };
      
    case 'test':
      return {
        ...defaultMoneroBridgeConfig,
        monero: {
          ...defaultMoneroBridgeConfig.monero,
          checkInterval: 5000 // Faster for testing
        },
        security: {
          ...defaultMoneroBridgeConfig.security,
          minDeposit: '0.000001', // Lower for testing
          maxDeposit: '1', // Lower for testing
          minWithdrawal: '0.000001',
          maxWithdrawal: '1',
          withdrawalDelay: 60 // 1 minute for testing
        }
      };
      
    default: // development
      return defaultMoneroBridgeConfig;
  }
};

// Validation function
export const validateMoneroBridgeConfig = (config: MoneroBridgeConfig): string[] => {
  const errors: string[] = [];
  
  if (!config.contracts.wXMRToken || config.contracts.wXMRToken === '0x0000000000000000000000000000000000000000') {
    errors.push('wXMR token contract address not set');
  }
  
  if (!config.contracts.bridge || config.contracts.bridge === '0x0000000000000000000000000000000000000000') {
    errors.push('Bridge contract address not set');
  }
  
  if (!config.bridgeOperator.privateKey) {
    errors.push('Bridge operator private key not set');
  }
  
  if (!config.monero.depositAddress) {
    errors.push('Monero deposit address not set');
  }
  
  if (config.monero.minConfirmations < 1) {
    errors.push('Minimum confirmations must be at least 1');
  }
  
  if (config.security.minDeposit >= config.security.maxDeposit) {
    errors.push('Minimum deposit must be less than maximum deposit');
  }
  
  if (config.security.minWithdrawal >= config.security.maxWithdrawal) {
    errors.push('Minimum withdrawal must be less than maximum withdrawal');
  }
  
  return errors;
};

// Helper function to format XMR amounts
export const formatXMR = (amount: string | number): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return num.toFixed(6);
};

// Helper function to convert XMR to atomic units
export const xmrToAtomicUnits = (xmr: string | number): string => {
  const num = typeof xmr === 'string' ? parseFloat(xmr) : xmr;
  return (num * 1e12).toString();
};

// Helper function to convert atomic units to XMR
export const atomicUnitsToXMR = (atomicUnits: string | number): string => {
  const num = typeof atomicUnits === 'string' ? parseFloat(atomicUnits) : atomicUnits;
  return (num / 1e12).toFixed(6);
};
