import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiGet, chain } from '../hooks/useApi';
import { Loading, ErrorMessage, PageTitle } from '../components/Layout';
import { formatNumber, formatTime, truncateHash, formatBytes } from '../utils/format';

export default function Block() {
  const { id } = useParams();
  const [block, setBlock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBlock = async () => {
      try {
        setLoading(true);
        let hash = id;

        // If id is a number, get the hash first
        if (/^\d+$/.test(id)) {
          hash = await apiGet(`/getblockhash?index=${id}`);
        }

        const blockData = await apiGet(`/getblock?hash=${hash}`);
        setBlock(blockData);
      } catch (err) {
        setError(err.message || 'Block not found');
      } finally {
        setLoading(false);
      }
    };

    fetchBlock();
  }, [id]);

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} />;
  if (!block) return <ErrorMessage message="Block not found" />;

  return (
    <div>
      <PageTitle>Block #{formatNumber(block.height)}</PageTitle>

      {/* Block Details */}
      <div className="card mb-6">
        <h2 className="font-semibold mb-4">Block Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-500 text-sm">Block Hash</p>
            <p className="font-mono text-sm break-all">{block.hash}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">Previous Block</p>
            <Link
              to={`/block/${block.previousblockhash}`}
              className="font-mono text-sm hash break-all"
            >
              {block.previousblockhash}
            </Link>
          </div>
          {block.nextblockhash && (
            <div>
              <p className="text-gray-500 text-sm">Next Block</p>
              <Link
                to={`/block/${block.nextblockhash}`}
                className="font-mono text-sm hash break-all"
              >
                {block.nextblockhash}
              </Link>
            </div>
          )}
          <div>
            <p className="text-gray-500 text-sm">Timestamp</p>
            <p>{formatTime(block.time)}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">Transactions</p>
            <p>{block.tx?.length || 0}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">Size</p>
            <p>{formatBytes(block.size)}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">Difficulty</p>
            <p>{block.difficulty?.toFixed(8)}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">Bits</p>
            <p className="font-mono">{block.bits}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">Nonce</p>
            <p className="font-mono">{block.nonce}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">Merkle Root</p>
            <p className="font-mono text-sm break-all">{block.merkleroot}</p>
          </div>
        </div>
      </div>

      {/* Block Transactions */}
      <div className="card p-0">
        <div className="card-header">
          <h2 className="font-semibold">
            Transactions ({block.tx?.length || 0})
          </h2>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Transaction Hash</th>
              </tr>
            </thead>
            <tbody>
              {block.tx?.map((txid, index) => (
                <tr key={txid}>
                  <td>{index + 1}</td>
                  <td>
                    <Link to={`/tx/${txid}`} className="font-mono hash">
                      {truncateHash(txid, 20)}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        {block.previousblockhash && (
          <Link
            to={`/block/${block.height - 1}`}
            className="btn"
            style={{
              backgroundColor: chain.theme.glow,
              color: chain.theme.primary
            }}
          >
            Previous Block
          </Link>
        )}
        {block.nextblockhash && (
          <Link
            to={`/block/${block.height + 1}`}
            className="btn-primary btn ml-auto"
          >
            Next Block
          </Link>
        )}
      </div>
    </div>
  );
}
