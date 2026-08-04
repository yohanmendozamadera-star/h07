import { z } from "zod";

export const entradaParqueaderoSchema = z.object({
  plate: z.string().trim().min(1, "La placa es obligatoria"),
  clientId: z.string().uuid().optional().or(z.literal("")),
  parkingRateId: z.string().uuid("Selecciona una tarifa"),
});

export type EntradaParqueaderoValues = z.input<typeof entradaParqueaderoSchema>;

export const salidaParqueaderoSchema = z.object({
  movementId: z.string().uuid(),
  paymentMethod: z.string().min(1, "Selecciona un método de pago"),
});

export type SalidaParqueaderoValues = z.input<typeof salidaParqueaderoSchema>;
