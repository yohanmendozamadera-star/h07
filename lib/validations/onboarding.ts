import { z } from "zod";

export const moduleSelectionSchema = z.object({
  lavanderiaEnabled: z.boolean(),
  inventarioEnabled: z.boolean(),
  tallerEnabled: z.boolean(),
  parqueaderoEnabled: z.boolean(),
});

export type ModuleSelection = z.infer<typeof moduleSelectionSchema>;

export const catalogItemDraftSchema = z.object({
  channel: z.enum(["lavanderia", "productos", "taller"]),
  name: z.string().min(1, "El nombre es obligatorio"),
  price: z.coerce.number().min(0, "El precio no puede ser negativo"),
  priceType: z.enum(["fijo", "variable"]),
});

export type CatalogItemDraft = z.infer<typeof catalogItemDraftSchema>;

export const parkingRateDraftSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  rateType: z.enum(["hora", "dia", "mes"]),
  amount: z.coerce.number().min(0, "El valor no puede ser negativo"),
});

export type ParkingRateDraft = z.infer<typeof parkingRateDraftSchema>;
