import { GraphQLClient, RequestDocument } from 'graphql-request';
import { Logger } from '../core/types';

// Subgraph configuration
const SUBGRAPH_API_KEY = process.env.ARBITRUM_SUBGRAPH_API_KEY || '';
const SUBGRAPH_BASE_URL = 'https://gateway-arbitrum.network.thegraph.com/api';

const resolveSubgraphUrl = (url: string): string => {
  if (!SUBGRAPH_API_KEY) {
    throw new Error('ARBITRUM_SUBGRAPH_API_KEY is not set');
  }
  return url.replace('[api-key]', SUBGRAPH_API_KEY);
};

export const SUBGRAPH_URLS: Record<string, string> = {
  ethereum: resolveSubgraphUrl(`${SUBGRAPH_BASE_URL}/[api-key]/subgraphs/id/7jeChfyUTWRyp2JxPGuuzxvGt3fDKMkC9rLjm7sfLcNp`),
  arbitrum: resolveSubgraphUrl(`${SUBGRAPH_BASE_URL}/[api-key]/deployments/id/QmNQfMN2GjnGYx2mGo92gAc7z47fMbTMRR9M1gGEUjLZHX`),
  fantom: resolveSubgraphUrl(`${SUBGRAPH_BASE_URL}/[api-key]/deployments/id/QmNUJtrE5Hiwj5eBeF5gSubY2vhuMdjaZnZsaq6vVY2aba`),
  polygon: resolveSubgraphUrl(`${SUBGRAPH_BASE_URL}/[api-key]/deployments/id/QmdDUpqEzfKug1ER6HWM8c7U6wf3wtEtRBvXV7LkVoBi9f`),
  base: resolveSubgraphUrl(`${SUBGRAPH_BASE_URL}/[api-key]/deployments/id/QmWj7CDe7VivLqX49g6nXjni8w3XFokY5Pwiau78xyox9p`),
  berachain: resolveSubgraphUrl(`${SUBGRAPH_BASE_URL}/[api-key]/subgraphs/id/5KjntDTvo4DumbAkXdkrzNBdta2NujCc73TRYwgTdVun`),
};

export type Chain = 'ethereum' | 'arbitrum' | 'fantom' | 'polygon' | 'base' | 'berachain';

// GraphQL Client cache (reused across requests)
const clients = new Map<Chain, GraphQLClient>();

function getClient(chain: Chain): GraphQLClient {
  if (!clients.has(chain)) {
    const url = SUBGRAPH_URLS[chain];
    if (!url) {
      throw new Error(`Unknown chain: ${chain}`);
    }
    clients.set(
      chain,
      new GraphQLClient(url, {
        headers: {
          'User-Agent': 'treasury-subgraph/2.0.0',
        },
        // Use fetch timeout via AbortController instead (graphql-request doesn't support timeout directly)
      })
    );
  }
  return clients.get(chain)!;
}

// Failure cache to avoid retrying permanently failed subgraphs
interface FailedSubgraph {
  timestamp: number;
  error: string;
}
const failureCache = new Map<Chain, FailedSubgraph>();
const FAILURE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Errors that indicate permanent failures (no point in retrying)
const PERMANENT_ERROR_PATTERNS = [
  'subgraph not found',
  'no allocations',
  'subgraph deployment not found',
  'invalid subgraph name',
];

function isPermanentError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return PERMANENT_ERROR_PATTERNS.some(pattern => message.includes(pattern));
  }
  return false;
}

// Clear expired entries from failure cache
function clearExpiredFailures() {
  const now = Date.now();
  for (const [chain, entry] of failureCache.entries()) {
    if (now - entry.timestamp > FAILURE_CACHE_TTL) {
      failureCache.delete(chain);
    }
  }
}

// Retry configuration
interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
}

