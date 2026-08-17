"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, can } from "@/lib/permissions";
import { companySettingsFormSchema, sharedCatalogNameSchema } from "@/lib/validations/configuraciones";
import { countrySelectionSchema } from "@/lib/validations/onboarding";

export type ActionResult = { success: true } | { success: false; message: string };

export async function updateCompanyCountryAction(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.permissions, "configuraciones.manage")) {
    return { success: false, message: "No tienes permiso para editar la configuración." };
  }

  const parsed = countrySelectionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("companies")
    .update({ country_code: parsed.data.countryCode })
    .eq("id", user.empresaId);

  if (error) return { success: false, message: error.message };

  revalidatePath("/configuraciones");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateCompanySettingsAction(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.permissions, "configuraciones.manage")) {
    return { success: false, message: "No tienes permiso para editar la configuración." };
  }

  const parsed = companySettingsFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("company_settings")
    .update({
      lavanderia_enabled: parsed.data.lavanderiaEnabled,
      inventario_enabled: parsed.data.inventarioEnabled,
      taller_enabled: parsed.data.tallerEnabled,
      parqueadero_enabled: parsed.data.parqueaderoEnabled,
      require_technician_on_invoice: parsed.data.requireTechnicianOnInvoice,
      show_numeric_keypad: parsed.data.showNumericKeypad,
      parking_grace_minutes: parsed.data.parkingGraceMinutes,
      commission_enabled: parsed.data.commissionEnabled,
      commission_technician_percent: parsed.data.commissionEnabled ? parsed.data.commissionTechnicianPercent : null,
      parqueadero_printer_ip: parsed.data.parqueaderoPrinterIp || null,
    })
    .eq("empresa_id", user.empresaId);

  if (error) return { success: false, message: error.message };

  revalidatePath("/configuraciones");
  revalidatePath("/servicios");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function createExpenseCategoryAction(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.permissions, "configuraciones.manage")) {
    return { success: false, message: "No tienes permiso para administrar categorías." };
  }

  const parsed = sharedCatalogNameSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("expense_categories").insert({ name: parsed.data.name });
  if (error) {
    const message = error.code === "23505" ? "Ya existe una categoría con ese nombre." : error.message;
    return { success: false, message };
  }

  revalidatePath("/configuraciones");
  return { success: true };
}

export async function toggleExpenseCategoryAction(id: string, isActive: boolean): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.permissions, "configuraciones.manage")) {
    return { success: false, message: "No tienes permiso para administrar categorías." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("expense_categories").update({ is_active: isActive }).eq("id", id);
  if (error) return { success: false, message: error.message };

  revalidatePath("/configuraciones");
  return { success: true };
}

export async function createSupplierAction(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.permissions, "configuraciones.manage")) {
    return { success: false, message: "No tienes permiso para administrar proveedores." };
  }

  const parsed = sharedCatalogNameSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("suppliers").insert({ name: parsed.data.name });
  if (error) {
    const message = error.code === "23505" ? "Ya existe un proveedor con ese nombre." : error.message;
    return { success: false, message };
  }

  revalidatePath("/configuraciones");
  return { success: true };
}

export async function toggleSupplierAction(id: string, isActive: boolean): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.permissions, "configuraciones.manage")) {
    return { success: false, message: "No tienes permiso para administrar proveedores." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("suppliers").update({ is_active: isActive }).eq("id", id);
  if (error) return { success: false, message: error.message };

  revalidatePath("/configuraciones");
  return { success: true };
}
