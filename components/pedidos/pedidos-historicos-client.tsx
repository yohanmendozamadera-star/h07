"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { OrdersList } from "@/components/pedidos/orders-list";
import { OrdersSummary } from "@/components/pedidos/orders-summary";
import { DateRangeFilter } from "@/components/shared/date-range-filter";
import { ExportButton } from "@/components/shared/export-button";
import type { OrderListItem, TallerFollowUp } from "@/lib/pedidos/types";
import { getToday } from "@/lib/format";
import { useLocale } from "@/lib/locale/locale-context";

function TallerFollowUpsTable({ followUps }: { followUps: TallerFollowUp[] }) {
  const { formatDate, countryCode } = useLocale();
  if (followUps.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Todavía no hay pedidos de Taller finalizados con una próxima visita recomendada.
      </p>
    );
  }

  const today = getToday(countryCode);

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-blue-50 text-left text-xs text-blue-900 dark:bg-blue-950/40 dark:text-blue-100">
          <tr>
            <th className="p-2 font-medium">Placa</th>
            <th className="p-2 font-medium">Cliente</th>
            <th className="p-2 font-medium">Celular</th>
            <th className="p-2 font-medium">Fecha esperada</th>
            <th className="p-2 font-medium">Estado</th>
            <th className="p-2 font-medium">Pedido</th>
          </tr>
        </thead>
        <tbody>
          {followUps.map((item) => {
            const isOverdue = item.nextVisitDate < today;
            return (
              <tr key={item.orderId} className="border-t">
                <td className="p-2 font-medium">{item.plate ?? "—"}</td>
                <td className="p-2">{item.clientName ?? "—"}</td>
                <td className="p-2">{item.clientPhone ?? "—"}</td>
                <td className="p-2">{formatDate(item.nextVisitDate)}</td>
                <td className="p-2">
                  <Badge variant={isOverdue ? "destructive" : "secondary"}>{isOverdue ? "Vencido" : "Próximo"}</Badge>
                </td>
                <td className="p-2 text-muted-foreground">{item.orderNumber}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function PedidosHistoricosClient({
  orders,
  tallerFollowUps,
  defaultFrom,
  defaultTo,
  exportHref,
}: {
  orders: OrderListItem[];
  tallerFollowUps: TallerFollowUp[];
  defaultFrom: string;
  defaultTo: string;
  exportHref: string;
}) {
  const { countryCode } = useLocale();
  return (
    <Tabs defaultValue="todos">
      <TabsList>
        <TabsTrigger value="todos">Todos</TabsTrigger>
        <TabsTrigger value="taller">Seguimiento Taller</TabsTrigger>
      </TabsList>

      <TabsContent value="todos" className="space-y-4 pt-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <DateRangeFilter defaultFrom={defaultFrom} defaultTo={defaultTo} />
          <ExportButton href={exportHref} />
        </div>
        <OrdersSummary orders={orders} countryCode={countryCode} />
        <OrdersList orders={orders} countryCode={countryCode} />
      </TabsContent>

      <TabsContent value="taller" className="space-y-2 pt-3">
        <p className="text-sm text-muted-foreground">
          Clientes de Taller a los que se les recomendó volver, ordenados por la fecha en que se esperaba su regreso —
          útil para llamarlos o escribirles.
        </p>
        <TallerFollowUpsTable followUps={tallerFollowUps} />
      </TabsContent>
    </Tabs>
  );
}
