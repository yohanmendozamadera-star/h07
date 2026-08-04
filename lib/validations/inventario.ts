import { z } from "zod";

export const purchaseFormSchema = z.object({
  catalogItemId: z.string().uuid("Selecciona un producto"),
  supplierId: z.string().uuid().optional().or(z.literal("")),
  quantity: z.coerce.number().min(0.01, "La cantidad debe ser mayor a 0"),
  unitCost: z.coerce.number().min(0, "El costo no puede ser negativo"),
  purchaseDate: z.string().min(1, "La fecha es obligatoria"),
});

export type PurchaseFormValues = z.input<typeof purchaseFormSchema>;

export const shrinkageFormSchema = z.object({
  catalogItemId: z.string().uuid("Selecciona un producto"),
  quantity: z.coerce.number().min(0.01, "La cantidad debe ser mayor a 0"),
  reason: z.string().trim().optional(),
  shrinkageDate: z.string().min(1, "La fecha es obligatoria"),
});

export type ShrinkageFormValues = z.input<typeof shrinkageFormSchema>;
