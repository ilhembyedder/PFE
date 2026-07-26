/**
 * Typed error thrown by the API client.
 *
 * Every failure carries its HTTP status so callers can render a specific
 * message. See docs/DESIGN_SCREENS.md §12 "Error taxonomy" — generic errors
 * are prohibited by PRODUCT.md.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: unknown;

  constructor(
    status: number,
    message: string,
    options?: { code?: string; details?: unknown },
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = options?.code;
    this.details = options?.details;
  }

  /** Network-level failure: no response was received at all. */
  static network(): ApiError {
    return new ApiError(0, "Connexion au serveur impossible.", {
      code: "NETWORK",
    });
  }

  get isNetwork(): boolean {
    return this.status === 0;
  }

  /** Only 5xx and network failures are worth retrying. Never a 4xx. */
  get isRetryable(): boolean {
    return this.isNetwork || this.status >= 500;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
