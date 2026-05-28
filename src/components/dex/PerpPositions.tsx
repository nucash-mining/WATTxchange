import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, X, Edit, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

interface Position {
  id: string;
  market: string;
  type: 'long' | 'short';
  size: string;
  collateral: string;
  collateralToken: string;
  leverage: number;
  entryPrice: number;
  markPrice: number;
  liquidationPrice: number;
  pnl: number;
  pnlPercent: number;
  fundingRate: string;
  openTime: Date;
  takeProfitPrice?: number;
  stopLossPrice?: number;
}

const PerpPositions: React.FC = () => {
  const [positions, setPositions] = useState<Position[]>([
    {
      id: 'pos-1',
      market: 'BTC-USD',
      type: 'long',
      size: '$5,000',
      collateral: '500',
      collateralToken: 'USDT',
      leverage: 10,
      entryPrice: 48500,
      markPrice: 50000,
      liquidationPrice: 44000,
      pnl: 150,
      pnlPercent: 3.09,
      fundingRate: '0.01%/8h',
      openTime: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
    },
    {
      id: 'pos-2',
      market: 'ETH-USD',
      type: 'short',
      size: '$3,500',
      collateral: '350',
      collateralToken: 'USDT',
      leverage: 10,
      entryPrice: 3600,
      markPrice: 3500,
      liquidationPrice: 3960,
      pnl: 100,
      pnlPercent: 2.86,
      fundingRate: '0.008%/8h',
      openTime: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      takeProfitPrice: 3300,
      stopLossPrice: 3700
    }
  ]);

  const [expandedPosition, setExpandedPosition] = useState<string | null>(null);
  const [editingPosition, setEditingPosition] = useState<string | null>(null);
  const [takeProfitPrice, setTakeProfitPrice] = useState<string>('');
  const [stopLossPrice, setStopLossPrice] = useState<string>('');

  const toggleExpand = (positionId: string) => {
    if (expandedPosition === positionId) {
      setExpandedPosition(null);
    } else {
      setExpandedPosition(positionId);
    }
  };

  const handleEditPosition = (position: Position) => {
    setEditingPosition(position.id);
    setTakeProfitPrice(position.takeProfitPrice?.toString() || '');
    setStopLossPrice(position.stopLossPrice?.toString() || '');
  };

  const handleSaveEdit = (positionId: string) => {
    setPositions(positions.map(pos => {
      if (pos.id === positionId) {
        return {
          ...pos,
          takeProfitPrice: takeProfitPrice ? parseFloat(takeProfitPrice) : undefined,
          stopLossPrice: stopLossPrice ? parseFloat(stopLossPrice) : undefined
        };
      }
      return pos;
    }));
    
    setEditingPosition(null);
    toast.success('Position updated successfully');
  };

  const handleClosePosition = (positionId: string) => {
    // In a real implementation, this would call an API to close the position
    toast.success('Position closed successfully');
    
    // Remove position from list
    setPositions(positions.filter(pos => pos.id !== positionId));
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' years ago';
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' months ago';
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' days ago';
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hours ago';
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutes ago';
    
    return Math.floor(seconds) + ' seconds ago';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Open Positions</h3>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-slate-400">
            <span>Total PnL: </span>
            <span className="text-emerald-400 font-medium">
              +$250.00 (+3.00%)
            </span>
          </div>
        </div>
      </div>

      {positions.length === 0 ? (
        <div className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-12 border border-slate-700/50 text-center">
          <TrendingUp className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h4 className="text-lg font-semibold mb-2">No Open Positions</h4>
          <p className="text-slate-400 mb-6">You don't have any open positions yet</p>
          <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors">
            Open a Position
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {positions.map((position) => (
            <motion.div
              key={position.id}
              className="bg-slate-800/30 backdrop-blur-xl rounded-xl border border-slate-700/50 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              layout
            >
              {/* Position Header */}
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      position.type === 'long' ? 'bg-emerald-500/20' : 'bg-red-500/20'
                    }`}>
                      {position.type === 'long' ? (
                        <TrendingUp className={`w-5 h-5 ${
                          position.type === 'long' ? 'text-emerald-400' : 'text-red-400'
                        }`} />
                      ) : (
                        <TrendingDown className={`w-5 h-5 ${
                          position.type === 'long' ? 'text-emerald-400' : 'text-red-400'
                        }`} />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold">{position.market.replace('-', '/')}</h4>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-1 rounded capitalize ${
                          position.type === 'long' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {position.type}
                        </span>
                        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                          {position.leverage}x
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center space-x-2 justify-end">
                      <span className="font-medium">{position.size}</span>
                      <span className="text-xs text-slate-400">
                        ({position.collateral} {position.collateralToken})
                      </span>
                    </div>
                    <div className={`flex items-center space-x-1 justify-end ${
                      position.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      <span className="font-medium">
                        {position.pnl >= 0 ? '+' : ''}${position.pnl.toFixed(2)}
                      </span>
                      <span className="text-xs">
                        ({position.pnl >= 0 ? '+' : ''}{position.pnlPercent.toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div>
                    <p className="text-sm text-slate-400">Entry Price</p>
                    <p className="font-medium">${position.entryPrice.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Mark Price</p>
                    <p className="font-medium">${position.markPrice.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Liquidation Price</p>
                    <p className={`font-medium ${
                      position.type === 'long' ? 'text-red-400' : 'text-emerald-400'
                    }`}>
                      ${position.liquidationPrice.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Opened</p>
                    <p className="font-medium">{formatTimeAgo(position.openTime)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <button
                    onClick={() => toggleExpand(position.id)}
                    className="flex items-center space-x-1 text-sm text-slate-400 hover:text-white"
                  >
                    <span>Details</span>
                    {expandedPosition === position.id ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditPosition(position)}
                      className="flex items-center space-x-1 px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 rounded text-sm text-blue-400 border border-blue-500/30"
                    >
                      <Edit className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleClosePosition(position.id)}
                      className="flex items-center space-x-1 px-3 py-1 bg-red-600/20 hover:bg-red-600/30 rounded text-sm text-red-400 border border-red-500/30"
                    >
                      <X className="w-3 h-3" />
                      <span>Close</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedPosition === position.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-slate-700/50 p-6"
                >
                  {editingPosition === position.id ? (
                    <div className="space-y-4">
                      <h4 className="font-medium text-blue-400">Edit Position</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-slate-400 mb-2">Take Profit Price</label>
                          <div className="relative">
                            <input
                              type="number"
                              value={takeProfitPrice}
                              onChange={(e) => setTakeProfitPrice(e.target.value)}
                              placeholder="0.00"
                              className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 pr-16 focus:outline-none focus:border-blue-500/50"
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <span className="text-slate-400 text-sm">USD</span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm text-slate-400 mb-2">Stop Loss Price</label>
                          <div className="relative">
                            <input
                              type="number"
                              value={stopLossPrice}
                              onChange={(e) => setStopLossPrice(e.target.value)}
                              placeholder="0.00"
                              className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 pr-16 focus:outline-none focus:border-blue-500/50"
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <span className="text-slate-400 text-sm">USD</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 justify-end">
                        <button
                          onClick={() => setEditingPosition(null)}
                          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(position.id)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-slate-400">Funding Rate</p>
                          <p className="font-medium">{position.fundingRate}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-400">Funding Payment</p>
                          <p className="font-medium text-red-400">-$0.12</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-400">Take Profit</p>
                          <p className="font-medium">
                            {position.takeProfitPrice 
                              ? `$${position.takeProfitPrice.toLocaleString()}`
                              : 'Not Set'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-400">Stop Loss</p>
                          <p className="font-medium">
                            {position.stopLossPrice 
                              ? `$${position.stopLossPrice.toLocaleString()}`
                              : 'Not Set'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-slate-900/50 rounded-lg">
                        <h5 className="font-medium mb-3">Position Metrics</h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-slate-400">Margin Ratio</p>
                            <p className="font-medium">9.12%</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Margin Used</p>
                            <p className="font-medium">{position.collateral} {position.collateralToken}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Unrealized PnL</p>
                            <p className={`font-medium ${position.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {position.pnl >= 0 ? '+' : ''}${position.pnl.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400">ROE</p>
                            <p className={`font-medium ${position.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {position.pnl >= 0 ? '+' : ''}{position.pnlPercent.toFixed(2)}%
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 justify-end">
                        <button
                          onClick={() => handleClosePosition(position.id)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                        >
                          Close Position
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Position Statistics */}
      <motion.div
        className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-lg font-semibold mb-4">Position Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-400">2</p>
            <p className="text-slate-400 text-sm">Open Positions</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-400">+$250.00</p>
            <p className="text-slate-400 text-sm">Total PnL</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-400">$8,500</p>
            <p className="text-slate-400 text-sm">Total Size</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-400">$850</p>
            <p className="text-slate-400 text-sm">Total Margin</p>
          </div>
        </div>
      </motion.div>

      {/* Risk Management */}
      <motion.div
        className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/30 rounded-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-blue-600/20 rounded-lg">
            <DollarSign className="w-6 h-6 text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-400 mb-2">Risk Management</h3>
            <p className="text-slate-300 mb-3">
              Manage your risk effectively with our advanced position management tools. Set take profit and stop loss levels, 
              use trailing stops, and monitor your portfolio health with real-time metrics.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-emerald-400 mb-2">Account Health</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-400">Margin Used:</span>
                    <span className="text-sm font-medium">$850.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-400">Available Margin:</span>
                    <span className="text-sm font-medium">$4,150.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-400">Margin Ratio:</span>
                    <span className="text-sm font-medium text-emerald-400">17.0%</span>
                  </div>
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-400 mb-2">Liquidation Protection</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-400">Auto-Deleveraging:</span>
                    <span className="text-sm font-medium text-emerald-400">Enabled</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-400">Insurance Fund:</span>
                    <span className="text-sm font-medium">$2.5M</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-400">Partial Liquidation:</span>
                    <span className="text-sm font-medium text-emerald-400">Enabled</span>
                  </div>
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-purple-400 mb-2">Portfolio Metrics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-400">Win Rate:</span>
                    <span className="text-sm font-medium">65%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-400">Avg. ROE:</span>
                    <span className="text-sm font-medium text-emerald-400">+12.5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-400">Max Drawdown:</span>
                    <span className="text-sm font-medium text-red-400">-8.3%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PerpPositions;