import type { TokenSupply } from "../src/core/tokenSupplyHelper";

export type { TokenSupply };

export const filter = (
  records: TokenSupply[] | undefined,
  chain?: string,
  date?: string
): TokenSupply[] => {
  if (!records) {
    return [];
  }

  let filteredRecords = records;
  if (chain) {
    filteredRecords = filteredRecords.filter((record) => record.blockchain === chain);
  }

  if (date) {
    filteredRecords = filteredRecords.filter((record) => record.date == date);
  }

  return filteredRecords;
};

export const getFirstRecord = (
  records: TokenSupply[] | undefined,
  chain?: string,
  date?: string
): TokenSupply | null => {
  const filteredRecords = filter(records, chain, date);

  return filteredRecords.length > 0 ? filteredRecords[0] : null;
};
