import { z } from "zod";

export const parkingRateFormSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio"),
  rateType: z.enum(["hora", "dia", "mes"]),
  amount: z.coerce.number().min(0, "El valor no puede ser negativo"),
});

export type ParkingRateFormValues = z.input<typeof parkingRateFormSchema>;
