import { CATEGORY_POL, CATEGORY_STABLE, CATEGORY_VOLATILE, CHAIN_ARBITRUM, CHAIN_ETHEREUM, CHAIN_FANTOM, CHAIN_POLYGON, TOKEN_SUPPLY_TYPE_BONDS_DEPOSITS, TOKEN_SUPPLY_TYPE_BONDS_PREMINTED, TOKEN_SUPPLY_TYPE_BONDS_VESTING_DEPOSITS, TOKEN_SUPPLY_TYPE_BOOSTED_LIQUIDITY_VAULT, TOKEN_SUPPLY_TYPE_LENDING, TOKEN_SUPPLY_TYPE_LIQUIDITY, TOKEN_SUPPLY_TYPE_OFFSET, TOKEN_SUPPLY_TYPE_TOTAL_SUPPLY, TOKEN_SUPPLY_TYPE_TREASURY } from "./constants";
import { ProtocolMetric } from "./protocolMetricHelper";
import { TokenRecord } from "./tokenRecordHelper";
import { TokenSupply } from "./tokenSupplyHelper";

//
// Customised for the treasury-subgraph repo
//

const OHM_ADDRESSES: string[] = [
  "0x64aa3364f17a4d01c6f1751fd97c2bd3d7e7f1d5".toLowerCase(), // Mainnet
  "0xf0cb2dc0db5e6c66B9a70Ac27B06b878da017028".toLowerCase(), // Arbitrum
];

const GOHM_ADDRESSES: string[] = [
  "0x0ab87046fBb341D058F17CBC4c1133F25a20a52f".toLowerCase(), // Mainnet
  "0x8D9bA570D6cb60C7e3e0F31343Efe75AB8E65FB1".toLowerCase(), // Arbitrum
];

const getOhmAddresses = (): string[] => {
  return OHM_ADDRESSES;
};

const getGOhmAddresses = (): string[] => {
  return GOHM_ADDRESSES;
};

export type RecordContainer = {
  tokenRecords: TokenRecord[];
  tokenSupplies: TokenSupply[];
  protocolMetrics: ProtocolMetric[];
};

type ChainValues = {
  [CHAIN_ARBITRUM]: number;
  [CHAIN_ETHEREUM]: number;
  [CHAIN_FANTOM]: number;
  [CHAIN_POLYGON]: number;
};

export type Metric = {
  date: string;
  /**
   * The block for each chain.
   */
  blocks: ChainValues;
  /**
   * The OHM index at the snapshot.
   */
  ohmIndex: number;
  ohmTotalSupply: number;
  ohmTotalSupplyComponents: ChainValues;
  ohmCirculatingSupply: number;
  ohmCirculatingSupplyComponents: ChainValues;
  ohmFloatingSupply: number;
  ohmFloatingSupplyComponents: ChainValues;
  ohmBackedSupply: number;
  ohmBackedSupplyComponents: ChainValues;
  ohmPrice: number;
  marketCap: number;
  treasuryMarketValue: number;
  treasuryMarketValueComponents: ChainValues;
  treasuryLiquidBacking: number;
  treasuryLiquidBackingComponents: ChainValues;
  treasuryLiquidBackingPerOhmFloating: number;
  treasuryLiquidBackingPerOhmBacked: number;
};

//
//  The rest of the file should be kept in sync with TreasuryQueryHelper in olympus-frontend
//

let supportedTokens: string[];
const getSupportedTokens = (): string[] => {
  if (!supportedTokens) {
    const tokens: string[] = [];
    tokens.push(...getOhmAddresses());
    tokens.push(...getGOhmAddresses());

    supportedTokens = tokens;
  }

  return supportedTokens;
};

const isSupportedToken = (record: TokenSupply) => {
  if (!getSupportedTokens().includes(record.tokenAddress.toLowerCase())) {
    return false;
  }

  return true;
};

