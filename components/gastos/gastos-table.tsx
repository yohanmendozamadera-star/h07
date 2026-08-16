import { Badge } from "@/components/ui/badge";
import { ExpenseFormDialog } from "@/components/gastos/expense-form-dialog";
import type { ExpenseRow } from "@/lib/gastos/types";
import type { SharedCatalogRow } from "@/lib/configuraciones/types";
import { formatCurrency, formatDate } from "@/lib/format";
import type { CountryCode } from "@/lib/locale/countries";

export function GastosTable({
  expenses,
  categories,
  suppliers,
  canEdit,
  countryCode,
}: {
  expenses: ExpenseRow[];
  categories: SharedCatalogRow[];
  suppliers: SharedCatalogRow[];
  canEdit: boolean;
  countryCode: CountryCode;
}) {
  if (expenses.length === 0) {
    return <p className="text-sm text-muted-foreground">Todavía no hay gastos registrados.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-blue-50 text-left text-xs text-blue-900 dark:bg-blue-950/40 dark:text-blue-100">
          <tr>
            <th className="p-2 font-medium">Fecha</th>
            <th className="p-2 font-medium">Tipo</th>
            <th className="p-2 font-medium">Categoría</th>
            <th className="p-2 font-medium">Proveedor</th>
            <th className="p-2 font-medium">Concepto</th>
            <th className="p-2 font-medium">Monto</th>
            {canEdit && <th className="p-2 font-medium" />}
          </tr>
        </thead>
        <tbody>
          {expenses.map((expense) => (
            <tr key={expense.id} className="border-t">
              <td className="p-2">{formatDate(expense.expense_date, countryCode)}</td>
              <td className="p-2">
                <Badge variant={expense.type === "fijo" ? "secondary" : "outline"}>
                  {expense.type === "fijo" ? "Fijo" : "Variable"}
                </Badge>
              </td>
              <td className="p-2">{expense.category?.name ?? "—"}</td>
              <td className="p-2">{expense.supplier?.name ?? "—"}</td>
              <td className="p-2">{expense.description ?? "—"}</td>
              <td className="p-2">{formatCurrency(expense.amount, countryCode)}</td>
              {canEdit && (
                <td className="p-2 text-right">
                  <ExpenseFormDialog categories={categories} suppliers={suppliers} expense={expense} />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
