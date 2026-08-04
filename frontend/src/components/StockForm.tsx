"use client";

import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import { stockService } from "@/services/stockService";
import { syncServerErrors, type ServerErrorSetter } from "@/lib/formErrors";
import {
  stockCreateSchema,
  stockUpdateSchema,
  type StockCreateValues,
  type StockUpdateValues,
} from "@/lib/schemas";
import { Button, Card, Input } from "@/components/ui";
import { useToast } from "@/components/Toast";

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

// Must match the exact registered field names (PascalCase) so syncServerErrors'
// case-insensitive needle maps the backend's "Symbol" key onto setError("Symbol")
// — a lowercase "symbol" would set an error RHF never renders under "Symbol".
const FIELDS = [
  "Symbol",
  "CompanyName",
  "Purchase",
  "Divided",
  "LastDiv",
  "Industry",
  "Sector",
  "MarketCap",
] as const;

export default function StockForm({ mode, initial }: StockFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [banner, setBanner] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<StockCreateValues | StockUpdateValues>({
    // Create and edit schemas differ only by Sector; both resolve to a plain
    // string object, so a single cast keeps the union form type sound.
    resolver: zodResolver(
      mode === "create" ? stockCreateSchema : stockUpdateSchema
    ) as unknown as Resolver<StockCreateValues | StockUpdateValues>,
    defaultValues: {
      Symbol: initial?.symbol ?? "",
      CompanyName: initial?.companyName ?? "",
      Purchase: initial?.purchase?.toString() ?? "",
      Divided: initial?.divided?.toString() ?? "",
      LastDiv: initial?.lastDiv?.toString() ?? "",
      Industry: initial?.industry ?? "",
      Sector: "",
      MarketCap: initial?.marketCap?.toString() ?? "",
    },
  });

  const sectorError =
    mode === "create" && "Sector" in errors
      ? errors.Sector?.message
      : undefined;

  const onSubmit = async (values: StockCreateValues | StockUpdateValues) => {
    setBanner(null);
    const num = (s: string) => Number(s);
    const symbol = values.Symbol.trim().toUpperCase();
    const companyName = values.CompanyName.trim();
    const industry = values.Industry.trim();

    try {
      if (mode === "create") {
        const created = await stockService.create({
          symbol,
          companyName,
          purchase: num(values.Purchase),
          divided: num(values.Divided),
          lastDiv: num(values.LastDiv),
          industry,
          sector: (values as StockCreateValues).Sector.trim(),
          marketCap: num(values.MarketCap),
        });
        toast.success(`${symbol} added to the markets!`);
        router.push(`/stocks/${created.id}`);
      } else if (initial) {
        await stockService.update(initial.id, {
          symbol,
          companyName,
          purchase: num(values.Purchase),
          divided: num(values.Divided),
          lastDiv: num(values.LastDiv),
          industry,
          marketCap: num(values.MarketCap),
        });
        toast.success(`${symbol} updated successfully!`);
        router.push(`/stocks/${initial.id}`);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        const fieldMsg = syncServerErrors(
          err.errors,
          setError as unknown as ServerErrorSetter,
          [...FIELDS]
        );
        if (fieldMsg) {
          toast.error(fieldMsg);
        } else {
          toast.error(err.message);
          setBanner(err.message);
        }
      } else {
        toast.error("Could not save the stock.");
        setBanner("Could not save the stock.");
      }
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

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="mt-8 flex flex-col gap-5"
      >
        {banner && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {banner}
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Input
            id="symbol"
            label="Symbol"
            maxLength={10}
            placeholder="AAPL"
            className="font-mono uppercase"
            error={errors.Symbol?.message}
            {...register("Symbol")}
          />
          <Input
            id="companyName"
            label="Company name"
            maxLength={100}
            placeholder="Apple Inc."
            error={errors.CompanyName?.message}
            {...register("CompanyName")}
          />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <Input
            id="purchase"
            label="Purchase price"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            error={errors.Purchase?.message}
            {...register("Purchase")}
          />
          <Input
            id="divided"
            label="Dividend"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            error={errors.Divided?.message}
            {...register("Divided")}
          />
          <Input
            id="lastDiv"
            label="Last dividend"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            error={errors.LastDiv?.message}
            {...register("LastDiv")}
          />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Input
            id="industry"
            label="Industry"
            maxLength={100}
            placeholder="Technology"
            error={errors.Industry?.message}
            {...register("Industry")}
          />
          {mode === "create" ? (
            <Input
              id="sector"
              label="Sector"
              maxLength={100}
              placeholder="Technology"
              error={sectorError}
              {...register("Sector")}
            />
          ) : (
            <Input
              id="marketCap"
              label="Market cap (USD)"
              type="number"
              min="0"
              placeholder="2500000000"
              error={errors.MarketCap?.message}
              {...register("MarketCap")}
            />
          )}
        </div>

        {mode === "create" ? (
          <Input
            id="marketCap"
            label="Market cap (USD)"
            type="number"
            min="0"
            placeholder="2500000000"
            error={errors.MarketCap?.message}
            {...register("MarketCap")}
          />
        ) : null}

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={isSubmitting}>
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
