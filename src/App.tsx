import React, { useState } from 'react';
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

type ViewType = 'wallet' | 'nodes' | 'dex' | 'mining' | 'marketplace' | 'swap' | 'settings' | 'nuchain';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('wallet');

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
      <Header />
      <div className="flex">
        <Sidebar currentView={currentView} onViewChange={setCurrentView} />
        <main className="flex-1 p-6">
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