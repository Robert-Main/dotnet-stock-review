import type {
  ApiErrorResponse,
  AuthResponse,
} from "./types";

// Single source of truth for the API origin. Route-specific services (see
// src/services/*) build on `request()` and never repeat this base.
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5276";

const TOKEN_KEY = "stockreview_token";
const USER_KEY = "stockreview_user";

export class ApiError extends Error {
  status: number;
  details?: unknown;
  /** Structured { field: string[] } or string[] errors from the API, if any. */
  errors?: ApiErrorResponse["errors"];

  constructor(
    message: string,
    status: number,
    details?: unknown,
    errors?: ApiErrorResponse["errors"]
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
    this.errors = errors;
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getStoredUser(): AuthResponse["user"] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthResponse["user"]) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: AuthResponse["user"] | null): void {
  if (typeof window === "undefined") return;
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
}

// Every controller now returns { success: false, message, errors? } via
// ApiResponse. `message` is the canonical source; the fallbacks below only
// exist for framework-level edge cases (bare strings, ProblemDetails).
function extractMessage(body: unknown, fallback: string): string {
  if (typeof body === "string" && body.length > 0) return body;
  if (!body || typeof body !== "object") return fallback;
  const b = body as Record<string, unknown>;
  if (typeof b.message === "string" && b.message.length > 0) return b.message;
  if (typeof b.Message === "string" && b.Message.length > 0) return b.Message;
  if (typeof b.title === "string" && b.title.length > 0) return b.title;
  return fallback;
}

/**
 * Core fetch wrapper: attaches the JWT, handles the standardized
 * { success, message, errors? } error envelope, and broadcasts a
 * "stockreview:unauthorized" event when the session expires.
 *
 * @param path Absolute API path (e.g. "/api/stock") — never the full URL.
 */
export async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError(
      "Could not reach the API. Make sure the .NET backend is running.",
      0
    );
  }

  if (res.status === 401) {
    setToken(null);
    setStoredUser(null);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("stockreview:unauthorized"));
    }
    throw new ApiError("Your session has expired. Please sign in again.", 401);
  }

  const text = await res.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!res.ok) {
    const errorBody = (body as ApiErrorResponse | undefined) ?? null;
    throw new ApiError(
      extractMessage(body, `Request failed (${res.status})`),
      res.status,
      body,
      errorBody?.errors
    );
  }

  return body as T;
}
