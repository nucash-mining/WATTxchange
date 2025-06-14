import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, Plus, Check } from 'lucide-react';
import { swapinService } from '../../services/swapinService';
import { tokenService } from '../../services/tokenService';

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

  // Get tokens for the selected chain
  const network = swapinService.getNetwork(chainId);
  const availableTokens = tokenService.getTokensForChain(network?.name || 'ALT');
  
  // Get Altcoinchain token addresses
  const altTokens = swapinService.getAltcoinchainTokens();

  // Filter tokens based on search and excluded token
  const filteredTokens = availableTokens
    .filter(token => 
      token.symbol !== excludeToken && 
      (token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) || 
       token.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

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

  const handleAddCustomToken = () => {
    // In a real implementation, this would validate the token address
    // and add it to the list of available tokens
    setShowAddToken(false);
    setCustomTokenAddress('');
  };

  const selectedTokenInfo = availableTokens.find(token => token.symbol === selectedToken);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
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
              className="absolute top-full left-0 right-0 mt-2 bg-slate-800/98 backdrop-blur-xl rounded-lg border border-slate-700/50 shadow-2xl z-50 max-h-80 overflow-y-auto"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className="p-3">
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search token name or symbol"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg focus:outline-none focus:border-blue-500/50"
                  />
                </div>

                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {filteredTokens.map((token) => (
                    <button
                      key={token.symbol}
                      onClick={() => handleSelectToken(token.symbol)}
                      className="w-full flex items-center justify-between p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
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

                {/* Add Custom Token */}
                <div className="mt-3 pt-3 border-t border-slate-700/50">
                  {!showAddToken ? (
                    <button
                      onClick={() => setShowAddToken(true)}
                      className="w-full flex items-center justify-center space-x-2 py-2 text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="text-sm">Add Custom Token</span>
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={customTokenAddress}
                        onChange={(e) => setCustomTokenAddress(e.target.value)}
                        placeholder="Token contract address..."
                        className="w-full bg-slate-900/50 border border-slate-700/50 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={handleAddCustomToken}
                          className="flex-1 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => {
                            setShowAddToken(false);
                            setCustomTokenAddress('');
                          }}
                          className="flex-1 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors"
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