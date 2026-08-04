"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { purchaseFormSchema, type PurchaseFormValues } from "@/lib/validations/inventario";
import { createPurchase } from "@/app/(app)/inventario/actions";
import type { CatalogItem } from "@/lib/servicios/types";
import type { SharedCatalogRow } from "@/lib/configuraciones/types";
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

export function PurchaseFormDialog({ items, suppliers }: { items: CatalogItem[]; suppliers: SharedCatalogRow[] }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: { catalogItemId: "", supplierId: "", quantity: 1, unitCost: 0, purchaseDate: todayIso() },
  });

  const onOpenChange = (value: boolean) => {
    setOpen(value);
    if (value) reset({ catalogItemId: "", supplierId: "", quantity: 1, unitCost: 0, purchaseDate: todayIso() });
  };

  const onSubmit = async (values: PurchaseFormValues) => {
    setSubmitting(true);
    const result = await createPurchase(values);
    setSubmitting(false);

    if (!result.success) {
      toast.error("No se pudo guardar", { description: result.message });
      return;
    }

    toast.success("Compra registrada");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button className="gap-1.5" />}>
        <Plus className="size-4" />
        Registrar compra
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva compra</DialogTitle>
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
            <Label htmlFor="supplierId">Proveedor</Label>
            <select
              id="supplierId"
              className="h-9 w-full rounded-md border bg-transparent px-2 text-sm"
              {...register("supplierId")}
            >
              <option value="">Sin definir</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="quantity">Cantidad *</Label>
              <Input id="quantity" type="number" min="0" step="0.01" {...register("quantity")} />
              {errors.quantity && <p className="text-sm text-destructive">{errors.quantity.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="unitCost">Costo unitario *</Label>
              <Input id="unitCost" type="number" min="0" step="0.01" {...register("unitCost")} />
              {errors.unitCost && <p className="text-sm text-destructive">{errors.unitCost.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="purchaseDate">Fecha *</Label>
            <Input id="purchaseDate" type="date" {...register("purchaseDate")} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Registrar compra
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
