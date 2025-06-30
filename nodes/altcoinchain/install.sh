#!/bin/bash

# Altcoinchain Installation Script
# This script downloads and installs Altcoinchain

# Configuration
DOWNLOAD_URL="https://github.com/altcoinchain/altcoinchain/archive/refs/heads/master.zip"
INSTALL_DIR="$1"
RPC_USER="$2"
RPC_PASSWORD="$3"

# Create installation directory
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

echo "Downloading Altcoinchain..."
wget "$DOWNLOAD_URL" -O altcoinchain.zip

echo "Extracting files..."
unzip altcoinchain.zip
mv altcoinchain-master/* .
rm -rf altcoinchain-master altcoinchain.zip

echo "Installing dependencies..."
sudo apt-get update
sudo apt-get install -y build-essential libtool autotools-dev automake pkg-config libssl-dev libevent-dev bsdmainutils python3 libboost-all-dev

echo "Building Altcoinchain..."
./autogen.sh
./configure --disable-tests --disable-bench --without-gui
make -j$(nproc)

echo "Creating altcoin.conf..."
mkdir -p "$INSTALL_DIR/.altcoin"
cat > "$INSTALL_DIR/.altcoin/altcoin.conf" << EOF
server=1
daemon=1
rpcuser=$RPC_USER
rpcpassword=$RPC_PASSWORD
rpcallowip=127.0.0.1
datadir=$INSTALL_DIR/.altcoin
addnode=2600:1700:5250:1c60:8bc1:e4ce:5e8b:8a1b
addnode=23.245.133.56
EOF

echo "Setting up permissions..."
chmod +x "$INSTALL_DIR/src/altcoind"
chmod +x "$INSTALL_DIR/src/altcoin-cli"

echo "Altcoinchain installation complete!"
echo "To start the node, run: $INSTALL_DIR/src/altcoind"
echo "To interact with the node, use: $INSTALL_DIR/src/altcoin-cli"