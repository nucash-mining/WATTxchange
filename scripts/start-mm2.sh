#!/usr/bin/env bash
#
# start-mm2.sh — Launch the Komodo DeFi Framework (kdf/mm2) daemon that powers
# the WATTxchange DeFi Hub's trustless atomic swaps.
#
# It generates the runtime config (coins + MM2.json) from the shared coin source
# of truth (src/config/mm2Coins.data.json) and starts the daemon. The web app
# then talks to it over JSON-RPC at http://$MM2_RPCIP:$MM2_RPCPORT.
#
# Usage:
#   MM2_PASSPHRASE="your wallet seed words" \
#   MM2_RPC_PASSWORD="a-strong-rpc-password" \
#   ./scripts/start-mm2.sh
#
# First run downloads the kdf binary if not found. Set KDF_BIN to use your own.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
DATA_DIR="${MM2_DATADIR:-${REPO_ROOT}/.mm2}"
RPCIP="${MM2_RPCIP:-127.0.0.1}"
RPCPORT="${MM2_RPCPORT:-7783}"

: "${MM2_PASSPHRASE:?set MM2_PASSPHRASE to your trading-wallet seed phrase}"
: "${MM2_RPC_PASSWORD:?set MM2_RPC_PASSWORD to the RPC password the app will use}"

echo "=========================================="
echo "  WATTxchange — Komodo DeFi Framework (kdf)"
echo "=========================================="

# 1. Generate coins + MM2.json from the shared config.
echo "Generating kdf config in ${DATA_DIR} ..."
node "${SCRIPT_DIR}/mm2/genConfig.mjs"

# 2. Locate or fetch the kdf binary.
KDF_BIN="${KDF_BIN:-}"
if [ -z "${KDF_BIN}" ]; then
  if command -v kdf &>/dev/null; then KDF_BIN="$(command -v kdf)"
  elif command -v mm2 &>/dev/null; then KDF_BIN="$(command -v mm2)"
  elif [ -x "${DATA_DIR}/kdf" ]; then KDF_BIN="${DATA_DIR}/kdf"
  fi
fi

if [ -z "${KDF_BIN}" ]; then
  echo ""
  echo "kdf/mm2 binary not found. Download it from the Komodo DeFi Framework"
  echo "releases and either put it on PATH or set KDF_BIN:"
  echo "  https://github.com/KomodoPlatform/komodo-defi-framework/releases"
  echo "Then re-run this script."
  exit 1
fi

echo "Using kdf binary: ${KDF_BIN}"

# 3. Run the daemon from the data dir (kdf reads ./coins and ./MM2.json there).
cd "${DATA_DIR}"
echo "Starting kdf — app should connect at http://${RPCIP}:${RPCPORT}"
echo "(Ctrl-C to stop; logs below)"
echo "=========================================="
exec "${KDF_BIN}"
