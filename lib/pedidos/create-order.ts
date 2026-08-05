import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, can } from "@/lib/permissions";
import { orderFormSchema } from "@/lib/validations/order";
import { getOrderLockStatus } from "@/lib/pedidos/order-lock";

export type CreateOrderResult =
  | { success: true; orderId: string; orderNumber: string }
  | { success: false; message: string };

// Toma Pedidos usa un solo carrito para Lavandería/Productos/Taller: cada
// línea trae su propio canal y el canal del pedido se deriva aquí (el
// mismo si todas las líneas comparten canal, "mixto" si no). Si el carrito
// incluye al menos un item de taller, workshopDetails se persiste con él;
// si no, se ignora aunque venga en el payload.
export async function createOrderShared(input: unknown): Promise<CreateOrderResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.permissions, "pedidos.create")) {
    return { success: false, message: "No tienes permiso para crear pedidos." };
  }

  const lockStatus = await getOrderLockStatus(user.empresaId);
  if (lockStatus.blocked) {
    return {
      success: false,
      message: "Toma Pedidos está bloqueado por falta de pago. Ponte al día en Planes para volver a crear pedidos.",
    };
  }

  const parsed = orderFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();

  const distinctChannels = Array.from(new Set(parsed.data.items.map((item) => item.channel)));
  const orderChannel = distinctChannels.length === 1 ? distinctChannels[0] : "mixto";

  // El número de pedido no depende de company_settings (generate_order_number
  // deriva empresa_id de la sesión internamente) — se piden en paralelo para
  // no sumar sus latencias una tras otra.
  const [settingsResult, orderNumberResult] = await Promise.all([
    supabase.from("company_settings").select("require_technician_on_invoice").eq("empresa_id", user.empresaId).single(),
    supabase.rpc("generate_order_number", { p_channel: orderChannel }),
  ]);

  if (settingsResult.data?.require_technician_on_invoice && !parsed.data.technicianId) {
    return { success: false, message: "Selecciona el técnico que atendió este pedido." };
  }

  const { data: orderNumber, error: seqError } = orderNumberResult;
  if (seqError || !orderNumber) {
    return { success: false, message: seqError?.message ?? "No fue posible generar el número de pedido." };
  }

  // El subtotal y el total SIEMPRE se calculan aquí, nunca se confía en un
  // total calculado por el navegador.
  const items = parsed.data.items.map((item) => ({
    ...item,
    subtotal: item.quantity * item.unitPrice,
  }));
  const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      empresa_id: user.empresaId,
      channel: orderChannel,
      order_number: orderNumber,
      client_id: parsed.data.clientId || null,
      client_name: parsed.data.clientName || null,
      client_phone: parsed.data.clientPhone || null,
      plate: parsed.data.plate || null,
      technician_id: parsed.data.technicianId || null,
      payment_method: parsed.data.paymentMethod,
      total_amount: totalAmount,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return { success: false, message: orderError?.message ?? "No fue posible crear el pedido." };
  }

  // order_items y order_workshop_details son independientes entre sí (ambos
  // solo dependen de order.id, no uno del otro) — se guardan en paralelo.
  const wd = parsed.data.workshopDetails;
  const shouldSaveWorkshopDetails = distinctChannels.includes("taller") && Boolean(wd);

  const [itemsResult, workshopResult] = await Promise.all([
    supabase.from("order_items").insert(
      items.map((item) => ({
        empresa_id: user.empresaId,
        order_id: order.id,
        catalog_item_id: item.catalogItemId,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        // El legado perdía este flag antes de guardar; aquí se persiste siempre.
        price_type: item.priceType,
        subtotal: item.subtotal,
        channel: item.channel,
      })),
    ),
    shouldSaveWorkshopDetails && wd
      ? supabase.from("order_workshop_details").insert({
          order_id: order.id,
          empresa_id: user.empresaId,
          brand: wd.brand || null,
          model: wd.model || null,
          diagnosis: wd.diagnosis || null,
          mileage: wd.mileage || null,
          work_performed: wd.workPerformed || null,
          recommendation: wd.recommendation || null,
          next_visit_date: wd.nextVisitDate || null,
          entry_at: wd.entryAt || null,
          exit_at: wd.exitAt || null,
          work_order_status: wd.workOrderStatus,
        })
      : Promise.resolve({ error: null }),
  ]);

  if (itemsResult.error) {
    return {
      success: false,
      message: `El pedido ${orderNumber} se creó pero hubo un error guardando sus líneas: ${itemsResult.error.message}. Contacta soporte.`,
    };
  }

  if (workshopResult.error) {
    return {
      success: false,
      message: `El pedido ${orderNumber} se creó pero hubo un error guardando la orden de trabajo: ${workshopResult.error.message}.`,
    };
  }

  return { success: true, orderId: order.id, orderNumber };
}
