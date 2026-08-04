import { getCurrentUser, can } from "@/lib/permissions";
import { getClients } from "@/lib/clientes/queries";
import { ModulePlaceholder } from "@/components/layout/module-placeholder";
import { ClientFormDialog } from "@/components/clientes/client-form-dialog";
import { ClientesTable } from "@/components/clientes/clientes-table";
import { ExportButton } from "@/components/shared/export-button";

export default async function ClientesPage() {
  const user = await getCurrentUser();
  const permissions = user?.permissions ?? [];

  if (!can(permissions, "clientes.view")) {
    return <ModulePlaceholder title="Clientes" description="No tienes permiso para ver este módulo." denied />;
  }

  const clients = await getClients();
  const canEdit = can(permissions, "clientes.edit");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Clientes</h1>
        <div className="flex items-center gap-2">
          <ExportButton href="/clientes/export" />
          {canEdit && <ClientFormDialog />}
        </div>
      </div>

      <ClientesTable clients={clients} canEdit={canEdit} />
    </div>
  );
}
