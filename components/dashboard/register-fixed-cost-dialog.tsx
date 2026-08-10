"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Pencil, PiggyBank } from "lucide-react";
import { fixedCostFormSchema, type FixedCostFormValues } from "@/lib/validations/dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/format";

const COPY = {
  budgeted: {
    triggerLabel: "Registrar costo fijo presupuestado",
    title: "Costo fijo presupuestado",
    explanation:
      "Es el costo fijo mensual que TÚ presupuestaste para tu negocio — arriendo, nómina fija, servicios públicos, etc. — sin importar si hoy gastas exactamente eso.",
    example:
      "Ejemplo: presupuestaste $1.200.000 de arriendo + $2.000.000 de nómina + $300.000 de servicios → ingresa $3.500.000.",
    usage:
      "Con este número y tu margen de contribución promedio de los últimos meses (ventas menos costos, dividido entre ventas) calculamos cuánto deberías facturar para llegar a tu punto de equilibrio presupuestado.",
  },
  real: {
    triggerLabel: "Registrar costo fijo real",
    title: "Costo fijo real",
    explanation:
      "Es el costo fijo que SABES que pagas cada mes hoy en día — arriendo, nómina, servicios, etc. — el número real, no un estimado.",
    example:
      "Ejemplo: pagas $1.200.000 de arriendo + $2.200.000 de nómina + $350.000 de servicios → ingresa $3.750.000.",
    usage:
      "Con este número calculamos, en tiempo real, con las ventas y costos del mes en curso, cuánto llevas facturado y cuánto te falta para llegar a tu punto de equilibrio real este mes.",
  },
} as const;

export function RegisterFixedCostDialog({
  kind,
  currentValue,
  currentValueUpdatedAt,
  onSave,
}: {
  kind: "budgeted" | "real";
  currentValue: number | null;
  currentValueUpdatedAt: string | null;
  onSave: (input: unknown) => Promise<{ success: true } | { success: false; message: string }>;
}) {
  const copy = COPY[kind];
  const isEdit = currentValue !== null;
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FixedCostFormValues>({
    resolver: zodResolver(fixedCostFormSchema),
    defaultValues: { amount: currentValue ?? 0 },
  });

  const onOpenChange = (value: boolean) => {
    setOpen(value);
    if (value) reset({ amount: currentValue ?? 0 });
  };

  const onSubmit = async (values: FixedCostFormValues) => {
    setSubmitting(true);
    const result = await onSave(values);
    setSubmitting(false);

    if (!result.success) {
      toast.error("No se pudo guardar", { description: result.message });
      return;
    }

    toast.success("Costo fijo actualizado");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger
        render={
          <Button variant={isEdit ? "outline" : "default"} size="sm" className="gap-1.5" />
        }
      >
        {isEdit ? <Pencil className="size-3.5" /> : <PiggyBank className="size-3.5" />}
        {isEdit ? "Editar costo fijo" : copy.triggerLabel}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription className="space-y-2">
            <span className="block">{copy.explanation}</span>
            <span className="block italic">{copy.example}</span>
            <span className="block">{copy.usage}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="amount">Costo fijo mensual *</Label>
            <Input id="amount" type="number" min="0" step="1000" autoFocus {...register("amount")} />
            {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
            {currentValueUpdatedAt && (
              <p className="text-xs text-muted-foreground">
                Última actualización: {formatDate(currentValueUpdatedAt)}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
