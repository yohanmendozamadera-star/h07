import { getCurrentUser, can } from "@/lib/permissions";
import { getExpenses } from "@/lib/gastos/queries";
import { getExpenseCategories, getSuppliers } from "@/lib/configuraciones/queries";
import { ModulePlaceholder } from "@/components/layout/module-placeholder";
import { ExpenseFormDialog } from "@/components/gastos/expense-form-dialog";
import { GastosTable } from "@/components/gastos/gastos-table";

export default async function GastosPage() {
  const user = await getCurrentUser();
  const permissions = user?.permissions ?? [];

  if (!can(permissions, "gastos.view")) {
    return <ModulePlaceholder title="Gastos" description="No tienes permiso para ver este módulo." denied />;
  }

  const [expenses, categories, suppliers] = await Promise.all([
    getExpenses(),
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
        <h1 className="text-xl font-semibold tracking-tight">Gastos</h1>
        {canCreate && <ExpenseFormDialog categories={activeCategories} suppliers={activeSuppliers} />}
      </div>

      <GastosTable expenses={expenses} categories={activeCategories} suppliers={activeSuppliers} canEdit={canEdit} />
    </div>
  );
}
