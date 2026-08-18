"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// El registro público crea una EMPRESA NUEVA con el usuario como Propietario.
// Esto lo hace el trigger fn_handle_new_user en Postgres (atómico con el
// alta en auth.users), a partir de los metadatos pasados aquí. Invitar un
// Técnico/Administrador a una empresa YA existente es un flujo distinto
// (Fase 3, módulo Usuarios), que nunca pasa por esta pantalla.
const registroSchema = z
  .object({
    companyName: z.string().min(1, "El nombre del negocio es obligatorio"),
    fullName: z.string().min(1, "Tu nombre es obligatorio"),
    phone: z.string().min(7, "Celular inválido"),
    email: z.string().min(1, "El correo es obligatorio").email("Correo inválido"),
    password: z.string().min(8, "Mínimo 8 caracteres"),
    confirmPassword: z.string().min(1, "Confirma la contraseña"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type RegistroForm = z.infer<typeof registroSchema>;

export default function RegistroPage() {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistroForm>({ resolver: zodResolver(registroSchema) });

  const onSubmit = async (values: RegistroForm) => {
    setSubmitting(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          company_name: values.companyName,
          full_name: values.fullName,
          phone: values.phone,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
      },
    });
    setSubmitting(false);

    if (error) {
      toast.error("No fue posible crear la cuenta", { description: error.message });
      return;
    }

    // Supabase no devuelve error si el correo ya tiene cuenta (para no revelar
    // qué correos existen) — en vez de eso, el usuario devuelto trae
    // identities vacío y no se envía ningún correo nuevo. Sin este chequeo,
    // la pantalla mostraba "revisa tu correo" aunque nunca se hubiera
    // enviado nada, dejando a la persona esperando un correo que no llega.
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      toast.error("Ya existe una cuenta con este correo", {
        description: "Inicia sesión, o usa \"¿Olvidaste tu contraseña?\" si no la recuerdas.",
      });
      return;
    }

    setSent(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Regístrate gratis</CardTitle>
        <CardDescription>Crea tu negocio en H07 en un minuto.</CardDescription>
      </CardHeader>
      <CardContent>
        {sent ? (
          <p className="text-sm text-muted-foreground">
            Te enviamos un correo de confirmación. Ábrelo para activar tu cuenta y continuar con la
            configuración inicial de tu negocio.
          </p>
        ) : (
          <div className="space-y-4">
            <GoogleSignInButton next="/onboarding" />

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">o regístrate con tu correo</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="companyName">Nombre del negocio</Label>
              <Input id="companyName" autoComplete="organization" {...register("companyName")} />
              {errors.companyName && (
                <p className="text-sm text-destructive">{errors.companyName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Tu nombre</Label>
              <Input id="fullName" autoComplete="name" {...register("fullName")} />
              {errors.fullName && (
                <p className="text-sm text-destructive">{errors.fullName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Celular</Label>
              <Input id="phone" type="tel" autoComplete="tel" {...register("phone")} />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input id="email" type="email" autoComplete="email" {...register("email")} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <PasswordInput id="password" autoComplete="new-password" {...register("password")} />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <PasswordInput id="confirmPassword" autoComplete="new-password" {...register("confirmPassword")} />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Crear mi cuenta
            </Button>

            <a href="/login" className="block text-center text-sm text-muted-foreground hover:underline">
              ¿Ya tienes cuenta? Inicia sesión
            </a>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
