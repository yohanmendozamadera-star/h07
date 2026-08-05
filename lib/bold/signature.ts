import "server-only";
import crypto from "node:crypto";

const ORDER_ID_SEPARATOR = "_";

// Bold exige un orderId único por cada intento de pago, incluso para la misma
// factura — reusar el mismo orderId hace que Bold rechace el segundo intento
// con "la referencia ya fue usada" (error BTN-002 del botón de pagos). Se le
// agrega un sufijo único por intento; el webhook recupera el id real de la
// factura separando por ORDER_ID_SEPARATOR. Un uuid solo usa dígitos hex y
// guiones simples, nunca guion bajo, así que partir por "_" es seguro.
// (Antes se usaba "::" — Bold solo permite alfanuméricos, guion y guion
// bajo en orderId; los dos puntos hacían que el botón de pago fallara con
// el error BTN-001, "atributos de configuración incorrectos", confirmado
// probando la integración directamente con distintos separadores.)
export function buildBoldOrderId(invoiceId: string): string {
  return `${invoiceId}${ORDER_ID_SEPARATOR}${Date.now()}`;
}

export function parseBoldInvoiceId(orderIdOrReference: string): string {
  return orderIdOrReference.split(ORDER_ID_SEPARATOR)[0];
}

// Hash de integridad para el Botón de pagos: SHA256(orderId + amount + currency + secretKey),
// concatenados sin separador, en ese orden exacto (documentación de Bold).
export function computeBoldIntegritySignature(orderId: string, amount: string, currency: string) {
  const secretKey = process.env.BOLD_SECRET_KEY!;
  const concatenated = `${orderId}${amount}${currency}${secretKey}`;
  return crypto.createHash("sha256").update(concatenated).digest("hex");
}

// Verifica el header x-bold-signature de un webhook: HMAC-SHA256 de
// base64(cuerpo crudo) usando la llave secreta, comparado en hex.
export function verifyBoldWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false;

  const secretKey = process.env.BOLD_SECRET_KEY!;
  const base64Body = Buffer.from(rawBody).toString("base64");
  const expected = crypto.createHmac("sha256", secretKey).update(base64Body).digest("hex");

  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(signatureHeader);
  if (expectedBuffer.length !== receivedBuffer.length) return false;

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}
