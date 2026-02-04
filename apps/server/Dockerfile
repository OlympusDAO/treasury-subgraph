FROM docker.io/node:20-alpine

WORKDIR /app

### Install Dependencies ###

COPY package.json /app/
COPY tmp/yarn.lock /app/yarn.lock
RUN yarn install --frozen-lockfile --non-interactive --prefer-offline --no-audit

### Build ###

# Copy source code
COPY tsconfig.json /app/
COPY src /app/src

# Build TypeScript
RUN yarn build

### Server Setup ###

# Expose the GraphQL API
EXPOSE 9991

# Set default environment variables
ENV PORT=9991
ENV NODE_ENV=production

# Start the server
CMD ["node", "dist/index.js"]
