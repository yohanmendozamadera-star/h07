import { SlidersHorizontal, Tags, Truck } from "lucide-react";
import { getCurrentUser, can } from "@/lib/permissions";
import { getCompanySettings, getExpenseCategories, getSuppliers } from "@/lib/configuraciones/queries";
import { ModulePlaceholder } from "@/components/layout/module-placeholder";
import { SettingsForm } from "@/components/configuraciones/settings-form";
import { CompanyCountryForm } from "@/components/configuraciones/company-country-form";
import { SharedCatalogManager } from "@/components/configuraciones/shared-catalog-manager";
import { Tabs, TabsList, TabsContent } from "@/components/ui/tabs";
import { EmphasisTabTrigger } from "@/components/shared/emphasis-tab-trigger";
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

      <Tabs defaultValue="modulos">
        <TabsList className="min-h-16 w-full flex-wrap justify-start gap-2 bg-transparent p-2">
          <EmphasisTabTrigger value="modulos" label="Módulos y preferencias" icon={SlidersHorizontal} />
          <EmphasisTabTrigger value="categorias-gasto" label="Categorías de gasto" icon={Tags} />
          <EmphasisTabTrigger value="proveedores" label="Proveedores" icon={Truck} />
        </TabsList>

        <TabsContent value="modulos" className="space-y-4 pt-3">
          <CompanyCountryForm countryCode={user!.countryCode} />
          <SettingsForm settings={settings} />
        </TabsContent>

        <TabsContent value="categorias-gasto" className="pt-3">
          <SharedCatalogManager
            title="Categorías de gasto"
            description="Compartidas entre todas las empresas de la plataforma (igual que Proveedores)."
            items={expenseCategories}
            onCreate={createExpenseCategoryAction}
            onToggle={toggleExpenseCategoryAction}
          />
        </TabsContent>

        <TabsContent value="proveedores" className="pt-3">
          <SharedCatalogManager
            title="Proveedores"
            description="Usados en compras y gastos."
            items={suppliers}
            onCreate={createSupplierAction}
            onToggle={toggleSupplierAction}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
