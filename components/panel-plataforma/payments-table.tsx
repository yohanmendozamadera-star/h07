"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, X, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { approvePayment, rejectPayment } from "@/app/(platform)/panel-plataforma/actions";
import type { PlatformPaymentRow } from "@/lib/panel-plataforma/types";
import { formatCurrency, formatDateTime } from "@/lib/format";

const STATUS_LABELS: Record<PlatformPaymentRow["status"], string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
};

export function PaymentsTable({ payments }: { payments: PlatformPaymentRow[] }) {
  const [pendingId, setPendingId] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    setPendingId(id);
    const result = await approvePayment(id);
    setPendingId(null);
    if (!result.success) {
      toast.error("No se pudo aprobar", { description: result.message });
      return;
    }
    toast.success("Pago aprobado");
  };

  const handleReject = async (id: string) => {
    setPendingId(id);
    const result = await rejectPayment(id);
    setPendingId(null);
    if (!result.success) {
      toast.error("No se pudo rechazar", { description: result.message });
      return;
    }
    toast.success("Pago rechazado");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Pagos</CardTitle>
        <CardDescription>Pagos reportados por todas las empresas</CardDescription>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay pagos reportados.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="p-2 font-medium">Empresa</th>
                  <th className="p-2 font-medium">Monto</th>
                  <th className="p-2 font-medium">Reportado</th>
                  <th className="p-2 font-medium">Estado</th>
                  <th className="p-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-t">
                    <td className="p-2">{payment.company?.name ?? "—"}</td>
                    <td className="p-2">{formatCurrency(payment.amount)}</td>
                    <td className="p-2">{formatDateTime(payment.reported_at)}</td>
                    <td className="p-2">
                      <Badge variant={payment.status === "approved" ? "secondary" : "outline"}>
                        {STATUS_LABELS[payment.status]}
                      </Badge>
                    </td>
                    <td className="p-2 text-right">
                      {payment.status === "pending" && (
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="outline"
                            size="icon-sm"
                            disabled={pendingId === payment.id}
                            onClick={() => handleApprove(payment.id)}
                            aria-label="Aprobar"
                          >
                            {pendingId === payment.id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Check className="size-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="icon-sm"
                            disabled={pendingId === payment.id}
                            onClick={() => handleReject(payment.id)}
                            aria-label="Rechazar"
                          >
                            <X className="size-4" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
