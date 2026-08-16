"use client";

import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useLocale } from "@/lib/locale/locale-context";

export function BreakEvenChart({
  monthlySales,
  breakEvenAmount,
}: {
  monthlySales: { month: string; total: number }[];
  breakEvenAmount: number | null;
}) {
  const { formatCurrency, formatMonthLabel } = useLocale();
  if (breakEvenAmount === null) return null;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={monthlySales} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="month"
          tickFormatter={(month: string) => formatMonthLabel(month)}
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
          labelFormatter={(month) => formatMonthLabel(String(month))}
          contentStyle={{
            backgroundColor: "var(--popover)",
            borderColor: "var(--border)",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Bar dataKey="total" name="Ventas del mes" radius={[4, 4, 0, 0]} isAnimationActive={false}>
          {monthlySales.map((point) => (
            <Cell key={point.month} fill={point.total >= breakEvenAmount ? "var(--primary)" : "#ef4444"} />
          ))}
        </Bar>
        <ReferenceLine
          y={breakEvenAmount}
          stroke="#ef4444"
          strokeDasharray="4 4"
          label={{ value: "Punto de equilibrio", position: "insideTopRight", fontSize: 12, fill: "#ef4444" }}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
