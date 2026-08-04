import { z } from "zod";

export const expenseFormSchema = z.object({
  type: z.enum(["fijo", "variable"]),
  categoryId: z.string().uuid().optional().or(z.literal("")),
  supplierId: z.string().uuid().optional().or(z.literal("")),
  amount: z.coerce.number().min(0.01, "El monto debe ser mayor a 0"),
  expenseDate: z.string().min(1, "La fecha es obligatoria"),
  description: z.string().trim().optional(),
});

export type ExpenseFormValues = z.input<typeof expenseFormSchema>;
