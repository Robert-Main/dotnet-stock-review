"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, Plus, Trash2 } from "lucide-react";
import { ApiError } from "@/lib/api";
import { portfolioApi } from "@/services/portfolioService";
import type { StockDto } from "@/lib/types";
import { formatCompact, formatCurrency } from "@/lib/format";
import { Button, Card, EmptyState, Spinner } from "@/components/ui";
import RequireAuth from "@/components/RequireAuth";

export default function PortfolioPage() {
  const [stocks, setStocks] = useState<StockDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [newSymbol, setNewSymbol] = useState("");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStocks(await portfolioApi.list());
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not load your portfolio."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Async data fetch on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const addStock = async (e: React.FormEvent) => {
    e.preventDefault();
    const symbol = newSymbol.trim().toUpperCase();
    if (!symbol) return;
    setAdding(true);
    setError(null);
    try {
      await portfolioApi.add(symbol);
      setNewSymbol("");
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not add that symbol."
      );
    } finally {
      setAdding(false);
    }
  };

  const removeStock = async (symbol: string) => {
    if (!confirm(`Remove ${symbol} from your portfolio?`)) return;
    setRemoving(symbol);
    try {
      await portfolioApi.remove(symbol);
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Could not remove stock.");
    } finally {
      setRemoving(null);
    }
  };

  const totalValue = stocks.reduce((sum, s) => sum + (s.purchase || 0), 0);
  const totalDividends = stocks.reduce((sum, s) => sum + (s.lastDiv || 0), 0);

  return (
    <RequireAuth>
    <div className="rise-in flex flex-col gap-8 pt-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
            <BarChart3 size={32} className="text-emerald-400" />
            My portfolio
          </h1>
          <p className="mt-2 max-w-xl text-zinc-400">
            The stocks you&apos;re tracking. Add a symbol to grow your watchlist.
          </p>
        </div>
        <Link href="/">
          <Button variant="secondary">
            <Plus size={16} />
            Browse markets
          </Button>
        </Link>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Holdings
          </p>
          <p className="mt-1.5 font-mono text-2xl font-bold text-zinc-100">
            {stocks.length}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Purchase value
          </p>
          <p className="mt-1.5 font-mono text-2xl font-bold text-emerald-400">
            {formatCurrency(totalValue)}
          </p>
        </Card>
      </div>

      {/* Add symbol */}
      <Card className="p-4">
        <form onSubmit={addStock} className="flex flex-col gap-3 sm:flex-row">
          <input
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value)}
            placeholder="e.g. AAPL"
            className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3.5 py-2.5 font-mono text-sm uppercase text-zinc-100 placeholder-zinc-500 outline-none transition-colors focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20"
          />
          <Button type="submit" loading={adding}>
            <Plus size={16} />
            Add to portfolio
          </Button>
        </form>
      </Card>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : stocks.length === 0 ? (
        <Card>
          <EmptyState
            icon={<BarChart3 size={24} />}
            title="Your portfolio is empty"
            description="Track stocks by adding a symbol above, or browse markets and hit “Track”."
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {stocks.map((stock) => {
            const symbol = (stock.symbol ?? "?").toUpperCase();
            return (
              <Card
                key={stock.id}
                className="flex flex-col gap-4 p-4 transition-colors hover:border-zinc-700 sm:flex-row sm:items-center"
              >
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 font-mono text-sm font-bold text-emerald-400 ring-1 ring-emerald-500/30">
                    {symbol.slice(0, 3)}
                  </div>
                  <div className="min-w-0">
                    <Link
                      href={`/stocks/${stock.id}`}
                      className="font-mono text-base font-bold text-zinc-50 transition-colors hover:text-emerald-400"
                    >
                      {symbol}
                    </Link>
                    <p className="truncate text-sm text-zinc-500">
                      {stock.companyName}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-right sm:flex sm:items-center sm:gap-6">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-zinc-500">
                      Price
                    </p>
                    <p className="font-mono text-sm font-semibold text-emerald-400">
                      {formatCurrency(stock.purchase)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-zinc-500">
                      Last div
                    </p>
                    <p className="font-mono text-sm font-semibold text-zinc-200">
                      {formatCurrency(stock.lastDiv)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-zinc-500">
                      Mkt cap
                    </p>
                    <p className="font-mono text-sm font-semibold text-zinc-200">
                      {formatCompact(stock.marketCap)}
                    </p>
                  </div>
                  <button
                    onClick={() => removeStock(symbol)}
                    disabled={removing === symbol}
                    title={`Remove ${symbol}`}
                    className="inline-flex items-center justify-center rounded-lg border border-zinc-800 p-2 text-zinc-500 transition-colors hover:border-red-500/40 hover:text-red-400 disabled:opacity-50"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </Card>
            );
          })}
          <p className="mt-2 text-center text-xs text-zinc-600">
            {totalDividends > 0 &&
              `Combined last dividend income: ${formatCurrency(totalDividends)}`}
          </p>
        </div>
      )}
    </div>
    </RequireAuth>
  );
}
