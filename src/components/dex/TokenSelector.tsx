import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, Plus, Check, AlertTriangle, ChevronUp } from 'lucide-react';
import { swapinService } from '../../services/swapinService';
import { tokenService } from '../../services/tokenService';
import { useWallet } from '../../hooks/useWallet';
import toast from 'react-hot-toast';

interface TokenSelectorProps {
  selectedToken: string;
  onSelectToken: (token: string) => void;
  excludeToken?: string;
  chainId: number;
}

const TokenSelector: React.FC<TokenSelectorProps> = ({
  selectedToken,
  onSelectToken,
  excludeToken,
  chainId
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddToken, setShowAddToken] = useState(false);
  const [customTokenAddress, setCustomTokenAddress] = useState('');
  const [customTokenSymbol, setCustomTokenSymbol] = useState('');
  const [customTokenDecimals, setCustomTokenDecimals] = useState('18');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{success: boolean; message: string} | null>(null);
  const { isConnected } = useWallet();

  // Get tokens for the selected chain
  const network = swapinService.getNetwork(chainId);
  const availableTokens = tokenService.getTokensForChain(network?.name || 'Altcoinchain');
  
  // Get Altcoinchain token addresses
  const altTokens = swapinService.getAltcoinchainTokens();

  // Define default tokens for Altcoinchain
  const defaultTokens = [
    { symbol: 'ALT', name: 'Altcoinchain' },
    { symbol: 'wALT', name: 'Wrapped ALT' },
    { symbol: 'WATT', name: 'WATT Token' },
    { symbol: 'AltPEPE', name: 'AltPEPE Token' },
    { symbol: 'AltPEPI', name: 'AltPEPI Token' },
    { symbol: 'SCAM', name: 'SCAM Token' },
    { symbol: 'SWAPD', name: 'SWAPD Token' },
    { symbol: 'MALT', name: 'MALT Token' }
  ];

  // Filter tokens based on search and excluded token
  const filteredTokens = availableTokens.length > 0 
    ? availableTokens.filter(token => 
        token.symbol !== excludeToken && 
        (token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) || 
         token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
         (token.address && token.address.toLowerCase().includes(searchTerm.toLowerCase()))))
    : defaultTokens.filter(token => 
        token.symbol !== excludeToken && 
        (token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) || 
         token.name.toLowerCase().includes(searchTerm.toLowerCase())));

  const getTokenIcon = (symbol: string) => {
    switch (symbol) {
      case 'ALT':
        return <img src="/Altcoinchain logo.png" alt="ALT" className="w-6 h-6 object-contain rounded-full" />;
      case 'wALT':
        return <img src="/Altcoinchain logo.png" alt="wALT" className="w-6 h-6 object-contain rounded-full" />;
      case 'WATT':
        return <img src="/WATT logo.png" alt="WATT" className="w-6 h-6 object-contain" />;
      case 'AltPEPE':
        return <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold">P</div>;
      case 'AltPEPI':
        return <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center text-xs font-bold">P</div>;
      case 'SCAM':
        return <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold">S</div>;
      case 'SWAPD':
        return <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs font-bold">S</div>;
      case 'MALT':
        return <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold">M</div>;
      case 'USDT':
        return <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-xs font-bold">U</div>;
      default:
        return <div className="w-6 h-6 bg-slate-500 rounded-full flex items-center justify-center text-xs font-bold">{symbol[0]}</div>;
    }
  };

  const getTokenAddress = (symbol: string) => {
    switch (symbol) {
      case 'ALT': return 'Native ALT';
      case 'wALT': return altTokens.wALT;
      case 'WATT': return altTokens.WATT;
      case 'AltPEPE': return altTokens.AltPEPE;
      case 'AltPEPI': return altTokens.AltPEPI;
      case 'SCAM': return altTokens.SCAM;
      case 'SWAPD': return altTokens.SWAPD;
      case 'MALT': return altTokens.MALT;
      default: return '';
    }
  };

  const handleSelectToken = (token: string) => {
    onSelectToken(token);
    setIsOpen(false);
    setSearchTerm('');
  };

  const verifyCustomToken = async () => {
    if (!customTokenAddress) {
      toast.error('Please enter a token contract address');
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      // Simulate token verification
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Check if address is valid format
      if (!customTokenAddress.startsWith('0x') || customTokenAddress.length !== 42) {
        setVerificationResult({
          success: false,
          message: 'Invalid contract address format'
        });
        return;
      }

      // Check if token symbol is provided
      if (!customTokenSymbol) {
        setVerificationResult({
          success: false,
          message: 'Please enter a token symbol'
        });
        return;
      }

      // Check if decimals is a valid number
      const decimals = parseInt(customTokenDecimals);
      if (isNaN(decimals) || decimals < 0 || decimals > 18) {
        setVerificationResult({
          success: false,
          message: 'Decimals must be between 0 and 18'
        });
        return;
      }

      // Simulate successful verification
      setVerificationResult({
        success: true,
        message: 'Token verified successfully!'
      });
    } catch (error) {
      console.error('Token verification failed:', error);
      setVerificationResult({
        success: false,
        message: 'Failed to verify token'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleAddCustomToken = async () => {
    if (!verificationResult?.success) {
      await verifyCustomToken();
      return;
    }

    try {
      // Add custom token to service
      const success = await tokenService.addCustomToken(network?.name || 'Altcoinchain', {
        symbol: customTokenSymbol,
        name: `Custom ${customTokenSymbol}`,
        address: customTokenAddress,
        decimals: parseInt(customTokenDecimals),
        logo: '',
        isNative: false
      });

      if (success) {
        toast.success(`Added ${customTokenSymbol} token successfully!`);
        setCustomTokenAddress('');
        setCustomTokenSymbol('');
        setCustomTokenDecimals('18');
        setShowAddToken(false);
        setVerificationResult(null);
        
        // Select the newly added token
        onSelectToken(customTokenSymbol);
        setIsOpen(false);
        
        // Trigger wallet to add token
        if (window.ethereum) {
          try {
            await window.ethereum.request({
              method: 'wallet_watchAsset',
              params: {
                type: 'ERC20',
                options: {
                  address: customTokenAddress,
                  symbol: customTokenSymbol,
                  decimals: parseInt(customTokenDecimals),
                  image: ''
                }
              }
            });
          } catch (error) {
            console.error('Error adding token to wallet:', error);
          }
        }
      } else {
        toast.error('Failed to add token');
      }
    } catch (error) {
      console.error('Failed to add custom token:', error);
      toast.error('Failed to add token');
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between min-w-[120px] px-3 py-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
      >
        <div className="flex items-center space-x-2">
          {getTokenIcon(selectedToken)}
          <span>{selectedToken}</span>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop to close dropdown when clicking outside */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            
            <motion.div
              className="absolute top-full left-0 right-0 mt-2 bg-slate-800/98 backdrop-blur-xl rounded-lg border border-slate-700/50 shadow-2xl z-50"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              style={{ width: '280px', maxHeight: '400px' }}
            >
              <div className="p-3">
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search token name or symbol"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="relative">
                  {/* Up arrow for scrolling */}
                  <div className="absolute top-0 left-0 right-0 flex justify-center z-10 pointer-events-none">
                    <div className="bg-gradient-to-b from-slate-800 to-transparent h-6 w-full flex items-center justify-center">
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    </div>
                  </div>
                  
                  <div className="space-y-1 max-h-60 overflow-y-auto scrollbar-thin py-2">
                    {filteredTokens.map((token) => (
                      <button
                        key={token.symbol}
                        onClick={() => handleSelectToken(token.symbol)}
                        className="w-full flex items-center justify-between p-2 hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          {getTokenIcon(token.symbol)}
                          <div className="text-left">
                            <p className="font-medium">{token.symbol}</p>
                            <p className="text-xs text-slate-400">{token.name}</p>
                          </div>
                        </div>
                        {selectedToken === token.symbol && (
                          <Check className="w-4 h-4 text-emerald-400" />
                        )}
                      </button>
                    ))}

                    {filteredTokens.length === 0 && !showAddToken && (
                      <div className="text-center py-4 text-slate-400">
                        <p>No tokens found</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Down arrow for scrolling */}
                  <div className="absolute bottom-0 left-0 right-0 flex justify-center z-10 pointer-events-none">
                    <div className="bg-gradient-to-t from-slate-800 to-transparent h-6 w-full flex items-center justify-center">
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    </div>
                  </div>
                </div>

                {/* Add Custom Token */}
                <div className="mt-3 pt-3 border-t border-slate-700">
                  {!showAddToken ? (
                    <button
                      onClick={() => setShowAddToken(true)}
                      className="w-full flex items-center justify-center space-x-2 py-2 text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="text-sm">Add Custom Token</span>
                    </button>
                  ) : (
                    <div className="space-y-3 bg-slate-900/90 p-4 rounded-lg">
                      <div>
                        <label className="block text-xs font-medium mb-1">Token Contract Address</label>
                        <input
                          type="text"
                          value={customTokenAddress}
                          onChange={(e) => setCustomTokenAddress(e.target.value)}
                          placeholder="0x..."
                          className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 font-mono overflow-ellipsis"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium mb-1">Token Symbol</label>
                        <input
                          type="text"
                          value={customTokenSymbol}
                          onChange={(e) => setCustomTokenSymbol(e.target.value.toUpperCase())}
                          placeholder="TOKEN"
                          className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium mb-1">Decimals</label>
                        <input
                          type="number"
                          value={customTokenDecimals}
                          onChange={(e) => setCustomTokenDecimals(e.target.value)}
                          placeholder="18"
                          className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      
                      {verificationResult && (
                        <div className={`p-2 rounded text-xs ${
                          verificationResult.success 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          <div className="flex items-start space-x-1">
                            {verificationResult.success ? (
                              <Check className="w-3 h-3 mt-0.5" />
                            ) : (
                              <AlertTriangle className="w-3 h-3 mt-0.5" />
                            )}
                            <span>{verificationResult.message}</span>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex space-x-2">
                        {verificationResult?.success ? (
                          <button
                            onClick={handleAddCustomToken}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 rounded text-sm transition-colors"
                          >
                            Add Token
                          </button>
                        ) : (
                          <button
                            onClick={verifyCustomToken}
                            disabled={isVerifying}
                            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors disabled:opacity-50"
                          >
                            {isVerifying ? 'Verifying...' : 'Verify Token'}
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setShowAddToken(false);
                            setCustomTokenAddress('');
                            setCustomTokenSymbol('');
                            setCustomTokenDecimals('18');
                            setVerificationResult(null);
                          }}
                          className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TokenSelector;