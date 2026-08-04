import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getPlatformAdmin } from "@/lib/permissions/platform";
import { Button } from "@/components/ui/button";

// Guard GENUINAMENTE separado del de (app): usa getPlatformAdmin(), nunca
// getCurrentUser()/can(). Un rol de tenant (incluido "propietario") no basta
// para entrar aquí — eso era exactamente el hueco de seguridad del legado.
export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const admin = await getPlatformAdmin();
  if (!admin) redirect("/login");

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold tracking-tight">Panel de plataforma</div>
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ArrowLeft className="size-4" />
              Volver
            </Button>
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
