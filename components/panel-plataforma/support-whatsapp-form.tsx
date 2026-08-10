"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Phone } from "lucide-react";
import { supportWhatsappSchema, type SupportWhatsappValues } from "@/lib/validations/panel-plataforma";
import { updateSupportWhatsappAction } from "@/app/(platform)/panel-plataforma/actions";
import type { PlatformConfig } from "@/lib/panel-plataforma/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SupportWhatsappForm({ config }: { config: PlatformConfig }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SupportWhatsappValues>({
    resolver: zodResolver(supportWhatsappSchema),
    defaultValues: { phoneNumber: config.support_whatsapp_number ?? "" },
  });

  const onSubmit = async (values: SupportWhatsappValues) => {
    const result = await updateSupportWhatsappAction(values);
    if (!result.success) {
      toast.error("No se pudo guardar", { description: result.message });
      return;
    }
    toast.success("Número de soporte actualizado");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Phone className="size-5" />
          Número de WhatsApp de soporte
        </CardTitle>
        <CardDescription>
          Este es el número al que llegan los dueños de negocio cuando dan clic en &quot;Soporte&quot; desde
          Configuración, en toda la plataforma.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-xs space-y-1.5" noValidate>
          <Label htmlFor="phoneNumber">Número (indicativo de país + número, sin espacios ni símbolos)</Label>
          <Input id="phoneNumber" placeholder="573001234567" {...register("phoneNumber")} />
          <p className="text-xs text-muted-foreground">
            Ejemplo: si tu número de soporte en Colombia es 300 123 4567, escribe <strong>573001234567</strong> (57
            = indicativo de Colombia, sin el 0 ni el +).
          </p>
          {errors.phoneNumber && <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>}
          <Button type="submit" size="sm" disabled={isSubmitting} className="mt-1">
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Guardar
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
