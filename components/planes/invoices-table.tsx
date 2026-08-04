import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BoldPayButton } from "@/components/planes/bold-pay-button";
import { computeBoldIntegritySignature, buildBoldOrderId } from "@/lib/bold/signature";
import type { InvoiceRow } from "@/lib/planes/types";
import { formatCurrency, formatDate } from "@/lib/format";

const STATUS_LABELS: Record<InvoiceRow["status"], string> = {
  pending: "Pendiente",
  paid: "Pagada",
  overdue: "Vencida",
  cancelled: "Cancelada",
};

function isPayableNow(invoice: InvoiceRow): boolean {
  return invoice.status === "pending" || invoice.status === "overdue";
}

export function InvoicesTable({ invoices, canPay }: { invoices: InvoiceRow[]; canPay: boolean }) {
  const identityKey = process.env.NEXT_PUBLIC_BOLD_IDENTITY_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://h07.io";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Cartera</CardTitle>
        <CardDescription>Historial de facturas de tu empresa</CardDescription>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay facturas.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="p-2 font-medium">Periodo</th>
                  <th className="p-2 font-medium">Vence</th>
                  <th className="p-2 font-medium">Total</th>
                  <th className="p-2 font-medium">Estado</th>
                  {canPay && <th className="p-2 font-medium" />}
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => {
                  const payable = canPay && Boolean(identityKey) && isPayableNow(invoice);
                  const period = `${invoice.period_month.toString().padStart(2, "0")}/${invoice.period_year}`;

                  return (
                    <tr key={invoice.id} className="border-t">
                      <td className="p-2">{period}</td>
                      <td className="p-2">{formatDate(invoice.due_date)}</td>
                      <td className="p-2">{formatCurrency(invoice.total_amount)}</td>
                      <td className="p-2">
                        <Badge variant={invoice.status === "paid" ? "secondary" : "outline"}>
                          {STATUS_LABELS[invoice.status]}
                        </Badge>
                      </td>
                      {canPay && (
                        <td className="p-2 text-right">
                          {payable && identityKey ? (
                            (() => {
                              const orderId = buildBoldOrderId(invoice.id);
                              return (
                                <BoldPayButton
                                  orderId={orderId}
                                  amount={invoice.total_amount}
                                  currency="COP"
                                  identityKey={identityKey}
                                  integritySignature={computeBoldIntegritySignature(
                                    orderId,
                                    String(invoice.total_amount),
                                    "COP",
                                  )}
                                  description={`Factura H07 ${period}`}
                                  redirectionUrl={`${appUrl}/planes`}
                                />
                              );
                            })()
                          ) : isPayableNow(invoice) ? (
                            <span className="text-xs text-muted-foreground">Contacta a soporte para pagar</span>
                          ) : null}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
