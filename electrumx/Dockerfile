# WATTxchange ElectrumX — generic image for legacy Bitcoin-derived coins
# (TROLL, HTH, and other standard UTXO chains).
#
# Uses the spesmilo ElectrumX server and appends the WATTxchange custom coin
# classes (custom_coins.py) into electrumx/lib/coins.py so `COIN=Trollcoin`
# or `COIN=HelpTheHomeless` selects them.
#
# RTM (Raptoreum) and GHOST (Particl-fork) are NOT built from this image —
# they require coin-specific ElectrumX forks. See ./rtm/ and ./ghost/.

FROM python:3.10-slim

LABEL maintainer="WATTxchange <dev@wattxchange.app>"
LABEL description="WATTxchange ElectrumX (TROLL/HTH/legacy UTXO)"

RUN apt-get update && apt-get install -y --no-install-recommends \
        gcc g++ libleveldb-dev libsnappy-dev git curl openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Pin a known-good ElectrumX release.
RUN git clone --depth 1 --branch 1.16.0 \
        https://github.com/spesmilo/electrumx.git electrumx

WORKDIR /app/electrumx

RUN pip install --no-cache-dir \
        aiorpcx>=0.22.0 attrs plyvel pylru "aiohttp>=3.3" \
    && pip install --no-cache-dir -e .

# Register the WATTxchange custom coins by appending them to coins.py.
COPY custom_coins.py /tmp/custom_coins.py
RUN tail -n +1 /tmp/custom_coins.py \
    | sed '/^from electrumx/d; /^import electrumx/d' \
    >> electrumx/lib/coins.py

RUN mkdir -p /data/electrumx /data/ssl

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 50001 50002 8000

ENV DB_DIRECTORY=/data/electrumx \
    SERVICES=tcp://:50001,ssl://:50002,rpc://:8000 \
    SSL_CERTFILE=/data/ssl/server.crt \
    SSL_KEYFILE=/data/ssl/server.key \
    HOST=0.0.0.0 \
    ALLOW_ROOT=true \
    CACHE_MB=400 \
    MAX_SESSIONS=1000

VOLUME ["/data"]
ENTRYPOINT ["/entrypoint.sh"]
