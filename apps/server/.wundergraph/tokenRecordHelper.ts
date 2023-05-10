import { TokenRecordsLatestResponseData } from "./generated/models";

type TokenRecord = TokenRecordsLatestResponseData["treasuryEthereum_tokenRecords"][0];

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

export const flattenRecords = (records: TokenRecordsLatestResponseData): TokenRecord[] => {
  const combinedRecords: TokenRecord[] = [];

  console.log(`Got ${records.treasuryArbitrum_tokenRecords.length} Arbitrum records.`);
  combinedRecords.push(...records.treasuryArbitrum_tokenRecords);
  console.log(`Got ${records.treasuryEthereum_tokenRecords.length} Ethereum records.`);
  combinedRecords.push(...records.treasuryEthereum_tokenRecords);
  console.log(`Got ${records.treasuryFantom_tokenRecords.length} Fantom records.`);
  combinedRecords.push(...records.treasuryFantom_tokenRecords);
  console.log(`Got ${records.treasuryPolygon_tokenRecords.length} Polygon records.`);
  combinedRecords.push(...records.treasuryPolygon_tokenRecords);

  return combinedRecords;
};