const getBalanceMultiplier = (record: TokenSupply, ohmIndex: number): number => {
  if (getOhmAddresses().includes(record.tokenAddress.toLowerCase())) {
    return 1;
  }

  if (getGOhmAddresses().includes(record.tokenAddress.toLowerCase())) {
    return ohmIndex;
  }

  throw new Error(`Unsupported token address: ${record.tokenAddress}`);
};

/**
 * Returns the sum of balances for different supply types.
 *
 * Note that this will return positive or negative balances, depending on the type.
 *
 * For example, passing [TOKEN_SUPPLY_TYPE_LIQUIDITY, TOKEN_SUPPLY_TYPE_TREASURY]
 * in the {includedTypes} parameter will return a number that is
 * the sum of the supplyBalance property all records with matching types.
 *
 * @param records TokenSupply records for the given day
 * @param ohmIndex The index of OHM for the given day
 * @param includedTypes
 * @returns [balance, included records]
 */
const getSupplyBalanceForTypes = (
  records: TokenSupply[],
  includedTypes: string[],
  ohmIndex: number,
): [number, TokenSupply[]] => {
  const filteredRecords = records.filter(record => isSupportedToken(record) && includedTypes.includes(record.type));

  const supplyBalance = filteredRecords.reduce(
    (previousValue, record) => previousValue + +record.supplyBalance * getBalanceMultiplier(record, ohmIndex),
    0,
  );

  return [supplyBalance, filteredRecords];
};

/**
 * The block from which the inclusion of BLV in floating and circulating supply
 * was changed for the Ethereum subgraph.
 */
const ETHEREUM_BLV_INCLUSION_BLOCK = "17620000";

const isBLVIncluded = (records: TokenSupply[]): boolean => {
  // Filter for Ethereum records
  const ethereumRecords = records.filter(record => record.blockchain === CHAIN_ETHEREUM);
  if (!ethereumRecords.length) {
    return false;
  }

  // Get the block number of the first Ethereum record
  const firstEthereumRecord = ethereumRecords[0];
  const firstEthereumRecordBlock = firstEthereumRecord.block;

  // If the first Ethereum record is before the BLV inclusion block, then BLV is included in calculations
  if (Number(firstEthereumRecordBlock) < Number(ETHEREUM_BLV_INCLUSION_BLOCK)) {
    return true;
  }

  return false;
}

/**
 * For a given array of TokenSupply records (assumed to be at the same point in time),
 * this function returns the OHM circulating supply.
 *
 * Circulating supply is defined as:
 * - OHM total supply
 * - minus: OHM in circulating supply wallets
 * - minus: migration offset
 * - minus: pre-minted OHM for bonds
 * - minus: OHM user deposits for bonds
 * - minus: OHM in boosted liquidity vaults (before `BLV_INCLUSION_BLOCK`)
 *
 * @param records TokenSupply records for the given day
 * @param ohmIndex The index of OHM for the given day
 * @returns
 */
export const getOhmCirculatingSupply = (records: TokenSupply[], ohmIndex: number): [number, TokenSupply[]] => {
  const includedTypes = [
    TOKEN_SUPPLY_TYPE_TOTAL_SUPPLY,
    TOKEN_SUPPLY_TYPE_TREASURY,
    TOKEN_SUPPLY_TYPE_OFFSET,
    TOKEN_SUPPLY_TYPE_BONDS_PREMINTED,
    TOKEN_SUPPLY_TYPE_BONDS_VESTING_DEPOSITS,
    TOKEN_SUPPLY_TYPE_BONDS_DEPOSITS,
  ];

  if (isBLVIncluded(records)) {
    includedTypes.push(TOKEN_SUPPLY_TYPE_BOOSTED_LIQUIDITY_VAULT);
  }

  return getSupplyBalanceForTypes(records, includedTypes, ohmIndex);
};

