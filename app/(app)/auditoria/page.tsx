import { getCurrentUser, can } from "@/lib/permissions";
import { getAuditLogs } from "@/lib/audit/queries";
import { getTodayBogota } from "@/lib/format";
import { ModulePlaceholder } from "@/components/layout/module-placeholder";
import { AuditLogTable } from "@/components/auditoria/audit-log-table";
import { DateRangeFilter } from "@/components/shared/date-range-filter";
import { ExportButton } from "@/components/shared/export-button";

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const user = await getCurrentUser();
  const permissions = user?.permissions ?? [];

  if (!can(permissions, "auditoria.view")) {
    return <ModulePlaceholder title="Auditoría" description="No tienes permiso para ver este módulo." denied />;
  }

  const params = await searchParams;
  const today = getTodayBogota();
  const dateFrom = params.from ?? today;
  const dateTo = params.to ?? today;

  const logs = await getAuditLogs(dateFrom, dateTo);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Auditoría</h1>
        <p className="text-sm text-muted-foreground">Registro de cambios realizados en tu empresa.</p>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-2">
        <DateRangeFilter defaultFrom={today} defaultTo={today} />
        <ExportButton href={`/auditoria/export?from=${dateFrom}&to=${dateTo}`} />
      </div>

      <AuditLogTable logs={logs} />
    </div>
  );
}
