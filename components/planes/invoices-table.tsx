import Link from "next/link";
import { Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BoldPayButton } from "@/components/planes/bold-pay-button";
import { computeBoldIntegritySignature, buildBoldOrderId, sanitizeBoldDescription } from "@/lib/bold/signature";
import type { InvoiceRow } from "@/lib/planes/types";
import { formatCurrency, formatDate } from "@/lib/format";

function periodRange(dueDate: string): { start: string; end: string } {
  const end = new Date(dueDate);
  end.setMonth(end.getMonth() + 1);
  end.setDate(end.getDate() - 1);
  return { start: dueDate, end: end.toISOString().slice(0, 10) };
}

const STATUS_LABELS: Record<InvoiceRow["status"], string> = {
  pending: "Pendiente",
  paid: "Pagada",
  overdue: "Vencida",
  cancelled: "Cancelada",
};

function isPayableNow(invoice: InvoiceRow): boolean {
  return invoice.status === "pending" || invoice.status === "overdue";
}

export function InvoicesTable({
  invoices,
  canPay,
  companyName,
}: {
  invoices: InvoiceRow[];
  canPay: boolean;
  companyName: string;
}) {
  const identityKey = process.env.NEXT_PUBLIC_BOLD_IDENTITY_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://h07.io";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Cartera</CardTitle>
        <CardDescription>Historial de cobros de tu empresa</CardDescription>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay cobros.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="p-2 font-medium">Periodo</th>
                  <th className="p-2 font-medium">Vence</th>
                  <th className="p-2 font-medium">Total</th>
                  <th className="p-2 font-medium">Estado</th>
                  <th className="p-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => {
                  const payable = canPay && Boolean(identityKey) && isPayableNow(invoice);
                  const period = `${invoice.period_month.toString().padStart(2, "0")}/${invoice.period_year}`;
                  const range = periodRange(invoice.due_date);

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
                                description={sanitizeBoldDescription(
                                  `H07 - ${companyName} - Periodo ${formatDate(range.start)} a ${formatDate(range.end)}`,
                                )}
                                redirectionUrl={`${appUrl}/planes`}
                              />
                            );
                          })()
                        ) : canPay && isPayableNow(invoice) ? (
                          <span className="text-xs text-muted-foreground">Contacta a soporte para pagar</span>
                        ) : invoice.status === "paid" ? (
                          <Link href={`/planes/invoices/${invoice.id}/receipt`}>
                            <Button type="button" variant="outline" size="sm" className="gap-1.5">
                              <Download className="size-3.5" />
                              PDF
                            </Button>
                          </Link>
                        ) : null}
                      </td>
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
