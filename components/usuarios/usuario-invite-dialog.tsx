"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { inviteUsuarioSchema, type InviteUsuarioValues } from "@/lib/validations/usuario";
import { inviteUsuarioAction } from "@/app/(app)/usuarios/actions";
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

export function UsuarioInviteDialog() {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteUsuarioValues>({
    resolver: zodResolver(inviteUsuarioSchema),
    defaultValues: { fullName: "", phone: "", email: "", roleCode: "tecnico" },
  });

  const onOpenChange = (value: boolean) => {
    setOpen(value);
    if (value) reset();
  };

  const onSubmit = async (values: InviteUsuarioValues) => {
    setSubmitting(true);
    const result = await inviteUsuarioAction(values);
    setSubmitting(false);

    if (!result.success) {
      toast.error("No se pudo invitar", { description: result.message });
      return;
    }

    toast.success("Invitación enviada", {
      description: "Le llegará un correo para que active su cuenta.",
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button className="gap-1.5" />}>
        <Plus className="size-4" />
        Invitar usuario
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invitar usuario</DialogTitle>
          <DialogDescription>Le enviaremos un correo para que active su cuenta.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Nombre *</Label>
            <Input id="fullName" {...register("fullName")} />
            {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Celular *</Label>
            <Input id="phone" type="tel" {...register("phone")} />
            {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Correo electrónico *</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="roleCode">Rol *</Label>
            <select
              id="roleCode"
              className="h-9 w-full rounded-md border bg-transparent px-2 text-sm"
              {...register("roleCode")}
            >
              <option value="tecnico">Técnico</option>
              <option value="administrador">Administrador</option>
            </select>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Enviar invitación
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
