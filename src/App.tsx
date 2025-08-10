import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import { App as CapacitorApp } from '@capacitor/app';
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
  const [isNativeApp, setIsNativeApp] = useState(false);
  const { isMobile, isMobileWallet } = useDeviceDetect();

  // Detect mobile devices and wallet browsers
  useEffect(() => {
    // Check if running as native app
    const checkNativeApp = async () => {
      try {
        const info = await CapacitorApp.getInfo();
        setIsNativeApp(info.platform !== 'web');
        
        if (info.platform !== 'web') {
          // Configure native app settings
          await StatusBar.setStyle({ style: Style.Dark });
          await StatusBar.setBackgroundColor({ color: '#000000' });
          await Keyboard.setAccessoryBarVisible({ isVisible: false });
          await Keyboard.setScroll({ isDisabled: false });
        }
      } catch (error) {
        // Not running in Capacitor
        setIsNativeApp(false);
      }
    };
    
    checkNativeApp();
    
    // If we're in a mobile wallet browser, adjust the UI accordingly
    if (isMobileWallet) {
      // Mobile wallet specific adjustments could go here
      console.log('Mobile wallet browser detected');
    }
    
    // Prevent zoom on double tap for mobile
    if (isMobile) {
      let lastTouchEnd = 0;
      document.addEventListener('touchend', function (event) {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
          event.preventDefault();
        }
        lastTouchEnd = now;
      }, false);
    }
  }, [isMobileWallet]);

  // Handle hardware back button on Android
  useEffect(() => {
    if (isNativeApp) {
      const handleBackButton = () => {
        if (isSidebarOpen) {
          setIsSidebarOpen(false);
          return;
        }
        
        if (currentView !== 'wallet') {
          setCurrentView('wallet');
          return;
        }
        
        // Exit app
        CapacitorApp.exitApp();
      };
      
      CapacitorApp.addListener('backButton', handleBackButton);
      
      return () => {
        CapacitorApp.removeAllListeners();
      };
    }
  }, [isNativeApp, isSidebarOpen, currentView]);

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
    <div className={`min-h-screen bg-black text-white ${isNativeApp ? 'safe-area-top safe-area-bottom' : ''} ${isMobile ? 'touch-manipulation' : ''}`}>
      <Header 
        isMobile={isMobile} 
        onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
        isNativeApp={isNativeApp}
      />
      <div className="flex">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <Sidebar currentView={currentView} onViewChange={setCurrentView} />
        )}
        
        {/* Mobile Sidebar with overlay */}
        {isMobile && (
          <motion.div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 flex"
            initial={{ opacity: 0 }}
            animate={{ opacity: isSidebarOpen ? 1 : 0 }}
            style={{ pointerEvents: isSidebarOpen ? 'auto' : 'none' }}
          >
            <motion.div
              className="w-80 bg-black/95 h-full safe-area-left"
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
        
        <main className={`flex-1 ${isMobile ? 'p-4 pb-20 safe-area-left safe-area-right' : 'p-6'}`}>
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
        <MobileNavbar 
          currentView={currentView} 
          onViewChange={setCurrentView}
          isNativeApp={isNativeApp}
        />
      )}
      
      <Toaster 
        position={isMobile ? "top-center" : "top-right"}
        toastOptions={{
          style: {
            background: 'rgba(0, 0, 0, 0.9)',
            color: '#f1f5f9',
            border: '1px solid rgba(234, 179, 8, 0.2)',
            backdropFilter: 'blur(10px)',
            fontSize: isMobile ? '14px' : '16px',
            padding: isMobile ? '12px 16px' : '16px',
          },
          duration: isMobile ? 3000 : 4000,
        }}
      />
    </div>
  );
}

export default App;