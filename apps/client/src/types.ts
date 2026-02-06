// Core types for the treasury subgraph API
// These types mirror the GraphQL schema in apps/server/src/graphql/schema.ts

export interface Health {
  status: string;
  timestamp: string;
  version: string;
}

export interface ChainValues {
  Arbitrum: number;
  Ethereum: number;
  Fantom: number;
  Polygon: number;
  Base: number;
  Berachain: number;
}

export interface SupplyCategoryValues {
  BondsDeposits: number;
  BondsPreminted: number;
  BondsVestingDeposits: number;
  BondsVestingTokens: number;
  BoostedLiquidityVault: number;
  LendingMarkets: number;
  ProtocolOwnedLiquidity: number;
  MigrationOffset: number;
  TotalSupply: number;
  Treasury: number;
}

export interface TokenSupply {
  id: string;
  balance: number;
  block: number;
  blockchain: string;
  date: string;
  pool?: string | null;
  poolAddress?: string | null;
  source: string;
  sourceAddress: string;
  supplyBalance: number;
  timestamp: number;
  token: string;
  tokenAddress: string;
  type: string;
}

export interface TokenRecord {
  id: string;
  balance: number;
  block: number;
  blockchain: string;
  category: string;
  date: string;
  isBluechip: boolean;
  isLiquid: boolean;
  multiplier: number;
  rate: number;
  source: string;
  sourceAddress: string;
  timestamp: number;
  token: string;
  tokenAddress: string;
  value: number;
  valueExcludingOhm: number;
}

export interface ProtocolMetric {
  id: string;
  block: number;
  currentAPY: number;
  currentIndex: number;
  date: string;
  gOhmPrice: number;
  gOhmTotalSupply: number;
  nextDistributedOhm: number;
  nextEpochRebase: number;
  ohmPrice: number;
  ohmTotalSupply: number;
  sOhmCirculatingSupply: number;
  timestamp: number;
  totalValueLocked: number;
}

export interface ChainTokenSupplies {
  Arbitrum: TokenSupply[];
  Ethereum: TokenSupply[];
  Fantom: TokenSupply[];
  Polygon: TokenSupply[];
  Base: TokenSupply[];
  Berachain: TokenSupply[];
}

export interface ChainTokenRecords {
  Arbitrum: TokenRecord[];
  Ethereum: TokenRecord[];
  Fantom: TokenRecord[];
  Polygon: TokenRecord[];
  Base: TokenRecord[];
  Berachain: TokenRecord[];
}

export interface ResponseMetadata {
  chainsComplete: string[];
  chainsFailed: string[];
  timestamp: string;
}

export interface Metric {
  date: string;
  blocks: ChainValues;
  timestamps: ChainValues;
  ohmIndex: number;
  ohmApy: number;
  ohmTotalSupply: number;
  ohmTotalSupplyComponents: ChainValues;
  ohmCirculatingSupply: number;
  ohmCirculatingSupplyComponents: ChainValues;
  ohmFloatingSupply: number;
  ohmFloatingSupplyComponents: ChainValues;
  ohmBackedSupply: number;
  gOhmBackedSupply: number;
  ohmBackedSupplyComponents: ChainValues;
  ohmSupplyCategories: SupplyCategoryValues;
  ohmPrice: number;
  gOhmPrice: number;
  marketCap: number;
  sOhmCirculatingSupply: number;
  sOhmTotalValueLocked: number;
  treasuryMarketValue: number;
  treasuryMarketValueComponents: ChainValues;
  treasuryLiquidBacking: number;
  treasuryLiquidBackingComponents: ChainValues;
  treasuryLiquidBackingPerOhmFloating: number;
  treasuryLiquidBackingPerOhmBacked: number;
  treasuryLiquidBackingPerGOhmBacked: number;
  // Optional fields (only when includeRecords: true)
  ohmTotalSupplyRecords?: ChainTokenSupplies;
  ohmCirculatingSupplyRecords?: ChainTokenSupplies;
  ohmFloatingSupplyRecords?: ChainTokenSupplies;
  ohmBackedSupplyRecords?: ChainTokenSupplies;
  treasuryMarketValueRecords?: ChainTokenRecords;
  treasuryLiquidBackingRecords?: ChainTokenRecords;
  _meta: ResponseMetadata;
}

