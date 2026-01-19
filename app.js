// WATTx Dashboard Application
// ============================

// Configuration
const CONFIG = {
    // API endpoints - update these for your setup
    POOL_API: 'http://129.80.40.193:8080/api',
    NODE_RPC: 'http://129.80.40.193:3889',
    KDF_API: 'http://129.80.40.193:7783',
    ELECTRUM: 'wss://electrum.wattxchange.app:50002',

    // RPC credentials
    RPC_USER: 'wattxrpc',
    RPC_PASS: 'wattxpass123',

    // Refresh intervals
    REFRESH_INTERVAL: 30000, // 30 seconds
    CHART_POINTS: 24,
};

// State
let state = {
    blockHeight: 0,
    networkHashrate: 0,
    difficulty: 0,
    connections: 0,
    poolStats: null,
    chartData: {
        hashrate: [],
        difficulty: []
    }
};

// Charts
let hashrateChart = null;
let difficultyChart = null;

// ============================
// Initialization
// ============================

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initCharts();
    loadAllData();

    // Auto refresh
    if (document.getElementById('auto-refresh')?.checked) {
        setInterval(loadAllData, CONFIG.REFRESH_INTERVAL);
    }

    // Refresh button
    document.getElementById('refresh-btn')?.addEventListener('click', loadAllData);
});

// ============================
// Navigation
// ============================

function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const pageName = item.dataset.page;

            // Update nav
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Update pages
            pages.forEach(page => page.classList.remove('active'));
            document.getElementById(`${pageName}-page`)?.classList.add('active');

            // Update title
            document.querySelector('.page-title').textContent =
                item.querySelector('span').textContent;
        });
    });

    // Mobile menu toggle
    document.querySelector('.menu-toggle')?.addEventListener('click', () => {
        document.querySelector('.sidebar').classList.toggle('open');
    });
}

// ============================
// Data Loading
// ============================

async function loadAllData() {
    showLoadingState();

    try {
        await Promise.all([
            loadPoolStats(),
            loadNodeInfo(),
            loadNetworkInfo()
        ]);
        updateUI();
    } catch (error) {
        console.error('Error loading data:', error);
        showToast('Error loading data', 'error');
    }
}

async function loadPoolStats() {
    try {
        const response = await fetch(`${CONFIG.POOL_API}/stats`);
        if (response.ok) {
            state.poolStats = await response.json();

            // Update pool stats
            document.getElementById('pool-miners').textContent = state.poolStats.pool_stats?.miners || 0;
            document.getElementById('pool-hashrate').textContent = formatHashrate(state.poolStats.pool_stats?.hashrate || 0);
            document.getElementById('pool-workers').textContent = state.poolStats.pool_stats?.workers || 0;
            document.getElementById('blocks-found').textContent = state.poolStats.pool_stats?.blocksFound || 0;

            // Network stats from pool
            if (state.poolStats.network) {
                state.networkHashrate = state.poolStats.network.hashrate || 0;
                document.getElementById('network-hashrate').textContent = formatHashrate(state.networkHashrate);
            }

            // Mining page stats
            document.getElementById('mining-pool-hashrate').textContent = formatHashrate(state.poolStats.pool_stats?.hashrate || 0);
            document.getElementById('mining-miners').textContent = state.poolStats.pool_stats?.miners || 0;
            document.getElementById('mining-blocks').textContent = state.poolStats.pool_stats?.blocksFound || 0;
            document.getElementById('mining-paid').textContent = (state.poolStats.pool_stats?.totalPaid || 0) + ' WTX';
        }
    } catch (error) {
        console.error('Error loading pool stats:', error);
    }
}

