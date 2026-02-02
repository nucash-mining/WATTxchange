import { Link } from 'react-router-dom';
import { useBlocks, useBlockCount, chain } from '../hooks/useApi';
import { Loading, ErrorMessage } from '../components/Layout';
import {
  formatNumber,
  formatTimeAgo,
  truncateHash,
  formatCoins
} from '../utils/format';

export default function Home() {
  const { data: txData, loading, error } = useBlocks(0, 10);
  const { data: blockCount } = useBlockCount();

  if (loading && !txData) return <Loading />;
  if (error) return <ErrorMessage message={error} />;

  const transactions = txData || [];

  return (
    <div className="space-y-6">
      {/* Latest Blocks & Transactions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Blocks */}
        <div className="card p-0">
          <div className="card-header">
            <h2 className="font-semibold">Latest Blocks</h2>
            <Link
              to="/blocks"
              className="text-sm font-medium"
              style={{ color: chain.theme.primary }}
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-dark-400">
            <LatestBlocks blockCount={blockCount} transactions={transactions} />
          </div>
        </div>

        {/* Latest Transactions */}
        <div className="card p-0">
          <div className="card-header">
            <h2 className="font-semibold">Latest Transactions</h2>
            <Link
              to="/txs"
              className="text-sm font-medium"
              style={{ color: chain.theme.primary }}
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-dark-400">
            {transactions.slice(0, 8).map((tx) => (
              <div key={tx.txid} className="p-4 hover:bg-dark-300 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold"
                      style={{
                        backgroundColor: chain.theme.glow,
                        color: chain.theme.primary
                      }}
                    >
                      TX
                    </div>
                    <div>
                      <Link
                        to={`/tx/${tx.txid}`}
                        className="font-mono text-sm hash"
                      >
                        {truncateHash(tx.txid, 10)}
                      </Link>
                      <p className="text-xs text-gray-500">
                        {formatTimeAgo(tx.timestamp)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {formatCoins(tx.amount, chain.ticker)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Block #{tx.blockindex}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chain Info */}
      <div className="card">
        <h2 className="font-semibold mb-4">Network Information</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-gray-500 text-sm">Coin Name</p>
            <p className="font-semibold">{chain.name}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">Symbol</p>
            <p className="font-semibold">{chain.ticker}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">Consensus</p>
            <p className="font-semibold">{chain.consensus}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">Algorithm</p>
            <p className="font-semibold">{chain.algorithm}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LatestBlocks({ blockCount, transactions }) {
  if (!blockCount) return <Loading />;

  // Get unique blocks from transactions
  const seenBlocks = new Set();
  const blocks = [];

  for (const tx of transactions) {
    if (!seenBlocks.has(tx.blockindex)) {
      seenBlocks.add(tx.blockindex);
      blocks.push({
        height: tx.blockindex,
        hash: tx.blockhash,
        time: tx.timestamp,
      });
    }
    if (blocks.length >= 8) break;
  }

  // If we don't have enough blocks from transactions, fill with placeholder
  if (blocks.length < 8) {
    const startHeight = blocks.length > 0 ? blocks[blocks.length - 1].height - 1 : blockCount;
    for (let i = blocks.length; i < 8; i++) {
      blocks.push({
        height: startHeight - (i - blocks.length),
        time: Date.now() / 1000 - i * 60,
      });
    }
  }

  return (
    <>
      {blocks.map((block) => (
        <div
          key={block.height}
          className="p-4 hover:bg-dark-300 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold"
                style={{
                  backgroundColor: chain.theme.glow,
                  color: chain.theme.primary
                }}
              >
                BK
              </div>
              <div>
                <Link
                  to={`/block/${block.height}`}
                  className="font-semibold"
                  style={{ color: chain.theme.primary }}
                >
                  {formatNumber(block.height)}
                </Link>
                <p className="text-xs text-gray-500">
                  {formatTimeAgo(block.time)}
                </p>
              </div>
            </div>
            {block.hash && (
              <div className="text-right">
                <span className="font-mono text-xs text-gray-500">
                  {truncateHash(block.hash, 8)}
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
    </>
  );
}
