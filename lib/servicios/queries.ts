import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { CatalogItem } from "@/lib/servicios/types";

export const getCatalogItems = cache(async (): Promise<CatalogItem[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("catalog_items")
    .select("id, channel, name, price, price_type, tracks_inventory, unit, is_active")
    .is("deleted_at", null)
    .order("channel")
    .order("name");

  return data ?? [];
});
