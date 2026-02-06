import type { NextFunction, Request, Response } from "express";
import type { WundergraphResponse } from "./types";

/**
 * Wrap response data in Wundergraph-compatible format
 * Wundergraph returns { data: {...}, errors?: [...] }
 */
export function wundergraphResponse<T>(
  data: T,
  errors?: Array<{ message: string }>
): WundergraphResponse<T> {
  const response: WundergraphResponse<T> = { data };
  if (errors && errors.length > 0) {
    response.errors = errors;
  }
  return response;
}

/**
 * Express middleware to handle errors and wrap responses
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Error handler middleware
 */
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error("REST API Error:", err);

  const response = wundergraphResponse(null as never, [
    { message: err.message || "Internal server error" },
  ]);
  res.status(500).json(response);
}

/**
 * Parse wg_variables query parameter
 * Wundergraph uses: ?wg_variables={"param1":"value1","param2":value2}
 *
 * Supports both raw JSON and URL-encoded JSON:
 * - Raw: ?wg_variables={"ignoreCache":true}
 * - URL-encoded: ?wg_variables=%7B%22ignoreCache%22%3Atrue%7D
 */
export function parseWgVariables(req: Request): Record<string, unknown> {
  const wgVariables = req.query.wg_variables;

  // No wg_variables provided
  if (!wgVariables) {
    return {};
  }

  // With simple query parser, wg_variables is always a string
  if (typeof wgVariables !== "string") {
    return {};
  }

  try {
    // Try direct parse first (handles raw JSON)
    const parsed = JSON.parse(wgVariables);
    return parsed as Record<string, unknown>;
  } catch {
    // If direct parse fails, try URL-decoding first
    try {
      const decoded = decodeURIComponent(wgVariables);
      const parsed = JSON.parse(decoded);
      return parsed as Record<string, unknown>;
    } catch (e) {
      throw new Error(
        `Invalid wg_variables parameter: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }
}
