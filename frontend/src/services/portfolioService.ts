import { request } from "@/lib/api";
import type { MessageResponse, StockDto } from "@/lib/types";

export const portfolioService = {
    list: () => request<StockDto[]>("/api/portfolio"),
    add: (symbol: string) =>
        request<MessageResponse>(`/api/portfolio/add/${encodeURIComponent(symbol)}`, {
            method: "POST",
        }),
    remove: (symbol: string) =>
        request<MessageResponse>(`/api/portfolio?symbol=${encodeURIComponent(symbol)}`, { method: "DELETE" }),
};
