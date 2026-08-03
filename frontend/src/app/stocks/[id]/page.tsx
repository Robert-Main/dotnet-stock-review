"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  MessageSquare,
  Pencil,
  Plus,
  Trash2,
  User,
} from "lucide-react";
import {
  stockApi,
  commentApi,
  portfolioApi,
  ApiError,
} from "@/lib/api";
import type { CommentDto, StockDto } from "@/lib/types";
import { formatCompact, formatCurrency, formatDateTime } from "@/lib/format";
import { Button, Card, EmptyState, Input, Spinner } from "@/components/ui";
import RequireAuth from "@/components/RequireAuth";

export default function StockDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const [stock, setStock] = useState<StockDto | null>(null);
  const [comments, setComments] = useState<CommentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [inPortfolio, setInPortfolio] = useState(false);
  const [portfolioBusy, setPortfolioBusy] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadStock = useCallback(async () => {
    try {
      const res = await stockApi.get(id);
      setStock(res.stock);
      const symbol = res.stock.symbol;
      if (symbol) {
        const portfolio = await portfolioApi.list();
        setInPortfolio(
          portfolio.some((s) => s.symbol?.toUpperCase() === symbol.toUpperCase())
        );
      }
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not load this stock."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadComments = useCallback(async () => {
    try {
      const res = await commentApi.forStock(id);
      setComments(res.data ?? []);
    } catch {
      setComments([]);
    }
  }, [id]);

  useEffect(() => {
    // Async data fetch on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadStock();
  }, [loadStock]);

  useEffect(() => {
    // Async data fetch on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadComments();
  }, [loadComments]);

  const togglePortfolio = async () => {
    if (!stock?.symbol) return;
    setPortfolioBusy(true);
    try {
      if (inPortfolio) {
        await portfolioApi.remove(stock.symbol);
        setInPortfolio(false);
      } else {
        await portfolioApi.add(stock.symbol);
        setInPortfolio(true);
      }
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Could not update portfolio.");
    } finally {
      setPortfolioBusy(false);
    }
  };

  const postComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stock?.symbol) return;
    setCommentError(null);
    setPosting(true);
    try {
      await commentApi.create(stock.symbol, { title, content });
      setTitle("");
      setContent("");
      await Promise.all([loadComments(), loadStock()]);
    } catch (err) {
      setCommentError(
        err instanceof ApiError ? err.message : "Could not post comment."
      );
    } finally {
      setPosting(false);
    }
  };

  const startEdit = (c: CommentDto) => {
    setEditingId(c.id);
    setEditTitle(c.title ?? "");
    setEditContent(c.content ?? "");
  };

  const saveEdit = async (commentId: number) => {
    setSavingEdit(true);
    setCommentError(null);
    try {
      await commentApi.update(commentId, {
        title: editTitle,
        content: editContent,
      });
      setEditingId(null);
      await loadComments();
    } catch (err) {
      setCommentError(
        err instanceof ApiError ? err.message : "Could not update comment."
      );
    } finally {
      setSavingEdit(false);
    }
  };

  const deleteComment = async (commentId: number) => {
    if (!confirm("Delete this comment?")) return;
    setDeletingId(commentId);
    try {
      await commentApi.remove(commentId);
      await loadComments();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Could not delete comment.");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <Spinner className="py-32" />;

  if (error || !stock) {
    return (
      <div className="flex flex-col items-center gap-4 pt-24">
        <p className="text-zinc-400">{error ?? "Stock not found."}</p>
        <Link href="/">
          <Button variant="secondary">Back to markets</Button>
        </Link>
      </div>
    );
  }

  const symbol = (stock.symbol ?? "?").toUpperCase();

  return (
    <RequireAuth>
    <div className="rise-in flex flex-col gap-8 pt-8">
      <Link
        href="/"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-200"
      >
        <ArrowLeft size={16} />
        Back to markets
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 font-mono text-xl font-bold text-emerald-400 ring-1 ring-emerald-500/30">
            {symbol.slice(0, 3)}
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-50">
              {symbol}
            </h1>
            <p className="mt-1 text-zinc-400">{stock.companyName}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs font-medium text-zinc-400">
                {stock.industry ?? "—"}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-500">
                <MessageSquare size={12} />
                {comments.length} review{comments.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={inPortfolio ? "secondary" : "primary"}
            onClick={togglePortfolio}
            loading={portfolioBusy}
          >
            {inPortfolio ? "Remove from portfolio" : "Add to portfolio"}
          </Button>
          <Link href={`/stocks/${stock.id}/edit`}>
            <Button variant="secondary">
              <Pencil size={16} />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Purchase price
          </p>
          <p className="mt-1.5 font-mono text-2xl font-bold text-emerald-400">
            {formatCurrency(stock.purchase)}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Dividend
          </p>
          <p className="mt-1.5 font-mono text-2xl font-bold text-zinc-100">
            {formatCurrency(stock.divided)}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Last dividend
          </p>
          <p className="mt-1.5 font-mono text-2xl font-bold text-zinc-100">
            {formatCurrency(stock.lastDiv)}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Market cap
          </p>
          <p className="mt-1.5 font-mono text-2xl font-bold text-zinc-100">
            {formatCompact(stock.marketCap)}
          </p>
        </Card>
      </div>

      {/* Comments */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Comment list */}
        <Card className="p-6 lg:col-span-2">
          <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-zinc-100">
            <MessageSquare size={18} className="text-emerald-400" />
            Reviews & comments
          </h2>

          {comments.length === 0 ? (
            <EmptyState
              icon={<MessageSquare size={22} />}
              title="No reviews yet"
              description="Be the first to share your take on this stock."
            />
          ) : (
            <div className="flex flex-col gap-4">
              {comments.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-zinc-800/70 bg-zinc-950/40 p-4"
                >
                  {editingId === c.id ? (
                    <div className="flex flex-col gap-3">
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Title"
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500/60"
                      />
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        placeholder="Your review…"
                        rows={3}
                        className="w-full resize-none rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500/60"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => saveEdit(c.id!)}
                          loading={savingEdit}
                          className="!px-3 !py-1.5 !text-xs"
                        >
                          Save
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => setEditingId(null)}
                          className="!px-3 !py-1.5 !text-xs"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 text-zinc-300">
                            <User size={14} />
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-zinc-200">
                              {c.title}
                            </p>
                            <p className="text-xs text-zinc-500">
                              {c.createdBy ?? "Anonymous"} ·{" "}
                              {formatDateTime(c.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startEdit(c)}
                            className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => deleteComment(c.id!)}
                            disabled={deletingId === c.id}
                            className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-zinc-300">
                        {c.content}
                      </p>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* New comment */}
        <Card className="h-fit p-6">
          <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-zinc-100">
            <Plus size={18} className="text-emerald-400" />
            Write a review
          </h2>
          <form onSubmit={postComment} className="flex flex-col gap-4">
            {commentError && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                {commentError}
              </div>
            )}
            <Input
              id="comment-title"
              label="Title"
              placeholder="Great long-term pick"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              required
            />
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-zinc-300">
                Review
              </span>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                maxLength={200}
                required
                placeholder="Share your thoughts on this stock…"
                className="w-full resize-none rounded-lg border border-zinc-800 bg-zinc-900/60 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20"
              />
            </label>
            <Button type="submit" loading={posting}>
              Post review
            </Button>
            <Link
              href={`/stocks/${stock.id}/edit`}
              className="inline-flex items-center justify-center gap-1 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
            >
              <ArrowUpRight size={12} />
              Reviewing in the wrong place? Edit stock info
            </Link>
          </form>
        </Card>
      </div>
    </div>
    </RequireAuth>
  );
}
