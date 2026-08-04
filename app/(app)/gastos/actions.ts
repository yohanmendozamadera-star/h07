"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, can } from "@/lib/permissions";
import { expenseFormSchema } from "@/lib/validations/expense";

export type ActionResult = { success: true } | { success: false; message: string };

export async function createExpense(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.permissions, "gastos.create")) {
    return { success: false, message: "No tienes permiso para registrar gastos." };
  }

  const parsed = expenseFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("expenses").insert({
    empresa_id: user.empresaId,
    type: parsed.data.type,
    category_id: parsed.data.categoryId || null,
    supplier_id: parsed.data.supplierId || null,
    amount: parsed.data.amount,
    expense_date: parsed.data.expenseDate,
    description: parsed.data.description || null,
  });

  if (error) return { success: false, message: error.message };

  revalidatePath("/gastos");
  return { success: true };
}

export async function updateExpense(id: string, input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.permissions, "gastos.edit")) {
    return { success: false, message: "No tienes permiso para editar gastos." };
  }

  const parsed = expenseFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("expenses")
    .update({
      type: parsed.data.type,
      category_id: parsed.data.categoryId || null,
      supplier_id: parsed.data.supplierId || null,
      amount: parsed.data.amount,
      expense_date: parsed.data.expenseDate,
      description: parsed.data.description || null,
    })
    .eq("id", id);

  if (error) return { success: false, message: error.message };

  revalidatePath("/gastos");
  return { success: true };
}
