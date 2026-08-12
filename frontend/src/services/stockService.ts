import { request } from "@/lib/api";
import type {
    CreateStockPayload,
    LiveQuotesResponse,
    LiveStockSearchResponse,
    MessageResponse,
    StockDetailResponse,
    StockDto,
    StockFromLiveResponse,
    StockHistoryResponse,
    StockListQuery,
    StockListResponse,
    UpdateStockPayload,
} from "@/lib/types";

export const stockService = {
    list: (query: StockListQuery = {}, signal?: AbortSignal) => {
        const params = new URLSearchParams();
        if (query.symbol) params.set("symbol", query.symbol);
        if (query.companyName) params.set("companyName", query.companyName);
        if (query.sortBy) params.set("sortBy", query.sortBy);
        if (query.isDescending !== undefined) params.set("isDescending", String(query.isDescending));
        if (query.pageNumber) params.set("pageNumber", String(query.pageNumber));
        if (query.pageSize) params.set("pageSize", String(query.pageSize));
        const qs = params.toString();
        return request<StockListResponse>(`/api/stock${qs ? `?${qs}` : ""}`, {
            signal,
        });
    },
    get: (id: number) => request<StockDetailResponse>(`/api/stock/${id}`),
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
    remove: (id: number) => request<MessageResponse>(`/api/stock/${id}`, { method: "DELETE" }),
    liveQuotes: (symbols: string[]) =>
        request<LiveQuotesResponse>(`/api/stock/live?symbols=${encodeURIComponent(symbols.join(","))}`),
    history: (symbol: string, days = 30) =>
        request<StockHistoryResponse>(`/api/stock/history/${encodeURIComponent(symbol)}?days=${days}`),
    searchLive: (query: string, signal?: AbortSignal) =>
        request<LiveStockSearchResponse>(`/api/stock/search?query=${encodeURIComponent(query)}&limit=8`, { signal }),
    addFromLive: (symbol: string) =>
        request<StockFromLiveResponse>("/api/stock/from-live", {
            method: "POST",
            body: JSON.stringify({ symbol }),
        }),
};
