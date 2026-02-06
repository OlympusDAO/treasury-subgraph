import { Logger, TokenSuppliesResponse } from "../src/core/types";
import type { TokenSupply } from "../src/core/tokenSupplyHelper";
import { filterCompleteRecords, filterLatestBlockByDay } from "../src/core/tokenSupplyHelper";

import { mock } from "jest-mock-extended";

const getSampleRecord = (id: string, date: string, block: number): TokenSupply => {
  return {
    id: id,
    date: date,
    block: block,
    timestamp: 0,
    balance: "0",
    blockchain: "",
    source: "",
    sourceAddress: "",
    token: "",
    tokenAddress: "",
    type: "",
    supplyBalance: "",
    pool: null,
    poolAddress: null,
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
  let mockLog: Logger;
  beforeAll(() => {
    mockLog = mock<Logger>();
  });

  it("should return records up to the latest Arbitrum date if lagging", () => {
    const records: TokenSuppliesResponse = {
      treasuryArbitrum_tokenSupplies: [
        getSampleRecord("2", "2021-01-02", 2),
        getSampleRecord("1", "2021-01-01", 1),
      ],
      treasuryBase_tokenSupplies: [],
      treasuryEthereum_tokenSupplies: [
        getSampleRecord("3", "2021-01-03", 3),
        getSampleRecord("2", "2021-01-02", 2),
        getSampleRecord("1", "2021-01-01", 1),
      ],
      treasuryFantom_tokenSupplies: [],
      treasuryPolygon_tokenSupplies: [],
      treasuryBerachain_tokenSupplies: []
    };

    const filteredRecords = filterCompleteRecords(records, mockLog);

    // Arbitrum and Ethereum records have the same latest date
    expect(filteredRecords.treasuryArbitrum_tokenSupplies).toEqual([
      getSampleRecord("2", "2021-01-02", 2),
      getSampleRecord("1", "2021-01-01", 1),
    ]);
    expect(filteredRecords.treasuryEthereum_tokenSupplies).toEqual([
      getSampleRecord("2", "2021-01-02", 2),
      getSampleRecord("1", "2021-01-01", 1),
    ]);
  });

  it("should return records up to the latest Ethereum date if lagging", () => {
    const records: TokenSuppliesResponse = {
      treasuryArbitrum_tokenSupplies: [
        getSampleRecord("3", "2021-01-03", 3),
        getSampleRecord("2", "2021-01-02", 2),
        getSampleRecord("1", "2021-01-01", 1),
      ],
      treasuryBase_tokenSupplies: [],
      treasuryEthereum_tokenSupplies: [
        getSampleRecord("2", "2021-01-02", 2),
        getSampleRecord("1", "2021-01-01", 1),
      ],
      treasuryFantom_tokenSupplies: [],
      treasuryPolygon_tokenSupplies: [],
      treasuryBerachain_tokenSupplies: []
    };

    const filteredRecords = filterCompleteRecords(records, mockLog);

    // Arbitrum and Ethereum records have the same latest date
    expect(filteredRecords.treasuryArbitrum_tokenSupplies).toEqual([
      getSampleRecord("2", "2021-01-02", 2),
      getSampleRecord("1", "2021-01-01", 1),
    ]);
    expect(filteredRecords.treasuryEthereum_tokenSupplies).toEqual([
      getSampleRecord("2", "2021-01-02", 2),
      getSampleRecord("1", "2021-01-01", 1),
    ]);
  });

  it("should return no records if Ethereum length is 0", () => {
    const records: TokenSuppliesResponse = {
      treasuryArbitrum_tokenSupplies: [
        getSampleRecord("3", "2021-01-03", 3),
        getSampleRecord("2", "2021-01-02", 2),
        getSampleRecord("1", "2021-01-01", 1),
      ],
      treasuryBase_tokenSupplies: [],
      treasuryEthereum_tokenSupplies: [],
      treasuryFantom_tokenSupplies: [],
      treasuryPolygon_tokenSupplies: [],
      treasuryBerachain_tokenSupplies: []
    };

    const filteredRecords = filterCompleteRecords(records, mockLog);

    expect(filteredRecords.treasuryArbitrum_tokenSupplies).toEqual([]);
    expect(filteredRecords.treasuryEthereum_tokenSupplies).toEqual([]);
  });

  it("should return no records if Arbitrum length is 0", () => {
    const records: TokenSuppliesResponse = {
      treasuryArbitrum_tokenSupplies: [],
      treasuryEthereum_tokenSupplies: [
        getSampleRecord("3", "2021-01-03", 3),
        getSampleRecord("2", "2021-01-02", 2),
        getSampleRecord("1", "2021-01-01", 1),
      ],
      treasuryBase_tokenSupplies: [],
      treasuryFantom_tokenSupplies: [],
      treasuryPolygon_tokenSupplies: [],
      treasuryBerachain_tokenSupplies: []
    };

    const filteredRecords = filterCompleteRecords(records, mockLog);

    expect(filteredRecords.treasuryArbitrum_tokenSupplies).toEqual([]);
    expect(filteredRecords.treasuryEthereum_tokenSupplies).toEqual([]);
  });
});
