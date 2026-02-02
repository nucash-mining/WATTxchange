import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { getChainConfig } from '../config/chains';

const chain = getChainConfig();

// Create axios instance with base URL
const api = axios.create({
  baseURL: chain.api,
  timeout: 30000,
});

// Generic API hook
export function useApi(endpoint, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { autoRefresh = 0, enabled = true } = options;

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    try {
      setLoading(true);
      setError(null);
      const res = await api.get(endpoint);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, [endpoint, enabled]);

  useEffect(() => {
    fetchData();

    if (autoRefresh > 0) {
      const interval = setInterval(fetchData, autoRefresh);
      return () => clearInterval(interval);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData, autoRefresh]);

  return { data, loading, error, refetch: fetchData };
}

// eIquidus API endpoints
// /api/ - RPC-style endpoints
// /ext/ - Extended endpoints

export function useStats() {
  return useApi('/ext/getsummary', { autoRefresh: 15000 });
}

export function useSummary() {
  return useApi('/ext/getsummary', { autoRefresh: 15000 });
}

export function useBlocks(start = 0, limit = 10) {
  return useApi(`/ext/getlasttxs/${start}/${limit}`, { autoRefresh: 10000 });
}

export function useBlockCount() {
  return useApi('/api/getblockcount', { autoRefresh: 10000 });
}

export function useDifficulty() {
  return useApi('/api/getdifficulty', { autoRefresh: 30000 });
}

export function useNetworkHashrate() {
  return useApi('/api/getnetworkhashps', { autoRefresh: 30000 });
}

export function useBlock(heightOrHash) {
  return useApi(`/ext/getblock/${heightOrHash}`, { enabled: !!heightOrHash });
}

export function useTransaction(txid) {
  return useApi(`/api/getrawtransaction?txid=${txid}&decrypt=1`, { enabled: !!txid });
}

export function useTxInfo(txid) {
  return useApi(`/ext/gettx/${txid}`, { enabled: !!txid });
}

export function useAddress(address) {
  return useApi(`/ext/getaddress/${address}`, { enabled: !!address });
}

export function useAddressTxs(address, start = 0, length = 10) {
  return useApi(`/ext/getaddresstxs/${address}/${start}/${length}`, {
    enabled: !!address
  });
}

export function useMoneySupply() {
  return useApi('/ext/getmoneysupply', { autoRefresh: 60000 });
}

export function useDistribution() {
  return useApi('/ext/getdistribution', { autoRefresh: 300000 });
}

export function useRichList(start = 0, length = 100) {
  return useApi(`/ext/getrichlist/${start}/${length}`, { autoRefresh: 60000 });
}

export function useMasternodes() {
  if (!chain.features.masternodes) return { data: null, loading: false, error: null };
  return useApi('/ext/getmasternodelist', { autoRefresh: 60000 });
}

export function useMasternodeCount() {
  if (!chain.features.masternodes) return { data: null, loading: false, error: null };
  return useApi('/ext/getmasternodecount', { autoRefresh: 60000 });
}

export function useNetworkPeers() {
  return useApi('/ext/getnetworkpeers', { autoRefresh: 60000 });
}

export function useCurrentPrice() {
  return useApi('/ext/getcurrentprice', { autoRefresh: 60000 });
}

export function useConnectionCount() {
  return useApi('/api/getconnectioncount', { autoRefresh: 30000 });
}

// Direct API calls
export async function apiPost(endpoint, data) {
  const res = await api.post(endpoint, data);
  return res.data;
}

export async function apiGet(endpoint) {
  const res = await api.get(endpoint);
  return res.data;
}

// Search function for blocks, transactions, addresses
export async function search(query) {
  // Try as block height first
  if (/^\d+$/.test(query)) {
    try {
      const block = await apiGet(`/ext/getblock/${query}`);
      if (block && !block.error) {
        return { type: 'block', data: block };
      }
    } catch (e) {}
  }

  // Try as transaction hash
  if (/^[a-fA-F0-9]{64}$/.test(query)) {
    try {
      const tx = await apiGet(`/ext/gettx/${query}`);
      if (tx && !tx.error) {
        return { type: 'tx', data: tx };
      }
    } catch (e) {}

    // Try as block hash
    try {
      const block = await apiGet(`/ext/getblock/${query}`);
      if (block && !block.error) {
        return { type: 'block', data: block };
      }
    } catch (e) {}
  }

  // Try as address
  try {
    const addr = await apiGet(`/ext/getaddress/${query}`);
    if (addr && !addr.error) {
      return { type: 'address', data: addr };
    }
  } catch (e) {}

  return { type: 'notfound', data: null };
}

export { api, chain };
