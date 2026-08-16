import { Card, CardContent } from "@/components/ui/card";
import type { ExpenseRow } from "@/lib/gastos/types";
import { formatCurrency } from "@/lib/format";
import type { CountryCode } from "@/lib/locale/countries";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="bg-blue-50 ring-blue-200 dark:bg-blue-950/30 dark:ring-blue-900">
      <CardContent className="p-3">
        <p className="text-xs text-blue-700 dark:text-blue-300">{label}</p>
        <p className="text-lg font-semibold tracking-tight text-blue-950 dark:text-blue-50">{value}</p>
      </CardContent>
    </Card>
  );
}

export function GastosSummary({ expenses, countryCode }: { expenses: ExpenseRow[]; countryCode: CountryCode }) {
  let totalFijo = 0;
  let totalVariable = 0;
  for (const expense of expenses) {
    if (expense.type === "fijo") totalFijo += expense.amount;
    else totalVariable += expense.amount;
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      <Stat label="Total gastado" value={formatCurrency(totalFijo + totalVariable, countryCode)} />
      <Stat label="Costos fijos" value={formatCurrency(totalFijo, countryCode)} />
      <Stat label="Costos variables" value={formatCurrency(totalVariable, countryCode)} />
    </div>
  );
}
