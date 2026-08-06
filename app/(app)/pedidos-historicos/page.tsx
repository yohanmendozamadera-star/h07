import { getCurrentUser, can } from "@/lib/permissions";
import { getPedidosHistoricos, getTallerFollowUps } from "@/lib/pedidos/queries";
import { hasActivePlan } from "@/lib/planes/queries";
import { getTodayBogota } from "@/lib/format";
import { ModulePlaceholder } from "@/components/layout/module-placeholder";
import { PedidosHistoricosClient } from "@/components/pedidos/pedidos-historicos-client";

export default async function PedidosHistoricosPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const user = await getCurrentUser();
  const permissions = user?.permissions ?? [];

  if (!can(permissions, "pedidos.view")) {
    return <ModulePlaceholder title="Pedidos Históricos" description="No tienes permiso para ver este módulo." denied />;
  }

  const planActive = await hasActivePlan(user!.empresaId);
  if (!planActive) {
    return (
      <ModulePlaceholder
        title="Pedidos Históricos"
        description="El historial completo de pedidos es un beneficio de los planes pagos (H07 y Premium). Ve a Planes para cambiar tu plan y ver todo tu historial."
        denied
      />
    );
  }

  const params = await searchParams;
  const today = getTodayBogota();
  const dateFrom = params.from ?? today;
  const dateTo = params.to ?? today;

  const [orders, tallerFollowUps] = await Promise.all([
    getPedidosHistoricos(dateFrom, dateTo),
    getTallerFollowUps(),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Pedidos Históricos</h1>
        <p className="text-sm text-muted-foreground">
          Registro completo de pedidos de Lavandería, Productos y Taller.
        </p>
      </div>

      <PedidosHistoricosClient
        orders={orders}
        tallerFollowUps={tallerFollowUps}
        defaultFrom={today}
        defaultTo={today}
        exportHref={`/pedidos-historicos/export?from=${dateFrom}&to=${dateTo}`}
      />
    </div>
  );
}
