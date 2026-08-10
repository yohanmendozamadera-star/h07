import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getTodayBogota, getMonthStartBogota, toBogotaDateString } from "@/lib/format";
import type {
  DashboardSummary,
  DailySalesPoint,
  TechnicianProductivityDetailRow,
  BudgetedBreakEven,
  RealBreakEven,
} from "@/lib/dashboard/types";

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
  const today = getTodayBogota();

  const { data } = await supabase
    .from("orders")
    .select("total_amount, created_at")
    .eq("status", "completado")
    .is("deleted_at", null)
    .gte("created_at", `${monthStart}T00:00:00`)
    .returns<Pick<OrderRow, "total_amount" | "created_at">[]>();

  const byDate = new Map<string, number>();
  for (const order of data ?? []) {
    // created_at es UTC — agrupar por sus primeros 10 caracteres corría mal
    // las órdenes creadas entre 7pm y medianoche hora Colombia (caían del
    // lado del día siguiente en UTC).
    const date = toBogotaDateString(new Date(order.created_at));
    byDate.set(date, (byDate.get(date) ?? 0) + order.total_amount);
  }

  // Serie completa día 1 -> hoy (no solo los días con ventas): así el eje
  // representa el calendario real y la tendencia se ve correctamente incluso
  // con pocos días de ventas dispersos en el mes.
  const [year, month] = monthStart.split("-").map(Number);
  const lastDay = Number(today.split("-")[2]);
  const points: DailySalesPoint[] = [];
  for (let day = 1; day <= lastDay; day++) {
    const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    points.push({ date, total: byDate.get(date) ?? 0 });
  }
  return points;
});

type TechnicianOrderRow = {
  id: string;
  order_number: string;
  total_amount: number;
  created_at: string;
  technician_id: string | null;
  technician: { full_name: string } | null;
};

// Detalle por pedido (no agregado): necesario para mostrar la fecha del
// servicio y exportar el detalle real, filtrado por el rango desde/hasta
// (por defecto, solo hoy — ver DateRangeFilter). Si la empresa trabaja por
// comisión, cada fila también trae el % y el valor comisionado.
export const getTechnicianProductivityDetail = cache(
  async (dateFrom: string, dateTo: string): Promise<TechnicianProductivityDetailRow[]> => {
    const supabase = await createClient();

    const [ordersRes, settingsRes] = await Promise.all([
      supabase
        .from("orders")
        .select("id, order_number, total_amount, created_at, technician_id, technician:profiles!orders_technician_id_fkey(full_name)")
        .eq("status", "completado")
        .is("deleted_at", null)
        .not("technician_id", "is", null)
        .gte("created_at", `${dateFrom}T00:00:00`)
        .lte("created_at", `${dateTo}T23:59:59`)
        .order("created_at", { ascending: false })
        .returns<TechnicianOrderRow[]>(),
      supabase
        .from("company_settings")
        .select("commission_enabled, commission_technician_percent")
        .single<{ commission_enabled: boolean; commission_technician_percent: number | null }>(),
    ]);

    const commissionPercent =
      settingsRes.data?.commission_enabled ? settingsRes.data.commission_technician_percent : null;

    return (ordersRes.data ?? [])
      .filter((row) => row.technician_id)
      .map((row) => ({
        orderId: row.id,
        orderNumber: row.order_number,
        date: row.created_at,
        technicianId: row.technician_id!,
        technicianName: row.technician?.full_name ?? "—",
        totalAmount: row.total_amount,
        commissionPercent,
        commissionAmount: commissionPercent !== null ? (row.total_amount * commissionPercent) / 100 : null,
      }));
  },
);

type FixedCostSettings = {
  budgeted_fixed_cost: number | null;
  budgeted_fixed_cost_updated_at: string | null;
  real_fixed_cost: number | null;
  real_fixed_cost_updated_at: string | null;
};

