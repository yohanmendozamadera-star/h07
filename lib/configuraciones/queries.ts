import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { CompanySettings, SharedCatalogRow } from "@/lib/configuraciones/types";

export const getCompanySettings = cache(async (empresaId: string): Promise<CompanySettings | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("company_settings")
    .select(
      "lavanderia_enabled, inventario_enabled, taller_enabled, parqueadero_enabled, require_technician_on_invoice, show_numeric_keypad, parking_grace_minutes, commission_enabled, commission_technician_percent, parqueadero_printer_ip",
    )
    .eq("empresa_id", empresaId)
    .single();

  return data;
});

export const getExpenseCategories = cache(async (): Promise<SharedCatalogRow[]> => {
  const supabase = await createClient();
  const { data } = await supabase.from("expense_categories").select("id, name, is_active").order("name");
  return data ?? [];
});

export const getSuppliers = cache(async (): Promise<SharedCatalogRow[]> => {
  const supabase = await createClient();
  const { data } = await supabase.from("suppliers").select("id, name, is_active").order("name");
  return data ?? [];
});
