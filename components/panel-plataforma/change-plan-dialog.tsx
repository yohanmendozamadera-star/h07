"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { platformSetPlan } from "@/app/(platform)/panel-plataforma/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ChangePlanDialog({ empresaId, companyName }: { empresaId: string; companyName: string }) {
  const [open, setOpen] = useState(false);
  const [planCode, setPlanCode] = useState<"free" | "h7">("h7");
  const [addonEnabled, setAddonEnabled] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onOpenChange = (value: boolean) => {
    setOpen(value);
    if (value) {
      setPlanCode("h7");
      setAddonEnabled(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const result = await platformSetPlan({ empresaId, planCode, addonEnabled });
    setSubmitting(false);

    if (!result.success) {
      toast.error("No se pudo cambiar el plan", { description: result.message });
      return;
    }

    toast.success("Plan actualizado");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>Cambiar plan</DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Cambiar plan — {companyName}</DialogTitle>
          <DialogDescription>Este cambio aplica de inmediato, sin esperar al corte mensual.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="planCode">Plan</Label>
            <select
              id="planCode"
              className="h-9 w-full rounded-md border bg-transparent px-2 text-sm"
              value={planCode}
              onChange={(e) => setPlanCode(e.target.value as "free" | "h7")}
            >
              <option value="free">Free</option>
              <option value="h7">H7</option>
            </select>
          </div>

          {planCode === "h7" && (
            <label className="flex items-center gap-3 rounded-md border p-3">
              <Checkbox checked={addonEnabled} onCheckedChange={(checked) => setAddonEnabled(checked)} />
              <span className="text-sm font-medium">Complemento Automatizaciones</span>
            </label>
          )}
        </div>

        <DialogFooter>
          <Button type="button" disabled={submitting} onClick={handleSubmit}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
