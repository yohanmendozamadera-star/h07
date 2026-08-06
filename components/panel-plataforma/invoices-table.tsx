import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PlatformInvoiceRow } from "@/lib/panel-plataforma/types";
import { formatCurrency, formatDate } from "@/lib/format";

const STATUS_LABELS: Record<PlatformInvoiceRow["status"], string> = {
  pending: "Pendiente",
  paid: "Pagada",
  overdue: "Vencida",
  cancelled: "Cancelada",
};

export function InvoicesTable({ invoices }: { invoices: PlatformInvoiceRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Cartera consolidada</CardTitle>
        <CardDescription>Cobros de todas las empresas</CardDescription>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay cobros.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="p-2 font-medium">Empresa</th>
                  <th className="p-2 font-medium">Periodo</th>
                  <th className="p-2 font-medium">Vence</th>
                  <th className="p-2 font-medium">Total</th>
                  <th className="p-2 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-t">
                    <td className="p-2">{invoice.company?.name ?? "—"}</td>
                    <td className="p-2">
                      {invoice.period_month.toString().padStart(2, "0")}/{invoice.period_year}
                    </td>
                    <td className="p-2">{formatDate(invoice.due_date)}</td>
                    <td className="p-2">{formatCurrency(invoice.total_amount)}</td>
                    <td className="p-2">
                      <Badge variant={invoice.status === "paid" ? "secondary" : "outline"}>
                        {STATUS_LABELS[invoice.status]}
                      </Badge>
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
