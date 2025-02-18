import { createOperation, z } from '../../generated/wundergraph.factory';
import { Metric, getMetricObject } from '../../metricHelper';
import { getBlockByChain } from '../../tokenRecordHelper';
import { CHAIN_ARBITRUM, CHAIN_BASE, CHAIN_BERACHAIN, CHAIN_ETHEREUM, CHAIN_FANTOM, CHAIN_POLYGON } from '../../constants';
import { getCacheKey, getCachedRecord, setCachedRecord } from '../../cacheHelper';
import { UpstreamSubgraphError } from '../../upstreamSubgraphError';

/**
 * This custom query will return the latest Metric object.
 */
export default createOperation.query({
  errors: [UpstreamSubgraphError],
  input: z.object({
    ignoreCache: z.boolean({ description: "If true, ignores the cache and queries the subgraphs directly." }).optional(),
  }),
  handler: async (ctx) => {
    const FUNC = "latest/metrics";
    const log = ctx.log;
    log.info(`${FUNC}: Commencing query`);

    // Return cached data if it exists
    const cacheKey = getCacheKey(FUNC, ctx.input);
    if (!ctx.input.ignoreCache) {
      const cachedData = await getCachedRecord<Metric>(cacheKey, log);
      if (cachedData) {
        return cachedData;
      }
    }

    // Get the latest block for each blockchain
    // TODO what if the latest date is missing cross-chain data?
    log.info(`${FUNC}: No cached data found, querying subgraphs...`);
    const latestQueryResult = await ctx.operations.query({
      operationName: "latest/tokenRecords",
    });

    const arbitrumBlock = getBlockByChain(latestQueryResult.data || [], CHAIN_ARBITRUM);
    const ethereumBlock = getBlockByChain(latestQueryResult.data || [], CHAIN_ETHEREUM);
    const fantomBlock = getBlockByChain(latestQueryResult.data || [], CHAIN_FANTOM);
    const polygonBlock = getBlockByChain(latestQueryResult.data || [], CHAIN_POLYGON);
    const baseBlock = getBlockByChain(latestQueryResult.data || [], CHAIN_BASE);
    const berachainBlock = getBlockByChain(latestQueryResult.data || [], CHAIN_BERACHAIN);

    if (!arbitrumBlock || !ethereumBlock || !fantomBlock || !polygonBlock || !baseBlock || !berachainBlock) {
      throw new UpstreamSubgraphError({ message: `${FUNC}: Could not find latest tokenRecord block for each chain. Arbitrum: ${arbitrumBlock}, Ethereum: ${ethereumBlock}, Fantom: ${fantomBlock}, Polygon: ${polygonBlock}, Base: ${baseBlock}, Berachain: ${berachainBlock}` });
    }

    const input = {
      arbitrumBlock,
      ethereumBlock,
      fantomBlock,
      polygonBlock,
      baseBlock,
      berachainBlock,
    };

    const protocolMetricsQueryResult = await ctx.operations.query({
      operationName: "atBlock/internal/protocolMetrics",
      input: input,
    });

    const tokenRecordsQueryResult = await ctx.operations.query({
      operationName: "atBlock/tokenRecords",
      input: input,
    });

    const tokenSuppliesQueryResult = await ctx.operations.query({
      operationName: "atBlock/tokenSupplies",
      input: input,
    });

    const metricRecord: Metric = getMetricObject(log, tokenRecordsQueryResult.data || [], tokenSuppliesQueryResult.data || [], protocolMetricsQueryResult.data || []);

    // Update the cache
    await setCachedRecord(cacheKey, metricRecord, log);

    return metricRecord;
  },
});
