import { TokenSuppliesLatestResponseData } from "./generated/models";

type TokenSupply = TokenSuppliesLatestResponseData["treasuryEthereum_tokenSupplies"][0];

type TokenSupplyByDate = {
  date: string;
  block: number;
  records: TokenSupply[];
};

export const filterLatestBlockByDay = (records: TokenSupply[]): TokenSupply[] => {
  const filteredData = Object.values(records.reduce((acc: Record<string, TokenSupplyByDate>, curr: TokenSupply) => {
    const { date, block } = curr;
    const blockNumber = parseInt(block);
    if (!acc[date] || acc[date].block < blockNumber) {
      acc[date] = { date, block: blockNumber, records: [curr] };
    } else if (acc[date].block === blockNumber) {
      acc[date].records.push(curr);
    }
    return acc;
  }, {})).flatMap((record: TokenSupplyByDate) => record.records);

  return filteredData;
};

export const sortRecordsDescending = (records: TokenSupply[]): TokenSupply[] => {
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

export const setBlockchainProperty = (records: TokenSupply[], blockchain: string): TokenSupply[] => {
  return records.map((record: TokenSupply) => {
    return { ...record, blockchain: blockchain };
  });
}

export const flattenRecords = (records: TokenSuppliesLatestResponseData): TokenSupply[] => {
  const combinedRecords: TokenSupply[] = [];

  console.log(`Got ${records.treasuryArbitrum_tokenSupplies.length} Arbitrum records.`);
  combinedRecords.push(...records.treasuryArbitrum_tokenSupplies);
  console.log(`Got ${records.treasuryEthereum_tokenSupplies.length} Ethereum records.`);
  combinedRecords.push(...records.treasuryEthereum_tokenSupplies);
  console.log(`Got ${records.treasuryFantom_tokenSupplies.length} Fantom records.`);
  combinedRecords.push(...records.treasuryFantom_tokenSupplies);
  console.log(`Got ${records.treasuryPolygon_tokenSupplies.length} Polygon records.`);
  combinedRecords.push(...records.treasuryPolygon_tokenSupplies);

  return combinedRecords;
};
