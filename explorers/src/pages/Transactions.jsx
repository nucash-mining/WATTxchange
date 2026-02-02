import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiGet, chain } from '../hooks/useApi';
import { Loading, ErrorMessage, PageTitle } from '../components/Layout';
import {
  formatNumber,
  formatTime,
  truncateHash,
  formatCoins
} from '../utils/format';

export default function Transactions() {
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const perPage = 50;

  useEffect(() => {
    const fetchTxs = async () => {
      try {
        setLoading(true);
        // Get latest transactions
        const data = await apiGet(`/getlasttxs/${perPage * page}/all`);
        setTxs(data?.data || []);
      } catch (err) {
        setError(err.message || 'Failed to load transactions');
      } finally {
        setLoading(false);
      }
    };

    fetchTxs();
  }, [page]);

  if (loading && txs.length === 0) return <Loading />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div>
      <PageTitle badge={`Page ${page}`}>Latest Transactions</PageTitle>

      <div className="card p-0">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Tx Hash</th>
                <th>Block</th>
                <th>Time</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {txs.slice((page - 1) * perPage, page * perPage).map((tx) => (
                <tr key={tx.txid}>
                  <td>
                    <Link to={`/tx/${tx.txid}`} className="font-mono hash">
                      {truncateHash(tx.txid, 16)}
                    </Link>
                  </td>
                  <td>
                    <Link
                      to={`/block/${tx.blockindex}`}
                      style={{ color: chain.theme.primary }}
                    >
                      {formatNumber(tx.blockindex)}
                    </Link>
                  </td>
                  <td className="text-gray-400">{formatTime(tx.timestamp)}</td>
                  <td className="font-medium">
                    {formatCoins(tx.total * 1e8, chain.ticker)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="pagination">
        <button onClick={() => setPage(1)} disabled={page === 1}>
          First
        </button>
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
          Prev
        </button>
        <button className="active">Page {page}</button>
        <button onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>
    </div>
  );
}
