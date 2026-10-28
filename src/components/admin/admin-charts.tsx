"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { DailyPoint } from "@/server/data/admin-stats";

function shortDate(value: string) {
  return new Date(value).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function compact(value: number) {
  return new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function RevenueChart({ data }: { data: DailyPoint[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Revenus par jour</CardTitle>
        <CardDescription>Abonnements Stripe et ventes Mobile Money des boutiques, en XOF.</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <ChartContainer
          config={{
            stripe: { label: "Stripe (abonnements)", color: "var(--chart-5)" },
            mobileMoney: { label: "Mobile Money (boutiques)", color: "var(--chart-2)" },
          }}
          className="h-[300px] w-full"
        >
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeOpacity={0.2} />
            <XAxis dataKey="date" tickFormatter={shortDate} tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
            <YAxis tickFormatter={compact} tickLine={false} axisLine={false} width={48} />
            <ChartTooltip content={<ChartTooltipContent labelFormatter={(value) => shortDate(String(value))} />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="stripe" stackId="revenue" fill="var(--color-stripe)" radius={[0, 0, 0, 0]} />
            <Bar dataKey="mobileMoney" stackId="revenue" fill="var(--color-mobileMoney)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function TrafficChart({ data }: { data: DailyPoint[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Trafic et inscriptions</CardTitle>
        <CardDescription>Pages vues, visiteurs uniques et nouveaux comptes par jour.</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <ChartContainer
          config={{
            visits: { label: "Pages vues", color: "var(--chart-2)" },
            visitors: { label: "Visiteurs", color: "var(--chart-4)" },
            signups: { label: "Inscriptions", color: "var(--chart-5)" },
          }}
          className="h-[300px] w-full"
        >
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeOpacity={0.2} />
            <XAxis dataKey="date" tickFormatter={shortDate} tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
            <YAxis tickFormatter={compact} tickLine={false} axisLine={false} width={40} allowDecimals={false} />
            <ChartTooltip content={<ChartTooltipContent labelFormatter={(value) => shortDate(String(value))} />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Area dataKey="visits" type="monotone" stroke="var(--color-visits)" fill="var(--color-visits)" fillOpacity={0.15} strokeWidth={2} />
            <Area dataKey="visitors" type="monotone" stroke="var(--color-visitors)" fill="var(--color-visitors)" fillOpacity={0.1} strokeWidth={2} />
            <Area dataKey="signups" type="monotone" stroke="var(--color-signups)" fill="var(--color-signups)" fillOpacity={0.2} strokeWidth={2} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
