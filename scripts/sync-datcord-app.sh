#!/usr/bin/env bash
# Rebuild the Datcord client (~/datcord/apps/web, the same app as the Android build)
# into public/datcord-app/, pointed at the hosted identity service.
set -euo pipefail
SITE="$(cd "$(dirname "$0")/.." && pwd)"
DATCORD="${DATCORD_DIR:-$HOME/datcord}"
API="${VITE_DATCORD_API:-https://datcord-api.wattxchange.app}"
cd "$DATCORD/apps/web"
VITE_DATCORD_API="$API" npx vite build --outDir "$SITE/public/datcord-app" --emptyOutDir
echo "Datcord client synced to $SITE/public/datcord-app (API: $API)"
