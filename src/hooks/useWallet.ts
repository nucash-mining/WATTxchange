import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

interface WalletState {
  address: string | null;
  balance: string;
  altBalance: string;
  wattBalance: string;
  tokenBalances: Record<string, string>;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  chainId: number | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
}

export const useWallet = () => {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    balance: '0',
    altBalance: '0',
    wattBalance: '0',
    tokenBalances: {},
    isConnected: false,
    isConnecting: false,
    error: null,
    chainId: null,
    provider: null,
    signer: null,
  });

  const [isWalletAvailable, setIsWalletAvailable] = useState(false);

  const checkWalletAvailability = useCallback(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    
    // Check if any wallet provider is available
    const ethereum = window.ethereum;
    
    if (!ethereum) {
      setWallet(prev => ({
        ...prev,
        error: 'No Web3 wallet detected. Please install MetaMask or Rabby browser extension to continue.',
        isConnecting: false,
      }));
      return false;
    }

    return true;
  }, []);

  const refreshBalances = useCallback(async (provider: ethers.BrowserProvider, address: string) => {
    try {
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);
      
      // Fetch native balance (ETH, ALT, etc.)
      const nativeBalance = await provider.getBalance(address);
      
      let altBalance = '0';
      let wattBalance = '0';
      
      if (chainId === 2330) {
        // On Altcoinchain, native balance is ALT
        altBalance = ethers.formatEther(nativeBalance);
        
        // Fetch WATT token balance
        try {
          const wattContract = new ethers.Contract(
            '0x6645143e49B3a15d8F205658903a55E520444698',
            ['function balanceOf(address) view returns (uint256)'],
            provider
          );
          const wattBalanceWei = await wattContract.balanceOf(address);
          wattBalance = ethers.formatEther(wattBalanceWei);
        } catch (error) {
          console.error('Failed to fetch WATT balance:', error);
          wattBalance = '0';
        }
      } else {
        // On other networks, native balance is ETH/BNB/etc.
        altBalance = '0';
        wattBalance = '0';
      }
      
      setWallet(prev => ({
        ...prev,
        balance: ethers.formatEther(nativeBalance),
        altBalance,
        wattBalance,
      }));
    } catch (error) {
      console.error('Error refreshing balances:', error);
    }
  }, []);

  const connectWallet = useCallback(async () => {
    if (!checkWalletAvailability()) {
      return;
    }

    setWallet(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      const ethereum = window.ethereum;
      if (!ethereum) {
        throw new Error('No wallet provider found');
      }

      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found. Please unlock your wallet.');
      }

      const provider = new ethers.BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const balance = await provider.getBalance(address);
      const network = await provider.getNetwork();

      setWallet(prev => ({
        ...prev,
        address,
        balance: ethers.formatEther(balance),
        altBalance: '0',
        wattBalance: '0',
        isConnected: true,
        isConnecting: false,
        error: null,
        chainId: Number(network.chainId),
        provider,
        signer,
      }));

      // Refresh balances after connection
      await refreshBalances(provider, address);
    } catch (error: any) {
      let errorMessage = 'Failed to connect to wallet';
      
      if (error.code === 4001) {
        errorMessage = 'Connection rejected by user';
      } else if (error.code === -32002) {
        errorMessage = 'Wallet is already processing a request. Please check your wallet extension.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setWallet(prev => ({
        ...prev,
        isConnecting: false,
        error: errorMessage,
      }));
    }
  }, [checkWalletAvailability, refreshBalances]);

  const disconnectWallet = useCallback(() => {
    setWallet({
      address: null,
      balance: '0',
      altBalance: '0',
      wattBalance: '0',
      tokenBalances: {},
      isConnected: false,
      isConnecting: false,
      error: null,
      chainId: null,
      provider: null,
      signer: null,
    });
  }, []);

  const switchToAltcoinchain = useCallback(async () => {
    if (!checkWalletAvailability()) {
      return false;
    }

    try {
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

      const ethereum = window.ethereum;
      if (!ethereum) return false;

      try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: ALTCOINCHAIN_CONFIG.chainId }],
        });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [ALTCOINCHAIN_CONFIG],
          });
        } else {
          throw switchError;
        }
      }

      return true;
    } catch (error: any) {
      console.error('Failed to switch network:', error);
      setWallet(prev => ({
        ...prev,
        error: error.message || 'Failed to switch network',
      }));
      return false;
    }
  }, [checkWalletAvailability]);

  const signTransaction = async (transactionDetails: any): Promise<boolean> => {
    try {
      if (!wallet.signer) {
        setWallet(prev => ({
          ...prev,
          error: 'Please connect your wallet',
        }));
        return false;
      }

      // This is a simplified mock implementation
      console.log('Signing transaction:', transactionDetails);
      
      // Simulate successful signing
      return true;
    } catch (error: any) {
      console.error('Transaction signing failed:', error);
      setWallet(prev => ({
        ...prev,
        error: error.message || 'Transaction signing failed',
      }));
      return false;
    }
  };

  useEffect(() => {
    // Wait for the page to load and wallet to initialize
    const initializeWallet = async () => {
      // Wait a bit for wallet to load
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const isAvailable = checkWalletAvailability();
      setIsWalletAvailable(isAvailable);
      
      if (!isAvailable) {
        return;
      }

      // Check if already connected
      try {
        const ethereum = window.ethereum;
        if (!ethereum) return;

        const accounts = await ethereum.request({
          method: 'eth_accounts',
        });

        if (accounts.length > 0) {
          const provider = new ethers.BrowserProvider(ethereum);
          const signer = await provider.getSigner();
          const balance = await provider.getBalance(accounts[0]);
          const network = await provider.getNetwork();

          setWallet(prev => ({
            ...prev,
            address: accounts[0],
            balance: ethers.formatEther(balance),
            altBalance: '0',
            wattBalance: '0',
            isConnected: true,
            isConnecting: false,
            error: null,
            chainId: Number(network.chainId),
            provider,
            signer,
          }));

          // Refresh balances after reconnection
          await refreshBalances(provider, accounts[0]);
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    };

    // Initialize wallet detection
    if (typeof window !== 'undefined') {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeWallet);
      } else {
        initializeWallet();
      }
    }

    // Listen for wallet events only if it's available
    const setupEventListeners = () => {
      const ethereum = window.ethereum;
      if (!ethereum) return;

      // Listen for account changes
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          setWallet(prev => ({ ...prev, address: accounts[0] }));
        }
      };

      // Listen for chain changes
      const handleChainChanged = (chainId: string) => {
        const newChainId = parseInt(chainId, 16);
        setWallet(prev => ({ ...prev, chainId: newChainId }));
        
        // Refresh balances when chain changes
        if (wallet.provider && wallet.address) {
          refreshBalances(wallet.provider, wallet.address);
          refreshTokenBalances(wallet.provider, wallet.address);
        }
      };

      ethereum.on('accountsChanged', handleAccountsChanged);
      ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (ethereum.removeListener) {
          ethereum.removeListener('accountsChanged', handleAccountsChanged);
          ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    };

    const cleanup = setupEventListeners();

    return () => {
      if (cleanup) cleanup();
      document.removeEventListener('DOMContentLoaded', initializeWallet);
    };
  }, [checkWalletAvailability, disconnectWallet, refreshBalances]);

  return {
    ...wallet,
    connectWallet,
    disconnectWallet,
    switchToAltcoinchain,
    refreshBalances,
    signTransaction,
    isWalletAvailable,
    getTokenBalance: (symbol: string) => wallet.tokenBalances[symbol] || '0'
  };
};