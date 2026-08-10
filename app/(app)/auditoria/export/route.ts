import { NextRequest } from "next/server";
import { getCurrentUser, can } from "@/lib/permissions";
import { getAuditLogs } from "@/lib/audit/queries";
import { ACTION_LABELS, MODULE_LABELS } from "@/lib/audit/labels";
import { buildExcelResponse } from "@/lib/excel/build-workbook";
import { getTodayBogota, formatDateTime } from "@/lib/format";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !can(user.permissions, "auditoria.view")) {
    return new Response("No autorizado", { status: 403 });
  }

  const today = getTodayBogota();
  const searchParams = request.nextUrl.searchParams;
  const from = searchParams.get("from") ?? today;
  const to = searchParams.get("to") ?? today;

  const logs = await getAuditLogs(from, to);

  return buildExcelResponse(
    [
      {
        name: "Auditoría",
        columns: [
          { header: "Fecha", key: "fecha", width: 20 },
          { header: "Usuario", key: "usuario", width: 24 },
          { header: "Acción", key: "accion", width: 16 },
          { header: "Módulo", key: "modulo", width: 20 },
        ],
        rows: logs.map((log) => ({
          fecha: formatDateTime(log.created_at),
          usuario: log.userName ?? "Sistema",
          accion: ACTION_LABELS[log.action],
          modulo: MODULE_LABELS[log.module] ?? log.module,
        })),
      },
    ],
    "auditoria.xlsx",
  );
}
