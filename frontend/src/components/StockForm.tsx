"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import { stockApi } from "@/services/stockService";
import { Button, Card, Input } from "@/components/ui";

interface StockFormProps {
  mode: "create" | "edit";
  initial?: {
    id: number;
    symbol: string;
    companyName: string;
    purchase: number;
    divided: number;
    lastDiv: number;
    industry: string;
    marketCap: number;
  };
}

export default function StockForm({ mode, initial }: StockFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    Symbol: initial?.symbol ?? "",
    CompanyName: initial?.companyName ?? "",
    Purchase: initial?.purchase?.toString() ?? "",
    Divided: initial?.divided?.toString() ?? "",
    LastDiv: initial?.lastDiv?.toString() ?? "",
    Industry: initial?.industry ?? "",
    Sector: "",
    MarketCap: initial?.marketCap?.toString() ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const num = (s: string) => Number(s);
    const symbol = form.Symbol.trim().toUpperCase();

    // Match the API's route constraint for symbol routes (comment/portfolio):
    // letters, digits, dots (BRK.B) or hyphens only.
    if (!/^[A-Za-z0-9.-]+$/.test(symbol)) {
      setError(
        "Symbol may only contain letters, digits, dots (BRK.B) or hyphens."
      );
      setSubmitting(false);
      return;
    }

    const companyName = form.CompanyName.trim();
    const industry = form.Industry.trim();
    const purchase = num(form.Purchase);
    const divided = num(form.Divided);
    const lastDiv = num(form.LastDiv);
    const marketCap = num(form.MarketCap);

    try {
      if (mode === "create") {
        const created = await stockApi.create({
          symbol,
          companyName,
          purchase,
          divided,
          lastDiv,
          industry,
          sector: form.Sector.trim() || "Unknown",
          marketCap,
        });
        router.push(`/stocks/${created.id}`);
      } else if (initial) {
        await stockApi.update(initial.id, {
          symbol,
          companyName,
          purchase,
          divided,
          lastDiv,
          industry,
          marketCap,
        });
        router.push(`/stocks/${initial.id}`);
      }
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not save the stock."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="mx-auto max-w-2xl p-6 sm:p-8">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-50">
        {mode === "create" ? "Add a stock" : `Edit ${initial?.symbol}`}
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        {mode === "create"
          ? "Register a new stock on the platform."
          : "Update this stock's fundamentals."}
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Input
            id="symbol"
            label="Symbol"
            required
            maxLength={10}
            placeholder="AAPL"
            className="font-mono uppercase"
            value={form.Symbol}
            onChange={set("Symbol")}
          />
          <Input
            id="companyName"
            label="Company name"
            required
            maxLength={100}
            placeholder="Apple Inc."
            value={form.CompanyName}
            onChange={set("CompanyName")}
          />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <Input
            id="purchase"
            label="Purchase price"
            type="number"
            step="0.01"
            min="0"
            required
            placeholder="0.00"
            value={form.Purchase}
            onChange={set("Purchase")}
          />
          <Input
            id="divided"
            label="Dividend"
            type="number"
            step="0.01"
            min="0"
            required
            placeholder="0.00"
            value={form.Divided}
            onChange={set("Divided")}
          />
          <Input
            id="lastDiv"
            label="Last dividend"
            type="number"
            step="0.01"
            min="0"
            required
            placeholder="0.00"
            value={form.LastDiv}
            onChange={set("LastDiv")}
          />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Input
            id="industry"
            label="Industry"
            required
            maxLength={100}
            placeholder="Technology"
            value={form.Industry}
            onChange={set("Industry")}
          />
          {mode === "create" ? (
            <Input
              id="sector"
              label="Sector"
              maxLength={100}
              placeholder="Technology (defaults to Unknown)"
              value={form.Sector}
              onChange={set("Sector")}
            />
          ) : (
            <Input
              id="marketCap"
              label="Market cap (USD)"
              type="number"
              min="0"
              required
              placeholder="2500000000"
              value={form.MarketCap}
              onChange={set("MarketCap")}
            />
          )}
        </div>

        {mode === "create" ? (
          <Input
            id="marketCap"
            label="Market cap (USD)"
            type="number"
            min="0"
            required
            placeholder="2500000000"
            value={form.MarketCap}
            onChange={set("MarketCap")}
          />
        ) : null}

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={submitting}>
            {mode === "create" ? "Create stock" : "Save changes"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
