# Changelog

## [v2.0.2] - 2026-02-06

### Security & CI Improvements

- Update dependencies to resolve moderate/high vulnerabilities
- Improve security audit CI workflow:
  - Configure audit to only fail on moderate+ severity vulnerabilities
  - Add critical severity check to audit workflow
  - Use yarn audit exit code mask for proper severity filtering
  - Initialize EXIT_CODE to properly handle successful audits
  - Fix regex pattern for vulnerability parsing
  - Allow audit display output to pass with set -e safety

## [v2.0.1]

- Update apollo-server-express from ^3.12.1 to ^3.13.0
- Update cors from ^2.8.5 to ^2.8.6
- Update express from ^4.18.2 to ^4.21.2
- Update graphql from ^16.8.0 to ^16.12.0
- Update graphql-request from ^6.1.0 to ^7.4.0
- Update lru-cache from ^10.0.0 to ^11.0.2
- Update @types/node from ^18.16.7 to ^20.19.0
- Update typescript from ^5.0.4 to ^5.3.3
- Update jest from ^29.5.0 to ^29.7.0
- Update @types/jest from ^29.5.1 to ^29.5.12
- Update ts-jest from ^29.1.0 to ^29.1.2
- Update ts-node from ^10.9.1 to ^10.9.2
- Downgrade @pulumi/gcp from ^9.11.0 to ^6.67.0 (currently installed: ^6.67.0)
- Update syncpack from ^9.8.6 to ^13.0.4
- Fix security vulnerabilities in syncpack dependencies (zod, semver)
- Add resolution for @babel/runtime to fix date-fns indirect vulnerability
- Add CI workflow for automated security auditing
- Update CI to Node.js 20.x and GitHub Actions v4

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
