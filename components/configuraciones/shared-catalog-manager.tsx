"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { sharedCatalogNameSchema, type SharedCatalogNameValues } from "@/lib/validations/configuraciones";
import type { SharedCatalogRow } from "@/lib/configuraciones/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ActionResult = { success: true } | { success: false; message: string };

export function SharedCatalogManager({
  title,
  description,
  items,
  onCreate,
  onToggle,
}: {
  title: string;
  description: string;
  items: SharedCatalogRow[];
  onCreate: (input: unknown) => Promise<ActionResult>;
  onToggle: (id: string, isActive: boolean) => Promise<ActionResult>;
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SharedCatalogNameValues>({ resolver: zodResolver(sharedCatalogNameSchema), defaultValues: { name: "" } });

  const onSubmit = async (values: SharedCatalogNameValues) => {
    const result = await onCreate(values);
    if (!result.success) {
      toast.error("No se pudo guardar", { description: result.message });
      return;
    }
    toast.success("Agregado");
    reset();
  };

  const handleToggle = async (item: SharedCatalogRow) => {
    setPendingId(item.id);
    const result = await onToggle(item.id, !item.is_active);
    setPendingId(null);
    if (!result.success) {
      toast.error("No se pudo actualizar", { description: result.message });
      return;
    }
    toast.success(item.is_active ? "Desactivado" : "Activado");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2" noValidate>
          <div className="flex-1">
            <Input placeholder="Nombre" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <Button type="submit" disabled={isSubmitting} className="gap-1.5">
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Agregar
          </Button>
        </form>

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay elementos.</p>
        ) : (
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                <span>{item.name}</span>
                <Button variant="ghost" size="sm" disabled={pendingId === item.id} onClick={() => handleToggle(item)}>
                  <Badge variant={item.is_active ? "secondary" : "outline"}>
                    {item.is_active ? "Activo" : "Inactivo"}
                  </Badge>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
