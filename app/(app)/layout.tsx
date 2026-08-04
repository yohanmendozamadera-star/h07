import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/permissions";
import { getPlatformAdmin } from "@/lib/permissions/platform";
import { getCompanyOnboardingStatus } from "@/lib/companies/queries";
import { hasActivePlan } from "@/lib/planes/queries";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    // /auth/signout es un Route Handler: puede limpiar la cookie de sesión
    // de verdad (un Server Component no puede). Evita un loop de redirección
    // si el JWT sigue vigente pero el perfil ya no existe.
    redirect("/auth/signout");
  }

  const onboardingCompleted = await getCompanyOnboardingStatus(user.empresaId);
  if (!onboardingCompleted) {
    redirect("/onboarding");
  }

  // Un usuario puede ser a la vez dueño de su propia empresa Y super-admin de
  // plataforma (dos mecanismos separados a propósito, ver getPlatformAdmin).
  // Esto solo decide si se muestra el enlace de acceso; el guard real vive en
  // app/(platform)/panel-plataforma/layout.tsx.
  const [platformAdmin, planActive] = await Promise.all([getPlatformAdmin(), hasActivePlan(user.empresaId)]);

  return (
    <AppShell
      fullName={user.fullName}
      roleName={user.roleName}
      permissions={user.permissions}
      isPlatformAdmin={Boolean(platformAdmin)}
      hasActivePlan={planActive}
    >
      {children}
    </AppShell>
  );
}
