interface SwapinNetwork {
  name: string;
  chainId: number;
  rpcUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockExplorerUrl: string;
  contracts: {
    wToken: string;
    factory: string;
    router: string;
    multicall: string;
    tokenMultisender: string;
    feeToSetter?: string;
    swapd?: string;
  };
}

interface SwapinPair {
  token0: string;
  token1: string;
  symbol0: string;
  symbol1: string;
  reserve0: string;
  reserve1: string;
  totalSupply: string;
  price0: number;
  price1: number;
}

class SwapinService {
  private networks: Map<number, SwapinNetwork> = new Map();
  private readonly INIT_HASH_CODE = '0x0c817536501f0541680bc3d164be66d6559cdd44e8acf7afeee6aa44283d54ca';
  private readonly DEPLOYER_ADDRESS = '0xE01A6a52Ef245FDeA587735aFe60a1C96152A48D';
  private readonly WRAPPER_DEPLOYER = '0x1F39ddcb71C90B6A690610a7B9B71ab9B97E4D41';

  constructor() {
    this.initializeNetworks();
  }

  private initializeNetworks() {
    // EGAZ Mainnet
    this.networks.set(1234, {
      name: 'EGAZ',
      chainId: 1234,
      rpcUrl: 'https://mainnet.egaz.co',
      nativeCurrency: { name: 'EGAZ', symbol: 'EGAZ', decimals: 18 },
      blockExplorerUrl: 'https://explorer.egaz.co',
      contracts: {
        wToken: '0x444a294EA9858A1c61624300978D9b5C49Ba8873',
        factory: '0x347aAc6D939f98854110Ff48dC5B7beB52D86445',
        router: '0xae168Ce47cebca9abbC5107a58df0532f1afa4d6',
        multicall: '0x426b13031851947ce04C51670a6E9C622B18aa3C',
        tokenMultisender: '0xCF110A9F7c705604190f9Dd6FDf0FC79D00D569B',
        feeToSetter: '0xE01A6a52Ef245FDeA587735aFe60a1C96152A48D'
      }
    });

    // PlanQ Mainnet
    this.networks.set(7070, {
      name: 'PlanQ',
      chainId: 7070,
      rpcUrl: 'https://evm-rpc.planq.network',
      nativeCurrency: { name: 'PlanQ', symbol: 'PLQ', decimals: 18 },
      blockExplorerUrl: 'https://evm.planq.network',
      contracts: {
        wToken: '0x5ebcdf1de1781e8b5d41c016b0574ad53e2f6e1a',
        factory: '0x347aAc6D939f98854110Ff48dC5B7beB52D86445',
        router: '0xae168Ce47cebca9abbC5107a58df0532f1afa4d6',
        multicall: '0x426b13031851947ce04C51670a6E9C622B18aa3C',
        tokenMultisender: '0x5a03b79b6F4cbb1eC8276a87b74a9304D05442C7',
        feeToSetter: '0xE01A6a52Ef245FDeA587735aFe60a1C96152A48D',
        swapd: '0x67e7ebdA5CBA73f5830538B03E678A1b45517dd7'
      }
    });

    // OctaSpace Mainnet
    this.networks.set(800001, {
      name: 'OctaSpace',
      chainId: 800001,
      rpcUrl: 'https://rpc.octa.space',
      nativeCurrency: { name: 'OctaSpace', symbol: 'OCTA', decimals: 18 },
      blockExplorerUrl: 'https://explorer.octa.space',
      contracts: {
        wToken: '0x444a294EA9858A1c61624300978D9b5C49Ba8873',
        factory: '0x347aAc6D939f98854110Ff48dC5B7beB52D86445',
        router: '0xae168Ce47cebca9abbC5107a58df0532f1afa4d6',
        multicall: '0x426b13031851947ce04C51670a6E9C622B18aa3C',
        tokenMultisender: '0xCF110A9F7c705604190f9Dd6FDf0FC79D00D569B'
      }
    });

    // PartyChain Mainnet
    this.networks.set(1773, {
      name: 'PartyChain',
      chainId: 1773,
      rpcUrl: 'https://rpc.partychain.io',
      nativeCurrency: { name: 'GRAMS', symbol: 'GRAMS', decimals: 18 },
      blockExplorerUrl: 'https://explorer.partychain.io',
      contracts: {
        wToken: '0x444a294EA9858A1c61624300978D9b5C49Ba8873',
        factory: '0x347aAc6D939f98854110Ff48dC5B7beB52D86445',
        router: '0xae168Ce47cebca9abbC5107a58df0532f1afa4d6',
        multicall: '0x426b13031851947ce04C51670a6E9C622B18aa3C',
        tokenMultisender: '0xCF110A9F7c705604190f9Dd6FDf0FC79D00D569B'
      }
    });

    // EGEM Mainnet
    this.networks.set(1987, {
      name: 'EGEM',
      chainId: 1987,
      rpcUrl: 'https://jsonrpc.egem.io/custom',
      nativeCurrency: { name: 'EGEM', symbol: 'EGEM', decimals: 18 },
      blockExplorerUrl: 'https://blockscout.egem.io',
      contracts: {
        wToken: '0xE5fca20e55811D461800A853f444FBC6f5B72BEa',
        factory: '0x347aAc6D939f98854110Ff48dC5B7beB52D86445',
        router: '0xae168Ce47cebca9abbC5107a58df0532f1afa4d6',
        multicall: '0x426b13031851947ce04C51670a6E9C622B18aa3C',
        tokenMultisender: '0x5a03b79b6F4cbb1eC8276a87b74a9304D05442C7'
      }
    });

    // ETHO Mainnet
    this.networks.set(1313114, {
      name: 'ETHO',
      chainId: 1313114,
      rpcUrl: 'https://rpc.ethoprotocol.com',
      nativeCurrency: { name: 'ETHO', symbol: 'ETHO', decimals: 18 },
      blockExplorerUrl: 'https://explorer.ethoprotocol.com',
      contracts: {
        wToken: '0xF30eCf203fae5051ECA8640d2752265f4ED49ACB',
        factory: '0x347aAc6D939f98854110Ff48dC5B7beB52D86445',
        router: '0xae168Ce47cebca9abbC5107a58df0532f1afa4d6',
        multicall: '0x426b13031851947ce04C51670a6E9C622B18aa3C',
        tokenMultisender: '0x5a03b79b6F4cbb1eC8276a87b74a9304D05442C7'
      }
    });

    // Altcoinchain Mainnet
    this.networks.set(2330, {
      name: 'Altcoinchain',
      chainId: 2330,
      rpcUrl: 'https://99.248.100.186:8645/',
      nativeCurrency: { name: 'ALT', symbol: 'ALT', decimals: 18 },
      blockExplorerUrl: 'https://alt-exp.outsidethebox.top/',
      contracts: {
        wToken: '0x48721ADeFE5b97101722c0866c2AffCE797C32b6',
        factory: '0x347aAc6D939f98854110Ff48dC5B7beB52D86445',
        router: '0xae168Ce47cebca9abbC5107a58df0532f1afa4d6',
        multicall: '0x426b13031851947ce04C51670a6E9C622B18aa3C',
        tokenMultisender: '0xCF110A9F7c705604190f9Dd6FDf0FC79D00D569B'
      }
    });

    // DOGEchain
    this.networks.set(2000, {
      name: 'DOGEchain',
      chainId: 2000,
      rpcUrl: 'https://rpc.dogechain.dog',
      nativeCurrency: { name: 'WDOGE', symbol: 'WDOGE', decimals: 18 },
      blockExplorerUrl: 'https://explorer.dogechain.dog',
      contracts: {
        wToken: '0xB7ddC6414bf4F5515b52D8BdD69973Ae205ff101',
        factory: '0x347aAc6D939f98854110Ff48dC5B7beB52D86445',
        router: '0xae168Ce47cebca9abbC5107a58df0532f1afa4d6',
        multicall: '0x426b13031851947ce04C51670a6E9C622B18aa3C',
        tokenMultisender: '0x5a03b79b6F4cbb1eC8276a87b74a9304D05442C7'
      }
    });

    // Fantom
    this.networks.set(250, {
      name: 'Fantom',
      chainId: 250,
      rpcUrl: 'https://rpc.ftm.tools',
      nativeCurrency: { name: 'Fantom', symbol: 'FTM', decimals: 18 },
      blockExplorerUrl: 'https://ftmscan.com',
      contracts: {
        wToken: '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83',
        factory: '0x347aAc6D939f98854110Ff48dC5B7beB52D86445',
        router: '0xae168Ce47cebca9abbC5107a58df0532f1afa4d6',
        multicall: '0x426b13031851947ce04C51670a6E9C622B18aa3C',
        tokenMultisender: '0x5a03b79b6F4cbb1eC8276a87b74a9304D05442C7'
      }
    });

    // Binance Smart Chain
    this.networks.set(56, {
      name: 'BSC',
      chainId: 56,
      rpcUrl: 'https://bsc-dataseed.binance.org',
      nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
      blockExplorerUrl: 'https://bscscan.com',
      contracts: {
        wToken: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
        factory: '0x347aAc6D939f98854110Ff48dC5B7beB52D86445',
        router: '0xae168Ce47cebca9abbC5107a58df0532f1afa4d6',
        multicall: '0x426b13031851947ce04C51670a6E9C622B18aa3C',
        tokenMultisender: '0x5a03b79b6F4cbb1eC8276a87b74a9304D05442C7'
      }
    });

    // Polygon
    this.networks.set(137, {
      name: 'Polygon',
      chainId: 137,
      rpcUrl: 'https://polygon-rpc.com',
      nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
      blockExplorerUrl: 'https://polygonscan.com',
      contracts: {
        wToken: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
        factory: '0x347aAc6D939f98854110Ff48dC5B7beB52D86445',
        router: '0xae168Ce47cebca9abbC5107a58df0532f1afa4d6',
        multicall: '0x426b13031851947ce04C51670a6E9C622B18aa3C',
        tokenMultisender: '0x5a03b79b6F4cbb1eC8276a87b74a9304D05442C7'
      }
    });

    // Ethereum Mainnet
    this.networks.set(1, {
      name: 'Ethereum',
      chainId: 1,
      rpcUrl: 'https://ethereum.publicnode.com',
      nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
      blockExplorerUrl: 'https://etherscan.io',
      contracts: {
        wToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        factory: '0x347aAc6D939f98854110Ff48dC5B7beB52D86445',
        router: '0xae168Ce47cebca9abbC5107a58df0532f1afa4d6',
        multicall: '0x426b13031851947ce04C51670a6E9C622B18aa3C',
        tokenMultisender: '0x5a03b79b6F4cbb1eC8276a87b74a9304D05442C7'
      }
    });

    // Avalanche
    this.networks.set(43114, {
      name: 'Avalanche',
      chainId: 43114,
      rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
      nativeCurrency: { name: 'AVAX', symbol: 'AVAX', decimals: 18 },
      blockExplorerUrl: 'https://snowtrace.io',
      contracts: {
        wToken: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7',
        factory: '0x347aAc6D939f98854110Ff48dC5B7beB52D86445',
        router: '0xae168Ce47cebca9abbC5107a58df0532f1afa4d6',
        multicall: '0x426b13031851947ce04C51670a6E9C622B18aa3C',
        tokenMultisender: '0x5a03b79b6F4cbb1eC8276a87b74a9304D05442C7'
      }
    });

    // Arbitrum
    this.networks.set(42161, {
      name: 'Arbitrum',
      chainId: 42161,
      rpcUrl: 'https://arb1.arbitrum.io/rpc',
      nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
      blockExplorerUrl: 'https://arbiscan.io',
      contracts: {
        wToken: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
        factory: '0x347aAc6D939f98854110Ff48dC5B7beB52D86445',
        router: '0xae168Ce47cebca9abbC5107a58df0532f1afa4d6',
        multicall: '0x426b13031851947ce04C51670a6E9C622B18aa3C',
        tokenMultisender: '0x5a03b79b6F4cbb1eC8276a87b74a9304D05442C7'
      }
    });

    // Optimism
    this.networks.set(10, {
      name: 'Optimism',
      chainId: 10,
      rpcUrl: 'https://mainnet.optimism.io',
      nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
      blockExplorerUrl: 'https://optimistic.etherscan.io',
      contracts: {
        wToken: '0x4200000000000000000000000000000000000006',
        factory: '0x347aAc6D939f98854110Ff48dC5B7beB52D86445',
        router: '0xae168Ce47cebca9abbC5107a58df0532f1afa4d6',
        multicall: '0x426b13031851947ce04C51670a6E9C622B18aa3C',
        tokenMultisender: '0x5a03b79b6F4cbb1eC8276a87b74a9304D05442C7'
      }
    });

    // Base
    this.networks.set(8453, {
      name: 'Base',
      chainId: 8453,
      rpcUrl: 'https://mainnet.base.org',
      nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
      blockExplorerUrl: 'https://basescan.org',
      contracts: {
        wToken: '0x4200000000000000000000000000000000000006',
        factory: '0x347aAc6D939f98854110Ff48dC5B7beB52D86445',
        router: '0xae168Ce47cebca9abbC5107a58df0532f1afa4d6',
        multicall: '0x426b13031851947ce04C51670a6E9C622B18aa3C',
        tokenMultisender: '0x5a03b79b6F4cbb1eC8276a87b74a9304D05442C7'
      }
    });
  }

