import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header, StatsBanner, Footer } from './components/Layout';

// Pages
import Home from './pages/Home';
import Blocks from './pages/Blocks';
import Block from './pages/Block';
import Transactions from './pages/Transactions';
import Transaction from './pages/Transaction';
import Address from './pages/Address';
import RichList from './pages/RichList';
import Masternodes from './pages/Masternodes';
import Staking from './pages/Staking';
import Tokens from './pages/Tokens';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Header />
        <StatsBanner />

        <main className="container mx-auto px-4 py-6 flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/blocks" element={<Blocks />} />
            <Route path="/block/:id" element={<Block />} />
            <Route path="/txs" element={<Transactions />} />
            <Route path="/tx/:hash" element={<Transaction />} />
            <Route path="/address/:address" element={<Address />} />
            <Route path="/richlist" element={<RichList />} />
            <Route path="/masternodes" element={<Masternodes />} />
            <Route path="/staking" element={<Staking />} />
            <Route path="/tokens" element={<Tokens />} />

            {/* Catch-all redirect to home */}
            <Route path="*" element={<Home />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
