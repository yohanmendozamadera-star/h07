import { Banknote, CalendarDays, CircleDollarSign, UsersRound, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardSummary } from "@/lib/dashboard/types";
import { formatCurrency } from "@/lib/format";
import type { CountryCode } from "@/lib/locale/countries";

function SummaryCard({ label, value, description, icon: Icon }: { label: string; value: string; description?: string; icon: LucideIcon }) {
  return (
    <Card className="group relative overflow-hidden border-0 bg-card shadow-[0_10px_35px_rgba(6,41,95,0.07)] ring-1 ring-blue-950/8 transition-transform hover:-translate-y-0.5 dark:ring-white/10">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary to-cyan-400" />
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3">
          <CardDescription className="font-medium text-muted-foreground">{label}</CardDescription>
          <span className="grid size-9 place-items-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-300"><Icon className="size-4" /></span>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-primary dark:text-white">{value}</CardTitle>
      </CardHeader>
      {description && <CardContent className="pt-0 text-xs text-muted-foreground">{description}</CardContent>}
    </Card>
  );
}

export function SummaryCards({ summary, countryCode }: { summary: DashboardSummary; countryCode: CountryCode }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <SummaryCard label="Ventas de hoy" value={formatCurrency(summary.salesToday, countryCode)} icon={Banknote} />
      <SummaryCard
        label="Ventas del mes"
        value={formatCurrency(summary.salesMonth, countryCode)}
        description={`${summary.ordersMonth} pedido(s)`}
        icon={CalendarDays}
      />
      <SummaryCard
        label="Gastos del mes"
        value={formatCurrency(summary.expensesMonth, countryCode)}
        description={`Hoy: ${formatCurrency(summary.expensesToday, countryCode)}`}
        icon={CircleDollarSign}
      />
      <SummaryCard
        label="Utilidad del mes"
        value={formatCurrency(summary.profitMonth, countryCode)}
        description={`${summary.clientsMonth} cliente(s) atendido(s)`}
        icon={UsersRound}
      />
    </div>
  );
}
