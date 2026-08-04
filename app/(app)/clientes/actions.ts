"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, can } from "@/lib/permissions";
import { clientFormSchema } from "@/lib/validations/client";

export type ActionResult = { success: true } | { success: false; message: string };

export async function createClientAction(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.permissions, "clientes.edit")) {
    return { success: false, message: "No tienes permiso para crear clientes." };
  }

  const parsed = clientFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("clients").insert({
    empresa_id: user.empresaId,
    name: parsed.data.name,
    phone: parsed.data.phone || null,
    plate: parsed.data.plate?.toUpperCase() || null,
  });

  if (error) return { success: false, message: error.message };

  revalidatePath("/clientes");
  return { success: true };
}

export async function updateClientAction(id: string, input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.permissions, "clientes.edit")) {
    return { success: false, message: "No tienes permiso para editar clientes." };
  }

  const parsed = clientFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .update({
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      plate: parsed.data.plate?.toUpperCase() || null,
    })
    .eq("id", id);

  if (error) return { success: false, message: error.message };

  revalidatePath("/clientes");
  return { success: true };
}
