import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRangeFilter } from "@/components/shared/date-range-filter";
import { ExportButton } from "@/components/shared/export-button";
import type { TechnicianProductivityDetailRow } from "@/lib/dashboard/types";
import { formatCurrency, formatDateTime } from "@/lib/format";

function summarize(rows: TechnicianProductivityDetailRow[]) {
  const byTech = new Map<
    string,
    { technicianName: string; orderCount: number; totalAmount: number; commissionAmount: number }
  >();
  for (const row of rows) {
    const existing = byTech.get(row.technicianId) ?? {
      technicianName: row.technicianName,
      orderCount: 0,
      totalAmount: 0,
      commissionAmount: 0,
    };
    existing.orderCount += 1;
    existing.totalAmount += row.totalAmount;
    existing.commissionAmount += row.commissionAmount ?? 0;
    byTech.set(row.technicianId, existing);
  }
  return Array.from(byTech.values()).sort((a, b) => b.totalAmount - a.totalAmount);
}

export function ProductivityTable({
  rows,
  defaultFrom,
  defaultTo,
  exportHref,
}: {
  rows: TechnicianProductivityDetailRow[];
  defaultFrom: string;
  defaultTo: string;
  exportHref: string;
}) {
  const summary = summarize(rows);
  const commissionEnabled = rows.some((row) => row.commissionPercent !== null);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <DateRangeFilter defaultFrom={defaultFrom} defaultTo={defaultTo} />
        <ExportButton href={exportHref} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Productividad por técnico</CardTitle>
          <CardDescription>Resumen del rango seleccionado</CardDescription>
        </CardHeader>
        <CardContent>
          {summary.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Todavía no hay pedidos con técnico asignado en este rango de fechas.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-blue-50 text-left text-xs text-blue-900 dark:bg-blue-950/40 dark:text-blue-100">
                  <tr>
                    <th className="p-2 font-medium">Técnico</th>
                    <th className="p-2 font-medium">Pedidos</th>
                    <th className="p-2 font-medium">Total</th>
                    {commissionEnabled && <th className="p-2 font-medium">Comisión total</th>}
                  </tr>
                </thead>
                <tbody>
                  {summary.map((row) => (
                    <tr key={row.technicianName} className="border-t">
                      <td className="p-2">{row.technicianName}</td>
                      <td className="p-2">{row.orderCount}</td>
                      <td className="p-2">{formatCurrency(row.totalAmount)}</td>
                      {commissionEnabled && <td className="p-2">{formatCurrency(row.commissionAmount)}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {rows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Detalle</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-blue-50 text-left text-xs text-blue-900 dark:bg-blue-950/40 dark:text-blue-100">
                  <tr>
                    <th className="p-2 font-medium">Fecha</th>
                    <th className="p-2 font-medium">Técnico</th>
                    <th className="p-2 font-medium">Pedido</th>
                    <th className="p-2 font-medium">Total</th>
                    {commissionEnabled && (
                      <>
                        <th className="p-2 font-medium">% Comisión</th>
                        <th className="p-2 font-medium">Valor comisionado</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.orderId} className="border-t">
                      <td className="p-2">{formatDateTime(row.date)}</td>
                      <td className="p-2">{row.technicianName}</td>
                      <td className="p-2 text-muted-foreground">{row.orderNumber}</td>
                      <td className="p-2">{formatCurrency(row.totalAmount)}</td>
                      {commissionEnabled && (
                        <>
                          <td className="p-2">{row.commissionPercent}%</td>
                          <td className="p-2">{formatCurrency(row.commissionAmount ?? 0)}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
