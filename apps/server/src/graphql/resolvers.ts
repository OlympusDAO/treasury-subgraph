import { Metric as CoreMetric, getMetricObject } from '../core/metricHelper';
import { TokenRecord, filterLatestBlockByDay as filterTokenRecordsByDay } from '../core/tokenRecordHelper';
import { TokenSupply, filterLatestBlockByDay as filterTokenSuppliesByDay } from '../core/tokenSupplyHelper';
import { ProtocolMetric, filterLatestBlockByDay as filterProtocolMetricsByDay } from '../core/protocolMetricHelper';
import { Logger, ConsoleLogger } from '../core/types';
import {
  Chain,
  queryAllSubgraphs,
  queryAllSubgraphsWithPerChainVariables,
  TOKEN_RECORDS_LATEST,
  TOKEN_RECORDS_EARLIEST,
  TOKEN_RECORDS_AT_BLOCK,
  TOKEN_RECORDS_DATE_RANGE,
  TOKEN_SUPPLIES_LATEST,
  TOKEN_SUPPLIES_EARLIEST,
  TOKEN_SUPPLIES_AT_BLOCK,
  TOKEN_SUPPLIES_DATE_RANGE,
  PROTOCOL_METRICS_LATEST,
  PROTOCOL_METRICS_EARLIEST,
  PROTOCOL_METRICS_AT_BLOCK,
  PROTOCOL_METRICS_DATE_RANGE,
} from '../subgraph';
import { getGlobalCache, CacheManager } from '../cache/cacheManager';
import { addMetricMeta, MetricWithMeta } from './types';

