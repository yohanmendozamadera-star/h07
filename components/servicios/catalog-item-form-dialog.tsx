"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Plus, Pencil } from "lucide-react";
import { catalogItemFormSchema } from "@/lib/validations/catalog-item";
import { createCatalogItem, updateCatalogItem } from "@/app/(app)/servicios/actions";
import { CHANNEL_LABELS, type CatalogChannel, type CatalogItem } from "@/lib/servicios/types";
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

// channel viaja aparte (fijo por la pestaña activa), no como campo editable
// del formulario: por eso el schema del dialog lo omite y se agrega recién
// al armar el payload que se manda a la Server Action.
const dialogSchema = catalogItemFormSchema.omit({ channel: true });
type DialogFormValues = z.input<typeof dialogSchema>;

export function CatalogItemFormDialog({ channel, item }: { channel: CatalogChannel; item?: CatalogItem }) {
  const isEdit = Boolean(item);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const defaultValues: DialogFormValues = {
    name: item?.name ?? "",
    price: item?.price ?? 0,
    priceType: item?.price_type ?? "fijo",
    unit: item?.unit ?? "",
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DialogFormValues>({ resolver: zodResolver(dialogSchema), defaultValues });

  const onOpenChange = (value: boolean) => {
    setOpen(value);
    if (value) reset(defaultValues);
  };

  const onSubmit = async (values: DialogFormValues) => {
    setSubmitting(true);
    const payload = { ...values, channel };
    const result = isEdit ? await updateCatalogItem(item!.id, payload) : await createCatalogItem(payload);
    setSubmitting(false);

    if (!result.success) {
      toast.error("No se pudo guardar", { description: result.message });
      return;
    }

    toast.success(isEdit ? "Servicio actualizado" : "Servicio creado");
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
            Agregar servicio
          </>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar servicio" : `Nuevo servicio de ${CHANNEL_LABELS[channel]}`}
          </DialogTitle>
          <DialogDescription>Los campos marcados con * son obligatorios.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre *</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="price">Precio *</Label>
            <Input id="price" type="number" min="0" step="0.01" {...register("price")} />
            {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
          </div>

          {channel === "taller" && (
            <div className="space-y-1.5">
              <Label htmlFor="priceType">Tipo de precio</Label>
              <select
                id="priceType"
                className="h-9 w-full rounded-md border bg-transparent px-2 text-sm"
                {...register("priceType")}
              >
                <option value="fijo">Fijo</option>
                <option value="variable">Variable (se pide el valor al facturar)</option>
              </select>
            </div>
          )}

          {channel === "productos" && (
            <div className="space-y-1.5">
              <Label htmlFor="unit">Unidad</Label>
              <Input id="unit" placeholder="ej. unidad, galón, caja" {...register("unit")} />
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? "Guardar cambios" : "Crear servicio"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
