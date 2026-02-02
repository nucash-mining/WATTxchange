import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiGet, chain } from '../hooks/useApi';
import { Loading, ErrorMessage, PageTitle } from '../components/Layout';
import { formatNumber, truncateAddress, formatCoins } from '../utils/format';

export default function RichList() {
  const [distribution, setDistribution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await apiGet('/getdistribution');
        setDistribution(data);
      } catch (err) {
        setError(err.message || 'Failed to load rich list');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} />;

  const supply = distribution?.supply || 0;

  return (
    <div>
      <PageTitle badge="Top 100">Rich List</PageTitle>

      {/* Distribution Stats */}
      {distribution && (
        <div className="card mb-6">
          <h2 className="font-semibold mb-4">Wealth Distribution</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {distribution.distribution?.map((d, i) => (
              <div key={i} className="text-center p-3 bg-dark-300 rounded-lg">
                <p className="text-xs text-gray-500">{d.percent}% of Supply</p>
                <p className="font-semibold" style={{ color: chain.theme.primary }}>
                  {d.addresses} wallets
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top 100 Table */}
      <div className="card p-0">
        <div className="card-header">
          <h2 className="font-semibold">Top 100 Addresses</h2>
          <span className="text-sm text-gray-500">
            Total Supply: {formatCoins(supply * 1e8, chain.ticker)}
          </span>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Address</th>
                <th>Balance</th>
                <th>% of Supply</th>
              </tr>
            </thead>
            <tbody>
              {distribution?.richlist?.slice(0, 100).map((addr, i) => (
                <tr key={addr.a}>
                  <td>
                    <span
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                        i < 3
                          ? 'text-black'
                          : 'bg-dark-300 text-gray-400'
                      }`}
                      style={
                        i < 3
                          ? {
                              backgroundColor:
                                i === 0
                                  ? '#FFD700'
                                  : i === 1
                                  ? '#C0C0C0'
                                  : '#CD7F32'
                            }
                          : {}
                      }
                    >
                      {i + 1}
                    </span>
                  </td>
                  <td>
                    <Link to={`/address/${addr.a}`} className="font-mono address">
                      {truncateAddress(addr.a, 12)}
                    </Link>
                  </td>
                  <td className="font-semibold">
                    {formatCoins(addr.balance * 1e8, chain.ticker)}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${Math.min((addr.balance / supply) * 100 * 5, 100)}%`,
                          backgroundColor: chain.theme.primary,
                          minWidth: '4px'
                        }}
                      />
                      <span className="text-gray-400 text-sm">
                        {((addr.balance / supply) * 100).toFixed(4)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
