
"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface SalesChartProps {
  data: { date: string; total: number }[];
}

const chartConfig = {
  total: {
    label: "Vendas (R$)",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export function SalesChart({ data }: SalesChartProps) {
  if (!data || data.length === 0 || !data.some(d => d.total > 0)) {
    return (
      <div className="flex h-[250px] items-center justify-center text-muted-foreground">
        Nenhuma venda nos últimos 30 dias.
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-[250px] w-full">
      <BarChart accessibilityLayer data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          fontSize={12}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          fontSize={12}
          tickFormatter={(value) => `R$${value}`}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent
            formatter={(value) => `R$ ${Number(value).toFixed(2)}`}
            indicator="dot"
          />}
        />
        <Bar dataKey="total" fill="var(--color-total)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
