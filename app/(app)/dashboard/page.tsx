import { getCurrentUser, can } from "@/lib/permissions";
import { getDashboardSummary, getDailySales, getMonthlyGoal } from "@/lib/dashboard/queries";
import { ModulePlaceholder } from "@/components/layout/module-placeholder";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { DailySalesChart } from "@/components/dashboard/daily-sales-chart";
import { MonthlyGoalCard } from "@/components/dashboard/monthly-goal-card";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const permissions = user?.permissions ?? [];

  if (!can(permissions, "reportes.view")) {
    return <ModulePlaceholder title="Dashboard" description="No tienes permiso para ver este módulo." denied />;
  }

  const [summary, dailySales, goal] = await Promise.all([
    getDashboardSummary(),
    getDailySales(),
    getMonthlyGoal(user!.empresaId),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">Hola, {user!.fullName}</h1>

      <SummaryCards summary={summary} />
      <DailySalesChart points={dailySales} />
      <MonthlyGoalCard goal={goal} salesMonth={summary.salesMonth} />
    </div>
  );
}
