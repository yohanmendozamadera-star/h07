"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { bannerFormSchema, type BannerFormValues } from "@/lib/validations/panel-plataforma";
import { updateBanner } from "@/app/(platform)/panel-plataforma/actions";
import type { PlatformBanner } from "@/lib/panel-plataforma/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function BannerForm({ banner }: { banner: PlatformBanner | null }) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BannerFormValues>({
    resolver: zodResolver(bannerFormSchema),
    defaultValues: {
      message: banner?.message ?? "",
      imageUrl: banner?.image_url ?? "",
      isActive: banner?.is_active ?? true,
    },
  });

  const isActive = watch("isActive");

  const onSubmit = async (values: BannerFormValues) => {
    const result = await updateBanner(banner?.id ?? null, values);
    if (!result.success) {
      toast.error("No se pudo guardar", { description: result.message });
      return;
    }
    toast.success("Banner actualizado");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Banner de bienvenida</CardTitle>
        <CardDescription>Se muestra en la pantalla pública de inicio, antes de iniciar sesión.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="message">Mensaje *</Label>
            <Input id="message" {...register("message")} />
            {errors.message && <p className="text-sm text-destructive">{errors.message.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="imageUrl">URL de imagen</Label>
            <Input id="imageUrl" {...register("imageUrl")} />
          </div>

          <label className="flex items-center gap-3 rounded-md border p-3">
            <Checkbox checked={isActive} onCheckedChange={(checked) => setValue("isActive", checked)} />
            <span className="text-sm font-medium">Mostrar banner</span>
          </label>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Guardar banner
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
