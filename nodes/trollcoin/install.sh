#!/bin/bash

# Trollcoin Installation Script
# This script downloads and installs Trollcoin

# Configuration
VERSION="2.0.0"
DOWNLOAD_URL="https://github.com/TrollCoin2/TrollCoin-2.0/archive/refs/heads/master.zip"
INSTALL_DIR="$1"
RPC_USER="$2"
RPC_PASSWORD="$3"

# Create installation directory
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

echo "Downloading Trollcoin..."
wget "$DOWNLOAD_URL" -O trollcoin.zip

echo "Extracting files..."
unzip trollcoin.zip
mv TrollCoin-2.0-master/* .
rm -rf TrollCoin-2.0-master trollcoin.zip

echo "Installing dependencies..."
sudo apt-get update
sudo apt-get install -y build-essential libboost-all-dev libssl-dev libcurl4-openssl-dev libminiupnpc-dev libdb++-dev libstdc++6 make

echo "Building Trollcoin daemon..."
cd src/
make -f makefile.unix USE_UPNP=1
strip trollcoind
cp trollcoind "$INSTALL_DIR/"

echo "Creating trollcoin.conf..."
mkdir -p "$INSTALL_DIR/.trollcoin"
cat > "$INSTALL_DIR/.trollcoin/trollcoin.conf" << EOF
server=1
daemon=1
rpcuser=$RPC_USER
rpcpassword=$RPC_PASSWORD
rpcallowip=127.0.0.1
datadir=$INSTALL_DIR/.trollcoin
EOF

echo "Trollcoin installation complete!"
echo "To start the node, run: $INSTALL_DIR/trollcoind"
echo "To start mining, use: $INSTALL_DIR/trollcoind setgenerate true <threads>"