// Punto de equilibrio presupuestado: el dueño registra el costo fijo que
// PRESUPUESTÓ para su negocio (ver RegisterFixedCostDialog). El margen de
// contribución se sigue calculando solo, promediado sobre los últimos meses
// reales (mínimo 1, máximo 6, limitado a lo que la empresa lleva activa).
export const getBudgetedBreakEven = cache(async (empresaId: string): Promise<BudgetedBreakEven> => {
  const supabase = await createClient();

  const [companyRes, settingsRes] = await Promise.all([
    supabase.from("companies").select("created_at").eq("id", empresaId).single(),
    supabase
      .from("company_settings")
      .select("budgeted_fixed_cost, budgeted_fixed_cost_updated_at, real_fixed_cost, real_fixed_cost_updated_at")
      .eq("empresa_id", empresaId)
      .single<FixedCostSettings>(),
  ]);

  const today = new Date(`${getTodayBogota()}T00:00:00`);
  const companyCreatedAt = companyRes.data?.created_at ? new Date(companyRes.data.created_at) : today;
  const monthsSinceCreated =
    (today.getFullYear() - companyCreatedAt.getFullYear()) * 12 + (today.getMonth() - companyCreatedAt.getMonth()) + 1;
  const monthsUsed = Math.min(6, Math.max(1, monthsSinceCreated));

  const rangeStart = new Date(today.getFullYear(), today.getMonth() - (monthsUsed - 1), 1);
  const rangeStartIso = rangeStart.toISOString().slice(0, 10);

  const [ordersRes, variableRes, purchasesRes] = await Promise.all([
    supabase
      .from("orders")
      .select("total_amount, created_at")
      .eq("empresa_id", empresaId)
      .eq("status", "completado")
      .is("deleted_at", null)
      .gte("created_at", `${rangeStartIso}T00:00:00`)
      .returns<{ total_amount: number; created_at: string }[]>(),
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
  const totalVariable =
    (variableRes.data ?? []).reduce((sum, e) => sum + e.amount, 0) +
    (purchasesRes.data ?? []).reduce((sum, p) => sum + p.total_cost, 0);

  const hasEnoughSalesData = totalSales > 0;
  const contributionMarginPercent = hasEnoughSalesData ? ((totalSales - totalVariable) / totalSales) * 100 : null;
  const fixedCost = settingsRes.data?.budgeted_fixed_cost ?? null;
  const breakEvenAmount =
    fixedCost !== null && contributionMarginPercent !== null && contributionMarginPercent > 0
      ? fixedCost / (contributionMarginPercent / 100)
      : null;
  const avgTicket = orderCount > 0 ? totalSales / orderCount : 0;
  const ordersNeeded =
    breakEvenAmount !== null && avgTicket > 0 ? Math.ceil(breakEvenAmount / avgTicket) : null;

  // Ventas por mes dentro de la misma ventana, para el gráfico de barras
  // (una barra por mes) comparado contra la línea del punto de equilibrio.
  const salesByMonth = new Map<string, number>();
  for (const order of ordersRes.data ?? []) {
    const month = toBogotaDateString(new Date(order.created_at)).slice(0, 7);
    salesByMonth.set(month, (salesByMonth.get(month) ?? 0) + order.total_amount);
  }
  const monthlySales: { month: string; total: number }[] = [];
  for (let i = monthsUsed - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlySales.push({ month: key, total: salesByMonth.get(key) ?? 0 });
  }

  return {
    fixedCost,
    fixedCostUpdatedAt: settingsRes.data?.budgeted_fixed_cost_updated_at ?? null,
    monthsUsed,
    hasEnoughSalesData,
    contributionMarginPercent,
    breakEvenAmount,
    avgTicket,
    ordersNeeded,
    monthlySales,
  };
});

// Punto de equilibrio real: el dueño registra el costo fijo REAL que sabe
// que paga cada mes, y el margen de contribución se calcula con las ventas
// y costos del mes EN CURSO (no un promedio), para saber en tiempo real
// cuánto le falta facturar este mes para cubrir sus costos.
export const getRealBreakEven = cache(async (empresaId: string): Promise<RealBreakEven> => {
  const supabase = await createClient();
  const monthStart = getMonthStartBogota();

  const [settingsRes, ordersRes, variableRes, purchasesRes] = await Promise.all([
    supabase
      .from("company_settings")
      .select("budgeted_fixed_cost, budgeted_fixed_cost_updated_at, real_fixed_cost, real_fixed_cost_updated_at")
      .eq("empresa_id", empresaId)
      .single<FixedCostSettings>(),
    supabase
      .from("orders")
      .select("total_amount")
      .eq("empresa_id", empresaId)
      .eq("status", "completado")
      .is("deleted_at", null)
      .gte("created_at", `${monthStart}T00:00:00`)
      .returns<{ total_amount: number }[]>(),
    supabase
      .from("expenses")
      .select("amount")
      .eq("empresa_id", empresaId)
      .eq("type", "variable")
      .is("deleted_at", null)
      .gte("expense_date", monthStart)
      .returns<{ amount: number }[]>(),
    supabase
      .from("purchases")
      .select("total_cost")
      .eq("empresa_id", empresaId)
      .gte("purchase_date", monthStart)
      .returns<{ total_cost: number }[]>(),
  ]);

  const currentMonthSales = (ordersRes.data ?? []).reduce((sum, o) => sum + o.total_amount, 0);
  const currentMonthVariable =
    (variableRes.data ?? []).reduce((sum, e) => sum + e.amount, 0) +
    (purchasesRes.data ?? []).reduce((sum, p) => sum + p.total_cost, 0);

  const hasEnoughSalesData = currentMonthSales > 0;
  const contributionMarginPercent = hasEnoughSalesData
    ? ((currentMonthSales - currentMonthVariable) / currentMonthSales) * 100
    : null;
  const fixedCost = settingsRes.data?.real_fixed_cost ?? null;
  const breakEvenAmount =
    fixedCost !== null && contributionMarginPercent !== null && contributionMarginPercent > 0
      ? fixedCost / (contributionMarginPercent / 100)
      : null;
  const stillNeeded = breakEvenAmount !== null ? Math.max(0, breakEvenAmount - currentMonthSales) : null;
  const progressPercent =
    breakEvenAmount !== null && breakEvenAmount > 0
      ? Math.min(100, Math.round((currentMonthSales / breakEvenAmount) * 100))
      : null;

  return {
    fixedCost,
    fixedCostUpdatedAt: settingsRes.data?.real_fixed_cost_updated_at ?? null,
    currentMonthSales,
    hasEnoughSalesData,
    contributionMarginPercent,
    breakEvenAmount,
    billedSoFar: currentMonthSales,
    stillNeeded,
    progressPercent,
  };
});
