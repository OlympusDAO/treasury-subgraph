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

/**
 * Determines whether the data across chains is complete.
 * 
 * It determines this by checking if the date of the records across chains is the same.
 * 
 * Assumptions:
 * - The data is sorted in descending order and for the same day
 * - Ethereum and Arbitrum have OHM supply, so we only check those two chains
 * 
 * @param arbitrumRecords 
 * @param ethereumRecords 
 * @returns 
 */
export const isCrossChainSupplyDataComplete = (arbitrumRecords: TokenSupply[], ethereumRecords: TokenSupply[]): boolean => {
  if (!arbitrumRecords.length || !ethereumRecords.length) {
    return false;
  }

  const arbitrumDate = arbitrumRecords[0].date;
  const ethereumDate = ethereumRecords[0].date;

  return arbitrumDate === ethereumDate;
}
