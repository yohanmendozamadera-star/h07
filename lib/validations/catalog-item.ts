import { z } from "zod";

export const catalogItemFormSchema = z.object({
  channel: z.enum(["lavanderia", "productos", "taller"]),
  name: z.string().trim().min(1, "El nombre es obligatorio"),
  price: z.coerce.number({ message: "El precio debe ser un número" }).min(0, "El precio no puede ser negativo"),
  priceType: z.enum(["fijo", "variable"]),
  unit: z.string().optional(),
});

export type CatalogItemFormValues = z.input<typeof catalogItemFormSchema>;
export type CatalogItemFormOutput = z.output<typeof catalogItemFormSchema>;
