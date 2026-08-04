"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { shrinkageFormSchema, type ShrinkageFormValues } from "@/lib/validations/inventario";
import { createShrinkage } from "@/app/(app)/inventario/actions";
import type { CatalogItem } from "@/lib/servicios/types";
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

const todayIso = () => new Date().toISOString().slice(0, 10);

export function ShrinkageFormDialog({ items }: { items: CatalogItem[] }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ShrinkageFormValues>({
    resolver: zodResolver(shrinkageFormSchema),
    defaultValues: { catalogItemId: "", quantity: 1, reason: "", shrinkageDate: todayIso() },
  });

  const onOpenChange = (value: boolean) => {
    setOpen(value);
    if (value) reset({ catalogItemId: "", quantity: 1, reason: "", shrinkageDate: todayIso() });
  };

  const onSubmit = async (values: ShrinkageFormValues) => {
    setSubmitting(true);
    const result = await createShrinkage(values);
    setSubmitting(false);

    if (!result.success) {
      toast.error("No se pudo guardar", { description: result.message });
      return;
    }

    toast.success("Merma registrada");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button className="gap-1.5" />}>
        <Plus className="size-4" />
        Registrar merma
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva merma</DialogTitle>
          <DialogDescription>Los campos marcados con * son obligatorios.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="catalogItemId">Producto *</Label>
            <select
              id="catalogItemId"
              className="h-9 w-full rounded-md border bg-transparent px-2 text-sm"
              {...register("catalogItemId")}
            >
              <option value="">Selecciona…</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            {errors.catalogItemId && (
              <p className="text-sm text-destructive">{errors.catalogItemId.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="quantity">Cantidad *</Label>
            <Input id="quantity" type="number" min="0" step="0.01" {...register("quantity")} />
            {errors.quantity && <p className="text-sm text-destructive">{errors.quantity.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reason">Motivo</Label>
            <Input id="reason" {...register("reason")} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="shrinkageDate">Fecha *</Label>
            <Input id="shrinkageDate" type="date" {...register("shrinkageDate")} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Registrar merma
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
