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

export type MonthlyGoal = {
  fixed_cost: number;
  margin_percent: number;
  goal_amount: number;
};
