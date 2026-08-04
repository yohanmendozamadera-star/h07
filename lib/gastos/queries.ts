import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { ExpenseRow } from "@/lib/gastos/types";

export const getExpenses = cache(async (): Promise<ExpenseRow[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("expenses")
    .select(
      "id, type, amount, expense_date, description, category_id, supplier_id, category:expense_categories(name), supplier:suppliers(name)",
    )
    .is("deleted_at", null)
    .order("expense_date", { ascending: false })
    .limit(100)
    .returns<ExpenseRow[]>();

  return data ?? [];
});
