import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type OrderLockStatus = { blocked: boolean; dueDate: string; totalAmount: number } | { blocked: false };

// A los 6 días de mora se bloquea solo la creación de pedidos (Toma Pedidos);
// el resto de la app sigue funcionando con normalidad — decisión explícita
// del negocio, no una suspensión total como antes.
export const getOrderLockStatus = cache(async (empresaId: string): Promise<OrderLockStatus> => {
  const supabase = await createClient();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 6);
  const cutoffIso = cutoff.toISOString().slice(0, 10);

  const { data } = await supabase
    .from("invoices")
    .select("due_date, total_amount")
    .eq("empresa_id", empresaId)
    .in("status", ["pending", "overdue"])
    .lte("due_date", cutoffIso)
    .order("due_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!data) return { blocked: false };
  return { blocked: true, dueDate: data.due_date, totalAmount: data.total_amount };
});
