"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { paymentLinkFormSchema, type PaymentLinkFormValues } from "@/lib/validations/panel-plataforma";
import { createPaymentLink, togglePaymentLinkActive } from "@/app/(platform)/panel-plataforma/actions";
import type { PaymentLinkRow, CompanyRow } from "@/lib/panel-plataforma/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

export function PaymentLinksManager({
  links,
  companies,
}: {
  links: PaymentLinkRow[];
  companies: CompanyRow[];
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PaymentLinkFormValues>({
    resolver: zodResolver(paymentLinkFormSchema),
    defaultValues: { empresaId: "", label: "", url: "", amount: undefined },
  });

  const onSubmit = async (values: PaymentLinkFormValues) => {
    const result = await createPaymentLink(values);
    if (!result.success) {
      toast.error("No se pudo guardar", { description: result.message });
      return;
    }
    toast.success("Link creado");
    reset({ empresaId: "", label: "", url: "", amount: undefined });
  };

  const handleToggle = async (link: PaymentLinkRow) => {
    setPendingId(link.id);
    const result = await togglePaymentLinkActive(link.id, !link.is_active);
    setPendingId(null);
    if (!result.success) {
      toast.error("No se pudo actualizar", { description: result.message });
      return;
    }
    toast.success(link.is_active ? "Link desactivado" : "Link activado");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Links de pago</CardTitle>
        <CardDescription>Globales (todas las empresas) o para una empresa específica.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 sm:grid-cols-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="empresaId">Empresa</Label>
            <select
              id="empresaId"
              className="h-9 w-full rounded-md border bg-transparent px-2 text-sm"
              {...register("empresaId")}
            >
              <option value="">Global</option>
              {companies.map((company: CompanyRow) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="label">Nombre *</Label>
            <Input id="label" {...register("label")} />
            {errors.label && <p className="text-sm text-destructive">{errors.label.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="url">URL *</Label>
            <Input id="url" {...register("url")} />
            {errors.url && <p className="text-sm text-destructive">{errors.url.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="amount">Valor</Label>
            <Input id="amount" type="number" min="0" step="0.01" {...register("amount")} />
          </div>
          <div className="sm:col-span-4">
            <Button type="submit" disabled={isSubmitting} className="gap-1.5">
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Agregar link
            </Button>
          </div>
        </form>

        {links.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay links de pago.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="p-2 font-medium">Empresa</th>
                  <th className="p-2 font-medium">Nombre</th>
                  <th className="p-2 font-medium">Valor</th>
                  <th className="p-2 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {links.map((link) => (
                  <tr key={link.id} className="border-t">
                    <td className="p-2">{link.company?.name ?? "Global"}</td>
                    <td className="p-2">
                      <a href={link.url} target="_blank" rel="noreferrer" className="underline">
                        {link.label}
                      </a>
                    </td>
                    <td className="p-2">{link.amount ? formatCurrency(link.amount) : "—"}</td>
                    <td className="p-2">
                      <Button variant="ghost" size="sm" disabled={pendingId === link.id} onClick={() => handleToggle(link)}>
                        <Badge variant={link.is_active ? "secondary" : "outline"}>
                          {link.is_active ? "Activo" : "Inactivo"}
                        </Badge>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
