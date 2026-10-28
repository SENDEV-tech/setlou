import 'server-only';
import Stripe from 'stripe';
import { createAdminClient } from '@/utils/supabase/admin';

export type PlanKey = 'starter' | 'pro' | 'entreprise';

// Prix mensuels en XOF, à garder alignés avec les prix Stripe.
export const PLAN_PRICES_XOF: Record<PlanKey, number> = {
  starter: 4900,
  pro: 9900,
  entreprise: 19900,
};

const PLAN_KEYS: PlanKey[] = ['starter', 'pro', 'entreprise'];
type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'none';

// Les comptes assistants sont créés avec ce domaine technique (voir loginAction).
const ASSISTANT_EMAIL_DOMAIN = '@assistant.setlou.shop';

const MAX_ROWS = 50000;

export interface DailyPoint {
  date: string;
  signups: number;
  visits: number;
  visitors: number;
  stripe: number;
  mobileMoney: number;
}

export interface TopShop {
  id: string;
  name: string;
  plan: string;
  orders: number;
  revenue: number;
}

export interface AdminStats {
  from: string;
  to: string;
  growth: {
    signups: number;
    signupsPrevious: number;
    totalShops: number;
    newShops: number;
    activeShops: number;
  };
  subscriptions: {
    byPlan: { plan: PlanKey; trialing: number; active: number; past_due: number; canceled: number }[];
    byStatus: Record<SubscriptionStatus, number>;
    mrr: number;
  };
  stripe: {
    available: boolean;
    testMode: boolean;
    revenue: number;
    revenuePrevious: number;
    invoices: number;
  };
  mobileMoney: {
    paidOrders: number;
    volume: number;
    volumePrevious: number;
    createdOrders: number;
    averageBasket: number;
  };
  traffic: {
    available: boolean;
    visits: number;
    visitors: number;
    visitsPrevious: number;
    topPages: { path: string; visits: number }[];
  };
  daily: DailyPoint[];
  topShops: TopShop[];
}

interface ShopRow {
  id: string;
  name: string | null;
  created_at: string | null;
  subscription_plan: string | null;
  subscription_status: string | null;
}

interface OrderRow {
  shop_id: string;
  status: string;
  total_xof: number;
  created_at: string;
  paid_at: string | null;
}

interface PageViewRow {
  path: string;
  visitor_hash: string;
  created_at: string;
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function inRange(value: string | null | undefined, from: Date, to: Date): boolean {
  if (!value) return false;
  const time = new Date(value).getTime();
  return time >= from.getTime() && time <= to.getTime();
}

function toPlan(value: string | null): PlanKey {
  return value === 'pro' || value === 'entreprise' ? value : 'starter';
}

function toStatus(value: string | null): SubscriptionStatus {
  if (value === 'trialing' || value === 'active' || value === 'past_due' || value === 'canceled') {
    return value;
  }
  if (value === 'unpaid') return 'past_due';
  return 'none';
}

async function countSignups(admin: ReturnType<typeof createAdminClient>, from: Date, to: Date, prevFrom: Date) {
  const days = new Map<string, number>();
  let current = 0;
  let previous = 0;
  const perPage = 1000;

  for (let page = 1; page <= 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    for (const user of data.users) {
      if (user.email?.endsWith(ASSISTANT_EMAIL_DOMAIN)) continue;
      if (inRange(user.created_at, from, to)) {
        current++;
        const key = dayKey(new Date(user.created_at));
        days.set(key, (days.get(key) || 0) + 1);
      } else if (inRange(user.created_at, prevFrom, from)) {
        previous++;
      }
    }

    if (data.users.length < perPage) break;
  }

  return { current, previous, days };
}

// Revenus réellement encaissés par Stripe (factures payées). Le XOF n'a pas de décimales dans Stripe.
async function getStripeRevenue(from: Date, to: Date, prevFrom: Date) {
  const days = new Map<string, number>();
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return { available: false, revenue: 0, previous: 0, invoices: 0, days };
  }

  const stripe = new Stripe(secretKey);
  let revenue = 0;
  let previous = 0;
  let invoices = 0;

  const list = stripe.invoices.list({
    status: 'paid',
    created: {
      gte: Math.floor(prevFrom.getTime() / 1000),
      lte: Math.floor(to.getTime() / 1000),
    },
    limit: 100,
  });

  for await (const invoice of list) {
    if (invoice.amount_paid <= 0) continue;
    const created = new Date(invoice.created * 1000);
    if (created.getTime() >= from.getTime()) {
      revenue += invoice.amount_paid;
      invoices++;
      const key = dayKey(created);
      days.set(key, (days.get(key) || 0) + invoice.amount_paid);
    } else {
      previous += invoice.amount_paid;
    }
  }

  return { available: true, revenue, previous, invoices, days };
}

async function getTraffic(admin: ReturnType<typeof createAdminClient>, from: Date, to: Date, prevFrom: Date) {
  const visitsByDay = new Map<string, number>();
  const visitorsByDay = new Map<string, Set<string>>();

  const { data, error } = await admin
    .from('page_views')
    .select('path, visitor_hash, created_at')
    .gte('created_at', prevFrom.toISOString())
    .lte('created_at', to.toISOString())
    .order('created_at', { ascending: false })
    .limit(MAX_ROWS);

  // La table n'existe pas encore : la section visites reste vide.
  if (error) {
    return { available: false, visits: 0, visitors: 0, previous: 0, topPages: [], visitsByDay, visitorsByDay };
  }

  const rows = (data || []) as PageViewRow[];
  const visitors = new Set<string>();
  const pages = new Map<string, number>();
  let visits = 0;
  let previous = 0;

  for (const row of rows) {
    if (!inRange(row.created_at, from, to)) {
      previous++;
      continue;
    }
    visits++;
    visitors.add(row.visitor_hash);
    pages.set(row.path, (pages.get(row.path) || 0) + 1);

    const key = dayKey(new Date(row.created_at));
    visitsByDay.set(key, (visitsByDay.get(key) || 0) + 1);
    const daySet = visitorsByDay.get(key) || new Set<string>();
    daySet.add(row.visitor_hash);
    visitorsByDay.set(key, daySet);
  }

  const topPages = Array.from(pages.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([path, count]) => ({ path, visits: count }));

  return { available: true, visits, visitors: visitors.size, previous, topPages, visitsByDay, visitorsByDay };
}

