import { CacheManager, getGlobalCache } from "../cache/cacheManager";
import {
  getISO8601DateString,
  getNextEndDate,
  getNextStartDate,
  getOffsetDays,
} from "../core/dateHelper";
import { getMetricObject } from "../core/metricHelper";
import {
  filterLatestBlockByDay as filterProtocolMetricsByDay,
  type ProtocolMetric,
} from "../core/protocolMetricHelper";
import {
  filterCompleteRecords as filterCompleteTokenRecords,
  filterLatestBlockByDay as filterTokenRecordsByDay,
  type TokenRecord,
} from "../core/tokenRecordHelper";
import {
  filterCompleteRecords as filterCompleteTokenSupplies,
  filterLatestBlockByDay as filterTokenSuppliesByDay,
  type TokenSupply,
} from "../core/tokenSupplyHelper";
import {
  ConsoleLogger,
  type ProtocolMetricsResponse,
  type TokenRecordsResponse,
  type TokenSuppliesResponse,
} from "../core/types";
import {
  type Chain,
  PROTOCOL_METRICS_AT_BLOCK,
  PROTOCOL_METRICS_DATE_RANGE,
  PROTOCOL_METRICS_EARLIEST,
  PROTOCOL_METRICS_LATEST,
  queryAllSubgraphs,
  queryAllSubgraphsWithPerChainVariables,
  TOKEN_RECORDS_AT_BLOCK,
  TOKEN_RECORDS_DATE_RANGE,
  TOKEN_RECORDS_EARLIEST,
  TOKEN_RECORDS_LATEST,
  TOKEN_SUPPLIES_AT_BLOCK,
  TOKEN_SUPPLIES_DATE_RANGE,
  TOKEN_SUPPLIES_EARLIEST,
  TOKEN_SUPPLIES_LATEST,
} from "../subgraph";
import { addMetricMeta, type MetricWithMeta } from "./types";

// Chain name mapping
const CHAIN_NAMES: Record<Chain, string> = {
  ethereum: "Ethereum",
  arbitrum: "Arbitrum",
  fantom: "Fantom",
  polygon: "Polygon",
  base: "Base",
  berachain: "Berachain",
};

// Response types for single-chain queries
interface SingleChainTokenRecordsResponse {
  tokenRecords: TokenRecord[];
}

interface SingleChainTokenSuppliesResponse {
  tokenSupplies: TokenSupply[];
}

interface SingleChainProtocolMetricsResponse {
  protocolMetrics: ProtocolMetric[];
}

// Create logger
const logger = new ConsoleLogger("resolvers");

// Helper function to convert null/undefined to empty arrays
function normalizeArray<T>(arr: T[] | null | undefined): T[] {
  return arr || [];
}

/**
 * Convert Map<Chain, SingleChainTokenRecordsResponse> to TokenRecordsResponse
 */
function mapToTokenRecordsResponse(
  map: Map<Chain, SingleChainTokenRecordsResponse>
): TokenRecordsResponse {
  return {
    treasuryArbitrum_tokenRecords: normalizeArray(map.get("arbitrum")?.tokenRecords),
    treasuryEthereum_tokenRecords: normalizeArray(map.get("ethereum")?.tokenRecords),
    treasuryFantom_tokenRecords: normalizeArray(map.get("fantom")?.tokenRecords),
    treasuryPolygon_tokenRecords: normalizeArray(map.get("polygon")?.tokenRecords),
    treasuryBase_tokenRecords: normalizeArray(map.get("base")?.tokenRecords),
    treasuryBerachain_tokenRecords: normalizeArray(map.get("berachain")?.tokenRecords),
  };
}

/**
 * Convert Map<Chain, SingleChainTokenSuppliesResponse> to TokenSuppliesResponse
 */
function mapToTokenSuppliesResponse(
  map: Map<Chain, SingleChainTokenSuppliesResponse>
): TokenSuppliesResponse {
  return {
    treasuryArbitrum_tokenSupplies: normalizeArray(map.get("arbitrum")?.tokenSupplies),
    treasuryEthereum_tokenSupplies: normalizeArray(map.get("ethereum")?.tokenSupplies),
    treasuryFantom_tokenSupplies: normalizeArray(map.get("fantom")?.tokenSupplies),
    treasuryPolygon_tokenSupplies: normalizeArray(map.get("polygon")?.tokenSupplies),
    treasuryBase_tokenSupplies: normalizeArray(map.get("base")?.tokenSupplies),
    treasuryBerachain_tokenSupplies: normalizeArray(map.get("berachain")?.tokenSupplies),
  };
}

/**
 * Convert TokenRecordsResponse back to flat array with blockchain property
 */
function _responseToTokenRecordsArray(response: TokenRecordsResponse): TokenRecord[] {
  const records: TokenRecord[] = [];
  const chainMapping: Array<{ key: keyof TokenRecordsResponse; name: string }> = [
    { key: "treasuryArbitrum_tokenRecords", name: "Arbitrum" },
    { key: "treasuryEthereum_tokenRecords", name: "Ethereum" },
    { key: "treasuryFantom_tokenRecords", name: "Fantom" },
    { key: "treasuryPolygon_tokenRecords", name: "Polygon" },
    { key: "treasuryBase_tokenRecords", name: "Base" },
    { key: "treasuryBerachain_tokenRecords", name: "Berachain" },
  ];
  for (const { key, name } of chainMapping) {
    for (const record of response[key]) {
      records.push({ ...record, blockchain: name });
    }
  }
  return records;
}

/**
 * Convert TokenSuppliesResponse back to flat array with blockchain property
 */
function _responseToTokenSuppliesArray(response: TokenSuppliesResponse): TokenSupply[] {
  const supplies: TokenSupply[] = [];
  const chainMapping: Array<{ key: keyof TokenSuppliesResponse; name: string }> = [
    { key: "treasuryArbitrum_tokenSupplies", name: "Arbitrum" },
    { key: "treasuryEthereum_tokenSupplies", name: "Ethereum" },
    { key: "treasuryFantom_tokenSupplies", name: "Fantom" },
    { key: "treasuryPolygon_tokenSupplies", name: "Polygon" },
    { key: "treasuryBase_tokenSupplies", name: "Base" },
    { key: "treasuryBerachain_tokenSupplies", name: "Berachain" },
  ];
  for (const { key, name } of chainMapping) {
    for (const supply of response[key]) {
      supplies.push({ ...supply, blockchain: name });
    }
  }
  return supplies;
}

/**
 * Convert Map<Chain, SingleChainProtocolMetricsResponse> to ProtocolMetricsResponse
 */
function mapToProtocolMetricsResponse(
  map: Map<Chain, SingleChainProtocolMetricsResponse>
): ProtocolMetricsResponse {
  return {
    treasuryArbitrum_protocolMetrics: normalizeArray(map.get("arbitrum")?.protocolMetrics),
    treasuryEthereum_protocolMetrics: normalizeArray(map.get("ethereum")?.protocolMetrics),
    treasuryFantom_protocolMetrics: normalizeArray(map.get("fantom")?.protocolMetrics),
    treasuryPolygon_protocolMetrics: normalizeArray(map.get("polygon")?.protocolMetrics),
    treasuryBase_protocolMetrics: normalizeArray(map.get("base")?.protocolMetrics),
    treasuryBerachain_protocolMetrics: normalizeArray(map.get("berachain")?.protocolMetrics),
  };
}

