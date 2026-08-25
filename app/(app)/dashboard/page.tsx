import { getCurrentUser, can } from "@/lib/permissions";
import {
  getDashboardSummary,
  getDailySales,
  getBudgetedBreakEven,
  getRealBreakEven,
  getTechnicianProductivityDetail,
} from "@/lib/dashboard/queries";
import { getToday } from "@/lib/format";
import { ModulePlaceholder } from "@/components/layout/module-placeholder";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { DailySalesChart } from "@/components/dashboard/daily-sales-chart";
import { BudgetedBreakEvenCard, RealBreakEvenCard } from "@/components/dashboard/break-even-card";
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
  const countryCode = user!.countryCode;
  const today = getToday(countryCode);
  const dateFrom = params.from ?? today;
  const dateTo = params.to ?? today;

  const [summary, dailySales, budgetedBreakEven, realBreakEven, productivity] = await Promise.all([
    getDashboardSummary(countryCode),
    getDailySales(countryCode),
    getBudgetedBreakEven(user!.empresaId, countryCode),
    getRealBreakEven(user!.empresaId, countryCode),
    getTechnicianProductivityDetail(dateFrom, dateTo),
  ]);

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <div>
        <p className="text-sm font-medium text-cyan-600 dark:text-cyan-300">RESUMEN DEL NEGOCIO</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-primary dark:text-white md:text-3xl">Hola, {user!.fullName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Así se está moviendo tu lavadero hoy.</p>
      </div>

      <Tabs defaultValue="ventas">
        <TabsList className="h-10 rounded-xl bg-card p-1 shadow-sm ring-1 ring-border">
          <TabsTrigger value="ventas">Ventas</TabsTrigger>
          <TabsTrigger value="productividad">Productividad</TabsTrigger>
          <TabsTrigger value="punto-equilibrio">Punto de equilibrio</TabsTrigger>
        </TabsList>

        <TabsContent value="ventas" className="space-y-4 pt-3">
          <SummaryCards summary={summary} countryCode={countryCode} />
          <DailySalesChart points={dailySales} />
        </TabsContent>

        <TabsContent value="productividad" className="pt-3">
          <ProductivityTable
            rows={productivity}
            defaultFrom={today}
            defaultTo={today}
            exportHref={`/productividad/export?from=${dateFrom}&to=${dateTo}`}
            countryCode={countryCode}
          />
        </TabsContent>

        <TabsContent value="punto-equilibrio" className="space-y-4 pt-3">
          <BudgetedBreakEvenCard data={budgetedBreakEven} countryCode={countryCode} />
          <RealBreakEvenCard data={realBreakEven} countryCode={countryCode} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
