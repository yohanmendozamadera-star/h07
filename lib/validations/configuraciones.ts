import { z } from "zod";

export const companySettingsFormSchema = z
  .object({
    lavanderiaEnabled: z.boolean(),
    inventarioEnabled: z.boolean(),
    tallerEnabled: z.boolean(),
    parqueaderoEnabled: z.boolean(),
    requireTechnicianOnInvoice: z.boolean(),
    showNumericKeypad: z.boolean(),
    parkingGraceMinutes: z.coerce.number().min(0).max(1440),
    commissionEnabled: z.boolean(),
    commissionTechnicianPercent: z.coerce.number().min(0).max(100).nullable(),
    parqueaderoPrinterIp: z.string().trim().optional(),
  })
  .refine((data) => !data.commissionEnabled || data.commissionTechnicianPercent !== null, {
    message: "Indica el % de comisión del técnico",
    path: ["commissionTechnicianPercent"],
  });

export type CompanySettingsFormValues = z.input<typeof companySettingsFormSchema>;

export const sharedCatalogNameSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio"),
});

export type SharedCatalogNameValues = z.input<typeof sharedCatalogNameSchema>;
