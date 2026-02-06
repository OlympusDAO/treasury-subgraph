import { ApolloServer } from "apollo-server-express";
import cors from "cors";
import express from "express";
import { resolvers } from "../../src/graphql/resolvers";
import { typeDefs } from "../../src/graphql/schema";
import { restRouter } from "../../src/rest";

let testServer: {
  app: express.Application;
  apollo: ApolloServer;
} | null = null;

export async function startTestServer() {
  if (testServer) return testServer;

  const app = express();

  // Mirror production middleware
  app.use((req, res, next) => {
    const originalUrl = req.url;
    const normalizedUrl = originalUrl.replace(/\/+/g, "/");
    if (originalUrl !== normalizedUrl) {
      req.url = normalizedUrl;
    }
    next();
  });

  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());
  app.set("query parser", "simple");

  // Mount REST API
  app.use("/operations", restRouter);

  // Create Apollo Server
  const apollo = new ApolloServer({
    typeDefs: typeDefs as any,
    resolvers,
    introspection: true,
  });

  await apollo.start();
  apollo.applyMiddleware({ app, path: "/graphql" });

  testServer = { app, apollo };
  return testServer;
}

export async function stopTestServer() {
  if (testServer?.apollo) {
    await testServer.apollo.stop();
  }
  testServer = null;
}
