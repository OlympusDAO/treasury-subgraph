// GraphQL queries for individual subgraphs
// Each subgraph has its own namespace, so we query them separately

// TokenRecord queries
export const TOKEN_RECORDS_LATEST = `
  query {
    tokenRecords(orderBy: block, orderDirection: desc, first: 1) {
      id
      balance
      block
      blockchain
      category
      date
      isBluechip
      isLiquid
      multiplier
      rate
      source
      sourceAddress
      timestamp
      token
      tokenAddress
      value
      valueExcludingOhm
    }
  }
`;

export const TOKEN_RECORDS_EARLIEST = `
  query {
    tokenRecords(orderBy: block, orderDirection: asc, first: 1) {
      id
      balance
      block
      blockchain
      category
      date
      isBluechip
      isLiquid
      multiplier
      rate
      source
      sourceAddress
      timestamp
      token
      tokenAddress
      value
      valueExcludingOhm
    }
  }
`;

export const TOKEN_RECORDS_AT_BLOCK = `
  query ($block: BigInt!, $pageSize: Int!) {
    tokenRecords(first: $pageSize, orderBy: date, orderDirection: desc, where: { block: $block }) {
      id
      balance
      block
      blockchain
      category
      date
      isBluechip
      isLiquid
      multiplier
      rate
      source
      sourceAddress
      timestamp
      token
      tokenAddress
      value
      valueExcludingOhm
    }
  }
`;

export const TOKEN_RECORDS_BY_DATE = `
  query ($date: String!, $pageSize: Int!) {
    tokenRecords(first: $pageSize, orderBy: date, orderDirection: desc, where: { date: $date }) {
      id
      balance
      block
      blockchain
      category
      date
      isBluechip
      isLiquid
      multiplier
      rate
      source
      sourceAddress
      timestamp
      token
      tokenAddress
      value
      valueExcludingOhm
    }
  }
`;

export const TOKEN_RECORDS_DATE_RANGE = `
  query ($startDate: String!, $endDate: String!, $pageSize: Int!) {
    tokenRecords(
      first: $pageSize
      orderBy: date
      orderDirection: desc
      where: { date_gte: $startDate, date_lt: $endDate }
    ) {
      id
      balance
      block
      blockchain
      category
      date
      isBluechip
      isLiquid
      multiplier
      rate
      source
      sourceAddress
      timestamp
      token
      tokenAddress
      value
      valueExcludingOhm
    }
  }
`;

// TokenSupply queries
export const TOKEN_SUPPLIES_LATEST = `
  query {
    tokenSupplies(orderBy: block, orderDirection: desc, first: 1) {
      id
      balance
      block
      date
      pool
      poolAddress
      source
      sourceAddress
      supplyBalance
      timestamp
      token
      tokenAddress
      type
    }
  }
`;

export const TOKEN_SUPPLIES_EARLIEST = `
  query {
    tokenSupplies(orderBy: block, orderDirection: asc, first: 1) {
      id
      balance
      block
      date
      pool
      poolAddress
      source
      sourceAddress
      supplyBalance
      timestamp
      token
      tokenAddress
      type
    }
  }
`;

export const TOKEN_SUPPLIES_AT_BLOCK = `
  query ($block: BigInt!, $pageSize: Int!) {
    tokenSupplies(first: $pageSize, orderBy: date, orderDirection: desc, where: { block: $block }) {
      id
      balance
      block
      date
      pool
      poolAddress
      source
      sourceAddress
      supplyBalance
      timestamp
      token
      tokenAddress
      type
    }
  }
`;

export const TOKEN_SUPPLIES_BY_DATE = `
  query ($date: String!, $pageSize: Int!) {
    tokenSupplies(first: $pageSize, orderBy: date, orderDirection: desc, where: { date: $date }) {
      id
      balance
      block
      date
      pool
      poolAddress
      source
      sourceAddress
      supplyBalance
      timestamp
      token
      tokenAddress
      type
    }
  }
`;

export const TOKEN_SUPPLIES_DATE_RANGE = `
  query ($startDate: String!, $endDate: String!, $pageSize: Int!) {
    tokenSupplies(
      first: $pageSize
      orderBy: date
      orderDirection: desc
      where: { date_gte: $startDate, date_lt: $endDate }
    ) {
      id
      balance
      block
      date
      pool
      poolAddress
      source
      sourceAddress
      supplyBalance
      timestamp
      token
      tokenAddress
      type
    }
  }
`;

// ProtocolMetric queries
export const PROTOCOL_METRICS_LATEST = `
  query {
    protocolMetrics(orderBy: block, orderDirection: desc, first: 1) {
      id
      block
      currentAPY
      currentIndex
      date
      gOhmPrice
      gOhmTotalSupply
      nextDistributedOhm
      nextEpochRebase
      ohmPrice
      ohmTotalSupply
      sOhmCirculatingSupply
      timestamp
      totalValueLocked
    }
  }
`;

export const PROTOCOL_METRICS_EARLIEST = `
  query {
    protocolMetrics(orderBy: block, orderDirection: asc, first: 1) {
      id
      block
      currentAPY
      currentIndex
      date
      gOhmPrice
      gOhmTotalSupply
      nextDistributedOhm
      nextEpochRebase
      ohmPrice
      ohmTotalSupply
      sOhmCirculatingSupply
      timestamp
      totalValueLocked
    }
  }
`;

export const PROTOCOL_METRICS_AT_BLOCK = `
  query ($block: BigInt!, $pageSize: Int!) {
    protocolMetrics(first: $pageSize, orderBy: date, orderDirection: desc, where: { block: $block }) {
      id
      block
      currentAPY
      currentIndex
      date
      gOhmPrice
      gOhmTotalSupply
      nextDistributedOhm
      nextEpochRebase
      ohmPrice
      ohmTotalSupply
      sOhmCirculatingSupply
      timestamp
      totalValueLocked
    }
  }
`;

export const PROTOCOL_METRICS_DATE_RANGE = `
  query ($startDate: String!, $endDate: String!, $pageSize: Int!) {
    protocolMetrics(
      first: $pageSize
      orderBy: date
      orderDirection: desc
      where: { date_gte: $startDate, date_lt: $endDate }
    ) {
      id
      block
      currentAPY
      currentIndex
      date
      gOhmPrice
      gOhmTotalSupply
      nextDistributedOhm
      nextEpochRebase
      ohmPrice
      ohmTotalSupply
      sOhmCirculatingSupply
      timestamp
      totalValueLocked
    }
  }
`;
