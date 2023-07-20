import { configureWunderGraphApplication, cors, EnvironmentVariable, introspect, templates } from '@wundergraph/sdk';
import server from './wundergraph.server';
import operations from './wundergraph.operations';

/**
 * The TokenSupply type on non-Ethereum chains has not historically had a blockchain property.
 * 
 * Re-indexing the historical data is very time-consuming, so we modify the schema to add this field,
 * and add it to each record in the operations.
 * 
 * NOTE: this is currently ignored by Wundergraph
 */
const schemaExtension: string =
	`
extend type TokenSupply {
	blockchain: String
}
`;

const treasuryEthereum = introspect.graphql({
	apiNamespace: "treasuryEthereum",
	// SUBGRAPH_API_KEY needs to be injected at runtime
	url: `https://gateway.thegraph.com/api/${process.env.SUBGRAPH_API_KEY}/deployments/id/QmfC7nn4agkCjpgsjVdcCkKiKoGiu97yQTQSG1z7EaNnxd`, // 4.8.4
	schemaExtension: schemaExtension,
});

const treasuryArbitrum = introspect.graphql({
	apiNamespace: "treasuryArbitrum",
	// TODO shift to production URL
	url: "https://api.studio.thegraph.com/query/46563/protocol-metrics-arbitrum/version/latest",
	schemaExtension: schemaExtension,
});

const treasuryFantom = introspect.graphql({
	apiNamespace: "treasuryFantom",
	url: "https://api.thegraph.com/subgraphs/name/olympusdao/protocol-metrics-fantom",
	schemaExtension: schemaExtension,
});

const treasuryPolygon = introspect.graphql({
	apiNamespace: "treasuryPolygon",
	url: "https://api.thegraph.com/subgraphs/name/olympusdao/protocol-metrics-polygon",
	schemaExtension: schemaExtension,
});

// configureWunderGraph emits the configuration
configureWunderGraphApplication({
	apis: [treasuryArbitrum, treasuryEthereum, treasuryFantom, treasuryPolygon],
	server,
	operations,
	codeGenerators: [
		{
			// all is required for the testing server
			templates: [...templates.typescript.all]
		},
	],
	cors: {
		...cors.allowAll,
		allowedOrigins:
			process.env.NODE_ENV === 'production'
				?
				// Restrict to OlympusDAO and Fleek domains on production
				[
					"https://*.olympusdao.finance",
					"https://*.on.fleek.co",
					"http://localhost:5173",
				]
				// Allow local development
				: [
					"http://localhost:5173",
					new EnvironmentVariable('WG_ALLOWED_ORIGIN')
				],
	},
	security: {
		enableGraphQLEndpoint: process.env.NODE_ENV !== 'production' || process.env.GITPOD_WORKSPACE_ID !== undefined,
	},
});
