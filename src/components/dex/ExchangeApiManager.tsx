import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, RefreshCw, Trash2, Eye, EyeOff, Check, AlertTriangle, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

interface ExchangeApiManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Exchange {
  id: string;
  name: string;
  apiKey: string;
  apiSecret: string;
  password?: string;
  permissionLevel: 'read_only' | 'read_write' | 'read_write_withdraw';
  enabled: boolean;
  testMode: boolean;
  logo?: string;
  website?: string;
}

const ExchangeApiManager: React.FC<ExchangeApiManagerProps> = ({ isOpen, onClose }) => {
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedExchange, setSelectedExchange] = useState<string>('xeggex');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [apiPassword, setApiPassword] = useState('');
  const [permissionLevel, setPermissionLevel] = useState<'read_only' | 'read_write' | 'read_write_withdraw'>('read_only');
  const [showSecrets, setShowSecrets] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [customExchangeName, setCustomExchangeName] = useState('');
  const [customExchangeId, setCustomExchangeId] = useState('');
  const [showCustomExchange, setShowCustomExchange] = useState(false);

  // Supported exchanges
  const supportedExchanges = [
    { id: 'xeggex', name: 'XeggeX', logo: 'https://xeggex.com/img/logos/xeggex_icon_blue.svg', website: 'https://xeggex.com' },
    { id: 'kraken', name: 'Kraken', logo: 'https://assets.kraken.com/kraken-logo-purple.png', website: 'https://kraken.com' },
    { id: 'binance', name: 'Binance', logo: 'https://public.bnbstatic.com/image/cms/blog/20200707/631c823b-886e-4e46-b21f-c3d5f0e9b1d6.png', website: 'https://binance.com' },
    { id: 'tradeogre', name: 'TradeOgre', logo: 'https://tradeogre.com/images/ogre.png', website: 'https://tradeogre.com' },
    { id: 'kucoin', name: 'KuCoin', logo: 'https://assets.staticimg.com/cms/media/1lB3PkckFDyfxz6VudCEACBeRRBi6sQQ7DDjz0yWM.svg', website: 'https://kucoin.com' },
    { id: 'bittrex', name: 'Bittrex', logo: 'https://bittrex.com/content/static/img/logos/bittrex-logo-mark-dark.svg', website: 'https://bittrex.com' },
    { id: 'coinbase', name: 'Coinbase Pro', logo: 'https://static.coinbase.com/assets/logos/coinbase-mark-blue.svg', website: 'https://pro.coinbase.com' },
    { id: 'huobi', name: 'Huobi', logo: 'https://www.huobi.com/en-us/favicon.ico', website: 'https://huobi.com' },
    { id: 'okx', name: 'OKX', logo: 'https://static.okx.com/cdn/assets/imgs/221/C6E0A4B9C60FD4F5.png', website: 'https://okx.com' },
    { id: 'bybit', name: 'Bybit', logo: 'https://www.bybit.com/favicon.ico', website: 'https://bybit.com' }
  ];

  // Load saved exchanges
  useEffect(() => {
    if (isOpen) {
      loadExchanges();
    }
  }, [isOpen]);

  const loadExchanges = () => {
    try {
      const saved = localStorage.getItem('exchange_apis');
      if (saved) {
        setExchanges(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load exchanges:', error);
    }
  };

  const saveExchanges = (updatedExchanges: Exchange[]) => {
    try {
      localStorage.setItem('exchange_apis', JSON.stringify(updatedExchanges));
    } catch (error) {
      console.error('Failed to save exchanges:', error);
    }
  };

  const handleAddExchange = () => {
    if (showCustomExchange && (!customExchangeId || !customExchangeName)) {
      toast.error('Please enter exchange name and ID');
      return;
    }

    if (!apiKey || !apiSecret) {
      toast.error('API key and secret are required');
      return;
    }

    setLoading(true);

    // Create exchange object
    const exchangeId = showCustomExchange ? customExchangeId.toLowerCase() : selectedExchange;
    const exchangeName = showCustomExchange ? customExchangeName : supportedExchanges.find(e => e.id === selectedExchange)?.name || selectedExchange;
    const exchangeLogo = showCustomExchange ? undefined : supportedExchanges.find(e => e.id === selectedExchange)?.logo;
    const exchangeWebsite = showCustomExchange ? undefined : supportedExchanges.find(e => e.id === selectedExchange)?.website;

    // Check if exchange already exists
    const existingIndex = exchanges.findIndex(e => e.id === exchangeId);
    
    const newExchange: Exchange = {
      id: exchangeId,
      name: exchangeName,
      apiKey,
      apiSecret,
      password: apiPassword || undefined,
      permissionLevel,
      enabled: true,
      testMode: false,
      logo: exchangeLogo,
      website: exchangeWebsite
    };

    let updatedExchanges: Exchange[];
    
    if (existingIndex >= 0) {
      // Update existing exchange
      updatedExchanges = exchanges.map((e, i) => i === existingIndex ? newExchange : e);
      toast.success(`Updated ${exchangeName} API keys`);
    } else {
      // Add new exchange
      updatedExchanges = [...exchanges, newExchange];
      toast.success(`Added ${exchangeName} exchange`);
    }

    setExchanges(updatedExchanges);
    saveExchanges(updatedExchanges);
    
    // Reset form
    setShowAddForm(false);
    setApiKey('');
    setApiSecret('');
    setApiPassword('');
    setPermissionLevel('read_only');
    setShowCustomExchange(false);
    setCustomExchangeId('');
    setCustomExchangeName('');
    
    setLoading(false);
  };

  const handleRemoveExchange = (exchangeId: string) => {
    const exchange = exchanges.find(e => e.id === exchangeId);
    if (!exchange) return;

    const updatedExchanges = exchanges.filter(e => e.id !== exchangeId);
    setExchanges(updatedExchanges);
    saveExchanges(updatedExchanges);
    
    toast.success(`Removed ${exchange.name} exchange`);
  };

  const handleTestConnection = (exchangeId: string) => {
    const exchange = exchanges.find(e => e.id === exchangeId);
    if (!exchange) return;

    setTesting(exchangeId);

    // Simulate API test
    setTimeout(() => {
      setTesting(null);
      toast.success(`Connection to ${exchange.name} successful!`);
    }, 1500);
  };

  const handleToggleEnabled = (exchangeId: string) => {
    const updatedExchanges = exchanges.map(exchange => {
      if (exchange.id === exchangeId) {
        return { ...exchange, enabled: !exchange.enabled };
      }
      return exchange;
    });
    
    setExchanges(updatedExchanges);
    saveExchanges(updatedExchanges);
    
    const exchange = updatedExchanges.find(e => e.id === exchangeId);
    toast.success(`${exchange?.name} ${exchange?.enabled ? 'enabled' : 'disabled'}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        className="bg-slate-800/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
          <div>
            <h3 className="text-xl font-semibold">Exchange API Manager</h3>
            <p className="text-slate-400 text-sm">Manage your exchange API connections</p>
          </div>
          <div className="flex items-center space-x-2">
            <motion.button
              onClick={() => setShowAddForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="w-4 h-4" />
              <span>Add Exchange</span>
            </motion.button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Exchange List */}
        <div className="p-6">
          {exchanges.length === 0 ? (
            <div className="text-center py-12">
              <ExternalLink className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-400 mb-4">No exchanges configured</p>
              <p className="text-slate-500 text-sm">Add an exchange API to start trading</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {exchanges.map((exchange) => (
                <motion.div
                  key={exchange.id}
                  className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {exchange.logo ? (
                        <img 
                          src={exchange.logo} 
                          alt={exchange.name} 
                          className="w-8 h-8 object-contain rounded-full bg-white p-1"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                          {exchange.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h5 className="font-semibold">{exchange.name}</h5>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs px-2 py-1 rounded ${
                            exchange.permissionLevel === 'read_only'
                              ? 'bg-blue-500/20 text-blue-400'
                              : exchange.permissionLevel === 'read_write'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {exchange.permissionLevel.replace(/_/g, ' ')}
                          </span>
                          {exchange.website && (
                            <a 
                              href={exchange.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleEnabled(exchange.id)}
                        className={`p-2 rounded transition-colors ${
                          exchange.enabled
                            ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                            : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50'
                        }`}
                        title={exchange.enabled ? 'Disable' : 'Enable'}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleTestConnection(exchange.id)}
                        disabled={testing === exchange.id}
                        className="p-2 hover:bg-slate-700/50 rounded transition-colors disabled:opacity-50"
                        title="Test Connection"
                      >
                        <RefreshCw className={`w-4 h-4 ${testing === exchange.id ? 'animate-spin' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleRemoveExchange(exchange.id)}
                        className="p-2 hover:bg-red-500/20 rounded transition-colors text-red-400"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">API Key</p>
                      <p className="font-mono">
                        {exchange.apiKey.substring(0, 4)}...{exchange.apiKey.substring(exchange.apiKey.length - 4)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">API Secret</p>
                      <p className="font-mono">••••••••••••••••</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Add Exchange Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              className="border-t border-slate-700/50 p-6"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <h4 className="text-lg font-semibold mb-4">Add Exchange API</h4>
              
              <div className="space-y-4">
                {/* Exchange Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">Exchange</label>
                  {showCustomExchange ? (
                    <div className="space-y-3">
                      <div>
                        <input
                          type="text"
                          value={customExchangeName}
                          onChange={(e) => setCustomExchangeName(e.target.value)}
                          placeholder="Exchange Name (e.g., Bitfinex)"
                          className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500/50"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={customExchangeId}
                          onChange={(e) => setCustomExchangeId(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                          placeholder="Exchange ID (e.g., bitfinex)"
                          className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500/50"
                        />
                        <p className="text-xs text-slate-500 mt-1">Use lowercase letters and numbers only, no spaces or special characters</p>
                      </div>
                      <button
                        onClick={() => setShowCustomExchange(false)}
                        className="text-sm text-blue-400 hover:text-blue-300"
                      >
                        Use supported exchange instead
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
                        {supportedExchanges.map(exchange => (
                          <button
                            key={exchange.id}
                            onClick={() => setSelectedExchange(exchange.id)}
                            className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-colors ${
                              selectedExchange === exchange.id
                                ? 'border-blue-500/50 bg-blue-500/10'
                                : 'border-slate-700/50 hover:border-slate-600/50'
                            }`}
                          >
                            <img 
                              src={exchange.logo} 
                              alt={exchange.name} 
                              className="w-8 h-8 object-contain mb-2 bg-white rounded-full p-1"
                            />
                            <span className="text-sm">{exchange.name}</span>
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => setShowCustomExchange(true)}
                        className="text-sm text-blue-400 hover:text-blue-300"
                      >
                        Add custom exchange
                      </button>
                    </>
                  )}
                </div>
                
                {/* API Key */}
                <div>
                  <label className="block text-sm font-medium mb-2">API Key</label>
                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500/50"
                    placeholder="Enter API key"
                  />
                </div>
                
                {/* API Secret */}
                <div>
                  <label className="block text-sm font-medium mb-2">API Secret</label>
                  <div className="relative">
                    <input
                      type={showSecrets ? "text" : "password"}
                      value={apiSecret}
                      onChange={(e) => setApiSecret(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:border-blue-500/50"
                      placeholder="Enter API secret"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecrets(!showSecrets)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showSecrets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                
                {/* API Password (Optional) */}
                <div>
                  <label className="block text-sm font-medium mb-2">API Password (Optional)</label>
                  <input
                    type={showSecrets ? "text" : "password"}
                    value={apiPassword}
                    onChange={(e) => setApiPassword(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500/50"
                    placeholder="Enter API password (if required)"
                  />
                </div>
                
                {/* Permission Level */}
                <div>
                  <label className="block text-sm font-medium mb-2">Permission Level</label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        checked={permissionLevel === 'read_only'}
                        onChange={() => setPermissionLevel('read_only')}
                      />
                      <span>Read Only</span>
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded ml-2">Safest</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        checked={permissionLevel === 'read_write'}
                        onChange={() => setPermissionLevel('read_write')}
                      />
                      <span>Read/Write</span>
                      <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded ml-2">Required for trading</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        checked={permissionLevel === 'read_write_withdraw'}
                        onChange={() => setPermissionLevel('read_write_withdraw')}
                      />
                      <span>Read/Write/Withdraw</span>
                      <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded ml-2">High risk</span>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <motion.button
                  onClick={handleAddExchange}
                  disabled={loading || (!showCustomExchange && !selectedExchange) || !apiKey || !apiSecret || (showCustomExchange && (!customExchangeId || !customExchangeName))}
                  className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Plus className="w-4 h-4" />
                  <span>{loading ? 'Adding...' : 'Add Exchange'}</span>
                </motion.button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setShowCustomExchange(false);
                  }}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
              
              <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                  <div>
                    <p className="text-yellow-400 font-medium">Security Notice</p>
                    <p className="text-sm text-slate-300 mt-1">
                      API keys are stored locally and never transmitted to our servers. Always use the minimum permissions required for your trading strategy.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Instructions */}
        <div className="border-t border-slate-700/50 p-6">
          <h4 className="font-semibold mb-3">API Key Instructions</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h5 className="font-medium text-blue-400 mb-2">Creating API Keys</h5>
              <ol className="space-y-2 text-slate-300 list-decimal pl-4">
                <li>Log in to your exchange account</li>
                <li>Navigate to API settings (usually in account or security settings)</li>
                <li>Create a new API key with appropriate permissions</li>
                <li>Copy the API key and secret immediately (secrets are often shown only once)</li>
                <li>Set IP restrictions if available for additional security</li>
              </ol>
            </div>
            <div>
              <h5 className="font-medium text-yellow-400 mb-2">Permission Levels</h5>
              <ul className="space-y-2 text-slate-300">
                <li><span className="text-blue-400 font-medium">Read Only:</span> View balances and orders, but cannot trade</li>
                <li><span className="text-yellow-400 font-medium">Read/Write:</span> View data and place/cancel orders</li>
                <li><span className="text-red-400 font-medium">Read/Write/Withdraw:</span> Full access including withdrawals (highest risk)</li>
              </ul>
              <p className="mt-2 text-slate-400">
                Always use the minimum permission level required for your needs.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ExchangeApiManager;