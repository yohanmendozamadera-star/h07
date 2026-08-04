"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, MessageCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { updatePlatformConfig } from "@/app/(platform)/panel-plataforma/actions";
import type { PlatformConfig } from "@/lib/panel-plataforma/types";

export function WhatsappConfigForm({ config }: { config: PlatformConfig }) {
  const [enabled, setEnabled] = useState(config.whatsapp_notifications_enabled);
  const [saving, setSaving] = useState(false);

  const handleChange = async (checked: boolean) => {
    setEnabled(checked);
    setSaving(true);
    const result = await updatePlatformConfig({ whatsappNotificationsEnabled: checked });
    setSaving(false);
    if (!result.success) {
      setEnabled(!checked);
      toast.error("No se pudo guardar", { description: result.message });
      return;
    }
    toast.success(checked ? "Notificaciones activadas" : "Notificaciones desactivadas");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageCircle className="size-5" />
          Notificaciones automáticas por WhatsApp
        </CardTitle>
        <CardDescription>
          Beneficio del plan Premium (recordatorios de próxima visita de Taller). El envío real todavía no
          está conectado a ningún proveedor de WhatsApp Business API — este interruptor queda listo para
          cuando se configure, así activarlo en el futuro no requiere un nuevo despliegue.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <label className="flex items-center gap-3 rounded-md border p-3">
          <Checkbox checked={enabled} onCheckedChange={(checked) => handleChange(Boolean(checked))} disabled={saving} />
          <span className="text-sm font-medium">Activar notificaciones automáticas por WhatsApp</span>
          {saving && <Loader2 className="size-4 animate-spin" />}
        </label>
        <p className="mt-2 text-xs text-muted-foreground">
          No actives esto todavía: no tiene ningún efecto hasta que se conecte un proveedor real de WhatsApp
          Business API y se construya el envío. Queda aquí solo como el interruptor maestro para ese momento.
        </p>
      </CardContent>
    </Card>
  );
}
