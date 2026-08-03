"use client";

import RequireAuth from "@/components/RequireAuth";
import StockForm from "@/components/StockForm";

export default function NewStockPage() {
  return (
    <RequireAuth>
      <div className="rise-in pt-10">
        <StockForm mode="create" />
      </div>
    </RequireAuth>
  );
}
