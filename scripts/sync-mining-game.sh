#!/usr/bin/env bash
# Copy the live Mining Game (The-Mining-Game/app deploy repo) into public/mining-game/,
# which the Mining tab embeds at /mining-game/. Run after every game deploy.
set -euo pipefail
SRC="${1:?usage: sync-mining-game.sh <path to The-Mining-Game/app checkout>}"
DEST="$(cd "$(dirname "$0")/.." && pwd)/public/mining-game"
rsync -a --delete --exclude CNAME --exclude .git "$SRC"/ "$DEST"/
echo "synced $(grep -c . "$DEST/index.html") lines of index.html into $DEST"
