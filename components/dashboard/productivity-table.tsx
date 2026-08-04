import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { TechnicianProductivity } from "@/lib/dashboard/types";
import { formatCurrency } from "@/lib/format";

export function ProductivityTable({ rows }: { rows: TechnicianProductivity[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Productividad por técnico</CardTitle>
        <CardDescription>Pedidos asignados este mes</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Todavía no hay pedidos con técnico asignado este mes.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="p-2 font-medium">Técnico</th>
                  <th className="p-2 font-medium">Pedidos</th>
                  <th className="p-2 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.technicianId} className="border-t">
                    <td className="p-2">{row.technicianName}</td>
                    <td className="p-2">{row.orderCount}</td>
                    <td className="p-2">{formatCurrency(row.totalAmount)}</td>
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
