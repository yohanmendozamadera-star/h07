import { getCurrentUser, can } from "@/lib/permissions";
import { getCatalogItems } from "@/lib/servicios/queries";
import { getSuppliers } from "@/lib/configuraciones/queries";
import { getPurchases, getShrinkages, getStock } from "@/lib/inventario/queries";
import { ModulePlaceholder } from "@/components/layout/module-placeholder";
import { InventarioClient } from "@/components/inventario/inventario-client";

export default async function InventarioPage() {
  const user = await getCurrentUser();
  const permissions = user?.permissions ?? [];

  if (!can(permissions, "inventario.view")) {
    return <ModulePlaceholder title="Inventario" description="No tienes permiso para ver este módulo." denied />;
  }

  const [items, suppliers, purchases, shrinkages, stock] = await Promise.all([
    getCatalogItems(),
    getSuppliers(),
    getPurchases(),
    getShrinkages(),
    getStock(),
  ]);

  const inventoryItems = items.filter((item) => item.tracks_inventory && item.is_active);
  const activeSuppliers = suppliers.filter((supplier) => supplier.is_active);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">Inventario</h1>

      <InventarioClient
        items={inventoryItems}
        suppliers={activeSuppliers}
        purchases={purchases}
        shrinkages={shrinkages}
        stock={stock}
        canCreate={can(permissions, "inventario.create")}
      />
    </div>
  );
}
