// Chain configurations for all supported blockchains
export const chains = {
  wtx: {
    id: 'wtx',
    name: 'WATTx',
    ticker: 'WTX',
    logo: '/logo.png',
    description: 'Hybrid PoW/PoS with Smart Contracts',
    api: 'https://wtx-explorer.wattxchange.app',
    explorerUrl: 'https://wtx-explorer.wattxchange.app',
    features: {
      smartContracts: true,
      tokens: true,
      staking: true,
      masternodes: false,
      delegatorNodes: true,
      superStakerNodes: true,
    },
    consensus: 'PoW/PoS',
    algorithm: 'RandomX',
    theme: {
      primary: '#f0b90b',
      primaryDark: '#c99a09',
      primaryLight: '#fcd535',
      secondary: '#10b981',
      gradient: 'from-yellow-500 to-yellow-700',
      glow: 'rgba(240, 185, 11, 0.2)',
    }
  },
  hth: {
    id: 'hth',
    name: 'Help The Homeless',
    ticker: 'HTH',
    logo: '/logo.png',
    description: 'Masternode-enabled cryptocurrency for charity',
    api: 'https://hth-explorer.wattxchange.app',
    explorerUrl: 'https://hth-explorer.wattxchange.app',
    features: {
      smartContracts: false,
      tokens: false,
      staking: false,
      masternodes: true,
      delegatorNodes: false,
      superStakerNodes: false,
    },
    consensus: 'PoW/MN',
    algorithm: 'X25X',
    theme: {
      primary: '#22c55e',
      primaryDark: '#16a34a',
      primaryLight: '#4ade80',
      secondary: '#facc15',
      gradient: 'from-green-500 to-green-700',
      glow: 'rgba(34, 197, 94, 0.2)',
    }
  },
  flop: {
    id: 'flop',
    name: 'Flopcoin',
    ticker: 'FLOP',
    logo: '/logo.png',
    description: 'Fun, inflationary meme coin',
    api: 'https://flop-explorer.wattxchange.app',
    explorerUrl: 'https://flop-explorer.wattxchange.app',
    features: {
      smartContracts: false,
      tokens: false,
      staking: false,
      masternodes: false,
      delegatorNodes: false,
      superStakerNodes: false,
    },
    consensus: 'PoW',
    algorithm: 'Scrypt',
    theme: {
      primary: '#ec4899',
      primaryDark: '#db2777',
      primaryLight: '#f472b6',
      secondary: '#facc15',
      gradient: 'from-pink-500 to-pink-700',
      glow: 'rgba(236, 72, 153, 0.2)',
    }
  },
  alt: {
    id: 'alt',
    name: 'Altcoinchain',
    ticker: 'ALT',
    logo: '/logo.png',
    description: 'EVM-compatible blockchain',
    api: 'https://alt-explorer.wattxchange.app',
    rpc: 'https://alt-rpc.wattxchange.app',
    ws: 'wss://alt-ws.wattxchange.app',
    explorerUrl: 'https://alt-explorer.wattxchange.app',
    chainId: 2330,
    features: {
      smartContracts: true,
      tokens: true,
      staking: false,
      masternodes: false,
      delegatorNodes: false,
      superStakerNodes: false,
      evm: true,
    },
    consensus: 'PoW/PoS',
    algorithm: 'Ethash',
    theme: {
      primary: '#3498db',
      primaryDark: '#2980b9',
      primaryLight: '#5dade2',
      secondary: '#1e293b',
      gradient: 'from-blue-500 to-blue-700',
      glow: 'rgba(52, 152, 219, 0.2)',
    }
  }
};

// Get chain config from environment or default to wtx
export const getChainConfig = () => {
  const chainId = import.meta.env.VITE_CHAIN || 'wtx';
  return chains[chainId] || chains.wtx;
};

export default chains;
