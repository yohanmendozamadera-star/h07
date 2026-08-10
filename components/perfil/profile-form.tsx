"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Camera } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { updateProfileNameAction, updateProfileAvatarAction } from "@/app/(app)/mi-perfil/actions";
import { updateProfileNameSchema, type UpdateProfileNameValues } from "@/lib/validations/perfil";
import type { ProfileDetails } from "@/lib/perfil/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function AvatarUploader({ profile }: { profile: ProfileDetails }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("La imagen debe pesar menos de 2 MB");
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const extension = file.name.split(".").pop() ?? "jpg";
    const path = `${profile.id}/avatar.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, cacheControl: "3600" });

    if (uploadError) {
      setUploading(false);
      toast.error("No se pudo subir la foto", { description: uploadError.message });
      return;
    }

    const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`;

    const result = await updateProfileAvatarAction(publicUrl);
    setUploading(false);

    if (!result.success) {
      toast.error("No se pudo guardar la foto", { description: result.message });
      return;
    }

    setAvatarUrl(publicUrl);
    toast.success("Foto de perfil actualizada");
    router.refresh();
  };

  return (
    <div className="flex items-center gap-4">
      <Avatar size="lg" className="size-16">
        {avatarUrl && <AvatarImage src={avatarUrl} alt={profile.full_name} />}
        <AvatarFallback className="text-lg">{initials(profile.full_name) || "U"}</AvatarFallback>
      </Avatar>
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <Camera className="size-3.5" />}
          Cambiar foto
        </Button>
        <p className="mt-1 text-xs text-muted-foreground">JPG o PNG, máximo 2 MB.</p>
      </div>
    </div>
  );
}

function NameForm({ profile }: { profile: ProfileDetails }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProfileNameValues>({
    resolver: zodResolver(updateProfileNameSchema),
    defaultValues: { fullName: profile.full_name },
  });

  const onSubmit = async (values: UpdateProfileNameValues) => {
    const result = await updateProfileNameAction(values);
    if (!result.success) {
      toast.error("No se pudo guardar", { description: result.message });
      return;
    }
    toast.success("Nombre actualizado");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="fullName">Nombre completo</Label>
        <Input id="fullName" {...register("fullName")} />
        {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input id="email" value={profile.email} disabled />
        <p className="text-xs text-muted-foreground">El correo no se puede cambiar desde aquí.</p>
      </div>
      <Button type="submit" size="sm" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="size-4 animate-spin" />}
        Guardar cambios
      </Button>
    </form>
  );
}

const updatePasswordSchema = z
  .object({
    password: z.string().min(8, "Mínimo 8 caracteres"),
    confirmPassword: z.string().min(1, "Confirma la contraseña"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type UpdatePasswordForm = z.infer<typeof updatePasswordSchema>;

function PasswordForm() {
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdatePasswordForm>({ resolver: zodResolver(updatePasswordSchema) });

  const onSubmit = async ({ password }: UpdatePasswordForm) => {
    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (error) {
      toast.error("No fue posible actualizar la contraseña", { description: error.message });
      return;
    }

    toast.success("Contraseña actualizada");
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="password">Nueva contraseña</Label>
        <PasswordInput id="password" autoComplete="new-password" {...register("password")} />
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
        <PasswordInput id="confirmPassword" autoComplete="new-password" {...register("confirmPassword")} />
        {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
      </div>
      <Button type="submit" size="sm" disabled={submitting}>
        {submitting && <Loader2 className="size-4 animate-spin" />}
        Actualizar contraseña
      </Button>
    </form>
  );
}

export function ProfileForm({ profile }: { profile: ProfileDetails }) {
  return (
    <div className="max-w-lg space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Perfil</CardTitle>
          <CardDescription>Tu foto y datos de cuenta.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <AvatarUploader profile={profile} />
          <NameForm profile={profile} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contraseña</CardTitle>
          <CardDescription>Cambia la contraseña de tu cuenta.</CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
