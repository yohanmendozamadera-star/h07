import { getCurrentUser, can } from "@/lib/permissions";
import { getPedidosHistoricos } from "@/lib/pedidos/queries";
import { hasActivePlan } from "@/lib/planes/queries";
import { buildExcelResponse } from "@/lib/excel/build-workbook";
import { formatDateTime } from "@/lib/format";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !can(user.permissions, "pedidos.view")) {
    return new Response("No autorizado", { status: 403 });
  }

  // El histórico completo es beneficio de los planes pagos, igual que la
  // vista — un usuario en plan Free no debe poder descargarlo por esta vía.
  if (!(await hasActivePlan(user.empresaId))) {
    return new Response("El historial completo es un beneficio de los planes pagos.", { status: 403 });
  }

  const orders = await getPedidosHistoricos();

  return buildExcelResponse(
    [
      {
        name: "Pedidos",
        columns: [
          { header: "Número", key: "numero", width: 20 },
          { header: "Cliente", key: "cliente", width: 24 },
          { header: "Placa", key: "placa", width: 12 },
          { header: "Pago", key: "pago", width: 14 },
          { header: "Total", key: "total", width: 14 },
          { header: "Fecha", key: "fecha", width: 20 },
          { header: "Estado", key: "estado", width: 14 },
        ],
        rows: orders.map((order) => ({
          numero: order.order_number,
          cliente: order.client_name ?? "",
          placa: order.plate ?? "",
          pago: order.payment_method ?? "",
          total: order.total_amount,
          fecha: formatDateTime(order.created_at),
          estado: order.status,
        })),
      },
    ],
    "pedidos-historicos.xlsx",
  );
}
