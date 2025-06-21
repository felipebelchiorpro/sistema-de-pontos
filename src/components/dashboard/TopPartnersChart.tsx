
"use client";

import { Pie, PieChart, Cell } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface TopPartnersChartProps {
  data: { name: string; value: number; fill: string }[];
}

export function TopPartnersChart({ data }: TopPartnersChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[250px] items-center justify-center text-muted-foreground">
        Não há parceiros com pontos para exibir.
      </div>
    );
  }

  const chartConfig = {
    points: {
      label: "Pontos",
    },
    ...data.reduce((acc, entry) => {
      acc[entry.name] = {
        label: entry.name,
        color: entry.fill,
      };
      return acc;
    }, {} as Record<string, { label: string; color: string }>),
  } satisfies ChartConfig;


  return (
    <ChartContainer
      config={chartConfig}
      className="h-[250px] w-full"
    >
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent
            formatter={(value) => `${Number(value).toFixed(2)} pts`}
            nameKey="name"
            hideLabel
          />}
        />
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={100}
          innerRadius={60}
          labelLine={false}
          label={false}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <ChartLegend
          content={<ChartLegendContent nameKey="name" />}
          verticalAlign="middle"
          align="right"
          layout="vertical"
        />
      </PieChart>
    </ChartContainer>
  )
}
