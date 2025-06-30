#!/bin/bash

# Help The Homeless Coin Installation Script
# This script downloads and installs Help The Homeless Coin

# Configuration
VERSION="0.14.1"
DOWNLOAD_URL="https://github.com/HTHcoin/HTH/releases/download/v${VERSION}/hth-${VERSION}-x86_64-linux-gnu.tar.gz"
INSTALL_DIR="$1"
RPC_USER="$2"
RPC_PASSWORD="$3"

# Create installation directory
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

echo "Downloading Help The Homeless Coin ${VERSION}..."
wget "$DOWNLOAD_URL" -O hth.tar.gz

echo "Extracting files..."
tar -xzf hth.tar.gz --strip-components=1
rm hth.tar.gz

echo "Creating hth.conf..."
mkdir -p "$INSTALL_DIR/.helpthehomeless"
cat > "$INSTALL_DIR/.helpthehomeless/helpthehomeless.conf" << EOF
server=1
daemon=1
rpcuser=$RPC_USER
rpcpassword=$RPC_PASSWORD
rpcallowip=127.0.0.1
datadir=$INSTALL_DIR/.helpthehomeless
EOF

echo "Setting up permissions..."
chmod +x "$INSTALL_DIR/bin/helpthehomelessd"
chmod +x "$INSTALL_DIR/bin/helpthehomeless-cli"

echo "Help The Homeless Coin installation complete!"
echo "To start the node, run: $INSTALL_DIR/bin/helpthehomelessd"
echo "To interact with the node, use: $INSTALL_DIR/bin/helpthehomeless-cli"