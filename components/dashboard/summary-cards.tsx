import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardSummary } from "@/lib/dashboard/types";
import { formatCurrency } from "@/lib/format";

function SummaryCard({ label, value, description }: { label: string; value: string; description?: string }) {
  return (
    <Card className="bg-blue-50 ring-blue-200 dark:bg-blue-950/30 dark:ring-blue-900">
      <CardHeader className="pb-2">
        <CardDescription className="text-blue-700 dark:text-blue-300">{label}</CardDescription>
        <CardTitle className="text-2xl text-blue-950 dark:text-blue-50">{value}</CardTitle>
      </CardHeader>
      {description && <CardContent className="pt-0 text-xs text-blue-700/70 dark:text-blue-300/70">{description}</CardContent>}
    </Card>
  );
}

export function SummaryCards({ summary }: { summary: DashboardSummary }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <SummaryCard label="Ventas de hoy" value={formatCurrency(summary.salesToday)} />
      <SummaryCard label="Ventas del mes" value={formatCurrency(summary.salesMonth)} description={`${summary.ordersMonth} pedido(s)`} />
      <SummaryCard label="Gastos del mes" value={formatCurrency(summary.expensesMonth)} description={`Hoy: ${formatCurrency(summary.expensesToday)}`} />
      <SummaryCard label="Utilidad del mes" value={formatCurrency(summary.profitMonth)} description={`${summary.clientsMonth} cliente(s) atendido(s)`} />
    </div>
  );
}
