import { createOperation } from '../../generated/wundergraph.factory';
import { Metric, getMetricObject } from '../../metricHelper';
import { getBlockByChain } from '../../tokenRecordHelper';
import { CHAIN_ARBITRUM, CHAIN_ETHEREUM, CHAIN_FANTOM, CHAIN_POLYGON } from '../../constants';
import { getCachedData, setCachedData } from '../../cacheHelper';

/**
 * This custom query will return the latest Metric object.
 */
export default createOperation.query({
  handler: async (ctx) => {
    const FUNC = "latest/metrics";
    console.log(`${FUNC}: Commencing latest query for Metric`);

    // Return cached data if it exists
    const cachedData = await getCachedData<Metric>(FUNC);
    if (cachedData) {
      console.log(`${FUNC}: Returning cached data`);
      return cachedData;
    }

    // Get the latest block for each blockchain
    // TODO what if the latest date is missing cross-chain data?
    console.log(`${FUNC}: No cached data found, querying subgraphs...`);
    const latestQueryResult = await ctx.operations.query({
      operationName: "latest/tokenRecords",
    });

    const arbitrumBlock = getBlockByChain(latestQueryResult.data || [], CHAIN_ARBITRUM);
    const ethereumBlock = getBlockByChain(latestQueryResult.data || [], CHAIN_ETHEREUM);
    const fantomBlock = getBlockByChain(latestQueryResult.data || [], CHAIN_FANTOM);
    const polygonBlock = getBlockByChain(latestQueryResult.data || [], CHAIN_POLYGON);

    if (!arbitrumBlock || !ethereumBlock || !fantomBlock || !polygonBlock) {
      return null;
    }

    const input = {
      arbitrumBlock,
      ethereumBlock,
      fantomBlock,
      polygonBlock,
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

    const metricRecord: Metric | null = getMetricObject(tokenRecordsQueryResult.data || [], tokenSuppliesQueryResult.data || [], protocolMetricsQueryResult.data || []);

    // Update the cache
    if (metricRecord) {
      await setCachedData<Metric>(FUNC, metricRecord);
      console.log(`${FUNC}: Updated cache`);
    }

    return metricRecord;
  },
});
