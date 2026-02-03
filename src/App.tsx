import { useState, useEffect } from 'react';
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
import ExplorerView from './components/ExplorerView';
import MobileNavbar from './components/mobile/MobileNavbar';
import { useDeviceDetect } from './hooks/useDeviceDetect';

type ViewType = 'wallet' | 'nodes' | 'dex' | 'mining' | 'marketplace' | 'swap' | 'settings' | 'nuchain' | 'explorer';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('wallet');
  const [, setIsSidebarOpen] = useState(true); // Show sidebar by default
  const [isNativeApp, setIsNativeApp] = useState(false);
  const { isMobile, isMobileWallet } = useDeviceDetect();

  // Detect mobile devices and wallet browsers
  useEffect(() => {
    // Check if running as native app
    const checkNativeApp = async () => {
      try {
        // CapacitorApp.getInfo() returns AppInfo which does not have a 'platform' property.
        // Instead, use Capacitor.getPlatform() for platform detection.
        const { Capacitor } = await import('@capacitor/core');
        const platform = Capacitor.getPlatform();
        setIsNativeApp(platform !== 'web');
        if (platform !== 'web') {
          // Configure native app settings
          const { StatusBar, Style } = await import('@capacitor/status-bar');
          const { Keyboard } = await import('@capacitor/keyboard');
          await StatusBar.setStyle({ style: Style.Dark });
          await StatusBar.setBackgroundColor({ color: '#000000' });
          await Keyboard.setAccessoryBarVisible({ isVisible: false });
          await Keyboard.setScroll({ isDisabled: false });
        }
      } catch {
        // Not running in Capacitor
        setIsNativeApp(false);
      }
    };
    
    checkNativeApp();
    
    // If we're in a mobile wallet browser, adjust the UI accordingly
    if (isMobileWallet) {
      // Additional mobile wallet specific setup can go here
    }
  }, [isMobileWallet]);

  // Handle back button on mobile
  useEffect(() => {
    if (isMobile) {
      const setupBackButton = async () => {
        try {
          const { App } = await import('@capacitor/app');
          App.addListener('backButton', ({ canGoBack }) => {
            if (canGoBack) {
              window.history.back();
            } else {
              // If we can't go back, close the app
              App.exitApp();
            }
          });
        } catch {
          // Not running in Capacitor
        }
      };
      setupBackButton();
    }
  }, [isMobile]);

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
      case 'explorer':
        return <ExplorerView />;
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
      />
      <div className="flex">
        {/* Sidebar - Always visible */}
        <div className="w-64 bg-gray-900/95 backdrop-blur-xl border-r border-gray-800">
          <Sidebar 
            currentView={currentView} 
            onViewChange={(view: ViewType) => {
              setCurrentView(view);
            }} 
          />
        </div>


        {/* Main Content */}
        <div className="flex-1">
          {isMobile ? (
            <MobileNavbar 
              currentView={currentView}
              onViewChange={setCurrentView}
            />
          ) : null}
          <main className="p-6">
            {renderView()}
          </main>
        </div>
      </div>
      
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#1f2937',
            color: '#f9fafb',
            border: '1px solid #374151',
          },
        }}
      />
    </div>
  );
}

export default App;