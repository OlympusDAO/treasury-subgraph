import { OperationError } from "@wundergraph/sdk/client";

const STATUS_CODE = 400;
const ERROR_CODE = "BadRequestError";
const MESSAGE = "The request was invalid";

export class BadRequestError extends OperationError {
  constructor(opts?: { message?: string }) {
    super({ message: opts?.message || MESSAGE, code: ERROR_CODE, statusCode: STATUS_CODE })
  }
}
