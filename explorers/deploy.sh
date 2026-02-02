#!/bin/bash
# WATTxchange Explorer Deployment Script
# Builds and deploys all explorer frontends to the Oracle server

set -e

SERVER="opc@129.80.40.193"
SSH_KEY="/home/nuts/Downloads/wattx-oracle_SSH/ssh-key-2026-01-17.key"
DEPLOY_PATH="/opt/explorer-frontend"

echo "=== WATTxchange Explorer Deployment ==="

# Build all chains
echo "Building all explorer frontends..."
npm install
npm run build:all

# Create deployment directory on server
echo "Creating deployment directories..."
ssh -i "$SSH_KEY" "$SERVER" "sudo mkdir -p $DEPLOY_PATH/{wtx,hth,flop,alt} && sudo chown -R opc:opc $DEPLOY_PATH"

# Deploy each chain
for chain in wtx hth flop alt; do
    echo "Deploying $chain explorer..."
    scp -i "$SSH_KEY" -r dist/$chain/* "$SERVER:$DEPLOY_PATH/$chain/"
done

echo "=== Deployment Complete ==="
echo "Frontends deployed to $DEPLOY_PATH on $SERVER"
echo ""
echo "Configure nginx to serve:"
echo "  /opt/explorer-frontend/wtx  -> wtx-explorer.wattxchange.app"
echo "  /opt/explorer-frontend/hth  -> hth-explorer.wattxchange.app"
echo "  /opt/explorer-frontend/flop -> flop-explorer.wattxchange.app"
echo "  /opt/explorer-frontend/alt  -> alt-explorer.wattxchange.app"
