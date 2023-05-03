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