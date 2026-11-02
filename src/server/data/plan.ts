// Formules Setlou : gratuite à vie avec des limites, puis abonnement payant
// (Starter, Pro, Entreprise) quand la boutique grandit.
// Module sans accès base : les limites se calculent depuis la ligne `shops`.

export const FREE_PLAN = {
  monthlyOrders: 50,
  products: 25,
  assistants: 1,
} as const;

// Commandes passées par les clients sur le lien boutique : au-delà des 50 commandes
// gratuites, on continue de les accepter jusqu'à ce plafond pour ne pas faire perdre
// une vente au vendeur. Au-delà, le client est renvoyé vers le WhatsApp de la boutique.
export const FREE_SHOP_LINK_MONTHLY_ORDERS = 100;

export type PlanKey = 'free' | 'starter' | 'pro' | 'entreprise';

export const PLAN_NAMES: Record<PlanKey, string> = {
  free: 'Gratuite',
  starter: 'Starter',
  pro: 'Pro',
  entreprise: 'Entreprise',
};

export type ShopPlanFields = {
  subscription_status?: string | null;
  subscription_provider?: string | null;
  subscription_plan?: string | null;
  paid_until?: string | null;
  monthly_orders_limit?: number | null;
  max_assistants?: number | null;
};

export type ShopPlan = {
  key: PlanKey;
  name: string;
  paid: boolean;
  /** Ancien essai de 20 jours encore en cours (boutiques inscrites avant la formule gratuite). */
  trialUntil: string | null;
  /** null = illimité */
  monthlyOrders: number | null;
  products: number | null;
  assistants: number | null;
  shopLinkMonthlyOrders: number | null;
};

// Abonnement payé (ou ancien essai) encore valable. Sinon : formule gratuite.
export function hasPaidAccess(shop: ShopPlanFields): boolean {
  if (shop.subscription_status !== 'active' && shop.subscription_status !== 'trialing') return false;
  const datedProvider = shop.subscription_provider === 'wave' || shop.subscription_provider === 'trial';
  if (datedProvider && shop.paid_until && new Date(shop.paid_until).getTime() < Date.now()) return false;
  return true;
}

export function getShopPlan(shop: ShopPlanFields): ShopPlan {
  if (!hasPaidAccess(shop)) {
    return {
      key: 'free',
      name: PLAN_NAMES.free,
      paid: false,
      trialUntil: null,
      monthlyOrders: FREE_PLAN.monthlyOrders,
      products: FREE_PLAN.products,
      assistants: FREE_PLAN.assistants,
      shopLinkMonthlyOrders: FREE_SHOP_LINK_MONTHLY_ORDERS,
    };
  }

  const key: PlanKey =
    shop.subscription_plan === 'pro' || shop.subscription_plan === 'entreprise' ? shop.subscription_plan : 'starter';
  const monthlyOrders = shop.monthly_orders_limit ?? null;
  return {
    key,
    name: PLAN_NAMES[key],
    paid: true,
    trialUntil: shop.subscription_provider === 'trial' ? shop.paid_until ?? null : null,
    monthlyOrders,
    products: null,
    assistants: shop.max_assistants ?? null,
    shopLinkMonthlyOrders: monthlyOrders,
  };
}

// Les compteurs mensuels repartent le 1er du mois (heure de Dakar = UTC).
export function startOfMonthIso(now: Date = new Date()): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

export const UPGRADE_HINT = 'Passez à Starter (4 900 F/mois) depuis la page Abonnement.';
