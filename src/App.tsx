import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
import { useDeviceDetect } from './hooks/useDeviceDetect';

type ViewType = 'wallet' | 'nodes' | 'dex' | 'mining' | 'marketplace' | 'swap' | 'settings' | 'nuchain';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('wallet');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isMobile, isMobileWallet } = useDeviceDetect();

  // Detect mobile devices and wallet browsers
  useEffect(() => {
    // If we're in a mobile wallet browser, adjust the UI accordingly
    if (isMobileWallet) {
      // Mobile wallet specific adjustments could go here
      console.log('Mobile wallet browser detected');
    }
  }, [isMobileWallet]);

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
          <motion.div 
            className="fixed inset-0 bg-black/70 z-40 flex"
            initial={{ opacity: 0 }}
            animate={{ opacity: isSidebarOpen ? 1 : 0 }}
            style={{ pointerEvents: isSidebarOpen ? 'auto' : 'none' }}
          >
            <motion.div
              className="w-64 bg-black/95 h-full"
              initial={{ x: -320 }}
              animate={{ x: isSidebarOpen ? 0 : -320 }}
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
            <div 
              className="flex-1" 
              onClick={() => setIsSidebarOpen(false)}
            />
          </motion.div>
        )}
        
        <main className={`flex-1 p-6 ${isMobile ? 'pb-20' : ''}`}>
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