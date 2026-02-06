import type { Request, Response } from "express";
import { resolvers } from "../../graphql/resolvers";
import { parseWgVariables, wundergraphResponse } from "../middleware";

/**
 * GET /operations/atBlock/metrics
 * Query params (via wg_variables): {
 *   arbitrumBlock: number,
 *   ethereumBlock: number,
 *   fantomBlock: number,
 *   polygonBlock: number,
 *   baseBlock: number,
 *   berachainBlock: number
 * }
 */
export async function atBlockMetricsHandler(req: Request, res: Response): Promise<void> {
  const params = parseWgVariables(req) as {
    arbitrumBlock: number;
    ethereumBlock: number;
    fantomBlock: number;
    polygonBlock: number;
    baseBlock: number;
    berachainBlock: number;
  };
  const result = await resolvers.Query.atBlockMetrics(null, params);
  res.json(wundergraphResponse(result));
}

/**
 * GET /operations/atBlock/tokenRecords
 * Query params (via wg_variables): {
 *   arbitrumBlock: number,
 *   ethereumBlock: number,
 *   fantomBlock: number,
 *   polygonBlock: number,
 *   baseBlock: number,
 *   berachainBlock: number
 * }
 */
export async function atBlockTokenRecordsHandler(req: Request, res: Response): Promise<void> {
  const params = parseWgVariables(req) as {
    arbitrumBlock: number;
    ethereumBlock: number;
    fantomBlock: number;
    polygonBlock: number;
    baseBlock: number;
    berachainBlock: number;
  };
  const result = await resolvers.Query.atBlockTokenRecords(null, params);
  res.json(wundergraphResponse(result));
}

/**
 * GET /operations/atBlock/tokenSupplies
 * Query params (via wg_variables): {
 *   arbitrumBlock: number,
 *   ethereumBlock: number,
 *   fantomBlock: number,
 *   polygonBlock: number,
 *   baseBlock: number,
 *   berachainBlock: number
 * }
 */
export async function atBlockTokenSuppliesHandler(req: Request, res: Response): Promise<void> {
  const params = parseWgVariables(req) as {
    arbitrumBlock: number;
    ethereumBlock: number;
    fantomBlock: number;
    polygonBlock: number;
    baseBlock: number;
    berachainBlock: number;
  };
  const result = await resolvers.Query.atBlockTokenSupplies(null, params);
  res.json(wundergraphResponse(result));
}

/**
 * GET /operations/atBlock/internal/protocolMetrics
 * Query params (via wg_variables): {
 *   arbitrumBlock: number,
 *   ethereumBlock: number,
 *   fantomBlock: number,
 *   polygonBlock: number,
 *   baseBlock: number,
 *   berachainBlock: number
 * }
 */
export async function atBlockInternalProtocolMetricsHandler(
  req: Request,
  res: Response
): Promise<void> {
  const params = parseWgVariables(req) as {
    arbitrumBlock: number;
    ethereumBlock: number;
    fantomBlock: number;
    polygonBlock: number;
    baseBlock: number;
    berachainBlock: number;
  };
  const result = await resolvers.Query.atBlockProtocolMetrics(null, params);
  res.json(wundergraphResponse(result));
}
