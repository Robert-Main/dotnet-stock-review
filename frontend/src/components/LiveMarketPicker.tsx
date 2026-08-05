"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, TrendingUp } from "lucide-react";
import { ApiError } from "@/lib/api";
import { stockService } from "@/services/stockService";
import { useToast } from "@/components/Toast";
import type { LiveStockHit } from "@/lib/types";

/**
 * \"Add from the live market\" picker for the create-stock form. Searches FMP's
 * live universe (debounced, aborted when stale) and adds the selected stock
 * server-side from live quote data — no manual fundamentals needed. If the
 * symbol already exists locally the API returns it untouched and we navigate
 * to it instead of duplicating.
 */
export default function LiveMarketPicker() {
  const router = useRouter();
  const toast = useToast();
  // Hand-off from the dashboard search: /stocks/new?symbol=TSLA lands with the
  // query pre-filled and the dropdown opens as soon as the pre-seeded search
  // resolves. Read in a mount effect — this page is statically prerendered, so
  // a useState initializer would only ever see the server-rendered empty state
  // after hydration.
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const symbol = new URLSearchParams(window.location.search).get("symbol");
    if (!symbol?.trim()) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuery(symbol.trim());
    // Focus only on the hand-off — plain visits keep the manual form's flow.
    inputRef.current?.focus();
  }, []);
  const [hits, setHits] = useState<LiveStockHit[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [searching, setSearching] = useState(false);
  const [addingSymbol, setAddingSymbol] = useState<string | null>(null);

  const trimmed = query.trim();
  // Dropdown visibility is derived so clearing the query hides stale results
  // without a synchronous setState inside the effect (the lint rule forbids it).
  const showListbox = trimmed.length >= 2 && open;
  const visibleHits = trimmed.length >= 2 ? hits : [];

  // Debounced live search. `active` + AbortController guard against a slow
  // response overwriting results for a newer query. All setState calls live
  // inside the async timer callback (never synchronously in the effect body).
  useEffect(() => {
    if (trimmed.length < 2) return;
    const ctrl = new AbortController();
    let active = true;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await stockService.searchLive(trimmed, ctrl.signal);
        if (!active) return;
        setHits(res.data);
        setOpen(true);
        setActiveIndex(0);
      } catch {
        if (!active) return;
        setHits([]);
      } finally {
        if (active) setSearching(false);
      }
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [trimmed]);

  const pick = async (symbol: string) => {
    // Guard double-submits (Enter pressed twice, Enter after click): the first
    // call flips addingSymbol, so a second call returns before firing a second
    // from-live POST.
    if (addingSymbol) return;
    setOpen(false);
    setAddingSymbol(symbol);
    try {
      const res = await stockService.addFromLive(symbol);
      toast.success(res.message);
      router.push(`/stocks/${res.stock.id}`);
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : "Could not add the stock from the live market."
      );
    } finally {
      setAddingSymbol(null);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (hits.length) {
        setOpen(true);
        setActiveIndex((i) => (i + 1) % hits.length);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (hits.length) setActiveIndex((i) => (i - 1 + hits.length) % hits.length);
    } else if (e.key === "Enter") {
      const hit = hits[activeIndex];
      if (hit) {
        e.preventDefault();
        pick(hit.symbol);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5">
      <div className="flex items-center gap-2">
        <TrendingUp size={18} className="text-emerald-400" />
        <h2 className="text-sm font-semibold text-zinc-100">
          Add from the live market
        </h2>
      </div>
      <p className="mt-1 text-xs text-zinc-500">
        Search real companies — fundamentals load straight from the market, no
        manual fields needed.
      </p>

      <div className="relative mt-3">
        <Search
          size={16}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
        />
        <input
          type="text"
          role="combobox"
          aria-expanded={showListbox}
          aria-controls="live-market-listbox"
          aria-activedescendant={
            showListbox && visibleHits[activeIndex]
              ? `live-hit-${activeIndex}`
              : undefined
          }
          ref={inputRef}
          aria-label="Search the live market"
          placeholder="Search by symbol or company name… (e.g. NVDA, Tesla)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 py-2.5 pl-10 pr-9 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20"
        />
        {searching && (
          <Loader2
            size={16}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-emerald-400"
          />
        )}

        {showListbox && (
          <ul
            id="live-market-listbox"
            role="listbox"
            aria-label="Live market results"
            className="absolute z-20 mt-2 max-h-72 w-full overflow-auto rounded-lg border border-zinc-800 bg-zinc-900 py-1 shadow-2xl shadow-black/50"
          >
            {visibleHits.length === 0 ? (
              searching ? (
                <li className="px-3.5 py-3 text-sm text-zinc-500">Searching…</li>
              ) : (
                <li
                  role="option"
                  aria-selected={false}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pick(trimmed.toUpperCase());
                  }}
                  className="flex cursor-pointer items-center justify-between gap-3 px-3.5 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-800/60"
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span className="font-mono text-xs font-semibold text-emerald-300">
                      {trimmed.toUpperCase()}
                    </span>
                    <span className="truncate">
                      Not in the popular list — add this ticker from the live
                      market
                    </span>
                  </span>
                  <span className="text-xs text-zinc-500">
                    {addingSymbol === trimmed.toUpperCase() && (
                      <Loader2 size={14} className="animate-spin text-emerald-400" />
                    )}
                  </span>
                </li>
              )
            ) : (
              visibleHits.map((hit, i) => (
                <li
                  key={hit.symbol}
                  id={`live-hit-${i}`}
                  role="option"
                  aria-selected={i === activeIndex}
                  // mousedown beats blur, so selection registers before the
                  // input's onBlur closes the listbox.
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pick(hit.symbol);
                  }}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`flex cursor-pointer items-center justify-between gap-3 px-3.5 py-2.5 text-sm transition-colors ${
                    i === activeIndex
                      ? "bg-emerald-500/10"
                      : "hover:bg-zinc-800/60"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span className="font-mono text-xs font-semibold text-emerald-300">
                      {hit.symbol}
                    </span>
                    <span className="truncate text-zinc-300">{hit.name}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2 text-xs text-zinc-500">
                    {hit.exchangeShortName ?? hit.exchange}
                    {addingSymbol === hit.symbol && (
                      <Loader2 size={14} className="animate-spin text-emerald-400" />
                    )}
                  </span>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
