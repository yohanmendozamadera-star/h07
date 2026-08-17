"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { ClientRow } from "@/lib/clientes/types";
import type { ParkingRate, OpenMovement } from "@/lib/parqueadero/types";
import { calculateParkingCharge } from "@/lib/parqueadero/tariff";
import { PAYMENT_METHODS } from "@/lib/pedidos/types";
import { useLocale } from "@/lib/locale/locale-context";
import { printEntryTicket } from "@/lib/parqueadero/print-ticket";
import { registrarEntradaParqueadero, registrarSalidaParqueadero } from "@/app/(app)/toma-pedidos/actions";

function formatElapsed(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours} h ${mins} min` : `${mins} min`;
}

function MovementRow({ movement, graceMinutes }: { movement: OpenMovement; graceMinutes: number }) {
  const router = useRouter();
  const { formatCurrency } = useLocale();
  const [now, setNow] = useState(() => new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(interval);
  }, []);

  const entryAt = new Date(movement.entry_at);
  const { billableMinutes, amount } = calculateParkingCharge({
    entryAt,
    exitAt: now,
    graceMinutes,
    rateType: movement.parking_rate.rate_type,
    rateAmount: movement.parking_rate.amount,
  });
  const elapsedMinutes = Math.max(0, Math.floor((now.getTime() - entryAt.getTime()) / 60000));

  const handleSalida = async () => {
    if (!paymentMethod) {
      toast.error("Selecciona un método de pago");
      return;
    }
    setSubmitting(true);
    let result;
    try {
      result = await registrarSalidaParqueadero({ movementId: movement.id, paymentMethod });
    } catch {
      setSubmitting(false);
      toast.error("No se pudo registrar la salida", { description: "Intenta de nuevo." });
      return;
    }
    setSubmitting(false);

    if (!result.success) {
      toast.error("No se pudo registrar la salida", { description: result.message });
      return;
    }

    toast.success(`Salida registrada — pedido ${result.orderNumber} por ${formatCurrency(result.amount)}`);
    setDialogOpen(false);
    router.refresh();
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
      <div>
        <p className="text-sm font-medium">{movement.plate}</p>
        <p className="text-xs text-muted-foreground">
          {movement.parking_rate.name} · {formatElapsed(elapsedMinutes)}
          {billableMinutes === 0 ? " (dentro de la tolerancia)" : ""}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold">{formatCurrency(amount)}</span>

        <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (v) setPaymentMethod(""); }}>
          <DialogTrigger render={<Button type="button" size="sm" />}>Registrar salida</DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Registrar salida — {movement.plate}</DialogTitle>
              <DialogDescription>
                Total a cobrar: <strong>{formatCurrency(amount)}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-1.5">
              <Label htmlFor="salidaPaymentMethod">Método de pago *</Label>
              <select
                id="salidaPaymentMethod"
                className="h-9 w-full rounded-md border bg-transparent px-2 text-sm"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="">Selecciona…</option>
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>

            <DialogFooter>
              <Button type="button" disabled={submitting} onClick={handleSalida}>
                {submitting && <Loader2 className="size-4 animate-spin" />}
                Confirmar salida
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export function ParqueaderoClient({
  rates,
  openMovements,
  clients,
  graceMinutes,
  printerIp,
  businessName,
}: {
  rates: ParkingRate[];
  openMovements: OpenMovement[];
  clients: ClientRow[];
  graceMinutes: number;
  printerIp: string | null;
  businessName: string;
}) {
  const router = useRouter();
  const { formatCurrency, countryCode } = useLocale();
  const [plate, setPlate] = useState("");
  const [clientId, setClientId] = useState("");
  const [parkingRateId, setParkingRateId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleEntrada = async () => {
    if (!plate.trim()) {
      toast.error("Ingresa la placa");
      return;
    }
    if (!parkingRateId) {
      toast.error("Selecciona una tarifa");
      return;
    }

    setSubmitting(true);
    let result;
    try {
      result = await registrarEntradaParqueadero({
        plate,
        clientId: clientId || undefined,
        parkingRateId,
      });
    } catch {
      setSubmitting(false);
      toast.error("No se pudo registrar la entrada", { description: "Intenta de nuevo." });
      return;
    }
    setSubmitting(false);

    if (!result.success) {
      toast.error("No se pudo registrar la entrada", { description: result.message });
      return;
    }

    toast.success("Entrada registrada");

    if (printerIp) {
      const rateName = rates.find((rate) => rate.id === parkingRateId)?.name ?? "";
      printEntryTicket({ printerIp, businessName, plate, rateName, entryAt: new Date(), countryCode }).catch(() => {
        toast.error("No se pudo conectar con la impresora", {
          description: "Revisa que QZ Tray esté abierto y la impresora encendida.",
        });
      });
    }

    setPlate("");
    setClientId("");
    setParkingRateId("");
    router.refresh();
  };

  if (rates.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Todavía no hay tarifas de parqueadero activas. Ve a Servicios para agregar al menos una.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Registrar entrada</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="plate">Placa *</Label>
            <Input id="plate" className="uppercase" value={plate} onChange={(e) => setPlate(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="clientId">Cliente</Label>
            <select
              id="clientId"
              className="h-9 w-full rounded-md border bg-transparent px-2 text-sm"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            >
              <option value="">Ocasional</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="parkingRateId">Tarifa *</Label>
            <select
              id="parkingRateId"
              className="h-9 w-full rounded-md border bg-transparent px-2 text-sm"
              value={parkingRateId}
              onChange={(e) => setParkingRateId(e.target.value)}
            >
              <option value="">Selecciona…</option>
              {rates.map((rate) => (
                <option key={rate.id} value={rate.id}>
                  {rate.name} ({formatCurrency(rate.amount)})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <Button type="button" className="w-full" disabled={submitting} onClick={handleEntrada}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Registrar entrada
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Vehículos estacionados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {openMovements.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay vehículos estacionados en este momento.</p>
          ) : (
            openMovements.map((movement) => (
              <MovementRow key={movement.id} movement={movement} graceMinutes={graceMinutes} />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
