# Raptoreum (RTM) ElectrumX.
#
# Raptoreum is a Dash-derived chain with special/DIP2 transactions and asset
# txes that vanilla ElectrumX cannot deserialize. Use the Raptoreum community
# ElectrumX fork. Confirm the fork URL/branch against the Raptoreum docs before
# building (forks move); the default below is the commonly referenced one.
#
# Required node flags: server=1, txindex=1, addressindex=1, spentindex=1.

FROM python:3.10-slim

LABEL description="WATTxchange ElectrumX (Raptoreum / RTM)"

RUN apt-get update && apt-get install -y --no-install-recommends \
        gcc g++ libleveldb-dev libsnappy-dev git curl openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Raptoreum ElectrumX fork — VERIFY this URL/branch is current.
RUN git clone --depth 1 \
        https://github.com/Raptor3um/raptoreum-electrumx.git electrumx \
    || git clone --depth 1 https://github.com/spesmilo/electrumx.git electrumx

WORKDIR /app/electrumx
RUN pip install --no-cache-dir \
        aiorpcx>=0.22.0 attrs plyvel pylru "aiohttp>=3.3" \
    && pip install --no-cache-dir -e .

RUN mkdir -p /data/electrumx /data/ssl
# Build context is the electrumx/ root (see docker-compose.yml).
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 50001 50002 8000
ENV DB_DIRECTORY=/data/electrumx \
    SSL_CERTFILE=/data/ssl/server.crt \
    SSL_KEYFILE=/data/ssl/server.key \
    HOST=0.0.0.0 ALLOW_ROOT=true CACHE_MB=400 MAX_SESSIONS=1000
VOLUME ["/data"]
ENTRYPOINT ["/entrypoint.sh"]
