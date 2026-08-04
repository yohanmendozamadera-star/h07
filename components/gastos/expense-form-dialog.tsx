"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus, Pencil } from "lucide-react";
import { expenseFormSchema, type ExpenseFormValues } from "@/lib/validations/expense";
import { createExpense, updateExpense } from "@/app/(app)/gastos/actions";
import type { ExpenseRow } from "@/lib/gastos/types";
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

function toFormValues(expense?: ExpenseRow): ExpenseFormValues {
  return {
    type: expense?.type ?? "variable",
    categoryId: expense?.category_id ?? "",
    supplierId: expense?.supplier_id ?? "",
    amount: expense?.amount ?? 0,
    expenseDate: expense?.expense_date ?? todayIso(),
    description: expense?.description ?? "",
  };
}

export function ExpenseFormDialog({
  categories,
  suppliers,
  expense,
}: {
  categories: SharedCatalogRow[];
  suppliers: SharedCatalogRow[];
  expense?: ExpenseRow;
}) {
  const isEdit = Boolean(expense);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormValues>({ resolver: zodResolver(expenseFormSchema), defaultValues: toFormValues(expense) });

  const onOpenChange = (value: boolean) => {
    setOpen(value);
    if (value) reset(toFormValues(expense));
  };

  const onSubmit = async (values: ExpenseFormValues) => {
    setSubmitting(true);
    const result = isEdit ? await updateExpense(expense!.id, values) : await createExpense(values);
    setSubmitting(false);

    if (!result.success) {
      toast.error("No se pudo guardar", { description: result.message });
      return;
    }

    toast.success(isEdit ? "Gasto actualizado" : "Gasto registrado");
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
            Registrar gasto
          </>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar gasto" : "Nuevo gasto"}</DialogTitle>
          <DialogDescription>Los campos marcados con * son obligatorios.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="type">Tipo *</Label>
            <select
              id="type"
              className="h-9 w-full rounded-md border bg-transparent px-2 text-sm"
              {...register("type")}
            >
              <option value="fijo">Costo fijo</option>
              <option value="variable">Costo variable</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="categoryId">Categoría</Label>
            <select
              id="categoryId"
              className="h-9 w-full rounded-md border bg-transparent px-2 text-sm"
              {...register("categoryId")}
            >
              <option value="">Sin definir</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
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
              <Label htmlFor="amount">Monto *</Label>
              <Input id="amount" type="number" min="0" step="0.01" {...register("amount")} />
              {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expenseDate">Fecha *</Label>
              <Input id="expenseDate" type="date" {...register("expenseDate")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Concepto</Label>
            <Input id="description" {...register("description")} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? "Guardar cambios" : "Registrar gasto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
