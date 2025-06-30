#!/bin/bash

# Bitcoin Core Installation Script
# This script downloads and installs Bitcoin Core

# Configuration
VERSION="25.0"
DOWNLOAD_URL="https://bitcoin.org/bin/bitcoin-core-${VERSION}/bitcoin-${VERSION}-x86_64-linux-gnu.tar.gz"
INSTALL_DIR="$1"
RPC_USER="$2"
RPC_PASSWORD="$3"

# Create installation directory
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

echo "Downloading Bitcoin Core ${VERSION}..."
wget "$DOWNLOAD_URL" -O bitcoin.tar.gz

echo "Extracting files..."
tar -xzf bitcoin.tar.gz --strip-components=1
rm bitcoin.tar.gz

echo "Creating bitcoin.conf..."
mkdir -p "$INSTALL_DIR/.bitcoin"
cat > "$INSTALL_DIR/.bitcoin/bitcoin.conf" << EOF
server=1
daemon=1
rpcuser=$RPC_USER
rpcpassword=$RPC_PASSWORD
rpcallowip=127.0.0.1
datadir=$INSTALL_DIR/.bitcoin
EOF

echo "Setting up permissions..."
chmod +x "$INSTALL_DIR/bin/bitcoind"
chmod +x "$INSTALL_DIR/bin/bitcoin-cli"

echo "Bitcoin Core installation complete!"
echo "To start the node, run: $INSTALL_DIR/bin/bitcoind"
echo "To interact with the node, use: $INSTALL_DIR/bin/bitcoin-cli"