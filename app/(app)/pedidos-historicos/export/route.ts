import { NextRequest } from "next/server";
import { getCurrentUser, can } from "@/lib/permissions";
import { getPedidosHistoricos } from "@/lib/pedidos/queries";
import { hasActivePlan } from "@/lib/planes/queries";
import { paymentMethodLabel } from "@/lib/pedidos/types";
import { buildExcelResponse } from "@/lib/excel/build-workbook";
import { getToday, formatDateTime } from "@/lib/format";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !can(user.permissions, "pedidos.view")) {
    return new Response("No autorizado", { status: 403 });
  }

  // El histórico completo es beneficio de los planes pagos, igual que la
  // vista — un usuario en plan Free no debe poder descargarlo por esta vía.
  if (!(await hasActivePlan(user.empresaId))) {
    return new Response("El historial completo es un beneficio de los planes pagos.", { status: 403 });
  }

  const today = getToday(user.countryCode);
  const searchParams = request.nextUrl.searchParams;
  const from = searchParams.get("from") ?? today;
  const to = searchParams.get("to") ?? today;

  const orders = await getPedidosHistoricos(from, to);

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
          pago: paymentMethodLabel(order.payment_method),
          total: order.total_amount,
          fecha: formatDateTime(order.created_at, user.countryCode),
          estado: order.status,
        })),
      },
    ],
    "pedidos-historicos.xlsx",
  );
}
