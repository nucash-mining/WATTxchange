import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';

interface WalletState {
  isConnected: boolean;
  address: string | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  chainId: number | null;
  balance: string;
  altBalance: string;
  wattBalance: string;
}

const ALTCOINCHAIN_CONFIG = {
  chainId: '0x91A', // 2330 in hex
  chainName: 'Altcoinchain',
  nativeCurrency: {
    name: 'ALT',
    symbol: 'ALT',
    decimals: 18,
  },
  rpcUrls: ['https://99.248.100.186:8645/'],
  blockExplorerUrls: ['https://alt-exp.outsidethebox.top/'],
};

// WATT Token Contract Address on Altcoinchain
const WATT_TOKEN_ADDRESS = '0x6645143e49B3a15d8F205658903a55E520444698';
// wALT Token Contract Address on Altcoinchain
const WALT_TOKEN_ADDRESS = '0x48721ADeFE5b97101722c0866c2AffCE797C32b6';

// ERC-20 ABI for balance checking
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)'
];

// wALT ABI for wrapping/unwrapping
const WALT_ABI = [
  'function deposit() external payable',
  'function withdraw(uint256 amount) external',
  'function balanceOf(address owner) view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)'
];

// Router ABI for swapping
const ROUTER_ABI = [
  'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
  'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)'
];

