"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { companySettingsFormSchema, type CompanySettingsFormValues } from "@/lib/validations/configuraciones";
import { updateCompanySettingsAction } from "@/app/(app)/configuraciones/actions";
import type { CompanySettings } from "@/lib/configuraciones/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const MODULE_TOGGLES: { key: keyof CompanySettingsFormValues; label: string }[] = [
  { key: "lavanderiaEnabled", label: "Autolavado" },
  { key: "inventarioEnabled", label: "Productos" },
  { key: "tallerEnabled", label: "Taller" },
  { key: "parqueaderoEnabled", label: "Parqueadero" },
];

function toFormValues(settings: CompanySettings): CompanySettingsFormValues {
  return {
    lavanderiaEnabled: settings.lavanderia_enabled,
    inventarioEnabled: settings.inventario_enabled,
    tallerEnabled: settings.taller_enabled,
    parqueaderoEnabled: settings.parqueadero_enabled,
    requireTechnicianOnInvoice: settings.require_technician_on_invoice,
    showNumericKeypad: settings.show_numeric_keypad,
    parkingGraceMinutes: settings.parking_grace_minutes,
    commissionEnabled: settings.commission_enabled,
    commissionTechnicianPercent: settings.commission_technician_percent,
    parqueaderoPrinterIp: settings.parqueadero_printer_ip ?? "",
  };
}

export function SettingsForm({ settings }: { settings: CompanySettings }) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CompanySettingsFormValues>({
    resolver: zodResolver(companySettingsFormSchema),
    defaultValues: toFormValues(settings),
  });

  const values = watch();

  const onSubmit = async (formValues: CompanySettingsFormValues) => {
    const result = await updateCompanySettingsAction(formValues);
    if (!result.success) {
      toast.error("No se pudo guardar", { description: result.message });
      return;
    }
    toast.success("Configuración actualizada");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Módulos y preferencias</CardTitle>
        <CardDescription>Activa los módulos de negocio que usas y ajusta el comportamiento general.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid gap-3 sm:grid-cols-2">
            {MODULE_TOGGLES.map(({ key, label }) => (
              <label key={key} className="flex items-center gap-3 rounded-md border p-3">
                <Checkbox
                  checked={Boolean(values[key])}
                  onCheckedChange={(checked) => setValue(key, checked)}
                />
                <span className="text-sm font-medium">{label}</span>
              </label>
            ))}
          </div>

          <label className="flex items-center gap-3 rounded-md border p-3">
            <Checkbox
              checked={Boolean(values.requireTechnicianOnInvoice)}
              onCheckedChange={(checked) => setValue("requireTechnicianOnInvoice", checked)}
            />
            <span className="text-sm font-medium">Pedir técnico al facturar</span>
          </label>

          <label className="flex items-center gap-3 rounded-md border p-3">
            <Checkbox
              checked={Boolean(values.showNumericKeypad)}
              onCheckedChange={(checked) => setValue("showNumericKeypad", checked)}
            />
            <span className="text-sm font-medium">Mostrar teclado numérico en pantalla</span>
          </label>

          <div className="max-w-xs space-y-1.5">
            <Label htmlFor="parkingGraceMinutes">Tolerancia de parqueadero (minutos)</Label>
            <Input
              id="parkingGraceMinutes"
              type="number"
              min={0}
              max={1440}
              {...register("parkingGraceMinutes")}
            />
            {errors.parkingGraceMinutes && (
              <p className="text-sm text-destructive">{errors.parkingGraceMinutes.message}</p>
            )}
          </div>

          {values.parqueaderoEnabled && (
            <div className="max-w-xs space-y-1.5">
              <Label htmlFor="parqueaderoPrinterIp">IP de la impresora térmica (opcional)</Label>
              <Input
                id="parqueaderoPrinterIp"
                placeholder="192.168.1.50"
                {...register("parqueaderoPrinterIp")}
              />
              <p className="text-xs text-muted-foreground">
                Para que salga un tiquete impreso al registrar una entrada, escribe aquí la IP de tu impresora
                térmica de red (80mm) y ten instalado{" "}
                <a
                  href="https://qz.io/download/"
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2"
                >
                  QZ Tray
                </a>{" "}
                (gratis) en el computador conectado a la impresora. La primera vez que imprimas, verás un aviso de
                QZ Tray pidiendo permitir la conexión.
              </p>
              {errors.parqueaderoPrinterIp && (
                <p className="text-sm text-destructive">{errors.parqueaderoPrinterIp.message}</p>
              )}
            </div>
          )}

          <div className="space-y-3 rounded-md border p-3">
            <label className="flex items-center gap-3">
              <Checkbox
                checked={Boolean(values.commissionEnabled)}
                onCheckedChange={(checked) => setValue("commissionEnabled", checked)}
              />
              <span className="text-sm font-medium">Trabajo por comisión</span>
            </label>
            <p className="text-xs text-muted-foreground">
              Actívalo si le pagas a cada técnico un porcentaje de lo que factura (ej: 60% para el lavadero, 40%
              para el técnico). El campo de abajo es el porcentaje que se lleva el TÉCNICO, no el del negocio.
            </p>

            {values.commissionEnabled && (
              <div className="max-w-xs space-y-1.5">
                <Label htmlFor="commissionTechnicianPercent">% de comisión del técnico</Label>
                <Input
                  id="commissionTechnicianPercent"
                  type="number"
                  min={0}
                  max={100}
                  step="1"
                  placeholder="Ej: 40"
                  {...register("commissionTechnicianPercent")}
                />
                <p className="text-xs text-muted-foreground">
                  Ejemplo: si tú te quedas el 60% y el técnico el 40%, aquí escribes <strong>40</strong>.
                </p>
                {errors.commissionTechnicianPercent && (
                  <p className="text-sm text-destructive">{errors.commissionTechnicianPercent.message}</p>
                )}
              </div>
            )}
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Guardar configuración
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
