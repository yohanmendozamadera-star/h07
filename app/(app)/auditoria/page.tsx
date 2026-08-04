import { getCurrentUser, can } from "@/lib/permissions";
import { getAuditLogs } from "@/lib/audit/queries";
import { ModulePlaceholder } from "@/components/layout/module-placeholder";
import { AuditLogTable } from "@/components/auditoria/audit-log-table";

export default async function AuditoriaPage() {
  const user = await getCurrentUser();
  const permissions = user?.permissions ?? [];

  if (!can(permissions, "auditoria.view")) {
    return <ModulePlaceholder title="Auditoría" description="No tienes permiso para ver este módulo." denied />;
  }

  const logs = await getAuditLogs();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Auditoría</h1>
        <p className="text-sm text-muted-foreground">Registro de cambios realizados en tu empresa.</p>
      </div>

      <AuditLogTable logs={logs} />
    </div>
  );
}
