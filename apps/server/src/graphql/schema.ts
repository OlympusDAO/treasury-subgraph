import { gql } from 'graphql-tag';

export const typeDefs = gql`
  # Scalar types
  scalar Date
  scalar BigInt

  # Token Supply type
  type TokenSupply {
    id: ID!
    balance: Float!
    block: Float!
    blockchain: String!
    date: String!
    pool: String
    poolAddress: String
    source: String!
    sourceAddress: String!
    supplyBalance: Float!
    timestamp: Float!
    token: String!
    tokenAddress: String!
    type: String!
  }

  # Token Record type
  type TokenRecord {
    id: ID!
    balance: Float!
    block: Float!
    blockchain: String!
    category: String!
    date: String!
    isBluechip: Boolean!
    isLiquid: Boolean!
    multiplier: Float!
    rate: Float!
    source: String!
    sourceAddress: String!
    timestamp: Float!
    token: String!
    tokenAddress: String!
    value: Float!
    valueExcludingOhm: Float!
  }

  # Protocol Metric type
  type ProtocolMetric {
    id: ID!
    block: Float!
    currentAPY: Float!
    currentIndex: Float!
    date: String!
    gOhmPrice: Float!
    gOhmTotalSupply: Float!
    nextDistributedOhm: Float!
    nextEpochRebase: Float!
    ohmPrice: Float!
    ohmTotalSupply: Float!
    sOhmCirculatingSupply: Float!
    timestamp: Float!
    totalValueLocked: Float!
  }

  # Chain Values type
  type ChainValues {
    Arbitrum: Float!
    Ethereum: Float!
    Fantom: Float!
    Polygon: Float!
    Base: Float!
    Berachain: Float!
  }

  # Supply Category Values type
  type SupplyCategoryValues {
    BondsDeposits: Float!
    BondsPreminted: Float!
    BondsVestingDeposits: Float!
    BondsVestingTokens: Float!
    BoostedLiquidityVault: Float!
    LendingMarkets: Float!
    ProtocolOwnedLiquidity: Float!
    MigrationOffset: Float!
    TotalSupply: Float!
    Treasury: Float!
  }

  # Response metadata for resilience tracking
  type ResponseMetadata {
    chainsComplete: [String!]!
    chainsFailed: [String!]!
    timestamp: String!
  }

  # Main Metric type
  type Metric {
    date: String!
    blocks: ChainValues!
    timestamps: ChainValues!
    ohmIndex: Float!
    ohmApy: Float!
    ohmTotalSupply: Float!
    ohmTotalSupplyComponents: ChainValues!
    ohmCirculatingSupply: Float!
    ohmCirculatingSupplyComponents: ChainValues!
    ohmFloatingSupply: Float!
    ohmFloatingSupplyComponents: ChainValues!
    ohmBackedSupply: Float!
    gOhmBackedSupply: Float!
    ohmBackedSupplyComponents: ChainValues!
    ohmSupplyCategories: SupplyCategoryValues!
    ohmPrice: Float!
    gOhmPrice: Float!
    marketCap: Float!
    sOhmCirculatingSupply: Float!
    sOhmTotalValueLocked: Float!
    treasuryMarketValue: Float!
    treasuryMarketValueComponents: ChainValues!
    treasuryLiquidBacking: Float!
    treasuryLiquidBackingComponents: ChainValues!
    treasuryLiquidBackingPerOhmFloating: Float!
    treasuryLiquidBackingPerOhmBacked: Float!
    treasuryLiquidBackingPerGOhmBacked: Float!
    _meta: ResponseMetadata
  }

  # Health check type
  type Health {
    status: String!
    timestamp: String!
    version: String!
  }

  # Queries
  type Query {
    # Health check
    health: Health!

    # Latest data
    latestMetrics: Metric!
    latestTokenSupplies: [TokenSupply!]!
    latestTokenRecords: [TokenRecord!]!
    latestProtocolMetrics: [ProtocolMetric!]

    # Earliest data
    earliestMetrics: Metric!
    earliestTokenSupplies: [TokenSupply!]!
    earliestTokenRecords: [TokenRecord!]!
    earliestProtocolMetrics: [ProtocolMetric!]

    # Paginated historical data
    paginatedMetrics(
      startDate: String!
      dateOffset: Int
      crossChainDataComplete: Boolean
      includeRecords: Boolean
    ): [Metric!]!

    paginatedTokenSupplies(
      startDate: String!
      dateOffset: Int
      crossChainDataComplete: Boolean
    ): [TokenSupply!]!

    paginatedTokenRecords(
      startDate: String!
      dateOffset: Int
      crossChainDataComplete: Boolean
    ): [TokenRecord!]!

    paginatedProtocolMetrics(
      startDate: String!
      dateOffset: Int
    ): [ProtocolMetric!]!

    # At specific block
    atBlockMetrics(
      arbitrumBlock: Float!
      ethereumBlock: Float!
      fantomBlock: Float!
      polygonBlock: Float!
      baseBlock: Float!
      berachainBlock: Float!
    ): Metric!
  }
`;
