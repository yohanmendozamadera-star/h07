import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/permissions";

// Sin AppShell a propósito: el onboarding corre antes de que la empresa
// tenga módulos activos que mostrar en el menú lateral.
export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen items-center justify-center bg-blue-50 p-4 dark:bg-blue-950/30">
      {children}
    </div>
  );
}
