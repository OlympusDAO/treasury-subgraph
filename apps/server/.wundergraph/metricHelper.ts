import { CATEGORY_POL, CATEGORY_STABLE, CATEGORY_VOLATILE, CHAIN_ARBITRUM, CHAIN_ETHEREUM, CHAIN_FANTOM, CHAIN_POLYGON, Chains, TOKEN_SUPPLY_TYPE_BONDS_DEPOSITS, TOKEN_SUPPLY_TYPE_BONDS_PREMINTED, TOKEN_SUPPLY_TYPE_BONDS_VESTING_DEPOSITS, TOKEN_SUPPLY_TYPE_BONDS_VESTING_TOKENS, TOKEN_SUPPLY_TYPE_BOOSTED_LIQUIDITY_VAULT, TOKEN_SUPPLY_TYPE_LENDING, TOKEN_SUPPLY_TYPE_LIQUIDITY, TOKEN_SUPPLY_TYPE_OFFSET, TOKEN_SUPPLY_TYPE_TOTAL_SUPPLY, TOKEN_SUPPLY_TYPE_TREASURY, TokenSupplyCategories } from "./constants";
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

type ChainValues = Record<Chains, number>;

type ChainRecords = Record<Chains, TokenRecord[]>;

type ChainSupplies = Record<Chains, TokenSupply[]>;

type SupplyCategoryValues = Record<TokenSupplyCategories, number>;

type SupplyCategoryRecords = Record<TokenSupplyCategories, TokenSupply[]>;

type SupplyValue = {
  balance: number;
  supplyBalance: number;
  chainSupplyBalances: ChainValues;
  records: TokenSupply[];
  chainRecords: ChainSupplies;
};

type AssetValue = {
  marketValue: number;
  marketValueRecords: TokenRecord[];
  marketValueChainValues: ChainValues;
  marketValueChainRecords: ChainRecords;
  liquidBacking: number;
  liquidBackingRecords: TokenRecord[];
  liquidBackingChainValues: ChainValues;
  liquidBackingChainRecords: ChainRecords;
}

