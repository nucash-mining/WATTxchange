import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Info } from 'lucide-react';

const WATT_LOGO = 'https://raw.githubusercontent.com/nucash-mining/WATTxchange/main/WATT%20logo.png';

interface MinerConfig {
  name: string;
  command: string;
}

interface CoinData {
  id: string;
  ticker: string;
  name: string;
  logo: string;
  logoFallback?: string;
  sub: string;
  algorithm: string;
  port: number;
  portLabel: string;
  portColor: 'green' | 'yellow';
  wtxRewardAlgo: string;
  statusLabel: string;
  statusColor: 'green' | 'yellow';
  userField: string;
  passField: string;
  miners: MinerConfig[];
  infoHtml: string;
}

const COINS: CoinData[] = [
  {
    id: 'xmr',
    ticker: 'XMR',
    name: 'Monero',
    logo: 'https://assets.coingecko.com/coins/images/69/large/monero_logo.png',
    sub: 'RandomX · Merge mine XMR and earn WTX simultaneously',
    algorithm: 'RandomX',
    port: 3334,
    portLabel: '3334',
    portColor: 'green',
    wtxRewardAlgo: 'X25X',
    statusLabel: 'Live',
    statusColor: 'green',
    userField: 'YOUR_XMR_ADDRESS.WORKER_NAME',
    passField: 'YOUR_WTX_ADDRESS',
    miners: [
      {
        name: 'XMRig',
        command: `{
  "pools": [{
    "url": "stratum+tcp://stratum.wattxchange.app:3334",
    "user": "YOUR_XMR_ADDRESS",
    "pass": "YOUR_WTX_ADDRESS",
    "algo": "rx/0"
  }]
}`,
      },
      {
        name: 'SRBMiner-Multi',
        command: `--algorithm randomx
--pool stratum+tcp://stratum.wattxchange.app:3334
--wallet YOUR_XMR_ADDRESS
--password YOUR_WTX_ADDRESS`,
      },
    ],
    infoHtml:
      '<strong>How it works:</strong> Your miner connects to WATTx\'s RandomX stratum. For every valid share you submit, the stratum simultaneously submits a Monero block template (earning XMR to your XMR address) and a WATTx AuxPoW proof (earning WTX to your WTX address). You earn on both chains from a single mining rig.',
  },
  {
    id: 'alt',
    ticker: 'ALT',
    name: 'Altcoinchain',
    logo: 'https://avatars.githubusercontent.com/u/115709361?v=4',
    sub: 'Ethash · Merge mine ALT and earn WTX simultaneously',
    algorithm: 'Ethash',
    port: 3333,
    portLabel: '3333',
    portColor: 'green',
    wtxRewardAlgo: 'X25X',
    statusLabel: '2330',
    statusColor: 'yellow',
    userField: 'YOUR_ALT_ETH_ADDRESS.WORKER_NAME',
    passField: 'YOUR_WTX_ADDRESS',
    miners: [
      {
        name: 'lolMiner',
        command: `lolMiner --algo ETHASH \\
  --pool stratum+tcp://stratum.wattxchange.app:3333 \\
  --user YOUR_ALT_ADDRESS \\
  --pass YOUR_WTX_ADDRESS`,
      },
      {
        name: 'TeamRedMiner',
        command: `teamredminer -a ethash \\
  -o stratum+tcp://stratum.wattxchange.app:3333 \\
  -u YOUR_ALT_ADDRESS \\
  -p YOUR_WTX_ADDRESS`,
      },
      {
        name: 'Ethminer',
        command: `ethminer -P \\
  stratum+tcp://YOUR_ALT_ADDRESS@\\
  stratum.wattxchange.app:3333`,
      },
      {
        name: 'NBMiner',
        command: `nbminer -a ethash \\
  -o stratum+tcp://stratum.wattxchange.app:3333 \\
  -u YOUR_ALT_ADDRESS \\
  -p YOUR_WTX_ADDRESS`,
      },
    ],
    infoHtml:
      '<strong>Altcoinchain (Chain ID 2330)</strong> is an Ethereum-compatible PoW chain secured by Ethash. Merge mining with WATTx lets your GPU earn ALT block rewards while simultaneously producing WATTx AuxPoW blocks. No extra hardware required.',
  },
  {
    id: 'ltc',
    ticker: 'LTC',
    name: 'Litecoin',
    logo: 'https://assets.coingecko.com/coins/images/2/large/litecoin.png',
    sub: 'Scrypt · Merge mine LTC and earn WTX simultaneously',
    algorithm: 'Scrypt',
    port: 3337,
    portLabel: '3337',
    portColor: 'green',
    wtxRewardAlgo: 'X25X',
    statusLabel: 'Coming Soon',
    statusColor: 'yellow',
    userField: 'YOUR_LTC_ADDRESS.WORKER_NAME',
    passField: 'YOUR_WTX_ADDRESS',
    miners: [
      {
        name: 'Antminer L9 / L7 (ASIC)',
        command: `Pool URL:  stratum+tcp://stratum.wattxchange.app:3337
Worker:    YOUR_LTC_ADDRESS.WORKER
Password:  YOUR_WTX_ADDRESS`,
      },
      {
        name: 'CGMiner',
        command: `cgminer --scrypt \\
  -o stratum+tcp://stratum.wattxchange.app:3337 \\
  -u YOUR_LTC_ADDRESS.WORKER \\
  -p YOUR_WTX_ADDRESS`,
      },
      {
        name: 'CPUMiner',
        command: `cpuminer -a scrypt \\
  -o stratum+tcp://stratum.wattxchange.app:3337 \\
  -u YOUR_LTC_ADDRESS \\
  -p YOUR_WTX_ADDRESS`,
      },
    ],
    infoHtml:
      '<strong>Litecoin</strong> is the original Scrypt merge-mining chain. Dogecoin (also Scrypt) will be supported on the same port 3337 once active. Live public ElectrumX servers are available at <code>electrum-ltc.bysh.me:50001</code> and <code>electrum.ltc.xurious.com:50001</code>, enabling trustless payouts and atomic swaps without running a full node.',
  },
  {
    id: 'btc',
    ticker: 'BTC',
    name: 'Bitcoin',
    logo: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
    sub: 'SHA-256d · Merge mine BTC and earn WTX simultaneously',
    algorithm: 'SHA-256d',
    port: 3336,
    portLabel: '3336',
    portColor: 'green',
    wtxRewardAlgo: 'X25X',
    statusLabel: 'Coming Soon',
    statusColor: 'yellow',
    userField: 'YOUR_BTC_ADDRESS.WORKER_NAME',
    passField: 'YOUR_WTX_ADDRESS',
    miners: [
      {
        name: 'Antminer S21 / S19 (ASIC)',
        command: `Pool URL:  stratum+tcp://stratum.wattxchange.app:3336
Worker:    YOUR_BTC_ADDRESS.WORKER
Password:  YOUR_WTX_ADDRESS`,
      },
      {
        name: 'CGMiner / BFGMiner',
        command: `cgminer \\
  -o stratum+tcp://stratum.wattxchange.app:3336 \\
  -u YOUR_BTC_ADDRESS.WORKER \\
  -p YOUR_WTX_ADDRESS`,
      },
      {
        name: 'CPUMiner',
        command: `cpuminer -a sha256d \\
  -o stratum+tcp://stratum.wattxchange.app:3336 \\
  -u YOUR_BTC_ADDRESS \\
  -p YOUR_WTX_ADDRESS`,
      },
    ],
    infoHtml:
      '<strong>Bitcoin</strong> SHA-256d merge mining is implemented in WATTx core. BCH and BSV are also supported on this algorithm and can share port 3336 simultaneously. Live public ElectrumX servers are available at <code>electrum1-3.cipig.net:10000</code> (Komodo/AtomicDEX infrastructure), enabling trustless payouts and atomic swaps without running a full node.',
  },
  {
    id: 'octa',
    ticker: 'OCTA',
    name: 'Octaspace',
    logo: 'https://avatars.githubusercontent.com/u/47415994?v=4',
    sub: 'Ethash · Same port as Altcoinchain · Merge mine OCTA and earn WTX simultaneously',
    algorithm: 'Ethash',
    port: 3333,
    portLabel: '3333',
    portColor: 'green',
    wtxRewardAlgo: 'X25X',
    statusLabel: 'Coming Soon',
    statusColor: 'yellow',
    userField: 'YOUR_OCTA_EVM_ADDRESS.WORKER_NAME',
    passField: 'YOUR_WTX_ADDRESS',
    miners: [
      {
        name: 'lolMiner',
        command: `lolMiner --algo ETHASH \\
  --pool stratum+tcp://stratum.wattxchange.app:3333 \\
  --user YOUR_OCTA_ADDRESS \\
  --pass YOUR_WTX_ADDRESS`,
      },
      {
        name: 'TeamRedMiner',
        command: `teamredminer -a ethash \\
  -o stratum+tcp://stratum.wattxchange.app:3333 \\
  -u YOUR_OCTA_ADDRESS \\
  -p YOUR_WTX_ADDRESS`,
      },
      {
        name: 'NBMiner',
        command: `nbminer -a ethash \\
  -o stratum+tcp://stratum.wattxchange.app:3333 \\
  -u YOUR_OCTA_ADDRESS \\
  -p YOUR_WTX_ADDRESS`,
      },
    ],
    infoHtml:
      '<strong>Octaspace</strong> is an EVM-compatible GPU compute marketplace chain secured by Ethash. It shares port 3333 with Altcoinchain — a single Ethash miner on port 3333 earns ALT, OCTA, and WTX simultaneously. Your EVM address works for both ALT and OCTA payouts.',
  },
  {
    id: 'zen',
    ticker: 'ZEN',
    name: 'Horizen',
    logo: 'https://assets.coingecko.com/coins/images/691/large/horizen.png',
    sub: 'Equihash 200,9 · Merge mine ZEN and earn WTX simultaneously',
    algorithm: 'Equihash',
    port: 3341,
    portLabel: '3341',
    portColor: 'green',
    wtxRewardAlgo: 'X25X',
    statusLabel: 'Coming Soon',
    statusColor: 'yellow',
    userField: 'YOUR_ZEN_ADDRESS.WORKER_NAME',
    passField: 'YOUR_WTX_ADDRESS',
    miners: [
      {
        name: 'miniZ',
        command: `miniZ --algo 200_9 \\
  --url stratum+tcp://stratum.wattxchange.app:3341 \\
  --user YOUR_ZEN_ADDRESS.WORKER \\
  --pass YOUR_WTX_ADDRESS`,
      },
      {
        name: 'lolMiner',
        command: `lolMiner --algo EQUIHASH \\
  --pool stratum+tcp://stratum.wattxchange.app:3341 \\
  --user YOUR_ZEN_ADDRESS \\
  --pass YOUR_WTX_ADDRESS`,
      },
      {
        name: 'GMiner',
        command: `miner --algo equihash200_9 \\
  --server stratum.wattxchange.app \\
  --port 3341 \\
  --user YOUR_ZEN_ADDRESS \\
  --pass YOUR_WTX_ADDRESS`,
      },
    ],
    infoHtml:
      '<strong>Horizen (ZEN)</strong> is a privacy-focused sidechain platform. Port 3341 simultaneously merge mines ZEN, ZEC, and BTCZ — one miner earns on all three chains plus WTX. ZEN uses Equihash 200,9, the same parameters as ZEC and BTCZ. Note: ZEN payouts require a connected full node (no public ElectrumX infrastructure exists for ZEN); trustless ZEN atomic swaps use the Komodo/AtomicDEX protocol.',
  },
  {
    id: 'dash',
    ticker: 'DASH',
    name: 'Dash',
    logo: 'https://assets.coingecko.com/coins/images/19/large/dash-logo.png',
    sub: 'X11 · Merge mine DASH and earn WTX simultaneously',
    algorithm: 'X11',
    port: 3340,
    portLabel: '3340',
    portColor: 'green',
    wtxRewardAlgo: 'X25X',
    statusLabel: 'Coming Soon',
    statusColor: 'yellow',
    userField: 'YOUR_DASH_ADDRESS.WORKER_NAME',
    passField: 'YOUR_WTX_ADDRESS',
    miners: [
      {
        name: 'SGMiner',
        command: `sgminer --algorithm x11 \\
  --url stratum+tcp://stratum.wattxchange.app:3340 \\
  --user YOUR_DASH_ADDRESS.WORKER \\
  --pass YOUR_WTX_ADDRESS`,
      },
      {
        name: 'CCMiner',
        command: `ccminer -a x11 \\
  -o stratum+tcp://stratum.wattxchange.app:3340 \\
  -u YOUR_DASH_ADDRESS.WORKER \\
  -p YOUR_WTX_ADDRESS`,
      },
      {
        name: 'CPUMiner',
        command: `cpuminer -a x11 \\
  -o stratum+tcp://stratum.wattxchange.app:3340 \\
  -u YOUR_DASH_ADDRESS \\
  -p YOUR_WTX_ADDRESS`,
      },
    ],
    infoHtml:
      '<strong>Dash</strong> uses X11 — a chained hashing algorithm combining 11 different hash functions. Live public ElectrumX servers are available at <code>electrum1-3.cipig.net:10061</code> (Komodo/AtomicDEX infrastructure), enabling trustless payouts and atomic swaps without running a full node.',
  },
  {
    id: 'zec',
    ticker: 'ZEC',
    name: 'Zcash',
    logo: 'https://assets.coingecko.com/coins/images/486/large/circle-zcash-color.png',
    logoFallback: 'https://z.cash/wp-content/uploads/2021/07/zcash-icon-200.png',
    sub: 'Equihash 200,9 · Merge mine ZEC and earn WTX simultaneously',
    algorithm: 'Equihash',
    port: 3341,
    portLabel: '3341',
    portColor: 'green',
    wtxRewardAlgo: 'X25X',
    statusLabel: 'Coming Soon',
    statusColor: 'yellow',
    userField: 'YOUR_ZEC_ADDRESS.WORKER_NAME',
    passField: 'YOUR_WTX_ADDRESS',
    miners: [
      {
        name: 'miniZ',
        command: `miniZ --algo 200_9 \\
  --url stratum+tcp://stratum.wattxchange.app:3341 \\
  --user YOUR_ZEC_ADDRESS.WORKER \\
  --pass YOUR_WTX_ADDRESS`,
      },
      {
        name: 'lolMiner',
        command: `lolMiner --algo EQUIHASH \\
  --pool stratum+tcp://stratum.wattxchange.app:3341 \\
  --user YOUR_ZEC_ADDRESS \\
  --pass YOUR_WTX_ADDRESS`,
      },
      {
        name: 'GMiner',
        command: `miner --algo equihash200_9 \\
  --server stratum.wattxchange.app \\
  --port 3341 \\
  --user YOUR_ZEC_ADDRESS \\
  --pass YOUR_WTX_ADDRESS`,
      },
    ],
    infoHtml:
      '<strong>Zcash</strong> is the primary Equihash chain on this stratum. Port 3341 simultaneously merge mines ZEC, ZEN, and BTCZ — one miner earns on all three chains plus WTX. ZEC has live public ElectrumX servers at <code>electrum1-3.cipig.net:10058</code> (Komodo/AtomicDEX infrastructure), enabling trustless payouts and atomic swaps without running a full node.',
  },
  {
    id: 'btcz',
    ticker: 'BTCZ',
    name: 'BitcoinZ',
    logo: 'https://avatars.githubusercontent.com/u/33205606?s=200&v=4',
    logoFallback: 'https://btczexplorer.blockhub.info/img/bitcoinz-logo.png',
    sub: 'Equihash 200,9 · Merge mine BTCZ and earn WTX simultaneously',
    algorithm: 'Equihash',
    port: 3341,
    portLabel: '3341',
    portColor: 'green',
    wtxRewardAlgo: 'X25X',
    statusLabel: 'Coming Soon',
    statusColor: 'yellow',
    userField: 'YOUR_BTCZ_ADDRESS.WORKER_NAME',
    passField: 'YOUR_WTX_ADDRESS',
    miners: [
      {
        name: 'miniZ',
        command: `miniZ --algo 200_9 \\
  --url stratum+tcp://stratum.wattxchange.app:3341 \\
  --user YOUR_BTCZ_ADDRESS.WORKER \\
  --pass YOUR_WTX_ADDRESS`,
      },
      {
        name: 'lolMiner',
        command: `lolMiner --algo EQUIHASH \\
  --pool stratum+tcp://stratum.wattxchange.app:3341 \\
  --user YOUR_BTCZ_ADDRESS \\
  --pass YOUR_WTX_ADDRESS`,
      },
      {
        name: 'EWBF / GMiner',
        command: `miner --algo equihash200_9 \\
  --server stratum.wattxchange.app \\
  --port 3341 \\
  --user YOUR_BTCZ_ADDRESS \\
  --pass YOUR_WTX_ADDRESS`,
      },
    ],
    infoHtml:
      '<strong>BitcoinZ</strong> is a community-driven, no-premine, no-founder-reward Equihash coin. It uses Equihash 200,9 — the same parameters as ZEC and ZEN — so any Equihash miner works on port 3341. BTCZ has its own DEX (built on AtomicDEX) with live ElectrumZ servers at <code>electrum1.btcz.rocks</code> and <code>electrum2.btcz.rocks</code>, enabling atomic swaps and trustless payouts.',
  },
  {
    id: 'kas',
    ticker: 'KAS',
    name: 'Kaspa',
    logo: 'https://assets.coingecko.com/coins/images/25751/large/kaspa-icon-exchanges.png',
    logoFallback: WATT_LOGO,
    sub: 'kHeavyHash · Merge mine KAS and earn WTX simultaneously',
    algorithm: 'kHeavyHash',
    port: 3342,
    portLabel: '3342',
    portColor: 'green',
    wtxRewardAlgo: 'X25X',
    statusLabel: 'Coming Soon',
    statusColor: 'yellow',
    userField: 'YOUR_KASPA_ADDRESS.WORKER_NAME',
    passField: 'YOUR_WTX_ADDRESS',
    miners: [
      {
        name: 'BzMiner',
        command: `bzminer -a kaspa \\
  -p stratum+tcp://stratum.wattxchange.app:3342 \\
  -w YOUR_KASPA_ADDRESS.WORKER \\
  --pass YOUR_WTX_ADDRESS`,
      },
      {
        name: 'lolMiner',
        command: `lolMiner --algo KASPA \\
  --pool stratum+tcp://stratum.wattxchange.app:3342 \\
  --user YOUR_KASPA_ADDRESS.WORKER \\
  --pass YOUR_WTX_ADDRESS`,
      },
      {
        name: 'SRBMiner',
        command: `SRBMiner-MULTI \\
  --algorithm kheavyhash \\
  --pool stratum+tcp://stratum.wattxchange.app:3342 \\
  --wallet YOUR_KASPA_ADDRESS \\
  --password YOUR_WTX_ADDRESS`,
      },
    ],
    infoHtml:
      '<strong>Kaspa</strong> uses the kHeavyHash algorithm and a blockDAG (GHOSTDAG protocol) enabling extremely high block rates. Kaspa uses a gRPC/REST block submission API rather than traditional stratum — the WATTx pool includes a translation layer for standard miner compatibility. KAS payouts use the Kaspa REST API directly; no ElectrumX required.',
  },
  {
    id: 'bit',
    ticker: 'BIT',
    name: 'Bitnet',
    logo: 'https://avatars.githubusercontent.com/u/121768826?v=4',
    logoFallback: WATT_LOGO,
    sub: 'SHA-256d · Merge mine BIT and earn WTX simultaneously',
    algorithm: 'SHA-256d',
    port: 3343,
    portLabel: '3343',
    portColor: 'green',
    wtxRewardAlgo: 'X25X',
    statusLabel: 'Coming Soon',
    statusColor: 'yellow',
    userField: 'YOUR_BIT_ADDRESS.WORKER_NAME',
    passField: 'YOUR_WTX_ADDRESS',
    miners: [
      {
        name: 'Antminer S21 / S19 (ASIC)',
        command: `Pool URL:  stratum+tcp://stratum.wattxchange.app:3343
Worker:    YOUR_BIT_ADDRESS.WORKER
Password:  YOUR_WTX_ADDRESS`,
      },
      {
        name: 'CGMiner / BFGMiner',
        command: `cgminer \\
  -o stratum+tcp://stratum.wattxchange.app:3343 \\
  -u YOUR_BIT_ADDRESS.WORKER \\
  -p YOUR_WTX_ADDRESS`,
      },
      {
        name: 'CPUMiner',
        command: `cpuminer -a sha256d \\
  -o stratum+tcp://stratum.wattxchange.app:3343 \\
  -u YOUR_BIT_ADDRESS \\
  -p YOUR_WTX_ADDRESS`,
      },
    ],
    infoHtml:
      '<strong>Bitnet (BIT)</strong> is a SHA-256d hybrid PoW/PoS blockchain (QTUM fork) with smart contract support. It shares the SHA-256d algorithm with Bitcoin but runs on a separate port (3343) to keep ASIC miners targeted specifically at BIT and WTX. ElectrumX support is planned for trustless payouts and atomic swaps.',
  },
];