async function loadNodeInfo() {
    try {
        const response = await rpcCall('getblockchaininfo');
        if (response.result) {
            const info = response.result;
            state.blockHeight = info.blocks;
            state.difficulty = info.difficulty;

            // Update UI
            document.getElementById('block-height').textContent = state.blockHeight.toLocaleString();
            document.getElementById('difficulty').textContent = state.difficulty.toLocaleString();
            document.getElementById('node-height').textContent = state.blockHeight.toLocaleString();
            document.getElementById('node-difficulty').textContent = state.difficulty.toLocaleString();
            document.getElementById('node-chain').textContent = info.chain;
            document.getElementById('node-bestblock').textContent = info.bestblockhash?.substring(0, 32) + '...';
            document.getElementById('node-chainwork').textContent = info.chainwork?.substring(0, 32) + '...';
            document.getElementById('node-verification').textContent = (info.verificationprogress * 100).toFixed(2) + '%';
            document.getElementById('node-pruned').textContent = info.pruned ? 'Yes' : 'No';

            // Sync progress
            const progress = document.getElementById('sync-progress');
            if (progress) {
                progress.style.width = (info.verificationprogress * 100) + '%';
            }

            // Add to chart data
            state.chartData.difficulty.push({
                time: new Date(),
                value: state.difficulty
            });
            if (state.chartData.difficulty.length > CONFIG.CHART_POINTS) {
                state.chartData.difficulty.shift();
            }
        }
    } catch (error) {
        console.error('Error loading node info:', error);
    }
}

async function loadNetworkInfo() {
    try {
        const response = await rpcCall('getnetworkinfo');
        if (response.result) {
            state.connections = response.result.connections;
            document.getElementById('connections').textContent = state.connections;
            document.getElementById('node-peers').textContent = state.connections;
        }

        // Load peer info
        const peerResponse = await rpcCall('getpeerinfo');
        if (peerResponse.result) {
            updatePeerList(peerResponse.result);
        }
    } catch (error) {
        console.error('Error loading network info:', error);
    }
}

// ============================
// RPC Calls
// ============================

async function rpcCall(method, params = []) {
    try {
        const response = await fetch(CONFIG.NODE_RPC, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + btoa(`${CONFIG.RPC_USER}:${CONFIG.RPC_PASS}`)
            },
            body: JSON.stringify({
                jsonrpc: '1.0',
                id: Date.now(),
                method: method,
                params: params
            })
        });
        return await response.json();
    } catch (error) {
        console.error(`RPC error (${method}):`, error);
        return { error: error.message };
    }
}

// ============================
// Charts
// ============================

function initCharts() {
    const hashrateCtx = document.getElementById('hashrate-chart')?.getContext('2d');
    const difficultyCtx = document.getElementById('difficulty-chart')?.getContext('2d');

    if (hashrateCtx) {
        hashrateChart = new Chart(hashrateCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Network Hashrate',
                    data: [],
                    borderColor: '#4facfe',
                    backgroundColor: 'rgba(79, 172, 254, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: getChartOptions('H/s')
        });
    }

    if (difficultyCtx) {
        difficultyChart = new Chart(difficultyCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Difficulty',
                    data: [],
                    borderColor: '#a855f7',
                    backgroundColor: 'rgba(168, 85, 247, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: getChartOptions('')
        });
    }

    // Generate initial demo data
    generateDemoChartData();
}

function getChartOptions(unit) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            }
        },
        scales: {
            x: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)'
                },
                ticks: {
                    color: '#6c6c7c'
                }
            },
            y: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)'
                },
                ticks: {
                    color: '#6c6c7c',
                    callback: function(value) {
                        return formatNumber(value) + (unit ? ' ' + unit : '');
                    }
                }
            }
        }
    };
}

function generateDemoChartData() {
    const now = new Date();
    const labels = [];
    const hashrateData = [];
    const difficultyData = [];

    for (let i = 23; i >= 0; i--) {
        const time = new Date(now - i * 3600000);
        labels.push(time.getHours() + ':00');
        hashrateData.push(5000000 + Math.random() * 2000000);
        difficultyData.push(55000 + Math.random() * 10000);
    }

    if (hashrateChart) {
        hashrateChart.data.labels = labels;
        hashrateChart.data.datasets[0].data = hashrateData;
        hashrateChart.update();
    }

    if (difficultyChart) {
        difficultyChart.data.labels = labels;
        difficultyChart.data.datasets[0].data = difficultyData;
        difficultyChart.update();
    }
}

// ============================
// UI Updates
// ============================

