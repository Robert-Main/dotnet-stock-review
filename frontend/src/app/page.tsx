"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  MessageSquare,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { ApiError } from "@/lib/api";
import { stockService } from "@/services/stockService";
import { portfolioService } from "@/services/portfolioService";
import type { LiveQuote, StockDto } from "@/lib/types";
import { formatCompact, formatCurrency } from "@/lib/format";
import { Button, Card, EmptyState, Spinner } from "@/components/ui";
import RequireAuth from "@/components/RequireAuth";
import { useToast } from "@/components/Toast";
import ConfirmDialog from "@/components/ConfirmDialog";

const PAGE_SIZE = 9;

type SortField = "symbol" | "companyName";

export default function DashboardPage() {
  const toast = useToast();
  const [stocks, setStocks] = useState<StockDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("symbol");
  const [isDescending, setIsDescending] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [inPortfolio, setInPortfolio] = useState<Set<string>>(new Set());
  const [busySymbols, setBusySymbols] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<StockDto | null>(null);

  const [quotes, setQuotes] = useState<Map<string, LiveQuote>>(new Map());
  const [quotesLoading, setQuotesLoading] = useState(false);

  // Monotonic sequence so stale/aborted requests never clobber newer state.
  const fetchSeq = useRef(0);

  // Debounce search input; reset to page 1 when the query changes.
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchStocks = useCallback(
    async (signal?: AbortSignal) => {
      const seq = ++fetchSeq.current;
      setLoading(true);
      setError(null);
      try {
        const res = await stockService.list(
          {
            symbol: debouncedSearch || undefined,
            companyName: debouncedSearch || undefined,
            sortBy,
            isDescending,
            pageNumber: page,
            pageSize: PAGE_SIZE,
          },
          signal
        );
        if (seq !== fetchSeq.current) return; // superseded by a newer request
        setStocks(res.stocks ?? []);
        setHasMore((res.stocks ?? []).length === PAGE_SIZE);
      } catch (err) {
        if (seq !== fetchSeq.current) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof ApiError ? err.message : "Failed to load stocks.");
        setStocks([]);
      } finally {
        // Only the newest request may clear the spinner.
        if (seq === fetchSeq.current) setLoading(false);
      }
    },
    [debouncedSearch, sortBy, isDescending, page]
  );

  const fetchPortfolio = useCallback(async () => {
    try {
      const portfolio = await portfolioService.list();
      setInPortfolio(
        new Set(
          portfolio
            .map((s) => s.symbol?.toUpperCase())
            .filter((s): s is string => !!s)
        )
      );
    } catch {
      // Portfolio is non-critical on the dashboard.
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    // Async data fetch on mount — setState happens after await, not synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchStocks(controller.signal);
    return () => controller.abort();
  }, [fetchStocks]);

  // Fetch live quotes for the currently displayed page of stocks.
  useEffect(() => {
    // Dedupe (the DB can hold duplicate symbols) and normalize to uppercase so
    // card lookups always match regardless of FMP's casing.
    const symbols = Array.from(
      new Set(stocks.map((s) => s.symbol?.toUpperCase() ?? "").filter(Boolean))
    );
    if (symbols.length === 0) return;
    let cancelled = false;
    // Flagging the load before the async fetch — not a cascading render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuotesLoading(true);
    stockService
      .liveQuotes(symbols)
      .then((res) => {
        if (cancelled) return;
        setQuotes(
          new Map(
            (res.data ?? []).map((q) => [q.symbol?.toUpperCase() ?? "", q])
          )
        );
      })
      .catch(() => {
        if (!cancelled) setQuotes(new Map());
      })
      .finally(() => {
        if (!cancelled) setQuotesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [stocks]);

  useEffect(() => {
    // Async data fetch on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchPortfolio();
  }, [fetchPortfolio]);

  const togglePortfolio = async (symbol: string) => {
    const upper = symbol.toUpperCase();
    if (busySymbols.has(upper)) return;
    setBusySymbols((prev) => new Set(prev).add(upper));
    try {
      if (inPortfolio.has(upper)) {
        await portfolioService.remove(symbol);
        setInPortfolio((prev) => {
          const next = new Set(prev);
          next.delete(upper);
          return next;
        });
      } else {
        await portfolioService.add(symbol);
        setInPortfolio((prev) => new Set(prev).add(upper));
      }
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Could not update portfolio."
      );
    } finally {
      setBusySymbols((prev) => {
        const next = new Set(prev);
        next.delete(upper);
        return next;
      });
    }
  };

const deleteStock = async (stock: StockDto) => {
    setDeleting(stock.id);
    try {
      await stockService.remove(stock.id);
      toast.success(`${stock.symbol} deleted.`);
      setPendingDelete(null);
      await fetchStocks();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Could not delete stock."
      );
    } finally {
      setDeleting(null);
    }
  };

  return (
    <RequireAuth>
    <div className="rise-in flex flex-col gap-8 pt-10">
      {/* Hero */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
            Markets
          </h1>
          <p className="mt-2 max-w-xl text-zinc-400">
            Browse stocks, track fundamentals, and manage your portfolio — all
            powered by the StockReview API.
          </p>
        </div>
        <Link href="/stocks/new">
          <Button>
            <Plus size={16} />
            Add stock
          </Button>
        </Link>
      </div>

      {/* Controls */}
      <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by symbol or company name…"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as SortField);
              setPage(1);
            }}
            className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-emerald-500/60"
          >
            <option value="symbol">Sort: Symbol</option>
            <option value="companyName">Sort: Company</option>
          </select>
          <button
            onClick={() => {
              setIsDescending((d) => !d);
              setPage(1);
            }}
            title={isDescending ? "Ascending" : "Descending"}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-300 transition-colors hover:border-zinc-700 hover:text-zinc-100"
          >
            {isDescending ? <ArrowDown size={16} /> : <ArrowUp size={16} />}
          </button>
        </div>
      </Card>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <Spinner />
      ) : stocks.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Search size={24} />}
            title="No stocks found"
            description={
              search
                ? "Try a different search term, or add a stock to get started."
                : "Add your first stock to start reviewing."
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {stocks.map((stock) => {
            const symbol = (stock.symbol ?? "?").toUpperCase();
            const inP = inPortfolio.has(symbol);
            const busy = busySymbols.has(symbol);
            const quote = quotes.get(symbol);
            const livePrice = quote?.price ?? null;
            const change = quote?.change ?? null;
            const changePct = quote?.changePercentage ?? null;
            const up = (change ?? 0) >= 0;
            return (
              <Card
                key={stock.id}
                className="group flex flex-col gap-4 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-lg font-bold tracking-tight text-zinc-50">
                      {symbol}
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-sm text-zinc-500">
                      {stock.companyName}
                    </p>
                  </div>
                  <span className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-[11px] font-medium text-zinc-400">
                    {stock.industry ?? "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="grid flex-1 grid-cols-3 gap-3 rounded-xl border border-zinc-800/70 bg-zinc-950/40 p-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-zinc-500">
                        {livePrice != null ? "Live" : "Price"}
                      </p>
                      <p className="mt-0.5 font-mono text-sm font-semibold text-emerald-400">
                        {formatCurrency(livePrice ?? stock.purchase)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-zinc-500">
                        Last div
                      </p>
                      <p className="mt-0.5 font-mono text-sm font-semibold text-zinc-200">
                        {formatCurrency(stock.lastDiv)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-zinc-500">
                        Mkt cap
                      </p>
                      <p className="mt-0.5 font-mono text-sm font-semibold text-zinc-200">
                        {formatCompact(quote?.marketCap ?? stock.marketCap)}
                      </p>
                    </div>
                  </div>
                </div>

                {change != null && changePct != null && (
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 font-mono text-xs font-semibold ${
                        up
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      {up ? "▲" : "▼"} {formatCurrency(Math.abs(change))}{" "}
                      ({up ? "+" : ""}
                      {changePct.toFixed(2)}%)
                    </span>
                    {quotesLoading && (
                      <span className="text-[11px] text-zinc-600">
                        refreshing…
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-zinc-800/70 pt-4">
                  <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
                    <MessageSquare size={14} />
                    {stock.comments?.length ?? 0} review
                    {(stock.comments?.length ?? 0) === 1 ? "" : "s"}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => togglePortfolio(symbol)}
                      disabled={busy}
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                        inP
                          ? "border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                          : "border border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-100"
                      }`}
                    >
                      {busy ? "…" : inP ? "In portfolio" : "Track"}
                    </button>
                    <button
                      onClick={() => setPendingDelete(stock)}
                      disabled={deleting === stock.id}
                      title="Delete stock"
                      className="rounded-lg border border-zinc-800 p-1.5 text-zinc-500 transition-colors hover:border-red-500/40 hover:text-red-400 disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                    </button>
                    <Link
                      href={`/stocks/${stock.id}`}
                      title="View details"
                      className="rounded-lg bg-zinc-800 p-1.5 text-zinc-300 transition-colors hover:bg-emerald-500 hover:text-zinc-950"
                    >
                      <ArrowUpRight size={14} />
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && stocks.length > 0 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="secondary"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="font-mono text-sm text-zinc-500">Page {page}</span>
          <Button
            variant="secondary"
            disabled={!hasMore}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title={`Delete ${pendingDelete?.symbol ?? ""}?`}
        message={
          pendingDelete && (
            <>
              <span className="font-mono font-semibold text-zinc-200">
                {pendingDelete.symbol?.toUpperCase()}
              </span>{" "}
              ({pendingDelete.companyName}) will be permanently removed from the
              markets. This cannot be undone.
            </>
          )
        }
        confirmLabel="Delete stock"
        onConfirm={() =>
          pendingDelete ? deleteStock(pendingDelete) : Promise.resolve()
        }
        onClose={() => setPendingDelete(null)}
      />
    </div>
    </RequireAuth>
  );
}
