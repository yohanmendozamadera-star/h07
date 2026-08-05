import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyBoldWebhookSignature, parseBoldInvoiceId } from "@/lib/bold/signature";
import { buildInvoiceReceiptPdf } from "@/lib/pdf/build-invoice-receipt";
import { sendEmail } from "@/lib/email/resend";
import { formatCurrency, formatDate } from "@/lib/format";

type BoldWebhookEvent = {
  type: string;
  data: {
    payment_id: string;
    amount: { total: number; currency: string };
    metadata?: { reference: string | null };
  };
};

// Bold llama aquí cuando un pago cambia de estado (SALE_APPROVED es el único
// que activa la factura). Reintenta hasta 5 veces si no respondemos 200 en 2s,
// así que esto debe ser rápido e idempotente (por payment_id).
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-bold-signature");

  console.log("[bold-webhook] recibido", {
    hasSignatureHeader: Boolean(signature),
    bodyLength: rawBody.length,
    bodyPreview: rawBody.slice(0, 500),
  });

  if (!verifyBoldWebhookSignature(rawBody, signature)) {
    console.log("[bold-webhook] firma inválida", { signature });
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  let event: BoldWebhookEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    console.log("[bold-webhook] JSON inválido");
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  console.log("[bold-webhook] evento parseado", {
    type: event.type,
    payment_id: event.data?.payment_id,
    reference: event.data?.metadata?.reference,
  });

  if (event.type !== "SALE_APPROVED") {
    return NextResponse.json({ ok: true, ignored: event.type });
  }

  const boldPaymentId = event.data.payment_id;
  const reference = event.data.metadata?.reference;

  if (!boldPaymentId || !reference) {
    console.log("[bold-webhook] falta payment_id o reference", { boldPaymentId, reference });
    return NextResponse.json({ error: "Falta payment_id o reference" }, { status: 400 });
  }

  // El orderId enviado a Bold es "<invoiceId>::<timestamp>" (único por
  // intento de pago, ver buildBoldOrderId) — aquí se recupera el invoiceId real.
  const invoiceId = parseBoldInvoiceId(reference);

  const supabase = createAdminClient();

  const { data: existingPayment } = await supabase
    .from("payments")
    .select("id")
    .eq("bold_payment_id", boldPaymentId)
    .maybeSingle();

  if (existingPayment) {
    console.log("[bold-webhook] ya procesado antes", { boldPaymentId });
    return NextResponse.json({ ok: true, message: "Ya procesado" });
  }

  const { data: invoice, error: invoiceLookupError } = await supabase
    .from("invoices")
    .select("id, empresa_id, total_amount, due_date")
    .eq("id", invoiceId)
    .maybeSingle();

  if (!invoice) {
    console.log("[bold-webhook] factura no encontrada", { invoiceId, invoiceLookupError });
    return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });
  }

  const { error: paymentError } = await supabase.from("payments").insert({
    empresa_id: invoice.empresa_id,
    invoice_id: invoice.id,
    amount: event.data.amount.total,
    status: "approved",
    bold_payment_id: boldPaymentId,
    reviewed_at: new Date().toISOString(),
  });

  if (paymentError) {
    console.log("[bold-webhook] error guardando pago", paymentError);
    return NextResponse.json({ error: paymentError.message }, { status: 500 });
  }

  const { error: invoiceError } = await supabase
    .from("invoices")
    .update({ status: "paid" })
    .eq("id", invoice.id);

  if (invoiceError) {
    console.log("[bold-webhook] error marcando factura pagada", invoiceError);
    return NextResponse.json({ error: invoiceError.message }, { status: 500 });
  }

  console.log("[bold-webhook] factura marcada como pagada", { invoiceId: invoice.id, boldPaymentId });

  // El recibo se envía SIEMPRE al correo del propietario de la empresa
  // (companies.owner_user_id), nunca al de un empleado — un fallo aquí no
  // debe hacer que Bold reintente el webhook, el pago ya quedó registrado.
  try {
    const { data: company } = await supabase
      .from("companies")
      .select("name, owner_user_id")
      .eq("id", invoice.empresa_id)
      .single();

    const { data: ownerProfile } = company
      ? await supabase.from("profiles").select("email").eq("id", company.owner_user_id).single()
      : { data: null };

    if (company && ownerProfile?.email) {
      const periodStart = invoice.due_date;
      const periodEndDate = new Date(invoice.due_date);
      periodEndDate.setMonth(periodEndDate.getMonth() + 1);
      periodEndDate.setDate(periodEndDate.getDate() - 1);
      const periodEnd = periodEndDate.toISOString().slice(0, 10);
      const paidAt = new Date().toISOString().slice(0, 10);

      const pdf = await buildInvoiceReceiptPdf({
        companyName: company.name,
        ownerEmail: ownerProfile.email,
        periodStart,
        periodEnd,
        totalAmount: invoice.total_amount,
        paidAt,
        invoiceId: invoice.id,
      });

      const emailResult = await sendEmail({
        to: ownerProfile.email,
        subject: `Recibo de pago H07 - ${company.name}`,
        html: `<p>Hola,</p><p>Confirmamos el pago de <strong>${formatCurrency(invoice.total_amount)}</strong> por el periodo del ${formatDate(periodStart)} al ${formatDate(periodEnd)}. Adjuntamos el recibo en PDF.</p>`,
        attachments: [{ filename: `recibo-h07-${invoice.id}.pdf`, content: pdf.toString("base64") }],
      });

      if (!emailResult.success) {
        console.log("[bold-webhook] no se pudo enviar el recibo por correo", emailResult.message);
      }
    }
  } catch (receiptError) {
    console.log("[bold-webhook] error generando/enviando el recibo", receiptError);
  }

  return NextResponse.json({ ok: true });
}
