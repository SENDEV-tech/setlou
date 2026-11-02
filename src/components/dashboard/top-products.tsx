import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatXOF } from "@/lib/money";
import type { ProductSales } from "@/server/data/supabase-store";
import { Trophy } from "lucide-react";

const VISIBLE = 10;

export function TopProducts({ products }: { products: ProductSales[] }) {
  const visible = products.slice(0, VISIBLE);
  const hidden = products.length - visible.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          Chiffre d&apos;affaires par produit
        </CardTitle>
        <CardDescription>Commandes payées sur la période sélectionnée.</CardDescription>
      </CardHeader>
      <CardContent>
        {visible.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune vente payée sur cette période.</p>
        ) : (
          <ul className="space-y-4">
            {visible.map((p, idx) => (
              <li key={p.productId ?? p.name} className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate text-sm font-medium">
                    <span className="mr-2 text-muted-foreground">{idx + 1}.</span>
                    {p.name}
                  </span>
                  <span className="shrink-0 font-semibold">{formatXOF(p.revenue)}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(p.share, 1)}%` }} />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{p.quantity} vendu{p.quantity > 1 ? "s" : ""}</span>
                  <span>{p.share.toLocaleString("fr-FR")} % du CA</span>
                </div>
              </li>
            ))}
          </ul>
        )}
        {hidden > 0 && (
          <p className="mt-4 text-xs text-muted-foreground">
            + {hidden} autre{hidden > 1 ? "s" : ""} produit{hidden > 1 ? "s" : ""} vendu{hidden > 1 ? "s" : ""}.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
