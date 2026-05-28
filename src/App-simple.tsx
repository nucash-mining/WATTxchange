import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import WalletView from './components/WalletView';
// import NodesView from './components/NodesView';
// import DEXView from './components/DEXView';
// import NuChainView from './components/NuChainView';
import { useDeviceDetect } from './hooks/useDeviceDetect';

type ViewType = 'wallet' | 'nodes' | 'dex' | 'mining' | 'marketplace' | 'swap' | 'settings' | 'nuchain';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('wallet');
  const [isNativeApp, setIsNativeApp] = useState(false);
  const { isMobile } = useDeviceDetect();

  console.log('🏗️ App component rendering...', { currentView, isMobile, isNativeApp });

  // Debug: Check if components are loading
  try {
    console.log('🔍 Testing component imports...');
    console.log('✅ WalletView imported successfully');
    // console.log('✅ NodesView imported successfully');
  } catch (error) {
    console.error('❌ Component import error:', error);
  }

  // Simplified native app detection
  useEffect(() => {
    const checkNativeApp = async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        const platform = Capacitor.getPlatform();
        setIsNativeApp(platform !== 'web');
        console.log('📱 Native app check:', platform);
      } catch {
        console.log('🌐 Running in web mode');
        setIsNativeApp(false);
      }
    };
    
    checkNativeApp();
  }, []);

  const renderView = () => {
    console.log('🎯 Rendering view:', currentView);
    try {
      switch (currentView) {
        case 'wallet':
          return <WalletView />;
        case 'nodes':
        case 'dex':
        case 'nuchain':
        case 'mining':
        case 'marketplace':
        case 'swap':
        case 'settings':
        default:
          return (
            <div style={{ padding: '20px', color: 'white' }}>
              <h2>View: {currentView}</h2>
              <p>This view is temporarily simplified for debugging.</p>
              <p>Basic app is working - components will be added back gradually.</p>
            </div>
          );
      }
    } catch (error) {
      console.error('❌ Error rendering view:', currentView, error);
      return (
        <div style={{ padding: '20px', color: 'white' }}>
          <h2>Error loading view: {currentView}</h2>
          <p style={{ color: 'red' }}>Error: {error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      );
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#000000', 
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Header isMobile={isMobile} />
      
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <div style={{ 
          width: '256px', 
          backgroundColor: 'rgba(17, 24, 39, 0.95)',
          borderRight: '1px solid #374151'
        }}>
          <Sidebar 
            currentView={currentView} 
            onViewChange={(view: ViewType) => {
              console.log('🔄 View change requested:', view);
              setCurrentView(view);
            }} 
          />
        </div>

        {/* Main Content */}
        <div style={{ flex: 1 }}>
          <main style={{ padding: '24px' }}>
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
