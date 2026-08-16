"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  saveCountryAction,
  saveModulesAction,
  saveCatalogItemsAction,
  saveParkingRatesAction,
  completeOnboardingAction,
} from "@/app/(onboarding)/onboarding/actions";
import type { ModuleSelection, CatalogItemDraft, ParkingRateDraft } from "@/lib/validations/onboarding";
import { COUNTRIES, COUNTRY_CODES, type CountryCode } from "@/lib/locale/countries";

const STEPS = ["Bienvenida", "Módulos", "Servicios y tarifas", "Confirmación"];

type CatalogChannel = "lavanderia" | "productos" | "taller";

const CHANNEL_LABELS: Record<CatalogChannel, string> = {
  lavanderia: "Autolavado",
  productos: "Productos",
  taller: "Taller",
};

const MODULE_TOGGLES: { key: keyof ModuleSelection; label: string }[] = [
  { key: "lavanderiaEnabled", label: "Autolavado" },
  { key: "inventarioEnabled", label: "Productos" },
  { key: "tallerEnabled", label: "Taller" },
  { key: "parqueaderoEnabled", label: "Parqueadero" },
];

function emptyCatalogRow(channel: CatalogChannel): CatalogItemDraft {
  return { channel, name: "", price: 0, priceType: "fijo" };
}

function emptyParkingRow(): ParkingRateDraft {
  return { name: "", rateType: "hora", amount: 0 };
}

