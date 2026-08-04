import { getCurrentUser, can } from "@/lib/permissions";
import { getExpenses } from "@/lib/gastos/queries";
import { buildExcelResponse } from "@/lib/excel/build-workbook";
import { formatDate } from "@/lib/format";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !can(user.permissions, "gastos.view")) {
    return new Response("No autorizado", { status: 403 });
  }

  const expenses = await getExpenses();

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
          fecha: formatDate(expense.expense_date),
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