/**
 * For a given array of TokenSupply records (assumed to be at the same point in time),
 * this function returns the OHM floating supply.
 *
 * Floating supply is defined as:
 * - OHM total supply
 * - minus: OHM in circulating supply wallets
 * - minus: migration offset
 * - minus: pre-minted OHM for bonds
 * - minus: OHM user deposits for bonds
 * - minus: protocol-owned OHM in liquidity pools
 * - minus: OHM in boosted liquidity vaults (before `BLV_INCLUSION_BLOCK`)
 *
 * @param records TokenSupply records for the given day
 * @param ohmIndex The index of OHM for the given day
 * @returns
 */
export const getOhmFloatingSupply = (records: TokenSupply[], ohmIndex: number): [number, TokenSupply[]] => {
  const includedTypes = [
    TOKEN_SUPPLY_TYPE_TOTAL_SUPPLY,
    TOKEN_SUPPLY_TYPE_TREASURY,
    TOKEN_SUPPLY_TYPE_OFFSET,
    TOKEN_SUPPLY_TYPE_BONDS_PREMINTED,
    TOKEN_SUPPLY_TYPE_BONDS_VESTING_DEPOSITS,
    TOKEN_SUPPLY_TYPE_BONDS_DEPOSITS,
    TOKEN_SUPPLY_TYPE_LIQUIDITY,
  ];

  if (isBLVIncluded(records)) {
    includedTypes.push(TOKEN_SUPPLY_TYPE_BOOSTED_LIQUIDITY_VAULT);
  }

  return getSupplyBalanceForTypes(records, includedTypes, ohmIndex);
};

/**
 * For a given array of TokenSupply records (assumed to be at the same point in time),
 * this function returns the OHM backed supply.
 *
 * Backed supply is the quantity of OHM backed by treasury assets.
 *
 * Backed supply is calculated as:
 * - OHM total supply
 * - minus: OHM in circulating supply wallets
 * - minus: migration offset
 * - minus: pre-minted OHM for bonds
 * - minus: OHM user deposits for bonds
 * - minus: protocol-owned OHM in liquidity pools
 * - minus: OHM in boosted liquidity vaults
 * - minus: OHM minted and deployed into lending markets
 *
 * @param records TokenSupply records for the given day
 * @param ohmIndex The index of OHM for the given day
 */
export const getOhmBackedSupply = (records: TokenSupply[], ohmIndex: number): [number, TokenSupply[]] => {
  const includedTypes = [
    TOKEN_SUPPLY_TYPE_TOTAL_SUPPLY,
    TOKEN_SUPPLY_TYPE_TREASURY,
    TOKEN_SUPPLY_TYPE_OFFSET,
    TOKEN_SUPPLY_TYPE_BONDS_PREMINTED,
    TOKEN_SUPPLY_TYPE_BONDS_VESTING_DEPOSITS,
    TOKEN_SUPPLY_TYPE_BONDS_DEPOSITS,
    TOKEN_SUPPLY_TYPE_LIQUIDITY,
    TOKEN_SUPPLY_TYPE_BOOSTED_LIQUIDITY_VAULT,
    TOKEN_SUPPLY_TYPE_LENDING,
  ];

  return getSupplyBalanceForTypes(records, includedTypes, ohmIndex);
};

/**
 * For a given array of TokenSupply records (assumed to be at the same point in time),
 * this function returns the OHM total supply.
 *
 * @param records TokenSupply records for the given day
 * @param ohmIndex The index of OHM for the given day
 * @returns
 */
export const getOhmTotalSupply = (records: TokenSupply[], ohmIndex: number): [number, TokenSupply[]] => {
  return getSupplyBalanceForTypes(records, [TOKEN_SUPPLY_TYPE_TOTAL_SUPPLY], ohmIndex);
}

//
// TokenRecord metrics
//

const reduce = (
  records: TokenRecord[],
  valueExcludingOhm = false,
): number => {
  return records.reduce((previousValue, currentRecord) => {
    return previousValue + (valueExcludingOhm ? +currentRecord.valueExcludingOhm : +currentRecord.value);
  }, 0);
}

