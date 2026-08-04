import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { PurchaseRow, ShrinkageRow, StockRow } from "@/lib/inventario/types";

export const getPurchases = cache(async (): Promise<PurchaseRow[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("purchases")
    .select(
      "id, catalog_item_id, quantity, unit_cost, total_cost, purchase_date, catalog_item:catalog_items(name), supplier:suppliers(name)",
    )
    .order("purchase_date", { ascending: false })
    .limit(100)
    .returns<PurchaseRow[]>();

  return data ?? [];
});

export const getShrinkages = cache(async (): Promise<ShrinkageRow[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("shrinkages")
    .select("id, catalog_item_id, quantity, reason, shrinkage_date, catalog_item:catalog_items(name)")
    .order("shrinkage_date", { ascending: false })
    .limit(100)
    .returns<ShrinkageRow[]>();

  return data ?? [];
});

export const getStock = cache(async (): Promise<StockRow[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("stock_by_item")
    .select("catalog_item_id, name, purchased_qty, sold_qty, shrinkage_qty, available_qty")
    .order("name");

  return data ?? [];
});