  getNetwork(chainId: number): SwapinNetwork | null {
    return this.networks.get(chainId) || null;
  }

  getAllNetworks(): SwapinNetwork[] {
    return Array.from(this.networks.values());
  }

  getSupportedChainIds(): number[] {
    return Array.from(this.networks.keys());
  }

  async addNetworkToWallet(chainId: number): Promise<boolean> {
    const network = this.getNetwork(chainId);
    if (!network || !window.ethereum) return false;

    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: `0x${chainId.toString(16)}`,
          chainName: network.name,
          nativeCurrency: network.nativeCurrency,
          rpcUrls: [network.rpcUrl],
          blockExplorerUrls: [network.blockExplorerUrl]
        }]
      });
      return true;
    } catch (error) {
      console.error('Failed to add network:', error);
      return false;
    }
  }

  async switchToNetwork(chainId: number): Promise<boolean> {
    if (!window.ethereum) return false;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }]
      });
      return true;
    } catch (error: any) {
      console.error('Failed to switch network:', error);
      
      // If the error is because the chain is not added (code 4902) or any other error,
      // try to add the network first, then switch to it
      if (error.code === 4902 || error.message?.includes('Unrecognized chain ID')) {
        const addResult = await this.addNetworkToWallet(chainId);
        if (addResult) {
          // Try switching again after adding the network
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: `0x${chainId.toString(16)}` }]
            });
            return true;
          } catch (switchError) {
            console.error('Failed to switch after adding network:', switchError);
            return false;
          }
        }
        return false;
      }
      
      // For any other error, try adding the network as a fallback
      return await this.addNetworkToWallet(chainId);
    }
  }

  // Get trading pairs for a specific network
  async getTradingPairs(chainId: number): Promise<SwapinPair[]> {
    const network = this.getNetwork(chainId);
    if (!network) return [];

    // For Altcoinchain, return the custom pairs
    if (chainId === 2330) {
      return [
        {
          token0: '0x48721ADeFE5b97101722c0866c2AffCE797C32b6', // wALT
          token1: '0x6645143e49B3a15d8F205658903a55E520444698', // WATT
          symbol0: 'wALT',
          symbol1: 'WATT',
          reserve0: '1000000',
          reserve1: '1500000',
          totalSupply: '1225000',
          price0: 1.5,
          price1: 0.667
        },
        {
          token0: '0xd350ecd60912913cc15d312ef38adeca909ecdd5', // AltPEPE
          token1: '0xbb1f8b3a73a0b5084af9a95e748f9d84ddba6e88', // AltPEPI
          symbol0: 'AltPEPE',
          symbol1: 'AltPEPI',
          reserve0: '500000',
          reserve1: '750000',
          totalSupply: '612500',
          price0: 1.5,
          price1: 0.667
        },
        {
          token0: '0xd350ecd60912913cc15d312ef38adeca909ecdd5', // AltPEPE
          token1: '0x48721ADeFE5b97101722c0866c2AffCE797C32b6', // wALT
          symbol0: 'AltPEPE',
          symbol1: 'wALT',
          reserve0: '800000',
          reserve1: '400000',
          totalSupply: '565685',
          price0: 0.5,
          price1: 2.0
        },
        {
          token0: '0x75b37574c2317ccba905e2c628d949710627c20a', // SCAM
          token1: '0x48721ADeFE5b97101722c0866c2AffCE797C32b6', // wALT
          symbol0: 'SCAM',
          symbol1: 'wALT',
          reserve0: '1200000',
          reserve1: '300000',
          totalSupply: '600000',
          price0: 0.25,
          price1: 4.0
        },
        {
          token0: '0x67e7ebda5cba73f5830538b03e678a1b45517dd7', // SWAPD
          token1: '0x48721ADeFE5b97101722c0866c2AffCE797C32b6', // wALT
          symbol0: 'SWAPD',
          symbol1: 'wALT',
          reserve0: '600000',
          reserve1: '450000',
          totalSupply: '520000',
          price0: 0.75,
          price1: 1.333
        },
        {
          token0: '0xaf5d066eb3e4147325d3ed23f94bc925fbf3b9ef', // MALT
          token1: '0x48721ADeFE5b97101722c0866c2AffCE797C32b6', // wALT
          symbol0: 'MALT',
          symbol1: 'wALT',
          reserve0: '400000',
          reserve1: '320000',
          totalSupply: '358000',
          price0: 0.8,
          price1: 1.25
        },
        {
          token0: '0xd350ecd60912913cc15d312ef38adeca909ecdd5', // AltPEPE
          token1: '0x6645143e49B3a15d8F205658903a55E520444698', // WATT
          symbol0: 'AltPEPE',
          symbol1: 'WATT',
          reserve0: '350000',
          reserve1: '525000',
          totalSupply: '428000',
          price0: 1.5,
          price1: 0.667
        }
      ];
    }

    // Mock data for other networks
    return [
      {
        token0: network.contracts.wToken,
        token1: '0x0000000000000000000000000000000000000000', // Native token
        symbol0: `w${network.nativeCurrency.symbol}`,
        symbol1: network.nativeCurrency.symbol,
        reserve0: '1000000',
        reserve1: '1000000',
        totalSupply: '1000000',
        price0: 1.0,
        price1: 1.0
      }
    ];
  }

  // Calculate swap amounts using UniswapV2 formula
  calculateSwapAmount(amountIn: string, reserveIn: string, reserveOut: string): string {
    const amountInBN = BigInt(amountIn);
    const reserveInBN = BigInt(reserveIn);
    const reserveOutBN = BigInt(reserveOut);

    if (amountInBN === 0n || reserveInBN === 0n || reserveOutBN === 0n) {
      return '0';
    }

    const amountInWithFee = amountInBN * 997n;
    const numerator = amountInWithFee * reserveOutBN;
    const denominator = (reserveInBN * 1000n) + amountInWithFee;
    
    return (numerator / denominator).toString();
  }

  // Get contract ABIs
  getRouterABI() {
    return [
      'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
      'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
      'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
      'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)',
      'function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)',
      'function removeLiquidity(address tokenA, address tokenB, uint liquidity, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB)'
    ];
  }

  getFactoryABI() {
    return [
      'function getPair(address tokenA, address tokenB) external view returns (address pair)',
      'function createPair(address tokenA, address tokenB) external returns (address pair)',
      'function allPairs(uint) external view returns (address pair)',
      'function allPairsLength() external view returns (uint)'
    ];
  }

  getMulticallABI() {
    return [
      'function aggregate(tuple(address target, bytes callData)[] calls) external returns (uint256 blockNumber, bytes[] returnData)'
    ];
  }

  // Get token addresses for Altcoinchain
  getAltcoinchainTokens() {
    return {
      wALT: '0x48721ADeFE5b97101722c0866c2AffCE797C32b6',
      WATT: '0x6645143e49B3a15d8F205658903a55E520444698',
      AltPEPE: '0xd350ecd60912913cc15d312ef38adeca909ecdd5',
      AltPEPI: '0xbb1f8b3a73a0b5084af9a95e748f9d84ddba6e88',
      SCAM: '0x75b37574c2317ccba905e2c628d949710627c20a',
      SWAPD: '0x67e7ebda5cba73f5830538b03e678a1b45517dd7',
      MALT: '0xaf5d066eb3e4147325d3ed23f94bc925fbf3b9ef'
    };
  }

  // Get pool addresses for Altcoinchain
  getAltcoinchainPools() {
    return {
      'AltPEPE/AltPEPI': '0x284F01A8AB6542e8E257f289A2c4E851C7ebc82E',
      'AltPEPE/wALT': '0xB1297e255933E6c11bc72D6De2c911e4a05A18d8',
      'SCAM/wALT': '0x4d40fa6da5495f74f61af89008035062a0f66730',
      'SWAPD/wALT': '0x044e22b6276424d0b6e014Fd9E259D03C7b031bb',
      'MALT/wALT': '0xb9707EBc943AD698852dca99dAB8C973e1CD6BD8',
      'WATT/wALT': '0xb2F8e147d6a2570b19d1731401DDD5A4F62e2C33',
      'AltPEPE/WATT': '0xdC1f931aeFba25d1ad442c7235D9AEbAf51C9D01'
    };
  }
}

export const swapinService = new SwapinService();
export type { SwapinNetwork, SwapinPair };