import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

interface WalletState {
  address: string | null;
  balance: string;
  altBalance: string;
  wattBalance: string;
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
    isConnected: false,
    isConnecting: false,
    error: null,
    chainId: null,
    provider: null,
    signer: null,
  });

  const [isMetaMaskAvailable, setIsMetaMaskAvailable] = useState(false);

  const checkMetaMaskAvailability = useCallback(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    
    // Wait for MetaMask to be fully loaded
    const ethereum = (window as any).ethereum;
    
    // Check if MetaMask is installed
    if (!ethereum) {
      setWallet(prev => ({
        ...prev,
        error: 'MetaMask is not installed. Please install MetaMask browser extension to continue.',
        isConnecting: false,
      }));
      return false;
    }

    // Check if it's specifically MetaMask (not another wallet)
    if (!ethereum.isMetaMask) {
      setWallet(prev => ({
        ...prev,
        error: 'MetaMask is not detected. Please make sure MetaMask is enabled and refresh the page.',
        isConnecting: false,
      }));
      return false;
    }

    return true;
  }, []);

  const refreshBalances = useCallback(async (provider: ethers.BrowserProvider, address: string) => {
    try {
      // Fetch ETH balance
      const ethBalance = await provider.getBalance(address);
      
      // Mock ALT and WATT balances - in a real app, these would be fetched from token contracts
      // For now, we'll simulate some balance values
      const altBalance = '0'; // This would be fetched from ALT token contract
      const wattBalance = '0'; // This would be fetched from WATT token contract
      
      setWallet(prev => ({
        ...prev,
        balance: ethers.formatEther(ethBalance),
        altBalance,
        wattBalance,
      }));
    } catch (error) {
      console.error('Error refreshing balances:', error);
    }
  }, []);

  const connectWallet = useCallback(async () => {
    if (!checkMetaMaskAvailability()) {
      return;
    }

    setWallet(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      const ethereum = (window as any).ethereum;
      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found. Please unlock MetaMask.');
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
      let errorMessage = 'Failed to connect to MetaMask';
      
      if (error.code === 4001) {
        errorMessage = 'Connection rejected by user';
      } else if (error.code === -32002) {
        errorMessage = 'MetaMask is already processing a request. Please check MetaMask.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setWallet(prev => ({
        ...prev,
        isConnecting: false,
        error: errorMessage,
      }));
    }
  }, [checkMetaMaskAvailability, refreshBalances]);

  const disconnectWallet = useCallback(() => {
    setWallet({
      address: null,
      balance: '0',
      altBalance: '0',
      wattBalance: '0',
      isConnected: false,
      isConnecting: false,
      error: null,
      chainId: null,
      provider: null,
      signer: null,
    });
  }, []);

  const switchNetwork = useCallback(async (chainId: string) => {
    if (!checkMetaMaskAvailability()) {
      return;
    }

    try {
      const ethereum = (window as any).ethereum;
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
      });
    } catch (error: any) {
      if (error.code === 4902) {
        // Network not added to MetaMask
        setWallet(prev => ({
          ...prev,
          error: 'Network not found in MetaMask. Please add the network manually.',
        }));
      } else {
        setWallet(prev => ({
          ...prev,
          error: error.message || 'Failed to switch network',
        }));
      }
    }
  }, [checkMetaMaskAvailability]);

  useEffect(() => {
    // Wait for the page to load and MetaMask to initialize
    const initializeWallet = async () => {
      // Wait a bit for MetaMask to load
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const isAvailable = checkMetaMaskAvailability();
      setIsMetaMaskAvailable(isAvailable);
      
      if (!isAvailable) {
        return;
      }

      // Check if already connected
      try {
        const ethereum = (window as any).ethereum;
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

    // Listen for MetaMask events only if it's available
    const setupEventListeners = () => {
      const ethereum = (window as any).ethereum;
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
        setWallet(prev => ({ ...prev, chainId: parseInt(chainId, 16) }));
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
  }, [checkMetaMaskAvailability, disconnectWallet, refreshBalances]);

  return {
    ...wallet,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    refreshBalances,
    isMetaMaskAvailable,
  };
};