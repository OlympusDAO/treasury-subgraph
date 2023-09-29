FROM docker.io/node:18-alpine

WORKDIR /app

### Install Dependencies ###

COPY package.json /app/
COPY tmp/yarn.lock /app/yarn.lock
# We place the binary in /usr/bin/wunderctl so we can find it without a relative path
ENV CI=true WG_COPY_BIN_PATH=/usr/bin/wunderctl
RUN yarn install --frozen-lockfile --non-interactive --prefer-offline --no-audit

### Build Wundergraph ###

# Copy the .wundergraph folder to the image
COPY .wundergraph ./.wundergraph

# Listen to all interfaces, 127.0.0.1 might produce errors with ipv6 dual stack
ENV WG_NODE_URL=http://127.0.0.1:9991 WG_NODE_INTERNAL_URL=http://127.0.0.1:9993 WG_NODE_HOST=0.0.0.0 WG_NODE_PORT=9991 WG_NODE_INTERNAL_PORT=9993 WG_SERVER_URL=http://127.0.0.1:9992 WG_SERVER_HOST=127.0.0.1 WG_SERVER_PORT=9992
ARG ARBITRUM_SUBGRAPH_API_KEY
ARG UPSTASH_REDIS_URL
ARG UPSTASH_REDIS_TOKEN
RUN ARBITRUM_SUBGRAPH_API_KEY=$ARBITRUM_SUBGRAPH_API_KEY UPSTASH_REDIS_URL=$UPSTASH_REDIS_URL UPSTASH_REDIS_TOKEN=$UPSTASH_REDIS_TOKEN wunderctl generate --wundergraph-dir=.wundergraph

### Server Setup ###

# Expose only the node, server is private
EXPOSE 9991
CMD wunderctl start --wundergraph-dir=.wundergraph
