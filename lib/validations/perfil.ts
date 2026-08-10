import { z } from "zod";

export const updateProfileNameSchema = z.object({
  fullName: z.string().trim().min(1, "El nombre es obligatorio"),
});

export type UpdateProfileNameValues = z.input<typeof updateProfileNameSchema>;
