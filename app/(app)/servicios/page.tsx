import { getCurrentUser, can } from "@/lib/permissions";
import { getCatalogItems } from "@/lib/servicios/queries";
import { getParkingRates } from "@/lib/parqueadero/queries";
import { getCompanySettings } from "@/lib/configuraciones/queries";
import { ModulePlaceholder } from "@/components/layout/module-placeholder";
import { ServiciosClient } from "@/components/servicios/servicios-client";
import type { CatalogChannel } from "@/lib/servicios/types";

export default async function ServiciosPage() {
  const user = await getCurrentUser();
  const permissions = user?.permissions ?? [];

  if (!can(permissions, "servicios.view")) {
    return <ModulePlaceholder title="Servicios" description="No tienes permiso para ver este módulo." denied />;
  }

  const [items, parkingRates, settings] = await Promise.all([
    getCatalogItems(),
    getParkingRates(),
    user ? getCompanySettings(user.empresaId) : null,
  ]);

  const enabledChannels: CatalogChannel[] = [
    ...(settings?.lavanderia_enabled ? (["lavanderia"] as const) : []),
    ...(settings?.inventario_enabled ? (["productos"] as const) : []),
    ...(settings?.taller_enabled ? (["taller"] as const) : []),
  ];

  return (
    <ServiciosClient
      items={items}
      enabledChannels={enabledChannels}
      parkingRates={parkingRates}
      parqueaderoEnabled={Boolean(settings?.parqueadero_enabled)}
      canEdit={can(permissions, "servicios.edit")}
    />
  );
}
