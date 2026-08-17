import Link from "next/link";
import { getCurrentUser, can } from "@/lib/permissions";
import { getCatalogItems } from "@/lib/servicios/queries";
import { getClients } from "@/lib/clientes/queries";
import { getTecnicos } from "@/lib/usuarios/queries";
import { getRecentPedidos } from "@/lib/pedidos/queries";
import { getParkingRates, getOpenMovements } from "@/lib/parqueadero/queries";
import { getCompanySettings } from "@/lib/configuraciones/queries";
import { getCompanyName } from "@/lib/companies/queries";
import { hasActivePlan } from "@/lib/planes/queries";
import { getOrderLockStatus } from "@/lib/pedidos/order-lock";
import { ModulePlaceholder } from "@/components/layout/module-placeholder";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TomaPedidosClient } from "@/components/pedidos/toma-pedidos-client";
import type { PedidoItemChannel } from "@/lib/pedidos/types";
import { formatCurrency, formatDate } from "@/lib/format";
import { createPedido } from "./actions";

export default async function TomaPedidosPage() {
  const user = await getCurrentUser();
  const permissions = user?.permissions ?? [];

  const canViewPedidos = can(permissions, "pedidos.view");
  const canViewParqueadero = can(permissions, "parqueadero.view");

  if (!canViewPedidos && !canViewParqueadero) {
    return <ModulePlaceholder title="Toma Pedidos" description="No tienes permiso para ver este módulo." denied />;
  }

  const [items, clients, technicians, orders, settings, rates, openMovements, planActive, orderLock, businessName] =
    await Promise.all([
      getCatalogItems(),
      getClients(),
      getTecnicos(),
      canViewPedidos ? getRecentPedidos() : Promise.resolve([]),
      user ? getCompanySettings(user.empresaId) : null,
      canViewParqueadero ? getParkingRates() : Promise.resolve([]),
      canViewParqueadero ? getOpenMovements() : Promise.resolve([]),
      hasActivePlan(user!.empresaId),
      getOrderLockStatus(user!.empresaId),
      getCompanyName(user!.empresaId),
    ]);

  const enabledChannels: PedidoItemChannel[] = [
    ...(canViewPedidos && settings?.lavanderia_enabled ? (["lavanderia"] as const) : []),
    ...(canViewPedidos && settings?.inventario_enabled ? (["productos"] as const) : []),
    ...(canViewPedidos && settings?.taller_enabled ? (["taller"] as const) : []),
  ];
  const parqueaderoEnabled = canViewParqueadero && Boolean(settings?.parqueadero_enabled);

  const activeItems = items.filter((item) => item.is_active);
  const activeRates = rates.filter((rate) => rate.is_active);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">Toma Pedidos</h1>

      {canViewPedidos && orderLock.blocked && (
        <Alert className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30">
          <AlertDescription>
            Toma Pedidos está bloqueado: el cobro de {formatCurrency(orderLock.totalAmount)} venció el{" "}
            {formatDate(orderLock.dueDate)} y sigue sin pagarse. Ve a <Link href="/planes">Planes</Link> para ponerte
            al día y reactivarlo. El resto de la aplicación sigue funcionando con normalidad.
          </AlertDescription>
        </Alert>
      )}

      {canViewPedidos && !planActive && (
        <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30">
          <AlertDescription>
            Estás en el plan Free: aquí solo puedes ver el historial de pedidos de las últimas 3 horas. Si quieres ver
            el historial completo, <Link href="/planes">cambia de plan</Link>.
          </AlertDescription>
        </Alert>
      )}

      <TomaPedidosClient
        enabledChannels={enabledChannels}
        parqueaderoEnabled={parqueaderoEnabled}
        catalogItems={activeItems}
        clients={clients}
        technicians={technicians}
        orders={orders}
        canCreatePedido={can(permissions, "pedidos.create")}
        pedidosBlocked={orderLock.blocked}
        createPedidoAction={createPedido}
        parkingRates={activeRates}
        openMovements={openMovements}
        graceMinutes={settings?.parking_grace_minutes ?? 0}
        printerIp={settings?.parqueadero_printer_ip ?? null}
        businessName={businessName}
      />
    </div>
  );
}