// Input parameter types
export interface IgnoreCacheInput {
  ignoreCache?: boolean;
}

export interface PaginatedMetricsInput {
  startDate: string;
  dateOffset?: number;
  crossChainDataComplete?: boolean;
  includeRecords?: boolean;
  ignoreCache?: boolean;
}

export interface PaginatedTokenRecordsInput {
  startDate: string;
  dateOffset?: number;
  crossChainDataComplete?: boolean;
  ignoreCache?: boolean;
}

export interface PaginatedTokenSuppliesInput {
  startDate: string;
  dateOffset?: number;
  crossChainDataComplete?: boolean;
  ignoreCache?: boolean;
}

export interface PaginatedProtocolMetricsInput {
  startDate: string;
  dateOffset?: number;
  ignoreCache?: boolean;
}

export interface AtBlockInput {
  arbitrumBlock: number;
  ethereumBlock: number;
  fantomBlock: number;
  polygonBlock: number;
  baseBlock: number;
  berachainBlock: number;
}

/**
 * Wundergraph-compatible response wrapper
 * Matches the response format from the old Wundergraph client
 */
export interface WundergraphResponse<T> {
  data: T;
  errors?: Array<{ message: string }>;
}

/**
 * Operations type mapping for type-safe queries
 * Maps operation names to their input and response types
 * Response is wrapped in { data: T } for Wundergraph compatibility
 */
export interface Operations {
  'health': { input?: never; response: { data: Health } };
  'latest/metrics': { input?: IgnoreCacheInput; response: { data: Metric } };
  'latest/tokenRecords': { input?: IgnoreCacheInput; response: { data: TokenRecord[] } };
  'latest/tokenSupplies': { input?: IgnoreCacheInput; response: { data: TokenSupply[] } };
  'latest/protocolMetrics': { input?: IgnoreCacheInput; response: { data: ProtocolMetric[] } };
  'earliest/metrics': { input?: IgnoreCacheInput; response: { data: Metric } };
  'earliest/tokenRecords': { input?: IgnoreCacheInput; response: { data: TokenRecord[] } };
  'earliest/tokenSupplies': { input?: IgnoreCacheInput; response: { data: TokenSupply[] } };
  'earliest/protocolMetrics': { input?: IgnoreCacheInput; response: { data: ProtocolMetric[] } };
  'paginated/metrics': { input: PaginatedMetricsInput; response: { data: Metric[] } };
  'paginated/tokenRecords': { input: PaginatedTokenRecordsInput; response: { data: TokenRecord[] } };
  'paginated/tokenSupplies': { input: PaginatedTokenSuppliesInput; response: { data: TokenSupply[] } };
  'paginated/protocolMetrics': { input: PaginatedProtocolMetricsInput; response: { data: ProtocolMetric[] } };
  'atBlock/metrics': { input: AtBlockInput; response: { data: Metric } };
  'atBlock/tokenRecords': { input: AtBlockInput; response: { data: TokenRecord[] } };
  'atBlock/tokenSupplies': { input: AtBlockInput; response: { data: TokenSupply[] } };
  'atBlock/internal/protocolMetrics': { input: AtBlockInput; response: { data: ProtocolMetric[] } };
}

/**
 * Queries type maps operation names to their response types
 * This is useful for type inference and React Query integration
 * Responses are wrapped in { data: T } for Wundergraph compatibility
 *
 * Example usage:
 * type MetricsResponse = Queries['latest/metrics']; // { data: Metric }
 * type RecordsResponse = Queries['latest/tokenRecords']; // { data: TokenRecord[] }
 */
export type Queries = {
  [K in keyof Operations]: Operations[K]['response'];
};
