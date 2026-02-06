---
name: validate
description: Run full validation including lint check, typecheck, build, and pulumi preview. Use this when the user asks to validate, check everything, or run validation.
---

# Validate

This skill runs the full validation suite for the treasury-subgraph project.

## Usage

Run this skill when:
- User asks to "validate", "check everything", or "run validation"
- Before deploying infrastructure
- Before creating a pull request
- After making significant changes

## Validation Steps

```bash
# Step 1: Lint check
yarn lint:check

# Step 2: Build all packages (includes typecheck via prebuild)
yarn build

# Step 3: Pulumi preview (dev stack)
cd apps/server && pulumi preview --stack dev
```

## What It Does

1. **Lint check** - Runs Biome linter to check code quality and formatting
2. **Build** - Compiles TypeScript for all packages (typecheck runs automatically via prebuild hook)
3. **Pulumi preview** - Shows infrastructure changes for the dev stack

## Notes

- Lint check will fail if there are any code quality or formatting issues
- Typecheck runs automatically before build via the prebuild hook
- Pulumi preview requires `pulumi` to be installed and authenticated
- The dev stack is used by default; use `pulumi stack select <stack>` to change
