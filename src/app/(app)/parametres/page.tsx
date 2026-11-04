import { getPlanUsage, getShop } from "@/server/data/supabase-store";
import { getShopWaveStatus } from "@/server/data/shop-wave";
import { SettingsForm } from "@/components/settings/settings-form";

export default async function SettingsPage() {
  const [shop, { plan, usage }] = await Promise.all([getShop(), getPlanUsage()]);
  const wave = await getShopWaveStatus(shop.id);
  const summary = plan.paid
    ? plan.monthlyOrders === null
      ? "Commandes illimitées."
      : `${usage.ordersThisMonth}/${plan.monthlyOrders} commandes ce mois-ci.`
    : `Gratuit à vie : ${usage.ordersThisMonth}/${plan.monthlyOrders} commandes ce mois-ci et ${usage.products}/${plan.products} produits.`;

  return (
    <div className="flex-1 max-w-5xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Paramètres</h2>
        <p className="text-muted-foreground mt-1">
          Gérez les informations de votre boutique, votre identité visuelle et les messages envoyés à vos clients.
        </p>
      </div>
      
      <SettingsForm shop={shop} plan={{ name: plan.name, paid: plan.paid, summary }} wave={wave} />
    </div>
  );
}
