import { request } from "@/lib/api";
import type {
  CommentListResponse,
  CommentSingleResponse,
  CreateCommentPayload,
} from "@/lib/types";

export const commentService = {
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
