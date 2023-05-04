# OlympusDAO Treasury Subgraph

## Purpose

It proved to be enormously difficult to aggregate GraphQL results across multiple endpoints and date ranges (due to limitations with Graph Protocol pagination). The code in this monorepo seeks to address that.

## Architecture

The monorepo contains two components:

- apps/
  - server/
    - Code to configure and deploy a [Wundergraph](https://wundergraph.com/) API server that aggregates and transforms GraphQL results
    - Offers a number of 'operations' (in Wundergraph terminology):
      - Basic: unaltered ProtocolMetric records. Not recommended.
        - protocolMetrics
        - tokenRecords
        - tokenSupplies
      - Latest: the latest record from each blockchain
        - latest/protocolMetrics
        - latest/tokenRecords
        - latest/tokenSupplies
      - Paginated: records from the `startDate` input variable until the present. Aggregates all blockchains and handles pagination.
        - paginated/protocolMetrics
        - paginated/tokenRecords
        - paginated/tokenSupplies
  - client/
    - Generates a React-compatible client that can be used in [olympus-frontend](https://github.com/OlympusDAO/olympus-frontend/)
    - Publishes the client to [NPM](https://www.npmjs.com/package/@olympusdao/treasury-subgraph-client)

## Developer Tasks

The repo is setup using [turbo](https://turbo.build/) to make handling tasks easier.

### Setup

1. Run `yarn` in the root directory.
2. Copy `.env.sample` and replace any required values

### Building

During local development, you can trigger a build with `yarn build:local`.

`yarn build` requires an environment variable to be set, and is used in the deploy process.

### Testing

Run `yarn test` from the root or `apps/server` directories.

### Deployment - Wundergraph

Wundergraph is setup to deploy automatically:

- `main` branch: 
- `develop` branch: 

### Deployment - Client NPM Package

1. Run `yarn build`
2. Update the `version` in `apps/client/package.json`
3. Update the changelog using `yarn changelog`
4. Login using yarn to authenticate with the NPM package registry: `yarn login`
5. Run the following command: `yarn publish-package`

    - If you have 2FA enabled on your account (which you should), you can speed this up by appending `--otp <OTP VALUE>` to the end of the command

NOTE: You must be a member of the `@olympusdao` org in NPM in order to publish.

### Notes

The API server is currently hosted by Wundergraph and serves our needs.

If the provider shuts down, there are [self-hosting options](https://docs.wundergraph.com/docs/self-hosted/flyio).
