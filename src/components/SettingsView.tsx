import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Shield, Network, Bell, Palette, Key, Eye, EyeOff, Copy } from 'lucide-react';
import QRCode from 'qrcode';
import toast from 'react-hot-toast';

// interface DeviceInfo {
//   isMobile: boolean;
//   isTablet: boolean;
//   isDesktop: boolean;
//   isMobileWallet: boolean;
//   isMetaMask: boolean;
//   isTrustWallet: boolean;
//   isRainbow: boolean;
//   isWalletConnect: boolean;
//   orientation: 'portrait' | 'landscape';
//   screenWidth: number;
//   screenHeight: number;
// }

const SettingsView: React.FC = () => {
  const [activeSection, setActiveSection] = useState('general');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [twoFactorQR, setTwoFactorQR] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [autoLockTimeout, setAutoLockTimeout] = useState('900'); // 15 minutes in seconds
  const [isVerifying, setIsVerifying] = useState(false);

  const sections = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'network', label: 'Network', icon: Network },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'advanced', label: 'Advanced', icon: Key }
  ];

  // Load saved settings
  useEffect(() => {
    // Load 2FA status
    const savedTwoFactorEnabled = localStorage.getItem('2fa_enabled') === 'true';
    setTwoFactorEnabled(savedTwoFactorEnabled);
    
    // Load auto-lock timeout
    const savedTimeout = localStorage.getItem('auto_lock_timeout');
    if (savedTimeout) {
      setAutoLockTimeout(savedTimeout);
    }
    
    // If 2FA is enabled, we need to load the secret
    if (savedTwoFactorEnabled) {
      const savedSecret = localStorage.getItem('2fa_secret');
      if (savedSecret) {
        setTwoFactorSecret(savedSecret);
        generateQRCode(savedSecret);
      } else {
        // If no secret is found but 2FA is enabled, generate a new one
        generateTwoFactorSecret();
      }
    }
  }, []);

  // Generate 2FA secret when enabling
  useEffect(() => {
    if (twoFactorEnabled && !twoFactorSecret) {
      generateTwoFactorSecret();
    }
  }, [twoFactorEnabled]);

  const generateTwoFactorSecret = async () => {
    // In a real implementation, this would be generated on the server
    // For demo purposes, we'll generate a random string
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 16; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    setTwoFactorSecret(secret);
    
    // Generate QR code
    generateQRCode(secret);
  };

  const generateQRCode = async (secret: string) => {
    try {
      const otpauth = `otpauth://totp/WATTxchange:${localStorage.getItem('wallet_address') || 'user'}?secret=${secret}&issuer=WATTxchange&algorithm=SHA1&digits=6&period=30`;
      const qrCode = await QRCode.toDataURL(otpauth);
      setTwoFactorQR(qrCode);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    }
  };

  const verifyTwoFactorCode = () => {
    setIsVerifying(true);
    
    // In a real implementation, this would verify the code with the server
    // For demo purposes, we'll simulate verification
    setTimeout(() => {
      // Simulate successful verification
      if (verificationCode.length === 6) {
        toast.success('Two-factor authentication enabled successfully!');
        localStorage.setItem('2fa_enabled', 'true');
        localStorage.setItem('2fa_secret', twoFactorSecret);
      } else {
        toast.error('Invalid verification code');
        setTwoFactorEnabled(false);
      }
      setIsVerifying(false);
      setVerificationCode('');
    }, 1500);
  };

  const handleAutoLockChange = (value: string) => {
    setAutoLockTimeout(value);
    localStorage.setItem('auto_lock_timeout', value);
    toast.success(`Auto-lock timeout set to ${formatTimeout(value)}`);
  };

  const formatTimeout = (seconds: string) => {
    const secs = parseInt(seconds);
    if (secs < 60) return `${secs} seconds`;
    if (secs < 3600) return `${Math.floor(secs / 60)} minutes`;
    if (secs < 86400) return `${Math.floor(secs / 3600)} hours`;
    return `${Math.floor(secs / 86400)} days`;
  };

  const copySecret = () => {
    navigator.clipboard.writeText(twoFactorSecret);
    toast.success('Secret copied to clipboard');
  };

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
                    <button 
                      className={`px-4 py-2 ${twoFactorEnabled ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'} rounded-lg text-sm transition-colors`}
                      onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                    >
                      {twoFactorEnabled ? 'Enabled' : 'Enable'}
                    </button>
                  </div>
                  
                  {twoFactorEnabled && (
                    <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30 space-y-4">
                      <div className="text-center">
                        <h4 className="font-medium text-yellow-400 mb-2">Scan QR Code</h4>
                        <p className="text-sm text-slate-400 mb-4">
                          Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                        </p>
                        {twoFactorQR && (
                          <div className="flex justify-center mb-4">
                            <img src={twoFactorQR} alt="2FA QR Code" className="w-48 h-48" />
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Secret Key</label>
                        <div className="flex">
                          <input
                            type={showSecret ? "text" : "password"}
                            value={twoFactorSecret}
                            readOnly
                            className="flex-1 bg-slate-900/50 border border-slate-700/50 rounded-l-lg px-3 py-2 focus:outline-none focus:border-blue-500/50 font-mono"
                          />
                          <button
                            onClick={() => setShowSecret(!showSecret)}
                            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 transition-colors rounded-none"
                          >
                            {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={copySecret}
                            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 transition-colors rounded-r-lg"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          If you can't scan the QR code, you can manually enter this secret key in your authenticator app.
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Verification Code</label>
                        <div className="flex">
                          <input
                            type="text"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
                            placeholder="Enter 6-digit code"
                            className="flex-1 bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500/50 font-mono"
                            maxLength={6}
                          />
                        </div>
                      </div>
                      
                      <button
                        onClick={verifyTwoFactorCode}
                        disabled={verificationCode.length !== 6 || isVerifying}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isVerifying ? 'Verifying...' : 'Verify and Enable 2FA'}
                      </button>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Auto-lock timeout</p>
                      <p className="text-sm text-slate-400">Lock wallet after inactivity</p>
                    </div>
                    <select 
                      className="bg-slate-900/50 border border-slate-700/50 rounded px-3 py-2"
                      value={autoLockTimeout}
                      onChange={(e) => handleAutoLockChange(e.target.value)}
                    >
                      <option value="10">10 seconds</option>
                      <option value="60">1 minute</option>
                      <option value="300">5 minutes</option>
                      <option value="900">15 minutes</option>
                      <option value="1800">30 minutes</option>
                      <option value="3600">1 hour</option>
                      <option value="21600">6 hours</option>
                      <option value="86400">1 day</option>
                      <option value="604800">7 days</option>
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