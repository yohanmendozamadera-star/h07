import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export const getCompanyOnboardingStatus = cache(async (empresaId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("companies")
    .select("onboarding_completed_at")
    .eq("id", empresaId)
    .single();

  return Boolean(data?.onboarding_completed_at);
});

export const getCompanyName = cache(async (empresaId: string): Promise<string> => {
  const supabase = await createClient();
  const { data } = await supabase.from("companies").select("name").eq("id", empresaId).single();
  return data?.name ?? "";
});

// Siempre el correo del propietario (companies.owner_user_id) — nunca el del
// usuario que esté con la sesión abierta, que puede ser un empleado.
export const getCompanyOwnerEmail = cache(async (empresaId: string): Promise<string | null> => {
  const supabase = await createClient();
  const { data: company } = await supabase.from("companies").select("owner_user_id").eq("id", empresaId).single();
  if (!company) return null;

  const { data: profile } = await supabase.from("profiles").select("email").eq("id", company.owner_user_id).single();
  return profile?.email ?? null;
});