export type Metric = {
  date: string;
  /**
   * The block for each chain.
   */
  blocks: ChainValues;
  /**
   * The Unix epoch timestamp (in seconds) for each chain.
   */
  timestamps: ChainValues;
  /**
   * The OHM index at the snapshot.
   */
  ohmIndex: number;
  /**
   * The OHM APY at the snapshot.
   */
  ohmApy: number;
  ohmTotalSupply: number;
  ohmTotalSupplyComponents: ChainValues;
  ohmTotalSupplyRecords?: ChainSupplies;
  ohmCirculatingSupply: number;
  ohmCirculatingSupplyComponents: ChainValues;
  ohmCirculatingSupplyRecords?: ChainSupplies;
  ohmFloatingSupply: number;
  ohmFloatingSupplyComponents: ChainValues;
  ohmFloatingSupplyRecords?: ChainSupplies;
  ohmBackedSupply: number;
  gOhmBackedSupply: number;
  ohmBackedSupplyComponents: ChainValues;
  ohmBackedSupplyRecords?: ChainSupplies;
  ohmSupplyCategories: SupplyCategoryValues;
  ohmPrice: number;
  gOhmPrice: number;
  marketCap: number;
  sOhmCirculatingSupply: number;
  sOhmTotalValueLocked: number;
  treasuryMarketValue: number;
  treasuryMarketValueComponents: ChainValues;
  treasuryMarketValueRecords?: ChainRecords;
  treasuryLiquidBacking: number;
  treasuryLiquidBackingComponents: ChainValues;
  treasuryLiquidBackingRecords?: ChainRecords;
  treasuryLiquidBackingPerOhmFloating: number;
  treasuryLiquidBackingPerOhmBacked: number;
  treasuryLiquidBackingPerGOhmBacked: number;
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

const getBalancesForTypes = (
  records: TokenSupply[],
  ohmIndex: number,
): [number, number] => {
  const [balance, supplyBalance] = records.reduce(
    ([previousBalance, previousSupplyBalance], record) => {
      const balanceMultiplier = getBalanceMultiplier(record, ohmIndex);

      return [
        previousBalance + +record.balance * balanceMultiplier,
        previousSupplyBalance + +record.supplyBalance * balanceMultiplier,
      ];
    },
    [0, 0],
  );

  return [balance, supplyBalance];
}

/**
 * Returns the sums and records for different supply types.
 * 
 * This will be commonly used to bootstrap the SupplyCategoryRecords object.
 * 
 * @param records 
 * @param includedTypes 
 * @param ohmIndex 
 * @returns 
 */
const getTokenSupplyRecordsForTypes = (
  records: TokenSupply[],
  includedTypes: string[],
  ohmIndex: number,
): [number, number, TokenSupply[]] => {
  const includedRecords = records.filter(record => includedTypes.includes(record.type) && isSupportedToken(record));

  const [balance, supplyBalance] = getBalancesForTypes(includedRecords, ohmIndex);

  return [balance, supplyBalance, includedRecords];
}

/**
 * Returns the sums and records for different supply types.
 *
 * For example, passing [TOKEN_SUPPLY_TYPE_LIQUIDITY, TOKEN_SUPPLY_TYPE_TREASURY]
 * in the {includedTypes} parameter will return:
 * - sum of the balance property for all records with matching types
 * - sum of the supplyBalance property for all records with matching types
 * - all records with matching types
 *
 * @param records SupplyCategoryRecords records for the given day
 * @param includedTypes
 * @param ohmIndex The index of OHM for the given day
 * @returns [balance, supply balance, included records]
 */
const getRecordsForTypes = (
  records: SupplyCategoryRecords,
  includedTypes: TokenSupplyCategories[],
  ohmIndex: number,
): SupplyValue => {
  // For each value in includedTypes, get the corresponding array of records and combine into a single array
  const [includedRecords, chainSupplies] = includedTypes.reduce((previousRecords, currentType) => {
    const currentTypeRecords: TokenSupply[] = records[currentType];
    const previousChainRecords: ChainSupplies = previousRecords[1];

    const allRecords = [...previousRecords[0], ...currentTypeRecords];
    const allChainRecords: ChainSupplies = {
      [Chains.ARBITRUM]: [...previousChainRecords[Chains.ARBITRUM], ...currentTypeRecords.filter(record => record.blockchain === CHAIN_ARBITRUM)],
      [Chains.ETHEREUM]: [...previousChainRecords[Chains.ETHEREUM], ...currentTypeRecords.filter(record => record.blockchain === CHAIN_ETHEREUM)],
      [Chains.FANTOM]: [...previousChainRecords[Chains.FANTOM], ...currentTypeRecords.filter(record => record.blockchain === CHAIN_FANTOM)],
      [Chains.POLYGON]: [...previousChainRecords[Chains.POLYGON], ...currentTypeRecords.filter(record => record.blockchain === CHAIN_POLYGON)],
    };

    return [allRecords, allChainRecords];
  }, [[] as TokenSupply[], {
    [Chains.ARBITRUM]: [] as TokenSupply[],
    [Chains.ETHEREUM]: [] as TokenSupply[],
    [Chains.FANTOM]: [] as TokenSupply[],
    [Chains.POLYGON]: [] as TokenSupply[],
  } as ChainSupplies]);

  const [balance, supplyBalance] = getBalancesForTypes(includedRecords, ohmIndex);
  const chainSupplyBalances = {
    [Chains.ARBITRUM]: getBalancesForTypes(chainSupplies[Chains.ARBITRUM], ohmIndex)[1],
    [Chains.ETHEREUM]: getBalancesForTypes(chainSupplies[Chains.ETHEREUM], ohmIndex)[1],
    [Chains.FANTOM]: getBalancesForTypes(chainSupplies[Chains.FANTOM], ohmIndex)[1],
    [Chains.POLYGON]: getBalancesForTypes(chainSupplies[Chains.POLYGON], ohmIndex)[1],
  }

  return {
    balance,
    supplyBalance,
    chainSupplyBalances: chainSupplyBalances,
    records: includedRecords,
    chainRecords: chainSupplies,
  };
};

/**
 * The block from which the inclusion of BLV in floating and circulating supply
 * was changed for the Ethereum subgraph.
 */
const ETHEREUM_BLV_INCLUSION_BLOCK = "17620000";

const isBLVIncluded = (ethereumBlock: number): boolean => {
  // If the first Ethereum record is before the BLV inclusion block, then BLV is included in calculations
  if (ethereumBlock < Number(ETHEREUM_BLV_INCLUSION_BLOCK)) {
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
export const getOhmCirculatingSupply = (records: SupplyCategoryRecords, ethereumBlock: number, ohmIndex: number): SupplyValue => {
  const includedTypes: TokenSupplyCategories[] = [
    TokenSupplyCategories.TOTAL_SUPPLY,
    TokenSupplyCategories.TREASURY,
    TokenSupplyCategories.OFFSET,
    TokenSupplyCategories.BONDS_PREMINTED,
    TokenSupplyCategories.BONDS_VESTING_DEPOSITS,
    TokenSupplyCategories.BONDS_DEPOSITS,
  ];

  if (isBLVIncluded(ethereumBlock)) {
    includedTypes.push(TokenSupplyCategories.BOOSTED_LIQUIDITY_VAULT);
  }

  return getRecordsForTypes(records, includedTypes, ohmIndex);
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
export const getOhmFloatingSupply = (records: SupplyCategoryRecords, ethereumBlock: number, ohmIndex: number): SupplyValue => {
  const includedTypes: TokenSupplyCategories[] = [
    TokenSupplyCategories.TOTAL_SUPPLY,
    TokenSupplyCategories.TREASURY,
    TokenSupplyCategories.OFFSET,
    TokenSupplyCategories.BONDS_PREMINTED,
    TokenSupplyCategories.BONDS_VESTING_DEPOSITS,
    TokenSupplyCategories.BONDS_DEPOSITS,
    TokenSupplyCategories.LIQUIDITY,
  ];

  if (isBLVIncluded(ethereumBlock)) {
    includedTypes.push(TokenSupplyCategories.BOOSTED_LIQUIDITY_VAULT);
  }

  return getRecordsForTypes(records, includedTypes, ohmIndex);
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
export const getOhmBackedSupply = (records: SupplyCategoryRecords, ohmIndex: number): SupplyValue => {
  const includedTypes: TokenSupplyCategories[] = [
    TokenSupplyCategories.TOTAL_SUPPLY,
    TokenSupplyCategories.TREASURY,
    TokenSupplyCategories.OFFSET,
    TokenSupplyCategories.BONDS_PREMINTED,
    TokenSupplyCategories.BONDS_VESTING_DEPOSITS,
    TokenSupplyCategories.BONDS_DEPOSITS,
    TokenSupplyCategories.LIQUIDITY,
    TokenSupplyCategories.BOOSTED_LIQUIDITY_VAULT,
    TokenSupplyCategories.LENDING,
  ];

  return getRecordsForTypes(records, includedTypes, ohmIndex);
};

/**
 * For a given array of TokenSupply records (assumed to be at the same point in time),
 * this function returns the OHM total supply.
 *
 * @param records TokenSupply records for the given day
 * @param ohmIndex The index of OHM for the given day
 * @returns
 */
export const getOhmTotalSupply = (records: SupplyCategoryRecords, ohmIndex: number): SupplyValue => {
  return getRecordsForTypes(records, [TokenSupplyCategories.TOTAL_SUPPLY], ohmIndex);
}

export const getGOhmBackedSupply = (backedSupply: number, ohmIndex: number): number => {
  return backedSupply / ohmIndex;
}

/**
 * This function splits the TokenSupply records into categories, which makes calculating metrics
 * more efficient.
 * 
 * @param records 
 * @param ohmIndex 
 * @returns 
 */
const getSupplyCategories = (records: TokenSupply[], ohmIndex: number): [SupplyCategoryValues, SupplyCategoryRecords] => {
  const bondDeposits = getTokenSupplyRecordsForTypes(records, [TOKEN_SUPPLY_TYPE_BONDS_DEPOSITS], ohmIndex);
  const bondPreminted = getTokenSupplyRecordsForTypes(records, [TOKEN_SUPPLY_TYPE_BONDS_PREMINTED], ohmIndex);
  const bondVestingDeposits = getTokenSupplyRecordsForTypes(records, [TOKEN_SUPPLY_TYPE_BONDS_VESTING_DEPOSITS], ohmIndex);
  const bondVestingTokens = getTokenSupplyRecordsForTypes(records, [TOKEN_SUPPLY_TYPE_BONDS_VESTING_TOKENS], ohmIndex);
  const liquidity = getTokenSupplyRecordsForTypes(records, [TOKEN_SUPPLY_TYPE_LIQUIDITY], ohmIndex);
  const boostedLiquidityVault = getTokenSupplyRecordsForTypes(records, [TOKEN_SUPPLY_TYPE_BOOSTED_LIQUIDITY_VAULT], ohmIndex);
  const offset = getTokenSupplyRecordsForTypes(records, [TOKEN_SUPPLY_TYPE_OFFSET], ohmIndex);
  const totalSupply = getTokenSupplyRecordsForTypes(records, [TOKEN_SUPPLY_TYPE_TOTAL_SUPPLY], ohmIndex);
  const treasury = getTokenSupplyRecordsForTypes(records, [TOKEN_SUPPLY_TYPE_TREASURY], ohmIndex);
  const lending = getTokenSupplyRecordsForTypes(records, [TOKEN_SUPPLY_TYPE_LENDING], ohmIndex);

  const supplyCategories: SupplyCategoryValues = {
    [TokenSupplyCategories.BONDS_DEPOSITS]: bondDeposits[0],
    [TokenSupplyCategories.BONDS_PREMINTED]: bondPreminted[0],
    [TokenSupplyCategories.BONDS_VESTING_DEPOSITS]: bondVestingDeposits[0],
    [TokenSupplyCategories.BONDS_VESTING_TOKENS]: bondVestingTokens[0],
    [TokenSupplyCategories.LIQUIDITY]: liquidity[0],
    [TokenSupplyCategories.BOOSTED_LIQUIDITY_VAULT]: boostedLiquidityVault[0],
    [TokenSupplyCategories.OFFSET]: offset[0],
    [TokenSupplyCategories.TOTAL_SUPPLY]: totalSupply[0],
    [TokenSupplyCategories.TREASURY]: treasury[0],
    [TokenSupplyCategories.LENDING]: lending[0],
  };

  const supplyCategoryRecords: SupplyCategoryRecords = {
    [TokenSupplyCategories.BONDS_DEPOSITS]: bondDeposits[2],
    [TokenSupplyCategories.BONDS_PREMINTED]: bondPreminted[2],
    [TokenSupplyCategories.BONDS_VESTING_DEPOSITS]: bondVestingDeposits[2],
    [TokenSupplyCategories.BONDS_VESTING_TOKENS]: bondVestingTokens[2],
    [TokenSupplyCategories.LIQUIDITY]: liquidity[2],
    [TokenSupplyCategories.BOOSTED_LIQUIDITY_VAULT]: boostedLiquidityVault[2],
    [TokenSupplyCategories.OFFSET]: offset[2],
    [TokenSupplyCategories.TOTAL_SUPPLY]: totalSupply[2],
    [TokenSupplyCategories.TREASURY]: treasury[2],
    [TokenSupplyCategories.LENDING]: lending[2],
  };

  return [supplyCategories, supplyCategoryRecords];
};

//
// TokenRecord metrics
//

const getTreasuryAssetValue = (
  records: TokenRecord[],
  liquidBacking: boolean,
  categories = [CATEGORY_STABLE, CATEGORY_VOLATILE, CATEGORY_POL],
): [number, TokenRecord[], ChainValues, ChainRecords] => {
  const [totalValue, allRecords, chainValues, chainRecords] = records.reduce(([previousTotalValue, previousAllRecords, previousChainValues, previousChainRecords], currentRecord) => {
    // Category matches
    if (!categories.includes(currentRecord.category)) {
      return [previousTotalValue, previousAllRecords, previousChainValues, previousChainRecords];
    }

    // If liquidBacking is specified, check if the record is liquid
    if (liquidBacking && !currentRecord.isLiquid) {
      return [previousTotalValue, previousAllRecords, previousChainValues, previousChainRecords];
    }

    const currentValue: number = liquidBacking ? +currentRecord.valueExcludingOhm : +currentRecord.value;
    const currentTotalValue = previousTotalValue + currentValue;
    const currentRecords = [...previousAllRecords, currentRecord];
    const currentChainValues: ChainValues = {
      [Chains.ARBITRUM]: previousChainValues[Chains.ARBITRUM] + (currentRecord.blockchain === CHAIN_ARBITRUM ? currentValue : 0),
      [Chains.ETHEREUM]: previousChainValues[Chains.ETHEREUM] + (currentRecord.blockchain === CHAIN_ETHEREUM ? currentValue : 0),
      [Chains.FANTOM]: previousChainValues[Chains.FANTOM] + (currentRecord.blockchain === CHAIN_FANTOM ? currentValue : 0),
      [Chains.POLYGON]: previousChainValues[Chains.POLYGON] + (currentRecord.blockchain === CHAIN_POLYGON ? currentValue : 0),
    };
    const currentChainRecords: ChainRecords = {
      [Chains.ARBITRUM]: [...previousChainRecords[Chains.ARBITRUM], ...(currentRecord.blockchain === CHAIN_ARBITRUM ? [currentRecord] : [])],
      [Chains.ETHEREUM]: [...previousChainRecords[Chains.ETHEREUM], ...(currentRecord.blockchain === CHAIN_ETHEREUM ? [currentRecord] : [])],
      [Chains.FANTOM]: [...previousChainRecords[Chains.FANTOM], ...(currentRecord.blockchain === CHAIN_FANTOM ? [currentRecord] : [])],
      [Chains.POLYGON]: [...previousChainRecords[Chains.POLYGON], ...(currentRecord.blockchain === CHAIN_POLYGON ? [currentRecord] : [])],
    };

    return [currentTotalValue, currentRecords, currentChainValues, currentChainRecords];
  }, [
    0,
    [] as TokenRecord[],
    {
      [Chains.ARBITRUM]: 0,
      [Chains.ETHEREUM]: 0,
      [Chains.FANTOM]: 0,
      [Chains.POLYGON]: 0,
    } as ChainValues,
    {
      [Chains.ARBITRUM]: [] as TokenRecord[],
      [Chains.ETHEREUM]: [] as TokenRecord[],
      [Chains.FANTOM]: [] as TokenRecord[],
      [Chains.POLYGON]: [] as TokenRecord[],
    } as ChainRecords]);

  return [totalValue, allRecords, chainValues, chainRecords];
};

const getAssetValues = (
  records: TokenRecord[],
): AssetValue => {
  const [marketValue, marketValueRecords, marketValueChainValues, marketValueChainRecords] = getTreasuryAssetValue(records, false);
  const [liquidBacking, liquidBackingRecords, liquidBackingChainValues, liquidBackingChainRecords] = getTreasuryAssetValue(records, true);

  return {
    marketValue,
    marketValueRecords,
    marketValueChainValues,
    marketValueChainRecords,
    liquidBacking,
    liquidBackingRecords,
    liquidBackingChainValues,
    liquidBackingChainRecords,
  };
}

export const getLiquidBackingPerOhmBacked = (liquidBacking: number, backedSupply: number) =>
  liquidBacking / backedSupply;

export const getLiquidBackingPerOhmFloating = (liquidBacking: number, floatingSupply: number) =>
  liquidBacking / floatingSupply;

export const getLiquidBackingPerGOhmBacked = (liquidBacking: number, backedSupply: number, ohmIndex: number) => {
  return liquidBacking / getGOhmBackedSupply(backedSupply, ohmIndex);
}

const filterTokenRecordsByChain = (tokenRecords: TokenRecord[], chain: string): TokenRecord[] => {
  return tokenRecords.filter(record => record.blockchain === chain);
}

const getBlock = (tokenRecords: TokenRecord[]): number => {
  if (!tokenRecords.length) {
    return 0;
  }

  return +tokenRecords[0].block;
}

const getTimestamp = (tokenRecords: TokenRecord[]): number => {
  if (!tokenRecords.length) {
    return 0;
  }

  return +tokenRecords[0].timestamp;
}

export const getMetricObject = (tokenRecords: TokenRecord[], tokenSupplies: TokenSupply[], protocolMetrics: ProtocolMetric[], includeRecords = false): Metric | null => {
  if (!tokenRecords.length || !tokenSupplies.length || !protocolMetrics.length) {
    return null;
  }

  const block: number = +protocolMetrics[0].block;
  const ohmIndex: number = +protocolMetrics[0].currentIndex;
  const ohmApy: number = +protocolMetrics[0].currentAPY;
  const ohmPrice: number = +protocolMetrics[0].ohmPrice;
  const gOhmPrice: number = +protocolMetrics[0].gOhmPrice;

  const supplyCategories = getSupplyCategories(tokenSupplies, ohmIndex);
  const assetValues = getAssetValues(tokenRecords);

  const ohmCirculatingSupply = getOhmCirculatingSupply(supplyCategories[1], block, ohmIndex);
  const ohmFloatingSupply = getOhmFloatingSupply(supplyCategories[1], block, ohmIndex);
  const ohmBackedSupply = getOhmBackedSupply(supplyCategories[1], ohmIndex);
  const ohmTotalSupply = getOhmTotalSupply(supplyCategories[1], ohmIndex);

  const sOhmCirculatingSupply: number = +protocolMetrics[0].sOhmCirculatingSupply;
  const sOhmTotalValueLocked: number = +protocolMetrics[0].totalValueLocked;

  // Obtain per-chain arrays
  // TODO remove
  const arbitrumTokenRecords = filterTokenRecordsByChain(tokenRecords, CHAIN_ARBITRUM);
  const ethereumTokenRecords = filterTokenRecordsByChain(tokenRecords, CHAIN_ETHEREUM);
  const fantomTokenRecords = filterTokenRecordsByChain(tokenRecords, CHAIN_FANTOM);
  const polygonTokenRecords = filterTokenRecordsByChain(tokenRecords, CHAIN_POLYGON);

  return {
    date: tokenRecords[0].date,
    blocks: {
      [Chains.ARBITRUM]: getBlock(arbitrumTokenRecords),
      [Chains.ETHEREUM]: getBlock(ethereumTokenRecords),
      [Chains.FANTOM]: getBlock(fantomTokenRecords),
      [Chains.POLYGON]: getBlock(polygonTokenRecords),
    },
    timestamps: {
      [Chains.ARBITRUM]: getTimestamp(arbitrumTokenRecords),
      [Chains.ETHEREUM]: getTimestamp(ethereumTokenRecords),
      [Chains.FANTOM]: getTimestamp(fantomTokenRecords),
      [Chains.POLYGON]: getTimestamp(polygonTokenRecords),
    },
    ohmIndex: ohmIndex,
    ohmApy: ohmApy,
    ohmTotalSupply: ohmTotalSupply.supplyBalance,
    ohmTotalSupplyComponents: {
      [Chains.ARBITRUM]: ohmTotalSupply.chainSupplyBalances.Arbitrum,
      [Chains.ETHEREUM]: ohmTotalSupply.chainSupplyBalances.Ethereum,
      [Chains.FANTOM]: ohmTotalSupply.chainSupplyBalances.Fantom,
      [Chains.POLYGON]: ohmTotalSupply.chainSupplyBalances.Polygon,
    },
    ohmCirculatingSupply: ohmCirculatingSupply.supplyBalance,
    ohmCirculatingSupplyComponents: {
      [Chains.ARBITRUM]: ohmCirculatingSupply.chainSupplyBalances.Arbitrum,
      [Chains.ETHEREUM]: ohmCirculatingSupply.chainSupplyBalances.Ethereum,
      [Chains.FANTOM]: ohmCirculatingSupply.chainSupplyBalances.Fantom,
      [Chains.POLYGON]: ohmCirculatingSupply.chainSupplyBalances.Polygon,
    },
    ohmFloatingSupply: ohmFloatingSupply.supplyBalance,
    ohmFloatingSupplyComponents: {
      [Chains.ARBITRUM]: ohmFloatingSupply.chainSupplyBalances.Arbitrum,
      [Chains.ETHEREUM]: ohmFloatingSupply.chainSupplyBalances.Ethereum,
      [Chains.FANTOM]: ohmFloatingSupply.chainSupplyBalances.Fantom,
      [Chains.POLYGON]: ohmFloatingSupply.chainSupplyBalances.Polygon,
    },
    ohmBackedSupply: ohmBackedSupply.supplyBalance,
    gOhmBackedSupply: getGOhmBackedSupply(ohmBackedSupply.supplyBalance, ohmIndex),
    ohmBackedSupplyComponents: {
      [Chains.ARBITRUM]: ohmBackedSupply.chainSupplyBalances.Arbitrum,
      [Chains.ETHEREUM]: ohmBackedSupply.chainSupplyBalances.Ethereum,
      [Chains.FANTOM]: ohmBackedSupply.chainSupplyBalances.Fantom,
      [Chains.POLYGON]: ohmBackedSupply.chainSupplyBalances.Polygon,
    },
    ohmSupplyCategories: supplyCategories[0],
    ohmPrice: ohmPrice,
    gOhmPrice: gOhmPrice,
    marketCap: ohmPrice * ohmCirculatingSupply.supplyBalance,
    sOhmCirculatingSupply: sOhmCirculatingSupply,
    sOhmTotalValueLocked: sOhmTotalValueLocked,
    treasuryMarketValue: assetValues.marketValue,
    treasuryMarketValueComponents: {
      [Chains.ARBITRUM]: assetValues.marketValueChainValues.Arbitrum,
      [Chains.ETHEREUM]: assetValues.marketValueChainValues.Ethereum,
      [Chains.FANTOM]: assetValues.marketValueChainValues.Fantom,
      [Chains.POLYGON]: assetValues.marketValueChainValues.Polygon,
    },
    treasuryLiquidBacking: assetValues.liquidBacking,
    treasuryLiquidBackingComponents: {
      [Chains.ARBITRUM]: assetValues.liquidBackingChainValues.Arbitrum,
      [Chains.ETHEREUM]: assetValues.liquidBackingChainValues.Ethereum,
      [Chains.FANTOM]: assetValues.liquidBackingChainValues.Fantom,
      [Chains.POLYGON]: assetValues.liquidBackingChainValues.Polygon,
    },
    treasuryLiquidBackingPerOhmFloating: getLiquidBackingPerOhmFloating(assetValues.liquidBacking, ohmFloatingSupply.supplyBalance),
    treasuryLiquidBackingPerOhmBacked: getLiquidBackingPerOhmBacked(assetValues.liquidBacking, ohmBackedSupply.supplyBalance),
    treasuryLiquidBackingPerGOhmBacked: getLiquidBackingPerGOhmBacked(assetValues.liquidBacking, ohmBackedSupply.supplyBalance, ohmIndex),
    // Optional properties
    ...includeRecords ? {
      ohmTotalSupplyRecords: {
        [Chains.ARBITRUM]: ohmTotalSupply.chainRecords.Arbitrum,
        [Chains.ETHEREUM]: ohmTotalSupply.chainRecords.Ethereum,
        [Chains.FANTOM]: ohmTotalSupply.chainRecords.Fantom,
        [Chains.POLYGON]: ohmTotalSupply.chainRecords.Polygon,
      },
      ohmCirculatingSupplyRecords: {
        [Chains.ARBITRUM]: ohmCirculatingSupply.chainRecords.Arbitrum,
        [Chains.ETHEREUM]: ohmCirculatingSupply.chainRecords.Ethereum,
        [Chains.FANTOM]: ohmCirculatingSupply.chainRecords.Fantom,
        [Chains.POLYGON]: ohmCirculatingSupply.chainRecords.Polygon,
      },
      ohmFloatingSupplyRecords: {
        [Chains.ARBITRUM]: ohmFloatingSupply.chainRecords.Arbitrum,
        [Chains.ETHEREUM]: ohmFloatingSupply.chainRecords.Ethereum,
        [Chains.FANTOM]: ohmFloatingSupply.chainRecords.Fantom,
        [Chains.POLYGON]: ohmFloatingSupply.chainRecords.Polygon,
      },
      ohmBackedSupplyRecords: {
        [Chains.ARBITRUM]: ohmBackedSupply.chainRecords.Arbitrum,
        [Chains.ETHEREUM]: ohmBackedSupply.chainRecords.Ethereum,
        [Chains.FANTOM]: ohmBackedSupply.chainRecords.Fantom,
        [Chains.POLYGON]: ohmBackedSupply.chainRecords.Polygon,
      },
      treasuryMarketValueRecords: {
        [Chains.ARBITRUM]: assetValues.marketValueChainRecords.Arbitrum,
        [Chains.ETHEREUM]: assetValues.marketValueChainRecords.Ethereum,
        [Chains.FANTOM]: assetValues.marketValueChainRecords.Fantom,
        [Chains.POLYGON]: assetValues.marketValueChainRecords.Polygon,
      },
      treasuryLiquidBackingRecords: {
        [Chains.ARBITRUM]: assetValues.liquidBackingChainRecords.Arbitrum,
        [Chains.ETHEREUM]: assetValues.liquidBackingChainRecords.Ethereum,
        [Chains.FANTOM]: assetValues.liquidBackingChainRecords.Fantom,
        [Chains.POLYGON]: assetValues.liquidBackingChainRecords.Polygon,
      },
    } : {},
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
