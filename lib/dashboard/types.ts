export type DashboardSummary = {
  salesToday: number;
  salesMonth: number;
  expensesToday: number;
  expensesMonth: number;
  profitMonth: number;
  clientsMonth: number;
  ordersMonth: number;
};

export type DailySalesPoint = { date: string; total: number };

export type TechnicianProductivity = {
  technicianId: string;
  technicianName: string;
  orderCount: number;
  totalAmount: number;
};

// Una fila por pedido (no agregada) — necesaria para mostrar la fecha del
// servicio y para exportar el detalle, no solo el resumen por técnico.
// commissionPercent/commissionAmount solo se llenan si la empresa trabaja
// por comisión (company_settings.commission_enabled).
export type TechnicianProductivityDetailRow = {
  orderId: string;
  orderNumber: string;
  date: string;
  technicianId: string;
  technicianName: string;
  totalAmount: number;
  commissionPercent: number | null;
  commissionAmount: number | null;
};

// Punto de equilibrio presupuestado: el dueño registra el costo fijo que
// PRESUPUESTÓ (no necesariamente lo que paga hoy) y la app calcula el
// margen de contribución promedio de los últimos meses (igual que antes),
// para decir cuánto debería facturar para llegar a ese presupuesto.
export type BudgetedBreakEven = {
  fixedCost: number | null;
  fixedCostUpdatedAt: string | null;
  monthsUsed: number;
  hasEnoughSalesData: boolean;
  contributionMarginPercent: number | null;
  breakEvenAmount: number | null;
  avgTicket: number;
  ordersNeeded: number | null;
  monthlySales: { month: string; total: number }[];
};

// Punto de equilibrio real: el dueño registra el costo fijo que SABE que
// paga cada mes, y la app calcula el margen con las ventas/costos del mes
// EN CURSO (no un promedio) para decir cuánto le falta facturar este mes.
export type RealBreakEven = {
  fixedCost: number | null;
  fixedCostUpdatedAt: string | null;
  currentMonthSales: number;
  hasEnoughSalesData: boolean;
  contributionMarginPercent: number | null;
  breakEvenAmount: number | null;
  billedSoFar: number;
  stillNeeded: number | null;
  progressPercent: number | null;
};
