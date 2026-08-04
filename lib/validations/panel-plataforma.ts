import { z } from "zod";

export const bannerFormSchema = z.object({
  message: z.string().trim().min(1, "El mensaje es obligatorio"),
  imageUrl: z.string().trim().optional(),
  isActive: z.boolean(),
});

export type BannerFormValues = z.input<typeof bannerFormSchema>;

export const paymentLinkFormSchema = z.object({
  empresaId: z.string().uuid().optional().or(z.literal("")),
  label: z.string().trim().min(1, "El nombre es obligatorio"),
  url: z.string().trim().min(1, "La URL es obligatoria").url("URL inválida"),
  amount: z.coerce.number().min(0).optional(),
});

export type PaymentLinkFormValues = z.input<typeof paymentLinkFormSchema>;

export const platformSetPlanSchema = z.object({
  empresaId: z.string().uuid(),
  planCode: z.enum(["free", "h7"]),
  addonEnabled: z.boolean(),
});

export type PlatformSetPlanValues = z.input<typeof platformSetPlanSchema>;
