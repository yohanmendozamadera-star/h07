"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser, can } from "@/lib/permissions";
import { inviteUsuarioSchema } from "@/lib/validations/usuario";

export type ActionResult = { success: true } | { success: false; message: string };

export async function inviteUsuarioAction(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.permissions, "usuarios.manage")) {
    return { success: false, message: "No tienes permiso para invitar usuarios." };
  }

  const parsed = inviteUsuarioSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  // El registro normal (auth.signUp) SIEMPRE crea una empresa nueva (ver
  // fn_handle_new_user). Invitar a un Técnico/Administrador a la empresa YA
  // existente necesita el cliente con la clave secreta para poder pasar
  // "invited_company_id" en los metadatos y que el trigger tome ese camino
  // en vez de crear otra empresa.
  // Sin redirectTo, el link de invitación deja a la persona con sesión
  // iniciada directo en /dashboard sin haber definido ninguna contraseña —
  // se queda sin saber cómo volver a entrar después. Lo mandamos a crear su
  // contraseña primero.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://h07.io";
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.inviteUserByEmail(parsed.data.email, {
    data: {
      invited_company_id: user.empresaId,
      role_code: parsed.data.roleCode,
      full_name: parsed.data.fullName,
      phone: parsed.data.phone,
    },
    redirectTo: `${appUrl}/auth/callback?next=/actualizar-password`,
  });

  if (error) return { success: false, message: error.message };

  revalidatePath("/usuarios");
  return { success: true };
}

export async function updateUsuarioRoleAction(profileId: string, roleCode: "administrador" | "tecnico"): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.permissions, "usuarios.manage")) {
    return { success: false, message: "No tienes permiso para editar usuarios." };
  }

  const supabase = await createClient();
  const { data: role } = await supabase.from("roles").select("id").eq("code", roleCode).single();
  if (!role) return { success: false, message: "Rol inválido." };

  const { error } = await supabase.from("profiles").update({ role_id: role.id }).eq("id", profileId);
  if (error) return { success: false, message: error.message };

  revalidatePath("/usuarios");
  return { success: true };
}

export async function toggleUsuarioActivoAction(profileId: string, isActive: boolean): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.permissions, "usuarios.manage")) {
    return { success: false, message: "No tienes permiso para editar usuarios." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ is_active: isActive }).eq("id", profileId);
  if (error) return { success: false, message: error.message };

  revalidatePath("/usuarios");
  return { success: true };
}
