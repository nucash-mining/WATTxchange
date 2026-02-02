import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiGet, chain } from '../hooks/useApi';
import { Loading, ErrorMessage, PageTitle } from '../components/Layout';
import { formatNumber, truncateAddress } from '../utils/format';

export default function Tokens() {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        setLoading(true);
        // Token list endpoint may vary by chain
        const data = await apiGet('/gettokens').catch(() => []);
        setTokens(data || []);
      } catch (err) {
        setError(err.message || 'Failed to load tokens');
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();
  }, []);

  if (!chain.features.tokens) {
    return (
      <div>
        <PageTitle>Tokens</PageTitle>
        <div className="card text-center py-12">
          <p className="text-gray-500">
            {chain.name} does not support tokens.
          </p>
        </div>
      </div>
    );
  }

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div>
      <PageTitle badge={`${tokens.length} Tokens`}>
        {chain.features.evm ? 'ERC-20 Tokens' : 'QRC-20 Tokens'}
      </PageTitle>

      <div className="card p-0">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Token</th>
                <th>Symbol</th>
                <th>Contract Address</th>
                <th>Decimals</th>
                <th>Total Supply</th>
              </tr>
            </thead>
            <tbody>
              {tokens.map((token, i) => (
                <tr key={token.address || i}>
                  <td>{i + 1}</td>
                  <td className="font-medium">{token.name || 'Unknown'}</td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        backgroundColor: chain.theme.glow,
                        color: chain.theme.primary
                      }}
                    >
                      {token.symbol || '???'}
                    </span>
                  </td>
                  <td>
                    <Link
                      to={`/address/${token.address}`}
                      className="font-mono hash"
                    >
                      {truncateAddress(token.address, 10)}
                    </Link>
                  </td>
                  <td>{token.decimals || 18}</td>
                  <td>{formatNumber(token.totalSupply || 0)}</td>
                </tr>
              ))}
              {tokens.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center text-gray-500 py-8">
                    No tokens found
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
