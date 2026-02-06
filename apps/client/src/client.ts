import type { Operations, Queries, WundergraphResponse } from './types';
export type { Operations, Queries, WundergraphResponse };

export interface ClientConfig {
  /**
   * Base URL of the treasury subgraph API
   * If not provided, uses the value baked in at build time (via WG_PUBLIC_NODE_URL env var)
   */
  baseUrl?: string;
  /**
   * Custom headers to include in requests
   */
  headers?: Record<string, string>;
  /**
   * Request timeout in milliseconds
   * @default 30000
   */
  timeout?: number;
}

// This value is replaced at build time via define in tsup.config
// Build with: WG_PUBLIC_NODE_URL=https://api.treasury.olympusdao.com yarn build:release
declare const __DEFAULT_BASE_URL__: string;

const DEFAULT_BASE_URL = typeof __DEFAULT_BASE_URL__ !== 'undefined'
  ? __DEFAULT_BASE_URL__
  : 'http://localhost:9991';  // Fallback for local development

const DEFAULT_TIMEOUT = 30000;

/**
 * Main client class for querying the treasury subgraph API
 */
export class TreasurySubgraphClient {
  private baseUrl: string;
  private headers: Record<string, string>;
  private timeout: number;

  constructor(config: ClientConfig = {}) {
    this.baseUrl = config.baseUrl || DEFAULT_BASE_URL;
    this.headers = {
      'Content-Type': 'application/json',
      'User-Agent': '@olympusdao/treasury-subgraph-client',
      ...config.headers,
    };
    this.timeout = config.timeout || DEFAULT_TIMEOUT;
  }

  /**
   * Query the API using an operation name and optional input parameters
   * This matches the Wundergraph client interface
   */
  async query<OperationName extends keyof Operations>(
    params: {
      operationName: OperationName;
      input?: Operations[OperationName]['input'];
    }
  ): Promise<Operations[OperationName]['response']> {
    const { operationName, input } = params;
    const path = getOperationPath(operationName);
    return this.get<Operations[OperationName]['response']>(path, input as Record<string, unknown> | undefined);
  }

  /**
   * Internal method to make GET requests to REST endpoints
   */
  private async get<T>(path: string, input?: Record<string, unknown>): Promise<T> {
    const url = new URL(path, this.baseUrl);

    // Add wg_variables query parameter (Wundergraph compatibility)
    if (input && Object.keys(input).length > 0) {
      url.searchParams.set('wg_variables', JSON.stringify(input));
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: this.headers,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Server returns { data: T, errors?: [...] } format
      // Return as-is for Wundergraph compatibility
      return await response.json() as T;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * Factory function to create a client instance
 * This is the main export consumers use
 */
export function createClient(config?: ClientConfig): TreasurySubgraphClient {
  return new TreasurySubgraphClient(config);
}

/**
 * Map operation names to their REST endpoint paths
 */
function getOperationPath(operationName: string): string {
  const pathMap: Record<string, string> = {
    'health': '/health',
    'latest/metrics': '/operations/latest/metrics',
    'latest/tokenRecords': '/operations/latest/tokenRecords',
    'latest/tokenSupplies': '/operations/latest/tokenSupplies',
    'latest/protocolMetrics': '/operations/latest/protocolMetrics',
    'earliest/metrics': '/operations/earliest/metrics',
    'earliest/tokenRecords': '/operations/earliest/tokenRecords',
    'earliest/tokenSupplies': '/operations/earliest/tokenSupplies',
    'earliest/protocolMetrics': '/operations/earliest/protocolMetrics',
    'paginated/metrics': '/operations/paginated/metrics',
    'paginated/tokenRecords': '/operations/paginated/tokenRecords',
    'paginated/tokenSupplies': '/operations/paginated/tokenSupplies',
    'paginated/protocolMetrics': '/operations/paginated/protocolMetrics',
    'atBlock/metrics': '/operations/atBlock/metrics',
    'atBlock/tokenRecords': '/operations/atBlock/tokenRecords',
    'atBlock/tokenSupplies': '/operations/atBlock/tokenSupplies',
    'atBlock/internal/protocolMetrics': '/operations/atBlock/internal/protocolMetrics',
  };

  return pathMap[operationName] || `/operations/${operationName}`;
}
