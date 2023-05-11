import { TokenSuppliesResponseData } from "../.wundergraph/generated/models";

export type TokenSupply = TokenSuppliesResponseData["treasuryEthereum_tokenSupplies"][0];

export const filter = (records: TokenSupply[] | undefined, chain?: string, date?: string): TokenSupply[] => {
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

export const getFirstRecord = (records: TokenSupply[] | undefined, chain?: string, date?: string): TokenSupply | null => {
  const filteredRecords = filter(records, chain, date);

  return filteredRecords.length > 0 ? filteredRecords[0] : null;
};
