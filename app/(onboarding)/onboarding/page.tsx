import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("company_settings")
    .select("lavanderia_enabled, inventario_enabled, taller_enabled, parqueadero_enabled")
    .eq("empresa_id", user.empresaId)
    .single();

  return (
    <div className="w-full max-w-2xl">
      <OnboardingWizard
        initialSettings={{
          lavanderiaEnabled: settings?.lavanderia_enabled ?? true,
          inventarioEnabled: settings?.inventario_enabled ?? false,
          tallerEnabled: settings?.taller_enabled ?? false,
          parqueaderoEnabled: settings?.parqueadero_enabled ?? false,
        }}
        initialCountryCode={user.countryCode}
      />
    </div>
  );
}
