import { CHAIN_ARBITRUM, CHAIN_BASE, CHAIN_BERACHAIN, CHAIN_ETHEREUM, CHAIN_FANTOM, CHAIN_POLYGON } from "./constants";
import { TokenRecord, TokenRecordsResponse, Logger } from "./types";
import { parseNumber } from "./numberHelper";

export type { TokenRecord };

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
 * Only checks Arbitrum and Ethereum for completeness.
 * For the LATEST date only: if Arbitrum OR Ethereum is missing data for that date,
 * exclude ALL records for that date. Keep all other dates.
 *
 * @param records
 */
export const filterCompleteRecords = (records: TokenRecordsResponse, log: Logger): TokenRecordsResponse => {
  const FUNC = `tokenRecord/filterCompleteRecords`;

  // Only check Arbitrum and Ethereum for completeness
  const arbitrumDates = new Set(records.treasuryArbitrum_tokenRecords.map(r => r.date));
  const ethereumDates = new Set(records.treasuryEthereum_tokenRecords.map(r => r.date));

  const sortedArbitrumDates = Array.from(arbitrumDates).sort();
  const sortedEthereumDates = Array.from(ethereumDates).sort();

  log.info(`${FUNC}: Arbitrum has ${arbitrumDates.size} dates: [${sortedArbitrumDates.join(', ')}]`);
  log.info(`${FUNC}: Ethereum has ${ethereumDates.size} dates: [${sortedEthereumDates.join(', ')}]`);

  if (!arbitrumDates.size || !ethereumDates.size) {
    log.warn(`${FUNC}: Arbitrum or Ethereum records are empty.`);
    return {
      treasuryArbitrum_tokenRecords: [],
      treasuryEthereum_tokenRecords: [],
      treasuryFantom_tokenRecords: [],
      treasuryPolygon_tokenRecords: [],
      treasuryBase_tokenRecords: [],
      treasuryBerachain_tokenRecords: [],
    };
  }

  // Find dates where BOTH Arbitrum and Ethereum have data
  const completeDates = new Set<string>();
  for (const date of arbitrumDates) {
    if (ethereumDates.has(date)) {
      completeDates.add(date);
    }
  }

  // Find dates that are in one but not the other
  const arbitrumOnly = Array.from(arbitrumDates).filter(d => !ethereumDates.has(d)).sort();
  const ethereumOnly = Array.from(ethereumDates).filter(d => !arbitrumDates.has(d)).sort();

  if (arbitrumOnly.length > 0) {
    log.warn(`${FUNC}: Dates only in Arbitrum: [${arbitrumOnly.join(', ')}]`);
  }
  if (ethereumOnly.length > 0) {
    log.warn(`${FUNC}: Dates only in Ethereum: [${ethereumOnly.join(', ')}]`);
  }

  log.info(`${FUNC}: Found ${completeDates.size} dates with data in both Arbitrum and Ethereum: [${Array.from(completeDates).sort().join(', ')}]`);

  if (completeDates.size === 0) {
    log.warn(`${FUNC}: No dates with data in both Arbitrum and Ethereum.`);
    return {
      treasuryArbitrum_tokenRecords: [],
      treasuryEthereum_tokenRecords: [],
      treasuryFantom_tokenRecords: [],
      treasuryPolygon_tokenRecords: [],
      treasuryBase_tokenRecords: [],
      treasuryBerachain_tokenRecords: [],
    };
  }

  // Find the latest complete date
  const sortedCompleteDates = Array.from(completeDates).sort();
  const latestCompleteDate = sortedCompleteDates[sortedCompleteDates.length - 1];

  log.info(`${FUNC}: Latest complete date is ${latestCompleteDate}`);

  // Filter out records with dates newer than the latest complete date
  const filteredRecords: TokenRecordsResponse = {
    treasuryArbitrum_tokenRecords: records.treasuryArbitrum_tokenRecords.filter(r => r.date <= latestCompleteDate),
    treasuryEthereum_tokenRecords: records.treasuryEthereum_tokenRecords.filter(r => r.date <= latestCompleteDate),
    treasuryFantom_tokenRecords: records.treasuryFantom_tokenRecords.filter(r => r.date <= latestCompleteDate),
    treasuryPolygon_tokenRecords: records.treasuryPolygon_tokenRecords.filter(r => r.date <= latestCompleteDate),
    treasuryBase_tokenRecords: records.treasuryBase_tokenRecords.filter(r => r.date <= latestCompleteDate),
    treasuryBerachain_tokenRecords: records.treasuryBerachain_tokenRecords.filter(r => r.date <= latestCompleteDate),
  };

  log.info(`${FUNC}: After filtering - Arbitrum: ${filteredRecords.treasuryArbitrum_tokenRecords.length}, Ethereum: ${filteredRecords.treasuryEthereum_tokenRecords.length}`);

  return filteredRecords;
}

export const flattenRecords = (records: TokenRecordsResponse, latestBlock: boolean, log: Logger): TokenRecord[] => {
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
