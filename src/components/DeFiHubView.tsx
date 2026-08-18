import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRightLeft,
  Wallet,
  History,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Info,
  Zap,
  Shield,
  Globe,
  Cpu,
  Radio
} from 'lucide-react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import { wattxBridgeService, type BridgeQuote } from '../services/wattxBridgeService';
import MM2SwapInterface from './dex/MM2SwapInterface';
import WattWtxBridge from './bridge/WattWtxBridge';
import InstantSwap from './swap/InstantSwap';

// Site-themed styles (dark slate + amber/yellow accents) — matches the rest of the app
const vbStyles = {
  glow: {
    textShadow: '0 0 12px rgba(234,179,8,0.35)',
    color: '#eab308'
  },
  glowSubtle: {
    textShadow: 'none',
    color: '#fcd34d'
  },
  boxGlow: {
    boxShadow: '0 0 0 1px rgba(234,179,8,0.15)',
    border: '1px solid rgba(234,179,8,0.3)'
  }
};

// Chain configurations
const CHAINS = {
  polygon: {
    id: 137,
    name: 'POLYGON',
    symbol: 'MATIC',
    rpc: 'https://polygon-bor-rpc.publicnode.com',
    explorer: 'https://polygonscan.com',
    color: '#eab308',
    tokens: { WATT: '0xE960d5076cd3169C343Ee287A2c3380A222e5839' },
    bridge: { vault: '0xde9AC868db4C9f1F851106d6f358BB25F7B13cD0' }
  },
  wattx: {
    id: 22356,
    name: 'WATTX',
    symbol: 'WATT',
    rpc: 'https://rpc-wtx.wattxchange.app',
    explorer: 'https://wtx-explorer.wattxchange.app',
    color: '#fcd34d',
    tokens: { tWATTx: '0xe12e814b1f1a1781bf9ff2f9708d3b5d3334b2c2' },
    bridge: { tWATTx: '0xe12e814b1f1a1781bf9ff2f9708d3b5d3334b2c2' }
  },
  altcoinchain: {
    id: 2330,
    name: 'ALTCOINCHAIN',
    symbol: 'ALT',
    rpc: 'https://rpc.wattxchange.app',
    explorer: 'https://explorer.altcoinchain.org',
    color: '#f59e0b',
    tokens: {
      WATT: '0x6645143e49B3a15d8F205658903a55E520444698',
      wXMR: '0x2eb2230b406c73a34587d0aae4435ce4b548c296'
    },
    bridge: { vault: '0x0000000000000000000000000000000000000000' } // Deploy WATTxBridgePool on Altcoinchain
  }
};

type ChainKey = 'polygon' | 'wattx' | 'altcoinchain';

// Scanline overlay removed — it made the DeFi Hub hard to read. Kept as a no-op
// so existing <ScanlineOverlay /> usages compile without change.
const ScanlineOverlay: React.FC = () => null;

