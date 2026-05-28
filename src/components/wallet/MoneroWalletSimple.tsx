import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface MoneroWalletSimpleProps {
  onClose: () => void;
}

export const MoneroWalletSimple: React.FC<MoneroWalletSimpleProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'send', label: 'Send' },
    { id: 'receive', label: 'Receive' },
    { id: 'history', label: 'History' },
    { id: 'mining', label: 'Mining' },
    { id: 'settings', label: 'Settings' }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-slate-900 rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">X</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Monero Wallet</h2>
              <p className="text-slate-400 text-sm">Full GUI Wallet Interface</p>
            </div>
          </div>
          <motion.button
            onClick={onClose}
            className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-white font-bold">×</span>
          </motion.button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-orange-500 text-orange-400 bg-slate-800/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {tab.label}
            </motion.button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-orange-600/20 to-orange-500/20 border border-orange-500/30 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">Total Balance</h3>
                <div className="text-3xl font-bold text-orange-400 mb-2">0.000000000000 XMR</div>
                <div className="text-slate-400 text-sm">Unlocked: 0.000000000000 XMR</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-white mb-4">Node Status</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Status:</span>
                      <span className="text-red-400">Disconnected</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Height:</span>
                      <span className="text-white">N/A</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-white mb-4">Mining Status</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Status:</span>
                      <span className="text-slate-400">Inactive</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Threads:</span>
                      <span className="text-white">0</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'send' && (
            <div className="max-w-md mx-auto">
              <h3 className="text-xl font-bold text-white mb-6">Send Monero</h3>
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <p className="text-slate-400 text-center">
                  Connect to Monero RPC to enable sending
                </p>
              </div>
            </div>
          )}

          {activeTab === 'receive' && (
            <div className="max-w-md mx-auto text-center">
              <h3 className="text-xl font-bold text-white mb-6">Receive Monero</h3>
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <p className="text-slate-400 text-center">
                  Connect to Monero RPC to generate addresses
                </p>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <h3 className="text-xl font-bold text-white mb-6">Transaction History</h3>
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <p className="text-slate-400 text-center">
                  Connect to Monero RPC to view transaction history
                </p>
              </div>
            </div>
          )}

          {activeTab === 'mining' && (
            <div>
              <h3 className="text-xl font-bold text-white mb-6">Mining Control</h3>
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <p className="text-slate-400 text-center">
                  Connect to Monero RPC to control mining
                </p>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <h3 className="text-xl font-bold text-white mb-6">Settings</h3>
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <p className="text-slate-400 text-center">
                  Configure Monero RPC connections here
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default MoneroWalletSimple;
