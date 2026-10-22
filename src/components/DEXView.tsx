import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, BarChart3, DollarSign, Network, Key, AlertTriangle, ChevronDown, Check } from 'lucide-react';
import { usePrices } from '../hooks/usePrices';
import { useWallet } from '../hooks/useWallet';
import OrderBook from './dex/OrderBook';
import TradingChart from './dex/TradingChart';
import TradeForm from './dex/TradeForm';
import LiquidityPools from './dex/LiquidityPools';
import SwapInterface from './dex/SwapInterface';
import SwapinV2Interface from './dex/SwapinV2Interface';
import CrossChainBridge from './dex/AxelarBridgeInterface';
import TradingTerminal from './dex/TradingTerminal';
import ExchangeApiManager from './dex/ExchangeApiManager';
import EnhancedAtomicSwapInterface from './swap/EnhancedAtomicSwapInterface';
import NavigatorPerpInterface from './dex/NavigatorPerpInterface';
import SonicBridgeInterface from './dex/SonicBridgeInterface';
import { MoneroBridgeInterface } from './bridge/MoneroBridgeInterface';

type DexTab =
  'uniswap' | 'spot' | 'pools' | 'multichain' | 'bridge' | 'perps' | 'atomic' | 'navigator' | 'sonic' | 'monero';

// Desktop pill order.
const DEX_TABS: { id: DexTab; label: string }[] = [
  { id: 'perps', label: 'Trade' },
  { id: 'uniswap', label: 'Swapin V2' },
  { id: 'multichain', label: 'Multi-Chain' },
  { id: 'spot', label: 'Spot' },
  { id: 'pools', label: 'Pools' },
  { id: 'bridge', label: 'Bridge' },
  { id: 'atomic', label: 'Atomic Swaps' },
  { id: 'navigator', label: 'Navigator PERP' },
  { id: 'sonic', label: 'Sonic Bridge' },
  { id: 'monero', label: 'Monero Bridge' },
];

type DexTabGroup = { label: string; items: { id: DexTab; label: string }[] };

// Mobile groups: one dropdown each, so a phone shows four buttons instead of twelve pills.
const DEX_TAB_GROUPS: DexTabGroup[] = [
  { label: 'Trade', items: [
    { id: 'spot', label: 'Spot' },
    { id: 'perps', label: 'Trading Terminal' },
    { id: 'navigator', label: 'Navigator PERP' },
  ] },
  { label: 'Swap', items: [
    { id: 'multichain', label: 'Multi-Chain' },
    { id: 'uniswap', label: 'Swapin V2' },
    { id: 'atomic', label: 'Atomic Swaps' },
  ] },
  { label: 'Bridge', items: [
    { id: 'bridge', label: 'Bridge' },
    { id: 'sonic', label: 'Sonic Bridge' },
    { id: 'monero', label: 'Monero Bridge' },
  ] },
  { label: 'Liquidity', items: [
    { id: 'pools', label: 'Pools' },
  ] },
];