export const getTreasuryAssetValue = (
  records: TokenRecord[],
  liquidBacking: boolean,
  categories = [CATEGORY_STABLE, CATEGORY_VOLATILE, CATEGORY_POL],
): [number, TokenRecord[]] => {
  const filteredRecords = records.filter(record => categories.includes(record.category) && (liquidBacking ? record.isLiquid == true : true));

  return [reduce(filteredRecords, liquidBacking), filteredRecords];
};

export const getLiquidBackingPerOhmBacked = (tokenRecords: TokenRecord[], tokenSupplies: TokenSupply[], ohmIndex: number) =>
  getTreasuryAssetValue(tokenRecords, true)[0] / getOhmBackedSupply(tokenSupplies, ohmIndex)[0];

export const getLiquidBackingPerOhmFloating = (tokenRecords: TokenRecord[], tokenSupplies: TokenSupply[], ohmIndex: number) =>
  getTreasuryAssetValue(tokenRecords, true)[0] / getOhmFloatingSupply(tokenSupplies, ohmIndex)[0];

const filterByChain = (tokenRecords: TokenRecord[], tokenSupplies: TokenSupply[], chain: string): [TokenRecord[], TokenSupply[]] => {
  const filteredRecords = tokenRecords.filter(record => record.blockchain === chain);
  const filteredSupplies = tokenSupplies.filter(record => record.blockchain === chain);

  return [filteredRecords, filteredSupplies];
}

const getBlock = (tokenRecords: TokenRecord[]): number => {
  if (!tokenRecords.length) {
    return 0;
  }

  return +tokenRecords[0].block;
}

