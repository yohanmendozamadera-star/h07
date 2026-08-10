import { z } from "zod";

export const fixedCostFormSchema = z.object({
  amount: z.coerce.number().min(0, "Debe ser un número positivo"),
});

export type FixedCostFormValues = z.input<typeof fixedCostFormSchema>;
