import { TokenRecordsResponseData } from "../.wundergraph/generated/models";

export type TokenRecord = TokenRecordsResponseData["treasuryEthereum_tokenRecords"][0];

export const filter = (records: TokenRecord[] | undefined, chain?: string, date?: string): TokenRecord[] => {
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

export const getFirstRecord = (records: TokenRecord[] | undefined, chain?: string, date?: string): TokenRecord | null => {
  const filteredRecords = filter(records, chain, date);

  return filteredRecords.length > 0 ? filteredRecords[0] : null;
};

export const filterReduce = (
  records: TokenRecord[],
  filterPredicate: (value: TokenRecord) => unknown,
  valueExcludingOhm = false,
): number => {
  return records.filter(filterPredicate).reduce((previousValue, currentRecord) => {
    return previousValue + (valueExcludingOhm ? +currentRecord.valueExcludingOhm : +currentRecord.value);
  }, 0);
};
