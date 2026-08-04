"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus, Pencil } from "lucide-react";
import { parkingRateFormSchema, type ParkingRateFormValues } from "@/lib/validations/parking-rate";
import { createParkingRate, updateParkingRate } from "@/app/(app)/servicios/actions";
import type { ParkingRate } from "@/lib/parqueadero/types";
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

function toFormValues(rate?: ParkingRate): ParkingRateFormValues {
  return { name: rate?.name ?? "", rateType: rate?.rate_type ?? "hora", amount: rate?.amount ?? 0 };
}

export function ParkingRateFormDialog({ rate }: { rate?: ParkingRate }) {
  const isEdit = Boolean(rate);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ParkingRateFormValues>({
    resolver: zodResolver(parkingRateFormSchema),
    defaultValues: toFormValues(rate),
  });

  const onOpenChange = (value: boolean) => {
    setOpen(value);
    if (value) reset(toFormValues(rate));
  };

  const onSubmit = async (values: ParkingRateFormValues) => {
    setSubmitting(true);
    const result = isEdit ? await updateParkingRate(rate!.id, values) : await createParkingRate(values);
    setSubmitting(false);

    if (!result.success) {
      toast.error("No se pudo guardar", { description: result.message });
      return;
    }

    toast.success(isEdit ? "Tarifa actualizada" : "Tarifa creada");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger
        render={
          isEdit ? (
            <Button variant="ghost" size="icon-sm" aria-label="Editar" />
          ) : (
            <Button className="gap-1.5" />
          )
        }
      >
        {isEdit ? (
          <Pencil className="size-4" />
        ) : (
          <>
            <Plus className="size-4" />
            Agregar tarifa
          </>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar tarifa" : "Nueva tarifa de parqueadero"}</DialogTitle>
          <DialogDescription>Los campos marcados con * son obligatorios.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre *</Label>
            <Input id="name" placeholder="ej. Por hora" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rateType">Tipo *</Label>
            <select
              id="rateType"
              className="h-9 w-full rounded-md border bg-transparent px-2 text-sm"
              {...register("rateType")}
            >
              <option value="hora">Hora</option>
              <option value="dia">Día</option>
              <option value="mes">Mes</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="amount">Valor *</Label>
            <Input id="amount" type="number" min="0" step="0.01" {...register("amount")} />
            {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? "Guardar cambios" : "Crear tarifa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
