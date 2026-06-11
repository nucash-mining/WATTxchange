#!/usr/bin/env bash
#
# derive-params.sh — Read a coin's address bytes + genesis hash straight from
# its running full node, so ElectrumX coin classes and the mm2 coins config use
# the chain's *actual* parameters instead of guesses.
#
# Usage:
#   ./derive-params.sh <rpcuser> <rpcpass> <host> <rpcport>
# Example:
#   ./derive-params.sh rtmrpc s3cret 127.0.0.1 9998
#
# Requires: curl, python3. The node must be running with an unlocked wallet
# (for the WIF byte). Prints pubtype / p2shtype / wiftype (decimal) + genesis.

set -euo pipefail

USER="${1:?rpcuser}"; PASS="${2:?rpcpass}"; HOST="${3:?host}"; PORT="${4:?rpcport}"
URL="http://${HOST}:${PORT}/"

rpc() {
  local method="$1"; shift
  local params="${1:-[]}"
  curl -s --user "${USER}:${PASS}" \
    --data-binary "{\"jsonrpc\":\"1.0\",\"id\":\"d\",\"method\":\"${method}\",\"params\":${params}}" \
    -H 'content-type: text/plain;' "${URL}"
}

jget() { python3 -c "import sys,json;print(json.load(sys.stdin).get('result',''))"; }

# Base58Check decode → first version byte (decimal).
verbyte() {
  python3 - "$1" <<'PY'
import sys
s=sys.argv[1]
A="123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
n=0
for c in s: n=n*58+A.index(c)
b=n.to_bytes((n.bit_length()+7)//8,'big')
# leading '1's are leading zero bytes
pad=len(s)-len(s.lstrip('1'))
b=b"\x00"*pad+b
print(b[0])   # version byte
PY
}

echo "== Querying ${HOST}:${PORT} =="

GENESIS=$(rpc getblockhash "[0]" | jget)
echo "GENESIS_HASH = ${GENESIS}"

ADDR=$(rpc getnewaddress | jget)
if [ -n "${ADDR}" ]; then
  echo "P2PKH sample = ${ADDR}  -> pubtype = $(verbyte "${ADDR}")"
  PUBKEY=$(rpc getaddressinfo "[\"${ADDR}\"]" | python3 -c "import sys,json;print(json.load(sys.stdin).get('result',{}).get('pubkey',''))" || true)
  if [ -n "${PUBKEY}" ]; then
    P2SH=$(rpc createmultisig "[1,[\"${PUBKEY}\"]]" | python3 -c "import sys,json;print(json.load(sys.stdin).get('result',{}).get('address',''))" || true)
    [ -n "${P2SH}" ] && echo "P2SH  sample = ${P2SH}  -> p2shtype = $(verbyte "${P2SH}")"
  fi
  WIF=$(rpc dumpprivkey "[\"${ADDR}\"]" | jget || true)
  [ -n "${WIF}" ] && echo "WIF   sample = (hidden)  -> wiftype = $(verbyte "${WIF}")"
fi

echo "Done. Plug these into electrumx/custom_coins.py and src/config/mm2Coins.ts."
