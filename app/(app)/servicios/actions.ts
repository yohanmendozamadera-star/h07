"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, can } from "@/lib/permissions";
import { catalogItemFormSchema } from "@/lib/validations/catalog-item";
import { parkingRateFormSchema } from "@/lib/validations/parking-rate";

export type ActionResult = { success: true } | { success: false; message: string };

export async function createCatalogItem(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.permissions, "servicios.edit")) {
    return { success: false, message: "No tienes permiso para crear servicios." };
  }

  const parsed = catalogItemFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("catalog_items").insert({
    empresa_id: user.empresaId,
    channel: parsed.data.channel,
    name: parsed.data.name,
    price: parsed.data.price,
    price_type: parsed.data.channel === "taller" ? parsed.data.priceType : "fijo",
    unit: parsed.data.unit || null,
    tracks_inventory: parsed.data.channel === "productos",
  });

  if (error) return { success: false, message: error.message };

  revalidatePath("/servicios");
  return { success: true };
}

export async function updateCatalogItem(id: string, input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.permissions, "servicios.edit")) {
    return { success: false, message: "No tienes permiso para editar servicios." };
  }

  const parsed = catalogItemFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("catalog_items")
    .update({
      name: parsed.data.name,
      price: parsed.data.price,
      price_type: parsed.data.channel === "taller" ? parsed.data.priceType : "fijo",
      unit: parsed.data.unit || null,
    })
    .eq("id", id);

  if (error) return { success: false, message: error.message };

  revalidatePath("/servicios");
  return { success: true };
}

export async function toggleCatalogItemActive(id: string, isActive: boolean): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.permissions, "servicios.edit")) {
    return { success: false, message: "No tienes permiso para editar servicios." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("catalog_items").update({ is_active: isActive }).eq("id", id);

  if (error) return { success: false, message: error.message };

  revalidatePath("/servicios");
  return { success: true };
}

export async function createParkingRate(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.permissions, "servicios.edit")) {
    return { success: false, message: "No tienes permiso para crear tarifas." };
  }

  const parsed = parkingRateFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("parking_rates").insert({
    empresa_id: user.empresaId,
    name: parsed.data.name,
    rate_type: parsed.data.rateType,
    amount: parsed.data.amount,
  });

  if (error) return { success: false, message: error.message };

  revalidatePath("/servicios");
  return { success: true };
}

export async function updateParkingRate(id: string, input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.permissions, "servicios.edit")) {
    return { success: false, message: "No tienes permiso para editar tarifas." };
  }

  const parsed = parkingRateFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("parking_rates")
    .update({ name: parsed.data.name, rate_type: parsed.data.rateType, amount: parsed.data.amount })
    .eq("id", id);

  if (error) return { success: false, message: error.message };

  revalidatePath("/servicios");
  return { success: true };
}

export async function toggleParkingRateActive(id: string, isActive: boolean): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.permissions, "servicios.edit")) {
    return { success: false, message: "No tienes permiso para editar tarifas." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("parking_rates").update({ is_active: isActive }).eq("id", id);

  if (error) return { success: false, message: error.message };

  revalidatePath("/servicios");
  return { success: true };
}
