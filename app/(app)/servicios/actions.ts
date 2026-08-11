"use server";

import ExcelJS from "exceljs";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, can } from "@/lib/permissions";
import { catalogItemFormSchema } from "@/lib/validations/catalog-item";
import { parkingRateFormSchema } from "@/lib/validations/parking-rate";
import type { CatalogChannel } from "@/lib/servicios/types";

export type ActionResult = { success: true } | { success: false; message: string };

export type ImportResult =
  | { success: true; imported: number; skipped: string[] }
  | { success: false; message: string };

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

const VALID_CHANNELS = new Set<CatalogChannel>(["lavanderia", "productos", "taller"]);

export async function importCatalogItemsAction(formData: FormData): Promise<ImportResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.permissions, "servicios.edit")) {
    return { success: false, message: "No tienes permiso para crear servicios." };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { success: false, message: "Selecciona un archivo Excel." };
  }

  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("company_settings")
    .select("lavanderia_enabled, inventario_enabled, taller_enabled")
    .eq("empresa_id", user.empresaId)
    .single();

  const enabledChannels = new Set<CatalogChannel>([
    ...(settings?.lavanderia_enabled ? (["lavanderia"] as const) : []),
    ...(settings?.inventario_enabled ? (["productos"] as const) : []),
    ...(settings?.taller_enabled ? (["taller"] as const) : []),
  ]);

  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(await file.arrayBuffer());
  } catch {
    return { success: false, message: "No se pudo leer el archivo — asegúrate de que sea un .xlsx válido." };
  }

  const worksheet = workbook.getWorksheet("Servicios") ?? workbook.worksheets[0];
  if (!worksheet) {
    return { success: false, message: "El archivo no tiene ninguna hoja con datos." };
  }

  type Row = { empresa_id: string; channel: CatalogChannel; name: string; price: number; price_type: "fijo" | "variable"; unit: string | null; tracks_inventory: boolean };
  const rows: Row[] = [];
  const skipped: string[] = [];

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return; // encabezado

    const canal = String(row.getCell(1).value ?? "").trim().toLowerCase();
    const nombre = String(row.getCell(2).value ?? "").trim();
    const precioRaw = row.getCell(3).value;
    const tipoRaw = String(row.getCell(4).value ?? "fijo").trim().toLowerCase();
    const unidad = String(row.getCell(5).value ?? "").trim();

    if (!canal && !nombre) return; // fila vacía

    if (!VALID_CHANNELS.has(canal as CatalogChannel)) {
      skipped.push(`Fila ${rowNumber}: canal "${canal}" inválido (usa lavanderia, productos o taller).`);
      return;
    }
    if (!enabledChannels.has(canal as CatalogChannel)) {
      skipped.push(`Fila ${rowNumber}: el canal "${canal}" no está activo en Configuraciones.`);
      return;
    }
    if (!nombre) {
      skipped.push(`Fila ${rowNumber}: falta el nombre.`);
      return;
    }
    const price = Number(precioRaw);
    if (!Number.isFinite(price) || price < 0) {
      skipped.push(`Fila ${rowNumber}: precio inválido.`);
      return;
    }
    const priceType = tipoRaw === "variable" ? "variable" : "fijo";

    rows.push({
      empresa_id: user.empresaId,
      channel: canal as CatalogChannel,
      name: nombre,
      price,
      price_type: canal === "taller" ? priceType : "fijo",
      unit: unidad || null,
      tracks_inventory: canal === "productos",
    });
  });

  if (rows.length === 0) {
    return {
      success: false,
      message: skipped[0] ?? "No se encontró ninguna fila válida para importar.",
    };
  }

  const { error } = await supabase.from("catalog_items").insert(rows);
  if (error) return { success: false, message: error.message };

  revalidatePath("/servicios");
  return { success: true, imported: rows.length, skipped };
}
