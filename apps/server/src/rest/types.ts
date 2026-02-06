/**
 * Query parameter interfaces for REST endpoints
 */

/**
 * Common query parameters with optional ignoreCache
 */
export interface BaseQueryParams {
  ignoreCache?: boolean;
}

/**
 * Query parameters for atBlock endpoints
 */
export interface AtBlockQueryParams {
  arbitrumBlock: number;
  ethereumBlock: number;
  fantomBlock: number;
  polygonBlock: number;
  baseBlock: number;
  berachainBlock: number;
}

/**
 * Query parameters for paginated endpoints (metrics)
 */
export interface PaginatedMetricsQueryParams {
  startDate: string;
  dateOffset?: number;
  crossChainDataComplete?: boolean;
  includeRecords?: boolean;
  ignoreCache?: boolean;
}

/**
 * Query parameters for paginated endpoints (records/supplies)
 */
export interface PaginatedQueryParams {
  startDate: string;
  dateOffset?: number;
  crossChainDataComplete?: boolean;
  ignoreCache?: boolean;
}

/**
 * Query parameters for paginated protocol metrics
 */
export interface PaginatedProtocolMetricsQueryParams {
  startDate: string;
  dateOffset?: number;
  ignoreCache?: boolean;
}

/**
 * Wundergraph-style response format
 */
export interface WundergraphResponse<T> {
  data: T;
  errors?: Array<{
    message: string;
    path?: string[];
    extensions?: Record<string, unknown>;
  }>;
}

/**
 * Parsed wg_variables from query string
 */
export type ParsedVariables =
  | BaseQueryParams
  | AtBlockQueryParams
  | PaginatedMetricsQueryParams
  | PaginatedQueryParams
  | PaginatedProtocolMetricsQueryParams;
