import { getCurrentUser, can } from "@/lib/permissions";
import { getStock, getPurchases, getShrinkages } from "@/lib/inventario/queries";
import { buildExcelResponse } from "@/lib/excel/build-workbook";
import { formatDate } from "@/lib/format";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !can(user.permissions, "inventario.view")) {
    return new Response("No autorizado", { status: 403 });
  }

  const [stock, purchases, shrinkages] = await Promise.all([getStock(), getPurchases(), getShrinkages()]);

  return buildExcelResponse(
    [
      {
        name: "Stock",
        columns: [
          { header: "Producto", key: "producto", width: 28 },
          { header: "Comprado", key: "comprado", width: 12 },
          { header: "Vendido", key: "vendido", width: 12 },
          { header: "Merma", key: "merma", width: 12 },
          { header: "Disponible", key: "disponible", width: 14 },
        ],
        rows: stock.map((item) => ({
          producto: item.name,
          comprado: item.purchased_qty,
          vendido: item.sold_qty,
          merma: item.shrinkage_qty,
          disponible: item.available_qty,
        })),
      },
      {
        name: "Compras",
        columns: [
          { header: "Fecha", key: "fecha", width: 14 },
          { header: "Producto", key: "producto", width: 28 },
          { header: "Cantidad", key: "cantidad", width: 12 },
          { header: "Costo unitario", key: "costoUnitario", width: 16 },
          { header: "Costo total", key: "costoTotal", width: 16 },
          { header: "Proveedor", key: "proveedor", width: 20 },
        ],
        rows: purchases.map((purchase) => ({
          fecha: formatDate(purchase.purchase_date, user.countryCode),
          producto: purchase.catalog_item?.name ?? "",
          cantidad: purchase.quantity,
          costoUnitario: purchase.unit_cost,
          costoTotal: purchase.total_cost,
          proveedor: purchase.supplier?.name ?? "",
        })),
      },
      {
        name: "Mermas",
        columns: [
          { header: "Fecha", key: "fecha", width: 14 },
          { header: "Producto", key: "producto", width: 28 },
          { header: "Cantidad", key: "cantidad", width: 12 },
          { header: "Motivo", key: "motivo", width: 28 },
        ],
        rows: shrinkages.map((shrinkage) => ({
          fecha: formatDate(shrinkage.shrinkage_date, user.countryCode),
          producto: shrinkage.catalog_item?.name ?? "",
          cantidad: shrinkage.quantity,
          motivo: shrinkage.reason ?? "",
        })),
      },
    ],
    "inventario.xlsx",
  );
}