export function OnboardingWizard({
  initialSettings,
  initialCountryCode,
}: {
  initialSettings: ModuleSelection;
  initialCountryCode: CountryCode;
}) {
  const [step, setStep] = useState(0);
  const [pending, startTransition] = useTransition();
  const [country, setCountry] = useState<CountryCode>(initialCountryCode);
  const [modules, setModules] = useState<ModuleSelection>(initialSettings);
  const [catalogDrafts, setCatalogDrafts] = useState<Record<CatalogChannel, CatalogItemDraft[]>>({
    lavanderia: [emptyCatalogRow("lavanderia")],
    productos: [emptyCatalogRow("productos")],
    taller: [emptyCatalogRow("taller")],
  });
  const [parkingDrafts, setParkingDrafts] = useState<ParkingRateDraft[]>([emptyParkingRow()]);

  const activeChannels = (Object.keys(CHANNEL_LABELS) as CatalogChannel[]).filter((channel) => {
    if (channel === "lavanderia") return modules.lavanderiaEnabled;
    if (channel === "productos") return modules.inventarioEnabled;
    return modules.tallerEnabled;
  });

  const goNext = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const handleCountryNext = () => {
    startTransition(async () => {
      try {
        await saveCountryAction({ countryCode: country });
        goNext();
      } catch (error) {
        toast.error("No fue posible guardar el país", { description: (error as Error).message });
      }
    });
  };

  const handleModulesNext = () => {
    if (!MODULE_TOGGLES.some(({ key }) => modules[key])) {
      toast.error("Activa al menos un módulo para continuar");
      return;
    }
    startTransition(async () => {
      try {
        await saveModulesAction(modules);
        goNext();
      } catch (error) {
        toast.error("No fue posible guardar los módulos", { description: (error as Error).message });
      }
    });
  };

  // Este paso se puede omitir por completo: si no se escribió nada, las
  // acciones de guardado no insertan filas vacías (ver saveCatalogItemsAction
  // y saveParkingRatesAction), así que "Continuar" avanza igual sin bloquear
  // — el dueño puede cargar sus servicios después desde Servicios.
  const handleCatalogNext = () => {
    startTransition(async () => {
      try {
        const itemsToSave = activeChannels.flatMap((channel) =>
          catalogDrafts[channel].filter((row) => row.name.trim().length > 0),
        );
        await saveCatalogItemsAction(itemsToSave);

        if (modules.parqueaderoEnabled) {
          const ratesToSave = parkingDrafts.filter((row) => row.name.trim().length > 0);
          await saveParkingRatesAction(ratesToSave);
        }

        goNext();
      } catch (error) {
        toast.error("No fue posible guardar los servicios", { description: (error as Error).message });
      }
    });
  };

  const handleFinish = () => {
    startTransition(async () => {
      try {
        await completeOnboardingAction();
      } catch (error) {
        // completeOnboardingAction termina con redirect("/dashboard"), que
        // Next.js implementa lanzando un error especial (digest
        // "NEXT_REDIRECT") para completar la navegación — no es un error
        // real, así que lo dejamos pasar en vez de mostrarlo como falla.
        if ((error as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) throw error;
        toast.error("No fue posible finalizar la configuración", { description: (error as Error).message });
      }
    });
  };

  return (
    <Card className="ring-blue-200 dark:ring-blue-900">
      <CardHeader>
        <div className="flex items-center gap-2">
          {STEPS.map((label, index) => (
            <div key={label} className="flex flex-1 items-center gap-2 last:flex-none">
              <div
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                  index <= step ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-900 dark:bg-blue-950/40 dark:text-blue-100",
                )}
              >
                {index + 1}
              </div>
              {index < STEPS.length - 1 && (
                <div className={cn("h-px flex-1", index < step ? "bg-blue-600" : "bg-blue-100 dark:bg-blue-900")} />
              )}
            </div>
          ))}
        </div>
        <CardTitle className="text-xl">{STEPS[step]}</CardTitle>
        {step === 0 && <CardDescription>Configuremos tu negocio en unos pocos pasos.</CardDescription>}
      </CardHeader>

      <CardContent className="space-y-6">
        {step === 0 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Vamos a activar los módulos de negocio que usas y a cargar tus primeros servicios y
              precios, para que puedas empezar a tomar pedidos de inmediato.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="country">País de tu negocio</Label>
              <select
                id="country"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={country}
                onChange={(e) => setCountry(e.target.value as CountryCode)}
              >
                {COUNTRY_CODES.map((code) => (
                  <option key={code} value={code}>
                    {COUNTRIES[code].name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Usamos esto para mostrar tus montos y fechas en la moneda y hora de tu país. Puedes cambiarlo
                después desde Configuraciones.
              </p>
            </div>
            <Button type="button" onClick={handleCountryNext} disabled={pending} className="w-full">
              {pending && <Loader2 className="size-4 animate-spin" />}
              Comenzar
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            {MODULE_TOGGLES.map(({ key, label }) => (
              <label key={key} className="flex items-center gap-3 rounded-md border p-3">
                <Checkbox
                  checked={modules[key]}
                  onCheckedChange={(checked) => setModules((prev) => ({ ...prev, [key]: checked }))}
                />
                <span className="text-sm font-medium">{label}</span>
              </label>
            ))}

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={goBack} className="flex-1">
                Atrás
              </Button>
              <Button type="button" onClick={handleModulesNext} disabled={pending} className="flex-1">
                {pending && <Loader2 className="size-4 animate-spin" />}
                Continuar
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <p className="rounded-md bg-blue-50 p-3 text-sm text-blue-900 dark:bg-blue-950/30 dark:text-blue-100">
              Este paso es opcional: puedes omitirlo y agregar tus servicios y tarifas más adelante desde{" "}
              <strong>Servicios</strong> (incluso puedes importarlos desde un Excel). Dale &quot;Continuar&quot;
              sin llenar nada si prefieres hacerlo después.
            </p>
            {activeChannels.map((channel) => (
              <div key={channel} className="space-y-2">
                <Label>{CHANNEL_LABELS[channel]}</Label>
                {catalogDrafts[channel].map((row, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Nombre del servicio"
                      value={row.name}
                      onChange={(e) =>
                        setCatalogDrafts((prev) => ({
                          ...prev,
                          [channel]: prev[channel].map((r, i) =>
                            i === index ? { ...r, name: e.target.value } : r,
                          ),
                        }))
                      }
                    />
                    <Input
                      type="number"
                      min={0}
                      placeholder="Precio"
                      className="w-32"
                      value={row.price || ""}
                      onChange={(e) =>
                        setCatalogDrafts((prev) => ({
                          ...prev,
                          [channel]: prev[channel].map((r, i) =>
                            i === index ? { ...r, price: Number(e.target.value) } : r,
                          ),
                        }))
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setCatalogDrafts((prev) => ({
                          ...prev,
                          [channel]: prev[channel].filter((_, i) => i !== index),
                        }))
                      }
                      disabled={catalogDrafts[channel].length === 1}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCatalogDrafts((prev) => ({
                      ...prev,
                      [channel]: [...prev[channel], emptyCatalogRow(channel)],
                    }))
                  }
                >
                  <Plus className="size-4" />
                  Agregar servicio
                </Button>
              </div>
            ))}

            {modules.parqueaderoEnabled && (
              <div className="space-y-2">
                <Label>Tarifas de parqueadero</Label>
                {parkingDrafts.map((row, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Nombre (ej. Por hora)"
                      value={row.name}
                      onChange={(e) =>
                        setParkingDrafts((prev) =>
                          prev.map((r, i) => (i === index ? { ...r, name: e.target.value } : r)),
                        )
                      }
                    />
                    <select
                      className="rounded-md border bg-background px-3 text-sm"
                      value={row.rateType}
                      onChange={(e) =>
                        setParkingDrafts((prev) =>
                          prev.map((r, i) =>
                            i === index
                              ? { ...r, rateType: e.target.value as ParkingRateDraft["rateType"] }
                              : r,
                          ),
                        )
                      }
                    >
                      <option value="hora">Hora</option>
                      <option value="dia">Día</option>
                      <option value="mes">Mes</option>
                    </select>
                    <Input
                      type="number"
                      min={0}
                      placeholder="Valor"
                      className="w-32"
                      value={row.amount || ""}
                      onChange={(e) =>
                        setParkingDrafts((prev) =>
                          prev.map((r, i) => (i === index ? { ...r, amount: Number(e.target.value) } : r)),
                        )
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setParkingDrafts((prev) => prev.filter((_, i) => i !== index))}
                      disabled={parkingDrafts.length === 1}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setParkingDrafts((prev) => [...prev, emptyParkingRow()])}
                >
                  <Plus className="size-4" />
                  Agregar tarifa
                </Button>
              </div>
            )}

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={goBack} className="flex-1">
                Atrás
              </Button>
              <Button type="button" onClick={handleCatalogNext} disabled={pending} className="flex-1">
                {pending && <Loader2 className="size-4 animate-spin" />}
                {activeChannels.every((channel) => catalogDrafts[channel].every((row) => !row.name.trim())) &&
                (!modules.parqueaderoEnabled || parkingDrafts.every((row) => !row.name.trim()))
                  ? "Omitir por ahora"
                  : "Continuar"}
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Todo listo. Ya puedes entrar a H07 y empezar a tomar pedidos.
            </p>
            <Button type="button" onClick={handleFinish} disabled={pending} className="w-full">
              {pending && <Loader2 className="size-4 animate-spin" />}
              Finalizar configuración
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
