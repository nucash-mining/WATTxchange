import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Square, Settings, RefreshCw, Plus, Trash2, Check, AlertTriangle, Eye, EyeOff, ChevronDown, ChevronUp, BarChart2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface TradingBotManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Exchange {
  exchange_id: string;
  name: string;
  api_key: string;
  api_secret: string;
  password?: string;
  permission_level: 'read_only' | 'read_write' | 'read_write_withdraw';
  enabled: boolean;
  test_mode: boolean;
}

interface Strategy {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, any>;
}

const TradingBotManager: React.FC<TradingBotManagerProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'exchanges' | 'strategies' | 'status'>('exchanges');
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [activeStrategy, setActiveStrategy] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showAddExchange, setShowAddExchange] = useState(false);
  const [showAddStrategy, setShowAddStrategy] = useState(false);
  const [selectedExchange, setSelectedExchange] = useState<string>('xeggex');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [apiPassword, setApiPassword] = useState('');
  const [permissionLevel, setPermissionLevel] = useState<'read_only' | 'read_write' | 'read_write_withdraw'>('read_only');
  const [showSecrets, setShowSecrets] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandedStrategy, setExpandedStrategy] = useState<string | null>(null);
  const [strategyParams, setStrategyParams] = useState<Record<string, any>>({});

  // Mock data for demonstration
  const supportedExchanges = [
    { id: 'xeggex', name: 'XeggeX' },
    { id: 'kraken', name: 'Kraken' },
    { id: 'binance', name: 'Binance' },
    { id: 'tradeogre', name: 'TradeOgre' },
    { id: 'kucoin', name: 'KuCoin' },
    { id: 'bittrex', name: 'Bittrex' },
    { id: 'coinbase', name: 'Coinbase Pro' },
    { id: 'huobi', name: 'Huobi' },
    { id: 'okx', name: 'OKX' },
    { id: 'bybit', name: 'Bybit' }
  ];

  const mockStrategies = [
    {
      id: 'grid_trading',
      name: 'Grid Trading',
      description: 'Creates a grid of buy and sell orders at regular price intervals to profit from price oscillations within a range.',
      parameters: {
        exchange_id: { type: 'string', description: 'Exchange to trade on', required: true },
        symbol: { type: 'string', description: 'Market symbol to trade (e.g., BTC/USDT)', required: true },
        lower_price: { type: 'float', description: 'Lower price boundary for the grid', required: true },
        upper_price: { type: 'float', description: 'Upper price boundary for the grid', required: true },
        grid_levels: { type: 'integer', description: 'Number of grid levels', default: 10, min: 2, max: 100 },
        total_investment: { type: 'float', description: 'Total investment amount in quote currency', required: true }
      }
    },
    {
      id: 'arbitrage',
      name: 'Cross-Exchange Arbitrage',
      description: 'Exploits price differences between the same asset on different exchanges by buying on the exchange with the lower price and selling on the exchange with the higher price.',
      parameters: {
        symbol: { type: 'string', description: 'Trading pair to arbitrage (e.g., BTC/USDT)', required: true },
        exchanges: { type: 'array', description: 'List of exchange IDs to use for arbitrage', required: true, min_length: 2 },
        min_profit_percent: { type: 'float', description: 'Minimum profit percentage to execute arbitrage', default: 1.0, min: 0.1 },
        max_order_size: { type: 'float', description: 'Maximum order size in base currency', required: true }
      }
    }
  ];

  useEffect(() => {
    if (isOpen) {
      // Load exchanges and strategies
      loadExchanges();
      loadStrategies();
      loadBotStatus();
    }
  }, [isOpen]);

  const loadExchanges = () => {
    // In a real implementation, this would fetch from the API
    setExchanges([
      {
        exchange_id: 'xeggex',
        name: 'XeggeX',
        api_key: '********',
        api_secret: '********',
        permission_level: 'read_only',
        enabled: true,
        test_mode: false
      },
      {
        exchange_id: 'kraken',
        name: 'Kraken',
        api_key: '********',
        api_secret: '********',
        permission_level: 'read_write',
        enabled: true,
        test_mode: false
      }
    ]);
  };

  const loadStrategies = () => {
    // In a real implementation, this would fetch from the API
    setStrategies(mockStrategies);
  };

  const loadBotStatus = () => {
    // In a real implementation, this would fetch from the API
    setActiveStrategy('grid_trading');
    setIsRunning(false);
    setStrategyParams({
      exchange_id: 'xeggex',
      symbol: 'BTC/USDT',
      lower_price: 50000,
      upper_price: 60000,
      grid_levels: 10,
      total_investment: 1000
    });
  };

  const handleAddExchange = () => {
    if (!apiKey || !apiSecret) {
      toast.error('API key and secret are required');
      return;
    }

    setLoading(true);

    // In a real implementation, this would call the API
    setTimeout(() => {
      const newExchange: Exchange = {
        exchange_id: selectedExchange,
        name: supportedExchanges.find(e => e.id === selectedExchange)?.name || selectedExchange,
        api_key: apiKey,
        api_secret: apiSecret,
        password: apiPassword || undefined,
        permission_level: permissionLevel,
        enabled: true,
        test_mode: false
      };

      setExchanges([...exchanges, newExchange]);
      setShowAddExchange(false);
      setApiKey('');
      setApiSecret('');
      setApiPassword('');
      setPermissionLevel('read_only');
      setLoading(false);
      toast.success(`Added ${newExchange.name} exchange`);
    }, 1000);
  };

  const handleRemoveExchange = (exchangeId: string) => {
    setLoading(true);

    // In a real implementation, this would call the API
    setTimeout(() => {
      setExchanges(exchanges.filter(e => e.exchange_id !== exchangeId));
      setLoading(false);
      toast.success('Exchange removed');
    }, 500);
  };

  const handleTestConnection = (exchangeId: string) => {
    setLoading(true);

    // In a real implementation, this would call the API
    setTimeout(() => {
      setLoading(false);
      toast.success('Connection successful!');
    }, 1000);
  };

  const handleStartBot = () => {
    if (!activeStrategy) {
      toast.error('No strategy selected');
      return;
    }

    setLoading(true);

    // In a real implementation, this would call the API
    setTimeout(() => {
      setIsRunning(true);
      setLoading(false);
      toast.success('Trading bot started');
    }, 1000);
  };

  const handleStopBot = () => {
    setLoading(true);

    // In a real implementation, this would call the API
    setTimeout(() => {
      setIsRunning(false);
      setLoading(false);
      toast.success('Trading bot stopped');
    }, 1000);
  };

  const handleSelectStrategy = (strategyId: string) => {
    setActiveStrategy(strategyId);
    
    // Set default parameters for the selected strategy
    const strategy = strategies.find(s => s.id === strategyId);
    if (strategy) {
      const defaultParams: Record<string, any> = {};
      Object.entries(strategy.parameters).forEach(([key, param]) => {
        if ('default' in param) {
          defaultParams[key] = param.default;
        }
      });
      setStrategyParams(defaultParams);
    }
    
    toast.success(`Selected ${strategyId} strategy`);
  };

  const handleUpdateStrategyParam = (key: string, value: any) => {
    setStrategyParams({
      ...strategyParams,
      [key]: value
    });
  };

  const renderParameterInput = (key: string, param: any) => {
    const value = strategyParams[key] !== undefined ? strategyParams[key] : '';
    
    if (param.type === 'string') {
      if (key === 'exchange_id') {
        return (
          <select
            value={value}
            onChange={(e) => handleUpdateStrategyParam(key, e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-500/50"
          >
            <option value="">Select Exchange</option>
            {exchanges.map(exchange => (
              <option key={exchange.exchange_id} value={exchange.exchange_id}>
                {exchange.name}
              </option>
            ))}
          </select>
        );
      }
      
      if (key === 'symbol') {
        return (
          <select
            value={value}
            onChange={(e) => handleUpdateStrategyParam(key, e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-500/50"
          >
            <option value="">Select Symbol</option>
            <option value="BTC/USDT">BTC/USDT</option>
            <option value="ETH/USDT">ETH/USDT</option>
            <option value="ALT/BTC">ALT/BTC</option>
            <option value="WATT/ALT">WATT/ALT</option>
            <option value="GHOST/BTC">GHOST/BTC</option>
            <option value="TROLL/BTC">TROLL/BTC</option>
          </select>
        );
      }
      
      return (
        <input
          type="text"
          value={value}
          onChange={(e) => handleUpdateStrategyParam(key, e.target.value)}
          className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-500/50"
        />
      );
    }
    
    if (param.type === 'float' || param.type === 'integer') {
      return (
        <input
          type="number"
          value={value}
          onChange={(e) => handleUpdateStrategyParam(key, param.type === 'integer' ? parseInt(e.target.value) : parseFloat(e.target.value))}
          min={param.min}
          max={param.max}
          step={param.type === 'integer' ? 1 : 0.01}
          className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-500/50"
        />
      );
    }
    
    if (param.type === 'array' && key === 'exchanges') {
      return (
        <div className="space-y-2">
          {exchanges.map(exchange => (
            <label key={exchange.exchange_id} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={Array.isArray(value) && value.includes(exchange.exchange_id)}
                onChange={(e) => {
                  const currentValue = Array.isArray(value) ? value : [];
                  if (e.target.checked) {
                    handleUpdateStrategyParam(key, [...currentValue, exchange.exchange_id]);
                  } else {
                    handleUpdateStrategyParam(key, currentValue.filter(id => id !== exchange.exchange_id));
                  }
                }}
                className="rounded"
              />
              <span>{exchange.name}</span>
            </label>
          ))}
        </div>
      );
    }
    
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => handleUpdateStrategyParam(key, e.target.value)}
        className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-500/50"
      />
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          className="bg-slate-800/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 max-w-5xl w-full max-h-[90vh] overflow-y-auto"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
            <div>
              <h3 className="text-xl font-semibold">Trading Bot Manager</h3>
              <p className="text-slate-400 text-sm">Configure and control your automated trading strategies</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center space-x-2 p-4 border-b border-slate-700/50">
            <button
              onClick={() => setActiveTab('exchanges')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'exchanges'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
              }`}
            >
              Exchanges
            </button>
            <button
              onClick={() => setActiveTab('strategies')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'strategies'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
              }`}
            >
              Strategies
            </button>
            <button
              onClick={() => setActiveTab('status')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'status'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
              }`}
            >
              Status
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Exchanges Tab */}
            {activeTab === 'exchanges' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold">Exchange Connections</h4>
                  <motion.button
                    onClick={() => setShowAddExchange(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Exchange</span>
                  </motion.button>
                </div>

                {exchanges.length === 0 ? (
                  <div className="text-center py-8">
                    <BarChart2 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-400 mb-2">No exchanges configured</p>
                    <p className="text-slate-500 text-sm">Add an exchange to start trading</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {exchanges.map((exchange) => (
                      <div
                        key={exchange.exchange_id}
                        className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <h5 className="font-semibold">{exchange.name}</h5>
                            <span className={`text-xs px-2 py-1 rounded ${
                              exchange.permission_level === 'read_only'
                                ? 'bg-blue-500/20 text-blue-400'
                                : exchange.permission_level === 'read_write'
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {exchange.permission_level.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleTestConnection(exchange.exchange_id)}
                              disabled={loading}
                              className="p-2 hover:bg-slate-700/50 rounded transition-colors disabled:opacity-50"
                            >
                              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                            <button
                              onClick={() => handleRemoveExchange(exchange.exchange_id)}
                              disabled={loading}
                              className="p-2 hover:bg-red-500/20 rounded transition-colors text-red-400 disabled:opacity-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-slate-400">API Key</p>
                            <p className="font-mono">********</p>
                          </div>
                          <div>
                            <p className="text-slate-400">API Secret</p>
                            <p className="font-mono">********</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Exchange Form */}
                <AnimatePresence>
                  {showAddExchange && (
                    <motion.div
                      className="bg-slate-900/50 rounded-lg p-6 border border-slate-700/30 mt-6"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <h4 className="text-lg font-semibold mb-4">Add Exchange</h4>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Exchange</label>
                          <select
                            value={selectedExchange}
                            onChange={(e) => setSelectedExchange(e.target.value)}
                            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-500/50"
                          >
                            {supportedExchanges.map(exchange => (
                              <option key={exchange.id} value={exchange.id}>{exchange.name}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-2">API Key</label>
                          <input
                            type="text"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-500/50"
                            placeholder="Enter API key"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-2">API Secret</label>
                          <div className="relative">
                            <input
                              type={showSecrets ? "text" : "password"}
                              value={apiSecret}
                              onChange={(e) => setApiSecret(e.target.value)}
                              className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:border-yellow-500/50"
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
                        
                        <div>
                          <label className="block text-sm font-medium mb-2">API Password (Optional)</label>
                          <input
                            type={showSecrets ? "text" : "password"}
                            value={apiPassword}
                            onChange={(e) => setApiPassword(e.target.value)}
                            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-500/50"
                            placeholder="Enter API password (if required)"
                          />
                        </div>
                        
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
                          disabled={loading || !apiKey || !apiSecret}
                          className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Plus className="w-4 h-4" />
                          <span>{loading ? 'Adding...' : 'Add Exchange'}</span>
                        </motion.button>
                        <button
                          onClick={() => setShowAddExchange(false)}
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
              </div>
            )}

            {/* Strategies Tab */}
            {activeTab === 'strategies' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold">Trading Strategies</h4>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-slate-400">Active Strategy:</span>
                    <span className="text-sm font-medium">
                      {activeStrategy ? strategies.find(s => s.id === activeStrategy)?.name || activeStrategy : 'None'}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {strategies.map((strategy) => (
                    <div
                      key={strategy.id}
                      className={`bg-slate-900/50 rounded-lg border transition-all duration-300 ${
                        activeStrategy === strategy.id
                          ? 'border-yellow-500/50 bg-yellow-500/5'
                          : 'border-slate-700/30'
                      }`}
                    >
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <h5 className="font-semibold">{strategy.name}</h5>
                            {activeStrategy === strategy.id && (
                              <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">
                                Active
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleSelectStrategy(strategy.id)}
                              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                activeStrategy === strategy.id
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-slate-700 hover:bg-slate-600'
                              }`}
                            >
                              {activeStrategy === strategy.id ? 'Selected' : 'Select'}
                            </button>
                            <button
                              onClick={() => setExpandedStrategy(expandedStrategy === strategy.id ? null : strategy.id)}
                              className="p-1 hover:bg-slate-700/50 rounded transition-colors"
                            >
                              {expandedStrategy === strategy.id ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-slate-400 mt-1">{strategy.description}</p>
                      </div>

                      {/* Strategy Parameters */}
                      <AnimatePresence>
                        {expandedStrategy === strategy.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="px-4 pb-4"
                          >
                            <div className="border-t border-slate-700/30 pt-4 mt-2">
                              <h6 className="font-medium mb-3">Strategy Parameters</h6>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.entries(strategy.parameters).map(([key, param]) => (
                                  <div key={key}>
                                    <label className="block text-sm font-medium mb-1">
                                      {key}
                                      {param.required && <span className="text-red-400 ml-1">*</span>}
                                    </label>
                                    {renderParameterInput(key, param)}
                                    <p className="text-xs text-slate-500 mt-1">{param.description}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status Tab */}
            {activeTab === 'status' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold">Bot Status</h4>
                  <div className="flex items-center space-x-3">
                    {isRunning ? (
                      <motion.button
                        onClick={handleStopBot}
                        disabled={loading || !activeStrategy}
                        className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Square className="w-4 h-4" />
                        <span>{loading ? 'Stopping...' : 'Stop Bot'}</span>
                      </motion.button>
                    ) : (
                      <motion.button
                        onClick={handleStartBot}
                        disabled={loading || !activeStrategy}
                        className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Play className="w-4 h-4" />
                        <span>{loading ? 'Starting...' : 'Start Bot'}</span>
                      </motion.button>
                    )}
                    <motion.button
                      onClick={() => loadBotStatus()}
                      disabled={loading}
                      className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-50"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </motion.button>
                  </div>
                </div>

                {/* Status Overview */}
                <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-700/30">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="font-semibold">Overview</h5>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
                      <span className="text-sm">{isRunning ? 'Running' : 'Stopped'}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-slate-400 text-sm mb-1">Active Strategy</p>
                      <p className="font-medium">
                        {activeStrategy ? strategies.find(s => s.id === activeStrategy)?.name || activeStrategy : 'None'}
                      </p>
                      
                      {activeStrategy && (
                        <div className="mt-4 space-y-2">
                          <p className="text-slate-400 text-sm mb-1">Parameters</p>
                          <div className="bg-slate-800/50 rounded-lg p-3 text-sm">
                            {Object.entries(strategyParams).map(([key, value]) => (
                              <div key={key} className="flex justify-between py-1">
                                <span className="text-slate-400">{key}:</span>
                                <span className="font-mono">{Array.isArray(value) ? value.join(', ') : value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <p className="text-slate-400 text-sm mb-1">Performance</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-2xl font-bold text-emerald-400">+$0.00</p>
                          <p className="text-xs text-slate-400">Total Profit/Loss</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold">0</p>
                          <p className="text-xs text-slate-400">Total Trades</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-yellow-400">0.0%</p>
                          <p className="text-xs text-slate-400">Win Rate</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-blue-400">0.0%</p>
                          <p className="text-xs text-slate-400">Avg. Return</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div>
                  <h5 className="font-semibold mb-3">Recent Activity</h5>
                  <div className="bg-slate-900/50 rounded-lg border border-slate-700/30">
                    <div className="p-4 text-center text-slate-400">
                      No recent activity
                    </div>
                  </div>
                </div>

                {/* Python Process Status */}
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
                  <h5 className="font-semibold mb-3">Python Process</h5>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-400' : 'bg-slate-400'}`}></div>
                      <span className="text-sm">{isRunning ? 'Running' : 'Stopped'}</span>
                    </div>
                    <div className="text-sm text-slate-400">
                      PID: {isRunning ? '12345' : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-700/50 p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-400">
                <p>Python Trading Bot v1.0.0</p>
                <p>Powered by Hummingbot & CCXT</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`}></div>
                <span className="text-sm">{isRunning ? 'Bot Running' : 'Bot Stopped'}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TradingBotManager;