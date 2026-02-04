import { CHAIN_ARBITRUM, CHAIN_BASE, CHAIN_BERACHAIN, CHAIN_ETHEREUM, CHAIN_FANTOM, CHAIN_POLYGON } from "./constants";
import { TokenSupply, TokenSuppliesResponse, Logger } from "./types";
import { parseNumber } from "./numberHelper";

export type { TokenSupply };

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
 * Only checks Arbitrum and Ethereum for completeness.
 * For the LATEST date only: if Arbitrum OR Ethereum is missing data for that date,
 * exclude ALL records for that date. Keep all other dates.
 *
 * @param records
 */
export const filterCompleteRecords = (records: TokenSuppliesResponse, log: Logger): TokenSuppliesResponse => {
  const FUNC = `tokenSupply/filterCompleteRecords`;

  // Only check Arbitrum and Ethereum for completeness
  const arbitrumDates = new Set(records.treasuryArbitrum_tokenSupplies.map(r => r.date));
  const ethereumDates = new Set(records.treasuryEthereum_tokenSupplies.map(r => r.date));

  if (!arbitrumDates.size || !ethereumDates.size) {
    log.warn(`${FUNC}: Arbitrum or Ethereum records are empty.`);
    return {
      treasuryArbitrum_tokenSupplies: [],
      treasuryEthereum_tokenSupplies: [],
      treasuryFantom_tokenSupplies: [],
      treasuryPolygon_tokenSupplies: [],
      treasuryBase_tokenSupplies: [],
      treasuryBerachain_tokenSupplies: [],
    };
  }

  // Find dates where BOTH Arbitrum and Ethereum have data
  const completeDates = new Set<string>();
  for (const date of arbitrumDates) {
    if (ethereumDates.has(date)) {
      completeDates.add(date);
    }
  }

  if (completeDates.size === 0) {
    log.warn(`${FUNC}: No dates with data in both Arbitrum and Ethereum.`);
    return {
      treasuryArbitrum_tokenSupplies: [],
      treasuryEthereum_tokenSupplies: [],
      treasuryFantom_tokenSupplies: [],
      treasuryPolygon_tokenSupplies: [],
      treasuryBase_tokenSupplies: [],
      treasuryBerachain_tokenSupplies: [],
    };
  }

  // Find the latest complete date
  const sortedCompleteDates = Array.from(completeDates).sort();
  const latestCompleteDate = sortedCompleteDates[sortedCompleteDates.length - 1];

  // Filter out records with dates newer than the latest complete date
  const filteredRecords: TokenSuppliesResponse = {
    treasuryArbitrum_tokenSupplies: records.treasuryArbitrum_tokenSupplies.filter(r => r.date <= latestCompleteDate),
    treasuryEthereum_tokenSupplies: records.treasuryEthereum_tokenSupplies.filter(r => r.date <= latestCompleteDate),
    treasuryFantom_tokenSupplies: records.treasuryFantom_tokenSupplies.filter(r => r.date <= latestCompleteDate),
    treasuryPolygon_tokenSupplies: records.treasuryPolygon_tokenSupplies.filter(r => r.date <= latestCompleteDate),
    treasuryBase_tokenSupplies: records.treasuryBase_tokenSupplies.filter(r => r.date <= latestCompleteDate),
    treasuryBerachain_tokenSupplies: records.treasuryBerachain_tokenSupplies.filter(r => r.date <= latestCompleteDate),
  };

  log.info(`${FUNC}: Filtered out dates after ${latestCompleteDate} (latest date with data in both Arbitrum and Ethereum)`);

  return filteredRecords;
}

export const flattenRecords = (records: TokenSuppliesResponse, blockchain: boolean, latestBlock: boolean, log: Logger): TokenSupply[] => {
  const FUNC = "tokenSupply/flattenRecords";
  const combinedRecords: TokenSupply[] = [];

  const mapping = {
    [CHAIN_ARBITRUM]: records.treasuryArbitrum_tokenSupplies,
    [CHAIN_ETHEREUM]: records.treasuryEthereum_tokenSupplies,
    [CHAIN_FANTOM]: records.treasuryFantom_tokenSupplies,
    [CHAIN_POLYGON]: records.treasuryPolygon_tokenSupplies,
    [CHAIN_BASE]: records.treasuryBase_tokenSupplies,
    [CHAIN_BERACHAIN]: records.treasuryBerachain_tokenSupplies,
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
