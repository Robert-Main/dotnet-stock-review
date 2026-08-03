import type {
  AuthResponse,
  CommentListResponse,
  CommentSingleResponse,
  CreateCommentPayload,
  CreateStockPayload,
  MessageResponse,
  StockDetailResponse,
  StockDto,
  StockListQuery,
  StockListResponse,
  UpdateStockPayload,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5276";

const TOKEN_KEY = "stockreview_token";
const USER_KEY = "stockreview_user";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
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

function extractMessage(body: unknown, fallback: string): string {
  if (!body || typeof body !== "object") return fallback;
  const b = body as Record<string, unknown>;
  if (typeof b.Message === "string" && b.Message.length > 0) return b.Message;
  if (typeof b.message === "string" && b.message.length > 0) return b.message;
  if (typeof b.title === "string" && b.title.length > 0) return b.title;
  if (typeof b === "string") return b;
  return fallback;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, headers });
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
    throw new ApiError(
      extractMessage(body, `Request failed (${res.status})`),
      res.status,
      body
    );
  }

  return body as T;
}

export const authApi = {
  register: (username: string, email: string, password: string) =>
    request<AuthResponse>("/api/account/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    }),
  login: (email: string, password: string) =>
    request<AuthResponse>("/api/account/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
};

export const stockApi = {
  list: (query: StockListQuery = {}, signal?: AbortSignal) => {
    const params = new URLSearchParams();
    if (query.symbol) params.set("symbol", query.symbol);
    if (query.companyName) params.set("companyName", query.companyName);
    if (query.sortBy) params.set("sortBy", query.sortBy);
    if (query.isDescending !== undefined)
      params.set("isDescending", String(query.isDescending));
    if (query.pageNumber) params.set("pageNumber", String(query.pageNumber));
    if (query.pageSize) params.set("pageSize", String(query.pageSize));
    const qs = params.toString();
    return request<StockListResponse>(`/api/stock${qs ? `?${qs}` : ""}`, {
      signal,
    });
  },
  get: (id: number) =>
    request<StockDetailResponse>(`/api/stock/${id}`),
  create: (payload: CreateStockPayload) =>
    request<StockDto>("/api/stock", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (id: number, payload: UpdateStockPayload) =>
    request<StockDetailResponse>(`/api/stock/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  remove: (id: number) =>
    request<MessageResponse>(`/api/stock/${id}`, { method: "DELETE" }),
};

export const commentApi = {
  forStock: (stockId: number) =>
    request<CommentListResponse>(`/api/comment/stock/${stockId}`),
  all: () => request<CommentListResponse>("/api/comment"),
  create: (symbol: string, payload: CreateCommentPayload) =>
    request<CommentSingleResponse>(`/api/comment/${symbol}`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (id: number, payload: CreateCommentPayload) =>
    request<CommentSingleResponse>(`/api/comment/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  remove: (id: number) =>
    request<CommentSingleResponse>(`/api/comment/${id}`, { method: "DELETE" }),
};

export const portfolioApi = {
  list: () => request<StockDto[]>("/api/portfolio"),
  add: (symbol: string) =>
    request<MessageResponse>(`/api/portfolio/add/${encodeURIComponent(symbol)}`, {
      method: "POST",
    }),
  remove: (symbol: string) =>
    request<MessageResponse>(
      `/api/portfolio?symbol=${encodeURIComponent(symbol)}`,
      { method: "DELETE" }
    ),
};
