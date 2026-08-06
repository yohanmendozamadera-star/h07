"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DailySalesPoint } from "@/lib/dashboard/types";
import { formatCurrency, formatDate } from "@/lib/format";

export function DailySalesChart({ points }: { points: DailySalesPoint[] }) {
  const hasSales = points.some((p) => p.total > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Ventas por día (este mes)</CardTitle>
        <CardDescription>Tendencia diaria del mes en curso</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasSales ? (
          <p className="text-sm text-muted-foreground">Todavía no hay ventas este mes.</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="date"
                tickFormatter={(date: string) => date.slice(8, 10)}
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: "var(--border)" }}
              />
              <YAxis
                tickFormatter={(value: number) => formatCurrency(value)}
                width={90}
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(value) => formatCurrency(Number(value))}
                labelFormatter={(date) => formatDate(String(date))}
                contentStyle={{
                  backgroundColor: "var(--popover)",
                  borderColor: "var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="total" fill="var(--primary)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
