"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, can } from "@/lib/permissions";
import { changePlanSchema, reportPaymentSchema } from "@/lib/validations/planes";

export type ActionResult = { success: true } | { success: false; message: string };

export async function changePlan(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.permissions, "planes.view")) {
    return { success: false, message: "No tienes permiso para administrar el plan." };
  }

  const parsed = changePlanSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("activate_paid_plan", {
    p_plan_code: parsed.data.planCode,
    p_addon_enabled: parsed.data.addonEnabled,
  });

  if (error) return { success: false, message: error.message };

  revalidatePath("/planes");
  return { success: true };
}

export async function reportPayment(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.permissions, "pagos.create")) {
    return { success: false, message: "No tienes permiso para reportar pagos." };
  }

  const parsed = reportPaymentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("payments").insert({
    empresa_id: user.empresaId,
    invoice_id: parsed.data.invoiceId,
    amount: parsed.data.amount,
    reported_by: user.userId,
    status: "pending",
  });

  if (error) return { success: false, message: error.message };

  revalidatePath("/planes");
  return { success: true };
}
