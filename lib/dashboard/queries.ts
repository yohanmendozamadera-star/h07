import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getTodayBogota, getMonthStartBogota } from "@/lib/format";
import type { DashboardSummary, DailySalesPoint, TechnicianProductivity, MonthlyGoal } from "@/lib/dashboard/types";

type OrderRow = { total_amount: number; created_at: string; client_id: string | null };
type ExpenseRow = { amount: number; expense_date: string };

// Se agregan en memoria (no con una vista SQL): a la escala de un solo
// negocio esto es simple y suficientemente rápido, y evita otra migración
// solo para reportes que probablemente cambien de forma en fases futuras.
export const getDashboardSummary = cache(async (): Promise<DashboardSummary> => {
  const supabase = await createClient();
  const today = getTodayBogota();
  const monthStart = getMonthStartBogota();

  const [ordersRes, expensesRes] = await Promise.all([
    supabase
      .from("orders")
      .select("total_amount, created_at, client_id")
      .eq("status", "completado")
      .is("deleted_at", null)
      .gte("created_at", `${monthStart}T00:00:00`)
      .returns<OrderRow[]>(),
    supabase
      .from("expenses")
      .select("amount, expense_date")
      .is("deleted_at", null)
      .gte("expense_date", monthStart)
      .returns<ExpenseRow[]>(),
  ]);

  const orders = ordersRes.data ?? [];
  const expenses = expensesRes.data ?? [];

  let salesToday = 0;
  let salesMonth = 0;
  const clientIds = new Set<string>();

  for (const order of orders) {
    salesMonth += order.total_amount;
    if (order.created_at.startsWith(today)) salesToday += order.total_amount;
    if (order.client_id) clientIds.add(order.client_id);
  }

  let expensesToday = 0;
  let expensesMonth = 0;
  for (const expense of expenses) {
    expensesMonth += expense.amount;
    if (expense.expense_date === today) expensesToday += expense.amount;
  }

  return {
    salesToday,
    salesMonth,
    expensesToday,
    expensesMonth,
    profitMonth: salesMonth - expensesMonth,
    clientsMonth: clientIds.size,
    ordersMonth: orders.length,
  };
});

export const getDailySales = cache(async (): Promise<DailySalesPoint[]> => {
  const supabase = await createClient();
  const monthStart = getMonthStartBogota();

  const { data } = await supabase
    .from("orders")
    .select("total_amount, created_at")
    .eq("status", "completado")
    .is("deleted_at", null)
    .gte("created_at", `${monthStart}T00:00:00`)
    .returns<Pick<OrderRow, "total_amount" | "created_at">[]>();

  const byDate = new Map<string, number>();
  for (const order of data ?? []) {
    const date = order.created_at.slice(0, 10);
    byDate.set(date, (byDate.get(date) ?? 0) + order.total_amount);
  }

  return Array.from(byDate.entries())
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => a.date.localeCompare(b.date));
});

type TechnicianOrderRow = {
  total_amount: number;
  technician_id: string | null;
  technician: { full_name: string } | null;
};

export const getTechnicianProductivity = cache(async (): Promise<TechnicianProductivity[]> => {
  const supabase = await createClient();
  const monthStart = getMonthStartBogota();

  const { data } = await supabase
    .from("orders")
    .select("total_amount, technician_id, technician:profiles!orders_technician_id_fkey(full_name)")
    .eq("status", "completado")
    .is("deleted_at", null)
    .not("technician_id", "is", null)
    .gte("created_at", `${monthStart}T00:00:00`)
    .returns<TechnicianOrderRow[]>();

  const byTech = new Map<string, TechnicianProductivity>();
  for (const row of data ?? []) {
    if (!row.technician_id) continue;
    const existing = byTech.get(row.technician_id) ?? {
      technicianId: row.technician_id,
      technicianName: row.technician?.full_name ?? "—",
      orderCount: 0,
      totalAmount: 0,
    };
    existing.orderCount += 1;
    existing.totalAmount += row.total_amount;
    byTech.set(row.technician_id, existing);
  }

  return Array.from(byTech.values()).sort((a, b) => b.totalAmount - a.totalAmount);
});

export const getMonthlyGoal = cache(async (empresaId: string): Promise<MonthlyGoal | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("monthly_goals")
    .select("fixed_cost, margin_percent, goal_amount")
    .eq("empresa_id", empresaId)
    .maybeSingle();

  return data;
});
