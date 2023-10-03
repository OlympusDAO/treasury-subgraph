# OlympusDAO Treasury Subgraph

## Purpose

It proved to be enormously difficult to aggregate GraphQL results across multiple endpoints and date ranges (due to limitations with Graph Protocol pagination). The code in this monorepo seeks to address that.

## Architecture

The monorepo contains two components:

- apps/
  - server/
    - Code to configure and deploy a [Wundergraph](https://wundergraph.com/) API server that aggregates and transforms GraphQL results
    - Offers a number of 'operations' (in Wundergraph terminology):
      - Earliest: the earliest record from each blockchain
        - earliest/metrics
        - earliest/tokenRecords
        - earliest/tokenSupplies
      - Latest: the latest record from each blockchain
        - latest/metrics
        - latest/tokenRecords
        - latest/tokenSupplies
      - Paginated: records from the `startDate` input variable until the present. Aggregates all blockchains and handles pagination. Specify `crossChainDataComplete` to restrict results up to the latest date with cross-chain data. Specify `includeRecords` to include records used to calculate each metric (large response size).
        - paginated/metrics
        - paginated/tokenRecords
        - paginated/tokenSupplies
  - client/
    - Generates a React-compatible client that can be used in [olympus-frontend](https://github.com/OlympusDAO/olympus-frontend/)
    - Publishes the client to [NPM](https://www.npmjs.com/package/@olympusdao/treasury-subgraph-client)

The Wundergraph server makes use of a Redis cache hosted on Upstash. This reduces Graph Protocol query fees, but also provides a ~2x improvement in response times.

## Developer Tasks

The repo is setup using [turbo](https://turbo.build/) to make handling tasks easier.

### Setup

1. Run `yarn` in the root directory.
2. Copy `.env.sample` to `.env` and replace any required values

### Building

During local development, you can trigger a build with `yarn build:local`. This requires the [setup](#setup) tasks to have been completed.

`yarn build` requires an environment variable to be set, and is used in the Wundergraph Cloud deploy process.

### Running

During local development, you can run an API endpoint locally with `yarn server:start`.

This requires environment variables to be set, so follow the instructions in [setup](#setup).

### Unit Tests

Run `yarn test:local`.

This requires environment variables to be set, so follow the instructions in [setup](#setup).

### Testing the Olympus Frontend

Running the [frontend](https://github.com/OlympusDAO/olympus-frontend/) against a different API endpoint requires jumping through some (small) hoops:

1. Run the API endpoint locally. See [Running](#running).
2. Pass the API endpoint to the frontend: `VITE_WG_PUBLIC_NODE_URL=http://localhost:9991 yarn start`

### Deployment - Wundergraph Server

Orchestration is performed using Pulumi. To deploy, follow these steps:

1. Change to the `apps/server` directory.
2. Authenticate with Pulumi, using `pulumi login`
3. Run `pulumi up --stack <dev | prod>`

NOTE: the Upstash credentials in the production project and environment should be different to that of all other projects/environments, so that the production cache is not polluted.

### Deployment - Client NPM Package

1. Set the required values in `.env.prod`
2. Authenticate with the NPM package registry: `npm login`
3. Update the `version` in `apps/client/package.json`
4. Update the changelog
5. Run the following command: `yarn publish-package`

    - Prefix the command with `YARN_OTP=<OTP VALUE>`

NOTE: You must be a member of the `@olympusdao` org in NPM in order to publish.

### Notes

The API server is currently hosted by Wundergraph and serves our needs.

If the provider shuts down, there are [self-hosting options](https://docs.wundergraph.com/docs/self-hosted/flyio).

## Wishlist / TODO

- When testing/developing new subgraph versions, it would be nice to be able to provide a URL parameter with the subgraph deployment ID and have the Typescript operation use that deployment ID instead of the configured data source.
