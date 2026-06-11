"""
custom_coins.py — WATTxchange custom ElectrumX coin classes.

Appended to electrumx/lib/coins.py at image-build time (see Dockerfile). Each
class registers a coin with ElectrumX so `COIN=<NAME>` selects it. mm2/kdf then
talks Electrum protocol to these servers to run trustless atomic swaps.

Address bytes and genesis hashes below were taken directly from each coin's
chainparams.cpp on the WATTxchange build machine:

  TROLL  pubtype 66  p2sh 5   wif 153   (TrollCoin-2.0/src/chainparams.cpp)
         genesis 000001faef25dec4fbcf906e6242621df2c183bf232f263d0ba5b101911e4563
  HTH    pubtype 100 p2sh 40  wif 228   (helpthehomelesscoin/src/chainparams.cpp)
         genesis 37540c3c757bb77e42c168d8197447b6aba38c2d1ec0ddf59d2e774c41953093

Both are legacy (pre-SegWit) Bitcoin-derived chains; block hashes are SHA256d
(scrypt/x-algo only affects PoW, which ElectrumX does not validate), so the
default header hashing and deserializer apply.
"""

from electrumx.lib.coins import Coin
import electrumx.lib.tx as lib_tx


class Trollcoin(Coin):
    NAME = "Trollcoin"
    SHORTNAME = "TROLL"
    NET = "mainnet"
    P2PKH_VERBYTE = bytes.fromhex("42")        # 66
    P2SH_VERBYTES = [bytes.fromhex("05")]      # 5
    WIF_BYTE = bytes.fromhex("99")             # 153
    GENESIS_HASH = ('000001faef25dec4fbcf906e6242621d'
                    'f2c183bf232f263d0ba5b101911e4563')
    DESERIALIZER = lib_tx.Deserializer
    TX_COUNT = 1_000_000
    TX_COUNT_HEIGHT = 500_000
    TX_PER_BLOCK = 2
    RPC_PORT = 9666
    REORG_LIMIT = 800


class HelpTheHomeless(Coin):
    NAME = "HelpTheHomeless"
    SHORTNAME = "HTH"
    NET = "mainnet"
    P2PKH_VERBYTE = bytes.fromhex("64")        # 100
    P2SH_VERBYTES = [bytes.fromhex("28")]      # 40
    WIF_BYTE = bytes.fromhex("e4")             # 228
    GENESIS_HASH = ('37540c3c757bb77e42c168d8197447b6'
                    'aba38c2d1ec0ddf59d2e774c41953093')
    DESERIALIZER = lib_tx.Deserializer
    TX_COUNT = 1_000_000
    TX_COUNT_HEIGHT = 500_000
    TX_PER_BLOCK = 2
    RPC_PORT = 13777
    REORG_LIMIT = 1000
    # NOTE: HTH runs masternodes (Dash-style). If `getrawtransaction` returns
    # special/DIP2 transactions that fail to parse, switch DESERIALIZER to
    # electrumx.lib.tx_dash.DeserializerDash and set BASIC_HEADER_SIZE as Dash.


# FLOP (Flopcoin) is Dogecoin-derived. Address bytes are UNVERIFIED here —
# confirm with derive-params.sh against the live node before enabling, then
# uncomment and fill. Flopcoin already has an ElectrumX at
# flop-electrum.wattxchange.app, so this class is a fallback only.
#
# class Flopcoin(Coin):
#     NAME = "Flopcoin"
#     SHORTNAME = "FLOP"
#     NET = "mainnet"
#     P2PKH_VERBYTE = bytes.fromhex("23")      # 35  (VERIFY)
#     P2SH_VERBYTES = [bytes.fromhex("05")]    # 5   (VERIFY)
#     WIF_BYTE = bytes.fromhex("b0")           # 176 (VERIFY)
#     GENESIS_HASH = '<run derive-params.sh: getblockhash 0>'
#     DESERIALIZER = lib_tx.Deserializer
#     RPC_PORT = 32552
