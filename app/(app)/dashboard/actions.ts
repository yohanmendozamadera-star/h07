"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, can } from "@/lib/permissions";
import { fixedCostFormSchema } from "@/lib/validations/dashboard";

export type ActionResult = { success: true } | { success: false; message: string };

export async function updateBudgetedFixedCostAction(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.permissions, "configuraciones.manage")) {
    return { success: false, message: "No tienes permiso para registrar el costo fijo." };
  }

  const parsed = fixedCostFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("company_settings")
    .update({
      budgeted_fixed_cost: parsed.data.amount,
      budgeted_fixed_cost_updated_at: new Date().toISOString(),
    })
    .eq("empresa_id", user.empresaId);

  if (error) return { success: false, message: error.message };

  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateRealFixedCostAction(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.permissions, "configuraciones.manage")) {
    return { success: false, message: "No tienes permiso para registrar el costo fijo." };
  }

  const parsed = fixedCostFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("company_settings")
    .update({
      real_fixed_cost: parsed.data.amount,
      real_fixed_cost_updated_at: new Date().toISOString(),
    })
    .eq("empresa_id", user.empresaId);

  if (error) return { success: false, message: error.message };

  revalidatePath("/dashboard");
  return { success: true };
}
