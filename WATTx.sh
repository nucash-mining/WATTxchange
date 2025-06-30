#!/bin/bash

# WATTxchange Launcher Script
# This script launches the WATTxchange application

# Configuration
PROJECT_DIR="$(pwd)"
NODE_MODULES_DIR="$PROJECT_DIR/node_modules"
NODES_DIR="$PROJECT_DIR/nodes"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js to run WATTxchange."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "npm is not installed. Please install npm to run WATTxchange."
    exit 1
fi

# Check if project dependencies are installed
if [ ! -d "$NODE_MODULES_DIR" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Create nodes directory structure if it doesn't exist
mkdir -p "$NODES_DIR/bitcoin"
mkdir -p "$NODES_DIR/litecoin"
mkdir -p "$NODES_DIR/monero"
mkdir -p "$NODES_DIR/ghost"
mkdir -p "$NODES_DIR/trollcoin"
mkdir -p "$NODES_DIR/hth"
mkdir -p "$NODES_DIR/altcoinchain"
mkdir -p "$NODES_DIR/raptoreum"

# Make installation scripts executable
chmod +x "$NODES_DIR/bitcoin/install.sh"
chmod +x "$NODES_DIR/litecoin/install.sh"
chmod +x "$NODES_DIR/monero/install.sh"
chmod +x "$NODES_DIR/ghost/install.sh"
chmod +x "$NODES_DIR/trollcoin/install.sh"
chmod +x "$NODES_DIR/hth/install.sh"
chmod +x "$NODES_DIR/altcoinchain/install.sh"
chmod +x "$NODES_DIR/raptoreum/install.sh"

# Start the application
echo "Starting WATTxchange..."
npm run dev