// Resolvers
export const resolvers = {
  Query: {
    // Health check
    health: () => ({
      status: "ok",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "2.0.0",
    }),

    // ============ LATEST QUERIES ============

    async latestMetrics(_parent: unknown, args: { ignoreCache?: boolean }) {
      const cache = getGlobalCache();
      const cacheKey = CacheManager.generateKey("latestMetrics");

      const cached = (await cache.get(cacheKey, {
        bypassCache: args.ignoreCache,
      })) as MetricWithMeta | null;
      if (cached) {
        return cached;
      }

      // Get latest block numbers from tokenRecords
      const blockResults = await queryAllSubgraphs<SingleChainTokenRecordsResponse>(
        TOKEN_RECORDS_LATEST,
        {},
        logger
      );

      // Extract block numbers
      const blocks: Record<string, number> = {};
      for (const [chain, data] of blockResults.results.entries()) {
        const record = data.tokenRecords?.[0];
        if (record) {
          blocks[chain] = Number(record.block);
        }
      }

      // If we don't have blocks from at least one chain, we can't proceed
      if (Object.keys(blocks).length === 0) {
        throw new Error("No subgraphs returned data");
      }

      // Fetch all data at the latest blocks
      const pageSize = 1000;
      const allTokenRecords =
        await queryAllSubgraphsWithPerChainVariables<SingleChainTokenRecordsResponse>(
          TOKEN_RECORDS_AT_BLOCK,
          (chain) => ({ block: blocks[chain], pageSize }),
          logger
        );

      const allTokenSupplies =
        await queryAllSubgraphsWithPerChainVariables<SingleChainTokenSuppliesResponse>(
          TOKEN_SUPPLIES_AT_BLOCK,
          (chain) => ({ block: blocks[chain], pageSize }),
          logger
        );

      const allProtocolMetrics =
        await queryAllSubgraphsWithPerChainVariables<SingleChainProtocolMetricsResponse>(
          PROTOCOL_METRICS_AT_BLOCK,
          (chain) => ({ block: blocks[chain], pageSize }),
          logger
        );

      // Combine all successful chains (union - chain is successful if any query succeeded)
      // This allows partial data returns when some subgraphs are unavailable
      const allSuccessfulChains = new Set([
        ...allTokenRecords.successfulChains,
        ...allTokenSupplies.successfulChains,
        ...allProtocolMetrics.successfulChains,
      ]);

      const allFailedChains = new Set([
        ...allTokenRecords.failedChains,
        ...allTokenSupplies.failedChains,
        ...allProtocolMetrics.failedChains,
      ]);

      // Flatten results and add blockchain property
      const tokenRecords = Array.from(allTokenRecords.results.entries()).flatMap(([chain, data]) =>
        normalizeArray(data.tokenRecords).map((r) => ({ ...r, blockchain: CHAIN_NAMES[chain] }))
      );

      const tokenSupplies = Array.from(allTokenSupplies.results.entries()).flatMap(
        ([chain, data]) =>
          normalizeArray(data.tokenSupplies).map((s) => ({ ...s, blockchain: CHAIN_NAMES[chain] }))
      );

      const protocolMetrics = Array.from(allProtocolMetrics.results.entries()).flatMap(
        ([chain, data]) =>
          normalizeArray(data.protocolMetrics).map((m) => ({
            ...m,
            blockchain: CHAIN_NAMES[chain],
          }))
      );

      // Compute metric object
      const metric = getMetricObject(logger, tokenRecords, tokenSupplies, protocolMetrics);

      // Add metadata
      const result = addMetricMeta(
        metric,
        Array.from(allSuccessfulChains).map((c) => CHAIN_NAMES[c]),
        Array.from(allFailedChains).map((c) => CHAIN_NAMES[c])
      );

      await cache.set(cacheKey, result, 300000); // 5 minute TTL for latest
      return result;
    },

    async latestTokenRecords(_parent: unknown, args: { ignoreCache?: boolean }) {
      // ignoreCache is accepted for API consistency but is ignored
      // (this resolver doesn't use caching - data is always fresh)
      logger.info(`latestTokenRecords called with: ignoreCache=${args.ignoreCache ?? false}`);
      const { results, successfulChains, failedChains } =
        await queryAllSubgraphs<SingleChainTokenRecordsResponse>(TOKEN_RECORDS_LATEST, {}, logger);

      const records = Array.from(results.entries()).flatMap(([chain, data]) =>
        normalizeArray(data.tokenRecords).map((r) => ({ ...r, blockchain: CHAIN_NAMES[chain] }))
      );
      return records.map((r) => ({
        ...r,
        _meta: {
          chainsComplete: successfulChains.map((c) => CHAIN_NAMES[c]),
          chainsFailed: failedChains.map((c) => CHAIN_NAMES[c]),
          timestamp: new Date().toISOString(),
        },
      }));
    },

    async latestTokenSupplies(_parent: unknown, args: { ignoreCache?: boolean }) {
      // ignoreCache is accepted for API consistency but is ignored
      // (this resolver doesn't use caching - data is always fresh)
      logger.info(`latestTokenSupplies called with: ignoreCache=${args.ignoreCache ?? false}`);
      const { results, successfulChains, failedChains } =
        await queryAllSubgraphs<SingleChainTokenSuppliesResponse>(
          TOKEN_SUPPLIES_LATEST,
          {},
          logger
        );

      const supplies = Array.from(results.entries()).flatMap(([chain, data]) =>
        normalizeArray(data.tokenSupplies).map((s) => ({ ...s, blockchain: CHAIN_NAMES[chain] }))
      );
      return supplies.map((s) => ({
        ...s,
        _meta: {
          chainsComplete: successfulChains.map((c) => CHAIN_NAMES[c]),
          chainsFailed: failedChains.map((c) => CHAIN_NAMES[c]),
          timestamp: new Date().toISOString(),
        },
      }));
    },

    async latestProtocolMetrics(_parent: unknown, args: { ignoreCache?: boolean }) {
      // ignoreCache is accepted for API consistency but is ignored
      // (this resolver doesn't use caching - data is always fresh)
      logger.info(`latestProtocolMetrics called with: ignoreCache=${args.ignoreCache ?? false}`);
      const { results, successfulChains, failedChains } =
        await queryAllSubgraphs<SingleChainProtocolMetricsResponse>(
          PROTOCOL_METRICS_LATEST,
          {},
          logger
        );

      const metrics = Array.from(results.entries()).flatMap(([chain, data]) =>
        normalizeArray(data.protocolMetrics).map((m) => ({ ...m, blockchain: CHAIN_NAMES[chain] }))
      );
      return metrics.map((m) => ({
        ...m,
        _meta: {
          chainsComplete: successfulChains.map((c) => CHAIN_NAMES[c]),
          chainsFailed: failedChains.map((c) => CHAIN_NAMES[c]),
          timestamp: new Date().toISOString(),
        },
      }));
    },

    // ============ LATEST RAW QUERIES (Wundergraph compatible) ============

    async latestTokenRecordsRaw(_parent: unknown, args: { ignoreCache?: boolean }) {
      logger.info(`latestTokenRecordsRaw called with: ignoreCache=${args.ignoreCache ?? false}`);
      const { results } = await queryAllSubgraphs<SingleChainTokenRecordsResponse>(
        TOKEN_RECORDS_LATEST,
        {},
        logger
      );
      return mapToTokenRecordsResponse(results);
    },

    async latestTokenSuppliesRaw(_parent: unknown, args: { ignoreCache?: boolean }) {
      logger.info(`latestTokenSuppliesRaw called with: ignoreCache=${args.ignoreCache ?? false}`);
      const { results } = await queryAllSubgraphs<SingleChainTokenSuppliesResponse>(
        TOKEN_SUPPLIES_LATEST,
        {},
        logger
      );
      return mapToTokenSuppliesResponse(results);
    },

    async latestProtocolMetricsRaw(_parent: unknown, args: { ignoreCache?: boolean }) {
      logger.info(`latestProtocolMetricsRaw called with: ignoreCache=${args.ignoreCache ?? false}`);
      const { results } = await queryAllSubgraphs<SingleChainProtocolMetricsResponse>(
        PROTOCOL_METRICS_LATEST,
        {},
        logger
      );
      return mapToProtocolMetricsResponse(results);
    },

    // ============ EARLIEST QUERIES ============

    async earliestMetrics(_parent: unknown, args: { ignoreCache?: boolean }) {
      const cache = getGlobalCache();
      const cacheKey = CacheManager.generateKey("earliestMetrics");

      const cached = (await cache.get(cacheKey, {
        bypassCache: args.ignoreCache,
      })) as MetricWithMeta | null;
      if (cached) {
        return cached;
      }

      // Get earliest block numbers
      const blockResults = await queryAllSubgraphs<SingleChainTokenRecordsResponse>(
        TOKEN_RECORDS_EARLIEST,
        {},
        logger
      );

      const blocks: Record<string, number> = {};
      for (const [chain, data] of blockResults.results.entries()) {
        const record = data.tokenRecords?.[0];
        if (record) {
          blocks[chain] = Number(record.block);
        }
      }

      if (Object.keys(blocks).length === 0) {
        throw new Error("No subgraphs returned data");
      }

      const pageSize = 1000;
      const allTokenRecords =
        await queryAllSubgraphsWithPerChainVariables<SingleChainTokenRecordsResponse>(
          TOKEN_RECORDS_AT_BLOCK,
          (chain) => ({ block: blocks[chain], pageSize }),
          logger
        );

      const allTokenSupplies =
        await queryAllSubgraphsWithPerChainVariables<SingleChainTokenSuppliesResponse>(
          TOKEN_SUPPLIES_AT_BLOCK,
          (chain) => ({ block: blocks[chain], pageSize }),
          logger
        );

      const allProtocolMetrics =
        await queryAllSubgraphsWithPerChainVariables<SingleChainProtocolMetricsResponse>(
          PROTOCOL_METRICS_AT_BLOCK,
          (chain) => ({ block: blocks[chain], pageSize }),
          logger
        );

      const allSuccessful = new Set([
        ...allTokenRecords.successfulChains,
        ...allTokenSupplies.successfulChains,
        ...allProtocolMetrics.successfulChains,
      ]);

      const allFailed = new Set([
        ...allTokenRecords.failedChains,
        ...allTokenSupplies.failedChains,
        ...allProtocolMetrics.failedChains,
      ]);

      // Flatten results and add blockchain property
      const tokenRecords = Array.from(allTokenRecords.results.entries()).flatMap(([chain, data]) =>
        normalizeArray(data.tokenRecords).map((r) => ({ ...r, blockchain: CHAIN_NAMES[chain] }))
      );

      const tokenSupplies = Array.from(allTokenSupplies.results.entries()).flatMap(
        ([chain, data]) =>
          normalizeArray(data.tokenSupplies).map((s) => ({ ...s, blockchain: CHAIN_NAMES[chain] }))
      );

      const protocolMetrics = Array.from(allProtocolMetrics.results.entries()).flatMap(
        ([chain, data]) =>
          normalizeArray(data.protocolMetrics).map((m) => ({
            ...m,
            blockchain: CHAIN_NAMES[chain],
          }))
      );

      const metric = getMetricObject(logger, tokenRecords, tokenSupplies, protocolMetrics);
      const result = addMetricMeta(
        metric,
        Array.from(allSuccessful).map((c) => CHAIN_NAMES[c]),
        Array.from(allFailed).map((c) => CHAIN_NAMES[c])
      );

      await cache.set(cacheKey, result, 3600000); // 1 hour TTL
      return result;
    },

    async earliestTokenRecords(_parent: unknown, args: { ignoreCache?: boolean }) {
      logger.info(`earliestTokenRecords called with: ignoreCache=${args.ignoreCache ?? false}`);
      // Note: ignoreCache is accepted for API compatibility but earliest queries don't use cache
      const { results } = await queryAllSubgraphs<SingleChainTokenRecordsResponse>(
        TOKEN_RECORDS_EARLIEST,
        {},
        logger
      );

      const records = Array.from(results.entries()).flatMap(([chain, data]) =>
        normalizeArray(data.tokenRecords).map((r) => ({ ...r, blockchain: CHAIN_NAMES[chain] }))
      );
      return records;
    },

    async earliestTokenSupplies(_parent: unknown, args: { ignoreCache?: boolean }) {
      logger.info(`earliestTokenSupplies called with: ignoreCache=${args.ignoreCache ?? false}`);
      // Note: ignoreCache is accepted for API compatibility but earliest queries don't use cache
      const { results } = await queryAllSubgraphs<SingleChainTokenSuppliesResponse>(
        TOKEN_SUPPLIES_EARLIEST,
        {},
        logger
      );

      const supplies = Array.from(results.entries()).flatMap(([chain, data]) =>
        normalizeArray(data.tokenSupplies).map((s) => ({ ...s, blockchain: CHAIN_NAMES[chain] }))
      );
      return supplies;
    },

    async earliestProtocolMetrics(_parent: unknown, args: { ignoreCache?: boolean }) {
      logger.info(`earliestProtocolMetrics called with: ignoreCache=${args.ignoreCache ?? false}`);
      // Note: ignoreCache is accepted for API compatibility but earliest queries don't use cache
      const { results } = await queryAllSubgraphs<SingleChainProtocolMetricsResponse>(
        PROTOCOL_METRICS_EARLIEST,
        {},
        logger
      );

      const metrics = Array.from(results.entries()).flatMap(([chain, data]) =>
        normalizeArray(data.protocolMetrics).map((m) => ({ ...m, blockchain: CHAIN_NAMES[chain] }))
      );
      return metrics;
    },

    // ============ EARLIEST RAW QUERIES (Wundergraph compatible) ============

    async earliestTokenRecordsRaw(_parent: unknown, args: { ignoreCache?: boolean }) {
      logger.info(`earliestTokenRecordsRaw called with: ignoreCache=${args.ignoreCache ?? false}`);
      const { results } = await queryAllSubgraphs<SingleChainTokenRecordsResponse>(
        TOKEN_RECORDS_EARLIEST,
        {},
        logger
      );
      return mapToTokenRecordsResponse(results);
    },

    async earliestTokenSuppliesRaw(_parent: unknown, args: { ignoreCache?: boolean }) {
      logger.info(`earliestTokenSuppliesRaw called with: ignoreCache=${args.ignoreCache ?? false}`);
      const { results } = await queryAllSubgraphs<SingleChainTokenSuppliesResponse>(
        TOKEN_SUPPLIES_EARLIEST,
        {},
        logger
      );
      return mapToTokenSuppliesResponse(results);
    },

    async earliestProtocolMetricsRaw(_parent: unknown, args: { ignoreCache?: boolean }) {
      logger.info(
        `earliestProtocolMetricsRaw called with: ignoreCache=${args.ignoreCache ?? false}`
      );
      const { results } = await queryAllSubgraphs<SingleChainProtocolMetricsResponse>(
        PROTOCOL_METRICS_EARLIEST,
        {},
        logger
      );
      return mapToProtocolMetricsResponse(results);
    },

    // ============ AT BLOCK QUERY ============

    async atBlockMetrics(
      _parent: unknown,
      args: {
        arbitrumBlock: number;
        ethereumBlock: number;
        fantomBlock: number;
        polygonBlock: number;
        baseBlock: number;
        berachainBlock: number;
      }
    ) {
      logger.info(
        `atBlockMetrics called with: arbitrumBlock=${args.arbitrumBlock}, ethereumBlock=${args.ethereumBlock}, fantomBlock=${args.fantomBlock}, polygonBlock=${args.polygonBlock}, baseBlock=${args.baseBlock}, berachainBlock=${args.berachainBlock}`
      );
      const cache = getGlobalCache();
      const cacheKey = CacheManager.generateKey("atBlockMetrics", args);

      const cached = (await cache.get(cacheKey)) as MetricWithMeta | null;
      if (cached) {
        return cached;
      }

      const blocks: Record<Chain, number> = {
        ethereum: args.ethereumBlock,
        arbitrum: args.arbitrumBlock,
        fantom: args.fantomBlock,
        polygon: args.polygonBlock,
        base: args.baseBlock,
        berachain: args.berachainBlock,
      };

      const pageSize = 1000;

      const allTokenRecords =
        await queryAllSubgraphsWithPerChainVariables<SingleChainTokenRecordsResponse>(
          TOKEN_RECORDS_AT_BLOCK,
          (chain) => ({ block: blocks[chain], pageSize }),
          logger
        );

      const allTokenSupplies =
        await queryAllSubgraphsWithPerChainVariables<SingleChainTokenSuppliesResponse>(
          TOKEN_SUPPLIES_AT_BLOCK,
          (chain) => ({ block: blocks[chain], pageSize }),
          logger
        );

      const allProtocolMetrics =
        await queryAllSubgraphsWithPerChainVariables<SingleChainProtocolMetricsResponse>(
          PROTOCOL_METRICS_AT_BLOCK,
          (chain) => ({ block: blocks[chain], pageSize }),
          logger
        );

      const allSuccessful = new Set([
        ...allTokenRecords.successfulChains,
        ...allTokenSupplies.successfulChains,
        ...allProtocolMetrics.successfulChains,
      ]);

      const allFailed = new Set([
        ...allTokenRecords.failedChains,
        ...allTokenSupplies.failedChains,
        ...allProtocolMetrics.failedChains,
      ]);

      // Flatten results and add blockchain property
      const tokenRecords = Array.from(allTokenRecords.results.entries()).flatMap(([chain, data]) =>
        normalizeArray(data.tokenRecords).map((r) => ({ ...r, blockchain: CHAIN_NAMES[chain] }))
      );

      const tokenSupplies = Array.from(allTokenSupplies.results.entries()).flatMap(
        ([chain, data]) =>
          normalizeArray(data.tokenSupplies).map((s) => ({ ...s, blockchain: CHAIN_NAMES[chain] }))
      );

      const protocolMetrics = Array.from(allProtocolMetrics.results.entries()).flatMap(
        ([chain, data]) =>
          normalizeArray(data.protocolMetrics).map((m) => ({
            ...m,
            blockchain: CHAIN_NAMES[chain],
          }))
      );

      const metric = getMetricObject(logger, tokenRecords, tokenSupplies, protocolMetrics);
      const result = addMetricMeta(
        metric,
        Array.from(allSuccessful).map((c) => CHAIN_NAMES[c]),
        Array.from(allFailed).map((c) => CHAIN_NAMES[c])
      );

      await cache.set(cacheKey, result, 3600000);
      return result;
    },

    async atBlockTokenRecords(
      _parent: unknown,
      args: {
        arbitrumBlock: number;
        ethereumBlock: number;
        fantomBlock: number;
        polygonBlock: number;
        baseBlock: number;
        berachainBlock: number;
      }
    ) {
      logger.info(
        `atBlockTokenRecords called with: arbitrumBlock=${args.arbitrumBlock}, ethereumBlock=${args.ethereumBlock}, fantomBlock=${args.fantomBlock}, polygonBlock=${args.polygonBlock}, baseBlock=${args.baseBlock}, berachainBlock=${args.berachainBlock}`
      );
      const blocks: Record<Chain, number> = {
        ethereum: args.ethereumBlock,
        arbitrum: args.arbitrumBlock,
        fantom: args.fantomBlock,
        polygon: args.polygonBlock,
        base: args.baseBlock,
        berachain: args.berachainBlock,
      };

      const pageSize = 1000;
      const results = await queryAllSubgraphsWithPerChainVariables<SingleChainTokenRecordsResponse>(
        TOKEN_RECORDS_AT_BLOCK,
        (chain) => ({ block: blocks[chain], pageSize }),
        logger
      );

      return Array.from(results.results.entries()).flatMap(([chain, data]) =>
        normalizeArray(data.tokenRecords).map((r) => ({ ...r, blockchain: CHAIN_NAMES[chain] }))
      );
    },

    async atBlockTokenSupplies(
      _parent: unknown,
      args: {
        arbitrumBlock: number;
        ethereumBlock: number;
        fantomBlock: number;
        polygonBlock: number;
        baseBlock: number;
        berachainBlock: number;
      }
    ) {
      logger.info(
        `atBlockTokenSupplies called with: arbitrumBlock=${args.arbitrumBlock}, ethereumBlock=${args.ethereumBlock}, fantomBlock=${args.fantomBlock}, polygonBlock=${args.polygonBlock}, baseBlock=${args.baseBlock}, berachainBlock=${args.berachainBlock}`
      );
      const blocks: Record<Chain, number> = {
        ethereum: args.ethereumBlock,
        arbitrum: args.arbitrumBlock,
        fantom: args.fantomBlock,
        polygon: args.polygonBlock,
        base: args.baseBlock,
        berachain: args.berachainBlock,
      };

      const pageSize = 1000;
      const results =
        await queryAllSubgraphsWithPerChainVariables<SingleChainTokenSuppliesResponse>(
          TOKEN_SUPPLIES_AT_BLOCK,
          (chain) => ({ block: blocks[chain], pageSize }),
          logger
        );

      return Array.from(results.results.entries()).flatMap(([chain, data]) =>
        normalizeArray(data.tokenSupplies).map((s) => ({ ...s, blockchain: CHAIN_NAMES[chain] }))
      );
    },

    async atBlockProtocolMetrics(
      _parent: unknown,
      args: {
        arbitrumBlock: number;
        ethereumBlock: number;
        fantomBlock: number;
        polygonBlock: number;
        baseBlock: number;
        berachainBlock: number;
      }
    ) {
      logger.info(
        `atBlockProtocolMetrics called with: arbitrumBlock=${args.arbitrumBlock}, ethereumBlock=${args.ethereumBlock}, fantomBlock=${args.fantomBlock}, polygonBlock=${args.polygonBlock}, baseBlock=${args.baseBlock}, berachainBlock=${args.berachainBlock}`
      );
      const blocks: Record<Chain, number> = {
        ethereum: args.ethereumBlock,
        arbitrum: args.arbitrumBlock,
        fantom: args.fantomBlock,
        polygon: args.polygonBlock,
        base: args.baseBlock,
        berachain: args.berachainBlock,
      };

      const pageSize = 1000;
      const results =
        await queryAllSubgraphsWithPerChainVariables<SingleChainProtocolMetricsResponse>(
          PROTOCOL_METRICS_AT_BLOCK,
          (chain) => ({ block: blocks[chain], pageSize }),
          logger
        );

      return Array.from(results.results.entries()).flatMap(([chain, data]) =>
        normalizeArray(data.protocolMetrics).map((m) => ({ ...m, blockchain: CHAIN_NAMES[chain] }))
      );
    },

    // ============ PAGINATED QUERIES ============

    async paginatedTokenRecords(
      _parent: unknown,
      args: {
        startDate: string;
        dateOffset?: number;
        crossChainDataComplete?: boolean;
        ignoreCache?: boolean;
      }
    ) {
      const {
        startDate,
        dateOffset = 4,
        crossChainDataComplete = false,
        ignoreCache = false,
      } = args;
      logger.info(
        `paginatedTokenRecords called with: startDate=${startDate}, dateOffset=${dateOffset}, crossChainDataComplete=${crossChainDataComplete}, ignoreCache=${ignoreCache}`
      );

      const finalStartDate = new Date(startDate);
      if (Number.isNaN(finalStartDate.getTime())) {
        throw new Error(`startDate should be in the YYYY-MM-DD format.`);
      }

      const earliestDateStr = getISO8601DateString(finalStartDate);
      const latestDateStr = getISO8601DateString(new Date()); // today, for cache key

      const cache = getGlobalCache();
      const cacheKey = CacheManager.generateKey("paginatedTokenRecords", {
        startDate: earliestDateStr,
        endDate: latestDateStr,
        crossChainDataComplete,
      });

      const cached = await cache.get(cacheKey, { bypassCache: args.ignoreCache });
      if (cached) {
        return cached as TokenRecord[];
      }

      const pageSize = 1000;
      const offsetDays = getOffsetDays(dateOffset);

      let currentStartDate: Date = getNextStartDate(offsetDays, finalStartDate, null);
      let currentEndDate: Date = getNextEndDate(null);
      let hasProcessedFirstDate = false;

      const allResults: SingleChainTokenRecordsResponse = {} as SingleChainTokenRecordsResponse;
      const successfulChainsSet = new Set<Chain>();
      const failedChainsSet = new Set<Chain>();

      while (currentStartDate.getTime() >= finalStartDate.getTime()) {
        currentStartDate = getNextStartDate(offsetDays, finalStartDate, currentEndDate);

        const startDateStr = getISO8601DateString(currentStartDate);
        const endDateStr = getISO8601DateString(currentEndDate);

        logger.info(`paginatedTokenRecords: Querying ${startDateStr} to ${endDateStr}`);

        const results =
          await queryAllSubgraphsWithPerChainVariables<SingleChainTokenRecordsResponse>(
            TOKEN_RECORDS_DATE_RANGE,
            () => ({ startDate: startDateStr, endDate: endDateStr, pageSize }),
            logger
          );

        logger.info(
          `paginatedTokenRecords: Got results from ${results.successfulChains.length} chains, failed: ${results.failedChains.join(", ")}`
        );

        for (const c of results.successfulChains) {
          successfulChainsSet.add(c);
        }
        for (const c of results.failedChains) {
          failedChainsSet.add(c);
        }

        // Merge results
        for (const [chain, data] of results.results.entries()) {
          const allResultsChain = allResults as unknown as Record<
            string,
            { tokenRecords?: TokenRecord[] }
          >;
          if (!allResultsChain[chain]) {
            allResultsChain[chain] = data;
          } else {
            allResultsChain[chain] = {
              tokenRecords: [
                ...(allResultsChain[chain]?.tokenRecords || []),
                ...(data.tokenRecords || []),
              ],
            };
          }
        }

        // Ensures that a finalStartDate close to the current date is handled correctly
        // There is probably a cleaner way to do this, but this works for now
        if (currentStartDate.getTime() === finalStartDate.getTime()) {
          logger.info(`paginatedTokenRecords: Reached final start date.`);
          break;
        }

        currentEndDate = currentStartDate;
      }

      // Convert Map to Response format
      let response = mapToTokenRecordsResponse(
        new Map(Object.entries(allResults).map(([k, v]) => [k as Chain, v]))
      );

      // Apply filterCompleteRecords only on first page if crossChainDataComplete is true
      if (crossChainDataComplete && !hasProcessedFirstDate) {
        logger.info(`paginatedTokenRecords: Applying crossChainDataComplete filter`);
        response = filterCompleteTokenRecords(response, logger);
        hasProcessedFirstDate = true;
      }

      // Log record counts per chain before filtering
      logger.info(
        `paginatedTokenRecords: Before filter - Arbitrum: ${response.treasuryArbitrum_tokenRecords.length}, Ethereum: ${response.treasuryEthereum_tokenRecords.length}, Fantom: ${response.treasuryFantom_tokenRecords.length}, Base: ${response.treasuryBase_tokenRecords.length}, Berachain: ${response.treasuryBerachain_tokenRecords.length}`
      );

      // Convert back to flat array, applying latest block filtering PER CHAIN first
      const allRecords: TokenRecord[] = [];
      for (const { key, name } of [
        { key: "treasuryArbitrum_tokenRecords", name: "Arbitrum" },
        { key: "treasuryEthereum_tokenRecords", name: "Ethereum" },
        { key: "treasuryFantom_tokenRecords", name: "Fantom" },
        { key: "treasuryPolygon_tokenRecords", name: "Polygon" },
        { key: "treasuryBase_tokenRecords", name: "Base" },
        { key: "treasuryBerachain_tokenRecords", name: "Berachain" },
      ] as const) {
        const chainRecords = filterTokenRecordsByDay(response[key]);
        logger.info(
          `paginatedTokenRecords: ${name} has ${chainRecords.length} records after filterLatestBlockByDay`
        );
        for (const record of chainRecords) {
          allRecords.push({ ...record, blockchain: name });
        }
      }

      logger.info(`paginatedTokenRecords: Total records after filtering: ${allRecords.length}`);

      // Sort by date descending (latest first)
      allRecords.sort((a, b) => b.date.localeCompare(a.date));

      await cache.set(cacheKey, allRecords, 300000); // 5 minute TTL
      return allRecords;
    },

    async paginatedTokenSupplies(
      _parent: unknown,
      args: {
        startDate: string;
        dateOffset?: number;
        crossChainDataComplete?: boolean;
        ignoreCache?: boolean;
      }
    ) {
      const {
        startDate,
        dateOffset = 4,
        crossChainDataComplete = false,
        ignoreCache = false,
      } = args;
      logger.info(
        `paginatedTokenSupplies called with: startDate=${startDate}, dateOffset=${dateOffset}, crossChainDataComplete=${crossChainDataComplete}, ignoreCache=${ignoreCache}`
      );

      const finalStartDate = new Date(startDate);
      if (Number.isNaN(finalStartDate.getTime())) {
        throw new Error(`startDate should be in the YYYY-MM-DD format.`);
      }

      const earliestDateStr = getISO8601DateString(finalStartDate);
      const latestDateStr = getISO8601DateString(new Date());

      const cache = getGlobalCache();
      const cacheKey = CacheManager.generateKey("paginatedTokenSupplies", {
        startDate: earliestDateStr,
        endDate: latestDateStr,
        crossChainDataComplete,
      });

      const cached = await cache.get(cacheKey, { bypassCache: args.ignoreCache });
      if (cached) {
        return cached as TokenSupply[];
      }

      const pageSize = 1000;
      const offsetDays = getOffsetDays(dateOffset);

      let currentStartDate: Date = getNextStartDate(offsetDays, finalStartDate, null);
      let currentEndDate: Date = getNextEndDate(null);
      let hasProcessedFirstDate = false;

      const allResults: SingleChainTokenSuppliesResponse = {} as SingleChainTokenSuppliesResponse;
      const successfulChainsSet = new Set<Chain>();
      const failedChainsSet = new Set<Chain>();

      while (currentStartDate.getTime() >= finalStartDate.getTime()) {
        currentStartDate = getNextStartDate(offsetDays, finalStartDate, currentEndDate);

        const startDateStr = getISO8601DateString(currentStartDate);
        const endDateStr = getISO8601DateString(currentEndDate);

        logger.info(`paginatedTokenSupplies: Querying ${startDateStr} to ${endDateStr}`);

        const results =
          await queryAllSubgraphsWithPerChainVariables<SingleChainTokenSuppliesResponse>(
            TOKEN_SUPPLIES_DATE_RANGE,
            () => ({ startDate: startDateStr, endDate: endDateStr, pageSize }),
            logger
          );

        logger.info(
          `paginatedTokenSupplies: Got results from ${results.successfulChains.length} chains, failed: ${results.failedChains.join(", ")}`
        );

        for (const c of results.successfulChains) {
          successfulChainsSet.add(c);
        }
        for (const c of results.failedChains) {
          failedChainsSet.add(c);
        }

        // Merge results
        for (const [chain, data] of results.results.entries()) {
          const allResultsChain = allResults as unknown as Record<
            string,
            { tokenSupplies?: TokenSupply[] }
          >;
          if (!allResultsChain[chain]) {
            allResultsChain[chain] = data;
          } else {
            allResultsChain[chain] = {
              tokenSupplies: [
                ...(allResultsChain[chain]?.tokenSupplies || []),
                ...(data.tokenSupplies || []),
              ],
            };
          }
        }

        // Ensures that a finalStartDate close to the current date is handled correctly
        if (currentStartDate.getTime() === finalStartDate.getTime()) {
          logger.info(`paginatedTokenSupplies: Reached final start date.`);
          break;
        }

        currentEndDate = currentStartDate;
      }

      // Convert Map to Response format
      let response = mapToTokenSuppliesResponse(
        new Map(Object.entries(allResults).map(([k, v]) => [k as Chain, v]))
      );

      // Apply filterCompleteRecords only on first page if crossChainDataComplete is true
      if (crossChainDataComplete && !hasProcessedFirstDate) {
        logger.info(`paginatedTokenSupplies: Applying crossChainDataComplete filter`);
        response = filterCompleteTokenSupplies(response, logger);
        hasProcessedFirstDate = true;
      }

      // Convert back to flat array, applying latest block filtering PER CHAIN first
      const allSupplies: TokenSupply[] = [];
      for (const { key, name } of [
        { key: "treasuryArbitrum_tokenSupplies", name: "Arbitrum" },
        { key: "treasuryEthereum_tokenSupplies", name: "Ethereum" },
        { key: "treasuryFantom_tokenSupplies", name: "Fantom" },
        { key: "treasuryPolygon_tokenSupplies", name: "Polygon" },
        { key: "treasuryBase_tokenSupplies", name: "Base" },
        { key: "treasuryBerachain_tokenSupplies", name: "Berachain" },
      ] as const) {
        const chainSupplies = filterTokenSuppliesByDay(response[key]);
        for (const supply of chainSupplies) {
          allSupplies.push({ ...supply, blockchain: name });
        }
      }

      logger.info(`paginatedTokenSupplies: Total supplies after filtering: ${allSupplies.length}`);

      // Sort by date descending (latest first)
      allSupplies.sort((a, b) => b.date.localeCompare(a.date));

      await cache.set(cacheKey, allSupplies, 300000);
      return allSupplies;
    },

    async paginatedProtocolMetrics(
      _parent: unknown,
      args: { startDate: string; dateOffset?: number; ignoreCache?: boolean }
    ) {
      const { startDate, dateOffset = 4, ignoreCache = false } = args;
      logger.info(
        `paginatedProtocolMetrics called with: startDate=${startDate}, dateOffset=${dateOffset}, ignoreCache=${ignoreCache}`
      );

      const finalStartDate = new Date(startDate);
      if (Number.isNaN(finalStartDate.getTime())) {
        throw new Error(`startDate should be in the YYYY-MM-DD format.`);
      }

      const earliestDateStr = getISO8601DateString(finalStartDate);
      const latestDateStr = getISO8601DateString(new Date());

      const cache = getGlobalCache();
      const cacheKey = CacheManager.generateKey("paginatedProtocolMetrics", {
        startDate: earliestDateStr,
        endDate: latestDateStr,
      });

      const cached = await cache.get(cacheKey, { bypassCache: args.ignoreCache });
      if (cached) {
        return cached as ProtocolMetric[];
      }

      const pageSize = 1000;
      const offsetDays = getOffsetDays(dateOffset);

      let currentStartDate: Date = getNextStartDate(offsetDays, finalStartDate, null);
      let currentEndDate: Date = getNextEndDate(null);

      const allResults: SingleChainProtocolMetricsResponse =
        {} as SingleChainProtocolMetricsResponse;

      while (currentStartDate.getTime() >= finalStartDate.getTime()) {
        currentStartDate = getNextStartDate(offsetDays, finalStartDate, currentEndDate);

        const startDateStr = getISO8601DateString(currentStartDate);
        const endDateStr = getISO8601DateString(currentEndDate);

        logger.info(`paginatedProtocolMetrics: Querying ${startDateStr} to ${endDateStr}`);

        const results =
          await queryAllSubgraphsWithPerChainVariables<SingleChainProtocolMetricsResponse>(
            PROTOCOL_METRICS_DATE_RANGE,
            () => ({ startDate: startDateStr, endDate: endDateStr, pageSize }),
            logger
          );

        logger.info(
          `paginatedProtocolMetrics: Got results from ${results.successfulChains.length} chains, failed: ${results.failedChains.join(", ")}`
        );

        // Merge results
        for (const [chain, data] of results.results.entries()) {
          const allResultsChain = allResults as unknown as Record<
            string,
            { protocolMetrics?: ProtocolMetric[] }
          >;
          if (!allResultsChain[chain]) {
            allResultsChain[chain] = data;
          } else {
            allResultsChain[chain] = {
              protocolMetrics: [
                ...(allResultsChain[chain]?.protocolMetrics || []),
                ...(data.protocolMetrics || []),
              ],
            };
          }
        }

        // Ensures that a finalStartDate close to the current date is handled correctly
        if (currentStartDate.getTime() === finalStartDate.getTime()) {
          logger.info(`paginatedProtocolMetrics: Reached final start date.`);
          break;
        }

        currentEndDate = currentStartDate;
      }

      const metrics = Array.from(
        Object.entries(allResults).map(([k, v]) => [k as Chain, v] as const)
      ).flatMap(([chain, data]) => {
        const chainMetrics = normalizeArray(data.protocolMetrics as ProtocolMetric[]);
        return filterProtocolMetricsByDay(chainMetrics).map((m) => ({
          ...m,
          blockchain: CHAIN_NAMES[chain],
        }));
      });

      // Sort by date descending (latest first)
      metrics.sort((a, b) => b.date.localeCompare(a.date));

      await cache.set(cacheKey, metrics, 300000);
      return metrics;
    },

    async paginatedMetrics(
      _parent: unknown,
      args: {
        startDate: string;
        dateOffset?: number;
        crossChainDataComplete?: boolean;
        includeRecords?: boolean;
        ignoreCache?: boolean;
      }
    ) {
      const {
        startDate,
        dateOffset = 4,
        crossChainDataComplete = false,
        includeRecords = false,
        ignoreCache = false,
      } = args;
      logger.info(
        `paginatedMetrics called with: startDate=${startDate}, dateOffset=${dateOffset}, crossChainDataComplete=${crossChainDataComplete}, includeRecords=${includeRecords}, ignoreCache=${ignoreCache}`
      );

      const finalStartDate = new Date(startDate);
      if (Number.isNaN(finalStartDate.getTime())) {
        throw new Error(`startDate should be in the YYYY-MM-DD format.`);
      }

      const earliestDateStr = getISO8601DateString(finalStartDate);
      const latestDateStr = getISO8601DateString(new Date());

      const cache = getGlobalCache();
      const cacheKey = CacheManager.generateKey("paginatedMetrics", {
        startDate: earliestDateStr,
        endDate: latestDateStr,
        crossChainDataComplete,
        includeRecords,
      });

      const cached = await cache.get(cacheKey, { bypassCache: args.ignoreCache });
      if (cached) {
        return cached as MetricWithMeta[];
      }

      const pageSize = 1000;
      const offsetDays = getOffsetDays(dateOffset);

      let currentStartDate: Date = getNextStartDate(offsetDays, finalStartDate, null);
      let currentEndDate: Date = getNextEndDate(null);
      let hasProcessedFirstDate = false;

      const allTokenRecordsResults: SingleChainTokenRecordsResponse =
        {} as SingleChainTokenRecordsResponse;
      const allTokenSuppliesResults: SingleChainTokenSuppliesResponse =
        {} as SingleChainTokenSuppliesResponse;
      const allProtocolMetricsResults: SingleChainProtocolMetricsResponse =
        {} as SingleChainProtocolMetricsResponse;
      const successfulChains = new Set<Chain>();
      const failedChains = new Set<Chain>();

      while (currentStartDate.getTime() >= finalStartDate.getTime()) {
        currentStartDate = getNextStartDate(offsetDays, finalStartDate, currentEndDate);

        const startDateStr = getISO8601DateString(currentStartDate);
        const endDateStr = getISO8601DateString(currentEndDate);

        logger.info(`paginatedMetrics: Querying ${startDateStr} to ${endDateStr}`);

        // Fetch all three data types for this page
        const allTokenRecords =
          await queryAllSubgraphsWithPerChainVariables<SingleChainTokenRecordsResponse>(
            TOKEN_RECORDS_DATE_RANGE,
            () => ({ startDate: startDateStr, endDate: endDateStr, pageSize }),
            logger
          );

        const allTokenSupplies =
          await queryAllSubgraphsWithPerChainVariables<SingleChainTokenSuppliesResponse>(
            TOKEN_SUPPLIES_DATE_RANGE,
            () => ({ startDate: startDateStr, endDate: endDateStr, pageSize }),
            logger
          );

        const allProtocolMetrics =
          await queryAllSubgraphsWithPerChainVariables<SingleChainProtocolMetricsResponse>(
            PROTOCOL_METRICS_DATE_RANGE,
            () => ({ startDate: startDateStr, endDate: endDateStr, pageSize }),
            logger
          );

        // Track successful/failed chains
        for (const c of allTokenRecords.successfulChains) {
          successfulChains.add(c);
        }
        for (const c of allTokenRecords.failedChains) {
          failedChains.add(c);
        }

        // Merge results
        for (const [chain, data] of allTokenRecords.results.entries()) {
          const allResultsChain = allTokenRecordsResults as unknown as Record<
            string,
            { tokenRecords?: TokenRecord[] }
          >;
          if (!allResultsChain[chain]) {
            allResultsChain[chain] = data;
          } else {
            allResultsChain[chain] = {
              tokenRecords: [
                ...(allResultsChain[chain]?.tokenRecords || []),
                ...(data.tokenRecords || []),
              ],
            };
          }
        }

        for (const [chain, data] of allTokenSupplies.results.entries()) {
          const allResultsChain = allTokenSuppliesResults as unknown as Record<
            string,
            { tokenSupplies?: TokenSupply[] }
          >;
          if (!allResultsChain[chain]) {
            allResultsChain[chain] = data;
          } else {
            allResultsChain[chain] = {
              tokenSupplies: [
                ...(allResultsChain[chain]?.tokenSupplies || []),
                ...(data.tokenSupplies || []),
              ],
            };
          }
        }

        for (const [chain, data] of allProtocolMetrics.results.entries()) {
          const allResultsChain = allProtocolMetricsResults as unknown as Record<
            string,
            { protocolMetrics?: ProtocolMetric[] }
          >;
          if (!allResultsChain[chain]) {
            allResultsChain[chain] = data;
          } else {
            allResultsChain[chain] = {
              protocolMetrics: [
                ...(allResultsChain[chain]?.protocolMetrics || []),
                ...(data.protocolMetrics || []),
              ],
            };
          }
        }

        // Ensures that a finalStartDate close to the current date is handled correctly
        if (currentStartDate.getTime() === finalStartDate.getTime()) {
          logger.info(`paginatedMetrics: Reached final start date.`);
          break;
        }

        currentEndDate = currentStartDate;
      }

      // Convert to response format for filtering
      let tokenRecordsResponse = mapToTokenRecordsResponse(
        new Map(Object.entries(allTokenRecordsResults).map(([k, v]) => [k as Chain, v]))
      );
      let tokenSuppliesResponse = mapToTokenSuppliesResponse(
        new Map(Object.entries(allTokenSuppliesResults).map(([k, v]) => [k as Chain, v]))
      );

      // Apply filterCompleteRecords only on first page if crossChainDataComplete is true
      if (crossChainDataComplete && !hasProcessedFirstDate) {
        logger.info(`paginatedMetrics: Applying crossChainDataComplete filter`);
        tokenRecordsResponse = filterCompleteTokenRecords(tokenRecordsResponse, logger);
        tokenSuppliesResponse = filterCompleteTokenSupplies(tokenSuppliesResponse, logger);
        hasProcessedFirstDate = true;
      }

      // Group by date and compute metrics
      const recordsByDate = new Map<string, TokenRecord[]>();
      const suppliesByDate = new Map<string, TokenSupply[]>();
      const protocolByDate = new Map<string, ProtocolMetric[]>();

      // Process token records - filter to latest block per day first (PER CHAIN)
      const chainMapping: Array<{ key: keyof TokenRecordsResponse; name: string }> = [
        { key: "treasuryArbitrum_tokenRecords", name: "Arbitrum" },
        { key: "treasuryEthereum_tokenRecords", name: "Ethereum" },
        { key: "treasuryFantom_tokenRecords", name: "Fantom" },
        { key: "treasuryPolygon_tokenRecords", name: "Polygon" },
        { key: "treasuryBase_tokenRecords", name: "Base" },
        { key: "treasuryBerachain_tokenRecords", name: "Berachain" },
      ];
      for (const { key, name } of chainMapping) {
        const chainRecords = filterTokenRecordsByDay(tokenRecordsResponse[key]);
        for (const record of chainRecords) {
          if (!recordsByDate.has(record.date)) {
            recordsByDate.set(record.date, []);
          }
          recordsByDate.get(record.date)?.push({ ...record, blockchain: name });
        }
      }

      // Process token supplies - filter to latest block per day first (PER CHAIN)
      const suppliesChainMapping: Array<{ key: keyof TokenSuppliesResponse; name: string }> = [
        { key: "treasuryArbitrum_tokenSupplies", name: "Arbitrum" },
        { key: "treasuryEthereum_tokenSupplies", name: "Ethereum" },
        { key: "treasuryFantom_tokenSupplies", name: "Fantom" },
        { key: "treasuryPolygon_tokenSupplies", name: "Polygon" },
        { key: "treasuryBase_tokenSupplies", name: "Base" },
        { key: "treasuryBerachain_tokenSupplies", name: "Berachain" },
      ];
      for (const { key, name } of suppliesChainMapping) {
        const chainSupplies = filterTokenSuppliesByDay(tokenSuppliesResponse[key]);
        for (const supply of chainSupplies) {
          if (!suppliesByDate.has(supply.date)) {
            suppliesByDate.set(supply.date, []);
          }
          suppliesByDate.get(supply.date)?.push({ ...supply, blockchain: name });
        }
      }

      // Process protocol metrics - filter to latest block per day first
      for (const [chain, data] of Object.entries(allProtocolMetricsResults).map(
        ([k, v]) => [k as Chain, v] as const
      )) {
        const chainMetrics = normalizeArray(data.protocolMetrics as ProtocolMetric[]);
        const filteredMetrics = filterProtocolMetricsByDay(chainMetrics);
        for (const metric of filteredMetrics) {
          if (!protocolByDate.has(metric.date)) {
            protocolByDate.set(metric.date, []);
          }
          protocolByDate.get(metric.date)?.push({ ...metric, blockchain: CHAIN_NAMES[chain] });
        }
      }

      // If crossChainDataComplete is true, filter out dates later than the latest TokenSupply date
      let latestTokenSupplyDate: string | null = null;
      if (crossChainDataComplete && suppliesByDate.size > 0) {
        for (const date of suppliesByDate.keys()) {
          if (!latestTokenSupplyDate || new Date(date) > new Date(latestTokenSupplyDate)) {
            latestTokenSupplyDate = date;
          }
        }
        logger.info(`paginatedMetrics: Latest TokenSupply date: ${latestTokenSupplyDate}`);
      }

      // Get all unique dates and sort descending
      const allDates = Array.from(
        new Set([...recordsByDate.keys(), ...suppliesByDate.keys(), ...protocolByDate.keys()])
      )
        .sort()
        .reverse();

      // Compute metric for each date
      const metrics: MetricWithMeta[] = [];
      for (const date of allDates) {
        // If crossChainDataComplete, skip dates later than latestTokenSupplyDate
        if (latestTokenSupplyDate && new Date(date) > new Date(latestTokenSupplyDate)) {
          logger.info(
            `paginatedMetrics: Skipping date ${date} (later than latest TokenSupply date)`
          );
          continue;
        }

        const dateRecords = recordsByDate.get(date) || [];
        const dateSupplies = suppliesByDate.get(date) || [];
        const dateProtocol = protocolByDate.get(date) || [];

        // Only add metric if we have data for this date
        if (dateRecords.length > 0 || dateSupplies.length > 0 || dateProtocol.length > 0) {
          const metric = getMetricObject(logger, dateRecords, dateSupplies, dateProtocol, {
            includeRecords,
            dateFallback: date,
          });
          metrics.push(
            addMetricMeta(
              metric,
              Array.from(successfulChains).map((c) => CHAIN_NAMES[c]),
              Array.from(failedChains).map((c) => CHAIN_NAMES[c])
            )
          );
        }
      }

      logger.info(`paginatedMetrics: Returning ${metrics.length} metrics`);
      await cache.set(cacheKey, metrics, 300000); // 5 minute TTL
      return metrics;
    },
  },
};
