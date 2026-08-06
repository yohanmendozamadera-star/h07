import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { ExpenseRow } from "@/lib/gastos/types";

// Filtrado por rango de fechas (por defecto, solo hoy — ver DateRangeFilter).
export const getExpenses = cache(async (dateFrom: string, dateTo: string): Promise<ExpenseRow[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("expenses")
    .select(
      "id, type, amount, expense_date, description, category_id, supplier_id, category:expense_categories(name), supplier:suppliers(name)",
    )
    .is("deleted_at", null)
    .gte("expense_date", dateFrom)
    .lte("expense_date", dateTo)
    .order("expense_date", { ascending: false })
    .limit(2000)
    .returns<ExpenseRow[]>();

  return data ?? [];
});