export async function getAdminStats(from: Date, to: Date): Promise<AdminStats> {
  const admin = createAdminClient();
  const prevFrom = new Date(from.getTime() - (to.getTime() - from.getTime()));

  const [signups, stripe, traffic, shopsResult, ordersResult] = await Promise.all([
    countSignups(admin, from, to, prevFrom),
    getStripeRevenue(from, to, prevFrom),
    getTraffic(admin, from, to, prevFrom),
    admin.from('shops').select('id, name, created_at, subscription_plan, subscription_status').limit(MAX_ROWS),
    admin
      .from('orders')
      .select('shop_id, status, total_xof, created_at, paid_at')
      .gte('created_at', prevFrom.toISOString())
      .lte('created_at', to.toISOString())
      .limit(MAX_ROWS),
  ]);

  if (shopsResult.error) throw shopsResult.error;
  if (ordersResult.error) throw ordersResult.error;

  const shops = (shopsResult.data || []) as ShopRow[];
  const orders = (ordersResult.data || []) as OrderRow[];

  // Abonnements : photo de l'état actuel en base.
  const byStatus: Record<SubscriptionStatus, number> = { trialing: 0, active: 0, past_due: 0, canceled: 0, none: 0 };
  const byPlan = PLAN_KEYS.map((plan) => ({ plan, trialing: 0, active: 0, past_due: 0, canceled: 0 }));
  let mrr = 0;

  for (const shop of shops) {
    const status = toStatus(shop.subscription_status);
    byStatus[status]++;
    if (status === 'none') continue;
    const plan = toPlan(shop.subscription_plan);
    const row = byPlan.find((p) => p.plan === plan);
    if (row) row[status]++;
    if (status === 'active') mrr += PLAN_PRICES_XOF[plan];
  }

  // Commandes Mobile Money des boutiques.
  const shopNames = new Map(shops.map((s) => [s.id, s]));
  const mobileMoneyByDay = new Map<string, number>();
  const perShop = new Map<string, { orders: number; revenue: number }>();
  const activeShops = new Set<string>();
  let createdOrders = 0;
  let paidOrders = 0;
  let volume = 0;
  let volumePrevious = 0;

  for (const order of orders) {
    const current = inRange(order.created_at, from, to);
    if (current) {
      createdOrders++;
      activeShops.add(order.shop_id);
    }
    if (order.status !== 'paid') continue;

    const paidAt = order.paid_at || order.created_at;
    if (inRange(paidAt, from, to)) {
      paidOrders++;
      volume += order.total_xof;
      const key = dayKey(new Date(paidAt));
      mobileMoneyByDay.set(key, (mobileMoneyByDay.get(key) || 0) + order.total_xof);
      const stats = perShop.get(order.shop_id) || { orders: 0, revenue: 0 };
      stats.orders++;
      stats.revenue += order.total_xof;
      perShop.set(order.shop_id, stats);
    } else if (inRange(paidAt, prevFrom, from)) {
      volumePrevious += order.total_xof;
    }
  }

  const topShops: TopShop[] = Array.from(perShop.entries())
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 10)
    .map(([id, stats]) => {
      const shop = shopNames.get(id);
      return {
        id,
        name: shop?.name || 'Boutique sans nom',
        plan: toPlan(shop?.subscription_plan ?? null),
        orders: stats.orders,
        revenue: stats.revenue,
      };
    });

  // Série quotidienne pour les graphiques.
  const daily: DailyPoint[] = [];
  for (let d = new Date(from); d <= to; d.setUTCDate(d.getUTCDate() + 1)) {
    const key = dayKey(d);
    daily.push({
      date: key,
      signups: signups.days.get(key) || 0,
      visits: traffic.visitsByDay.get(key) || 0,
      visitors: traffic.visitorsByDay.get(key)?.size || 0,
      stripe: stripe.days.get(key) || 0,
      mobileMoney: mobileMoneyByDay.get(key) || 0,
    });
  }

  return {
    from: from.toISOString(),
    to: to.toISOString(),
    growth: {
      signups: signups.current,
      signupsPrevious: signups.previous,
      totalShops: shops.length,
      newShops: shops.filter((s) => inRange(s.created_at, from, to)).length,
      activeShops: activeShops.size,
    },
    subscriptions: { byPlan, byStatus, mrr },
    stripe: {
      available: stripe.available,
      testMode: (process.env.STRIPE_SECRET_KEY || '').startsWith('sk_test_'),
      revenue: stripe.revenue,
      revenuePrevious: stripe.previous,
      invoices: stripe.invoices,
    },
    mobileMoney: {
      paidOrders,
      volume,
      volumePrevious,
      createdOrders,
      averageBasket: paidOrders > 0 ? Math.round(volume / paidOrders) : 0,
    },
    traffic: {
      available: traffic.available,
      visits: traffic.visits,
      visitors: traffic.visitors,
      visitsPrevious: traffic.previous,
      topPages: traffic.topPages,
    },
    daily,
    topShops,
  };
}
