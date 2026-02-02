import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiGet, chain } from '../hooks/useApi';
import { Loading, ErrorMessage, PageTitle } from '../components/Layout';
import { formatNumber, truncateAddress, formatCoins } from '../utils/format';

export default function Masternodes() {
  const [masternodes, setMasternodes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Get masternode list and count
        const [list, count] = await Promise.all([
          apiGet('/getmasternodelist'),
          apiGet('/getmasternodecount').catch(() => null)
        ]);

        setMasternodes(list || []);
        setStats(count);
      } catch (err) {
        setError(err.message || 'Failed to load masternodes');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (!chain.features.masternodes) {
    return (
      <div>
        <PageTitle>Masternodes</PageTitle>
        <div className="card text-center py-12">
          <p className="text-gray-500">
            {chain.name} does not support masternodes.
          </p>
        </div>
      </div>
    );
  }

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} />;

  const enabledCount = masternodes.filter(mn => mn.status === 'ENABLED').length;
  const totalCount = masternodes.length;

  return (
    <div>
      <PageTitle badge={`${enabledCount} Active`}>Masternodes</PageTitle>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <div className="stat-label">Total Masternodes</div>
          <div className="stat-value">{formatNumber(totalCount)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Enabled</div>
          <div className="stat-value text-green-400">{formatNumber(enabledCount)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Disabled/Other</div>
          <div className="stat-value text-red-400">
            {formatNumber(totalCount - enabledCount)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Collateral</div>
          <div className="stat-value" style={{ color: chain.theme.primary }}>
            {formatCoins(enabledCount * 1000 * 1e8, chain.ticker)}
          </div>
        </div>
      </div>

      {/* Masternode List */}
      <div className="card p-0">
        <div className="card-header">
          <h2 className="font-semibold">Masternode List</h2>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Address</th>
                <th>Status</th>
                <th>Protocol</th>
                <th>IP Address</th>
                <th>Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {masternodes.map((mn, i) => (
                <tr key={mn.addr || i}>
                  <td>{i + 1}</td>
                  <td>
                    <Link
                      to={`/address/${mn.addr}`}
                      className="font-mono address"
                    >
                      {truncateAddress(mn.addr, 10)}
                    </Link>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        mn.status === 'ENABLED'
                          ? 'badge-success'
                          : mn.status === 'PRE_ENABLED'
                          ? 'badge-warning'
                          : 'badge-danger'
                      }`}
                    >
                      {mn.status}
                    </span>
                  </td>
                  <td>{mn.protocol || '-'}</td>
                  <td className="font-mono text-sm text-gray-400">
                    {mn.ip || mn.network || '-'}
                  </td>
                  <td className="text-gray-400">
                    {mn.lastseen ? new Date(mn.lastseen * 1000).toLocaleString() : '-'}
                  </td>
                </tr>
              ))}
              {masternodes.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center text-gray-500 py-8">
                    No masternodes found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
