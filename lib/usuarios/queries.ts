import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { UsuarioRow } from "@/lib/usuarios/types";

type ProfileWithRole = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  role: { code: string; name: string } | null;
};

export const getUsuarios = cache(async (): Promise<UsuarioRow[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, is_active, role:roles(code, name)")
    .order("full_name")
    .returns<ProfileWithRole[]>();

  return data ?? [];
});

export type Tecnico = { id: string; full_name: string };

export const getTecnicos = cache(async (): Promise<Tecnico[]> => {
  const supabase = await createClient();
  const { data: role } = await supabase.from("roles").select("id").eq("code", "tecnico").single();
  if (!role) return [];

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role_id", role.id)
    .eq("is_active", true)
    .order("full_name");

  return data ?? [];
});
