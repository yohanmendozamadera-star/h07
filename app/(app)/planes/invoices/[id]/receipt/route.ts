import { NextResponse } from "next/server";
import { getCurrentUser, can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { buildInvoiceReceiptPdf } from "@/lib/pdf/build-invoice-receipt";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !can(user.permissions, "planes.view")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const supabase = await createClient();

  // RLS ya limita esto a facturas de la propia empresa; el filtro por
  // empresa_id explícito aquí es una segunda capa, no la única.
  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, empresa_id, due_date, total_amount, status")
    .eq("id", id)
    .eq("empresa_id", user.empresaId)
    .maybeSingle();

  if (!invoice || invoice.status !== "paid") {
    return NextResponse.json({ error: "Factura no encontrada o no pagada" }, { status: 404 });
  }

  const { data: company } = await supabase.from("companies").select("name, owner_user_id").eq("id", invoice.empresa_id).single();

  if (!company) {
    return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });
  }

  // El recibo siempre lleva el correo del propietario, no el del usuario que
  // esté descargándolo (podría ser un empleado con permiso planes.view).
  const { data: ownerProfile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", company.owner_user_id)
    .single();

  const { data: payment } = await supabase
    .from("payments")
    .select("reviewed_at")
    .eq("invoice_id", invoice.id)
    .eq("status", "approved")
    .order("reviewed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const periodStart = invoice.due_date;
  const periodEndDate = new Date(invoice.due_date);
  periodEndDate.setMonth(periodEndDate.getMonth() + 1);
  periodEndDate.setDate(periodEndDate.getDate() - 1);
  const periodEnd = periodEndDate.toISOString().slice(0, 10);

  const pdf = await buildInvoiceReceiptPdf({
    companyName: company.name,
    ownerEmail: ownerProfile?.email ?? "",
    periodStart,
    periodEnd,
    totalAmount: invoice.total_amount,
    paidAt: payment?.reviewed_at?.slice(0, 10) ?? periodStart,
    invoiceId: invoice.id,
  });

  return new Response(pdf as unknown as ArrayBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="recibo-h07-${invoice.id}.pdf"`,
    },
  });
}
