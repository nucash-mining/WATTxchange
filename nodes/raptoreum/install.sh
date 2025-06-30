#!/bin/bash

# Raptoreum Installation Script
# This script downloads and installs Raptoreum Core

# Configuration
VERSION="1.3.17.02"
DOWNLOAD_URL="https://github.com/Raptor3um/raptoreum/releases/download/1.3.17.02/raptoreum-1.3.17.02-x86_64-linux-gnu.tar.gz"
INSTALL_DIR="$1"
RPC_USER="$2"
RPC_PASSWORD="$3"

# Create installation directory
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

echo "Downloading Raptoreum Core ${VERSION}..."
wget "$DOWNLOAD_URL" -O raptoreum.tar.gz

echo "Extracting files..."
tar -xzf raptoreum.tar.gz --strip-components=1
rm raptoreum.tar.gz

echo "Creating raptoreum.conf..."
mkdir -p "$INSTALL_DIR/.raptoreum"
cat > "$INSTALL_DIR/.raptoreum/raptoreum.conf" << EOF
server=1
daemon=1
rpcuser=$RPC_USER
rpcpassword=$RPC_PASSWORD
rpcallowip=127.0.0.1
datadir=$INSTALL_DIR/.raptoreum
EOF

echo "Setting up permissions..."
chmod +x "$INSTALL_DIR/bin/raptoreumd"
chmod +x "$INSTALL_DIR/bin/raptoreum-cli"
chmod +x "$INSTALL_DIR/bin/raptoreum-qt"

echo "Raptoreum Core installation complete!"
echo "To start the node, run: $INSTALL_DIR/bin/raptoreumd"
echo "To interact with the node, use: $INSTALL_DIR/bin/raptoreum-cli"
echo "To start the GUI wallet, use: $INSTALL_DIR/bin/raptoreum-qt"