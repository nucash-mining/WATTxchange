import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Clock, 
  Copy, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { xmrWrappingService, WrapRequest } from '../../services/xmrWrappingService';

interface XMRWrappingInterfaceProps {
  onClose: () => void;
}

const XMRWrappingInterface: React.FC<XMRWrappingInterfaceProps> = ({ onClose }) => {
  const [wrapAmount, setWrapAmount] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [wrapRequests, setWrapRequests] = useState<WrapRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<WrapRequest | null>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Load existing wrap requests on mount
  useEffect(() => {
    loadWrapRequests();
    
    // Start monitoring
    xmrWrappingService.startMonitoring();
    
    // Refresh requests every 10 seconds
    const interval = setInterval(loadWrapRequests, 10000);
    
    return () => {
      clearInterval(interval);
      xmrWrappingService.stopMonitoring();
    };
  }, []);

  const loadWrapRequests = () => {
    const requests = xmrWrappingService.getAllWrapRequests();
    setWrapRequests(requests);
  };

  const handleCreateWrap = async () => {
    const amount = parseFloat(wrapAmount);
    if (!amount || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setIsCreating(true);
    try {
      const request = await xmrWrappingService.createWrapRequest(amount);
      setWrapRequests(prev => [request, ...prev]);
      setSelectedRequest(request);
      setWrapAmount('');
    } catch (error) {
      console.error('Failed to create wrap request:', error);
      alert('Failed to create wrap request. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'deposited':
        return <AlertCircle className="w-4 h-4 text-blue-400" />;
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'wrapped':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'expired':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-400';
      case 'deposited':
        return 'text-blue-400';
      case 'confirmed':
        return 'text-green-400';
      case 'wrapped':
        return 'text-green-500';
      case 'expired':
        return 'text-red-400';
      case 'failed':
        return 'text-red-500';
      default:
        return 'text-gray-400';
    }
  };

  const formatTimeRemaining = (expiresAt: Date) => {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatAmount = (amount: number) => {
    return amount.toFixed(4);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-slate-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-2xl font-bold text-white">XMR to wXMR Wrapping</h2>
            <p className="text-slate-400 mt-1">Wrap your Monero to Altcoinchain wXMR tokens</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Left Panel - Create Wrap */}
          <div className="w-1/2 p-6 border-r border-slate-700 overflow-y-auto">
            <div className="space-y-6">
              {/* Create New Wrap */}
              <div className="bg-slate-800/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Create New Wrap</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      XMR Amount to Wrap
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      min="0"
                      value={wrapAmount}
                      onChange={(e) => setWrapAmount(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="0.0000"
                    />
                  </div>

                  <div className="bg-orange-900/20 border border-orange-600/30 rounded-lg p-4">
                    <h4 className="font-semibold text-orange-400 mb-2">⚠️ Important Notes</h4>
                    <ul className="text-sm text-orange-200 space-y-1">
                      <li>• Each wrap creates a unique deposit address</li>
                      <li>• You have 30 minutes to complete the deposit</li>
                      <li>• Minimum 10 confirmations required</li>
                      <li>• 1:1 ratio (1 XMR = 1 wXMR)</li>
                    </ul>
                  </div>

                  <motion.button
                    onClick={handleCreateWrap}
                    disabled={isCreating || !wrapAmount}
                    className="w-full py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center space-x-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isCreating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-4 h-4" />
                        <span>Create Wrap Request</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>

              {/* Service Status */}
              <div className="bg-slate-800/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Service Status</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Monitoring:</span>
                    <span className="text-green-400">Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Requests:</span>
                    <span className="text-white">{wrapRequests.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pending:</span>
                    <span className="text-yellow-400">
                      {wrapRequests.filter(r => r.status === 'pending').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Completed:</span>
                    <span className="text-green-400">
                      {wrapRequests.filter(r => r.status === 'wrapped').length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Wrap Requests */}
          <div className="w-1/2 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Wrap Requests</h3>
              <button
                onClick={loadWrapRequests}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {wrapRequests.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-400">No wrap requests yet</p>
                <p className="text-slate-500 text-sm mt-1">Create your first wrap request to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {wrapRequests.map((request) => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedRequest?.id === request.id
                        ? 'bg-orange-900/20 border-orange-600/50'
                        : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800/70'
                    }`}
                    onClick={() => setSelectedRequest(request)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(request.status)}
                        <span className={`font-medium ${getStatusColor(request.status)}`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </div>
                      <span className="text-sm text-slate-400">
                        {formatAmount(request.amount)} XMR
                      </span>
                    </div>
                    
                    <div className="text-xs text-slate-400 space-y-1">
                      <div>ID: {request.id.substring(0, 16)}...</div>
                      <div>Created: {request.createdAt.toLocaleTimeString()}</div>
                      {request.status === 'pending' && (
                        <div className="text-yellow-400">
                          Expires in: {formatTimeRemaining(request.expiresAt)}
                        </div>
                      )}
                      {request.txId && (
                        <div>TX: {request.txId.substring(0, 16)}...</div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Panel - Selected Request Details */}
        {selectedRequest && (
          <div className="border-t border-slate-700 p-6 bg-slate-800/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Wrap Request Details</h3>
              <div className="flex items-center space-x-2">
                {getStatusIcon(selectedRequest.status)}
                <span className={`font-medium ${getStatusColor(selectedRequest.status)}`}>
                  {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Deposit Address */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Deposit Address
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={selectedRequest.depositAddress}
                    readOnly
                    className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm font-mono"
                  />
                  <button
                    onClick={() => copyToClipboard(selectedRequest.depositAddress)}
                    className="px-3 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded transition-colors"
                  >
                    {copiedAddress ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Send exactly {formatAmount(selectedRequest.amount)} XMR to this address
                </p>
              </div>

              {/* Request Info */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Request Information
                </label>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Amount:</span>
                    <span className="text-white">{formatAmount(selectedRequest.amount)} XMR</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Expected wXMR:</span>
                    <span className="text-white">{formatAmount(selectedRequest.wXMRAmount)} wXMR</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Created:</span>
                    <span className="text-white">{selectedRequest.createdAt.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Expires:</span>
                    <span className="text-white">{selectedRequest.expiresAt.toLocaleString()}</span>
                  </div>
                  {selectedRequest.status === 'pending' && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Time Remaining:</span>
                      <span className="text-yellow-400">{formatTimeRemaining(selectedRequest.expiresAt)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {selectedRequest.error && (
              <div className="mt-4 p-3 bg-red-900/20 border border-red-600/30 rounded-lg">
                <p className="text-red-400 text-sm">Error: {selectedRequest.error}</p>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default XMRWrappingInterface;
