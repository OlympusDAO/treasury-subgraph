import { CHAIN_ARBITRUM, CHAIN_ETHEREUM, CHAIN_FANTOM, CHAIN_POLYGON } from "./constants";
import { TokenRecordsLatestResponseData } from "./generated/models";

export type TokenRecord = TokenRecordsLatestResponseData["treasuryEthereum_tokenRecords"][0];

type TokenRecordByDate = {
  date: string;
  block: number;
  records: TokenRecord[];
};

export const filterLatestBlockByDay = (records: TokenRecord[]): TokenRecord[] => {
  const filteredData = Object.values(records.reduce((acc: Record<string, TokenRecordByDate>, curr: TokenRecord) => {
    const { date, block } = curr;
    const blockNumber = parseInt(block);
    if (!acc[date] || acc[date].block < blockNumber) {
      acc[date] = { date, block: blockNumber, records: [curr] };
    } else if (acc[date].block === blockNumber) {
      acc[date].records.push(curr);
    }
    return acc;
  }, {})).flatMap((record: TokenRecordByDate) => record.records);

  return filteredData;
};

export const sortRecordsDescending = (records: TokenRecord[]): TokenRecord[] => {
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

export const flattenRecords = (records: TokenRecordsLatestResponseData, latestBlock: boolean): TokenRecord[] => {
  const combinedRecords: TokenRecord[] = [];

  const mapping = {
    [CHAIN_ARBITRUM]: records.treasuryArbitrum_tokenRecords,
    [CHAIN_ETHEREUM]: records.treasuryEthereum_tokenRecords,
    [CHAIN_FANTOM]: records.treasuryFantom_tokenRecords,
    [CHAIN_POLYGON]: records.treasuryPolygon_tokenRecords,
  };

  for (const [key, value] of Object.entries(mapping)) {
    console.log(`Got ${value.length} ${key} records.`);
    let currentRecords: TokenRecord[] = value;

    if (latestBlock) {
      currentRecords = filterLatestBlockByDay(currentRecords);
    }

    combinedRecords.push(...currentRecords);
  }

  return combinedRecords;
};

export const getBlockByChain = (records: TokenRecord[], chain: string): number | null => {
  const chainRecords = records.filter((record) => record.blockchain === chain);

  return chainRecords.length > 0 ? +chainRecords[0].block : null;
}