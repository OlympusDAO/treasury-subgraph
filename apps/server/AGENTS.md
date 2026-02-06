# Treasury Subgraph - Agent Context

## Project Overview

The Treasury Subgraph is a GraphQL API that aggregates and computes treasury metrics for OlympusDAO across multiple blockchain networks. It serves as the data source for the treasury dashboard and other applications.

## Current Architecture (v2.0)

After migrating from WunderGraph (discontinued) to Apollo Server, the system now:

1. **Queries 6 blockchain subgraphs** in parallel: Ethereum, Arbitrum, Fantom, Polygon, Base, Berachain
2. **Computes aggregated metrics**: OHM supply, treasury market value, liquid backing, APY, prices, etc.
3. **Serves data via GraphQL API** on port 9991

### Key Design Decisions

- **Resilience over completeness**: Uses `Promise.allSettled` so a single failing subgraph doesn't break the entire API
- **Graceful degradation**: Returns partial data with metadata about which chains succeeded/failed
- **LRU caching**: 5-minute TTL for latest metrics, 1-hour for historical data
- **Retry logic**: 3 retries with exponential backoff for subgraph queries

## Project Structure

```
apps/server/
├── src/
│   ├── index.ts              # Apollo Server entry point
│   ├── graphql/
│   │   ├── schema.ts         # GraphQL type definitions
│   │   ├── resolvers.ts      # Query handlers
│   │   └── types.ts          # Extended types for GraphQL
│   ├── core/
│   │   ├── metricHelper.ts   # Core metric computation logic (reused)
│   │   ├── constants.ts      # Chain names, token addresses
│   │   ├── tokenRecordHelper.ts
│   │   ├── tokenSupplyHelper.ts
│   │   ├── protocolMetricHelper.ts
│   │   ├── dateHelper.ts
│   │   ├── numberHelper.ts
│   │   └── types.ts         # Core type definitions
│   ├── subgraph/
│   │   ├── client.ts        # graphql-request wrapper with retry
│   │   ├── queries.ts       # GraphQL queries for subgraphs
│   │   └── index.ts
│   └── cache/
│       └── cacheManager.ts  # LRU cache implementation
├── .wundergraph/            # Legacy WunderGraph files (keep for reference)
├── tests/                   # Jest test suite
├── pulumi.ts               # Infrastructure as Code (Cloud Run deployment)
├── Dockerfile              # Container build
└── package.json
```

## GraphQL Operations

### Latest Data
- `latestMetrics` - Latest aggregated Metric object
- `latestTokenRecords` - Latest token records from all chains
- `latestTokenSupplies` - Latest token supplies
- `latestProtocolMetrics` - Latest protocol metrics

### Earliest Data
- `earliestMetrics` - Earliest available Metric
- `earliestTokenRecords` - Earliest token records
- `earliestTokenSupplies` - Earliest token supplies
- `earliestProtocolMetrics` - Earliest protocol metrics

### Historical Data (Paginated)
- `paginatedMetrics` - Time-series metrics with pagination
- `paginatedTokenRecords` - Historical token records
- `paginatedTokenSupplies` - Historical token supplies
- `paginatedProtocolMetrics` - Historical protocol metrics

### At Specific Block
- `atBlockMetrics` - Metrics at specific block numbers per chain

### Health
- `health` - Health check endpoint

## Response Metadata

All Metric responses include a `_meta` field:
```typescript
{
  _meta: {
    chainsComplete: ["Ethereum", "Arbitrum", ...],  // Successful chains
    chainsFailed: ["Polygon"],                       // Failed chains (if any)
    timestamp: "2026-02-04T12:00:00Z"
  }
}
```

## Key Types

### Metric
Main aggregated metric object containing:
- Supply metrics (OHM total/circulating/floating/backed, gOHM backed)
- Treasury metrics (market value, liquid backing, per-chain breakdowns)
- Protocol metrics (price, APY, index, market cap, TVL)
- Block numbers and timestamps per chain

### TokenRecord
Individual treasury token holdings with value, category, liquidity info.

### TokenSupply
Token supply breakdowns by category (Treasury, Liquidity, Bonds, etc.).

### ProtocolMetric
On-chain protocol metrics (APY, rebase, supplies).

## Environment Variables

- `ARBITRUM_SUBGRAPH_API_KEY` - API key for The Graph gateway (required)
- `PORT` - Server port (default: 9991)
- `NODE_ENV` - Environment (production/development)
- `DEBUG` - Enable debug logging (optional)

## Deployment

- **Platform**: Google Cloud Run
- **Container**: Docker (Node.js 18 Alpine)
- **Region**: us-central1
- **Infrastructure**: Pulumi (IaC in `pulumi.ts`)

## Development

```bash
# Install dependencies
yarn install

# Build TypeScript
yarn build

# Run in development
yarn dev

# Run tests
yarn test

# Type check
npx tsc --noEmit
```

## Important Notes for Agents

1. **The `.wundergraph/` directory is legacy** - New code goes in `src/`
2. **Helper files in `src/core/` were copied from `.wundergraph/`** - They contain critical business logic
3. **GraphQL version conflict** - We use `typeDefs as any` cast due to graphql version mismatch in workspace
4. **Polygon subgraph is currently failing** - This was the original issue that prompted the rewrite
5. **Paginated queries are not yet implemented** - They return empty arrays (marked with TODO)
6. **Client package must be maintained** - The `apps/client/` package is used by other repositories and must remain API-compatible
7. **ALWAYS obtain approval before making commits** - Do not use git commit commands without explicit user approval. Ask the user before committing any changes.

## Common Tasks

### Adding a new chain
1. Add chain to `Chain` type in `src/subgraph/client.ts`
2. Add to `SUBGRAPH_URLS` map
3. Add to `CHAIN_NAMES` mapping
4. Add to `constants.ts` for chain identifiers
5. Update GraphQL schema `ChainValues` type

### Modifying metric computation
- Edit `src/core/metricHelper.ts` - contains `getMetricObject()` function
- This is ported from the original WunderGraph implementation

### Adding a new GraphQL query
1. Add query to `src/graphql/schema.ts`
2. Add resolver to `src/graphql/resolvers.ts`
3. Add subgraph queries to `src/subgraph/queries.ts` if needed
