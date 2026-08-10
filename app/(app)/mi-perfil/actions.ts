"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/permissions";
import { updateProfileNameSchema } from "@/lib/validations/perfil";

export type ActionResult = { success: true } | { success: false; message: string };

export async function updateProfileNameAction(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: "No autenticado." };

  const parsed = updateProfileNameSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName })
    .eq("id", user.userId);

  if (error) return { success: false, message: error.message };

  revalidatePath("/mi-perfil");
  return { success: true };
}

export async function updateProfileAvatarAction(avatarUrl: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: "No autenticado." };

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", user.userId);

  if (error) return { success: false, message: error.message };

  revalidatePath("/mi-perfil");
  return { success: true };
}
