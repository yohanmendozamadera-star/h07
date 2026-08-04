import { getCurrentUser, can } from "@/lib/permissions";
import { getPedidosHistoricos, getTallerFollowUps } from "@/lib/pedidos/queries";
import { hasActivePlan } from "@/lib/planes/queries";
import { ModulePlaceholder } from "@/components/layout/module-placeholder";
import { PedidosHistoricosClient } from "@/components/pedidos/pedidos-historicos-client";
import { ExportButton } from "@/components/shared/export-button";

export default async function PedidosHistoricosPage() {
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

  const [orders, tallerFollowUps] = await Promise.all([getPedidosHistoricos(), getTallerFollowUps()]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Pedidos Históricos</h1>
          <p className="text-sm text-muted-foreground">
            Registro completo de pedidos de Lavandería, Productos y Taller.
          </p>
        </div>
        <ExportButton href="/pedidos-historicos/export" />
      </div>

      <PedidosHistoricosClient orders={orders} tallerFollowUps={tallerFollowUps} />
    </div>
  );
}
