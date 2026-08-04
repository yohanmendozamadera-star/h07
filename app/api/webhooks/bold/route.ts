import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyBoldWebhookSignature } from "@/lib/bold/signature";

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

  if (!verifyBoldWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  let event: BoldWebhookEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (event.type !== "SALE_APPROVED") {
    return NextResponse.json({ ok: true, ignored: event.type });
  }

  const boldPaymentId = event.data.payment_id;
  const invoiceId = event.data.metadata?.reference;

  if (!boldPaymentId || !invoiceId) {
    return NextResponse.json({ error: "Falta payment_id o reference" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: existingPayment } = await supabase
    .from("payments")
    .select("id")
    .eq("bold_payment_id", boldPaymentId)
    .maybeSingle();

  if (existingPayment) {
    return NextResponse.json({ ok: true, message: "Ya procesado" });
  }

  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, empresa_id, total_amount")
    .eq("id", invoiceId)
    .maybeSingle();

  if (!invoice) {
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
    return NextResponse.json({ error: paymentError.message }, { status: 500 });
  }

  const { error: invoiceError } = await supabase
    .from("invoices")
    .update({ status: "paid" })
    .eq("id", invoice.id);

  if (invoiceError) {
    return NextResponse.json({ error: invoiceError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
