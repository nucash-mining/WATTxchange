import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getChainConfig } from '../config/chains';
import { useSummary } from '../hooks/useApi';
import { formatNumber, formatHashRate, formatDifficulty } from '../utils/format';

const chain = getChainConfig();

// Apply theme CSS variables
const applyTheme = () => {
  const root = document.documentElement;
  root.style.setProperty('--color-primary', chain.theme.primary);
  root.style.setProperty('--color-primary-dark', chain.theme.primaryDark);
  root.style.setProperty('--color-primary-light', chain.theme.primaryLight);
  root.style.setProperty('--color-secondary', chain.theme.secondary);
};

export function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    applyTheme();
    document.title = `${chain.name} Explorer - WATTxchange`;
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    // Determine search type based on pattern
    if (/^\d+$/.test(q)) {
      navigate(`/block/${q}`);
    } else if (q.length === 64) {
      // Could be block hash or tx hash - try tx first
      navigate(`/tx/${q}`);
    } else {
      // Assume address
      navigate(`/address/${q}`);
    }
    setSearchQuery('');
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  // Build navigation items based on chain features
  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/blocks', label: 'Blocks' },
    { path: '/txs', label: 'Transactions' },
  ];

  if (chain.features.masternodes) {
    navItems.push({ path: '/masternodes', label: 'Masternodes' });
  }

  if (chain.features.delegatorNodes || chain.features.superStakerNodes) {
    navItems.push({ path: '/staking', label: 'Staking Nodes' });
  }

  if (chain.features.tokens) {
    navItems.push({ path: '/tokens', label: 'Tokens' });
  }

  navItems.push({ path: '/richlist', label: 'Rich List' });

  return (
    <header className="bg-dark-100 border-b border-dark-400 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-3 gap-4 flex-wrap">
          {/* Logo and back link */}
          <div className="flex items-center gap-4">
            <a
              href="https://explorer.wattxchange.app"
              className="flex items-center gap-2 px-3 py-2 border border-dark-400 rounded-lg text-gray-400 hover:text-current hover:border-current text-sm transition-colors"
              style={{ '--tw-text-opacity': 1 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Explorers
            </a>
            <Link to="/" className="flex items-center gap-3">
              <img
                src={chain.logo}
                alt={chain.ticker}
                className="w-9 h-9 rounded-lg"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <span className="text-xl font-bold text-white">
                {chain.name} <span style={{ color: chain.theme.primary }}>Explorer</span>
              </span>
            </Link>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl">
            <div className="flex bg-dark-200 border border-dark-400 rounded-lg overflow-hidden">
              <input
                type="text"
                placeholder={`Search by Address / Txn Hash / Block`}
                className="flex-1 px-4 py-2.5 bg-transparent text-white text-sm outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="submit"
                className="px-5 py-2.5 font-semibold text-black transition-colors"
                style={{ backgroundColor: chain.theme.primary }}
              >
                Search
              </button>
            </div>
          </form>

          {/* Navigation */}
          <nav className="flex gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'text-black'
                    : 'text-gray-400 hover:text-white'
                }`}
                style={isActive(item.path) ? {
                  backgroundColor: chain.theme.primary,
                  color: '#000'
                } : {}}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}

export function StatsBanner() {
  const { data: summary } = useSummary();

  // Parse hashrate - eIquidus returns it as string
  const hashrate = summary?.hashrate ? parseFloat(summary.hashrate) : 0;

  // Get difficulty - use difficultyHybrid for PoW/PoS chains if available
  const difficulty = summary?.difficultyHybrid || summary?.difficulty || 0;

  const stats = [
    {
      label: `${chain.ticker} Price`,
      value: summary?.lastPrice ? `$${Number(summary.lastPrice).toFixed(6)}` : '$--',
      accent: true
    },
    {
      label: 'Block Height',
      value: formatNumber(summary?.blockcount || 0)
    },
    {
      label: 'Connections',
      value: formatNumber(summary?.connections || 0)
    },
    {
      label: 'Difficulty',
      value: formatDifficulty(difficulty)
    },
    {
      label: 'Hashrate',
      value: formatHashRate(hashrate)
    }
  ];

  // Add chain-specific stats
  if (chain.features.masternodes) {
    const mnOnline = summary?.masternodeCountOnline;
    const mnCount = mnOnline && mnOnline !== '-' ? mnOnline : '0';
    stats.push({
      label: 'Masternodes',
      value: formatNumber(mnCount),
      success: true
    });
  }

  if (chain.features.staking) {
    stats.push({
      label: 'Supply',
      value: formatNumber(summary?.supply || 0),
      success: false
    });
  }

  return (
    <section
      className="border-b border-dark-400 py-5"
      style={{
        background: `linear-gradient(180deg, ${chain.theme.glow} 0%, transparent 100%)`
      }}
    >
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {stats.map((stat, i) => (
            <div key={i} className="stat-card">
              <div className="stat-label">{stat.label}</div>
              <div
                className={`stat-value ${stat.accent ? 'stat-value-accent' : ''} ${
                  stat.success ? 'text-green-400' : ''
                }`}
                style={stat.accent ? { color: chain.theme.primary } : {}}
              >
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="bg-dark-100 border-t border-dark-400 py-6 mt-12">
      <div className="container mx-auto px-4 text-center">
        <p className="text-gray-500">
          {chain.name} Explorer - {chain.description}
        </p>
        <p className="text-gray-600 text-sm mt-1">
          Powered by <a href="https://wattxchange.app" className="hover:underline">WATTxchange</a>
        </p>
      </div>
    </footer>
  );
}

export function Loading({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="spinner mb-4"></div>
      <p className="text-gray-500">{text}</p>
    </div>
  );
}

export function ErrorMessage({ message }) {
  return (
    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
      <p className="text-red-400">{message}</p>
    </div>
  );
}

export function PageTitle({ children, badge }) {
  return (
    <h1 className="text-2xl font-bold mb-6 flex items-center gap-3">
      {children}
      {badge && (
        <span
          className="text-xs px-3 py-1 rounded-full font-semibold"
          style={{
            backgroundColor: chain.theme.glow,
            color: chain.theme.primary
          }}
        >
          {badge}
        </span>
      )}
    </h1>
  );
}
