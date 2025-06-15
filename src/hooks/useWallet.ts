import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

interface WalletState {
  address: string | null;
  balance: string;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  chainId: number | null;
}

export const useWallet = () => {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    balance: '0',
    isConnected: false,
    isConnecting: false,
    error: null,
    chainId: null,
  });

  const checkMetaMaskAvailability = useCallback(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    
    // Check if MetaMask is installed
    if (!window.ethereum) {
      setWallet(prev => ({
        ...prev,
        error: 'MetaMask is not installed. Please install MetaMask browser extension to continue.',
        isConnecting: false,
      }));
      return false;
    }

    // Check if it's specifically MetaMask (not another wallet)
    if (!window.ethereum.isMetaMask) {
      setWallet(prev => ({
        ...prev,
        error: 'MetaMask is not detected. Please make sure MetaMask is enabled and refresh the page.',
        isConnecting: false,
      }));
      return false;
    }

    return true;
  }, []);

  const connectWallet = useCallback(async () => {
    if (!checkMetaMaskAvailability()) {
      return;
    }

    setWallet(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found. Please unlock MetaMask.');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const balance = await provider.getBalance(address);
      const network = await provider.getNetwork();

      setWallet({
        address,
        balance: ethers.formatEther(balance),
        isConnected: true,
        isConnecting: false,
        error: null,
        chainId: Number(network.chainId),
      });
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
  }, [checkMetaMaskAvailability]);

  const disconnectWallet = useCallback(() => {
    setWallet({
      address: null,
      balance: '0',
      isConnected: false,
      isConnecting: false,
      error: null,
      chainId: null,
    });
  }, []);

  const switchNetwork = useCallback(async (chainId: string) => {
    if (!checkMetaMaskAvailability()) {
      return;
    }

    try {
      await window.ethereum.request({
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
    if (!checkMetaMaskAvailability()) {
      return;
    }

    // Check if already connected
    const checkConnection = async () => {
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_accounts',
        });

        if (accounts.length > 0) {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const balance = await provider.getBalance(accounts[0]);
          const network = await provider.getNetwork();

          setWallet({
            address: accounts[0],
            balance: ethers.formatEther(balance),
            isConnected: true,
            isConnecting: false,
            error: null,
            chainId: Number(network.chainId),
          });
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    };

    checkConnection();

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

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [checkMetaMaskAvailability, disconnectWallet]);

  return {
    ...wallet,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    isMetaMaskAvailable: checkMetaMaskAvailability(),
  };
};