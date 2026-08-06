import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { BreakEvenData } from "@/lib/dashboard/types";
import { formatCurrency } from "@/lib/format";

export function BreakEvenCard({ data, salesMonth }: { data: BreakEvenData; salesMonth: number }) {
  if (!data.hasEnoughData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Punto de equilibrio</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Registra pedidos, gastos (marcados fijo/variable) y compras para que calculemos aquí, en automático,
            cuánto necesitas facturar para cubrir tus costos.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (data.breakEvenAmount === null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Punto de equilibrio</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            En los últimos {data.monthsUsed} {data.monthsUsed === 1 ? "mes" : "meses"} tus compras y gastos variables
            fueron iguales o mayores a tus ventas — con estos datos no se puede calcular un punto de equilibrio
            estable. Revisa que tus gastos y compras estén bien registrados.
          </p>
        </CardContent>
      </Card>
    );
  }

  const progressPercent = Math.min(100, Math.round((salesMonth / data.breakEvenAmount) * 100));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Punto de equilibrio</CardTitle>
        <CardDescription>
          Calculado con tus datos de los últimos {data.monthsUsed} {data.monthsUsed === 1 ? "mes" : "meses"}: costo
          fijo promedio {formatCurrency(data.avgFixedCost)}, margen de contribución{" "}
          {data.contributionMarginPercent!.toFixed(0)}%.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm">
          Este mes necesitas facturar al menos <strong>{formatCurrency(data.breakEvenAmount)}</strong> para cubrir tus
          costos
          {data.ordersNeeded !== null && (
            <>
              {" "}
              — aproximadamente <strong>{data.ordersNeeded}</strong> pedidos (según tu ticket promedio de{" "}
              {formatCurrency(data.avgTicket)}).
            </>
          )}
        </p>

        <div>
          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatCurrency(salesMonth)} facturados este mes</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
