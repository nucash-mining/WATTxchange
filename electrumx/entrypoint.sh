#!/bin/bash
set -e

# WATTxchange ElectrumX entrypoint (generic, coin selected via $COIN env).

echo "=========================================="
echo "  WATTxchange ElectrumX — ${COIN}"
echo "=========================================="

mkdir -p /data/ssl "${DB_DIRECTORY}"

# Self-signed SSL cert (Electrum SSL transport) if none mounted.
if [ ! -f /data/ssl/server.crt ] || [ ! -f /data/ssl/server.key ]; then
    echo "Generating self-signed SSL certificate..."
    openssl req -x509 -newkey rsa:4096 -keyout /data/ssl/server.key \
        -out /data/ssl/server.crt -days 3650 -nodes \
        -subj "/CN=${REPORT_HOST:-electrum.wattxchange.app}" 2>/dev/null || true
fi

echo ""
echo "  COIN:        ${COIN}"
echo "  NET:         ${NET}"
echo "  DAEMON_URL:  ${DAEMON_URL//:*@/:***@}"
echo "  DB:          ${DB_DIRECTORY}"
echo "  SERVICES:    ${SERVICES}"
echo "  REPORT_HOST: ${REPORT_HOST}"
echo ""

# The daemon MUST be running with txindex=1 and reachable at DAEMON_URL.
echo "Starting ElectrumX (initial sync can take a while on first run)..."
echo "=========================================="

exec python3 -m electrumx_server
