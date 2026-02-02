// Formatting utilities for the explorer

export const truncateHash = (hash, chars = 8) => {
  if (!hash) return '';
  if (hash.length <= chars * 2 + 3) return hash;
  return `${hash.slice(0, chars + 2)}...${hash.slice(-chars)}`;
};

export const truncateAddress = (address, chars = 6) => {
  if (!address) return '';
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
};

export const formatTime = (timestamp) => {
  if (!timestamp) return '-';
  const date = new Date(typeof timestamp === 'number' ? timestamp * 1000 : timestamp);
  return date.toLocaleString();
};

export const formatTimeAgo = (timestamp) => {
  if (!timestamp) return '-';
  const date = new Date(typeof timestamp === 'number' ? timestamp * 1000 : timestamp);
  const seconds = Math.floor((new Date() - date) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

export const formatNumber = (num, decimals = 0) => {
  if (num === null || num === undefined) return '-';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num);
};

export const formatHashRate = (hashRate) => {
  if (!hashRate || hashRate === 0) return '0 H/s';
  const units = ['H/s', 'KH/s', 'MH/s', 'GH/s', 'TH/s', 'PH/s', 'EH/s'];
  let unitIndex = 0;
  let value = hashRate;
  while (value >= 1000 && unitIndex < units.length - 1) {
    value /= 1000;
    unitIndex++;
  }
  return `${value.toFixed(2)} ${units[unitIndex]}`;
};

export const formatCoins = (amount, ticker = 'COIN', decimals = 8) => {
  if (amount === null || amount === undefined) return `0 ${ticker}`;
  const value = parseFloat(amount);
  // Show less decimals for larger amounts
  const displayDecimals = value >= 1000 ? 2 : value >= 1 ? 4 : Math.min(decimals, 8);
  return `${formatNumber(value, displayDecimals)} ${ticker}`;
};

export const formatEther = (wei, decimals = 6) => {
  if (!wei) return '0';
  const eth = parseFloat(wei) / 1e18;
  return formatNumber(eth, decimals);
};

export const formatGwei = (wei) => {
  if (!wei) return '0';
  return formatNumber(parseFloat(wei) / 1e9, 2);
};

export const formatDifficulty = (diff) => {
  if (!diff) return '0';
  if (diff >= 1e12) return `${(diff / 1e12).toFixed(2)} T`;
  if (diff >= 1e9) return `${(diff / 1e9).toFixed(2)} G`;
  if (diff >= 1e6) return `${(diff / 1e6).toFixed(2)} M`;
  if (diff >= 1e3) return `${(diff / 1e3).toFixed(2)} K`;
  return diff.toFixed(2);
};

export const formatBytes = (bytes) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let unitIndex = 0;
  let value = bytes;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${formatNumber(value, 2)} ${units[unitIndex]}`;
};

export const formatStakeWeight = (satoshis, ticker = 'WTX') => {
  if (!satoshis) return `0 ${ticker}`;
  const value = satoshis / 1e8;
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B ${ticker}`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M ${ticker}`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K ${ticker}`;
  return `${value.toFixed(2)} ${ticker}`;
};
