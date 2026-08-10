import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BreakEvenChart } from "@/components/dashboard/break-even-chart";
import { RegisterFixedCostDialog } from "@/components/dashboard/register-fixed-cost-dialog";
import { updateBudgetedFixedCostAction, updateRealFixedCostAction } from "@/app/(app)/dashboard/actions";
import type { BudgetedBreakEven, RealBreakEven } from "@/lib/dashboard/types";
import { formatCurrency } from "@/lib/format";

export function BudgetedBreakEvenCard({ data }: { data: BudgetedBreakEven }) {
  const registerButton = (
    <RegisterFixedCostDialog
      kind="budgeted"
      currentValue={data.fixedCost}
      currentValueUpdatedAt={data.fixedCostUpdatedAt}
      onSave={updateBudgetedFixedCostAction}
    />
  );

  if (data.fixedCost === null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Punto de equilibrio presupuestado</CardTitle>
          <CardDescription>
            Registra el costo fijo que presupuestaste para tu negocio — con eso y tu margen de contribución
            promedio calculamos cuánto deberías facturar para llegar a tu punto de equilibrio.
          </CardDescription>
        </CardHeader>
        <CardContent>{registerButton}</CardContent>
      </Card>
    );
  }

  if (!data.hasEnoughSalesData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Punto de equilibrio presupuestado</CardTitle>
          <CardDescription>Costo fijo presupuestado: {formatCurrency(data.fixedCost)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Todavía no hay ventas registradas en los últimos {data.monthsUsed}{" "}
            {data.monthsUsed === 1 ? "mes" : "meses"} para calcular tu margen de contribución.
          </p>
          {registerButton}
        </CardContent>
      </Card>
    );
  }

  if (data.breakEvenAmount === null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Punto de equilibrio presupuestado</CardTitle>
          <CardDescription>
            Costo fijo presupuestado {formatCurrency(data.fixedCost)}, margen de contribución promedio de los
            últimos {data.monthsUsed} {data.monthsUsed === 1 ? "mes" : "meses"}:{" "}
            {data.contributionMarginPercent!.toFixed(0)}%.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            En los últimos {data.monthsUsed} {data.monthsUsed === 1 ? "mes" : "meses"} tus compras y gastos
            variables fueron iguales o mayores a tus ventas — con estos datos no se puede calcular un punto de
            equilibrio estable. Revisa que tus gastos y compras estén bien registrados.
          </p>
          {registerButton}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Punto de equilibrio presupuestado</CardTitle>
        <CardDescription>
          Costo fijo presupuestado {formatCurrency(data.fixedCost)}, margen de contribución promedio de los
          últimos {data.monthsUsed} {data.monthsUsed === 1 ? "mes" : "meses"}: {data.contributionMarginPercent!.toFixed(0)}%.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm">
          Deberías facturar al menos <strong>{formatCurrency(data.breakEvenAmount)}</strong> al mes para cubrir tu
          presupuesto
          {data.ordersNeeded !== null && (
            <>
              {" "}
              — aproximadamente <strong>{data.ordersNeeded}</strong> pedidos (según tu ticket promedio de{" "}
              {formatCurrency(data.avgTicket)}).
            </>
          )}
        </p>
        {registerButton}
        <BreakEvenChart monthlySales={data.monthlySales} breakEvenAmount={data.breakEvenAmount} />
      </CardContent>
    </Card>
  );
}

export function RealBreakEvenCard({ data }: { data: RealBreakEven }) {
  const registerButton = (
    <RegisterFixedCostDialog
      kind="real"
      currentValue={data.fixedCost}
      currentValueUpdatedAt={data.fixedCostUpdatedAt}
      onSave={updateRealFixedCostAction}
    />
  );

  if (data.fixedCost === null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Punto de equilibrio real</CardTitle>
          <CardDescription>
            Registra el costo fijo real que pagas cada mes — con eso calculamos, con las ventas de este mes en
            curso, cuánto te falta facturar para cubrir tus costos.
          </CardDescription>
        </CardHeader>
        <CardContent>{registerButton}</CardContent>
      </Card>
    );
  }

  if (!data.hasEnoughSalesData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Punto de equilibrio real</CardTitle>
          <CardDescription>Costo fijo real: {formatCurrency(data.fixedCost)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Todavía no hay ventas registradas este mes para calcular tu margen de contribución.
          </p>
          {registerButton}
        </CardContent>
      </Card>
    );
  }

  if (data.breakEvenAmount === null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Punto de equilibrio real</CardTitle>
          <CardDescription>
            Costo fijo real {formatCurrency(data.fixedCost)}, margen de contribución de este mes:{" "}
            {data.contributionMarginPercent!.toFixed(0)}%.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Este mes tus compras y gastos variables fueron iguales o mayores a tus ventas — con estos datos no se
            puede calcular un punto de equilibrio estable. Revisa que tus gastos y compras estén bien registrados.
          </p>
          {registerButton}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Punto de equilibrio real</CardTitle>
        <CardDescription>
          Costo fijo real {formatCurrency(data.fixedCost)}, margen de contribución de este mes:{" "}
          {data.contributionMarginPercent!.toFixed(0)}%.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm">
          Este mes necesitas facturar <strong>{formatCurrency(data.breakEvenAmount)}</strong> para cubrir tus costos
          reales
          {data.stillNeeded !== null && data.stillNeeded > 0 && (
            <>
              {" "}
              — te faltan <strong>{formatCurrency(data.stillNeeded)}</strong> por facturar.
            </>
          )}
          {data.stillNeeded === 0 && <> — ¡ya lo lograste este mes!</>}
        </p>

        <div>
          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatCurrency(data.billedSoFar)} facturados este mes</span>
            <span>{data.progressPercent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${data.progressPercent}%` }} />
          </div>
        </div>

        {registerButton}
      </CardContent>
    </Card>
  );
}
