"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ApiError } from "@/lib/api";
import { stockService } from "@/services/stockService";
import type { StockDto } from "@/lib/types";
import RequireAuth from "@/components/RequireAuth";
import StockForm from "@/components/StockForm";
import { Spinner } from "@/components/ui";

export default function EditStockPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [stock, setStock] = useState<StockDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {stockService.get(id)
      .then((res) => setStock(res.stock))
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Could not load stock.")
      );
  }, [id]);

  return (
    <RequireAuth>
      <div className="rise-in pt-10">
        {error ? (
          <p className="py-16 text-center text-zinc-400">{error}</p>
        ) : !stock ? (
          <Spinner />
        ) : (
          <StockForm
            mode="edit"
            initial={{
              id: stock.id,
              symbol: stock.symbol ?? "",
              companyName: stock.companyName ?? "",
              purchase: stock.purchase,
              divided: stock.divided,
              lastDiv: stock.lastDiv,
              industry: stock.industry ?? "",
              marketCap: stock.marketCap,
            }}
          />
        )}
      </div>
    </RequireAuth>
  );
}
