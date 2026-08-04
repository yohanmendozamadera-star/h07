import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * Mecanismo de super-admin de plataforma, GENUINAMENTE SEPARADO del rol de
 * tenant (getCurrentUser/can en ./index.ts). No revisa profiles.role_id ni
 * has_permission() — solo la pertenencia a platform_admins. Nunca se debe
 * usar el rol "propietario" como sustituto de esta verificación: ese fue
 * exactamente el hueco de seguridad del sistema legado.
 */
export const getPlatformAdmin = cache(async (): Promise<{ userId: string } | null> => {
  const supabase = await createClient();

  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;
  if (!userId) return null;

  const { data } = await supabase
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return null;

  return { userId };
});
