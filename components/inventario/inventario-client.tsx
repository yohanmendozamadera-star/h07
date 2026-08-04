"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PurchaseFormDialog } from "@/components/inventario/purchase-form-dialog";
import { ShrinkageFormDialog } from "@/components/inventario/shrinkage-form-dialog";
import type { CatalogItem } from "@/lib/servicios/types";
import type { SharedCatalogRow } from "@/lib/configuraciones/types";
import type { PurchaseRow, ShrinkageRow, StockRow } from "@/lib/inventario/types";
import { formatCurrency, formatDate } from "@/lib/format";

export function InventarioClient({
  items,
  suppliers,
  purchases,
  shrinkages,
  stock,
  canCreate,
}: {
  items: CatalogItem[];
  suppliers: SharedCatalogRow[];
  purchases: PurchaseRow[];
  shrinkages: ShrinkageRow[];
  stock: StockRow[];
  canCreate: boolean;
}) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Todavía no hay productos que manejen inventario. Ve a Servicios (canal Productos) para agregar al menos uno.
      </p>
    );
  }

  return (
    <Tabs defaultValue="stock">
      <TabsList>
        <TabsTrigger value="stock">Stock</TabsTrigger>
        <TabsTrigger value="compras">Compras</TabsTrigger>
        <TabsTrigger value="mermas">Mermas</TabsTrigger>
      </TabsList>

      <TabsContent value="stock" className="space-y-3 pt-3">
        {stock.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay movimientos de inventario.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="p-2 font-medium">Producto</th>
                  <th className="p-2 font-medium">Comprado</th>
                  <th className="p-2 font-medium">Vendido</th>
                  <th className="p-2 font-medium">Merma</th>
                  <th className="p-2 font-medium">Disponible</th>
                </tr>
              </thead>
              <tbody>
                {stock.map((row) => (
                  <tr key={row.catalog_item_id} className="border-t">
                    <td className="p-2">{row.name}</td>
                    <td className="p-2">{row.purchased_qty}</td>
                    <td className="p-2">{row.sold_qty}</td>
                    <td className="p-2">{row.shrinkage_qty}</td>
                    <td className="p-2 font-medium">{row.available_qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </TabsContent>

      <TabsContent value="compras" className="space-y-3 pt-3">
        <div className="flex justify-end">{canCreate && <PurchaseFormDialog items={items} suppliers={suppliers} />}</div>

        {purchases.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay compras registradas.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="p-2 font-medium">Producto</th>
                  <th className="p-2 font-medium">Proveedor</th>
                  <th className="p-2 font-medium">Cantidad</th>
                  <th className="p-2 font-medium">Costo unitario</th>
                  <th className="p-2 font-medium">Total</th>
                  <th className="p-2 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((purchase) => (
                  <tr key={purchase.id} className="border-t">
                    <td className="p-2">{purchase.catalog_item?.name ?? "—"}</td>
                    <td className="p-2">{purchase.supplier?.name ?? "—"}</td>
                    <td className="p-2">{purchase.quantity}</td>
                    <td className="p-2">{formatCurrency(purchase.unit_cost)}</td>
                    <td className="p-2">{formatCurrency(purchase.total_cost)}</td>
                    <td className="p-2">{formatDate(purchase.purchase_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </TabsContent>

      <TabsContent value="mermas" className="space-y-3 pt-3">
        <div className="flex justify-end">{canCreate && <ShrinkageFormDialog items={items} />}</div>

        {shrinkages.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay mermas registradas.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="p-2 font-medium">Producto</th>
                  <th className="p-2 font-medium">Cantidad</th>
                  <th className="p-2 font-medium">Motivo</th>
                  <th className="p-2 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {shrinkages.map((shrinkage) => (
                  <tr key={shrinkage.id} className="border-t">
                    <td className="p-2">{shrinkage.catalog_item?.name ?? "—"}</td>
                    <td className="p-2">{shrinkage.quantity}</td>
                    <td className="p-2">{shrinkage.reason ?? "—"}</td>
                    <td className="p-2">{formatDate(shrinkage.shrinkage_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
