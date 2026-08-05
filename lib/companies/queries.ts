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
