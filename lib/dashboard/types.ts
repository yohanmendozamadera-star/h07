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

// Punto de equilibrio: totalmente calculado a partir de gastos (fijo/variable),
// compras (costo de lo vendido) y ventas reales de los últimos meses — el
// dueño no tiene que adivinar ni escribir ningún número.
export type BreakEvenData = {
  monthsUsed: number;
  hasEnoughData: boolean;
  avgFixedCost: number;
  contributionMarginPercent: number | null;
  breakEvenAmount: number | null;
  avgTicket: number;
  ordersNeeded: number | null;
};
