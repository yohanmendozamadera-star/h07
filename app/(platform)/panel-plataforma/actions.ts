"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getPlatformAdmin } from "@/lib/permissions/platform";
import { bannerFormSchema, paymentLinkFormSchema, platformSetPlanSchema, platformConfigSchema } from "@/lib/validations/panel-plataforma";

export type ActionResult = { success: true } | { success: false; message: string };

async function requirePlatformAdmin() {
  const admin = await getPlatformAdmin();
  return admin;
}

export async function toggleCompanyStatus(companyId: string, status: "active" | "suspended"): Promise<ActionResult> {
  const admin = await requirePlatformAdmin();
  if (!admin) return { success: false, message: "No autorizado." };

  const supabase = await createClient();
  const { error } = await supabase.from("companies").update({ status }).eq("id", companyId);
  if (error) return { success: false, message: error.message };

  revalidatePath("/panel-plataforma");
  return { success: true };
}

export async function platformSetPlan(input: unknown): Promise<ActionResult> {
  const admin = await requirePlatformAdmin();
  if (!admin) return { success: false, message: "No autorizado." };

  const parsed = platformSetPlanSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("platform_set_plan", {
    p_empresa_id: parsed.data.empresaId,
    p_plan_code: parsed.data.planCode,
    p_addon_enabled: parsed.data.addonEnabled,
  });

  if (error) return { success: false, message: error.message };

  revalidatePath("/panel-plataforma");
  return { success: true };
}

export async function approvePayment(paymentId: string): Promise<ActionResult> {
  const admin = await requirePlatformAdmin();
  if (!admin) return { success: false, message: "No autorizado." };

  const supabase = await createClient();
  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .update({ status: "approved", reviewed_by: admin.userId, reviewed_at: new Date().toISOString() })
    .eq("id", paymentId)
    .select("invoice_id")
    .single();

  if (paymentError) return { success: false, message: paymentError.message };

  if (payment?.invoice_id) {
    const { error: invoiceError } = await supabase
      .from("invoices")
      .update({ status: "paid" })
      .eq("id", payment.invoice_id);
    if (invoiceError) return { success: false, message: invoiceError.message };
  }

  revalidatePath("/panel-plataforma");
  return { success: true };
}

export async function rejectPayment(paymentId: string): Promise<ActionResult> {
  const admin = await requirePlatformAdmin();
  if (!admin) return { success: false, message: "No autorizado." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("payments")
    .update({ status: "rejected", reviewed_by: admin.userId, reviewed_at: new Date().toISOString() })
    .eq("id", paymentId);

  if (error) return { success: false, message: error.message };

  revalidatePath("/panel-plataforma");
  return { success: true };
}

export async function updateBanner(bannerId: string | null, input: unknown): Promise<ActionResult> {
  const admin = await requirePlatformAdmin();
  if (!admin) return { success: false, message: "No autorizado." };

  const parsed = bannerFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const payload = {
    message: parsed.data.message,
    image_url: parsed.data.imageUrl || null,
    is_active: parsed.data.isActive,
  };

  const { error } = bannerId
    ? await supabase.from("platform_banner").update(payload).eq("id", bannerId)
    : await supabase.from("platform_banner").insert(payload);

  if (error) return { success: false, message: error.message };

  revalidatePath("/panel-plataforma");
  return { success: true };
}

export async function updatePlatformConfig(input: unknown): Promise<ActionResult> {
  const admin = await requirePlatformAdmin();
  if (!admin) return { success: false, message: "No autorizado." };

  const parsed = platformConfigSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("platform_config")
    .update({
      whatsapp_notifications_enabled: parsed.data.whatsappNotificationsEnabled,
      updated_by: admin.userId,
    })
    .eq("id", 1);

  if (error) return { success: false, message: error.message };

  revalidatePath("/panel-plataforma");
  return { success: true };
}

export async function createPaymentLink(input: unknown): Promise<ActionResult> {
  const admin = await requirePlatformAdmin();
  if (!admin) return { success: false, message: "No autorizado." };

  const parsed = paymentLinkFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("payment_links").insert({
    empresa_id: parsed.data.empresaId || null,
    label: parsed.data.label,
    url: parsed.data.url,
    amount: parsed.data.amount ?? null,
  });

  if (error) return { success: false, message: error.message };

  revalidatePath("/panel-plataforma");
  return { success: true };
}

export async function togglePaymentLinkActive(linkId: string, isActive: boolean): Promise<ActionResult> {
  const admin = await requirePlatformAdmin();
  if (!admin) return { success: false, message: "No autorizado." };

  const supabase = await createClient();
  const { error } = await supabase.from("payment_links").update({ is_active: isActive }).eq("id", linkId);
  if (error) return { success: false, message: error.message };

  revalidatePath("/panel-plataforma");
  return { success: true };
}