function updateUI() {
    updateServiceStatus();
}

function updateServiceStatus() {
    // Check services and update status indicators
    const services = document.querySelectorAll('.service-row .fa-circle');
    services.forEach(dot => {
        dot.classList.add('status-ok');
    });
}

function updatePeerList(peers) {
    const tbody = document.getElementById('peer-list');
    if (!tbody) return;

    if (peers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">No peers connected</td></tr>';
        return;
    }

    tbody.innerHTML = peers.slice(0, 10).map(peer => `
        <tr>
            <td class="mono">${peer.addr}</td>
            <td>${peer.subver || 'Unknown'}</td>
            <td>${peer.synced_headers || '--'}</td>
            <td>${peer.pingtime ? (peer.pingtime * 1000).toFixed(0) + 'ms' : '--'}</td>
            <td>${peer.inbound ? 'Inbound' : 'Outbound'}</td>
        </tr>
    `).join('');
}

function showLoadingState() {
    // Can add loading indicators here
}

// ============================
// Utility Functions
// ============================

function formatHashrate(hashrate) {
    if (hashrate >= 1e12) return (hashrate / 1e12).toFixed(2) + ' TH/s';
    if (hashrate >= 1e9) return (hashrate / 1e9).toFixed(2) + ' GH/s';
    if (hashrate >= 1e6) return (hashrate / 1e6).toFixed(2) + ' MH/s';
    if (hashrate >= 1e3) return (hashrate / 1e3).toFixed(2) + ' KH/s';
    return hashrate.toFixed(2) + ' H/s';
}

function formatNumber(num) {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
}

function formatTime(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
}

// ============================
// Actions
// ============================

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard!', 'success');
    }).catch(err => {
        showToast('Failed to copy', 'error');
    });
}

