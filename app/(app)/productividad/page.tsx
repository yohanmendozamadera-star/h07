import { getCurrentUser, can } from "@/lib/permissions";
import { getTechnicianProductivity } from "@/lib/dashboard/queries";
import { ModulePlaceholder } from "@/components/layout/module-placeholder";
import { ProductivityTable } from "@/components/dashboard/productivity-table";

export default async function ProductividadPage() {
  const user = await getCurrentUser();
  const permissions = user?.permissions ?? [];

  if (!can(permissions, "reportes.view")) {
    return <ModulePlaceholder title="Productividad por técnico" description="No tienes permiso para ver este módulo." denied />;
  }

  const productivity = await getTechnicianProductivity();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">Productividad por técnico</h1>
      <ProductivityTable rows={productivity} />
    </div>
  );
}
