---
name: typecheck
description: Run TypeScript type checking on the server codebase. Use this when the user asks to check types, validate types, or run typecheck.
---

# TypeScript Type Check

This skill runs TypeScript type checking on the treasury-subgraph server codebase.

## Usage

Run this skill when:
- User asks to "check types", "typecheck", or "validate types"
- After making TypeScript changes
- Before committing code
- When investigating type errors

## Command

```bash
cd apps/server && npx tsc --noEmit
```

## What It Does

- Checks all TypeScript files for type errors
- Does not emit JavaScript files (`--noEmit`)
- Reports any type mismatches, missing imports, or other type issues

## Common Issues

If you see errors about:
- **Module not found**: Check imports and tsconfig paths
- **Property does not exist**: Check type definitions and imports
- **graphql version conflicts**: Known issue with `typeDefs` - we use `as any` cast
