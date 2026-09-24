"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";

interface SalesChartProps {
  data: { date: string; revenue: number }[];
}

export function SalesChart({ data }: SalesChartProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Aperçu des revenus</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <ChartContainer
          config={{
            revenue: {
              label: "Revenu",
              color: "hsl(var(--primary))",
            },
          }}
          className="h-[350px] w-full"
        >
          <LineChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickLine={true} 
              axisLine={true} 
              tickMargin={12}
              label={{ value: "Mois", position: "insideBottom", offset: -15, fill: "currentColor", fontSize: 12 }}
            />
            <YAxis 
              tickLine={true} 
              axisLine={true} 
              tickMargin={8} 
              tickFormatter={(value) => `${value / 1000}k`}
              label={{ value: "Ventes (kXOF)", angle: -90, position: "insideLeft", offset: 10, fill: "currentColor", fontSize: 12 }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              type="linear"
              dataKey="revenue"
              stroke="#000000"
              strokeWidth={3}
              dot={{ r: 6, fill: "#000000" }}
              activeDot={{ r: 8, fill: "#000000" }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
