import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiGet, chain } from '../hooks/useApi';
import { Loading, ErrorMessage, PageTitle } from '../components/Layout';
import { formatNumber, truncateAddress, formatStakeWeight, formatCoins } from '../utils/format';

export default function Staking() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Try to get staking info - this endpoint may vary
        const staking = await apiGet('/getstakinginfo').catch(() => null);
        setData(staking);
      } catch (err) {
        setError(err.message || 'Failed to load staking data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (!chain.features.delegatorNodes && !chain.features.superStakerNodes) {
    return (
      <div>
        <PageTitle>Staking Nodes</PageTitle>
        <div className="card text-center py-12">
          <p className="text-gray-500">
            {chain.name} does not support staking nodes.
          </p>
        </div>
      </div>
    );
  }

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div>
      <PageTitle>Staking Nodes</PageTitle>

      {/* Staking Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <div className="stat-label">Delegator Nodes</div>
          <div className="stat-value" style={{ color: chain.theme.primary }}>
            {formatNumber(data?.delegatorCount || 0)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Super Staker Nodes</div>
          <div className="stat-value text-green-400">
            {formatNumber(data?.superStakerCount || 0)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Staked</div>
          <div className="stat-value">
            {formatStakeWeight(data?.netstakeweight || 0, chain.ticker)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Staking Status</div>
          <div className={`stat-value ${data?.staking ? 'text-green-400' : 'text-gray-400'}`}>
            {data?.staking ? 'Active' : 'Inactive'}
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Super Staker Nodes Info */}
        <div className="card">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: chain.theme.primary }}
            />
            Super Staker Nodes
          </h2>
          <p className="text-gray-400 text-sm mb-4">
            Super Staker Nodes stake coins on behalf of delegators and earn staking rewards.
            They require a minimum stake and collect a fee from delegators.
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Min Stake Required</span>
              <span>100 {chain.ticker}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Average Fee</span>
              <span>10%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Maturity Period</span>
              <span>500 blocks</span>
            </div>
          </div>
        </div>

        {/* Delegator Nodes Info */}
        <div className="card">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-400" />
            Delegator Nodes
          </h2>
          <p className="text-gray-400 text-sm mb-4">
            Delegators assign their staking weight to a Super Staker without transferring coins.
            They earn staking rewards minus the Super Staker's fee.
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Min Delegation</span>
              <span>100 {chain.ticker}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Coins at Risk</span>
              <span className="text-green-400">None (Non-custodial)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Gas Fee</span>
              <span>0.9 {chain.ticker}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Super Staker List (placeholder) */}
      <div className="card p-0">
        <div className="card-header">
          <h2 className="font-semibold">Active Super Stakers</h2>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Address</th>
                <th>Status</th>
                <th>Delegators</th>
                <th>Total Stake</th>
                <th>Fee</th>
              </tr>
            </thead>
            <tbody>
              {data?.superStakers?.map((staker, i) => (
                <tr key={staker.address || i}>
                  <td>
                    <Link
                      to={`/address/${staker.address}`}
                      className="font-mono address"
                    >
                      {truncateAddress(staker.address, 10)}
                    </Link>
                  </td>
                  <td>
                    <span className={`badge ${staker.enabled ? 'badge-success' : 'badge-danger'}`}>
                      {staker.enabled ? 'ENABLED' : 'DISABLED'}
                    </span>
                  </td>
                  <td>{formatNumber(staker.delegatorCount || 0)}</td>
                  <td>{formatStakeWeight(staker.stakeWeight || 0, chain.ticker)}</td>
                  <td>{staker.fee || 10}%</td>
                </tr>
              ))}
              {(!data?.superStakers || data.superStakers.length === 0) && (
                <tr>
                  <td colSpan="5" className="text-center text-gray-500 py-8">
                    No super stakers found. Data may be loading or unavailable.
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
