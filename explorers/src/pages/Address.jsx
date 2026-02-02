import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiGet, chain } from '../hooks/useApi';
import { Loading, ErrorMessage, PageTitle } from '../components/Layout';
import {
  formatNumber,
  formatTime,
  truncateHash,
  formatCoins
} from '../utils/format';

export default function Address() {
  const { address } = useParams();
  const [data, setData] = useState(null);
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAddress = async () => {
      try {
        setLoading(true);
        // Get address balance
        const balance = await apiGet(`/getbalance?address=${address}`);

        // Get address transactions
        const txData = await apiGet(`/getaddresstxs?address=${address}&start=0&length=50`);

        setData({
          address,
          balance: balance?.balance || balance || 0,
          received: balance?.received || 0,
          sent: balance?.sent || 0,
          txCount: txData?.length || 0
        });
        setTxs(txData || []);
      } catch (err) {
        setError(err.message || 'Address not found');
      } finally {
        setLoading(false);
      }
    };

    fetchAddress();
  }, [address]);

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} />;
  if (!data) return <ErrorMessage message="Address not found" />;

  return (
    <div>
      <PageTitle>Address Details</PageTitle>

      {/* Address Overview */}
      <div className="card mb-6">
        <div className="space-y-4">
          <div>
            <p className="text-gray-500 text-sm">Address</p>
            <p className="font-mono break-all text-lg">{data.address}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-dark-400">
            <div>
              <p className="text-gray-500 text-sm">Balance</p>
              <p
                className="font-bold text-2xl"
                style={{ color: chain.theme.primary }}
              >
                {formatCoins(data.balance * 1e8, chain.ticker)}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Received</p>
              <p className="font-semibold text-green-400">
                {formatCoins(data.received * 1e8, chain.ticker)}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Sent</p>
              <p className="font-semibold text-red-400">
                {formatCoins(data.sent * 1e8, chain.ticker)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="card p-0">
        <div className="card-header">
          <h2 className="font-semibold">
            Transactions ({txs.length})
          </h2>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Hash</th>
                <th>Block</th>
                <th>Type</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {txs.map((tx) => {
                // Calculate if this is incoming or outgoing
                const isIncoming = tx.vout?.some(
                  (v) => v.addresses?.includes(address)
                );
                const isOutgoing = tx.vin?.some((v) =>
                  v.addresses?.includes(address)
                );

                let type = 'self';
                if (isIncoming && !isOutgoing) type = 'in';
                else if (isOutgoing && !isIncoming) type = 'out';

                return (
                  <tr key={tx.txid}>
                    <td>
                      <Link to={`/tx/${tx.txid}`} className="font-mono hash">
                        {truncateHash(tx.txid, 12)}
                      </Link>
                    </td>
                    <td>
                      <Link
                        to={`/block/${tx.blockheight}`}
                        style={{ color: chain.theme.primary }}
                      >
                        {formatNumber(tx.blockheight)}
                      </Link>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          type === 'in'
                            ? 'badge-success'
                            : type === 'out'
                            ? 'badge-warning'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {type.toUpperCase()}
                      </span>
                    </td>
                    <td className={type === 'in' ? 'text-green-400' : 'text-red-400'}>
                      {type === 'in' ? '+' : '-'}
                      {formatCoins(Math.abs(tx.total || 0) * 1e8, chain.ticker)}
                    </td>
                  </tr>
                );
              })}
              {txs.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center text-gray-500 py-8">
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Code placeholder */}
      <div className="card mt-6 text-center">
        <p className="text-gray-500 text-sm mb-2">Share this address</p>
        <div
          className="w-32 h-32 mx-auto rounded-lg flex items-center justify-center"
          style={{ backgroundColor: chain.theme.glow }}
        >
          <span className="text-4xl">QR</span>
        </div>
      </div>
    </div>
  );
}
