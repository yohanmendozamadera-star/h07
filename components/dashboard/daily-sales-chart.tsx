"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DailySalesPoint } from "@/lib/dashboard/types";
import { useLocale } from "@/lib/locale/locale-context";

export function DailySalesChart({ points }: { points: DailySalesPoint[] }) {
  const { formatCurrency, formatDate } = useLocale();
  const hasSales = points.some((p) => p.total > 0);

  return (
    <Card className="border-0 shadow-[0_12px_40px_rgba(6,41,95,0.07)] ring-1 ring-blue-950/8 dark:ring-white/10">
      <CardHeader>
        <CardTitle className="text-lg text-primary dark:text-white">Ventas por día</CardTitle>
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
              <Bar dataKey="total" fill="var(--chart-1)" radius={[7, 7, 2, 2]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
