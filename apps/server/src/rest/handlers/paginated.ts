import { Request, Response } from 'express';
import { resolvers } from '../../graphql/resolvers';
import { parseWgVariables, wundergraphResponse } from '../middleware';

/**
 * GET /operations/paginated/metrics
 * Query params (via wg_variables): {
 *   startDate: string,
 *   dateOffset?: number,
 *   crossChainDataComplete?: boolean,
 *   includeRecords?: boolean,
 *   ignoreCache?: boolean
 * }
 */
export async function paginatedMetricsHandler(req: Request, res: Response): Promise<void> {
  const params = parseWgVariables(req) as {
    startDate: string;
    dateOffset?: number;
    crossChainDataComplete?: boolean;
    includeRecords?: boolean;
    ignoreCache?: boolean;
  };
  const result = await resolvers.Query.paginatedMetrics(null, params);
  res.json(wundergraphResponse(result));
}

/**
 * GET /operations/paginated/tokenRecords
 * Query params (via wg_variables): {
 *   startDate: string,
 *   dateOffset?: number,
 *   crossChainDataComplete?: boolean,
 *   ignoreCache?: boolean
 * }
 */
export async function paginatedTokenRecordsHandler(req: Request, res: Response): Promise<void> {
  const params = parseWgVariables(req) as {
    startDate: string;
    dateOffset?: number;
    crossChainDataComplete?: boolean;
    ignoreCache?: boolean;
  };
  const result = await resolvers.Query.paginatedTokenRecords(null, params);
  res.json(wundergraphResponse(result));
}

/**
 * GET /operations/paginated/tokenSupplies
 * Query params (via wg_variables): {
 *   startDate: string,
 *   dateOffset?: number,
 *   crossChainDataComplete?: boolean,
 *   ignoreCache?: boolean
 * }
 */
export async function paginatedTokenSuppliesHandler(req: Request, res: Response): Promise<void> {
  const params = parseWgVariables(req) as {
    startDate: string;
    dateOffset?: number;
    crossChainDataComplete?: boolean;
    ignoreCache?: boolean;
  };
  const result = await resolvers.Query.paginatedTokenSupplies(null, params);
  res.json(wundergraphResponse(result));
}

/**
 * GET /operations/paginated/protocolMetrics
 * Query params (via wg_variables): {
 *   startDate: string,
 *   dateOffset?: number,
 *   ignoreCache?: boolean
 * }
 */
export async function paginatedProtocolMetricsHandler(req: Request, res: Response): Promise<void> {
  const params = parseWgVariables(req) as {
    startDate: string;
    dateOffset?: number;
    ignoreCache?: boolean;
  };
  const result = await resolvers.Query.paginatedProtocolMetrics(null, params);
  res.json(wundergraphResponse(result));
}
