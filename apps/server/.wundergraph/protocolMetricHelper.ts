import { RequestLogger } from "@wundergraph/sdk/server";
import { CHAIN_ARBITRUM, CHAIN_BASE, CHAIN_BERACHAIN, CHAIN_ETHEREUM, CHAIN_FANTOM, CHAIN_POLYGON } from "./constants";
import { RawInternalProtocolMetricsResponseData } from "./generated/models";
import { parseNumber } from "./numberHelper";

export type ProtocolMetric = RawInternalProtocolMetricsResponseData["treasuryEthereum_protocolMetrics"][0];

type ProtocolMetricByDate = {
  date: string;
  block: number;
  records: ProtocolMetric[];
};

export const filterLatestBlockByDay = (records: ProtocolMetric[]): ProtocolMetric[] => {
  const filteredData = Object.values(records.reduce((acc: Record<string, ProtocolMetricByDate>, curr: ProtocolMetric) => {
    const { date, block } = curr;
    const blockNumber = parseNumber(block);
    if (!acc[date] || acc[date].block < blockNumber) {
      acc[date] = { date, block: blockNumber, records: [curr] };
    } else if (acc[date].block === blockNumber) {
      acc[date].records.push(curr);
    }
    return acc;
  }, {})).flatMap((record: ProtocolMetricByDate) => record.records);

  return filteredData;
};

/**
 * Sorts records by date, id in descending order.
 */
export const sortRecordsDescending = (records: ProtocolMetric[]): ProtocolMetric[] => {
  return records.sort((a, b) => {
    const aTime = new Date(a.date).getTime();
    const bTime = new Date(b.date).getTime();

    if (aTime > bTime) {
      return -1;
    }

    if (aTime < bTime) {
      return 1;
    }

    if (a.id > b.id) {
      return 1;
    }

    if (a.id < b.id) {
      return -1;
    }

    return 0;
  });
};

export const flattenRecords = (records: RawInternalProtocolMetricsResponseData, latestBlock: boolean, log: RequestLogger): ProtocolMetric[] => {
  const FUNC = "protocolMetric/flattenRecords";
  const combinedRecords: ProtocolMetric[] = [];

  const mapping = {
    [CHAIN_ARBITRUM]: records.treasuryArbitrum_protocolMetrics,
    [CHAIN_ETHEREUM]: records.treasuryEthereum_protocolMetrics,
    [CHAIN_FANTOM]: records.treasuryFantom_protocolMetrics,
    [CHAIN_POLYGON]: records.treasuryPolygon_protocolMetrics,
    [CHAIN_BASE]: records.treasuryBase_protocolMetrics,
    [CHAIN_BERACHAIN]: records.treasuryBerachain_protocolMetrics,
  };

  for (const [key, value] of Object.entries(mapping)) {
    log.info(`${FUNC}: Got ${value.length} ${key} records.`);
    let currentRecords: ProtocolMetric[] = value;

    if (latestBlock) {
      log.info(`${FUNC}: Filtering latest block for ${key} records with length ${currentRecords.length}`);
      currentRecords = filterLatestBlockByDay(currentRecords);
      log.info(`${FUNC}: Filtered latest block for ${key} records with revised length ${currentRecords.length}`);
    }

    combinedRecords.push(...currentRecords);
  }

  return combinedRecords;
};
