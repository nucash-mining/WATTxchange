import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiGet, chain } from '../hooks/useApi';
import { Loading, ErrorMessage, PageTitle } from '../components/Layout';
import { formatNumber, formatTime, truncateHash } from '../utils/format';

export default function Blocks() {
  const [blocks, setBlocks] = useState([]);
  const [blockHeight, setBlockHeight] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const perPage = 25;

  useEffect(() => {
    const fetchBlocks = async () => {
      try {
        setLoading(true);
        // Get current block height
        const height = await apiGet('/getblockcount');
        setBlockHeight(height);

        // Calculate block range for current page
        const startBlock = height - ((page - 1) * perPage);
        const endBlock = Math.max(startBlock - perPage + 1, 1);

        // Fetch block data for each block
        const blockPromises = [];
        for (let i = startBlock; i >= endBlock; i--) {
          blockPromises.push(apiGet(`/getblockhash?index=${i}`).then(hash =>
            apiGet(`/getblock?hash=${hash}`)
          ).catch(() => ({ height: i, hash: 'unknown', tx: [], time: 0 })));
        }

        const blockData = await Promise.all(blockPromises);
        setBlocks(blockData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBlocks();
  }, [page]);

  if (loading && blocks.length === 0) return <Loading />;
  if (error) return <ErrorMessage message={error} />;

  const totalPages = Math.ceil(blockHeight / perPage);

  return (
    <div>
      <PageTitle badge={`${formatNumber(blockHeight)} blocks`}>
        Blocks
      </PageTitle>

      <div className="card p-0">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Block</th>
                <th>Hash</th>
                <th>Transactions</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {blocks.map((block) => (
                <tr key={block.height}>
                  <td>
                    <Link
                      to={`/block/${block.height}`}
                      className="font-semibold"
                      style={{ color: chain.theme.primary }}
                    >
                      {formatNumber(block.height)}
                    </Link>
                  </td>
                  <td>
                    <Link
                      to={`/block/${block.hash}`}
                      className="font-mono hash"
                    >
                      {truncateHash(block.hash, 12)}
                    </Link>
                  </td>
                  <td>{block.tx?.length || 0}</td>
                  <td className="text-gray-400">{formatTime(block.time)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="pagination">
        <button
          onClick={() => setPage(1)}
          disabled={page === 1}
        >
          First
        </button>
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Prev
        </button>
        <button className="active">
          {page} / {totalPages}
        </button>
        <button
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
        >
          Next
        </button>
        <button
          onClick={() => setPage(totalPages)}
          disabled={page === totalPages}
        >
          Last
        </button>
      </div>
    </div>
  );
}