export const getMetricObject = (tokenRecords: TokenRecord[], tokenSupplies: TokenSupply[], protocolMetrics: ProtocolMetric[]): Metric | null => {
  if (!tokenRecords.length || !tokenSupplies.length || !protocolMetrics.length) {
    return null;
  }

  const currentOhmIndex: number = +protocolMetrics[0].currentIndex;
  const ohmPrice: number = +protocolMetrics[0].ohmPrice;
  const ohmCirculatingSupply: number = getOhmCirculatingSupply(tokenSupplies, currentOhmIndex)[0];

  // Obtain per-chain arrays
  const [arbitrumTokenRecords, arbitrumTokenSupplies] = filterByChain(tokenRecords, tokenSupplies, CHAIN_ARBITRUM);
  const [ethereumTokenRecords, ethereumTokenSupplies] = filterByChain(tokenRecords, tokenSupplies, CHAIN_ETHEREUM);
  const [fantomTokenRecords, fantomTokenSupplies] = filterByChain(tokenRecords, tokenSupplies, CHAIN_FANTOM);
  const [polygonTokenRecords, polygonTokenSupplies] = filterByChain(tokenRecords, tokenSupplies, CHAIN_POLYGON);

  return {
    date: tokenRecords[0].date,
    blocks: {
      [CHAIN_ARBITRUM]: getBlock(arbitrumTokenRecords),
      [CHAIN_ETHEREUM]: getBlock(ethereumTokenRecords),
      [CHAIN_FANTOM]: getBlock(fantomTokenRecords),
      [CHAIN_POLYGON]: getBlock(polygonTokenRecords),
    },
    ohmIndex: currentOhmIndex,
    ohmTotalSupply: getOhmTotalSupply(tokenSupplies, currentOhmIndex)[0],
    ohmTotalSupplyComponents: {
      [CHAIN_ARBITRUM]: getOhmTotalSupply(arbitrumTokenSupplies, currentOhmIndex)[0],
      [CHAIN_ETHEREUM]: getOhmTotalSupply(ethereumTokenSupplies, currentOhmIndex)[0],
      [CHAIN_FANTOM]: getOhmTotalSupply(fantomTokenSupplies, currentOhmIndex)[0],
      [CHAIN_POLYGON]: getOhmTotalSupply(polygonTokenSupplies, currentOhmIndex)[0],
    },
    ohmCirculatingSupply: ohmCirculatingSupply,
    ohmCirculatingSupplyComponents: {
      [CHAIN_ARBITRUM]: getOhmCirculatingSupply(arbitrumTokenSupplies, currentOhmIndex)[0],
      [CHAIN_ETHEREUM]: getOhmCirculatingSupply(ethereumTokenSupplies, currentOhmIndex)[0],
      [CHAIN_FANTOM]: getOhmCirculatingSupply(fantomTokenSupplies, currentOhmIndex)[0],
      [CHAIN_POLYGON]: getOhmCirculatingSupply(polygonTokenSupplies, currentOhmIndex)[0],
    },
    ohmFloatingSupply: getOhmFloatingSupply(tokenSupplies, currentOhmIndex)[0],
    ohmFloatingSupplyComponents: {
      [CHAIN_ARBITRUM]: getOhmFloatingSupply(arbitrumTokenSupplies, currentOhmIndex)[0],
      [CHAIN_ETHEREUM]: getOhmFloatingSupply(ethereumTokenSupplies, currentOhmIndex)[0],
      [CHAIN_FANTOM]: getOhmFloatingSupply(fantomTokenSupplies, currentOhmIndex)[0],
      [CHAIN_POLYGON]: getOhmFloatingSupply(polygonTokenSupplies, currentOhmIndex)[0],
    },
    ohmBackedSupply: getOhmBackedSupply(tokenSupplies, currentOhmIndex)[0],
    ohmBackedSupplyComponents: {
      [CHAIN_ARBITRUM]: getOhmBackedSupply(arbitrumTokenSupplies, currentOhmIndex)[0],
      [CHAIN_ETHEREUM]: getOhmBackedSupply(ethereumTokenSupplies, currentOhmIndex)[0],
      [CHAIN_FANTOM]: getOhmBackedSupply(fantomTokenSupplies, currentOhmIndex)[0],
      [CHAIN_POLYGON]: getOhmBackedSupply(polygonTokenSupplies, currentOhmIndex)[0],
    },
    ohmPrice: ohmPrice,
    marketCap: ohmPrice * ohmCirculatingSupply,
    treasuryMarketValue: getTreasuryAssetValue(tokenRecords, false)[0],
    treasuryMarketValueComponents: {
      [CHAIN_ARBITRUM]: getTreasuryAssetValue(arbitrumTokenRecords, false)[0],
      [CHAIN_ETHEREUM]: getTreasuryAssetValue(ethereumTokenRecords, false)[0],
      [CHAIN_FANTOM]: getTreasuryAssetValue(fantomTokenRecords, false)[0],
      [CHAIN_POLYGON]: getTreasuryAssetValue(polygonTokenRecords, false)[0],
    },
    treasuryLiquidBacking: getTreasuryAssetValue(tokenRecords, true)[0],
    treasuryLiquidBackingComponents: {
      [CHAIN_ARBITRUM]: getTreasuryAssetValue(arbitrumTokenRecords, true)[0],
      [CHAIN_ETHEREUM]: getTreasuryAssetValue(ethereumTokenRecords, true)[0],
      [CHAIN_FANTOM]: getTreasuryAssetValue(fantomTokenRecords, true)[0],
      [CHAIN_POLYGON]: getTreasuryAssetValue(polygonTokenRecords, true)[0],
    },
    treasuryLiquidBackingPerOhmFloating: getLiquidBackingPerOhmFloating(tokenRecords, tokenSupplies, currentOhmIndex),
    treasuryLiquidBackingPerOhmBacked: getLiquidBackingPerOhmBacked(tokenRecords, tokenSupplies, currentOhmIndex),
  }
};

export const sortRecordsDescending = (records: Metric[]): Metric[] => {
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
