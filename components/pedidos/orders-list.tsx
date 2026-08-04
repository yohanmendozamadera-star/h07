import { Badge } from "@/components/ui/badge";
import type { OrderListItem } from "@/lib/pedidos/types";
import { formatCurrency, formatDateTime } from "@/lib/format";

export function OrdersList({ orders }: { orders: OrderListItem[] }) {
  if (orders.length === 0) {
    return <p className="text-sm text-muted-foreground">Todavía no hay pedidos en este canal.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
          <tr>
            <th className="p-2 font-medium">Número</th>
            <th className="p-2 font-medium">Cliente</th>
            <th className="p-2 font-medium">Placa</th>
            <th className="p-2 font-medium">Pago</th>
            <th className="p-2 font-medium">Total</th>
            <th className="p-2 font-medium">Fecha</th>
            <th className="p-2 font-medium">Estado</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-t">
              <td className="p-2">{order.order_number}</td>
              <td className="p-2">{order.client_name ?? "—"}</td>
              <td className="p-2">{order.plate ?? "—"}</td>
              <td className="p-2">{order.payment_method ?? "—"}</td>
              <td className="p-2">{formatCurrency(order.total_amount)}</td>
              <td className="p-2">{formatDateTime(order.created_at)}</td>
              <td className="p-2">
                <Badge variant={order.status === "completado" ? "secondary" : "outline"}>{order.status}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
