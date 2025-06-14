import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import WalletView from './components/WalletView';
import NodesView from './components/NodesView';
import DEXView from './components/DEXView';
import MiningGameView from './components/MiningGameView';
import TechMarketplaceView from './components/TechMarketplaceView';
import AtomicSwapView from './components/AtomicSwapView';
import SettingsView from './components/SettingsView';
import NuChainView from './components/NuChainView';
import MobileNavbar from './components/mobile/MobileNavbar';

type ViewType = 'wallet' | 'nodes' | 'dex' | 'mining' | 'marketplace' | 'swap' | 'settings' | 'nuchain';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('wallet');
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Detect mobile devices and wallet browsers
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isSmallScreen = window.innerWidth < 768;
      const isMobileWallet = window.ethereum?.isMetaMask && (window.innerWidth < 768 || isMobileDevice);
      
      setIsMobile(isMobileDevice || isSmallScreen || !!isMobileWallet);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const renderView = () => {
    switch (currentView) {
      case 'wallet':
        return <WalletView />;
      case 'nodes':
        return <NodesView />;
      case 'dex':
        return <DEXView />;
      case 'mining':
        return <MiningGameView />;
      case 'nuchain':
        return <NuChainView />;
      case 'marketplace':
        return <TechMarketplaceView />;
      case 'swap':
        return <AtomicSwapView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <WalletView />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header isMobile={isMobile} onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="flex">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <Sidebar currentView={currentView} onViewChange={setCurrentView} />
        )}
        
        {/* Mobile Sidebar with overlay */}
        {isMobile && (
          <AnimatePresence>
            {isSidebarOpen && (
              <>
                <motion.div 
                  className="fixed inset-0 bg-black/70 z-40"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsSidebarOpen(false)}
                />
                <motion.div
                  className="fixed left-0 top-0 bottom-0 w-64 z-50"
                  initial={{ x: -320 }}
                  animate={{ x: 0 }}
                  exit={{ x: -320 }}
                  transition={{ type: 'spring', damping: 25 }}
                >
                  <Sidebar 
                    currentView={currentView} 
                    onViewChange={(view) => {
                      setCurrentView(view);
                      setIsSidebarOpen(false);
                    }} 
                  />
                </motion.div>
              </>
            )}
          </AnimatePresence>
        )}
        
        <main className={`flex-1 p-6 ${isMobile ? 'pb-20' : ''}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      
      {/* Mobile Navigation Bar */}
      {isMobile && (
        <MobileNavbar currentView={currentView} onViewChange={setCurrentView} />
      )}
      
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(0, 0, 0, 0.9)',
            color: '#f1f5f9',
            border: '1px solid rgba(234, 179, 8, 0.2)',
            backdropFilter: 'blur(10px)',
          },
        }}
      />
    </div>
  );
}

export default App;