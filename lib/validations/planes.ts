import { z } from "zod";

export const changePlanSchema = z.object({
  planCode: z.enum(["free", "h7"]),
  addonEnabled: z.boolean(),
});

export type ChangePlanValues = z.input<typeof changePlanSchema>;

export const reportPaymentSchema = z.object({
  invoiceId: z.string().uuid("Selecciona una factura"),
  amount: z.coerce.number().min(1, "El monto debe ser mayor a 0"),
});

export type ReportPaymentValues = z.input<typeof reportPaymentSchema>;
