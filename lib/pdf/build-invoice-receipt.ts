import "server-only";
import PDFDocument from "pdfkit";
import { formatCurrency, formatDate } from "@/lib/format";

export type InvoiceReceiptData = {
  companyName: string;
  ownerEmail: string;
  periodStart: string;
  periodEnd: string;
  totalAmount: number;
  paidAt: string;
  invoiceId: string;
};

// El recibo siempre lleva el correo del propietario de la empresa
// (companies.owner_user_id), nunca el del empleado que haya iniciado sesión
// en ese momento — es quien realmente responde por la facturación.
export function buildInvoiceReceiptPdf(data: InvoiceReceiptData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 56 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fillColor("#1d4ed8").fontSize(24).text("H07", { continued: false });
    doc.moveDown(0.3);
    doc.fillColor("#000000").fontSize(16).text("Recibo de pago");
    doc.moveDown(1);

    doc.fontSize(11).fillColor("#444444");
    doc.text(`Empresa: ${data.companyName}`);
    doc.text(`Usuario (propietario): ${data.ownerEmail}`);
    doc.text(`Referencia: ${data.invoiceId}`);
    doc.moveDown(0.5);
    doc.text(`Periodo pagado: del ${formatDate(data.periodStart)} al ${formatDate(data.periodEnd)}`);
    doc.text(`Fecha de pago: ${formatDate(data.paidAt)}`);
    doc.moveDown(1);

    doc.fontSize(14).fillColor("#000000").text(`Total pagado: ${formatCurrency(data.totalAmount)}`);
    doc.moveDown(2);

    doc.fontSize(9).fillColor("#888888").text("Este recibo fue generado automáticamente por H07.");

    doc.end();
  });
}
