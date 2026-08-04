import { getCurrentUser, can } from "@/lib/permissions";
import { getCompanySettings, getExpenseCategories, getSuppliers } from "@/lib/configuraciones/queries";
import { ModulePlaceholder } from "@/components/layout/module-placeholder";
import { SettingsForm } from "@/components/configuraciones/settings-form";
import { SharedCatalogManager } from "@/components/configuraciones/shared-catalog-manager";
import {
  createExpenseCategoryAction,
  toggleExpenseCategoryAction,
  createSupplierAction,
  toggleSupplierAction,
} from "@/app/(app)/configuraciones/actions";

export default async function ConfiguracionesPage() {
  const user = await getCurrentUser();
  const permissions = user?.permissions ?? [];

  if (!can(permissions, "configuraciones.manage")) {
    return (
      <ModulePlaceholder title="Configuraciones" description="No tienes permiso para ver este módulo." denied />
    );
  }

  const [settings, expenseCategories, suppliers] = await Promise.all([
    getCompanySettings(user!.empresaId),
    getExpenseCategories(),
    getSuppliers(),
  ]);

  if (!settings) {
    return <ModulePlaceholder title="Configuraciones" description="No se encontró la configuración de la empresa." />;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">Configuraciones</h1>

      <SettingsForm settings={settings} />

      <SharedCatalogManager
        title="Categorías de gasto"
        description="Compartidas entre todas las empresas de la plataforma (igual que Proveedores)."
        items={expenseCategories}
        onCreate={createExpenseCategoryAction}
        onToggle={toggleExpenseCategoryAction}
      />

      <SharedCatalogManager
        title="Proveedores"
        description="Usados en compras y gastos."
        items={suppliers}
        onCreate={createSupplierAction}
        onToggle={toggleSupplierAction}
      />
    </div>
  );
}
