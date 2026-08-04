"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, can } from "@/lib/permissions";
import { purchaseFormSchema, shrinkageFormSchema } from "@/lib/validations/inventario";

export type ActionResult = { success: true } | { success: false; message: string };

export async function createPurchase(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.permissions, "inventario.create")) {
    return { success: false, message: "No tienes permiso para registrar compras." };
  }

  const parsed = purchaseFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("purchases").insert({
    empresa_id: user.empresaId,
    catalog_item_id: parsed.data.catalogItemId,
    supplier_id: parsed.data.supplierId || null,
    quantity: parsed.data.quantity,
    unit_cost: parsed.data.unitCost,
    total_cost: parsed.data.quantity * parsed.data.unitCost,
    purchase_date: parsed.data.purchaseDate,
  });

  if (error) return { success: false, message: error.message };

  revalidatePath("/inventario");
  return { success: true };
}

export async function createShrinkage(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.permissions, "inventario.create")) {
    return { success: false, message: "No tienes permiso para registrar mermas." };
  }

  const parsed = shrinkageFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("shrinkages").insert({
    empresa_id: user.empresaId,
    catalog_item_id: parsed.data.catalogItemId,
    quantity: parsed.data.quantity,
    reason: parsed.data.reason || null,
    shrinkage_date: parsed.data.shrinkageDate,
  });

  if (error) return { success: false, message: error.message };

  revalidatePath("/inventario");
  return { success: true };
}
