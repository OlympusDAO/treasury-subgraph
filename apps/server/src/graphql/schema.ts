import { gql } from "graphql-tag";

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

  # Chain-specific token supplies (for includeRecords)
  type ChainTokenSupplies {
    Arbitrum: [TokenSupply!]!
    Ethereum: [TokenSupply!]!
    Fantom: [TokenSupply!]!
    Polygon: [TokenSupply!]!
    Base: [TokenSupply!]!
    Berachain: [TokenSupply!]!
  }

  # Chain-specific token records (for includeRecords)
  type ChainTokenRecords {
    Arbitrum: [TokenRecord!]!
    Ethereum: [TokenRecord!]!
    Fantom: [TokenRecord!]!
    Polygon: [TokenRecord!]!
    Base: [TokenRecord!]!
    Berachain: [TokenRecord!]!
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
    # Optional record fields (only included when includeRecords: true)
    ohmTotalSupplyRecords: ChainTokenSupplies
    ohmCirculatingSupplyRecords: ChainTokenSupplies
    ohmFloatingSupplyRecords: ChainTokenSupplies
    ohmBackedSupplyRecords: ChainTokenSupplies
    treasuryMarketValueRecords: ChainTokenRecords
    treasuryLiquidBackingRecords: ChainTokenRecords
    _meta: ResponseMetadata
  }

  # Health check type
  type Health {
    status: String!
    timestamp: String!
    version: String!
  }

  # Raw chain-specific token records response (Wundergraph compatible)
  type TokenRecordsRawResponse {
    treasuryArbitrum_tokenRecords: [TokenRecord!]!
    treasuryEthereum_tokenRecords: [TokenRecord!]!
    treasuryFantom_tokenRecords: [TokenRecord!]!
    treasuryPolygon_tokenRecords: [TokenRecord!]!
    treasuryBase_tokenRecords: [TokenRecord!]!
    treasuryBerachain_tokenRecords: [TokenRecord!]!
  }

  # Raw chain-specific token supplies response (Wundergraph compatible)
  type TokenSuppliesRawResponse {
    treasuryArbitrum_tokenSupplies: [TokenSupply!]!
    treasuryEthereum_tokenSupplies: [TokenSupply!]!
    treasuryFantom_tokenSupplies: [TokenSupply!]!
    treasuryPolygon_tokenSupplies: [TokenSupply!]!
    treasuryBase_tokenSupplies: [TokenSupply!]!
    treasuryBerachain_tokenSupplies: [TokenSupply!]!
  }

  # Raw chain-specific protocol metrics response (Wundergraph compatible)
  type ProtocolMetricsRawResponse {
    treasuryArbitrum_protocolMetrics: [ProtocolMetric!]!
    treasuryEthereum_protocolMetrics: [ProtocolMetric!]!
    treasuryFantom_protocolMetrics: [ProtocolMetric!]!
    treasuryPolygon_protocolMetrics: [ProtocolMetric!]!
    treasuryBase_protocolMetrics: [ProtocolMetric!]!
    treasuryBerachain_protocolMetrics: [ProtocolMetric!]!
  }

  # Queries
  type Query {
    # Health check
    health: Health!

    # Latest data
    latestMetrics(ignoreCache: Boolean): Metric!
    latestTokenSupplies(ignoreCache: Boolean): [TokenSupply!]!
    latestTokenRecords(ignoreCache: Boolean): [TokenRecord!]!
    latestProtocolMetrics(ignoreCache: Boolean): [ProtocolMetric!]

    # Raw format data (Wundergraph compatible)
    latestTokenRecordsRaw(ignoreCache: Boolean): TokenRecordsRawResponse!
    latestTokenSuppliesRaw(ignoreCache: Boolean): TokenSuppliesRawResponse!
    latestProtocolMetricsRaw(ignoreCache: Boolean): ProtocolMetricsRawResponse!

    # Earliest data
    earliestMetrics(ignoreCache: Boolean): Metric!
    earliestTokenSupplies(ignoreCache: Boolean): [TokenSupply!]!
    earliestTokenRecords(ignoreCache: Boolean): [TokenRecord!]!
    earliestProtocolMetrics(ignoreCache: Boolean): [ProtocolMetric!]

    # Raw format earliest data (Wundergraph compatible)
    earliestTokenRecordsRaw(ignoreCache: Boolean): TokenRecordsRawResponse!
    earliestTokenSuppliesRaw(ignoreCache: Boolean): TokenSuppliesRawResponse!
    earliestProtocolMetricsRaw(ignoreCache: Boolean): ProtocolMetricsRawResponse!

    # Paginated historical data
    paginatedMetrics(
      startDate: String!
      dateOffset: Int
      crossChainDataComplete: Boolean
      includeRecords: Boolean
      ignoreCache: Boolean
    ): [Metric!]!

    paginatedTokenSupplies(
      startDate: String!
      dateOffset: Int
      crossChainDataComplete: Boolean
      ignoreCache: Boolean
    ): [TokenSupply!]!

    paginatedTokenRecords(
      startDate: String!
      dateOffset: Int
      crossChainDataComplete: Boolean
      ignoreCache: Boolean
    ): [TokenRecord!]!

    paginatedProtocolMetrics(
      startDate: String!
      dateOffset: Int
      ignoreCache: Boolean
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
    atBlockTokenRecords(
      arbitrumBlock: Float!
      ethereumBlock: Float!
      fantomBlock: Float!
      polygonBlock: Float!
      baseBlock: Float!
      berachainBlock: Float!
    ): [TokenRecord!]!
    atBlockTokenSupplies(
      arbitrumBlock: Float!
      ethereumBlock: Float!
      fantomBlock: Float!
      polygonBlock: Float!
      baseBlock: Float!
      berachainBlock: Float!
    ): [TokenSupply!]!
    atBlockProtocolMetrics(
      arbitrumBlock: Float!
      ethereumBlock: Float!
      fantomBlock: Float!
      polygonBlock: Float!
      baseBlock: Float!
      berachainBlock: Float!
    ): [ProtocolMetric!]!
  }
`;
