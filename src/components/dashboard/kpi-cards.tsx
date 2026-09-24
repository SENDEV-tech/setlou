import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatXOF } from "@/lib/money";

interface KPIProps {
  kpis: {
    revenue: number;
    revenueVariation: number;
    sales: number;
    salesVariation: number;
  };
}

export function KPICards({ kpis }: KPIProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Revenu (Période)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatXOF(kpis.revenue)}</div>
          <p className="text-xs text-muted-foreground">
            <span className={kpis.revenueVariation >= 0 ? "text-green-500" : "text-red-500"}>
              {kpis.revenueVariation >= 0 ? "+" : ""}{kpis.revenueVariation}%
            </span>{" "}
            par rapport à la période précédente
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ventes (Période)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{kpis.sales}</div>
          <p className="text-xs text-muted-foreground">
            <span className={kpis.salesVariation >= 0 ? "text-green-500" : "text-red-500"}>
              {kpis.salesVariation >= 0 ? "+" : ""}{kpis.salesVariation}%
            </span>{" "}
            par rapport à la période précédente
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Panier moyen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {kpis.sales > 0 ? formatXOF(kpis.revenue / kpis.sales) : formatXOF(0)}
          </div>
          <p className="text-xs text-muted-foreground">
            Sur la période sélectionnée
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
