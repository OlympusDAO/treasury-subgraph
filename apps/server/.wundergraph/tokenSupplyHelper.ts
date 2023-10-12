import { RequestLogger } from "@wundergraph/sdk/server";
import { CHAIN_ARBITRUM, CHAIN_ETHEREUM, CHAIN_FANTOM, CHAIN_POLYGON } from "./constants";
import { TokenSuppliesLatestResponseData } from "./generated/models";
import { parseNumber } from "./numberHelper";

export type TokenSupply = TokenSuppliesLatestResponseData["treasuryEthereum_tokenSupplies"][0];

type TokenSupplyByDate = {
  date: string;
  block: number;
  records: TokenSupply[];
};

export const filterLatestBlockByDay = (records: TokenSupply[]): TokenSupply[] => {
  const filteredData = Object.values(records.reduce((acc: Record<string, TokenSupplyByDate>, curr: TokenSupply) => {
    const { date, block } = curr;
    const blockNumber = parseNumber(block);
    if (!acc[date] || acc[date].block < blockNumber) {
      acc[date] = { date, block: blockNumber, records: [curr] };
    } else if (acc[date].block === blockNumber) {
      acc[date].records.push(curr);
    }
    return acc;
  }, {})).flatMap((record: TokenSupplyByDate) => record.records);

  return filteredData;
};

/**
 * Sorts records by date, id in descending order.
 */
export const sortRecordsDescending = (records: TokenSupply[]): TokenSupply[] => {
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

export const setBlockchainProperty = (records: TokenSupply[], blockchain: string): TokenSupply[] => {
  return records.map((record: TokenSupply) => {
    return { ...record, blockchain: blockchain };
  });
}

/**
 * Filters `records` to only include records with a complete set of cross-chain data.
 * 
 * @param records 
 */
export const filterCompleteRecords = (records: TokenSuppliesLatestResponseData, log: RequestLogger): TokenSuppliesLatestResponseData => {
  const FUNC = `tokenRecord/filterCompleteRecords`;

  // Check for empty values
  if (!records.treasuryArbitrum_tokenSupplies.length || !records.treasuryEthereum_tokenSupplies.length) {
    log.warn(`${FUNC}: Arbitrum or Ethereum records are empty.`)
    return {
      treasuryArbitrum_tokenSupplies: [],
      treasuryEthereum_tokenSupplies: [],
      treasuryFantom_tokenSupplies: [],
      treasuryPolygon_tokenSupplies: [],
    };
  }

  // Get the earliest date across the Ethereum and Arbitrum records
  const arbitrumDate = records.treasuryArbitrum_tokenSupplies[0].date;
  const ethereumDate = records.treasuryEthereum_tokenSupplies[0].date;
  const earliestDate = new Date(arbitrumDate) < new Date(ethereumDate) ? new Date(arbitrumDate) : new Date(ethereumDate);

  // Filter the records to only include records up to the earliest date
  const filteredRecords = {
    treasuryArbitrum_tokenSupplies: records.treasuryArbitrum_tokenSupplies.filter((record) => new Date(record.date) <= earliestDate),
    treasuryEthereum_tokenSupplies: records.treasuryEthereum_tokenSupplies.filter((record) => new Date(record.date) <= earliestDate),
    treasuryFantom_tokenSupplies: records.treasuryFantom_tokenSupplies.filter((record) => new Date(record.date) <= earliestDate),
    treasuryPolygon_tokenSupplies: records.treasuryPolygon_tokenSupplies.filter((record) => new Date(record.date) <= earliestDate),
  };

  return filteredRecords;
}

export const flattenRecords = (records: TokenSuppliesLatestResponseData, blockchain: boolean, latestBlock: boolean, log: RequestLogger): TokenSupply[] => {
  const FUNC = "tokenSupply/flattenRecords";
  const combinedRecords: TokenSupply[] = [];

  const mapping = {
    [CHAIN_ARBITRUM]: records.treasuryArbitrum_tokenSupplies,
    [CHAIN_ETHEREUM]: records.treasuryEthereum_tokenSupplies,
    [CHAIN_FANTOM]: records.treasuryFantom_tokenSupplies,
    [CHAIN_POLYGON]: records.treasuryPolygon_tokenSupplies,
  };

  for (const [key, value] of Object.entries(mapping)) {
    log.info(`${FUNC}: Got ${value.length} ${key} records.`);
    let currentRecords: TokenSupply[] = value;

    if (blockchain) {
      currentRecords = setBlockchainProperty(currentRecords, key);
    }

    if (latestBlock) {
      log.info(`${FUNC}: Filtering latest block for ${key} records with length ${currentRecords.length}`);
      currentRecords = filterLatestBlockByDay(currentRecords);
      log.info(`${FUNC}: Filtered latest block for ${key} records with revised length ${currentRecords.length}`);
    }

    combinedRecords.push(...currentRecords);
  }

  return combinedRecords;
};
