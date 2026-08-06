import { NextRequest } from "next/server";
import { getCurrentUser, can } from "@/lib/permissions";
import { getTechnicianProductivityDetail } from "@/lib/dashboard/queries";
import { getTodayBogota } from "@/lib/format";
import { buildExcelResponse } from "@/lib/excel/build-workbook";
import { formatDateTime } from "@/lib/format";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !can(user.permissions, "reportes.view")) {
    return new Response("No autorizado", { status: 403 });
  }

  const today = getTodayBogota();
  const searchParams = request.nextUrl.searchParams;
  const from = searchParams.get("from") ?? today;
  const to = searchParams.get("to") ?? today;

  const rows = await getTechnicianProductivityDetail(from, to);

  return buildExcelResponse(
    [
      {
        name: "Productividad",
        columns: [
          { header: "Fecha", key: "fecha", width: 20 },
          { header: "Técnico", key: "tecnico", width: 24 },
          { header: "Pedido", key: "pedido", width: 20 },
          { header: "Total", key: "total", width: 14 },
        ],
        rows: rows.map((row) => ({
          fecha: formatDateTime(row.date),
          tecnico: row.technicianName,
          pedido: row.orderNumber,
          total: row.totalAmount,
        })),
      },
    ],
    "productividad-tecnicos.xlsx",
  );
}
