"use client";

import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { BreakEvenData } from "@/lib/dashboard/types";
import { formatCurrency, formatMonthLabel } from "@/lib/format";

export function BreakEvenChart({ data }: { data: BreakEvenData }) {
  if (data.breakEvenAmount === null) return null;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data.monthlySales} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
          {data.monthlySales.map((point) => (
            <Cell key={point.month} fill={point.total >= data.breakEvenAmount! ? "var(--primary)" : "#ef4444"} />
          ))}
        </Bar>
        <ReferenceLine
          y={data.breakEvenAmount}
          stroke="#ef4444"
          strokeDasharray="4 4"
          label={{ value: "Punto de equilibrio", position: "insideTopRight", fontSize: 12, fill: "#ef4444" }}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
