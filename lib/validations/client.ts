import { z } from "zod";

export const clientFormSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio"),
  phone: z.string().trim().optional(),
  plate: z.string().trim().optional(),
});

export type ClientFormValues = z.input<typeof clientFormSchema>;
export type ClientFormOutput = z.output<typeof clientFormSchema>;
