"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Globe } from "lucide-react";
import { countrySelectionSchema, type CountrySelection } from "@/lib/validations/onboarding";
import { updateCompanyCountryAction } from "@/app/(app)/configuraciones/actions";
import { COUNTRIES, COUNTRY_CODES, type CountryCode } from "@/lib/locale/countries";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function CompanyCountryForm({ countryCode }: { countryCode: CountryCode }) {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<CountrySelection>({
    resolver: zodResolver(countrySelectionSchema),
    defaultValues: { countryCode },
  });

  const onSubmit = async (values: CountrySelection) => {
    const result = await updateCompanyCountryAction(values);
    if (!result.success) {
      toast.error("No se pudo guardar", { description: result.message });
      return;
    }
    toast.success("País actualizado");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Globe className="size-5" />
          País de tu negocio
        </CardTitle>
        <CardDescription>Define la moneda y la zona horaria que usa toda la aplicación.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-xs space-y-1.5" noValidate>
          <Label htmlFor="countryCode">País</Label>
          <select
            id="countryCode"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            {...register("countryCode")}
          >
            {COUNTRY_CODES.map((code) => (
              <option key={code} value={code}>
                {COUNTRIES[code].name}
              </option>
            ))}
          </select>
          <Button type="submit" size="sm" disabled={isSubmitting} className="mt-1">
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Guardar
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
