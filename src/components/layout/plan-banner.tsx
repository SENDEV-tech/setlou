import Link from "next/link";
import { getPlanUsage } from "@/server/data/supabase-store";
import { FREE_SHOP_LINK_MONTHLY_ORDERS } from "@/server/data/plan";
import { cn } from "@/lib/utils";

function Meter({ label, used, max }: { label: string; used: number; max: number }) {
  const ratio = Math.min(used / max, 1);
  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold tabular-nums">
          {Math.min(used, max)}/{max}
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", ratio >= 1 ? "bg-red-500" : ratio >= 0.8 ? "bg-amber-500" : "bg-primary")}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
    </div>
  );
}

// Formule gratuite : compteur du mois et lien vers l'abonnement (propriétaire seulement).
export async function PlanBanner({ shopId }: { shopId: string }) {
  let data: Awaited<ReturnType<typeof getPlanUsage>>;
  try {
    data = await getPlanUsage(shopId);
  } catch (error) {
    console.error("PlanBanner:", error);
    return null;
  }
  const { plan, usage } = data;
  if (plan.paid || plan.monthlyOrders === null || plan.products === null) return null;

  const ordersFull = usage.ordersThisMonth >= plan.monthlyOrders;
  const productsFull = usage.products >= plan.products;
  const shopLinkFull = usage.ordersThisMonth >= FREE_SHOP_LINK_MONTHLY_ORDERS;
  const warn = ordersFull || productsFull;

  let message = "Gratuit à vie. Passez à Starter quand votre boutique grandit.";
  if (shopLinkFull) {
    message = "Limite du mois atteinte : votre lien boutique ne prend plus de commandes. Passez à Starter pour continuer.";
  } else if (ordersFull) {
    message = `Vos ${plan.monthlyOrders} commandes gratuites du mois sont utilisées. Vos clients peuvent encore commander sur votre lien boutique jusqu'à ${FREE_SHOP_LINK_MONTHLY_ORDERS} commandes ce mois-ci.`;
  } else if (productsFull) {
    message = `Vous avez ${plan.products} produits, le maximum de la formule gratuite.`;
  }

  return (
    <div
      className={cn(
        "mb-4 flex flex-col gap-3 rounded-xl border bg-background p-3 sm:flex-row sm:items-center sm:gap-4",
        warn && "border-amber-300 bg-amber-50 dark:border-amber-500/40 dark:bg-amber-500/10"
      )}
    >
      <div className="min-w-0 sm:w-64 sm:shrink-0">
        <p className="text-sm font-semibold">Formule gratuite</p>
        <p className="text-xs text-muted-foreground">{message}</p>
      </div>
      <div className="flex flex-1 gap-4">
        <Meter label="Commandes ce mois" used={usage.ordersThisMonth} max={plan.monthlyOrders} />
        <Meter label="Produits" used={usage.products} max={plan.products} />
      </div>
      <Link
        href="/abonnement"
        className={cn(
          "inline-flex h-9 shrink-0 items-center justify-center rounded-full px-4 text-sm font-semibold",
          warn ? "bg-primary text-primary-foreground hover:bg-primary/90" : "border hover:bg-muted"
        )}
      >
        Passer à Starter
      </Link>
    </div>
  );
}
