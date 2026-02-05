# Changelog

## [v2.0.0] - 2026-02-04

### Major Migration: WunderGraph → Apollo Server

Complete rewrite after WunderGraph was discontinued. API compatibility maintained.

**Architecture**
- Removed WunderGraph, implemented Apollo Server with Express.js
- New GraphQL schema and resolvers
- REST API endpoints as drop-in replacement
- Ported all business logic to new `src/core/` structure

**Resilience**
- Failure caching (5-min TTL) for failed subgraphs
- Graceful degradation with partial data returns
- Promise.allSettled to isolate chain failures
- Retry logic with permanent error detection

**Caching**
- LRU cache with `ignoreCache` bypass option

**GraphQL Features**
- `includeRecords` support for per-chain token data
- `atBlock` resolvers for all metric types

**Pagination**
- Latest block per day filtering
- `crossChainDataComplete` filtering
- Descending sort, fixed startDate semantics
- Exclusive end date prevents duplicates

**Infrastructure**
- Node.js 20+ required
- Pulumi dependencies updated
- Fixed Cloud Run configuration

## [v1.4.0]

- Amend treasury market value to include in market value calculations the value of OHM (and variants) in protocol buyback addresses
