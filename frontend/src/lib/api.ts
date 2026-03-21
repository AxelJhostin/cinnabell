type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

type RequestOptions = {
  headers?: HeadersInit;
  signal?: AbortSignal;
};

type RequestWithBodyOptions = RequestOptions & {
  body?: unknown;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const GENERIC_ERROR_MESSAGE = "No se pudo completar la solicitud.";

function buildUrl(path: string): string {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_URL no está configurada.");
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

  const response = await fetch(buildUrl(path), init);

  if (!response.ok) {
    const errorPayload = await parseJsonSafe(response);
    const backendMessage = getErrorMessage(errorPayload);
    throw new Error(backendMessage ?? GENERIC_ERROR_MESSAGE);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await parseJsonSafe(response);
  return (data ?? undefined) as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>("GET", path, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("POST", path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PUT", path, { ...options, body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>("DELETE", path, options),
};
