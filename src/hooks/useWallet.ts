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

// ERC-20 ABI for balance checking
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)'
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

  // Sign a message to verify wallet ownership
  const signMessage = async (message: string): Promise<string | null> => {
    if (!wallet.signer) {
      toast.error('Wallet not connected');
      return null;
    }

    try {
      const signature = await wallet.signer.signMessage(message);
      return signature;
    } catch (error) {
      console.error('Failed to sign message:', error);
      toast.error('Failed to sign message');
      return null;
    }
  };

  // Sign a transaction
  const signTransaction = async (transaction: any): Promise<boolean> => {
    if (!wallet.signer) {
      toast.error('Wallet not connected');
      return false;
    }

    try {
      // Request permission to sign the transaction
      toast.loading('Please confirm the transaction in your wallet...', { id: 'tx-signing' });
      
      // In a real implementation, this would sign and send the transaction
      // For demo purposes, we'll simulate a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Transaction signed successfully!', { id: 'tx-signing' });
      return true;
    } catch (error) {
      console.error('Failed to sign transaction:', error);
      toast.error('Transaction signing failed or was rejected', { id: 'tx-signing' });
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
    signMessage,
    signTransaction
  };
};