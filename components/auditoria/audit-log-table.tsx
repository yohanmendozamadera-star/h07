"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { AuditAction, AuditLogRow } from "@/lib/audit/types";
import { ACTION_LABELS, MODULE_LABELS, buildDiffRows } from "@/lib/audit/labels";
import { formatDateTime } from "@/lib/format";

const ACTION_VARIANTS: Record<AuditAction, "success" | "outline" | "destructive"> = {
  create: "success",
  update: "outline",
  delete: "destructive",
  login: "outline",
  approve: "success",
  reject: "destructive",
};

export function AuditLogTable({ logs }: { logs: AuditLogRow[] }) {
  const [selected, setSelected] = useState<AuditLogRow | null>(null);
  const diffRows = selected ? buildDiffRows(selected.old_data, selected.new_data) : [];

  if (logs.length === 0) {
    return <p className="text-sm text-muted-foreground">Todavía no hay registros de auditoría en este rango de fechas.</p>;
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
          <div className="max-h-96 overflow-y-auto">
            {diffRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin cambios de campos para mostrar.</p>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-blue-50 text-left text-xs text-blue-900 dark:bg-blue-950/40 dark:text-blue-100">
                    <tr>
                      <th className="p-2 font-medium">Campo</th>
                      <th className="p-2 font-medium">Antes</th>
                      <th className="p-2 font-medium">Después</th>
                    </tr>
                  </thead>
                  <tbody>
                    {diffRows.map((row) => (
                      <tr key={row.field} className="border-t align-top">
                        <td className="p-2 font-medium">{row.field}</td>
                        <td className="p-2 break-all text-muted-foreground">{row.before}</td>
                        <td className="p-2 break-all">{row.after}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
