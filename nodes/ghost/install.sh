#!/bin/bash

# GHOST Core Installation Script
# This script downloads and installs GHOST Core

# Configuration
VERSION="2.0.0"
DOWNLOAD_URL="https://github.com/ghost-coin/ghost-core/releases/download/v${VERSION}/ghost-${VERSION}-x86_64-linux-gnu.tar.gz"
INSTALL_DIR="$1"
RPC_USER="$2"
RPC_PASSWORD="$3"

# Create installation directory
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

echo "Downloading GHOST Core ${VERSION}..."
wget "$DOWNLOAD_URL" -O ghost.tar.gz

echo "Extracting files..."
tar -xzf ghost.tar.gz --strip-components=1
rm ghost.tar.gz

echo "Creating ghost.conf..."
mkdir -p "$INSTALL_DIR/.ghost"
cat > "$INSTALL_DIR/.ghost/ghost.conf" << EOF
server=1
daemon=1
rpcuser=$RPC_USER
rpcpassword=$RPC_PASSWORD
rpcallowip=127.0.0.1
datadir=$INSTALL_DIR/.ghost
staking=1
EOF

echo "Setting up permissions..."
chmod +x "$INSTALL_DIR/bin/ghostd"
chmod +x "$INSTALL_DIR/bin/ghost-cli"

echo "GHOST Core installation complete!"
echo "To start the node, run: $INSTALL_DIR/bin/ghostd"
echo "To interact with the node, use: $INSTALL_DIR/bin/ghost-cli"
echo "To enable staking, use: $INSTALL_DIR/bin/ghost-cli walletpassphrase \"your_passphrase\" 0 true"