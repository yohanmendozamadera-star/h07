import "server-only";
import crypto from "node:crypto";

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
