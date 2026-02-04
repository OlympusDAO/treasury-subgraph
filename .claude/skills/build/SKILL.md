---
name: build
description: Build the TypeScript server code. Use this when the user asks to build, compile, or run a build.
---

# Build Server

This skill builds the TypeScript server code into JavaScript.

## Usage

Run this skill when:
- User asks to "build", "compile", or "run build"
- Before deploying
- After making TypeScript changes
- To verify the code compiles successfully

## Command

```bash
cd apps/server && yarn build
```

## What It Does

1. Runs `tsc` (TypeScript compiler)
2. Outputs JavaScript files to `dist/` directory
3. Generates declaration files (`.d.ts`)
4. Creates source maps for debugging

## Output Location

Built files are placed in:
- `apps/server/dist/` - JavaScript output

## Next Steps After Build

- Run the server: `yarn start` or `node dist/index.js`
- Deploy to Cloud Run
- Run tests: `yarn test`
