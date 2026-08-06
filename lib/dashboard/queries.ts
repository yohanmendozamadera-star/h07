import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getTodayBogota, getMonthStartBogota } from "@/lib/format";
import type { DashboardSummary, DailySalesPoint, TechnicianProductivity, BreakEvenData } from "@/lib/dashboard/types";

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

// Punto de equilibrio: costo fijo promedio y margen de contribución salen
// solos de los datos reales de los últimos meses (gastos fijo/variable,
// compras de inventario, ventas) — no se le pide nada al dueño.
// "Meses a promediar" se limita a los meses que la empresa realmente lleva
// activa (mínimo 1, máximo 6) para no diluir el promedio de un negocio nuevo.
export const getBreakEven = cache(async (empresaId: string): Promise<BreakEvenData> => {
  const supabase = await createClient();

  const { data: company } = await supabase.from("companies").select("created_at").eq("id", empresaId).single();
  const today = new Date(`${getTodayBogota()}T00:00:00`);
  const companyCreatedAt = company?.created_at ? new Date(company.created_at) : today;
  const monthsSinceCreated =
    (today.getFullYear() - companyCreatedAt.getFullYear()) * 12 + (today.getMonth() - companyCreatedAt.getMonth()) + 1;
  const monthsUsed = Math.min(6, Math.max(1, monthsSinceCreated));

  const rangeStart = new Date(today.getFullYear(), today.getMonth() - (monthsUsed - 1), 1);
  const rangeStartIso = rangeStart.toISOString().slice(0, 10);

  const [ordersRes, fixedRes, variableRes, purchasesRes] = await Promise.all([
    supabase
      .from("orders")
      .select("total_amount")
      .eq("empresa_id", empresaId)
      .eq("status", "completado")
      .is("deleted_at", null)
      .gte("created_at", `${rangeStartIso}T00:00:00`)
      .returns<{ total_amount: number }[]>(),
    supabase
      .from("expenses")
      .select("amount")
      .eq("empresa_id", empresaId)
      .eq("type", "fijo")
      .is("deleted_at", null)
      .gte("expense_date", rangeStartIso)
      .returns<{ amount: number }[]>(),
    supabase
      .from("expenses")
      .select("amount")
      .eq("empresa_id", empresaId)
      .eq("type", "variable")
      .is("deleted_at", null)
      .gte("expense_date", rangeStartIso)
      .returns<{ amount: number }[]>(),
    supabase
      .from("purchases")
      .select("total_cost")
      .eq("empresa_id", empresaId)
      .gte("purchase_date", rangeStartIso)
      .returns<{ total_cost: number }[]>(),
  ]);

  const totalSales = (ordersRes.data ?? []).reduce((sum, o) => sum + o.total_amount, 0);
  const orderCount = ordersRes.data?.length ?? 0;
  const totalFixed = (fixedRes.data ?? []).reduce((sum, e) => sum + e.amount, 0);
  const totalVariable =
    (variableRes.data ?? []).reduce((sum, e) => sum + e.amount, 0) +
    (purchasesRes.data ?? []).reduce((sum, p) => sum + p.total_cost, 0);

  const hasEnoughData = totalSales > 0;
  const avgFixedCost = totalFixed / monthsUsed;
  const contributionMarginPercent = hasEnoughData ? ((totalSales - totalVariable) / totalSales) * 100 : null;
  const breakEvenAmount =
    contributionMarginPercent !== null && contributionMarginPercent > 0
      ? avgFixedCost / (contributionMarginPercent / 100)
      : null;
  const avgTicket = orderCount > 0 ? totalSales / orderCount : 0;
  const ordersNeeded =
    breakEvenAmount !== null && avgTicket > 0 ? Math.ceil(breakEvenAmount / avgTicket) : null;

  return {
    monthsUsed,
    hasEnoughData,
    avgFixedCost,
    contributionMarginPercent,
    breakEvenAmount,
    avgTicket,
    ordersNeeded,
  };
});
