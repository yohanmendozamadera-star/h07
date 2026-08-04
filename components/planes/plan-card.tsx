"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { changePlan } from "@/app/(app)/planes/actions";
import type { CurrentSubscription, PlanRow, PlanAddonRow } from "@/lib/planes/types";
import { formatCurrency } from "@/lib/format";

// "Premium" no es un plan propio en la base de datos: es el plan H07 con el
// complemento "automatizaciones" activado. Se presenta como un tercer nivel
// en la comparación porque así lo pidió el negocio, pero por debajo sigue
// siendo una sola llamada a activate_paid_plan(planCode:"h7", addonEnabled).
type TierKey = "free" | "h7" | "premium";

const TIER_NAMES: Record<TierKey, string> = { free: "Free", h7: "H07", premium: "Premium" };

const TIER_BENEFITS: Record<TierKey, string[]> = {
  free: ["Acceso a toda la plataforma", "Historial de pedidos: últimas 3 horas", "Soporte básico"],
  h7: ["Todo lo del plan Free", "Historial de pedidos ilimitado", "Soporte premium"],
  premium: [
    "Todo lo del plan H07",
    "Notificaciones automáticas por WhatsApp y correo para recordar citas a tus clientes",
  ],
};

type PlanTarget = { tier: TierKey; planCode: "free" | "h7"; addonEnabled: boolean };

function PlanTierCard({
  tier,
  price,
  isCurrent,
  highlight,
  ctaLabel,
  onSelect,
  disabled,
}: {
  tier: TierKey;
  price: number;
  isCurrent: boolean;
  highlight?: boolean;
  ctaLabel: string;
  onSelect: () => void;
  disabled: boolean;
}) {
  return (
    <Card className={highlight ? "border-blue-300 dark:border-blue-800" : undefined}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{TIER_NAMES[tier]}</CardTitle>
          {isCurrent && <Badge variant="secondary">Plan actual</Badge>}
        </div>
        <CardDescription>{price === 0 ? "Sin costo" : `${formatCurrency(price)} / mes`}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2 text-sm">
          {TIER_BENEFITS[tier].map((benefit) => (
            <li key={benefit} className="flex items-start gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-blue-600 dark:text-blue-400" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>

        <Button type="button" className="w-full" disabled={disabled} onClick={onSelect}>
          {ctaLabel}
        </Button>
      </CardContent>
    </Card>
  );
}

export function PlanCard({
  subscription,
  plans,
  addons,
}: {
  subscription: CurrentSubscription | null;
  plans: PlanRow[];
  addons: PlanAddonRow[];
}) {
  const router = useRouter();
  const [target, setTarget] = useState<PlanTarget | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isSuspended = subscription?.status === "suspended";
  const currentTier: TierKey =
    !subscription || subscription.plan.code === "free" ? "free" : subscription.addon_enabled ? "premium" : "h7";

  const h7Price = plans.find((p) => p.code === "h7")?.price_cop ?? 70000;
  const addonPrice = addons.find((a) => a.code === "automatizaciones")?.price_cop ?? 30000;

  const handleConfirm = async () => {
    if (!target) return;
    setSubmitting(true);
    const result = await changePlan({ planCode: target.planCode, addonEnabled: target.addonEnabled });
    setSubmitting(false);
    setTarget(null);

    if (!result.success) {
      toast.error("No se pudo actualizar el plan", { description: result.message });
      return;
    }

    toast.success(`Cambiaste al plan ${TIER_NAMES[target.tier]}`);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {isSuspended && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          Tu empresa está suspendida por falta de pago. Ponte al día para recuperar el acceso completo.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <PlanTierCard
          tier="free"
          price={0}
          isCurrent={currentTier === "free"}
          disabled={currentTier === "free"}
          ctaLabel={currentTier === "free" ? "Plan actual" : "Volver a Free"}
          onSelect={() => setTarget({ tier: "free", planCode: "free", addonEnabled: false })}
        />
        <PlanTierCard
          tier="h7"
          price={h7Price}
          isCurrent={currentTier === "h7"}
          disabled={currentTier === "h7"}
          ctaLabel={currentTier === "h7" ? "Plan actual" : currentTier === "premium" ? "Quitar complemento" : "Suscribirme"}
          onSelect={() => setTarget({ tier: "h7", planCode: "h7", addonEnabled: false })}
        />
        <PlanTierCard
          tier="premium"
          price={h7Price + addonPrice}
          isCurrent={currentTier === "premium"}
          highlight
          disabled={currentTier === "premium"}
          ctaLabel={currentTier === "premium" ? "Plan actual" : "Suscribirme"}
          onSelect={() => setTarget({ tier: "premium", planCode: "h7", addonEnabled: true })}
        />
      </div>

      <Dialog open={Boolean(target)} onOpenChange={(open) => !open && setTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar cambio de plan</DialogTitle>
            <DialogDescription>
              ¿Estás seguro que quieres cambiar al plan {target && TIER_NAMES[target.tier]}?
              {target && target.planCode !== "free" && " Se generará la factura correspondiente a este periodo."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={submitting} onClick={() => setTarget(null)}>
              Cancelar
            </Button>
            <Button type="button" disabled={submitting} onClick={handleConfirm}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
