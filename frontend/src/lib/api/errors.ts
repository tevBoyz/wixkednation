export type ApiErrorBody = {
  success?: false;
  message?: string;
  error?: string;
  errors?: Record<string, string[] | string> | string[];
  statusCode?: number;
  code?: string;
  blockedUntil?: string;
};

export class ApiError extends Error {
  readonly status: number;
  readonly body: ApiErrorBody | null;
  readonly fieldErrors: Record<string, string[]>;

  constructor(
    message: string,
    options: {
      status: number;
      body?: ApiErrorBody | null;
      fieldErrors?: Record<string, string[]>;
    },
  ) {
    super(message);
    this.name = "ApiError";
    this.status = options.status;
    this.body = options.body ?? null;
    this.fieldErrors = options.fieldErrors ?? {};
  }
}

const TECHNICAL_MESSAGE_PATTERNS = [
  /prisma/i,
  /Invalid\s+`/,
  /invocation in/i,
  /Unknown argument/i,
  /\.(?:js|ts|tsx|mjs|cjs):\d+/i,
  /\\Users\\/,
  /\/src\//,
  /ECONNREFUSED/,
  /Unexpected token/,
  /at\s+\w+\s+\(/,
  /SyntaxError/,
  /TypeError:/,
  /Internal server error/i,
];

export function isTechnicalErrorMessage(message: string | undefined | null): boolean {
  if (!message?.trim()) {
    return false;
  }

  if (message.length > 200) {
    return true;
  }

  return TECHNICAL_MESSAGE_PATTERNS.some((pattern) => pattern.test(message));
}

export function sanitizeUserFacingMessage(
  message: string | undefined,
  fallback: string,
  status?: number,
): string {
  if (!message?.trim()) {
    return fallback;
  }

  if (isTechnicalErrorMessage(message)) {
    return fallback;
  }

  if (status !== undefined && status >= 500) {
    return fallback;
  }

  return message;
}

function normalizeFieldErrors(
  errors: ApiErrorBody["errors"],
): Record<string, string[]> {
  if (!errors) {
    return {};
  }

  if (Array.isArray(errors)) {
    return { _form: errors.map(String) };
  }

  const result: Record<string, string[]> = {};

  for (const [key, value] of Object.entries(errors)) {
    result[key] = Array.isArray(value) ? value.map(String) : [String(value)];
  }

  return result;
}

export function getErrorMessage(
  error: unknown,
  fallback = "Something went wrong",
): string {
  if (error instanceof ApiError) {
    return sanitizeUserFacingMessage(error.message, fallback, error.status);
  }

  if (error instanceof Error && error.message) {
    return sanitizeUserFacingMessage(error.message, fallback);
  }

  if (typeof error === "string" && error.trim()) {
    return sanitizeUserFacingMessage(error, fallback);
  }

  return fallback;
}

function formatBlockedUntilLocal(value: string | undefined): string | null {
  if (!value?.trim()) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  try {
    return date.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return date.toISOString();
  }
}

/** Prefer API message for phone order rate-limit (429 / ORDER_PHONE_BLOCKED). */
export function getOrderPhoneBlockedMessage(error: unknown): string | null {
  if (!(error instanceof ApiError)) {
    return null;
  }

  const code = error.body?.code;
  if (error.status !== 429 && code !== "ORDER_PHONE_BLOCKED") {
    return null;
  }

  const fallback =
    "Too many orders from this number. Please try again later.";
  const message = sanitizeUserFacingMessage(
    error.body?.message || error.message,
    fallback,
    error.status,
  );

  const until = formatBlockedUntilLocal(error.body?.blockedUntil);
  if (!until) {
    return message;
  }

  return `${message} You can try again after ${until}.`;
}

export function getOrderSubmitErrorMessage(
  error: unknown,
  fallback = "Could not place order",
): string {
  const blocked = getOrderPhoneBlockedMessage(error);
  if (blocked) {
    return blocked;
  }

  if (error instanceof ApiError) {
    const bodyMessage = error.body?.message?.trim();
    if (bodyMessage && error.status >= 400 && error.status < 500) {
      return sanitizeUserFacingMessage(bodyMessage, fallback, error.status);
    }
  }

  return getErrorMessage(error, fallback);
}

export async function normalizeApiError(
  response: Response,
  fallbackMessage = "Request failed",
): Promise<ApiError> {
  let body: ApiErrorBody | null = null;

  try {
    body = (await response.json()) as ApiErrorBody;
  } catch {
    body = null;
  }

  const rawMessage =
    body?.message ||
    body?.error ||
    (response.statusText ? response.statusText : fallbackMessage);

  const message = sanitizeUserFacingMessage(
    rawMessage,
    fallbackMessage,
    response.status,
  );

  return new ApiError(message, {
    status: response.status,
    body,
    fieldErrors: normalizeFieldErrors(body?.errors),
  });
}
