import { RequestLogger } from "@wundergraph/sdk/server";
import { parseNumber } from "../tests/numberHelper";
import { CHAIN_ARBITRUM, CHAIN_ETHEREUM, CHAIN_FANTOM, CHAIN_POLYGON } from "./constants";
import { TokenRecordsLatestResponseData } from "./generated/models";

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

export const flattenRecords = (records: TokenRecordsLatestResponseData, latestBlock: boolean, log: RequestLogger): TokenRecord[] => {
  const FUNC = "tokenRecord/flattenRecords";
  const combinedRecords: TokenRecord[] = [];

  const mapping = {
    [CHAIN_ARBITRUM]: records.treasuryArbitrum_tokenRecords,
    [CHAIN_ETHEREUM]: records.treasuryEthereum_tokenRecords,
    [CHAIN_FANTOM]: records.treasuryFantom_tokenRecords,
    [CHAIN_POLYGON]: records.treasuryPolygon_tokenRecords,
  };

  for (const [key, value] of Object.entries(mapping)) {
    log.debug(`${FUNC}: Got ${value.length} ${key} records.`);
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
