FROM docker.io/node:20-alpine

WORKDIR /app

### Install Dependencies ###

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

COPY package.json /app/
COPY tmp/pnpm-lock.yaml /app/pnpm-lock.yaml
RUN pnpm install --frozen-lockfile --prefer-offline --no-fund

### Build ###

# Copy source code
COPY tsconfig.json /app/
COPY src /app/src

# Build TypeScript
RUN pnpm build

### Server Setup ###

# Expose the GraphQL API
EXPOSE 9991

# Set default environment variables
ENV PORT=9991
ENV NODE_ENV=production

# Start the server
CMD ["node", "dist/index.js"]