const VALID_IDS = COINS.map((c) => c.id);

// ── Stat card ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string;
  color?: 'default' | 'green' | 'yellow';
}

const StatCard: React.FC<StatCardProps> = ({ label, value, color = 'default' }) => {
  const valueClass =
    color === 'green'
      ? 'text-green-400'
      : color === 'yellow'
      ? 'text-yellow-400'
      : 'text-indigo-300';

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl px-5 py-4">
      <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${valueClass}`}>{value}</p>
    </div>
  );
};

// ── Copy button ───────────────────────────────────────────────────────────────
interface CopyButtonProps {
  text: string;
  copyKey: string;
  activeKey: string;
  onCopy: (text: string, key: string) => void;
}

const CopyButton: React.FC<CopyButtonProps> = ({ text, copyKey, activeKey, onCopy }) => {
  const copied = activeKey === copyKey;
  return (
    <button
      onClick={() => onCopy(text, copyKey)}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
        bg-slate-700/60 text-slate-400 hover:bg-slate-600/60 hover:text-slate-200
        border border-slate-600/50 transition-all duration-150 flex-shrink-0"
      aria-label="Copy to clipboard"
    >
      {copied ? (
        <>
          <Check className="w-3 h-3 text-green-400" />
          <span className="text-green-400">Copied!</span>
        </>
      ) : (
        <>
          <Copy className="w-3 h-3" />
          <span>Copy</span>
        </>
      )}
    </button>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const MergedMiningView: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>(() => {
    const hash = window.location.hash.replace('#', '');
    return VALID_IDS.includes(hash) ? hash : 'xmr';
  });
  const [copiedKey, setCopiedKey] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'setup' | 'stats'>('stats');

  // Sync hash on selection change
  useEffect(() => {
    history.replaceState(null, '', '#' + selectedId);
  }, [selectedId]);

  const handleCopy = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(''), 1500);
    });
  }, []);

  const coin = COINS.find((c) => c.id === selectedId) ?? COINS[0];

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Page-level header */}
      <div className="px-6 pt-6 pb-0 flex-shrink-0">
        <h2 className="text-2xl font-bold text-white">WATTx Merged Mining</h2>
        <p className="text-slate-400 text-sm mt-1">
          Mine any parent chain and earn WTX simultaneously — no extra hardware required
        </p>

        {/* Tab switcher */}
        <div className="flex gap-1 mt-4 mb-0 border-b border-slate-700/50">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-5 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'stats'
                ? 'bg-slate-800 text-yellow-400 border border-b-0 border-slate-700/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            📊 Live Pool Stats
          </button>
          <button
            onClick={() => setActiveTab('setup')}
            className={`px-5 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'setup'
                ? 'bg-slate-800 text-yellow-400 border border-b-0 border-slate-700/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ⛏️ Miner Setup
          </button>
        </div>
      </div>

      {/* Live pool stats — mm.wattxchange.app embedded */}
      {activeTab === 'stats' && (
        <div className="flex flex-col flex-1 min-h-0 px-6 pt-4 pb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-500 font-mono">mm.wattxchange.app</span>
            <a
              href="https://mm.wattxchange.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors flex items-center gap-1"
            >
              Open full page ↗
            </a>
          </div>
          <div className="flex-1 rounded-xl overflow-hidden border border-slate-700/50 bg-slate-900/50 min-h-[480px]">
            <iframe
              src="https://mm.wattxchange.app"
              title="WATTx Merged Mining Pool Stats"
              className="w-full h-full border-0"
              style={{ minHeight: 480 }}
              loading="lazy"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          </div>
        </div>
      )}

      {/* Body: sidebar + main — miner setup tab */}
      {activeTab === 'setup' && <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* ── Sidebar ── */}
        <aside
          className="w-52 flex-shrink-0 bg-slate-900/60 border-r border-slate-700/50
            overflow-y-auto flex flex-col"
        >
          <p className="text-xs uppercase tracking-widest text-slate-500 px-4 pt-5 pb-3">
            Parent Chains
          </p>
          <div className="flex flex-col gap-0.5 px-2 pb-4">
            {COINS.map((c) => {
              const isActive = c.id === selectedId;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-sm
                    text-left transition-all duration-150 ${
                      isActive
                        ? 'bg-yellow-600/20 border border-yellow-500/30 text-yellow-400'
                        : 'bg-transparent border border-transparent text-slate-300 hover:bg-slate-700/50'
                    }`}
                >
                  <img
                    src={c.logo}
                    alt={c.ticker}
                    className="w-6 h-6 rounded-full object-cover flex-shrink-0 bg-slate-700"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = c.logoFallback ?? WATT_LOGO;
                    }}
                  />
                  <span className="flex-1 truncate font-medium">{c.name}</span>
                  <span
                    className={`text-xs flex-shrink-0 ${
                      isActive ? 'text-yellow-400' : 'text-slate-500'
                    }`}
                  >
                    {c.ticker}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* ── Main panel ── */}
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={coin.id}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.18 }}
              className="px-8 py-7 max-w-3xl"
            >
              {/* Page header */}
              <div className="flex items-center gap-4 mb-7">
                <img
                  src={coin.logo}
                  alt={coin.ticker}
                  className="w-14 h-14 rounded-full object-cover flex-shrink-0 bg-slate-700"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = coin.logoFallback ?? WATT_LOGO;
                  }}
                />
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    {coin.name} <span className="text-slate-500">×</span> WATTx
                  </h1>
                  <p className="text-slate-400 text-sm mt-0.5">{coin.sub}</p>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
                <StatCard label="Algorithm" value={coin.algorithm} />
                <StatCard label="Stratum Port" value={coin.portLabel} color="green" />
                <StatCard label="WTX Reward Algo" value={coin.wtxRewardAlgo} color="yellow" />
                <StatCard
                  label={coin.id === 'alt' ? 'Chain ID' : 'Status'}
                  value={coin.statusLabel}
                  color={coin.statusColor}
                />
              </div>

              {/* Stratum Connection */}
              <h2 className="text-sm font-semibold text-white mb-3 pb-2 border-b border-slate-700/50">
                Stratum Connection
              </h2>
              <div className="bg-slate-900/60 rounded-xl border border-slate-700/50 px-5 py-4 mb-7 space-y-3">
                {/* Host row */}
                <div className="flex items-center gap-3">
                  <span className="text-xs uppercase tracking-wider text-slate-500 w-16 flex-shrink-0">
                    Host
                  </span>
                  <span className="font-mono text-sm bg-black/40 border border-slate-700/50 rounded-md px-3 py-1.5 flex-1 text-slate-200">
                    stratum.wattxchange.app
                  </span>
                  <CopyButton
                    text="stratum.wattxchange.app"
                    copyKey={`${coin.id}-host`}
                    activeKey={copiedKey}
                    onCopy={handleCopy}
                  />
                </div>
                {/* Port row */}
                <div className="flex items-center gap-3">
                  <span className="text-xs uppercase tracking-wider text-slate-500 w-16 flex-shrink-0">
                    Port
                  </span>
                  <span className="font-mono text-sm bg-black/40 border border-slate-700/50 rounded-md px-3 py-1.5 flex-1 text-slate-200">
                    {coin.port}
                  </span>
                </div>
                {/* User row */}
                <div className="flex items-center gap-3">
                  <span className="text-xs uppercase tracking-wider text-slate-500 w-16 flex-shrink-0">
                    User
                  </span>
                  <span className="font-mono text-sm bg-black/40 border border-slate-700/50 rounded-md px-3 py-1.5 flex-1 text-slate-400">
                    {coin.userField}
                  </span>
                </div>
                {/* Pass row */}
                <div className="flex items-center gap-3">
                  <span className="text-xs uppercase tracking-wider text-slate-500 w-16 flex-shrink-0">
                    Pass
                  </span>
                  <span className="font-mono text-sm bg-black/40 border border-slate-700/50 rounded-md px-3 py-1.5 flex-1 text-slate-400">
                    {coin.passField}
                  </span>
                </div>
              </div>

              {/* Miner Configs */}
              <h2 className="text-sm font-semibold text-white mb-3 pb-2 border-b border-slate-700/50">
                Miner Configs
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-7">
                {coin.miners.map((miner) => (
                  <div
                    key={miner.name}
                    className="bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-4"
                  >
                    <p className="text-sm font-semibold text-white mb-2">{miner.name}</p>
                    <pre className="bg-black/40 rounded-lg p-3 text-xs font-mono text-green-300 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
                      {miner.command}
                    </pre>
                  </div>
                ))}
              </div>

              {/* Info box */}
              <div className="bg-blue-600/10 border border-blue-500/30 rounded-xl p-4 flex gap-3">
                <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <p
                  className="text-sm text-slate-300 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: coin.infoHtml }}
                />
              </div>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>}
    </div>
  );
};

export default MergedMiningView;
