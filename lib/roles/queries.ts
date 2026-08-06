import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { PermissionRow, RolePermissionsMatrix } from "@/lib/roles/types";

export const getPermissionsCatalog = cache(async (): Promise<PermissionRow[]> => {
  const supabase = await createClient();
  const { data } = await supabase.from("permissions").select("code, module, description").order("module").order("code");
  return data ?? [];
});

type RolePermissionRow = { role: { code: string } | null; permission: { code: string } | null };

export const getRolePermissionsMatrix = cache(async (empresaId: string): Promise<RolePermissionsMatrix> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("role_permissions")
    .select("role:roles(code), permission:permissions(code)")
    .eq("empresa_id", empresaId)
    .returns<RolePermissionRow[]>();

  const matrix: RolePermissionsMatrix = { administrador: new Set(), tecnico: new Set() };
  for (const row of data ?? []) {
    const roleCode = row.role?.code;
    const permissionCode = row.permission?.code;
    if (!permissionCode) continue;
    if (roleCode === "administrador") matrix.administrador.add(permissionCode);
    if (roleCode === "tecnico") matrix.tecnico.add(permissionCode);
  }
  return matrix;
});
