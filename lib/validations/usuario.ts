import { z } from "zod";

export const inviteUsuarioSchema = z.object({
  fullName: z.string().trim().min(1, "El nombre es obligatorio"),
  phone: z.string().trim().min(7, "Celular inválido"),
  email: z.string().trim().min(1, "El correo es obligatorio").email("Correo inválido"),
  roleCode: z.enum(["administrador", "tecnico"]),
});

export type InviteUsuarioValues = z.input<typeof inviteUsuarioSchema>;
export type InviteUsuarioOutput = z.output<typeof inviteUsuarioSchema>;
