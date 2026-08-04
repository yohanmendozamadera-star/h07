"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus, Pencil } from "lucide-react";
import { clientFormSchema, type ClientFormValues } from "@/lib/validations/client";
import { createClientAction, updateClientAction } from "@/app/(app)/clientes/actions";
import type { ClientRow } from "@/lib/clientes/types";
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

function toFormValues(client?: ClientRow): ClientFormValues {
  return { name: client?.name ?? "", phone: client?.phone ?? "", plate: client?.plate ?? "" };
}

export function ClientFormDialog({ client }: { client?: ClientRow }) {
  const isEdit = Boolean(client);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientFormValues>({ resolver: zodResolver(clientFormSchema), defaultValues: toFormValues(client) });

  const onOpenChange = (value: boolean) => {
    setOpen(value);
    if (value) reset(toFormValues(client));
  };

  const onSubmit = async (values: ClientFormValues) => {
    setSubmitting(true);
    const result = isEdit ? await updateClientAction(client!.id, values) : await createClientAction(values);
    setSubmitting(false);

    if (!result.success) {
      toast.error("No se pudo guardar", { description: result.message });
      return;
    }

    toast.success(isEdit ? "Cliente actualizado" : "Cliente creado");
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
            Agregar cliente
          </>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar cliente" : "Nuevo cliente"}</DialogTitle>
          <DialogDescription>Los campos marcados con * son obligatorios.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre *</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Celular</Label>
            <Input id="phone" type="tel" {...register("phone")} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="plate">Placa</Label>
            <Input id="plate" className="uppercase" {...register("plate")} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? "Guardar cambios" : "Crear cliente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
