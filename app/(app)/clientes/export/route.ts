import { getCurrentUser, can } from "@/lib/permissions";
import { getClients } from "@/lib/clientes/queries";
import { buildExcelResponse } from "@/lib/excel/build-workbook";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !can(user.permissions, "clientes.view")) {
    return new Response("No autorizado", { status: 403 });
  }

  const clients = await getClients();

  return buildExcelResponse(
    [
      {
        name: "Clientes",
        columns: [
          { header: "Nombre", key: "nombre", width: 28 },
          { header: "Celular", key: "celular", width: 16 },
          { header: "Placa", key: "placa", width: 12 },
        ],
        rows: clients.map((client) => ({
          nombre: client.name,
          celular: client.phone ?? "",
          placa: client.plate ?? "",
        })),
      },
    ],
    "clientes.xlsx",
  );
}
