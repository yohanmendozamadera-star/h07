import { Card, CardContent } from "@/components/ui/card";
import type { OrderListItem } from "@/lib/pedidos/types";
import { paymentMethodLabel } from "@/lib/pedidos/types";
import { formatCurrency } from "@/lib/format";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-3">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}

export function OrdersSummary({ orders }: { orders: OrderListItem[] }) {
  const totalAmount = orders.reduce((sum, o) => sum + o.total_amount, 0);
  const byMethod = new Map<string, number>();
  for (const order of orders) {
    const label = paymentMethodLabel(order.payment_method);
    byMethod.set(label, (byMethod.get(label) ?? 0) + order.total_amount);
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      <Stat label="Total vendido" value={formatCurrency(totalAmount)} />
      <Stat label="Cantidad de pedidos" value={String(orders.length)} />
      <Stat label="Efectivo" value={formatCurrency(byMethod.get("Efectivo") ?? 0)} />
      <Stat label="Transferencia" value={formatCurrency(byMethod.get("Transferencia") ?? 0)} />
      <Stat label="Datáfono" value={formatCurrency(byMethod.get("Datáfono") ?? 0)} />
    </div>
  );
}
