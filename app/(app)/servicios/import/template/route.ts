import { getCurrentUser, can } from "@/lib/permissions";
import { buildExcelResponse } from "@/lib/excel/build-workbook";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !can(user.permissions, "servicios.edit")) {
    return new Response("No autorizado", { status: 403 });
  }

  return buildExcelResponse(
    [
      {
        name: "Servicios",
        columns: [
          { header: "Canal", key: "canal", width: 16 },
          { header: "Nombre", key: "nombre", width: 28 },
          { header: "Precio", key: "precio", width: 14 },
          { header: "Tipo de precio", key: "tipo", width: 16 },
          { header: "Unidad", key: "unidad", width: 14 },
        ],
        rows: [
          { canal: "lavanderia", nombre: "Lavado sencillo", precio: 25000, tipo: "fijo", unidad: "" },
          { canal: "taller", nombre: "Cambio de aceite", precio: 45000, tipo: "fijo", unidad: "" },
          { canal: "productos", nombre: "Shampoo para carros", precio: 18000, tipo: "fijo", unidad: "unidad" },
        ],
      },
      {
        name: "Instrucciones",
        columns: [{ header: "", key: "texto", width: 90 }],
        rows: [
          { texto: "Canal: lavanderia, productos o taller (todo en minúscula, sin tildes)." },
          { texto: "Nombre: obligatorio." },
          { texto: "Precio: obligatorio, solo números, sin puntos ni símbolo de pesos." },
          { texto: 'Tipo de precio: "fijo" o "variable". Solo aplica en Taller; en los demás canales usa "fijo".' },
          { texto: "Unidad: opcional (ej. kg, unidad, hora)." },
          { texto: "Borra las filas de ejemplo de la hoja Servicios antes de subir tu archivo." },
        ],
      },
    ],
    "plantilla-servicios.xlsx",
  );
}
