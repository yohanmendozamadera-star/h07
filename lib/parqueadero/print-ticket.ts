import { formatDateTime } from "@/lib/format";
import type { CountryCode } from "@/lib/locale/countries";

const ESC = "\x1B";
const GS = "\x1D";

function escposTicket(lines: string[]) {
  return [
    ESC + "@", // init
    ESC + "a" + "\x01", // center align
    ...lines,
    "\x0A\x0A\x0A",
    GS + "V" + "\x41" + "\x00", // cut paper (full cut)
  ].join("");
}

type PrintEntryTicketInput = {
  printerIp: string;
  businessName: string;
  plate: string;
  rateName: string;
  entryAt: Date;
  countryCode: CountryCode;
};

/**
 * Imprime el tiquete de entrada en una impresora térmica de red vía QZ Tray
 * (debe estar instalado y corriendo en el computador conectado a la
 * impresora — H07 corre en la nube y no puede hablarle directo a una IP de
 * red local). Best-effort: cualquier fallo se reporta al llamador para que
 * muestre un aviso, pero NUNCA debe usarse para bloquear el registro de la
 * entrada, que ya quedó guardado en la base de datos antes de llamar esto.
 */
export async function printEntryTicket({
  printerIp,
  businessName,
  plate,
  rateName,
  entryAt,
  countryCode,
}: PrintEntryTicketInput): Promise<void> {
  const { default: qz } = await import("qz-tray");

  if (!qz.websocket.isActive()) {
    await qz.websocket.connect();
  }

  const config = qz.configs.create({ host: printerIp, port: "9100" });

  const data = [
    escposTicket([
      businessName + "\x0A",
      "--------------------------------\x0A",
      "ENTRADA DE PARQUEADERO\x0A",
      "--------------------------------\x0A",
      "Placa: " + plate + "\x0A",
      "Tarifa: " + rateName + "\x0A",
      "Hora: " + formatDateTime(entryAt.toISOString(), countryCode) + "\x0A",
      "--------------------------------\x0A",
      "Conserve este tiquete\x0A",
    ]),
  ];

  await qz.print(config, data);
}
