#!/bin/bash

# Monero Installation Script
# This script downloads and installs Monero

# Configuration
VERSION="0.18.3.1"
DOWNLOAD_URL="https://downloads.getmonero.org/cli/monero-linux-x64-v${VERSION}.tar.bz2"
INSTALL_DIR="$1"
RPC_USER="$2"
RPC_PASSWORD="$3"

# Create installation directory
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

echo "Downloading Monero ${VERSION}..."
wget "$DOWNLOAD_URL" -O monero.tar.bz2

echo "Extracting files..."
tar -xjf monero.tar.bz2 --strip-components=1
rm monero.tar.bz2

echo "Creating monero.conf..."
mkdir -p "$INSTALL_DIR/.monero"
cat > "$INSTALL_DIR/.monero/monero.conf" << EOF
rpc-login=$RPC_USER:$RPC_PASSWORD
rpc-bind-ip=127.0.0.1
confirm-external-bind=1
data-dir=$INSTALL_DIR/.monero
EOF

echo "Setting up permissions..."
chmod +x "$INSTALL_DIR/monerod"
chmod +x "$INSTALL_DIR/monero-wallet-cli"

echo "Monero installation complete!"
echo "To start the node, run: $INSTALL_DIR/monerod --config-file=$INSTALL_DIR/.monero/monero.conf"
echo "To create a wallet, use: $INSTALL_DIR/monero-wallet-cli"