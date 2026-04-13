---
name: build
description: Build TypeScript code for client and server packages. Use this when the user asks to build, compile, or run a build.
---

# Build

This skill builds the TypeScript code for the treasury-subgraph monorepo.

## Usage

Run this skill when:
- User asks to "build", "compile", or "run build"
- Before deploying
- After making TypeScript changes
- To verify the code compiles successfully

## Build Commands

### All Packages (Root Level)

```bash
# Build all packages
pnpm build
```

### Server Package

```bash
cd apps/server && pnpm build
```

Builds the Apollo Server GraphQL API:
- Runs `tsc` (TypeScript compiler)
- Outputs JavaScript files to `dist/` directory
- Generates declaration files (`.d.ts`) and source maps

### Client Package

```bash
cd apps/client && pnpm build
```

Builds the TypeScript client library:
- Uses `tsup` for fast bundling
- Outputs CommonJS (`client.js`) and ES Module (`client.mjs`) formats
- Generates type definitions (`client.d.ts`)
- Creates source maps

## Output Locations

- `apps/server/dist/` - Server JavaScript output
- `apps/client/dist/` - Client library bundle

## Next Steps After Build

- **Server**: Run locally with `pnpm start` or `node dist/index.js`
- **Client**: Import from `dist/` or publish to npm
