export type OrderChannel = "lavanderia" | "productos" | "taller" | "parqueadero" | "mixto";
export type PedidoItemChannel = "lavanderia" | "productos" | "taller";

export type OrderListItem = {
  id: string;
  order_number: string;
  client_name: string | null;
  plate: string | null;
  payment_method: string | null;
  total_amount: number;
  status: string;
  created_at: string;
};

export const PAYMENT_METHODS = ["Efectivo", "Transferencia", "Tarjeta"] as const;

// Para gestión comercial de Taller: pedidos finalizados con una fecha de
// próxima visita recomendada (order_workshop_details.next_visit_date).
export type TallerFollowUp = {
  orderId: string;
  orderNumber: string;
  plate: string | null;
  clientName: string | null;
  clientPhone: string | null;
  nextVisitDate: string;
  createdAt: string;
};