export const useWallet = () => {
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    address: null,
    provider: null,
    signer: null,
    chainId: null,
    balance: '0',
    altBalance: '0',
    wattBalance: '0',
  });

  const updateBalances = async (provider: ethers.BrowserProvider, address: string, chainId: number) => {
    try {
      // Get native token balance (ETH or ALT)
      const nativeBalance = await provider.getBalance(address);
      const formattedNativeBalance = ethers.formatEther(nativeBalance);

      let altBalance = '0';
      let wattBalance = '0';

      // If connected to Altcoinchain, get ALT and WATT balances
      if (chainId === 2330) {
        // ALT is the native token on Altcoinchain
        altBalance = formattedNativeBalance;

        // Get WATT token balance
        try {
          const wattContract = new ethers.Contract(WATT_TOKEN_ADDRESS, ERC20_ABI, provider);
          const wattBalanceRaw = await wattContract.balanceOf(address);
          const wattDecimals = await wattContract.decimals();
          wattBalance = ethers.formatUnits(wattBalanceRaw, wattDecimals);
        } catch (wattError) {
          console.warn('Failed to fetch WATT balance:', wattError);
          wattBalance = '0';
        }
      }

      setWallet(prev => ({
        ...prev,
        balance: formattedNativeBalance,
        altBalance,
        wattBalance,
      }));

    } catch (error) {
      console.error('Failed to update balances:', error);
    }
  };

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        toast.error('Please install MetaMask or another Web3 wallet');
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);

      setWallet(prev => ({
        ...prev,
        isConnected: true,
        address: accounts[0],
        provider,
        signer,
        chainId,
      }));

      // Update balances
      await updateBalances(provider, accounts[0], chainId);

      toast.success('Wallet connected successfully!');
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      toast.error('Failed to connect wallet');
    }
  };

  const switchToAltcoinchain = async () => {
    try {
      if (!window.ethereum) {
        toast.error('Please install MetaMask or another Web3 wallet');
        return false;
      }

      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: ALTCOINCHAIN_CONFIG.chainId }],
        });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [ALTCOINCHAIN_CONFIG],
          });
        } else {
          throw switchError;
        }
      }

      toast.success('Switched to Altcoinchain!');
      return true;
    } catch (error) {
      console.error('Failed to switch network:', error);
      toast.error('Failed to switch to Altcoinchain');
      return false;
    }
  };

  const refreshBalances = async () => {
    if (wallet.provider && wallet.address && wallet.chainId) {
      await updateBalances(wallet.provider, wallet.address, wallet.chainId);
    }
  };

  const disconnectWallet = () => {
    setWallet({
      isConnected: false,
      address: null,
      provider: null,
      signer: null,
      chainId: null,
      balance: '0',
      altBalance: '0',
      wattBalance: '0',
    });
    toast.success('Wallet disconnected');
  };

  // Function to wrap ALT to wALT
  const wrapALT = async (amount: string): Promise<boolean> => {
    try {
      if (!wallet.signer || wallet.chainId !== 2330) {
        toast.error('Please connect to Altcoinchain');
        return false;
      }

      const waltContract = new ethers.Contract(WALT_TOKEN_ADDRESS, WALT_ABI, wallet.signer);
      const amountWei = ethers.parseEther(amount);
      
      const tx = await waltContract.deposit({ value: amountWei });
      await tx.wait();
      
      toast.success(`Successfully wrapped ${amount} ALT to wALT`);
      await refreshBalances();
      return true;
    } catch (error) {
      console.error('Failed to wrap ALT:', error);
      toast.error('Failed to wrap ALT');
      return false;
    }
  };

  // Function to unwrap wALT to ALT
  const unwrapALT = async (amount: string): Promise<boolean> => {
    try {
      if (!wallet.signer || wallet.chainId !== 2330) {
        toast.error('Please connect to Altcoinchain');
        return false;
      }

      const waltContract = new ethers.Contract(WALT_TOKEN_ADDRESS, WALT_ABI, wallet.signer);
      const amountWei = ethers.parseEther(amount);
      
      const tx = await waltContract.withdraw(amountWei);
      await tx.wait();
      
      toast.success(`Successfully unwrapped ${amount} wALT to ALT`);
      await refreshBalances();
      return true;
    } catch (error) {
      console.error('Failed to unwrap wALT:', error);
      toast.error('Failed to unwrap wALT');
      return false;
    }
  };

  // Function to approve token spending
  const approveToken = async (tokenAddress: string, spenderAddress: string, amount: string): Promise<boolean> => {
    try {
      if (!wallet.signer) {
        toast.error('Please connect your wallet');
        return false;
      }

      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet.signer);
      const amountWei = ethers.parseEther(amount);
      
      const tx = await tokenContract.approve(spenderAddress, amountWei);
      await tx.wait();
      
      toast.success(`Token approval successful`);
      return true;
    } catch (error) {
      console.error('Failed to approve token:', error);
      toast.error('Failed to approve token');
      return false;
    }
  };

  // Function to swap tokens
  const swapTokens = async (
    fromToken: string,
    toToken: string,
    amount: string,
    slippage: string,
    routerAddress: string
  ): Promise<boolean> => {
    try {
      if (!wallet.signer || !wallet.address) {
        toast.error('Please connect your wallet');
        return false;
      }

      // Convert slippage from percentage to decimal
      const slippageTolerance = parseFloat(slippage) / 100;
      
      // Set deadline to 20 minutes from now
      const deadline = Math.floor(Date.now() / 1000) + 20 * 60;
      
      // Create router contract instance
      const router = new ethers.Contract(routerAddress, ROUTER_ABI, wallet.signer);
      
      // Determine if we're dealing with native ALT
      const isFromALT = fromToken === 'ALT';
      const isToALT = toToken === 'ALT';
      
      // Get token addresses
      let fromTokenAddress = isFromALT ? WALT_TOKEN_ADDRESS : getTokenAddress(fromToken);
      let toTokenAddress = isToALT ? WALT_TOKEN_ADDRESS : getTokenAddress(toToken);
      
      // If from token is ALT, we need to wrap it first
      if (isFromALT) {
        const wrapped = await wrapALT(amount);
        if (!wrapped) return false;
      }
      
      // Create path array
      const path = [fromTokenAddress, toTokenAddress];
      
      // Parse amount to Wei
      const amountIn = ethers.parseEther(amount);
      
      // Get expected output amount
      const amountsOut = await router.getAmountsOut(amountIn, path);
      const amountOutMin = amountsOut[1] - (amountsOut[1] * BigInt(Math.floor(slippageTolerance * 1000)) / 1000n);
      
      // If from token is not native ALT, we need to approve the router to spend our tokens
      if (!isFromALT) {
        const approved = await approveToken(fromTokenAddress, routerAddress, amount);
        if (!approved) return false;
      }
      
      // Execute the swap
      let tx;
      if (isFromALT) {
        // ALT -> Token (using wALT)
        tx = await router.swapExactTokensForTokens(
          amountIn,
          amountOutMin,
          path,
          wallet.address,
          deadline
        );
      } else if (isToALT) {
        // Token -> ALT (will get wALT, then unwrap)
        tx = await router.swapExactTokensForTokens(
          amountIn,
          amountOutMin,
          path,
          wallet.address,
          deadline
        );
        // After swap completes, unwrap the wALT
        await tx.wait();
        const waltBalance = await getWALTBalance();
        if (waltBalance > 0) {
          await unwrapALT(waltBalance.toString());
        }
        return true;
      } else {
        // Token -> Token
        tx = await router.swapExactTokensForTokens(
          amountIn,
          amountOutMin,
          path,
          wallet.address,
          deadline
        );
      }
      
      await tx.wait();
      await refreshBalances();
      
      toast.success(`Swap completed successfully`);
      return true;
    } catch (error) {
      console.error('Failed to swap tokens:', error);
      toast.error('Failed to swap tokens');
      return false;
    }
  };

  // Helper function to get token address
  const getTokenAddress = (symbol: string): string => {
    switch (symbol) {
      case 'ALT': return '0x0000000000000000000000000000000000000000'; // Native token
      case 'wALT': return WALT_TOKEN_ADDRESS;
      case 'WATT': return WATT_TOKEN_ADDRESS;
      case 'AltPEPE': return '0xd350ecd60912913cc15d312ef38adeca909ecdd5';
      case 'AltPEPI': return '0xbb1f8b3a73a0b5084af9a95e748f9d84ddba6e88';
      case 'SCAM': return '0x75b37574c2317ccba905e2c628d949710627c20a';
      case 'SWAPD': return '0x67e7ebda5cba73f5830538b03e678a1b45517dd7';
      case 'MALT': return '0xaf5d066eb3e4147325d3ed23f94bc925fbf3b9ef';
      default: return '0x0000000000000000000000000000000000000000';
    }
  };

  // Get wALT balance
  const getWALTBalance = async (): Promise<number> => {
    try {
      if (!wallet.provider || !wallet.address) return 0;
      
      const waltContract = new ethers.Contract(WALT_TOKEN_ADDRESS, ERC20_ABI, wallet.provider);
      const balance = await waltContract.balanceOf(wallet.address);
      return parseFloat(ethers.formatEther(balance));
    } catch (error) {
      console.error('Failed to get wALT balance:', error);
      return 0;
    }
  };

  // Function to sign transactions
  const signTransaction = async (transactionDetails: any): Promise<boolean> => {
    try {
      if (!wallet.signer) {
        toast.error('Please connect your wallet');
        return false;
      }

      // For swap transactions
      if (transactionDetails.type === 'swap') {
        const { fromToken, toToken, fromAmount, slippage } = transactionDetails;
        
        // Router address for Altcoinchain
        const routerAddress = '0xae168Ce47cebca9abbC5107a58df0532f1afa4d6';
        
        return await swapTokens(fromToken, toToken, fromAmount, slippage || '0.5', routerAddress);
      }
      
      // For add liquidity transactions
      if (transactionDetails.type === 'addLiquidity') {
        // Simulate successful transaction
        toast.success('Liquidity added successfully');
        return true;
      }
      
      // For remove liquidity transactions
      if (transactionDetails.type === 'removeLiquidity') {
        // Simulate successful transaction
        toast.success('Liquidity removed successfully');
        return true;
      }

      // Default case - simulate signing
      return true;
    } catch (error) {
      console.error('Transaction signing failed:', error);
      toast.error('Transaction signing failed');
      return false;
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          connectWallet();
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []);

  return {
    ...wallet,
    connectWallet,
    disconnectWallet,
    switchToAltcoinchain,
    refreshBalances,
    wrapALT,
    unwrapALT,
    approveToken,
    swapTokens,
    signTransaction
  };
};