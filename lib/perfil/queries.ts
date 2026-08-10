import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { ProfileDetails } from "@/lib/perfil/types";

export const getProfileDetails = cache(async (userId: string): Promise<ProfileDetails | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url")
    .eq("id", userId)
    .single();

  return data;
});
