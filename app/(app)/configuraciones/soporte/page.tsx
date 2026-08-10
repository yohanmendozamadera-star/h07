import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/permissions";
import { getPlatformConfig } from "@/lib/panel-plataforma/queries";
import { ModulePlaceholder } from "@/components/layout/module-placeholder";

export default async function SoportePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const config = await getPlatformConfig();
  if (!config.support_whatsapp_number) {
    return (
      <ModulePlaceholder
        title="Soporte"
        description="El número de soporte todavía no ha sido configurado. Contacta al administrador de la plataforma."
      />
    );
  }

  redirect(`https://wa.me/${config.support_whatsapp_number}`);
}
