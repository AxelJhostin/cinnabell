type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type RequestOptions = {
  headers?: HeadersInit;
  signal?: AbortSignal;
};

type RequestWithBodyOptions = RequestOptions & {
  body?: unknown;
};

type ApiErrorOptions = {
  status: number | null;
  payload?: unknown;
  isNetworkError?: boolean;
  cause?: unknown;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const GENERIC_ERROR_MESSAGE = "No se pudo completar la solicitud.";
const NETWORK_ERROR_MESSAGE = "No se pudo conectar con el servidor.";

export class ApiError extends Error {
  status: number | null;
  payload: unknown;
  isNetworkError: boolean;

  constructor(message: string, options: ApiErrorOptions) {
    super(message);
    this.name = "ApiError";
    this.status = options.status;
    this.payload = options.payload;
    this.isNetworkError = options.isNetworkError ?? false;
    if (options.cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = options.cause;
    }
  }
}

function buildUrl(path: string): string {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_URL no esta configurada.");
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

async function parseJsonSafe(response: Response): Promise<unknown | null> {
  const contentType = response.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

function getErrorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;

  if (typeof record.detail === "string" && record.detail.trim()) {
    return record.detail;
  }

  if (typeof record.message === "string" && record.message.trim()) {
    return record.message;
  }

  return null;
}

async function request<T>(
  method: HttpMethod,
  path: string,
  options: RequestWithBodyOptions = {}
): Promise<T> {
  const headers = new Headers({
    Accept: "application/json",
    ...(options.headers ?? {}),
  });

  const init: RequestInit = {
    method,
    credentials: "include",
    headers,
    signal: options.signal,
  };

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
    init.body = JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path), init);
  } catch (error) {
    throw new ApiError(NETWORK_ERROR_MESSAGE, {
      status: null,
      payload: null,
      isNetworkError: true,
      cause: error,
    });
  }

  if (!response.ok) {
    const errorPayload = await parseJsonSafe(response);
    const backendMessage = getErrorMessage(errorPayload);
    throw new ApiError(backendMessage ?? GENERIC_ERROR_MESSAGE, {
      status: response.status,
      payload: errorPayload,
    });
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await parseJsonSafe(response);
  return (data ?? undefined) as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>("GET", path, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("POST", path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PUT", path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PATCH", path, { ...options, body }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>("DELETE", path, options),
};
