# AGENTS.md

## Project Overview

This repository is the treasury API and data layer that aggregates subgraph data into a GraphQL service for protocol and dashboard consumption.

The current server is an Apollo Server/Express application deployed to Google Cloud Run with Pulumi. It preserves the legacy WunderGraph-compatible REST operation surface for existing consumers while also exposing GraphQL directly.

## Workspace Rules

- Use `pnpm@10.33.0`. The root and server `package.json` files pin `packageManager` to this version and mark `npm`, `yarn`, and `bun` as `use-pnpm` through `engines`.
- Keep shared pnpm policy in `pnpm-workspace.yaml`; this includes `engineStrict`, `preferFrozenLockfile`, the hoisted node linker, build dependency approvals, and overrides.
- Run workspace commands from the repo root unless an app-specific instruction says otherwise.
- Do not replace the hoisted linker casually. Pulumi and Docker deployment paths depend on the install layout being compatible with closure loading.

## System Layout

- `apps/server` contains the Apollo Server, REST compatibility routes, subgraph clients, metric computation helpers, tests, Dockerfile, and Pulumi program for Cloud Run.
- `apps/client` contains the published TypeScript client package used by downstream frontend consumers.
- `packages/*` is reserved for shared workspace packages.

See `apps/client/AGENTS.md` and `apps/server/AGENTS.md` for app-specific guidance.

## Deployment Notes

Server deployments are Pulumi-managed from `apps/server`.

1. Validate from the repo root with `pnpm lint:check`, `WG_PUBLIC_NODE_URL=<api-url> pnpm build`, and the relevant tests.
2. Change to `apps/server`.
3. Authenticate with Pulumi and select the intended stack, usually `dev` or `prod`.
4. Run `pulumi preview --stack <dev|prod>` and review the Cloud Run, Docker image, IAM, Firebase Hosting, and alerting changes.
5. Run `pulumi up --stack <dev|prod>` only after reviewing the preview. Do not use non-interactive approval flags.

Client package releases are built from the root with `.env.prod` loaded by `pnpm build:release`, then published from `apps/client` with `pnpm publish --access public`. Client builds require `WG_PUBLIC_NODE_URL` because the default API URL is baked into the package.
