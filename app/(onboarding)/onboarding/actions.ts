"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import {
  moduleSelectionSchema,
  catalogItemDraftSchema,
  parkingRateDraftSchema,
  type ModuleSelection,
  type CatalogItemDraft,
  type ParkingRateDraft,
} from "@/lib/validations/onboarding";

export async function saveModulesAction(input: ModuleSelection) {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autenticado");
  const data = moduleSelectionSchema.parse(input);

  const supabase = await createClient();
  const { error } = await supabase
    .from("company_settings")
    .update({
      lavanderia_enabled: data.lavanderiaEnabled,
      inventario_enabled: data.inventarioEnabled,
      taller_enabled: data.tallerEnabled,
      parqueadero_enabled: data.parqueaderoEnabled,
    })
    .eq("empresa_id", user.empresaId);

  if (error) throw new Error(error.message);
}

export async function saveCatalogItemsAction(items: CatalogItemDraft[]) {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autenticado");
  const rows = catalogItemDraftSchema.array().parse(items);
  if (rows.length === 0) return;

  const supabase = await createClient();
  const { error } = await supabase.from("catalog_items").insert(
    rows.map((row) => ({
      empresa_id: user.empresaId,
      channel: row.channel,
      name: row.name,
      price: row.price,
      price_type: row.priceType,
      tracks_inventory: row.channel === "productos",
    })),
  );

  if (error) throw new Error(error.message);
}

export async function saveParkingRatesAction(items: ParkingRateDraft[]) {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autenticado");
  const rows = parkingRateDraftSchema.array().parse(items);
  if (rows.length === 0) return;

  const supabase = await createClient();
  const { error } = await supabase.from("parking_rates").insert(
    rows.map((row) => ({
      empresa_id: user.empresaId,
      name: row.name,
      rate_type: row.rateType,
      amount: row.amount,
    })),
  );

  if (error) throw new Error(error.message);
}

export async function completeOnboardingAction() {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autenticado");

  const supabase = await createClient();
  const { error } = await supabase
    .from("companies")
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq("id", user.empresaId);

  if (error) throw new Error(error.message);

  redirect("/dashboard");
}