// Subtle neutral grid background (matches the app's dark theme)
const GridBackground: React.FC = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none">
    <div
      className="absolute inset-0"
      style={{
        backgroundImage: `
          linear-gradient(rgba(148,163,184,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(148,163,184,0.04) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
        animation: 'gridMove 20s linear infinite'
      }}
    />
    <style>{`
      @keyframes gridMove {
        0% { transform: perspective(500px) rotateX(60deg) translateY(0); }
        100% { transform: perspective(500px) rotateX(60deg) translateY(50px); }
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      @keyframes flicker {
        0%, 100% { opacity: 1; }
        92% { opacity: 1; }
        93% { opacity: 0.8; }
        94% { opacity: 1; }
        95% { opacity: 0.9; }
      }
    `}</style>
  </div>
);

// Virtual Boy style button
const VBButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  className?: string;
}> = ({ children, onClick, disabled, variant = 'primary', className = '' }) => (
  <motion.button
    onClick={onClick}
    disabled={disabled}
    className={`
      relative px-6 py-3 font-mono uppercase tracking-wider
      ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
      ${className}
    `}
    style={{
      background: variant === 'primary' ? '#ca8a04' : 'rgba(30,41,59,0.6)',
      border: `1px solid ${variant === 'primary' ? '#eab308' : 'rgba(148,163,184,0.3)'}`,
      color: variant === 'primary' ? '#0f172a' : '#e2e8f0',
      borderRadius: '0.5rem',
      textShadow: 'none',
      boxShadow: 'none'
    }}
    whileHover={!disabled ? {
      scale: 1.02,
      boxShadow: '0 0 16px rgba(234,179,8,0.25)'
    } : {}}
    whileTap={!disabled ? { scale: 0.98 } : {}}
  >
    {children}
  </motion.button>
);

// Virtual Boy style card
const VBCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <motion.div
    className={`relative rounded-xl ${className}`}
    style={{
      background: 'rgba(15, 23, 42, 0.7)',
      border: '1px solid rgba(148,163,184,0.15)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
    }}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
  >
    {/* Corner accents */}
    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-yellow-500/40 rounded-tl-xl" />
    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-yellow-500/40 rounded-tr-xl" />
    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-yellow-500/40 rounded-bl-xl" />
    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-yellow-500/40 rounded-br-xl" />
    {children}
  </motion.div>
);

// Animated wireframe logo
const WireframeLogo: React.FC<{ chain: 'polygon' | 'wattx' | 'altcoinchain'; size?: number }> = ({ chain, size = 60 }) => (
  <motion.div
    className="relative"
    style={{ width: size, height: size }}
    animate={{ rotateY: [0, 360] }}
    transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
  >
    <svg viewBox="0 0 100 100" className="w-full h-full">
      {chain === 'polygon' ? (
        // Polygon wireframe hexagon
        <g stroke="#eab308" strokeWidth="2" fill="none" style={{ filter: 'drop-shadow(0 0 5px #eab308)' }}>
          <polygon points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" />
          <polygon points="50,20 80,35 80,65 50,80 20,65 20,35" />
          <line x1="50" y1="5" x2="50" y2="20" />
          <line x1="95" y1="27.5" x2="80" y2="35" />
          <line x1="95" y1="72.5" x2="80" y2="65" />
          <line x1="50" y1="95" x2="50" y2="80" />
          <line x1="5" y1="72.5" x2="20" y2="65" />
          <line x1="5" y1="27.5" x2="20" y2="35" />
        </g>
      ) : chain === 'altcoinchain' ? (
        // Altcoinchain wireframe - stylized 'A' with chain links
        <g stroke="#f59e0b" strokeWidth="2" fill="none" style={{ filter: 'drop-shadow(0 0 5px #f59e0b)' }}>
          <path d="M50,10 L20,85 M50,10 L80,85 M30,60 L70,60" />
          <circle cx="50" cy="10" r="8" />
          <circle cx="20" cy="85" r="8" />
          <circle cx="80" cy="85" r="8" />
          <circle cx="50" cy="50" r="40" strokeDasharray="8,4" />
        </g>
      ) : (
        // WATTx wireframe lightning bolt
        <g stroke="#fcd34d" strokeWidth="2" fill="none" style={{ filter: 'drop-shadow(0 0 5px #fcd34d)' }}>
          <path d="M60,5 L25,50 L45,50 L35,95 L75,45 L55,45 Z" />
          <circle cx="50" cy="50" r="45" strokeDasharray="5,5" />
        </g>
      )}
    </svg>
  </motion.div>
);

const DeFiHubView: React.FC = () => {
  const [sourceChain, setSourceChain] = useState<ChainKey>('polygon');
  const [destChain, setDestChain] = useState<ChainKey>('wattx');
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBridging, setIsBridging] = useState(false);
  // DeFi Hub sub-tabs are URL-addressable: #/defi/bridge, #/defi/instant-swap,
  // #/defi/atomic-swap (also reachable at defi.wattxchange.app/<seg>).
  type DefiTab = 'bridge' | 'instant' | 'swap';
  const TAB_SEG: Record<DefiTab, string> = { bridge: 'bridge', instant: 'instant-swap', swap: 'atomic-swap' };
  const TAB_LABEL: Record<DefiTab, string> = { bridge: 'Bridge', instant: 'Instant Swap', swap: 'Atomic Swap' };
  const SEG_TAB: Record<string, DefiTab> = { bridge: 'bridge', 'instant-swap': 'instant', 'atomic-swap': 'swap' };
  const tabFromHash = (): DefiTab => SEG_TAB[window.location.hash.replace(/^#\/?/, '').split('/')[1]?.toLowerCase()] ?? 'bridge';

  const [activeTab, setActiveTab] = useState<DefiTab>(tabFromHash);
  const selectTab = (t: DefiTab) => {
    setActiveTab(t);
    const target = `#/defi/${TAB_SEG[t]}`;
    if (window.location.hash !== target) window.location.hash = target;
  };
  useEffect(() => {
    const onHash = () => setActiveTab(tabFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Instant Swap hands off GleecDEX (kdf) routes to the Swap tab, since those
  // execute as a trustless atomic swap in the user's browser.
  useEffect(() => {
    const goDex = (e: Event) => {
      const d = (e as CustomEvent).detail as { base?: string; rel?: string } | undefined;
      if (d?.base && d?.rel) {
        window.dispatchEvent(new CustomEvent('wattx:dex-pair', { detail: d }));
      }
      selectTab('swap');
    };
    window.addEventListener('wattx:goto-dex', goDex);
    return () => window.removeEventListener('wattx:goto-dex', goDex);
  }, []);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [balances, setBalances] = useState({
    polygon: { MATIC: '0', WATT: '0' },
    wattx: { WATT: '0', tWATTx: '0' },
    altcoinchain: { ALT: '0', WATT: '0', wXMR: '0' }
  });
  const [poolLiquidity, setPoolLiquidity] = useState({
    polygon: '0',
    wattx: '0',
    altcoinchain: '0'
  });
  const [bridgeQuote, setBridgeQuote] = useState<BridgeQuote | null>(null);

  // Fetch pool liquidity
  const fetchPoolLiquidity = async () => {
    try {
      const [polygonLiq, wattxLiq, altLiq] = await Promise.all([
        wattxBridgeService.getAvailableLiquidity('polygon'),
        wattxBridgeService.getAvailableLiquidity('wattx'),
        wattxBridgeService.getAvailableLiquidity('altcoinchain')
      ]);
      setPoolLiquidity({
        polygon: polygonLiq,
        wattx: wattxLiq,
        altcoinchain: altLiq
      });
    } catch (err) {
      console.error('Failed to fetch pool liquidity:', err);
    }
  };

  // Update quote when amount or chains change
  useEffect(() => {
    const updateQuote = async () => {
      if (amount && parseFloat(amount) > 0) {
        const quote = await wattxBridgeService.getBridgeQuote(
          sourceChain as any,
          destChain as any,
          amount
        );
        setBridgeQuote(quote);
      } else {
        setBridgeQuote(null);
      }
    };
    updateQuote();
  }, [amount, sourceChain, destChain]);

  // Check wallet on mount and fetch pool liquidity
  useEffect(() => {
    const checkWallet = async () => {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        try {
          const accounts = await (window as any).ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setWalletConnected(true);
            setWalletAddress(accounts[0]);
            fetchBalances(accounts[0]);
          }
        } catch (err) {
          console.error('Wallet check error:', err);
        }
      }
    };
    checkWallet();
    fetchPoolLiquidity();

    // Refresh liquidity every 30 seconds
    const interval = setInterval(fetchPoolLiquidity, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchBalances = async (address: string) => {
    setIsLoading(true);
    const wattAbi = ['function balanceOf(address) view returns (uint256)'];
    try {
      // Fetch Polygon balances (own try/catch — a dead Polygon RPC must NOT
      // prevent the Altcoinchain/WATTx reads below from running).
      try {
        const polygonProvider = new ethers.JsonRpcProvider(CHAINS.polygon.rpc);
        const maticBalance = await polygonProvider.getBalance(address);
        const polygonWattContract = new ethers.Contract(CHAINS.polygon.tokens.WATT, wattAbi, polygonProvider);
        const polygonWattBalance = await polygonWattContract.balanceOf(address);

        setBalances(prev => ({
          ...prev,
          polygon: {
            MATIC: ethers.formatEther(maticBalance),
            WATT: ethers.formatEther(polygonWattBalance)
          }
        }));
      } catch (err) {
        console.log('Polygon not available:', err);
      }

      // Fetch Altcoinchain balances (try/catch separately to not block other chains)
      try {
        const altProvider = new ethers.JsonRpcProvider(CHAINS.altcoinchain.rpc);
        const altBalance = await altProvider.getBalance(address);

        // Try to fetch WATT balance on Altcoinchain if contract exists
        let altWattBalance = '0';
        try {
          const altWattContract = new ethers.Contract(CHAINS.altcoinchain.tokens.WATT, wattAbi, altProvider);
          altWattBalance = ethers.formatEther(await altWattContract.balanceOf(address));
        } catch { /* Contract may not be deployed yet */ }

        // Try to fetch wXMR balance
        let wXMRBalance = '0';
        try {
          const wXMRContract = new ethers.Contract(CHAINS.altcoinchain.tokens.wXMR, wattAbi, altProvider);
          wXMRBalance = ethers.formatEther(await wXMRContract.balanceOf(address));
        } catch { /* Contract may not be deployed yet */ }

        setBalances(prev => ({
          ...prev,
          altcoinchain: {
            ALT: ethers.formatEther(altBalance),
            WATT: altWattBalance,
            wXMR: wXMRBalance
          }
        }));
      } catch (err) {
        console.log('Altcoinchain not available:', err);
      }

      // Fetch WATTx balances (try/catch separately)
      try {
        const wattxProvider = new ethers.JsonRpcProvider(CHAINS.wattx.rpc);
        const wattxBalance = await wattxProvider.getBalance(address);

        let tWATTxBalance = '0';
        try {
          const tWATTxContract = new ethers.Contract(CHAINS.wattx.tokens.tWATTx, wattAbi, wattxProvider);
          tWATTxBalance = ethers.formatEther(await tWATTxContract.balanceOf(address));
        } catch { /* Contract may not be deployed yet */ }

        setBalances(prev => ({
          ...prev,
          wattx: {
            WATT: ethers.formatEther(wattxBalance),
            tWATTx: tWATTxBalance
          }
        }));
      } catch (err) {
        console.log('WATTx not available:', err);
      }
    } catch (err) {
      console.error('Balance fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const connectWallet = async () => {
    if ((window as any).ethereum) {
      try {
        const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        setWalletConnected(true);
        setWalletAddress(accounts[0]);
        fetchBalances(accounts[0]);
        toast.success('WALLET LINKED', { style: { background: '#1a0000', color: '#eab308', border: '1px solid #eab308' } });
      } catch (err: any) {
        toast.error(err.message);
      }
    }
  };

  const switchDirection = () => {
    setSourceChain(destChain);
    setDestChain(sourceChain);
    setAmount('');
  };

  const source = CHAINS[sourceChain];
  const dest = CHAINS[destChain];

  // Get available destination chains (exclude source)
  const availableDestChains = (Object.keys(CHAINS) as ChainKey[]).filter(k => k !== sourceChain);

  // Helper to get the primary bridgeable token for a chain
  const getSourceToken = () => {
    if (sourceChain === 'polygon') return 'WATT';
    if (sourceChain === 'wattx') return 'tWATTx';
    if (sourceChain === 'altcoinchain') return 'WATT';
    return 'WATT';
  };

  const getDestToken = () => {
    if (destChain === 'polygon') return 'WATT';
    if (destChain === 'wattx') return 'tWATTx';
    if (destChain === 'altcoinchain') return 'WATT';
    return 'WATT';
  };

  const getSourceBalance = () => {
    if (sourceChain === 'polygon') return balances.polygon.WATT;
    if (sourceChain === 'wattx') return balances.wattx.tWATTx;
    if (sourceChain === 'altcoinchain') return balances.altcoinchain.WATT;
    return '0';
  };

  // Helper to get chain hex ID
  const getChainHex = (chainId: number) => '0x' + chainId.toString(16);

  // Helper to switch/add network
  const switchToChain = async (ethereum: any, chainKey: ChainKey) => {
    const chain = CHAINS[chainKey];
    const chainHex = getChainHex(chain.id);

    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainHex }],
      });
    } catch (switchError: any) {
      // Chain not added, try to add it
      if (switchError.code === 4902) {
        const chainConfig: any = {
          chainId: chainHex,
          chainName: chain.name,
          nativeCurrency: { name: chain.symbol, symbol: chain.symbol, decimals: 18 },
          rpcUrls: [chain.rpc],
          blockExplorerUrls: [chain.explorer]
        };

        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [chainConfig],
        });
      } else {
        throw switchError;
      }
    }
  };

  // Bridge function - triggers actual wallet transaction
  const handleBridge = async () => {
    if (!walletConnected || !amount || parseFloat(amount) <= 0) return;

    setIsBridging(true);

    try {
      const ethereum = (window as any).ethereum;
      if (!ethereum) throw new Error('No wallet detected');

      const provider = new ethers.BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      // Check current chain
      const network = await provider.getNetwork();
      const currentChainId = Number(network.chainId);

      // Ensure we're on the source chain
      if (currentChainId !== source.id) {
        toast.error(`SWITCH TO ${source.name} NETWORK`, { style: { background: '#1a0000', color: '#eab308', border: '1px solid #eab308' } });
        try {
          await switchToChain(ethereum, sourceChain);
        } catch (switchError: any) {
          throw new Error(`Please switch to ${source.name} network`);
        }
        setIsBridging(false);
        return;
      }

      const amountWei = ethers.parseEther(amount);
      const recipientAddress = recipient || userAddress;

      // Handle bridging based on source chain
      if (sourceChain === 'polygon') {
        // Bridging FROM Polygon
        toast.loading('CHECKING APPROVAL...', { id: 'bridge', style: { background: '#1a0000', color: '#eab308', border: '1px solid #eab308' } });

        const wattContract = new ethers.Contract(
          CHAINS.polygon.tokens.WATT,
          [
            'function allowance(address owner, address spender) view returns (uint256)',
            'function approve(address spender, uint256 amount) returns (bool)'
          ],
          signer
        );

        const currentAllowance = await wattContract.allowance(userAddress, CHAINS.polygon.bridge.vault);

        if (currentAllowance < amountWei) {
          toast.loading('APPROVE WATT SPENDING...', { id: 'bridge', style: { background: '#1a0000', color: '#eab308', border: '1px solid #eab308' } });
          const approveTx = await wattContract.approve(CHAINS.polygon.bridge.vault, ethers.MaxUint256);
          await approveTx.wait();
          toast.success('APPROVAL CONFIRMED', { id: 'bridge', style: { background: '#1a0000', color: '#00ff00', border: '1px solid #00ff00' } });
        }

        toast.loading('INITIATING BRIDGE...', { id: 'bridge', style: { background: '#1a0000', color: '#eab308', border: '1px solid #eab308' } });

        // Determine bridge function based on destination
        const vaultContract = new ethers.Contract(
          CHAINS.polygon.bridge.vault,
          [
            'function bridgeToWATTx(address recipient, uint256 amount)',
            'function bridgeToAltcoinchain(address recipient, uint256 amount)'
          ],
          signer
        );

        let bridgeTx;
        if (destChain === 'wattx') {
          bridgeTx = await vaultContract.bridgeToWATTx(recipientAddress, amountWei);
        } else if (destChain === 'altcoinchain') {
          bridgeTx = await vaultContract.bridgeToAltcoinchain(recipientAddress, amountWei);
        }

        toast.loading('CONFIRMING LOCK TX...', { id: 'bridge', style: { background: '#1a0000', color: '#eab308', border: '1px solid #eab308' } });
        const receipt = await bridgeTx.wait();

        toast.success(
          `BRIDGE INITIATED! TX: ${receipt.hash.slice(0, 10)}...`,
          { id: 'bridge', duration: 10000, style: { background: '#1a0000', color: '#00ff00', border: '1px solid #00ff00' } }
        );

      } else if (sourceChain === 'wattx') {
        // Bridging FROM WATTx
        toast.loading('INITIATING BURN...', { id: 'bridge', style: { background: '#1a0000', color: '#eab308', border: '1px solid #eab308' } });

        const tWATTxContract = new ethers.Contract(
          CHAINS.wattx.tokens.tWATTx,
          ['function burn(uint256 amount, address recipient, uint256 destChainId)'],
          signer
        );

        const burnTx = await tWATTxContract.burn(amountWei, recipientAddress, dest.id);

        toast.loading('CONFIRMING BURN TX...', { id: 'bridge', style: { background: '#1a0000', color: '#eab308', border: '1px solid #eab308' } });
        const receipt = await burnTx.wait();

        toast.success(
          `BURN INITIATED! TX: ${receipt.hash.slice(0, 10)}...`,
          { id: 'bridge', duration: 10000, style: { background: '#1a0000', color: '#00ff00', border: '1px solid #00ff00' } }
        );

      } else if (sourceChain === 'altcoinchain') {
        // Bridging FROM Altcoinchain
        toast.loading('CHECKING APPROVAL...', { id: 'bridge', style: { background: '#1a0000', color: '#eab308', border: '1px solid #eab308' } });

        const wattContract = new ethers.Contract(
          CHAINS.altcoinchain.tokens.WATT,
          [
            'function allowance(address owner, address spender) view returns (uint256)',
            'function approve(address spender, uint256 amount) returns (bool)'
          ],
          signer
        );

        const currentAllowance = await wattContract.allowance(userAddress, CHAINS.altcoinchain.bridge.vault);

        if (currentAllowance < amountWei) {
          toast.loading('APPROVE WATT SPENDING...', { id: 'bridge', style: { background: '#1a0000', color: '#eab308', border: '1px solid #eab308' } });
          const approveTx = await wattContract.approve(CHAINS.altcoinchain.bridge.vault, ethers.MaxUint256);
          await approveTx.wait();
          toast.success('APPROVAL CONFIRMED', { id: 'bridge', style: { background: '#1a0000', color: '#00ff00', border: '1px solid #00ff00' } });
        }

        toast.loading('INITIATING BRIDGE...', { id: 'bridge', style: { background: '#1a0000', color: '#eab308', border: '1px solid #eab308' } });

        const vaultContract = new ethers.Contract(
          CHAINS.altcoinchain.bridge.vault,
          ['function bridgeOut(address recipient, uint256 amount, uint256 destChainId)'],
          signer
        );

        const bridgeTx = await vaultContract.bridgeOut(recipientAddress, amountWei, dest.id);

        toast.loading('CONFIRMING LOCK TX...', { id: 'bridge', style: { background: '#1a0000', color: '#eab308', border: '1px solid #eab308' } });
        const receipt = await bridgeTx.wait();

        toast.success(
          `BRIDGE INITIATED! TX: ${receipt.hash.slice(0, 10)}...`,
          { id: 'bridge', duration: 10000, style: { background: '#1a0000', color: '#00ff00', border: '1px solid #00ff00' } }
        );
      }

      // Refresh balances
      fetchBalances(userAddress);
      setAmount('');

    } catch (err: any) {
      console.error('Bridge error:', err);
      toast.error(err.message || 'BRIDGE FAILED', { id: 'bridge', style: { background: '#1a0000', color: '#eab308', border: '1px solid #eab308' } });
    } finally {
      setIsBridging(false);
    }
  };

  return (
    <div className="relative min-h-screen font-mono" style={{ background: '#0a0000' }}>
      <GridBackground />
      <ScanlineOverlay />

      <div className="relative z-10 space-y-6 p-4">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ animation: 'flicker 4s infinite' }}
        >
          <div>
            <h1
              className="text-3xl md:text-4xl font-bold tracking-widest uppercase"
              style={vbStyles.glow}
            >
              ◢ DEFI BRIDGE ◣
            </h1>
            <p className="text-yellow-800 mt-1 text-sm tracking-wide">
              &gt;&gt; CROSS-CHAIN ASSET TRANSFER SYSTEM &lt;&lt;
            </p>
          </div>

          {walletConnected ? (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-yellow-500 text-xs">LINKED WALLET</p>
                <p className="text-yellow-400 font-bold" style={vbStyles.glowSubtle}>
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </p>
              </div>
              <motion.button
                onClick={() => fetchBalances(walletAddress)}
                className="p-2 border border-yellow-800"
                style={{ color: '#eab308' }}
                whileHover={{ boxShadow: '0 0 15px #eab308' }}
                whileTap={{ scale: 0.9 }}
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </motion.button>
            </div>
          ) : (
            <VBButton onClick={connectWallet}>
              <span className="flex items-center gap-2">
                <Radio className="w-4 h-4" />
                LINK WALLET
              </span>
            </VBButton>
          )}
        </motion.div>

        {/* Stats Display */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'POLYGON BALANCE', value: `${parseFloat(balances.polygon.WATT).toFixed(4)} WATT`, sub: `Pool: ${parseFloat(poolLiquidity.polygon).toFixed(2)}` },
            { label: 'WATTX BALANCE', value: `${parseFloat(balances.wattx.tWATTx).toFixed(4)} WATT`, sub: `Pool: ${parseFloat(poolLiquidity.wattx).toFixed(2)}` },
            { label: 'ALTCOIN BALANCE', value: `${parseFloat(balances.altcoinchain.WATT).toFixed(4)} WATT`, sub: `Pool: ${parseFloat(poolLiquidity.altcoinchain).toFixed(2)}` },
            { label: 'TOTAL LIQUIDITY', value: `${(parseFloat(poolLiquidity.polygon) + parseFloat(poolLiquidity.wattx) + parseFloat(poolLiquidity.altcoinchain)).toFixed(2)}`, sub: 'ALL POOLS' },
            { label: 'BRIDGE FEE', value: '0.1%', sub: 'PER TX' },
            { label: 'BACKING', value: '100%', sub: 'BY WATTX' }
          ].map((stat, i) => (
            <VBCard key={i} className="p-4">
              <p className="text-yellow-800 text-xs mb-1">{stat.label}</p>
              <p className="text-lg font-bold" style={vbStyles.glowSubtle}>{stat.value}</p>
              <p className="text-yellow-900 text-xs">{stat.sub}</p>
            </VBCard>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="flex border border-yellow-900">
          {(['bridge', 'instant', 'swap'] as DefiTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => selectTab(tab)}
              className={`flex-1 py-3 uppercase tracking-wider text-sm transition-all ${
                activeTab === tab
                  ? 'bg-yellow-900/30 text-yellow-400'
                  : 'text-yellow-800 hover:text-yellow-600'
              }`}
              style={activeTab === tab ? vbStyles.glowSubtle : {}}
            >
              {TAB_LABEL[tab]}
            </button>
          ))}
        </div>

        {/* Bridge Interface */}
        <AnimatePresence mode="wait">
          {activeTab === 'bridge' && (
            <motion.div
              key="bridge"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <WattWtxBridge />
            </motion.div>
          )}

          {activeTab === 'instant' && (
            <motion.div
              key="instant"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <InstantSwap />
            </motion.div>
          )}

          {activeTab === 'swap' && (
            <motion.div
              key="swap"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <MM2SwapInterface />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="text-center text-yellow-900 text-xs py-4">
          <p>◢◤ WATTX DEFI BRIDGE v1.1 ◢◤</p>
          <p className="mt-1">POLYGON ↔ WATTX ↔ ALTCOINCHAIN CROSS-CHAIN PROTOCOL</p>
        </div>
      </div>
    </div>
  );
};

export default DeFiHubView;
