import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type PermissionCode = string;

type ProfileWithRole = {
  empresa_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  is_active: boolean;
  role: {
    code: string;
    name: string;
    role_permissions: { permission: { code: string } | null }[];
  } | null;
};

export type CurrentUser = {
  userId: string;
  empresaId: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  roleCode: string;
  roleName: string;
  permissions: PermissionCode[];
};

/**
 * Lee el usuario autenticado junto con su empresa, rol y permisos de ese rol.
 * Envuelto en cache() de React: el layout y la página piden lo mismo en cada
 * navegación, y así solo se consulta Supabase una vez por solicitud.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();

  // getClaims() verifica el JWT localmente (llaves asimétricas) en vez de
  // llamar al servidor de Auth en cada solicitud, como sí hace getUser().
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;

  if (!userId) return null;

  const { data } = await supabase
    .from("profiles")
    .select(
      "empresa_id, full_name, email, avatar_url, is_active, role:roles(code, name, role_permissions(permission:permissions(code)))",
    )
    .eq("id", userId)
    .single<ProfileWithRole>();

  if (!data || !data.is_active || !data.role) return null;

  const permissions = data.role.role_permissions
    .map((rp) => rp.permission?.code)
    .filter((code): code is string => Boolean(code));

  return {
    userId,
    empresaId: data.empresa_id,
    fullName: data.full_name,
    email: data.email,
    avatarUrl: data.avatar_url,
    roleCode: data.role.code,
    roleName: data.role.name,
    permissions,
  };
});

export function can(permissions: PermissionCode[], code: PermissionCode) {
  return permissions.includes(code);
}
