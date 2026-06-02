"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useComputed } from "@/queries/hooks";

type Spend = { spend: { category: string; amount: number }[] };

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

/** Spend-by-category bar chart for analytics. Reads the computed /api/spend. */
export function SpendChart() {
  const { data } = useComputed<Spend>("spend");
  const rows = data?.spend ?? [];

  return (
    <Card data-testid="spend-chart">
      <CardHeader><CardTitle className="text-base">Spend by category</CardTitle></CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <XAxis dataKey="category" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => (v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${(v / 1000).toFixed(0)}k`)} />
              <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Spend"]} cursor={{ fill: "hsl(var(--muted))" }} />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                {rows.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
