# Treasury Subgraph Client - Agent Context

## Project Overview

`apps/client` is the published TypeScript client for the treasury API. It intentionally preserves the old WunderGraph-style consumer interface while using native `fetch` under the hood.

## Package Rules

- Use the repo-root `pnpm@10.33.0` toolchain.
- Build from the repo root when possible so Turbo respects workspace ordering.
- The client depends on `@olympusdao/treasury-subgraph` with `workspace:*` so server types and operation mappings stay aligned.

## Release Flow

1. Set `WG_PUBLIC_NODE_URL` in `.env.prod` to the production treasury API URL.
2. Update `apps/client/package.json` with the intended version.
3. Update the changelog with `pnpm changelog` from the root or `pnpm changelog` inside `apps/client`.
4. Run `pnpm build:release` from the root.
5. Change to `apps/client` and publish with `pnpm publish --access public`.

## Compatibility Notes

- Keep response values wrapped in `{ data: ... }` unless the downstream consumers are migrated.
- Keep support for `wg_variables` query encoding and operation names used by the Olympus frontend.
- Do not remove the runtime `baseUrl` override; it is used for local frontend testing and staged API validation.
