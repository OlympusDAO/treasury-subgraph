FROM docker.io/node:24-alpine

WORKDIR /app

### Install Dependencies ###

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

COPY package.json /app/package.json
COPY pnpm-workspace.yaml /app/pnpm-workspace.yaml
COPY pnpm-lock.yaml /app/pnpm-lock.yaml
COPY .npmrc /app/.npmrc
COPY apps/server/package.json /app/apps/server/package.json
RUN pnpm install --frozen-lockfile --filter @olympusdao/treasury-subgraph

### Build ###

# Copy source code
COPY apps/server/tsconfig.json /app/apps/server/
COPY apps/server/src /app/apps/server/src

# Build TypeScript
RUN pnpm --filter @olympusdao/treasury-subgraph build

### Runtime Hardening ###

# Reduce noise from prebundled package-manager tooling and patch libc/openssl.
RUN apk add --no-cache --upgrade libcrypto3 libssl3 openssl zlib \
  && rm -rf \
    /root/.cache/node/corepack \
    /root/.npm \
    /usr/local/lib/node_modules/corepack \
    /usr/local/lib/node_modules/npm \
    /usr/local/bin/corepack \
    /usr/local/bin/corepack-pnpm \
    /usr/local/bin/npm \
    /usr/local/bin/npx \
    /tmp/* \
    /usr/local/share/.cache \
    /var/cache/apk/*

### Server Setup ###

USER node

# Expose the GraphQL API
EXPOSE 9991

# Set default environment variables
ENV PORT=9991
ENV NODE_ENV=production

# Start the server
CMD ["node", "apps/server/dist/index.js"]
