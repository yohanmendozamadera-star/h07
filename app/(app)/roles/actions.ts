"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, can } from "@/lib/permissions";
import type { EditableRoleCode } from "@/lib/roles/types";

export type ActionResult = { success: true } | { success: false; message: string };

// Nunca se acepta "propietario" aquí (ni por bug de UI ni por alguien
// llamando la acción directo) — ese rol siempre tiene todo, no se edita.
export async function setRolePermissionAction(
  roleCode: EditableRoleCode,
  permissionCode: string,
  granted: boolean,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.permissions, "usuarios.manage")) {
    return { success: false, message: "No tienes permiso para editar roles." };
  }
  if (roleCode !== "administrador" && roleCode !== "tecnico") {
    return { success: false, message: "Rol inválido." };
  }

  const supabase = await createClient();

  const { data: role } = await supabase.from("roles").select("id").eq("code", roleCode).single();
  const { data: permission } = await supabase.from("permissions").select("id").eq("code", permissionCode).single();
  if (!role || !permission) {
    return { success: false, message: "Rol o permiso no encontrado." };
  }

  if (granted) {
    const { error } = await supabase
      .from("role_permissions")
      .upsert(
        { empresa_id: user.empresaId, role_id: role.id, permission_id: permission.id },
        { onConflict: "empresa_id,role_id,permission_id" },
      );
    if (error) return { success: false, message: error.message };
  } else {
    const { error } = await supabase
      .from("role_permissions")
      .delete()
      .eq("empresa_id", user.empresaId)
      .eq("role_id", role.id)
      .eq("permission_id", permission.id);
    if (error) return { success: false, message: error.message };
  }

  revalidatePath("/roles");
  return { success: true };
}
