import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import WalletView from './components/WalletView';
import NodesView from './components/NodesView';
import DEXViewSimple from './components/DEXViewSimple';
import NuChainView from './components/NuChainView';

type ViewType = 'wallet' | 'nodes' | 'dex' | 'mining' | 'marketplace' | 'swap' | 'settings' | 'nuchain';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('wallet');

  console.log('🧪 Test App component rendering...', { currentView });

  const renderView = () => {
    console.log('🎯 Rendering view:', currentView);
    try {
      switch (currentView) {
        case 'wallet':
          return <WalletView />;
        case 'nodes':
          return <NodesView />;
        case 'dex':
          return <DEXViewSimple />;
        case 'nuchain':
          return <NuChainView />;
        case 'mining':
        case 'marketplace':
        case 'swap':
        case 'settings':
        default:
          return (
            <div style={{ padding: '20px', color: 'white' }}>
              <h2>View: {currentView}</h2>
              <p>This view is temporarily simplified for debugging.</p>
              <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#1f2937', borderRadius: '8px' }}>
                <h3>Test Navigation</h3>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
                  {(['wallet', 'nodes', 'dex', 'nuchain'] as ViewType[]).map((view) => (
                    <button
                      key={view}
                      onClick={() => setCurrentView(view)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: currentView === view ? '#3b82f6' : '#374151',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      {view.charAt(0).toUpperCase() + view.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
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
      color: '#ffffff'
    }}>
      {/* Test Header */}
      <Header isMobile={false} />
      
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
          <main style={{ padding: '20px' }}>
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