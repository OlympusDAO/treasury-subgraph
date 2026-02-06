import { Request, Response, Router } from "express";
import { errorHandler } from "./middleware";
import { registerRoutes } from "./routes";

/**
 * Create and configure the REST API router
 * This replicates the Wundergraph API shape at /operations/*
 */
export function createRestRouter(): Router {
  const router = Router();

  // Register all routes
  registerRoutes(router);

  // Error handling middleware (must be last)
  router.use(errorHandler);

  return router;
}

/**
 * Export the router for mounting in the main app
 */
export const restRouter = createRestRouter();
