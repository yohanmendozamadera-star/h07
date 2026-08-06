import { getCurrentUser, can } from "@/lib/permissions";
import { getDashboardSummary, getDailySales, getBreakEven, getTechnicianProductivity } from "@/lib/dashboard/queries";
import { ModulePlaceholder } from "@/components/layout/module-placeholder";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { DailySalesChart } from "@/components/dashboard/daily-sales-chart";
import { BreakEvenCard } from "@/components/dashboard/break-even-card";
import { ProductivityTable } from "@/components/dashboard/productivity-table";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const permissions = user?.permissions ?? [];

  if (!can(permissions, "reportes.view")) {
    return <ModulePlaceholder title="Dashboard" description="No tienes permiso para ver este módulo." denied />;
  }

  const [summary, dailySales, breakEven, productivity] = await Promise.all([
    getDashboardSummary(),
    getDailySales(),
    getBreakEven(user!.empresaId),
    getTechnicianProductivity(),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">Hola, {user!.fullName}</h1>

      <Tabs defaultValue="ventas">
        <TabsList>
          <TabsTrigger value="ventas">Ventas</TabsTrigger>
          <TabsTrigger value="productividad">Productividad</TabsTrigger>
        </TabsList>

        <TabsContent value="ventas" className="space-y-4 pt-3">
          <SummaryCards summary={summary} />
          <DailySalesChart points={dailySales} />
          <BreakEvenCard data={breakEven} salesMonth={summary.salesMonth} />
        </TabsContent>

        <TabsContent value="productividad" className="pt-3">
          <ProductivityTable rows={productivity} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
