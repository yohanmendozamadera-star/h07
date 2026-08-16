import { NextRequest } from "next/server";
import { getCurrentUser, can } from "@/lib/permissions";
import { getExpenses } from "@/lib/gastos/queries";
import { buildExcelResponse } from "@/lib/excel/build-workbook";
import { getToday, formatDate } from "@/lib/format";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !can(user.permissions, "gastos.view")) {
    return new Response("No autorizado", { status: 403 });
  }

  const today = getToday(user.countryCode);
  const searchParams = request.nextUrl.searchParams;
  const from = searchParams.get("from") ?? today;
  const to = searchParams.get("to") ?? today;

  const expenses = await getExpenses(from, to);

  return buildExcelResponse(
    [
      {
        name: "Gastos",
        columns: [
          { header: "Fecha", key: "fecha", width: 14 },
          { header: "Tipo", key: "tipo", width: 12 },
          { header: "Descripción", key: "descripcion", width: 32 },
          { header: "Categoría", key: "categoria", width: 20 },
          { header: "Proveedor", key: "proveedor", width: 20 },
          { header: "Monto", key: "monto", width: 14 },
        ],
        rows: expenses.map((expense) => ({
          fecha: formatDate(expense.expense_date, user.countryCode),
          tipo: expense.type === "fijo" ? "Fijo" : "Variable",
          descripcion: expense.description ?? "",
          categoria: expense.category?.name ?? "",
          proveedor: expense.supplier?.name ?? "",
          monto: expense.amount,
        })),
      },
    ],
    "gastos.xlsx",
  );
}
