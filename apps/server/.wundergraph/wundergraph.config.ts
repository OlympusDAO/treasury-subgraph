import { configureWunderGraphApplication, cors, EnvironmentVariable, introspect, templates } from '@wundergraph/sdk';
import server from './wundergraph.server';
import operations from './wundergraph.operations';

const treasuryEthereum = introspect.graphql({
	apiNamespace: "treasuryEthereum",
	url: new EnvironmentVariable("SUBGRAPH_ETHEREUM"), // Needs to be injected at runtime
});

const treasuryArbitrum = introspect.graphql({
	apiNamespace: "treasuryArbitrum",
	url: "https://api.thegraph.com/subgraphs/name/olympusdao/protocol-metrics-arbitrum",
});

const treasuryFantom = introspect.graphql({
	apiNamespace: "treasuryFantom",
	url: "https://api.thegraph.com/subgraphs/name/olympusdao/protocol-metrics-fantom",
});

const treasuryPolygon = introspect.graphql({
	apiNamespace: "treasuryPolygon",
	url: "https://api.thegraph.com/subgraphs/name/olympusdao/protocol-metrics-polygon",
});

// configureWunderGraph emits the configuration
configureWunderGraphApplication({
	apis: [treasuryArbitrum, treasuryEthereum, treasuryFantom, treasuryPolygon],
	server,
	operations,
	codeGenerators: [
		{
			templates: [
				templates.typescript.client
			],
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
