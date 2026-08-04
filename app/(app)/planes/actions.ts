"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, can } from "@/lib/permissions";
import { changePlanSchema } from "@/lib/validations/planes";

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
