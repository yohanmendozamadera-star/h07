"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { AuditAction, AuditLogRow } from "@/lib/audit/types";
import { formatDateTime } from "@/lib/format";

const ACTION_LABELS: Record<AuditAction, string> = {
  create: "Creó",
  update: "Actualizó",
  delete: "Eliminó",
  login: "Inició sesión",
  approve: "Aprobó",
  reject: "Rechazó",
};

const ACTION_VARIANTS: Record<AuditAction, "secondary" | "outline" | "destructive"> = {
  create: "secondary",
  update: "outline",
  delete: "destructive",
  login: "outline",
  approve: "secondary",
  reject: "destructive",
};

const MODULE_LABELS: Record<string, string> = {
  clients: "Clientes",
  catalog_items: "Servicios/Productos",
  parking_rates: "Tarifas de parqueadero",
  orders: "Pedidos",
  order_items: "Líneas de pedido",
  parking_movements: "Movimientos de parqueadero",
  purchases: "Compras",
  shrinkages: "Mermas",
  expenses: "Gastos",
  company_subscriptions: "Suscripción",
  invoices: "Facturas",
  payments: "Pagos",
  payment_links: "Links de pago",
};

export function AuditLogTable({ logs }: { logs: AuditLogRow[] }) {
  const [selected, setSelected] = useState<AuditLogRow | null>(null);

  if (logs.length === 0) {
    return <p className="text-sm text-muted-foreground">Todavía no hay registros de auditoría.</p>;
  }

  return (
    <>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-blue-50 text-left text-xs text-blue-900 dark:bg-blue-950/40 dark:text-blue-100">
            <tr>
              <th className="p-2 font-medium">Fecha</th>
              <th className="p-2 font-medium">Usuario</th>
              <th className="p-2 font-medium">Acción</th>
              <th className="p-2 font-medium">Módulo</th>
              <th className="p-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t">
                <td className="p-2">{formatDateTime(log.created_at)}</td>
                <td className="p-2">{log.userName ?? "Sistema"}</td>
                <td className="p-2">
                  <Badge variant={ACTION_VARIANTS[log.action]}>{ACTION_LABELS[log.action]}</Badge>
                </td>
                <td className="p-2">{MODULE_LABELS[log.module] ?? log.module}</td>
                <td className="p-2 text-right">
                  {(log.old_data || log.new_data) && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setSelected(log)}>
                      Ver detalles
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selected && ACTION_LABELS[selected.action]} — {selected && (MODULE_LABELS[selected.module] ?? selected.module)}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-96 space-y-3 overflow-y-auto text-xs">
            {selected?.old_data && (
              <div>
                <p className="mb-1 font-medium text-muted-foreground">Antes</p>
                <pre className="overflow-x-auto rounded-md bg-muted p-2">{JSON.stringify(selected.old_data, null, 2)}</pre>
              </div>
            )}
            {selected?.new_data && (
              <div>
                <p className="mb-1 font-medium text-muted-foreground">Después</p>
                <pre className="overflow-x-auto rounded-md bg-muted p-2">{JSON.stringify(selected.new_data, null, 2)}</pre>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
