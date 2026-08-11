import { getCurrentUser, can } from "@/lib/permissions";
import { getExpenses } from "@/lib/gastos/queries";
import { getExpenseCategories, getSuppliers } from "@/lib/configuraciones/queries";
import { getTodayBogota } from "@/lib/format";
import { ModulePlaceholder } from "@/components/layout/module-placeholder";
import { ExpenseFormDialog } from "@/components/gastos/expense-form-dialog";
import { GastosTable } from "@/components/gastos/gastos-table";
import { GastosSummary } from "@/components/gastos/gastos-summary";
import { DateRangeFilter } from "@/components/shared/date-range-filter";
import { ExportButton } from "@/components/shared/export-button";

export default async function GastosPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const user = await getCurrentUser();
  const permissions = user?.permissions ?? [];

  if (!can(permissions, "gastos.view")) {
    return <ModulePlaceholder title="Gastos" description="No tienes permiso para ver este módulo." denied />;
  }

  const params = await searchParams;
  const today = getTodayBogota();
  const dateFrom = params.from ?? today;
  const dateTo = params.to ?? today;

  const [expenses, categories, suppliers] = await Promise.all([
    getExpenses(dateFrom, dateTo),
    getExpenseCategories(),
    getSuppliers(),
  ]);

  const activeCategories = categories.filter((category) => category.is_active);
  const activeSuppliers = suppliers.filter((supplier) => supplier.is_active);
  const canEdit = can(permissions, "gastos.edit");
  const canCreate = can(permissions, "gastos.create");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Gastos</h1>
          <p className="text-sm text-muted-foreground">
            Registra también tus costos variables (insumos, materiales, comisiones) aunque sea un estimado
            mensual — Punto de equilibrio, en el Dashboard, calcula tu margen a partir de lo que registres aquí.
          </p>
        </div>
        {canCreate && <ExpenseFormDialog categories={activeCategories} suppliers={activeSuppliers} />}
      </div>

      <div className="flex flex-wrap items-end justify-between gap-2">
        <DateRangeFilter defaultFrom={today} defaultTo={today} />
        <ExportButton href={`/gastos/export?from=${dateFrom}&to=${dateTo}`} />
      </div>

      <GastosSummary expenses={expenses} />

      <GastosTable expenses={expenses} categories={activeCategories} suppliers={activeSuppliers} canEdit={canEdit} />
    </div>
  );
}
