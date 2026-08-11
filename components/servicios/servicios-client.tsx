"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CatalogItemFormDialog } from "@/components/servicios/catalog-item-form-dialog";
import { ParkingRateFormDialog } from "@/components/servicios/parking-rate-form-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ImportServicesDialog } from "@/components/servicios/import-services-dialog";
import { toggleCatalogItemActive, toggleParkingRateActive } from "@/app/(app)/servicios/actions";
import { CHANNEL_LABELS, type CatalogChannel, type CatalogItem } from "@/lib/servicios/types";
import type { ParkingRate } from "@/lib/parqueadero/types";
import { formatCurrency } from "@/lib/format";

export function ServiciosClient({
  items,
  enabledChannels,
  parkingRates,
  parqueaderoEnabled,
  canEdit,
}: {
  items: CatalogItem[];
  enabledChannels: CatalogChannel[];
  parkingRates: ParkingRate[];
  parqueaderoEnabled: boolean;
  canEdit: boolean;
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmItem, setConfirmItem] = useState<CatalogItem | null>(null);
  const [confirmRate, setConfirmRate] = useState<ParkingRate | null>(null);

  if (enabledChannels.length === 0 && !parqueaderoEnabled) {
    return (
      <p className="text-sm text-muted-foreground">
        Activa al menos un módulo de negocio en Configuraciones para poder cargar servicios.
      </p>
    );
  }

  const handleToggleItem = async (item: CatalogItem) => {
    setPendingId(item.id);
    const result = await toggleCatalogItemActive(item.id, !item.is_active);
    setPendingId(null);
    setConfirmItem(null);
    if (!result.success) {
      toast.error("No se pudo actualizar", { description: result.message });
      return;
    }
    toast.success(item.is_active ? "Servicio desactivado" : "Servicio activado");
  };

  const handleToggleRate = async (rate: ParkingRate) => {
    setPendingId(rate.id);
    const result = await toggleParkingRateActive(rate.id, !rate.is_active);
    setPendingId(null);
    setConfirmRate(null);
    if (!result.success) {
      toast.error("No se pudo actualizar", { description: result.message });
      return;
    }
    toast.success(rate.is_active ? "Tarifa desactivada" : "Tarifa activada");
  };

  const firstTab = enabledChannels[0] ?? "parqueadero";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Servicios</h1>
        {canEdit && <ImportServicesDialog />}
      </div>

      <Tabs defaultValue={firstTab}>
        <TabsList>
          {enabledChannels.map((channel) => (
            <TabsTrigger key={channel} value={channel}>
              {CHANNEL_LABELS[channel]}
            </TabsTrigger>
          ))}
          {parqueaderoEnabled && <TabsTrigger value="parqueadero">Parqueadero</TabsTrigger>}
        </TabsList>

        {enabledChannels.map((channel) => {
          const channelItems = items.filter((item) => item.channel === channel);
          return (
            <TabsContent key={channel} value={channel} className="space-y-3 pt-3">
              <div className="flex justify-end">
                {canEdit && <CatalogItemFormDialog channel={channel} />}
              </div>

              {channelItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">Todavía no hay servicios en este canal.</p>
              ) : (
                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full text-sm">
                    <thead className="bg-blue-50 text-left text-xs text-blue-900 dark:bg-blue-950/40 dark:text-blue-100">
                      <tr>
                        <th className="p-2 font-medium">Nombre</th>
                        <th className="p-2 font-medium">Precio</th>
                        {channel === "taller" && <th className="p-2 font-medium">Tipo</th>}
                        <th className="p-2 font-medium">Estado</th>
                        {canEdit && <th className="p-2 font-medium" />}
                      </tr>
                    </thead>
                    <tbody>
                      {channelItems.map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="p-2">{item.name}</td>
                          <td className="p-2">
                            {formatCurrency(item.price)}
                            {item.unit ? ` / ${item.unit}` : ""}
                          </td>
                          {channel === "taller" && (
                            <td className="p-2 capitalize">{item.price_type}</td>
                          )}
                          <td className="p-2">
                            {canEdit ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={pendingId === item.id}
                                onClick={() => setConfirmItem(item)}
                              >
                                <Badge variant={item.is_active ? "success" : "outline"}>
                                  {item.is_active ? "Activo" : "Inactivo"}
                                </Badge>
                              </Button>
                            ) : (
                              <Badge variant={item.is_active ? "success" : "outline"}>
                                {item.is_active ? "Activo" : "Inactivo"}
                              </Badge>
                            )}
                          </td>
                          {canEdit && (
                            <td className="p-2 text-right">
                              <CatalogItemFormDialog channel={channel} item={item} />
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
          );
        })}

        {parqueaderoEnabled && (
          <TabsContent value="parqueadero" className="space-y-3 pt-3">
            <div className="flex justify-end">{canEdit && <ParkingRateFormDialog />}</div>

            {parkingRates.length === 0 ? (
              <p className="text-sm text-muted-foreground">Todavía no hay tarifas de parqueadero.</p>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-blue-50 text-left text-xs text-blue-900 dark:bg-blue-950/40 dark:text-blue-100">
                    <tr>
                      <th className="p-2 font-medium">Nombre</th>
                      <th className="p-2 font-medium">Tipo</th>
                      <th className="p-2 font-medium">Valor</th>
                      <th className="p-2 font-medium">Estado</th>
                      {canEdit && <th className="p-2 font-medium" />}
                    </tr>
                  </thead>
                  <tbody>
                    {parkingRates.map((rate) => (
                      <tr key={rate.id} className="border-t">
                        <td className="p-2">{rate.name}</td>
                        <td className="p-2 capitalize">{rate.rate_type}</td>
                        <td className="p-2">{formatCurrency(rate.amount)}</td>
                        <td className="p-2">
                          {canEdit ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={pendingId === rate.id}
                              onClick={() => setConfirmRate(rate)}
                            >
                              <Badge variant={rate.is_active ? "success" : "outline"}>
                                {rate.is_active ? "Activo" : "Inactivo"}
                              </Badge>
                            </Button>
                          ) : (
                            <Badge variant={rate.is_active ? "success" : "outline"}>
                              {rate.is_active ? "Activo" : "Inactivo"}
                            </Badge>
                          )}
                        </td>
                        {canEdit && (
                          <td className="p-2 text-right">
                            <ParkingRateFormDialog rate={rate} />
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      <ConfirmDialog
        open={Boolean(confirmItem)}
        onOpenChange={(open) => !open && setConfirmItem(null)}
        title={confirmItem?.is_active ? "¿Inactivar este servicio?" : "¿Activar este servicio?"}
        description={
          confirmItem?.is_active
            ? `"${confirmItem?.name}" dejará de estar disponible para tomar pedidos nuevos.`
            : `"${confirmItem?.name}" volverá a estar disponible para tomar pedidos nuevos.`
        }
        confirmLabel={confirmItem?.is_active ? "Inactivar" : "Activar"}
        pending={pendingId === confirmItem?.id}
        onConfirm={() => confirmItem && handleToggleItem(confirmItem)}
      />

      <ConfirmDialog
        open={Boolean(confirmRate)}
        onOpenChange={(open) => !open && setConfirmRate(null)}
        title={confirmRate?.is_active ? "¿Inactivar esta tarifa?" : "¿Activar esta tarifa?"}
        description={
          confirmRate?.is_active
            ? `"${confirmRate?.name}" dejará de estar disponible para cobrar parqueadero.`
            : `"${confirmRate?.name}" volverá a estar disponible para cobrar parqueadero.`
        }
        confirmLabel={confirmRate?.is_active ? "Inactivar" : "Activar"}
        pending={pendingId === confirmRate?.id}
        onConfirm={() => confirmRate && handleToggleRate(confirmRate)}
      />
    </div>
  );
}
