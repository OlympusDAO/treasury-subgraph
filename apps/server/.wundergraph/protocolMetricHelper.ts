import { CHAIN_ARBITRUM, CHAIN_ETHEREUM, CHAIN_FANTOM, CHAIN_POLYGON } from "./constants";
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

export const sortRecordsDescending = (records: ProtocolMetric[]): ProtocolMetric[] => {
  return records.sort((a, b) => {
    const aTime = new Date(a.date).getTime();
    const bTime = new Date(b.date).getTime();

    if (aTime > bTime) {
      return -1;
    } else if (aTime < bTime) {
      return 1;
    } else {
      return 0;
    }
  });
};

export const flattenRecords = (records: RawInternalProtocolMetricsResponseData, latestBlock: boolean): ProtocolMetric[] => {
  const combinedRecords: ProtocolMetric[] = [];

  const mapping = {
    [CHAIN_ARBITRUM]: records.treasuryArbitrum_protocolMetrics,
    [CHAIN_ETHEREUM]: records.treasuryEthereum_protocolMetrics,
    [CHAIN_FANTOM]: records.treasuryFantom_protocolMetrics,
    [CHAIN_POLYGON]: records.treasuryPolygon_protocolMetrics,
  };

  for (const [key, value] of Object.entries(mapping)) {
    console.log(`Got ${value.length} ${key} records.`);
    let currentRecords: ProtocolMetric[] = value;

    if (latestBlock) {
      currentRecords = filterLatestBlockByDay(currentRecords);
    }

    combinedRecords.push(...currentRecords);
  }

  return combinedRecords;
};
