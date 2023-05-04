import { ProtocolMetricsLatestResponseData } from "./generated/models";

type ProtocolMetric = ProtocolMetricsLatestResponseData["treasuryEthereum_protocolMetrics"][0];

type ProtocolMetricByDate = {
  date: string;
  block: number;
  records: ProtocolMetric[];
};

export const filterLatestBlockByDay = (records: ProtocolMetric[]): ProtocolMetric[] => {
  const filteredData = Object.values(records.reduce((acc: Record<string, ProtocolMetricByDate>, curr: ProtocolMetric) => {
    const { date, block } = curr;
    const blockNumber = parseInt(block);
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
