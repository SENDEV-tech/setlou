import type { Metadata } from "next";
import { requireAdmin } from "@/server/data/admin-guard";
import { getAdminStats, PLAN_PRICES_XOF } from "@/server/data/admin-stats";
import { RevenueChart, TrafficChart } from "@/components/admin/admin-charts";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatXOF } from "@/lib/money";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Administration · Setlou",
  robots: { index: false, follow: false },
};

const PLAN_LABELS = { starter: "Starter", pro: "Pro", entreprise: "Entreprise" } as const;

interface AdminPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

function variation(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / previous) * 100);
}

function StatCard({ title, value, hint, current, previous }: {
  title: string;
  value: string;
  hint?: string;
  current?: number;
  previous?: number;
}) {
  const showVariation = current !== undefined && previous !== undefined;
  const change = showVariation ? variation(current, previous) : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl font-bold">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">
          {showVariation && (
            <span className={change >= 0 ? "text-green-600" : "text-red-600"}>
              {change >= 0 ? "+" : ""}{change}%{" "}
            </span>
          )}
          {hint ?? (showVariation ? "par rapport à la période précédente" : "")}
        </p>
      </CardContent>
    </Card>
  );
}

export default async function AdminPage(props: AdminPageProps) {
  const { email } = await requireAdmin();
  const searchParams = await props.searchParams;

  const fromParam = typeof searchParams.from === "string" ? searchParams.from : undefined;
  const toParam = typeof searchParams.to === "string" ? searchParams.to : undefined;
  const to = toParam ? new Date(toParam) : new Date();
  const from = fromParam ? new Date(fromParam) : new Date(new Date().setDate(new Date().getDate() - 30));

  const stats = await getAdminStats(from, to);
  const totalRevenue = stats.stripe.revenue + stats.mobileMoney.volume;
  const paying = stats.subscriptions.byStatus.active;
  const trials = stats.subscriptions.byStatus.trialing;

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Administration Setlou</h1>
          <p className="text-sm text-muted-foreground">Trafic et revenus de toute la plateforme · connecté en tant que {email}</p>
        </div>
        <DateRangePicker />
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Revenus</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Revenus Stripe encaissés"
            value={stats.stripe.available ? formatXOF(stats.stripe.revenue) : "Non configuré"}
            current={stats.stripe.available ? stats.stripe.revenue : undefined}
            previous={stats.stripe.available ? stats.stripe.revenuePrevious : undefined}
            hint={!stats.stripe.available ? "STRIPE_SECRET_KEY manquante" : stats.stripe.testMode ? "Mode test Stripe : paiements fictifs" : undefined}
          />
          <StatCard
            title="Revenu mensuel récurrent (estimé)"
            value={formatXOF(stats.subscriptions.mrr)}
            hint={`${paying} abonnement${paying > 1 ? "s" : ""} payant${paying > 1 ? "s" : ""} aujourd'hui`}
          />
          <StatCard
            title="Volume Mobile Money des boutiques"
            value={formatXOF(stats.mobileMoney.volume)}
            current={stats.mobileMoney.volume}
            previous={stats.mobileMoney.volumePrevious}
          />
          <StatCard
            title="Volume total traité"
            value={formatXOF(totalRevenue)}
            hint="Stripe + Mobile Money (l'argent Mobile Money revient aux boutiques)"
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Trafic et croissance</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Pages vues"
            value={stats.traffic.available ? stats.traffic.visits.toLocaleString("fr-FR") : "—"}
            current={stats.traffic.available ? stats.traffic.visits : undefined}
            previous={stats.traffic.available ? stats.traffic.visitsPrevious : undefined}
            hint={stats.traffic.available ? undefined : "Table page_views pas encore créée"}
          />
          <StatCard
            title="Visiteurs uniques"
            value={stats.traffic.available ? stats.traffic.visitors.toLocaleString("fr-FR") : "—"}
            hint="Comptés par jour, sans cookie"
          />
          <StatCard
            title="Inscriptions"
            value={stats.growth.signups.toLocaleString("fr-FR")}
            current={stats.growth.signups}
            previous={stats.growth.signupsPrevious}
          />
          <StatCard
            title="Boutiques actives"
            value={`${stats.growth.activeShops} / ${stats.growth.totalShops}`}
            hint={`Au moins une commande · ${stats.growth.newShops} nouvelle${stats.growth.newShops > 1 ? "s" : ""}`}
          />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <RevenueChart data={stats.daily} />
        <TrafficChart data={stats.daily} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Abonnements par offre</CardTitle>
            <CardDescription>
              État actuel · {trials} en essai, {stats.subscriptions.byStatus.past_due} impayé{stats.subscriptions.byStatus.past_due > 1 ? "s" : ""}, {stats.subscriptions.byStatus.canceled} résilié{stats.subscriptions.byStatus.canceled > 1 ? "s" : ""}, {stats.subscriptions.byStatus.none} sans abonnement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Offre</TableHead>
                  <TableHead className="text-right">Actifs</TableHead>
                  <TableHead className="text-right">Essai</TableHead>
                  <TableHead className="text-right">Impayés</TableHead>
                  <TableHead className="text-right">Résiliés</TableHead>
                  <TableHead className="text-right">MRR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.subscriptions.byPlan.map((row) => (
                  <TableRow key={row.plan}>
                    <TableCell className="font-medium">{PLAN_LABELS[row.plan]}</TableCell>
                    <TableCell className="text-right">{row.active}</TableCell>
                    <TableCell className="text-right">{row.trialing}</TableCell>
                    <TableCell className="text-right">{row.past_due}</TableCell>
                    <TableCell className="text-right">{row.canceled}</TableCell>
                    <TableCell className="text-right">{formatXOF(row.active * PLAN_PRICES_XOF[row.plan])}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Commandes des boutiques</CardTitle>
            <CardDescription>Liens de paiement Wave / Orange Money sur la période.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{stats.mobileMoney.createdOrders}</p>
              <p className="text-xs text-muted-foreground">Créées</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{stats.mobileMoney.paidOrders}</p>
              <p className="text-xs text-muted-foreground">Payées</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{formatXOF(stats.mobileMoney.averageBasket)}</p>
              <p className="text-xs text-muted-foreground">Panier moyen</p>
            </div>
          </CardContent>
          <CardHeader className="pt-0">
            <CardTitle className="text-base">Pages les plus vues</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.traffic.topPages.length === 0 ? (
              <p className="text-sm text-muted-foreground">Pas encore de visites enregistrées.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {stats.traffic.topPages.map((page) => (
                  <li key={page.path} className="flex justify-between gap-4">
                    <span className="truncate font-mono text-xs">{page.path}</span>
                    <span className="font-medium">{page.visits.toLocaleString("fr-FR")}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top 10 des boutiques</CardTitle>
          <CardDescription>Classées par volume encaissé sur la période.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {stats.topShops.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune commande payée sur la période.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Boutique</TableHead>
                  <TableHead>Offre</TableHead>
                  <TableHead className="text-right">Commandes payées</TableHead>
                  <TableHead className="text-right">Volume</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.topShops.map((shop) => (
                  <TableRow key={shop.id}>
                    <TableCell className="font-medium">{shop.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{PLAN_LABELS[shop.plan as keyof typeof PLAN_LABELS] ?? shop.plan}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{shop.orders}</TableCell>
                    <TableCell className="text-right">{formatXOF(shop.revenue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