const defaultRetryOptions: Required<RetryOptions> = {
  maxRetries: 1,
  initialDelay: 500, // 500ms
  maxDelay: 5000, // 5 seconds
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute a GraphQL query with retry logic and exponential backoff
 */
export async function querySubgraph<T>(
  chain: Chain,
  query: RequestDocument,
  variables?: Record<string, unknown>,
  options: RetryOptions = {},
  logger?: Logger
): Promise<T> {
  // Check if this subgraph recently failed permanently
  clearExpiredFailures();
  const cachedFailure = failureCache.get(chain);
  if (cachedFailure) {
    const ageSeconds = Math.round((Date.now() - cachedFailure.timestamp) / 1000);
    logger?.warn(
      `querySubgraph (${chain}): Skipping - failed ${ageSeconds}s ago with: ${cachedFailure.error}`
    );
    throw new Error(
      `Subgraph ${chain} is temporarily disabled due to recent failures: ${cachedFailure.error}`
    );
  }

  const opts = { ...defaultRetryOptions, ...options };
  const client = getClient(chain);
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      const data = await client.request<T>(query, variables);
      return data;
    } catch (error) {
      lastError = error as Error;

      // Check for permanent errors - fail fast and cache
      if (isPermanentError(error)) {
        const failureEntry: FailedSubgraph = {
          timestamp: Date.now(),
          error: error instanceof Error ? error.message : String(error),
        };
        failureCache.set(chain, failureEntry);
        logger?.error(
          `querySubgraph (${chain}): Permanent error, caching failure for ${FAILURE_CACHE_TTL / 1000}min`,
          failureEntry.error
        );
        throw error;
      }

      // Don't retry on certain errors
      if (error instanceof Error) {
        // Validation errors shouldn't be retried
        if (error.message.includes('GraphQL') && error.message.includes('Variable')) {
          throw error;
        }
      }

      // If this isn't the last attempt, wait and retry
      if (attempt < opts.maxRetries) {
        const backoffDelay = Math.min(
          opts.initialDelay * Math.pow(2, attempt),
          opts.maxDelay
        );
        logger?.warn(
          `querySubgraph (${chain}): Attempt ${attempt + 1} failed, retrying in ${backoffDelay}ms`,
          error instanceof Error ? error.message : String(error)
        );
        await delay(backoffDelay);
      }
    }
  }

  logger?.error(
    `querySubgraph (${chain}): All ${opts.maxRetries + 1} attempts failed`,
    lastError?.message || String(lastError)
  );
  throw lastError || new Error(`querySubgraph (${chain}): Unknown error`);
}

/**
 * Query multiple subgraphs in parallel, using Promise.allSettled for resilience
 */
export async function querySubgraphsParallel<T>(
  chains: Chain[],
  query: RequestDocument,
  variables?: Record<string, unknown>,
  logger?: Logger
): Promise<Map<Chain, T>> {
  const results = await Promise.allSettled(
    chains.map((chain) => querySubgraph<T>(chain, query, variables, {}, logger))
  );

  const resultMap = new Map<Chain, T>();
  const successfulChains: string[] = [];
  const failedChains: string[] = [];

  results.forEach((result, index) => {
    const chain = chains[index];
    if (result.status === 'fulfilled') {
      resultMap.set(chain, result.value);
      successfulChains.push(chain);
    } else {
      failedChains.push(chain);
      logger?.warn(
        `querySubgraphsParallel: ${chain} failed`,
        result.reason?.message || String(result.reason)
      );
    }
  });

  if (failedChains.length > 0) {
    logger?.warn(
      `querySubgraphsParallel: ${failedChains.length} chains failed: ${failedChains.join(', ')}`
    );
  }

  return resultMap;
}

/**
 * Query all subgraphs in parallel
 */
export async function queryAllSubgraphs<T>(
  query: RequestDocument,
  variables?: Record<string, unknown>,
  logger?: Logger
): Promise<{
  results: Map<Chain, T>;
  successfulChains: Chain[];
  failedChains: Chain[];
}> {
  const chains: Chain[] = ['ethereum', 'arbitrum', 'fantom', 'polygon', 'base', 'berachain'];
  const results = await Promise.allSettled(
    chains.map((chain) => querySubgraph<T>(chain, query, variables, {}, logger))
  );

  const resultMap = new Map<Chain, T>();
  const successfulChains: Chain[] = [];
  const failedChains: Chain[] = [];

  results.forEach((result, index) => {
    const chain = chains[index];
    if (result.status === 'fulfilled') {
      resultMap.set(chain, result.value);
      successfulChains.push(chain);
    } else {
      failedChains.push(chain);
    }
  });

  return { results: resultMap, successfulChains, failedChains };
}

/**
 * Query all subgraphs in parallel with per-chain variables.
 * Use this when each chain needs different variable values (e.g., different block numbers).
 */
export async function queryAllSubgraphsWithPerChainVariables<T>(
  query: RequestDocument,
  getVariablesForChain: (chain: Chain) => Record<string, unknown>,
  logger?: Logger
): Promise<{
  results: Map<Chain, T>;
  successfulChains: Chain[];
  failedChains: Chain[];
}> {
  const chains: Chain[] = ['ethereum', 'arbitrum', 'fantom', 'polygon', 'base', 'berachain'];
  const results = await Promise.allSettled(
    chains.map((chain) => {
      const variables = getVariablesForChain(chain);
      return querySubgraph<T>(chain, query, variables, {}, logger);
    })
  );

  const resultMap = new Map<Chain, T>();
  const successfulChains: Chain[] = [];
  const failedChains: Chain[] = [];

  results.forEach((result, index) => {
    const chain = chains[index];
    if (result.status === 'fulfilled') {
      resultMap.set(chain, result.value);
      successfulChains.push(chain);
    } else {
      failedChains.push(chain);
    }
  });

  return { results: resultMap, successfulChains, failedChains };
}
