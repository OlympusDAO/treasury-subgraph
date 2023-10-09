import { OperationError } from "@wundergraph/sdk/client";

const STATUS_CODE = 502;
const ERROR_CODE = "UpstreamSubgraphError";
const MESSAGE = "Upstream subgraph returned an invalid response";

export class UpstreamSubgraphError extends OperationError {
  constructor(opts?: { message?: string }) {
    super({ message: opts?.message || MESSAGE, code: ERROR_CODE, statusCode: STATUS_CODE })
  }
}
