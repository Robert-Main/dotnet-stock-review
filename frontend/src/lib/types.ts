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

export interface StockListQuery {
  symbol?: string;
  companyName?: string;
  sortBy?: string;
  isDescending?: boolean;
  pageNumber?: number;
  pageSize?: number;
}
