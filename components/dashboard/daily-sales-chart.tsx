import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DailySalesPoint } from "@/lib/dashboard/types";
import { formatCurrency } from "@/lib/format";

// Barras simples con CSS, sin librería de gráficas externa: suficiente
// para un vistazo mensual de un solo negocio.
export function DailySalesChart({ points }: { points: DailySalesPoint[] }) {
  if (points.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ventas por día (este mes)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Todavía no hay ventas este mes.</p>
        </CardContent>
      </Card>
    );
  }

  const max = Math.max(...points.map((p) => p.total), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Ventas por día (este mes)</CardTitle>
        <CardDescription>Acumulado diario del mes en curso</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex h-40 items-end gap-1">
          {points.map((point) => (
            <div key={point.date} className="group relative flex-1">
              <div
                className="w-full rounded-t bg-primary/70 transition-colors group-hover:bg-primary"
                style={{ height: `${Math.max(2, (point.total / max) * 100)}%` }}
              />
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md border bg-popover px-2 py-1 text-xs shadow-md group-hover:block">
                {point.date.slice(8, 10)}: {formatCurrency(point.total)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
