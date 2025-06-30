#!/bin/bash

# Litecoin Core Installation Script
# This script downloads and installs Litecoin Core

# Configuration
VERSION="0.21.2.2"
DOWNLOAD_URL="https://download.litecoin.org/litecoin-${VERSION}/linux/litecoin-${VERSION}-x86_64-linux-gnu.tar.gz"
INSTALL_DIR="$1"
RPC_USER="$2"
RPC_PASSWORD="$3"

# Create installation directory
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

echo "Downloading Litecoin Core ${VERSION}..."
wget "$DOWNLOAD_URL" -O litecoin.tar.gz

echo "Extracting files..."
tar -xzf litecoin.tar.gz --strip-components=1
rm litecoin.tar.gz

echo "Creating litecoin.conf..."
mkdir -p "$INSTALL_DIR/.litecoin"
cat > "$INSTALL_DIR/.litecoin/litecoin.conf" << EOF
server=1
daemon=1
rpcuser=$RPC_USER
rpcpassword=$RPC_PASSWORD
rpcallowip=127.0.0.1
datadir=$INSTALL_DIR/.litecoin
EOF

echo "Setting up permissions..."
chmod +x "$INSTALL_DIR/bin/litecoind"
chmod +x "$INSTALL_DIR/bin/litecoin-cli"

echo "Litecoin Core installation complete!"
echo "To start the node, run: $INSTALL_DIR/bin/litecoind"
echo "To interact with the node, use: $INSTALL_DIR/bin/litecoin-cli"