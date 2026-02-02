import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiGet, chain } from '../hooks/useApi';
import { Loading, ErrorMessage, PageTitle } from '../components/Layout';
import { formatNumber, formatTime, truncateHash, formatCoins } from '../utils/format';

export default function Transaction() {
  const { hash } = useParams();
  const [tx, setTx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTx = async () => {
      try {
        setLoading(true);
        const txData = await apiGet(`/gettx?txid=${hash}`);
        setTx(txData);
      } catch (err) {
        setError(err.message || 'Transaction not found');
      } finally {
        setLoading(false);
      }
    };

    fetchTx();
  }, [hash]);

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} />;
  if (!tx) return <ErrorMessage message="Transaction not found" />;

  const totalIn = tx.vin?.reduce((sum, v) => sum + (v.value || 0), 0) || 0;
  const totalOut = tx.vout?.reduce((sum, v) => sum + (v.value || 0), 0) || 0;

  return (
    <div>
      <PageTitle>Transaction Details</PageTitle>

      {/* Transaction Overview */}
      <div className="card mb-6">
        <h2 className="font-semibold mb-4">Overview</h2>
        <div className="space-y-4">
          <div>
            <p className="text-gray-500 text-sm">Transaction Hash</p>
            <p className="font-mono text-sm break-all">{tx.txid}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-gray-500 text-sm">Block</p>
              <Link
                to={`/block/${tx.blockhash}`}
                className="font-semibold"
                style={{ color: chain.theme.primary }}
              >
                {formatNumber(tx.blockheight || 'Pending')}
              </Link>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Confirmations</p>
              <span className={`badge ${tx.confirmations > 0 ? 'badge-success' : 'badge-warning'}`}>
                {formatNumber(tx.confirmations || 0)}
              </span>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Timestamp</p>
              <p>{formatTime(tx.time || tx.blocktime)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-dark-400">
            <div>
              <p className="text-gray-500 text-sm">Total Input</p>
              <p className="font-semibold text-lg" style={{ color: chain.theme.primary }}>
                {formatCoins(totalIn * 1e8, chain.ticker)}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Output</p>
              <p className="font-semibold text-lg text-green-400">
                {formatCoins(totalOut * 1e8, chain.ticker)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Inputs & Outputs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="card p-0">
          <div className="card-header">
            <h2 className="font-semibold">
              Inputs ({tx.vin?.length || 0})
            </h2>
          </div>
          <div className="divide-y divide-dark-400">
            {tx.vin?.map((input, i) => (
              <div key={i} className="p-4">
                {input.coinbase ? (
                  <div className="flex items-center justify-between">
                    <span className="badge badge-info">Coinbase (New Coins)</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      {input.addresses?.map((addr, j) => (
                        <Link
                          key={j}
                          to={`/address/${addr}`}
                          className="font-mono text-sm address block"
                        >
                          {truncateHash(addr, 12)}
                        </Link>
                      ))}
                      {input.txid && (
                        <Link
                          to={`/tx/${input.txid}`}
                          className="text-xs text-gray-500 font-mono"
                        >
                          {truncateHash(input.txid, 8)}:{input.vout}
                        </Link>
                      )}
                    </div>
                    <span className="text-sm font-medium">
                      {formatCoins((input.value || 0) * 1e8, chain.ticker)}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Outputs */}
        <div className="card p-0">
          <div className="card-header">
            <h2 className="font-semibold">
              Outputs ({tx.vout?.length || 0})
            </h2>
          </div>
          <div className="divide-y divide-dark-400">
            {tx.vout?.map((output, i) => (
              <div key={i} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    {output.scriptPubKey?.addresses?.map((addr, j) => (
                      <Link
                        key={j}
                        to={`/address/${addr}`}
                        className="font-mono text-sm address block"
                      >
                        {truncateHash(addr, 12)}
                      </Link>
                    )) || (
                      <span className="text-gray-500 text-sm">
                        {output.scriptPubKey?.type || 'Unknown'}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-green-400">
                    {formatCoins((output.value || 0) * 1e8, chain.ticker)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Raw Transaction */}
      <div className="card mt-6">
        <h2 className="font-semibold mb-4">Raw Transaction Data</h2>
        <div className="bg-dark-300 rounded-lg p-4 overflow-x-auto">
          <pre className="text-xs text-gray-400 font-mono">
            {JSON.stringify(tx, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
