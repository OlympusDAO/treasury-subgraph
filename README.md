# OlympusDAO Treasury Subgraph

## Purpose

This repository provides the treasury API and client package used by OlympusDAO applications. The API aggregates treasury subgraph data across chains, computes protocol and treasury metrics, and serves the results through GraphQL plus legacy-compatible REST operation endpoints.

## Architecture

The workspace contains two applications:

- `apps/server`
  - Apollo Server with Express.
  - GraphQL schema and resolvers for latest, earliest, paginated, and block-specific treasury data.
  - REST compatibility routes that preserve the legacy WunderGraph operation shape at `/operations/*`.
  - Subgraph clients for Ethereum, Arbitrum, Fantom, Polygon, Base, and Berachain.
  - Shared metric helpers for OHM supply, treasury market value, liquid backing, APY, prices, TVL, and related protocol metrics.
  - Dockerfile and Pulumi program for Google Cloud Run deployment.
- `apps/client`
  - TypeScript client for consuming the API.
  - Published as [`@olympusdao/treasury-subgraph-client`](https://www.npmjs.com/package/@olympusdao/treasury-subgraph-client).
  - Keeps the old WunderGraph-style `createClient().query({ operationName, input })` interface for downstream compatibility.

The API server is hosted on Google Cloud Run, with Firebase Hosting providing the stable public URL. The service uses The Graph gateway, keyed by `ARBITRUM_SUBGRAPH_API_KEY`, to query configured subgraph deployments.

## Package Manager

Use `pnpm@10.33.0`.

The root and server `package.json` files pin `packageManager` to `pnpm@10.33.0` and use `engines` to mark `npm`, `yarn`, and `bun` as `use-pnpm`. The root `preinstall` script also runs `only-allow pnpm`.

Shared pnpm policy lives in `pnpm-workspace.yaml`, including:

- `engineStrict: true`
- `preferFrozenLockfile: true`
- `strictDepBuilds: true`
- `blockExoticSubdeps: true`
- approved build dependencies
- dependency overrides
- `nodeLinker: hoisted`

The hoisted linker is intentional. Pulumi and Docker deployment paths may fail with `.pnpm/...` closure-loading or export-path errors if this is changed.

## Setup

1. Enable the pinned pnpm version with Corepack if needed:

   ```bash
   corepack enable
   corepack prepare pnpm@10.33.0 --activate
   ```

2. Install dependencies from the repo root:

   ```bash
   pnpm install
   ```

3. Copy `.env.sample` to `.env` and set required values.

The main required variables are:

- `ARBITRUM_SUBGRAPH_API_KEY` for server queries against The Graph gateway.
- `WG_PUBLIC_NODE_URL` for client builds, because the default API URL is baked into the published client package.

## Development

Run commands from the repo root unless noted otherwise.

```bash
pnpm lint:check
WG_PUBLIC_NODE_URL=http://localhost:9991 pnpm build
pnpm test:local
pnpm server:start
```

`pnpm server:start` starts the compiled server from `apps/server` with `.env` loaded and listens on port `9991` by default.

To run the server directly during development:

```bash
cd apps/server
pnpm dev
```

To test the Olympus frontend against a local API endpoint:

```bash
VITE_WG_PUBLIC_NODE_URL=http://localhost:9991 pnpm start
```

## Server Deployment

Server infrastructure is managed by Pulumi in `apps/server` and deploys to Google Cloud Run. The Pulumi program also builds and tags Docker images, configures Cloud Run, wires Firebase Hosting rewrites, and manages monitoring resources.

Validate before deploying:

```bash
pnpm lint:check
WG_PUBLIC_NODE_URL=<api-url> pnpm build
pnpm test:local
```

Deploy:

```bash
cd apps/server
pulumi login
pulumi stack select <dev|prod>
pulumi preview --stack <dev|prod>
pulumi up --stack <dev|prod>
```

Review the preview before applying. Do not run `pulumi up --yes` or other non-interactive approval flags for this repo.

The deployment requires the Pulumi stack configuration to include `ARBITRUM_SUBGRAPH_API_KEY` and the GCP/Firebase settings referenced by `apps/server/pulumi.ts`.

## Client Package Release

1. Set the production API URL in `.env.prod` with `WG_PUBLIC_NODE_URL`.
2. Update the version in `apps/client/package.json`.
3. Update the changelog:

   ```bash
   pnpm changelog
   ```

4. Build the release from the repo root:

   ```bash
   pnpm build:release
   ```

5. Publish from the client directory:

   ```bash
   cd apps/client
   pnpm publish --access public
   ```

You must be a member of the `@olympusdao` npm organization to publish the client package.

## Wishlist / TODO

- When testing or developing new subgraph versions, it would be useful to provide a URL parameter with the subgraph deployment ID and have the TypeScript operation use that deployment ID instead of the configured data source.