function downloadXmrigConfig() {
    const config = {
        "autosave": true,
        "cpu": true,
        "opencl": false,
        "cuda": false,
        "pools": [
            {
                "url": "129.80.40.193:3333",
                "user": "YOUR_WATTX_ADDRESS",
                "pass": "x",
                "keepalive": true,
                "tls": false,
                "algo": "rx/0"
            }
        ]
    };

    const blob = new Blob([JSON.stringify(config, null, 4)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'config.json';
    a.click();
    URL.revokeObjectURL(url);

    showToast('Config downloaded!', 'success');
}

function lookupMiner() {
    const address = document.getElementById('miner-address').value;
    if (!address) {
        showToast('Please enter an address', 'error');
        return;
    }

    // Fetch miner stats from pool API
    fetch(`${CONFIG.POOL_API}/miner/${address}`)
        .then(res => res.json())
        .then(data => {
            const statsDiv = document.getElementById('miner-stats');
            statsDiv.classList.remove('hidden');
            statsDiv.innerHTML = `
                <div class="info-row">
                    <span>Hashrate</span>
                    <span>${formatHashrate(data.hashrate || 0)}</span>
                </div>
                <div class="info-row">
                    <span>Shares</span>
                    <span>${data.shares || 0}</span>
                </div>
                <div class="info-row">
                    <span>Balance</span>
                    <span>${(data.balance || 0).toFixed(8)} WTX</span>
                </div>
                <div class="info-row">
                    <span>Total Paid</span>
                    <span>${(data.paid || 0).toFixed(8)} WTX</span>
                </div>
            `;
        })
        .catch(err => {
            showToast('Miner not found', 'error');
        });
}

// ============================
// Modals
// ============================

function showSendModal() {
    document.getElementById('send-modal').classList.add('active');
}

function showReceiveModal() {
    const modal = document.getElementById('receive-modal');
    modal.classList.add('active');

    // Generate a demo address
    const address = 'Wg222swbrXWgVjqCqb3LnxTwXo29UBpTm4';
    document.getElementById('receive-address').textContent = address;

    // Generate QR code
    const qrDiv = document.getElementById('qr-code');
    qrDiv.innerHTML = '';
    new QRCode(qrDiv, {
        text: address,
        width: 180,
        height: 180,
        colorDark: '#000000',
        colorLight: '#ffffff'
    });
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function copyAddress() {
    const address = document.getElementById('receive-address').textContent;
    copyToClipboard(address);
}

// ============================
// Wallet Functions
// ============================

function generateNewAddress() {
    rpcCall('getnewaddress').then(response => {
        if (response.result) {
            showToast('New address generated!', 'success');
            // Refresh address list
        }
    });
}

function sendTransaction() {
    const address = document.getElementById('send-address').value;
    const amount = parseFloat(document.getElementById('send-amount').value);

    if (!address || !amount) {
        showToast('Please fill all fields', 'error');
        return;
    }

    rpcCall('sendtoaddress', [address, amount]).then(response => {
        if (response.result) {
            showToast('Transaction sent!', 'success');
            closeModal('send-modal');
        } else {
            showToast(response.error?.message || 'Transaction failed', 'error');
        }
    });
}

function setMaxAmount() {
    // Get wallet balance and set as max
    rpcCall('getbalance').then(response => {
        if (response.result !== undefined) {
            document.getElementById('send-amount').value = response.result;
        }
    });
}

// ============================
// Bridge Functions
// ============================

function swapBridgeDirection() {
    const fromSelect = document.getElementById('bridge-from');
    const toSelect = document.getElementById('bridge-to');

    const fromValue = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = fromValue;
}

function initiateBridge() {
    const amount = document.getElementById('bridge-amount').value;
    const destination = document.getElementById('bridge-destination').value;
    const toChain = document.getElementById('bridge-to').value;
    const isPrivate = document.getElementById('private-bridge').checked;

    if (!amount || !destination) {
        showToast('Please fill all fields', 'error');
        return;
    }

    showToast('Bridge initiated! This may take ~15 minutes.', 'info');
    // Implement actual bridge logic
}

// ============================
// DEX Functions
// ============================

function swapTokens() {
    // Swap the from/to tokens
    const fromBtn = document.getElementById('swap-from-token');
    const toBtn = document.getElementById('swap-to-token');

    const fromHtml = fromBtn.innerHTML;
    fromBtn.innerHTML = toBtn.innerHTML;
    toBtn.innerHTML = fromHtml;
}

function executeSwap() {
    const amount = document.getElementById('swap-amount').value;

    if (!amount) {
        showToast('Please enter an amount', 'error');
        return;
    }

    showToast('Swap initiated! Please wait for confirmation.', 'info');
    // Implement actual swap logic via KDF
}

function showSwapSettings() {
    // Show swap settings modal
    showToast('Settings coming soon', 'info');
}

// ============================
// Settings Functions
// ============================

function testConnection() {
    const host = document.getElementById('rpc-host').value;
    const port = document.getElementById('rpc-port').value;

    CONFIG.NODE_RPC = `http://${host}:${port}`;
    CONFIG.RPC_USER = document.getElementById('rpc-user').value;
    CONFIG.RPC_PASS = document.getElementById('rpc-pass').value;

    rpcCall('getblockchaininfo').then(response => {
        if (response.result) {
            showToast('Connection successful!', 'success');
            document.querySelector('.status-dot').classList.add('connected');
        } else {
            showToast('Connection failed: ' + (response.error?.message || 'Unknown error'), 'error');
        }
    });
}

function backupWallet() {
    const filename = `wattx-backup-${Date.now()}.dat`;
    rpcCall('backupwallet', [filename]).then(response => {
        if (response.result === null) {
            showToast('Wallet backed up!', 'success');
        } else {
            showToast('Backup failed', 'error');
        }
    });
}

// ============================
// Toast Notifications
// ============================

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 5000);
}

// ============================
// Keyboard Shortcuts
// ============================

document.addEventListener('keydown', (e) => {
    // Escape to close modals
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    // R to refresh
    if (e.key === 'r' && !e.ctrlKey && !e.metaKey && document.activeElement.tagName !== 'INPUT') {
        loadAllData();
    }
});

// ============================
// Initialize on load
// ============================

// Service worker for offline support (optional)
if ('serviceWorker' in navigator) {
    // navigator.serviceWorker.register('/sw.js');
}

console.log('WATTx Dashboard initialized');
