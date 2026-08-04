import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { OrderListItem, TallerFollowUp } from "@/lib/pedidos/types";

// Ventana de "recientes" en Toma Pedidos: pasadas estas horas, el pedido deja
// de listarse ahí (pero sigue apareciendo en /pedidos-historicos, que
// muestra el registro completo desde siempre, no solo los viejos).
const RECENT_HOURS = 3;

const PEDIDO_CHANNELS = ["lavanderia", "productos", "taller", "mixto"] as const;

function recentCutoffIso() {
  return new Date(Date.now() - RECENT_HOURS * 60 * 60 * 1000).toISOString();
}

// Toma Pedidos ya no tiene una página por canal: muestra el histórico de
// Lavandería/Productos/Taller/Mixto junto (Parqueadero tiene su propia
// pestaña con su propio historial de movimientos, no pedidos de este tipo).
// Solo se listan los de las últimas RECENT_HOURS horas — pasado ese tiempo
// desaparecen de aquí (aunque siguen visibles en /pedidos-historicos).
export const getRecentPedidos = cache(async (): Promise<OrderListItem[]> => {
  const supabase = await createClient();

  const { data } = await supabase
    .from("orders")
    .select("id, order_number, client_name, plate, payment_method, total_amount, status, created_at")
    .in("channel", PEDIDO_CHANNELS)
    .is("deleted_at", null)
    .gte("created_at", recentCutoffIso())
    .order("created_at", { ascending: false })
    .limit(50);

  return data ?? [];
});

// Histórico completo: TODOS los pedidos, sin importar su antigüedad. La
// página que llama a esta función ya bloquea el acceso completo si la
// empresa no tiene un plan pago activo (ver app/(app)/pedidos-historicos),
// así que aquí no hay ningún recorte adicional por plan.
export const getPedidosHistoricos = cache(async (): Promise<OrderListItem[]> => {
  const supabase = await createClient();

  const { data } = await supabase
    .from("orders")
    .select("id, order_number, client_name, plate, payment_method, total_amount, status, created_at")
    .in("channel", PEDIDO_CHANNELS)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(200);

  return data ?? [];
});

type WorkshopFollowUpRow = {
  order_id: string;
  next_visit_date: string;
  order: {
    order_number: string;
    plate: string | null;
    client_name: string | null;
    client_phone: string | null;
    created_at: string;
  } | null;
};

// Para gestión comercial: pedidos de Taller ya finalizados con una fecha de
// próxima visita recomendada, ordenados por esa fecha (los que ya deberían
// haber vuelto o están más próximos a hacerlo, primero).
export const getTallerFollowUps = cache(async (): Promise<TallerFollowUp[]> => {
  const supabase = await createClient();

  const { data } = await supabase
    .from("order_workshop_details")
    .select("order_id, next_visit_date, order:orders(order_number, plate, client_name, client_phone, created_at)")
    .not("next_visit_date", "is", null)
    .eq("work_order_status", "finalizada")
    .order("next_visit_date", { ascending: true })
    .returns<WorkshopFollowUpRow[]>();

  return (data ?? [])
    .filter((row): row is WorkshopFollowUpRow & { order: NonNullable<WorkshopFollowUpRow["order"]> } =>
      Boolean(row.order),
    )
    .map((row) => ({
      orderId: row.order_id,
      orderNumber: row.order.order_number,
      plate: row.order.plate,
      clientName: row.order.client_name,
      clientPhone: row.order.client_phone,
      nextVisitDate: row.next_visit_date,
      createdAt: row.order.created_at,
    }));
});
