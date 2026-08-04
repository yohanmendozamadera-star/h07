import { z } from "zod";

export const orderItemDraftSchema = z.object({
  catalogItemId: z.string().uuid(),
  channel: z.enum(["lavanderia", "productos", "taller"]),
  description: z.string().trim().min(1),
  quantity: z.coerce.number().min(1, "La cantidad debe ser al menos 1"),
  unitPrice: z.coerce.number().min(0, "El precio no puede ser negativo"),
  priceType: z.enum(["fijo", "variable"]).default("fijo"),
});

// Extensión de Taller: la orden de trabajo. Todos los campos son opcionales
// porque, a diferencia del pedido en sí, el mecánico puede completarlos poco
// a poco (algunos solo se conocen al terminar el servicio).
export const workshopDetailsSchema = z.object({
  brand: z.string().trim().optional(),
  model: z.string().trim().optional(),
  diagnosis: z.string().trim().optional(),
  mileage: z.string().trim().optional(),
  workPerformed: z.string().trim().optional(),
  recommendation: z.string().trim().optional(),
  nextVisitDate: z.string().optional(),
  entryAt: z.string().optional(),
  exitAt: z.string().optional(),
  workOrderStatus: z.enum(["abierta", "en_proceso", "finalizada"]),
});

// El carrito de Toma Pedidos acumula líneas de Lavandería/Productos/Taller
// sin importar en qué pestaña se agregaron; cada línea guarda su propio
// canal y el canal final del pedido se calcula en el servidor (mixto si hay
// más de uno). workshopDetails solo se persiste si hay al menos un item de taller.
export const orderFormSchema = z.object({
  clientId: z.string().uuid().optional().or(z.literal("")),
  clientName: z.string().trim().optional(),
  clientPhone: z.string().trim().optional(),
  plate: z.string().trim().min(1, "La placa es obligatoria"),
  technicianId: z.string().uuid().optional().or(z.literal("")),
  paymentMethod: z.string().min(1, "Selecciona un método de pago"),
  items: z.array(orderItemDraftSchema).min(1, "Agrega al menos un producto o servicio"),
  workshopDetails: workshopDetailsSchema.optional(),
});

export type OrderItemDraft = z.input<typeof orderItemDraftSchema>;
export type OrderFormValues = z.input<typeof orderFormSchema>;
export type WorkshopDetailsValues = z.input<typeof workshopDetailsSchema>;