// Chain name mapping
const CHAIN_NAMES: Record<Chain, string> = {
  ethereum: 'Ethereum',
  arbitrum: 'Arbitrum',
  fantom: 'Fantom',
  polygon: 'Polygon',
  base: 'Base',
  berachain: 'Berachain',
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
const logger = new ConsoleLogger('resolvers');

// Helper function to convert null/undefined to empty arrays
function normalizeArray<T>(arr: T[] | null | undefined): T[] {
  return arr || [];
}

// Resolvers
export const resolvers = {
  Query: {
    // Health check
    health: () => ({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '2.0.0',
    }),

    // ============ LATEST QUERIES ============

    async latestMetrics(_parent: unknown, args: { ignoreCache?: boolean }) {
      const cache = getGlobalCache();
      const cacheKey = CacheManager.generateKey('latestMetrics');

      const cached = await cache.get(cacheKey, { bypassCache: args.ignoreCache }) as MetricWithMeta | null;
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
        throw new Error('No subgraphs returned data');
      }

      // Fetch all data at the latest blocks
      const pageSize = 1000;
      const allTokenRecords = await queryAllSubgraphsWithPerChainVariables<SingleChainTokenRecordsResponse>(
        TOKEN_RECORDS_AT_BLOCK,
        (chain) => ({ block: blocks[chain], pageSize }),
        logger
      );

      const allTokenSupplies = await queryAllSubgraphsWithPerChainVariables<SingleChainTokenSuppliesResponse>(
        TOKEN_SUPPLIES_AT_BLOCK,
        (chain) => ({ block: blocks[chain], pageSize }),
        logger
      );

      const allProtocolMetrics = await queryAllSubgraphsWithPerChainVariables<SingleChainProtocolMetricsResponse>(
        PROTOCOL_METRICS_AT_BLOCK,
        (chain) => ({ block: blocks[chain], pageSize }),
        logger
      );

      // Combine all successful chains
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
      const tokenRecords = Array.from(allTokenRecords.results.entries()).flatMap(
        ([chain, data]) => normalizeArray(data.tokenRecords).map(r => ({ ...r, blockchain: CHAIN_NAMES[chain] }))
      );

      const tokenSupplies = Array.from(allTokenSupplies.results.entries()).flatMap(
        ([chain, data]) => normalizeArray(data.tokenSupplies).map(s => ({ ...s, blockchain: CHAIN_NAMES[chain] }))
      );

      const protocolMetrics = Array.from(allProtocolMetrics.results.entries()).flatMap(
        ([chain, data]) => normalizeArray(data.protocolMetrics).map(m => ({ ...m, blockchain: CHAIN_NAMES[chain] }))
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
      const { results, successfulChains, failedChains } = await queryAllSubgraphs<
        SingleChainTokenRecordsResponse
      >(TOKEN_RECORDS_LATEST, {}, logger);

      const records = Array.from(results.entries()).flatMap(
        ([chain, data]) => normalizeArray(data.tokenRecords).map(r => ({ ...r, blockchain: CHAIN_NAMES[chain] }))
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
      const { results, successfulChains, failedChains } = await queryAllSubgraphs<
        SingleChainTokenSuppliesResponse
      >(TOKEN_SUPPLIES_LATEST, {}, logger);

      const supplies = Array.from(results.entries()).flatMap(
        ([chain, data]) => normalizeArray(data.tokenSupplies).map(s => ({ ...s, blockchain: CHAIN_NAMES[chain] }))
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
      const { results, successfulChains, failedChains } = await queryAllSubgraphs<
        SingleChainProtocolMetricsResponse
      >(PROTOCOL_METRICS_LATEST, {}, logger);

      const metrics = Array.from(results.entries()).flatMap(
        ([chain, data]) => normalizeArray(data.protocolMetrics).map(m => ({ ...m, blockchain: CHAIN_NAMES[chain] }))
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

    // ============ EARLIEST QUERIES ============

    async earliestMetrics(_parent: unknown, args: { ignoreCache?: boolean }) {
      const cache = getGlobalCache();
      const cacheKey = CacheManager.generateKey('earliestMetrics');

      const cached = await cache.get(cacheKey, { bypassCache: args.ignoreCache }) as MetricWithMeta | null;
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
        throw new Error('No subgraphs returned data');
      }

      const pageSize = 1000;
      const allTokenRecords = await queryAllSubgraphsWithPerChainVariables<SingleChainTokenRecordsResponse>(
        TOKEN_RECORDS_AT_BLOCK,
        (chain) => ({ block: blocks[chain], pageSize }),
        logger
      );

      const allTokenSupplies = await queryAllSubgraphsWithPerChainVariables<SingleChainTokenSuppliesResponse>(
        TOKEN_SUPPLIES_AT_BLOCK,
        (chain) => ({ block: blocks[chain], pageSize }),
        logger
      );

      const allProtocolMetrics = await queryAllSubgraphsWithPerChainVariables<SingleChainProtocolMetricsResponse>(
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
      const tokenRecords = Array.from(allTokenRecords.results.entries()).flatMap(
        ([chain, data]) => normalizeArray(data.tokenRecords).map(r => ({ ...r, blockchain: CHAIN_NAMES[chain] }))
      );

      const tokenSupplies = Array.from(allTokenSupplies.results.entries()).flatMap(
        ([chain, data]) => normalizeArray(data.tokenSupplies).map(s => ({ ...s, blockchain: CHAIN_NAMES[chain] }))
      );

      const protocolMetrics = Array.from(allProtocolMetrics.results.entries()).flatMap(
        ([chain, data]) => normalizeArray(data.protocolMetrics).map(m => ({ ...m, blockchain: CHAIN_NAMES[chain] }))
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
      // Note: ignoreCache is accepted for API compatibility but earliest queries don't use cache
      const { results } = await queryAllSubgraphs<SingleChainTokenRecordsResponse>(
        TOKEN_RECORDS_EARLIEST,
        {},
        logger
      );

      const records = Array.from(results.entries()).flatMap(
        ([chain, data]) => normalizeArray(data.tokenRecords).map(r => ({ ...r, blockchain: CHAIN_NAMES[chain] }))
      );
      return records;
    },

    async earliestTokenSupplies(_parent: unknown, args: { ignoreCache?: boolean }) {
      // Note: ignoreCache is accepted for API compatibility but earliest queries don't use cache
      const { results } = await queryAllSubgraphs<SingleChainTokenSuppliesResponse>(
        TOKEN_SUPPLIES_EARLIEST,
        {},
        logger
      );

      const supplies = Array.from(results.entries()).flatMap(
        ([chain, data]) => normalizeArray(data.tokenSupplies).map(s => ({ ...s, blockchain: CHAIN_NAMES[chain] }))
      );
      return supplies;
    },

    async earliestProtocolMetrics(_parent: unknown, args: { ignoreCache?: boolean }) {
      // Note: ignoreCache is accepted for API compatibility but earliest queries don't use cache
      const { results } = await queryAllSubgraphs<SingleChainProtocolMetricsResponse>(
        PROTOCOL_METRICS_EARLIEST,
        {},
        logger
      );

      const metrics = Array.from(results.entries()).flatMap(
        ([chain, data]) => normalizeArray(data.protocolMetrics).map(m => ({ ...m, blockchain: CHAIN_NAMES[chain] }))
      );
      return metrics;
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
      const cache = getGlobalCache();
      const cacheKey = CacheManager.generateKey('atBlockMetrics', args);

      const cached = await cache.get(cacheKey) as MetricWithMeta | null;
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

      const allTokenRecords = await queryAllSubgraphsWithPerChainVariables<SingleChainTokenRecordsResponse>(
        TOKEN_RECORDS_AT_BLOCK,
        (chain) => ({ block: blocks[chain], pageSize }),
        logger
      );

      const allTokenSupplies = await queryAllSubgraphsWithPerChainVariables<SingleChainTokenSuppliesResponse>(
        TOKEN_SUPPLIES_AT_BLOCK,
        (chain) => ({ block: blocks[chain], pageSize }),
        logger
      );

      const allProtocolMetrics = await queryAllSubgraphsWithPerChainVariables<SingleChainProtocolMetricsResponse>(
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
      const tokenRecords = Array.from(allTokenRecords.results.entries()).flatMap(
        ([chain, data]) => normalizeArray(data.tokenRecords).map(r => ({ ...r, blockchain: CHAIN_NAMES[chain] }))
      );

      const tokenSupplies = Array.from(allTokenSupplies.results.entries()).flatMap(
        ([chain, data]) => normalizeArray(data.tokenSupplies).map(s => ({ ...s, blockchain: CHAIN_NAMES[chain] }))
      );

      const protocolMetrics = Array.from(allProtocolMetrics.results.entries()).flatMap(
        ([chain, data]) => normalizeArray(data.protocolMetrics).map(m => ({ ...m, blockchain: CHAIN_NAMES[chain] }))
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

      return Array.from(results.results.entries()).flatMap(
        ([chain, data]) => normalizeArray(data.tokenRecords).map(r => ({ ...r, blockchain: CHAIN_NAMES[chain] }))
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
      const blocks: Record<Chain, number> = {
        ethereum: args.ethereumBlock,
        arbitrum: args.arbitrumBlock,
        fantom: args.fantomBlock,
        polygon: args.polygonBlock,
        base: args.baseBlock,
        berachain: args.berachainBlock,
      };

      const pageSize = 1000;
      const results = await queryAllSubgraphsWithPerChainVariables<SingleChainTokenSuppliesResponse>(
        TOKEN_SUPPLIES_AT_BLOCK,
        (chain) => ({ block: blocks[chain], pageSize }),
        logger
      );

      return Array.from(results.results.entries()).flatMap(
        ([chain, data]) => normalizeArray(data.tokenSupplies).map(s => ({ ...s, blockchain: CHAIN_NAMES[chain] }))
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
      const blocks: Record<Chain, number> = {
        ethereum: args.ethereumBlock,
        arbitrum: args.arbitrumBlock,
        fantom: args.fantomBlock,
        polygon: args.polygonBlock,
        base: args.baseBlock,
        berachain: args.berachainBlock,
      };

      const pageSize = 1000;
      const results = await queryAllSubgraphsWithPerChainVariables<SingleChainProtocolMetricsResponse>(
        PROTOCOL_METRICS_AT_BLOCK,
        (chain) => ({ block: blocks[chain], pageSize }),
        logger
      );

      return Array.from(results.results.entries()).flatMap(
        ([chain, data]) => normalizeArray(data.protocolMetrics).map(m => ({ ...m, blockchain: CHAIN_NAMES[chain] }))
      );
    },

    // ============ PAGINATED QUERIES ============

    async paginatedTokenRecords(
      _parent: unknown,
      args: { startDate: string; dateOffset?: number; crossChainDataComplete?: boolean; ignoreCache?: boolean }
    ) {
      const { startDate, dateOffset = 30 } = args;

      // Calculate date range (startDate going back dateOffset days)
      const start = new Date(startDate);
      const end = new Date(start);
      end.setDate(end.getDate() - dateOffset);

      const startDateStr = end.toISOString().split('T')[0]; // earlier date
      const endDateStr = start.toISOString().split('T')[0]; // start date (later)

      const cache = getGlobalCache();
      const cacheKey = CacheManager.generateKey('paginatedTokenRecords', { startDate: startDateStr, endDate: endDateStr });

      const cached = await cache.get(cacheKey, { bypassCache: args.ignoreCache });
      if (cached) {
        return cached as TokenRecord[];
      }

      const pageSize = 1000;
      const variables = { startDate: startDateStr, endDate: endDateStr, pageSize };
      logger.info(`paginatedTokenRecords: Querying date range ${startDateStr} to ${endDateStr}`);

      const results = await queryAllSubgraphsWithPerChainVariables<SingleChainTokenRecordsResponse>(
        TOKEN_RECORDS_DATE_RANGE,
        () => variables,
        logger
      );

      logger.info(`paginatedTokenRecords: Got results from ${results.successfulChains.length} chains, failed: ${results.failedChains.join(', ')}`);

      const records = Array.from(results.results.entries()).flatMap(
        ([chain, data]) => {
          const chainRecords = normalizeArray(data.tokenRecords);
          const filteredRecords = filterTokenRecordsByDay(chainRecords);
          if (chainRecords.length > 0) {
            logger.info(`paginatedTokenRecords: ${chain} returned ${chainRecords.length} records, filtered to ${filteredRecords.length}`);
          }
          return filteredRecords.map(r => ({ ...r, blockchain: CHAIN_NAMES[chain] }));
        }
      );

      logger.info(`paginatedTokenRecords: Total records: ${records.length}`);
      await cache.set(cacheKey, records, 300000); // 5 minute TTL
      return records;
    },

    async paginatedTokenSupplies(
      _parent: unknown,
      args: { startDate: string; dateOffset?: number; crossChainDataComplete?: boolean; ignoreCache?: boolean }
    ) {
      const { startDate, dateOffset = 30 } = args;

      // Calculate date range
      const start = new Date(startDate);
      const end = new Date(start);
      end.setDate(end.getDate() - dateOffset);

      const startDateStr = end.toISOString().split('T')[0];
      const endDateStr = start.toISOString().split('T')[0];

      const cache = getGlobalCache();
      const cacheKey = CacheManager.generateKey('paginatedTokenSupplies', { startDate: startDateStr, endDate: endDateStr });

      const cached = await cache.get(cacheKey, { bypassCache: args.ignoreCache });
      if (cached) {
        return cached as TokenSupply[];
      }

      const pageSize = 1000;
      const results = await queryAllSubgraphsWithPerChainVariables<SingleChainTokenSuppliesResponse>(
        TOKEN_SUPPLIES_DATE_RANGE,
        () => ({ startDate: startDateStr, endDate: endDateStr, pageSize }),
        logger
      );

      const supplies = Array.from(results.results.entries()).flatMap(
        ([chain, data]) => {
          const chainSupplies = normalizeArray(data.tokenSupplies);
          return filterTokenSuppliesByDay(chainSupplies).map(s => ({ ...s, blockchain: CHAIN_NAMES[chain] }));
        }
      );

      await cache.set(cacheKey, supplies, 300000);
      return supplies;
    },

    async paginatedProtocolMetrics(_parent: unknown, args: { startDate: string; dateOffset?: number; ignoreCache?: boolean }) {
      const { startDate, dateOffset = 30 } = args;

      // Calculate date range
      const start = new Date(startDate);
      const end = new Date(start);
      end.setDate(end.getDate() - dateOffset);

      const startDateStr = end.toISOString().split('T')[0];
      const endDateStr = start.toISOString().split('T')[0];

      const cache = getGlobalCache();
      const cacheKey = CacheManager.generateKey('paginatedProtocolMetrics', { startDate: startDateStr, endDate: endDateStr });

      const cached = await cache.get(cacheKey, { bypassCache: args.ignoreCache });
      if (cached) {
        return cached as ProtocolMetric[];
      }

      const pageSize = 1000;
      const results = await queryAllSubgraphsWithPerChainVariables<SingleChainProtocolMetricsResponse>(
        PROTOCOL_METRICS_DATE_RANGE,
        () => ({ startDate: startDateStr, endDate: endDateStr, pageSize }),
        logger
      );

      const metrics = Array.from(results.results.entries()).flatMap(
        ([chain, data]) => {
          const chainMetrics = normalizeArray(data.protocolMetrics);
          return filterProtocolMetricsByDay(chainMetrics).map(m => ({ ...m, blockchain: CHAIN_NAMES[chain] }));
        }
      );

      await cache.set(cacheKey, metrics, 300000);
      return metrics;
    },

    async paginatedMetrics(
      _parent: unknown,
      args: { startDate: string; dateOffset?: number; crossChainDataComplete?: boolean; includeRecords?: boolean; ignoreCache?: boolean }
    ) {
      const { startDate, dateOffset = 30 } = args;

      // Calculate date range
      const start = new Date(startDate);
      const end = new Date(start);
      end.setDate(end.getDate() - dateOffset);

      const startDateStr = end.toISOString().split('T')[0];
      const endDateStr = start.toISOString().split('T')[0];

      const cache = getGlobalCache();
      const cacheKey = CacheManager.generateKey('paginatedMetrics', { startDate: startDateStr, endDate: endDateStr });

      const cached = await cache.get(cacheKey, { bypassCache: args.ignoreCache });
      if (cached) {
        return cached as MetricWithMeta[];
      }

      const pageSize = 1000;

      // Fetch all data for the date range
      const allTokenRecords = await queryAllSubgraphsWithPerChainVariables<SingleChainTokenRecordsResponse>(
        TOKEN_RECORDS_DATE_RANGE,
        () => ({ startDate: startDateStr, endDate: endDateStr, pageSize }),
        logger
      );

      const allTokenSupplies = await queryAllSubgraphsWithPerChainVariables<SingleChainTokenSuppliesResponse>(
        TOKEN_SUPPLIES_DATE_RANGE,
        () => ({ startDate: startDateStr, endDate: endDateStr, pageSize }),
        logger
      );

      const allProtocolMetrics = await queryAllSubgraphsWithPerChainVariables<SingleChainProtocolMetricsResponse>(
        PROTOCOL_METRICS_DATE_RANGE,
        () => ({ startDate: startDateStr, endDate: endDateStr, pageSize }),
        logger
      );

      // Group by date and compute metrics
      const recordsByDate = new Map<string, TokenRecord[]>();
      const suppliesByDate = new Map<string, TokenSupply[]>();
      const protocolByDate = new Map<string, ProtocolMetric[]>();

      // Process token records - filter to latest block per day first
      for (const [chain, data] of allTokenRecords.results.entries()) {
        const chainRecords = normalizeArray(data.tokenRecords);
        // Filter to only the latest block for each day to avoid double-counting
        const filteredRecords = filterTokenRecordsByDay(chainRecords);
        for (const record of filteredRecords) {
          if (!recordsByDate.has(record.date)) {
            recordsByDate.set(record.date, []);
          }
          recordsByDate.get(record.date)!.push({ ...record, blockchain: CHAIN_NAMES[chain] });
        }
      }

      // Process token supplies - filter to latest block per day first
      for (const [chain, data] of allTokenSupplies.results.entries()) {
        const chainSupplies = normalizeArray(data.tokenSupplies);
        // Filter to only the latest block for each day
        const filteredSupplies = filterTokenSuppliesByDay(chainSupplies);
        for (const supply of filteredSupplies) {
          if (!suppliesByDate.has(supply.date)) {
            suppliesByDate.set(supply.date, []);
          }
          suppliesByDate.get(supply.date)!.push({ ...supply, blockchain: CHAIN_NAMES[chain] });
        }
      }

      // Process protocol metrics - filter to latest block per day first
      for (const [chain, data] of allProtocolMetrics.results.entries()) {
        const chainMetrics = normalizeArray(data.protocolMetrics);
        // Filter to only the latest block for each day
        const filteredMetrics = filterProtocolMetricsByDay(chainMetrics);
        for (const metric of filteredMetrics) {
          if (!protocolByDate.has(metric.date)) {
            protocolByDate.set(metric.date, []);
          }
          protocolByDate.get(metric.date)!.push({ ...metric, blockchain: CHAIN_NAMES[chain] });
        }
      }

      // Get all unique dates and sort descending
      const allDates = Array.from(
        new Set([
          ...recordsByDate.keys(),
          ...suppliesByDate.keys(),
          ...protocolByDate.keys(),
        ])
      ).sort().reverse();

      // Compute metric for each date
      const metrics: MetricWithMeta[] = [];
      for (const date of allDates) {
        const dateRecords = recordsByDate.get(date) || [];
        const dateSupplies = suppliesByDate.get(date) || [];
        const dateProtocol = protocolByDate.get(date) || [];

        // Only add metric if we have data for this date
        if (dateRecords.length > 0 || dateSupplies.length > 0 || dateProtocol.length > 0) {
          const metric = getMetricObject(logger, dateRecords, dateSupplies, dateProtocol);
          metrics.push(addMetricMeta(
            metric,
            Array.from(allTokenRecords.successfulChains).map(c => CHAIN_NAMES[c]),
            Array.from(allTokenRecords.failedChains).map(c => CHAIN_NAMES[c])
          ));
        }
      }

      await cache.set(cacheKey, metrics, 300000); // 5 minute TTL
      return metrics;
    },
  },
};