const DexTabMenu: React.FC<{ group: DexTabGroup; activeTab: DexTab; onSelect: (t: DexTab) => void }> = ({ group, activeTab, onSelect }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = group.items.find((i) => i.id === activeTab);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border transition-colors text-left ${
          current ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800/50 border-slate-700 text-slate-300'
        }`}
      >
        <span className="min-w-0">
          <span className="block text-[11px] uppercase tracking-wide opacity-70">{group.label}</span>
          <span className="block text-sm font-medium truncate">{current?.label ?? 'Choose…'}</span>
        </span>
        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 z-30 mt-1 rounded-lg border border-slate-700 bg-slate-900 shadow-xl overflow-hidden">
          {group.items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => { onSelect(item.id); setOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-sm text-left ${
                item.id === activeTab ? 'bg-blue-600/20 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              {item.label}
              {item.id === activeTab && <Check className="w-4 h-4 text-blue-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const DEXView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DexTab>('perps');
  const { getPrice } = usePrices(['ALT', 'BTC', 'ETH']);
  const [showApiManager, setShowApiManager] = useState(false);
  const { isConnected, connectWallet } = useWallet();

  const altPrice = getPrice('ALT');
  const volume24h = altPrice ? altPrice.volume24h * altPrice.price : 0;

  const stats = [
    {
      label: '24h Volume',
      value: `$${volume24h.toLocaleString()}`,
      change: altPrice ? `+${altPrice.changePercent24h.toFixed(1)}%` : '+0%',
      icon: BarChart3,
      color: 'text-emerald-400'
    },
    {
      label: 'Total Liquidity',
      value: '$15.8M',
      change: '+5.2%',
      icon: DollarSign,
      color: 'text-blue-400'
    },
    {
      label: 'Active Networks',
      value: '10',
      change: '+2',
      icon: Network,
      color: 'text-purple-400'
    },
    {
      label: 'Active Pairs',
      value: '124',
      change: '+8',
      icon: TrendingUp,
      color: 'text-yellow-400'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">Decentralized Exchange</h2>
          <p className="text-slate-400 mt-1">Multi-chain trading powered by Swapin.co</p>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <motion.button
            onClick={() => setShowApiManager(true)}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-colors self-start md:self-auto"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Key className="w-4 h-4" />
            <span>API Keys</span>
          </motion.button>

          {/* Mobile: tabs grouped into dropdown menus */}
          <div className="grid grid-cols-2 gap-2 md:hidden">
            {DEX_TAB_GROUPS.map((group) => (
              <DexTabMenu key={group.label} group={group} activeTab={activeTab} onSelect={setActiveTab} />
            ))}
          </div>

          {/* Desktop: flat pills */}
          <div className="hidden md:flex flex-wrap items-center gap-2 bg-slate-800/50 rounded-lg p-1">
            {DEX_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Stats (terminal tab has its own dense stats bar) */}
      {activeTab !== 'perps' && (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className={`text-sm ${stat.color}`}>{stat.change}</p>
                </div>
                <Icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </motion.div>
          );
        })}
      </div>
      )}

      {/* Wallet Connection Notice */}
      {!isConnected && (
        <motion.div
          className="bg-yellow-600/20 border border-yellow-500/30 rounded-xl p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              <p className="text-yellow-400">
                Connect your wallet to access all DEX features
              </p>
            </div>
            <motion.button
              onClick={connectWallet}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Connect Wallet
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'uniswap' && <SwapinV2Interface />}
        {activeTab === 'multichain' && <SwapInterface />}
        {activeTab === 'spot' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 space-y-6">
              <TradingChart />
              <OrderBook />
            </div>
            <div className="lg:col-span-1">
              <TradeForm />
            </div>
          </div>
        )}
        {activeTab === 'pools' && <LiquidityPools />}
        {activeTab === 'bridge' && <CrossChainBridge />}
        {activeTab === 'perps' && <TradingTerminal />}
        {activeTab === 'atomic' && <EnhancedAtomicSwapInterface />}
        {activeTab === 'navigator' && <NavigatorPerpInterface />}
        {activeTab === 'sonic' && <SonicBridgeInterface />}
        {activeTab === 'monero' && <MoneroBridgeInterface onBack={() => setActiveTab('uniswap')} />}
      </motion.div>

      {/* Swapin.co Info */}
      <motion.div
        className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/30 rounded-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-blue-600/20 rounded-lg">
            <Network className="w-6 h-6 text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-400 mb-2">Multi-Chain DEX Integration (15 Networks)</h3>
            <p className="text-slate-300 mb-3">
              Powered by Swapin.co's Uniswap V2 compatible contracts deployed across 15 different blockchains. 
              Trade seamlessly between networks with consistent contract addresses and familiar interfaces.
            </p>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3 text-sm">
              {[
                'Ethereum', 'BSC', 'Polygon', 'Avalanche', 'Arbitrum', 
                'Optimism', 'Base', 'Fantom', 'EGAZ', 'PlanQ', 
                'OctaSpace', 'Altcoinchain', 'DOGEchain', 'ETHO', 'EGEM'
              ].map((network) => (
                <div key={network} className="bg-slate-800/50 rounded px-2 py-1 text-center">
                  {network}
                </div>
              ))}
            </div>
            <div className="mt-4 text-xs text-slate-400">
              <p>• Factory: 0x347aAc6D939f98854110Ff48dC5B7beB52D86445</p>
              <p>• Router: 0xae168Ce47cebca9abbC5107a58df0532f1afa4d6</p>
              <p>• Deployer: 0xE01A6a52Ef245FDeA587735aFe60a1C96152A48D</p>
              <p>• Cross-chain compatibility with Axelar Network integration</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Exchange API Manager Modal */}
      <ExchangeApiManager 
        isOpen={showApiManager} 
        onClose={() => setShowApiManager(false)} 
      />
    </div>
  );
};

export default DEXView;