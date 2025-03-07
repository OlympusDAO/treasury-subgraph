import { RequestLogger } from "@wundergraph/sdk/server";
import { CHAIN_ARBITRUM, CHAIN_BASE, CHAIN_BERACHAIN, CHAIN_ETHEREUM, CHAIN_FANTOM, CHAIN_POLYGON } from "./constants";
import { TokenRecordsLatestResponseData } from "./generated/models";
import { parseNumber } from "./numberHelper";

export type TokenRecord = TokenRecordsLatestResponseData["treasuryEthereum_tokenRecords"][0];

type TokenRecordByDate = {
  date: string;
  block: number;
  records: TokenRecord[];
};

/**
 * This function determines the latest block for each day and returns only the records with that block.
 *
 * @param records
 * @returns
 */
export const filterLatestBlockByDay = (records: TokenRecord[]): TokenRecord[] => {
  const FUNC = `tokenRecord/filterLatestBlockByDay`;
  const filteredData = Object.values(records.reduce((acc: Record<string, TokenRecordByDate>, curr: TokenRecord) => {
    const { date, block } = curr;
    const blockNumber = parseNumber(block);
    if (!acc[date] || acc[date].block < blockNumber) {
      acc[date] = { date, block: blockNumber, records: [curr] };
    } else if (acc[date].block === blockNumber) {
      acc[date].records.push(curr);
    }
    return acc;
  }, {})).flatMap((record: TokenRecordByDate) => record.records);

  return filteredData;
};

/**
 * Sorts records by date, id in descending order.
 */
export const sortRecordsDescending = (records: TokenRecord[]): TokenRecord[] => {
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

/**
 * Filters `records` to only include records with a complete set of cross-chain data.
 *
 * @param records
 */
export const filterCompleteRecords = (records: TokenRecordsLatestResponseData, log: RequestLogger): TokenRecordsLatestResponseData => {
  const FUNC = `tokenRecord/filterCompleteRecords`;

  // Check for empty values
  if (!records.treasuryArbitrum_tokenRecords.length || !records.treasuryEthereum_tokenRecords.length) {
    log.warn(`${FUNC}: Arbitrum or Ethereum records are empty.`)
    return {
      treasuryArbitrum_tokenRecords: [],
      treasuryEthereum_tokenRecords: [],
      treasuryFantom_tokenRecords: [],
      treasuryPolygon_tokenRecords: [],
      treasuryBase_tokenRecords: [],
      treasuryBerachain_tokenRecords: [],
    };
  }

  // Get the earliest date across the Ethereum and Arbitrum records
  const arbitrumDate = records.treasuryArbitrum_tokenRecords[0].date;
  const ethereumDate = records.treasuryEthereum_tokenRecords[0].date;
  const earliestDate = new Date(arbitrumDate) < new Date(ethereumDate) ? new Date(arbitrumDate) : new Date(ethereumDate);

  // Filter the records to only include records up to the earliest date
  const filteredRecords = {
    treasuryArbitrum_tokenRecords: records.treasuryArbitrum_tokenRecords.filter((record) => new Date(record.date) <= earliestDate),
    treasuryEthereum_tokenRecords: records.treasuryEthereum_tokenRecords.filter((record) => new Date(record.date) <= earliestDate),
    treasuryFantom_tokenRecords: records.treasuryFantom_tokenRecords.filter((record) => new Date(record.date) <= earliestDate),
    treasuryPolygon_tokenRecords: records.treasuryPolygon_tokenRecords.filter((record) => new Date(record.date) <= earliestDate),
    treasuryBase_tokenRecords: records.treasuryBase_tokenRecords.filter((record) => new Date(record.date) <= earliestDate),
    treasuryBerachain_tokenRecords: records.treasuryBerachain_tokenRecords.filter((record) => new Date(record.date) <= earliestDate),
  };
  log.info(`${FUNC}: Filtered records up to latest consistent date: ${earliestDate.toISOString()}`);

  return filteredRecords;
}

export const flattenRecords = (records: TokenRecordsLatestResponseData, latestBlock: boolean, log: RequestLogger): TokenRecord[] => {
  const FUNC = "tokenRecord/flattenRecords";
  const combinedRecords: TokenRecord[] = [];

  const mapping = {
    [CHAIN_ARBITRUM]: records.treasuryArbitrum_tokenRecords,
    [CHAIN_ETHEREUM]: records.treasuryEthereum_tokenRecords,
    [CHAIN_FANTOM]: records.treasuryFantom_tokenRecords,
    [CHAIN_POLYGON]: records.treasuryPolygon_tokenRecords,
    [CHAIN_BASE]: records.treasuryBase_tokenRecords,
    [CHAIN_BERACHAIN]: records.treasuryBerachain_tokenRecords,
  };

  for (const [key, value] of Object.entries(mapping)) {
    log.info(`${FUNC}: Got ${value.length} ${key} records.`);
    let currentRecords: TokenRecord[] = value;

    if (latestBlock) {
      log.info(`${FUNC}: Filtering latest block for ${key} records with length ${currentRecords.length}`);
      currentRecords = filterLatestBlockByDay(currentRecords);
      log.info(`${FUNC}: Filtered latest block for ${key} records with revised length ${currentRecords.length}`);
    }

    combinedRecords.push(...currentRecords);
  }

  return combinedRecords;
};

export const getBlockByChain = (records: TokenRecord[], chain: string): number | null => {
  const chainRecords = records.filter((record) => record.blockchain === chain);

  return chainRecords.length > 0 ? +chainRecords[0].block : null;
}

/**
 * Determines whether the data across chains is complete.
 *
 * It determines this by checking if the date of the records across chains is the same.
 *
 * Assumptions:
 * - The data is sorted in descending order and for the same day
 * - Ethereum and Arbitrum have the bulk of assets, so we only check those two chains
 *
 * @param arbitrumRecords
 * @param ethereumRecords
 * @returns
 */
export const isCrossChainRecordDataComplete = (arbitrumRecords: TokenRecord[], ethereumRecords: TokenRecord[]): boolean => {
  if (!arbitrumRecords.length || !ethereumRecords.length) {
    return false;
  }

  const arbitrumDate = arbitrumRecords[0].date;
  const ethereumDate = ethereumRecords[0].date;

  return arbitrumDate === ethereumDate;
}
