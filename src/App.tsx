import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import WalletView from './components/WalletView';
import NodesView from './components/NodesView';
import DEXView from './components/DEXView';
import OrderbookView from './components/OrderbookView';
import MiningGameView from './components/MiningGameView';
import MergedMiningView from './components/MergedMiningView';
import TechMarketplaceView from './components/TechMarketplaceView';
import AtomicSwapView from './components/AtomicSwapView';
import SettingsView from './components/SettingsView';
import NuChainView from './components/NuChainView';
import ExplorerView from './components/ExplorerView';
import DeFiHubView from './components/DeFiHubView';
import BridgeView from './components/BridgeView';
import ValidatorsView from './components/ValidatorsView';
import MobileNavbar from './components/mobile/MobileNavbar';
import { useDeviceDetect } from './hooks/useDeviceDetect';

type ViewType = 'wallet' | 'nodes' | 'dex' | 'defi' | 'bridge' | 'mining' | 'marketplace' | 'swap' | 'settings' | 'nuchain' | 'explorer' | 'pool' | 'validators' | 'orderbook';

const VIEW_ALIASES: Record<string, ViewType> = {
  wallet: 'wallet', nodes: 'nodes', dex: 'dex', defi: 'defi', bridge: 'bridge',
  mining: 'mining', marketplace: 'marketplace', swap: 'swap', settings: 'settings',
  nuchain: 'nuchain', explorer: 'explorer', pool: 'pool', validators: 'validators', orderbook: 'orderbook', book: 'orderbook',
  // short forms used by the dedicated subdomains (dex./mm./exp.wattxchange.app
  // redirect here with these fragments)
  mm: 'pool', 'merged-mining': 'pool', pools: 'pool', exp: 'explorer',
};

function viewFromHash(): ViewType | null {
  // Only the first segment names the view; anything after it belongs to the
  // view (e.g. "#mm/xmr" selects the XMR card inside merged mining).
  const key = window.location.hash.replace(/^#\/?/, '').split('/')[0].toLowerCase();
  return VIEW_ALIASES[key] ?? null;
}

function App() {
  const [currentView, setCurrentView] = useState<ViewType>(() => viewFromHash() ?? 'wallet');
  const [, setIsSidebarOpen] = useState(true); // Show sidebar by default

  // Keep the view in sync with the URL fragment so a shared link (or the
  // dex./mm./exp. subdomain redirects) lands on the right tab, back/forward
  // included.
  useEffect(() => {
    const onHashChange = () => {
      const v = viewFromHash();
      if (v) setCurrentView(v);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
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
      case 'orderbook':
        return <OrderbookView />;
      case 'defi':
        return <DeFiHubView />;
      case 'bridge':
        return <BridgeView />;
      case 'pool':
        return <MergedMiningView />;
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
      case 'validators':
        return <ValidatorsView />;
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
        {/* Sidebar — desktop only */}
        {!isMobile && (
          <div className="w-64 flex-shrink-0 bg-gray-900/95 backdrop-blur-xl border-r border-gray-800 min-h-[calc(100vh-64px)]">
            <Sidebar
              currentView={currentView}
              onViewChange={(view: ViewType) => setCurrentView(view)}
            />
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <main className={`${isMobile ? 'p-3 pb-20' : 'p-6'}`}>
            {renderView()}
          </main>
        </div>
      </div>

      {/* Mobile bottom nav — rendered outside the flex row so it stays fixed */}
      {isMobile && (
        <MobileNavbar
          currentView={currentView}
          onViewChange={setCurrentView}
        />
      )}
      
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