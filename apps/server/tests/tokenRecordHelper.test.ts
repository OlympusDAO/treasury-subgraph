import { RequestLogger } from "@wundergraph/sdk/server";
import { TokenRecordsLatestResponseData } from "../.wundergraph/generated/models";
import { TokenRecord, filterCompleteRecords, filterLatestBlockByDay } from "../.wundergraph/tokenRecordHelper";

import { mock } from "jest-mock-extended";

const getSampleRecord = (id: string, date: string, block: number): TokenRecord => {
  return {
    id: id,
    date: date,
    block: block,
    timestamp: 0,
    balance: "0",
    blockchain: "",
    category: "",
    isBluechip: false,
    isLiquid: false,
    multiplier: "0",
    rate: "0",
    value: "0",
    valueExcludingOhm: "0",
    source: "",
    sourceAddress: "",
    token: "",
    tokenAddress: "",
  }
}

describe("filterLatestBlockByDay", () => {
  it("should return the latest block for each day", () => {
    const records = [
      getSampleRecord("1", "2021-01-01", 1),
      getSampleRecord("2", "2021-01-01", 2),
      getSampleRecord("3", "2021-01-02", 3),
      getSampleRecord("4", "2021-01-02", 4),
      getSampleRecord("5", "2021-01-03", 5),
      getSampleRecord("6", "2021-01-03", 6),
    ];

    const expected = [
      getSampleRecord("2", "2021-01-01", 2),
      getSampleRecord("4", "2021-01-02", 4),
      getSampleRecord("6", "2021-01-03", 6),
    ];

    const actual = filterLatestBlockByDay(records);

    expect(actual).toEqual(expected);
  });
});

describe("filterCompleteRecords", () => {
  let mockLog: RequestLogger;
  beforeAll(() => {
    mockLog = mock<RequestLogger>();
  });

  it("should return records up to the latest Arbitrum date if lagging", () => {
    const records: TokenRecordsLatestResponseData = {
      treasuryArbitrum_tokenRecords: [
        getSampleRecord("2", "2021-01-02", 2),
        getSampleRecord("1", "2021-01-01", 1),
      ],
      treasuryEthereum_tokenRecords: [
        getSampleRecord("3", "2021-01-03", 3),
        getSampleRecord("2", "2021-01-02", 2),
        getSampleRecord("1", "2021-01-01", 1),
      ],
      treasuryFantom_tokenRecords: [],
      treasuryPolygon_tokenRecords: []
    };

    const filteredRecords = filterCompleteRecords(records, mockLog);

    // Arbitrum and Ethereum records have the same latest date
    expect(filteredRecords.treasuryArbitrum_tokenRecords).toEqual([
      getSampleRecord("2", "2021-01-02", 2),
      getSampleRecord("1", "2021-01-01", 1),
    ]);
    expect(filteredRecords.treasuryEthereum_tokenRecords).toEqual([
      getSampleRecord("2", "2021-01-02", 2),
      getSampleRecord("1", "2021-01-01", 1),
    ]);
  });

  it("should return records up to the latest Ethereum date if lagging", () => {
    const records: TokenRecordsLatestResponseData = {
      treasuryArbitrum_tokenRecords: [
        getSampleRecord("3", "2021-01-03", 3),
        getSampleRecord("2", "2021-01-02", 2),
        getSampleRecord("1", "2021-01-01", 1),
      ],
      treasuryEthereum_tokenRecords: [
        getSampleRecord("2", "2021-01-02", 2),
        getSampleRecord("1", "2021-01-01", 1),
      ],
      treasuryFantom_tokenRecords: [],
      treasuryPolygon_tokenRecords: []
    };

    const filteredRecords = filterCompleteRecords(records, mockLog);

    // Arbitrum and Ethereum records have the same latest date
    expect(filteredRecords.treasuryArbitrum_tokenRecords).toEqual([
      getSampleRecord("2", "2021-01-02", 2),
      getSampleRecord("1", "2021-01-01", 1),
    ]);
    expect(filteredRecords.treasuryEthereum_tokenRecords).toEqual([
      getSampleRecord("2", "2021-01-02", 2),
      getSampleRecord("1", "2021-01-01", 1),
    ]);
  });

  it("should return no records if Ethereum length is 0", () => {
    const records: TokenRecordsLatestResponseData = {
      treasuryArbitrum_tokenRecords: [
        getSampleRecord("3", "2021-01-03", 3),
        getSampleRecord("2", "2021-01-02", 2),
        getSampleRecord("1", "2021-01-01", 1),
      ],
      treasuryEthereum_tokenRecords: [],
      treasuryFantom_tokenRecords: [],
      treasuryPolygon_tokenRecords: []
    };

    const filteredRecords = filterCompleteRecords(records, mockLog);

    expect(filteredRecords.treasuryArbitrum_tokenRecords).toEqual([]);
    expect(filteredRecords.treasuryEthereum_tokenRecords).toEqual([]);
  });

  it("should return no records if Arbitrum length is 0", () => {
    const records: TokenRecordsLatestResponseData = {
      treasuryArbitrum_tokenRecords: [],
      treasuryEthereum_tokenRecords: [
        getSampleRecord("3", "2021-01-03", 3),
        getSampleRecord("2", "2021-01-02", 2),
        getSampleRecord("1", "2021-01-01", 1),
      ],
      treasuryFantom_tokenRecords: [],
      treasuryPolygon_tokenRecords: []
    };

    const filteredRecords = filterCompleteRecords(records, mockLog);

    expect(filteredRecords.treasuryArbitrum_tokenRecords).toEqual([]);
    expect(filteredRecords.treasuryEthereum_tokenRecords).toEqual([]);
  });
});