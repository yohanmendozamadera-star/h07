import { z } from "zod";

export const monthlyGoalFormSchema = z.object({
  fixedCost: z.coerce.number().min(0, "El costo fijo no puede ser negativo"),
  marginPercent: z.coerce.number().min(0, "El margen no puede ser negativo").max(100, "El margen no puede ser mayor a 100"),
  goalAmount: z.coerce.number().min(0, "La meta no puede ser negativa"),
});

export type MonthlyGoalFormValues = z.input<typeof monthlyGoalFormSchema>;
