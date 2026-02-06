import type { Router } from "express";
import {
  atBlockInternalProtocolMetricsHandler,
  atBlockMetricsHandler,
  atBlockTokenRecordsHandler,
  atBlockTokenSuppliesHandler,
} from "./handlers/atBlock";
import {
  earliestMetricsHandler,
  earliestProtocolMetricsHandler,
  earliestTokenRecordsHandler,
  earliestTokenSuppliesHandler,
  tokenRecordsEarliestRawHandler,
  tokenSuppliesEarliestRawHandler,
} from "./handlers/earliest";
import {
  healthHandler,
  latestMetricsHandler,
  latestProtocolMetricsHandler,
  latestTokenRecordsHandler,
  latestTokenSuppliesHandler,
  tokenRecordsLatestRawHandler,
  tokenSuppliesLatestRawHandler,
} from "./handlers/latest";
import {
  paginatedMetricsHandler,
  paginatedProtocolMetricsHandler,
  paginatedTokenRecordsHandler,
  paginatedTokenSuppliesHandler,
} from "./handlers/paginated";
import { asyncHandler } from "./middleware";

/**
 * Register all REST routes
 * Routes exactly match Wundergraph's shape
 */
export function registerRoutes(router: Router): void {
  // Health check
  router.get("/health", asyncHandler(healthHandler));

  // Latest endpoints (4)
  router.get("/latest/metrics", asyncHandler(latestMetricsHandler));
  router.get("/latest/tokenRecords", asyncHandler(latestTokenRecordsHandler));
  router.get("/latest/tokenSupplies", asyncHandler(latestTokenSuppliesHandler));
  router.get("/latest/protocolMetrics", asyncHandler(latestProtocolMetricsHandler));

  // Raw format endpoints (Wundergraph compatible)
  router.get("/tokenRecordsLatest", asyncHandler(tokenRecordsLatestRawHandler));
  router.get("/tokenSuppliesLatest", asyncHandler(tokenSuppliesLatestRawHandler));

  // Earliest endpoints (4)
  router.get("/earliest/metrics", asyncHandler(earliestMetricsHandler));
  router.get("/earliest/tokenRecords", asyncHandler(earliestTokenRecordsHandler));
  router.get("/earliest/tokenSupplies", asyncHandler(earliestTokenSuppliesHandler));
  router.get("/earliest/protocolMetrics", asyncHandler(earliestProtocolMetricsHandler));

  // Raw format endpoints (Wundergraph compatible)
  router.get("/tokenRecordsEarliest", asyncHandler(tokenRecordsEarliestRawHandler));
  router.get("/tokenSuppliesEarliest", asyncHandler(tokenSuppliesEarliestRawHandler));

  // Paginated endpoints (4)
  router.get("/paginated/metrics", asyncHandler(paginatedMetricsHandler));
  router.get("/paginated/tokenRecords", asyncHandler(paginatedTokenRecordsHandler));
  router.get("/paginated/tokenSupplies", asyncHandler(paginatedTokenSuppliesHandler));
  router.get("/paginated/protocolMetrics", asyncHandler(paginatedProtocolMetricsHandler));

  // AtBlock endpoints (4)
  router.get("/atBlock/metrics", asyncHandler(atBlockMetricsHandler));
  router.get("/atBlock/tokenRecords", asyncHandler(atBlockTokenRecordsHandler));
  router.get("/atBlock/tokenSupplies", asyncHandler(atBlockTokenSuppliesHandler));
  router.get(
    "/atBlock/internal/protocolMetrics",
    asyncHandler(atBlockInternalProtocolMetricsHandler)
  );
}
