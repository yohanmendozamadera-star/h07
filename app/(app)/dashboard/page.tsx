import { getCurrentUser, can } from "@/lib/permissions";
import {
  getDashboardSummary,
  getDailySales,
  getBreakEven,
  getTechnicianProductivityDetail,
} from "@/lib/dashboard/queries";
import { getTodayBogota } from "@/lib/format";
import { ModulePlaceholder } from "@/components/layout/module-placeholder";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { DailySalesChart } from "@/components/dashboard/daily-sales-chart";
import { BreakEvenCard } from "@/components/dashboard/break-even-card";
import { ProductivityTable } from "@/components/dashboard/productivity-table";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const user = await getCurrentUser();
  const permissions = user?.permissions ?? [];

  if (!can(permissions, "reportes.view")) {
    return <ModulePlaceholder title="Dashboard" description="No tienes permiso para ver este módulo." denied />;
  }

  const params = await searchParams;
  const today = getTodayBogota();
  const dateFrom = params.from ?? today;
  const dateTo = params.to ?? today;

  const [summary, dailySales, breakEven, productivity] = await Promise.all([
    getDashboardSummary(),
    getDailySales(),
    getBreakEven(user!.empresaId),
    getTechnicianProductivityDetail(dateFrom, dateTo),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">Hola, {user!.fullName}</h1>

      <Tabs defaultValue="ventas">
        <TabsList>
          <TabsTrigger value="ventas">Ventas</TabsTrigger>
          <TabsTrigger value="productividad">Productividad</TabsTrigger>
          <TabsTrigger value="punto-equilibrio">Punto de equilibrio</TabsTrigger>
        </TabsList>

        <TabsContent value="ventas" className="space-y-4 pt-3">
          <SummaryCards summary={summary} />
          <DailySalesChart points={dailySales} />
        </TabsContent>

        <TabsContent value="productividad" className="pt-3">
          <ProductivityTable
            rows={productivity}
            defaultFrom={today}
            defaultTo={today}
            exportHref={`/productividad/export?from=${dateFrom}&to=${dateTo}`}
          />
        </TabsContent>

        <TabsContent value="punto-equilibrio" className="pt-3">
          <BreakEvenCard data={breakEven} salesMonth={summary.salesMonth} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
