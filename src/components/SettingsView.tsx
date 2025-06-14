import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Shield, Network, Bell, Palette, Key } from 'lucide-react';

const SettingsView: React.FC = () => {
  const [activeSection, setActiveSection] = useState('general');

  const sections = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'network', label: 'Network', icon: Network },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'advanced', label: 'Advanced', icon: Key }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-3xl font-bold">Settings</h2>
        <p className="text-slate-400 mt-1">Configure your wallet preferences</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <motion.div
          className="lg:col-span-1 space-y-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {sections.map((section, index) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            
            return (
              <motion.button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600/20 border border-blue-500/30 text-blue-400'
                    : 'hover:bg-slate-800/50 text-slate-300 hover:text-white'
                }`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ x: 4 }}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{section.label}</span>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Settings Content */}
        <motion.div
          className="lg:col-span-3"
          key={activeSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
            {activeSection === 'general' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">General Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Default Currency</label>
                    <select className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500/50">
                      <option>USD</option>
                      <option>EUR</option>
                      <option>GBP</option>
                      <option>BTC</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Language</label>
                    <select className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500/50">
                      <option>English</option>
                      <option>Español</option>
                      <option>Français</option>
                      <option>Deutsch</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Auto-refresh balances</p>
                      <p className="text-sm text-slate-400">Automatically update wallet balances</p>
                    </div>
                    <input type="checkbox" className="toggle" defaultChecked />
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'security' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">Security Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Two-Factor Authentication</p>
                      <p className="text-sm text-slate-400">Add an extra layer of security</p>
                    </div>
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-colors">
                      Enable
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Auto-lock timeout</p>
                      <p className="text-sm text-slate-400">Lock wallet after inactivity</p>
                    </div>
                    <select className="bg-slate-900/50 border border-slate-700/50 rounded px-3 py-2">
                      <option>5 minutes</option>
                      <option>15 minutes</option>
                      <option>30 minutes</option>
                      <option>Never</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Hardware wallet support</p>
                      <p className="text-sm text-slate-400">Connect Ledger or Trezor</p>
                    </div>
                    <input type="checkbox" className="toggle" />
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'network' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">Network Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Node Configuration</label>
                    <div className="space-y-3">
                      {['Bitcoin', 'Ethereum', 'Litecoin', 'Altcoin (2330)'].map(chain => (
                        <div key={chain} className="flex items-center justify-between p-3 bg-slate-900/30 rounded-lg">
                          <span>{chain}</span>
                          <select className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm">
                            <option>Light Node</option>
                            <option>Full Node</option>
                            <option>Custom RPC</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Use Tor for privacy</p>
                      <p className="text-sm text-slate-400">Route connections through Tor network</p>
                    </div>
                    <input type="checkbox" className="toggle" />
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'notifications' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">Notification Settings</h3>
                <div className="space-y-4">
                  {[
                    'Transaction confirmations',
                    'Price alerts',
                    'Mining rewards',
                    'DEX order fills',
                    'Atomic swap completions',
                    'Security alerts'
                  ].map(notification => (
                    <div key={notification} className="flex items-center justify-between">
                      <span>{notification}</span>
                      <input type="checkbox" className="toggle" defaultChecked />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'appearance' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">Appearance Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Theme</label>
                    <div className="grid grid-cols-3 gap-3">
                      {['Dark', 'Light', 'Auto'].map(theme => (
                        <button
                          key={theme}
                          className={`p-3 rounded-lg border transition-colors ${
                            theme === 'Dark' 
                              ? 'border-blue-500 bg-blue-500/20 text-blue-400' 
                              : 'border-slate-700 hover:border-slate-600'
                          }`}
                        >
                          {theme}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Compact mode</p>
                      <p className="text-sm text-slate-400">Reduce spacing and padding</p>
                    </div>
                    <input type="checkbox" className="toggle" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Show animations</p>
                      <p className="text-sm text-slate-400">Enable interface animations</p>
                    </div>
                    <input type="checkbox" className="toggle" defaultChecked />
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'advanced' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">Advanced Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Gas Price Strategy</label>
                    <select className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2">
                      <option>Slow (Low fees)</option>
                      <option>Standard</option>
                      <option>Fast (High fees)</option>
                      <option>Custom</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Developer mode</p>
                      <p className="text-sm text-slate-400">Enable advanced features</p>
                    </div>
                    <input type="checkbox" className="toggle" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Export logs</p>
                      <p className="text-sm text-slate-400">Download application logs</p>
                    </div>
                    <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors">
                      Export
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SettingsView;