import { getDashboardKPIs, getLowStockProducts } from "@/server/data/supabase-store";
import { KPICards } from "@/components/dashboard/kpi-cards";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Clock, CheckCircle2, XCircle, PackageX } from "lucide-react";
import Link from "next/link";

interface DashboardPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function DashboardPage(props: DashboardPageProps) {
  const searchParams = await props.searchParams;

  const fromParam = typeof searchParams.from === "string" ? searchParams.from : undefined;
  const toParam = typeof searchParams.to === "string" ? searchParams.to : undefined;

  const to = toParam ? new Date(toParam) : new Date();
  const from = fromParam ? new Date(fromParam) : new Date(new Date().setDate(new Date().getDate() - 30));

  const [kpis, lowStockProducts] = await Promise.all([
    getDashboardKPIs(undefined, from, to),
    getLowStockProducts(),
  ]);
  const chartData = kpis.chartData;

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2 flex-wrap gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Tableau de bord</h2>
        <div className="flex items-center space-x-2">
          <DateRangePicker />
        </div>
      </div>
      {lowStockProducts.length > 0 && (
        <Card className="border-orange-300 bg-orange-50/60 dark:border-orange-900 dark:bg-orange-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
              <PackageX className="h-5 w-5" />
              Stock bas
            </CardTitle>
            <CardDescription>
              Pensez à réapprovisionner ces produits.{" "}
              <Link href="/produits" className="underline font-medium">Gérer le stock</Link>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {lowStockProducts.map((p) => (
                <li key={p.id} className="flex justify-between gap-4">
                  <span className="truncate">{p.name}</span>
                  <span className={p.stock_quantity === 0 ? "font-semibold text-red-600" : "font-semibold text-orange-600"}>
                    {p.stock_quantity === 0 ? "Épuisé" : `Plus que ${p.stock_quantity}`}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      <KPICards kpis={kpis} />
      <div className="grid gap-4 grid-cols-1 md:grid-cols-7">
        <div className="col-span-1 md:col-span-4 h-full">
          <SalesChart data={chartData} />
        </div>
        <Card className="col-span-1 md:col-span-3">
          <CardHeader>
            <CardTitle>Statut des commandes</CardTitle>
            <CardDescription>
              Répartition sur la période sélectionnée.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center">
                <CheckCircle2 className="h-9 w-9 text-green-500 mr-4 shrink-0" />
                <div className="ml-2 space-y-1">
                  <p className="text-sm font-medium leading-none">Payées</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Transactions confirmées</p>
                </div>
                <div className="ml-auto font-medium text-xl text-green-600">
                  {kpis.statusStats?.paid || 0}
                </div>
              </div>
              <div className="flex items-center">
                <Clock className="h-9 w-9 text-orange-500 mr-4 shrink-0" />
                <div className="ml-2 space-y-1">
                  <p className="text-sm font-medium leading-none">En attente</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Paiement non finalisé</p>
                </div>
                <div className="ml-auto font-medium text-xl text-orange-600">
                  {kpis.statusStats?.pending || 0}
                </div>
              </div>
              <div className="flex items-center">
                <XCircle className="h-9 w-9 text-red-500 mr-4 shrink-0" />
                <div className="ml-2 space-y-1">
                  <p className="text-sm font-medium leading-none">Annulées</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Échouées ou expirées</p>
                </div>
                <div className="ml-auto font-medium text-xl text-red-600">
                  {kpis.statusStats?.cancelled || 0}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
