import { formatCurrency, formatDate } from "@/lib/format";
import type { InvoiceRow, TenantPaymentLink } from "@/lib/planes/types";

export function PayNowBanner({ invoices, paymentLink }: { invoices: InvoiceRow[]; paymentLink: TenantPaymentLink }) {
  const dueInvoice = invoices.find((invoice) => invoice.status === "pending" || invoice.status === "overdue");
  if (!dueInvoice) return null;

  const isOverdue = dueInvoice.status === "overdue";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-yellow-300 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950/30">
      <div>
        <p className="text-sm font-medium">
          Tienes una factura {isOverdue ? "vencida" : "pendiente"} por {formatCurrency(dueInvoice.total_amount)}
          {" "}(vence {formatDate(dueInvoice.due_date)}).
        </p>
        {!paymentLink && (
          <p className="text-xs text-muted-foreground">Contacta a soporte para conocer el medio de pago.</p>
        )}
      </div>

      {paymentLink && (
        <a
          href={paymentLink.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 items-center justify-center rounded-md bg-yellow-500 px-4 text-sm font-medium text-black hover:bg-yellow-600"
        >
          Pagar {formatCurrency(dueInvoice.total_amount)}
        </a>
      )}
    </div>
  );
}
