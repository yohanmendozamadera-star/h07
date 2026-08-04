"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, can } from "@/lib/permissions";
import { monthlyGoalFormSchema } from "@/lib/validations/monthly-goal";

export type ActionResult = { success: true } | { success: false; message: string };

export async function updateMonthlyGoal(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.permissions, "reportes.view")) {
    return { success: false, message: "No tienes permiso para editar la meta." };
  }

  const parsed = monthlyGoalFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("monthly_goals").upsert({
    empresa_id: user.empresaId,
    fixed_cost: parsed.data.fixedCost,
    margin_percent: parsed.data.marginPercent,
    goal_amount: parsed.data.goalAmount,
  });

  if (error) return { success: false, message: error.message };

  revalidatePath("/dashboard");
  return { success: true };
}
