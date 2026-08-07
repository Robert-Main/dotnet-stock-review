// Mirrors StockReview DTOs. The API serializes JSON with camelCase
// property names (verified against the live API), so interfaces use camelCase.

export interface CommentDto {
  id: number | null;
  stockId: number | null;
  title: string | null;
  content: string | null;
  createdAt: string;
  createdBy: string | null;
}

export interface StockDto {
  id: number;
  symbol: string | null;
  companyName: string | null;
  purchase: number;
  divided: number;
  lastDiv: number;
  industry: string | null;
  marketCap: number;
  comments: CommentDto[];
}

export interface CreateStockPayload {
  symbol: string;
  companyName: string;
  purchase: number;
  divided: number;
  lastDiv: number;
  industry: string;
  sector: string;
  marketCap: number;
}

export interface UpdateStockPayload {
  symbol: string;
  companyName: string;
  purchase: number;
  divided: number;
  lastDiv: number;
  industry: string;
  marketCap: number;
}

export interface CreateCommentPayload {
  title: string;
  content: string;
}

export interface AuthUser {
  id: string;
  userName: string;
  email: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: AuthUser;
}

export interface StockListResponse {
  success: boolean;
  message: string;
  stocks: StockDto[];
}

export interface StockDetailResponse {
  success: boolean;
  message: string;
  stock: StockDto;
}

export interface CommentListResponse {
  success: boolean;
  message: string;
  data: CommentDto[];
}

export interface CommentSingleResponse {
  success: boolean;
  message: string;
  data: CommentDto;
}

export interface MessageResponse {
  success: boolean;
  message: string;
}

// The single error envelope every controller returns (via ApiResponse).
// `errors` is either { field: string[] } (validation) or string[] (generic).
export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]> | string[];
}

export interface StockListQuery {
  symbol?: string;
  companyName?: string;
  sortBy?: string;
  isDescending?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

export interface LiveQuote {
  symbol: string | null;
  name: string | null;
  price: number | null;
  change: number | null;
  changePercentage: number | null;
  marketCap: number | null;
  dayHigh: number | null;
  dayLow: number | null;
}

export interface LiveQuotesResponse {
  success: boolean;
  message: string;
  data: LiveQuote[];
}

export interface PricePoint {
  date: string;
  price: number;
}

export interface StockHistoryResponse {
  success: boolean;
  message: string;
  data: PricePoint[];
}

// One hit from GET /api/stock/search — the live FMP market universe.
export interface LiveStockHit {
  symbol: string;
  name: string | null;
  exchange: string | null;
  exchangeShortName: string | null;
}

export interface LiveStockSearchResponse {
  success: boolean;
  message: string;
  data: LiveStockHit[];
}

// Response of POST /api/stock/from-live — `created` is false when the symbol
// already existed locally, so the UI navigates instead of duplicating.
export interface StockFromLiveResponse {
  success: boolean;
  message: string;
  created: boolean;
  stock: StockDto;
}
