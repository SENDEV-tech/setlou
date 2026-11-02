import 'server-only';

// Types (re-exported or redefined)
export type Role = 'owner' | 'assistant';
export type OrderStatus = 'pending' | 'verifying' | 'paid' | 'cancelled' | 'expired' | 'refunded';

// In a real application, we'd use actual logged-in user data.
import { createClient } from "@/utils/supabase/server";
import { getShopPlan, startOfMonthIso, UPGRADE_HINT, type ShopPlan } from "@/server/data/plan";

const PLAN_FIELDS = 'subscription_status, subscription_provider, subscription_plan, paid_until, monthly_orders_limit, max_assistants';

export async function getCurrentUserId(): Promise<string> {
  const supabaseServer = await createClient();
  const { data, error } = await supabaseServer.auth.getUser();
  if (error || !data.user) {
    throw new Error('Not authenticated.');
  }
  return data.user.id;
}

export async function getCurrentShopId(): Promise<string> {
  const userId = await getCurrentUserId();
  const supabaseServer = await createClient();
  const { data, error } = await supabaseServer.from('profiles').select('shop_id').eq('id', userId).single();
  if (error || !data) {
    throw new Error('No profile or shop found.');
  }
  return data.shop_id;
}

export async function getCurrentProfile() {
  const userId = await getCurrentUserId();
  const supabaseServer = await createClient();
  const { data, error } = await supabaseServer.from('profiles').select('*').eq('id', userId).single();
  if (error || !data) {
    throw new Error('No profile found.');
  }
  return data;
}

// --- SHOPS ---
export async function getShop(slugOrId?: string) {
  const supabaseServer = await createClient();
  let query = supabaseServer.from('shops').select('*');
  
  if (slugOrId) {
    // try to match UUID format roughly, otherwise assume slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
    if (isUUID) {
      query = query.eq('id', slugOrId);
    } else {
      query = query.eq('slug', slugOrId);
    }
  } else {
    // Fallback to getting current user's shop if no slug/id provided
    try {
      const shopId = await getCurrentShopId();
      query = query.eq('id', shopId);
    } catch {
      query = query.limit(1);
    }
  }
  
  const { data, error } = await query.single();
  if (error && error.code !== 'PGRST116') console.error('Error getShop:', error);
  return data;
}

export type PlanUsage = { ordersThisMonth: number, products: number };

// Formule de la boutique et ce qu'elle a consommé ce mois-ci.
export async function getPlanUsage(shopId?: string): Promise<{ plan: ShopPlan, usage: PlanUsage }> {
  const sid = shopId || await getCurrentShopId();
  const supabaseServer = await createClient();
  const [{ data: shop, error }, { count: ordersThisMonth }, { count: products }] = await Promise.all([
    supabaseServer.from('shops').select(PLAN_FIELDS).eq('id', sid).single(),
    supabaseServer.from('orders').select('id', { count: 'exact', head: true }).eq('shop_id', sid).gte('created_at', startOfMonthIso()),
    supabaseServer.from('products').select('id', { count: 'exact', head: true }).eq('shop_id', sid).is('archived_at', null),
  ]);
  if (error || !shop) throw error || new Error('Boutique introuvable.');
  return {
    plan: getShopPlan(shop),
    usage: { ordersThisMonth: ordersThisMonth || 0, products: products || 0 },
  };
}

export async function updateShopSettings(settings: any) {
  const shopId = await getCurrentShopId();
  const supabaseServer = await createClient();
  const { data, error } = await supabaseServer
    .from('shops')
    .update(settings)
    .eq('id', shopId)
    .select()
    .single();
    
  if (error) {
    console.error("updateShopSettings error:", error);
    throw error;
  }
  return data;
}

// --- PRODUCTS ---
export async function getProducts(shopId?: string) {
  const sid = shopId || await getCurrentShopId();
  const { data, error } = await (await createClient())
    .from('products')
    .select('*')
    .eq('shop_id', sid)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data || [];
}

export async function getProduct(id: string) {
  const { data, error } = await (await createClient()).from('products').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function createProduct(data: { name: string, description?: string, price: number, stock: number | null, image_path?: string }) {
  const shop_id = await getCurrentShopId();
  const created_by = await getCurrentUserId();

  // Formule gratuite : nombre de produits limité.
  const { plan, usage } = await getPlanUsage(shop_id);
  if (plan.products !== null && usage.products >= plan.products) {
    throw new Error(`Limite atteinte : la formule gratuite permet ${plan.products} produits. ${UPGRADE_HINT}`);
  }
  
  const product = {
    shop_id,
    created_by,
    name: data.name,
    description: data.description,
    price_xof: data.price,
    stock_quantity: data.stock,
    image_path: data.image_path
  };
  
  const { data: newProduct, error } = await (await createClient()).from('products').insert([product]).select().single();
  if (error) throw error;
  return newProduct;
}

export async function updateProduct(id: string, data: { name: string, description?: string, price: number, stock: number | null, image_path?: string }) {
  const updates: any = {
    name: data.name,
    description: data.description,
    price_xof: data.price,
    stock_quantity: data.stock,
  };
  if (data.image_path !== undefined) {
    updates.image_path = data.image_path;
  }
  
  const { data: updated, error } = await (await createClient()).from('products').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return updated;
}

// Produits dont le stock suivi est au niveau du seuil d'alerte ou en dessous.
export async function getLowStockProducts(shopId?: string) {
  const products = await getProducts(shopId);
  return products
    .filter(p => p.stock_quantity !== null && p.stock_quantity !== undefined && p.stock_quantity <= (p.low_stock_threshold ?? 3))
    .sort((a, b) => a.stock_quantity - b.stock_quantity);
}

export async function deleteProduct(id: string) {
  const { error } = await (await createClient()).from('products').delete().eq('id', id);
  if (error) throw error;
  return true;
}

// --- PROFILES ---
export async function getShopProfiles() {
  const sid = await getCurrentShopId();
  const { data, error } = await (await createClient())
    .from('profiles')
    .select('*')
    .eq('shop_id', sid)
    .order('created_at', { ascending: true });
    
  if (error) throw error;
  
  // Also get stats for each profile
  const { data: orders } = await (await createClient()).from('orders').select('created_by, status').eq('shop_id', sid);
  
  return (data || []).map(p => {
    const profileOrders = (orders || []).filter(o => o.created_by === p.id);
    const stats = {
      total: profileOrders.length,
      pending: profileOrders.filter(o => o.status === 'pending').length,
      paid: profileOrders.filter(o => o.status === 'paid').length,
      cancelled: profileOrders.filter(o => o.status === 'cancelled').length,
    };
    return { ...p, stats };
  });
}

export async function createProfile(data: { full_name: string, role: Role, username: string, whatsapp_number: string }) {
  const shop_id = await getCurrentShopId();
  const supabaseServer = await createClient();

  // Limite d'assistants selon la formule (gratuite ou abonnement en cours).
  if (data.role === 'assistant') {
    const { data: shop } = await supabaseServer
      .from('shops')
      .select(PLAN_FIELDS)
      .eq('id', shop_id)
      .single();
    const plan = shop ? getShopPlan(shop) : null;

    if (plan && plan.assistants !== null) {
      const { count: assistantCount } = await supabaseServer
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', shop_id)
        .eq('role', 'assistant');

      if ((assistantCount || 0) >= plan.assistants) {
        throw new Error(`Limite atteinte : votre formule ${plan.name} autorise au maximum ${plan.assistants} assistant${plan.assistants > 1 ? 's' : ''}. Passez au forfait Pro pour ajouter jusqu'à 5 assistants !`);
      }
    }
  }
  
  // Create Auth User via admin client
  const { createAdminClient } = await import('@/utils/supabase/admin');
  const adminClient = createAdminClient();
  
  const assistantEmail = `${data.username}@assistant.setlou.shop`;
  
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: assistantEmail,
    password: "setlou2026",
    email_confirm: true, // Auto-confirm
    user_metadata: { full_name: data.full_name }
  });

  if (authError) {
    throw new Error(`Erreur lors de la création du compte: ${authError.message}`);
  }
  
  const profile = {
    id: authData.user.id,
    shop_id,
    full_name: data.full_name,
    role: data.role,
    username: data.username,
    whatsapp_number: data.whatsapp_number,
    is_active: true,
    must_change_password: true
  };
  
  const { data: newProfile, error } = await (await createClient()).from('profiles').insert([profile]).select().single();
  if (error) {
    // Attempt rollback
    await adminClient.auth.admin.deleteUser(authData.user.id);
    throw error;
  }
  return newProfile;
}

export async function updateProfile(id: string, data: { full_name: string, role: Role, whatsapp_number: string }) {
  const { data: updated, error } = await (await createClient()).from('profiles').update(data).eq('id', id).select().single();
  if (error) throw error;
  return updated;
}

export async function deleteProfile(id: string) {
  const { error } = await (await createClient()).from('profiles').delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function getProfileStats(profileId: string) {
  const { data: orders, error } = await (await createClient())
    .from('orders')
    .select('status')
    .eq('created_by', profileId);
    
  if (error) throw error;
  
  const stats = {
    total: orders.length,
    paid: orders.filter(o => o.status === 'paid').length,
    pending: orders.filter(o => o.status === 'pending').length,
    cancelled: orders.filter(o => o.status === 'cancelled' || o.status === 'expired' || o.status === 'refunded').length,
  };
  return stats;
}

// --- ORDERS ---
export async function getOrders(status?: OrderStatus) {
  const sid = await getCurrentShopId();
  let query = (await createClient())
    .from('orders')
    .select(`
      *,
      order_items(*),
      creator:profiles!orders_created_by_fkey(id, full_name),
      customer:customers(id, phone, full_name)
    `)
    .eq('shop_id', sid)
    .order('created_at', { ascending: false });
    
  if (status) {
    query = query.eq('status', status);
  }
    
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getRecentOrders(shopId?: string, limit: number = 5) {
  const sid = shopId || await getCurrentShopId();
  const { data, error } = await (await createClient())
    .from('orders')
    .select(`
      *,
      order_items(*),
      profiles(full_name)
    `)
    .eq('shop_id', sid)
    .order('created_at', { ascending: false })
    .limit(limit);
    
  if (error) throw error;
  return data || [];
}

export async function getOrder(id: string) {
  const { data, error } = await (await createClient())
    .from('orders')
    .select(`
      *,
      order_items(*)
    `)
    .eq('id', id)
    .single();
    
  if (error) throw error;
  return data;
}

export async function getOrderByToken(token: string) {
  const { createAdminClient } = await import('@/utils/supabase/admin');
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from('orders')
    .select(`
      *,
      order_items(*),
      shop:shops(name, whatsapp_number, brand_color, logo_path, welcome_message, thank_you_message)
    `)
    .eq('token_hash', token)
    .single();
    
  if (error) throw error;
  return data;
}

export async function markOrderAsVerifying(token: string) {
  const { createAdminClient } = await import('@/utils/supabase/admin');
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from('orders')
    .update({ status: 'verifying' })
    .eq('token_hash', token)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createOrder(data: { customerName: string, customerPhone: string, items: { productId: string, quantity: number }[], deliveryFee: number }) {
  const shop_id = await getCurrentShopId();
  const created_by = await getCurrentUserId();
  
  const supabaseServer = await createClient();

  // Limite mensuelle de commandes selon la formule (gratuite ou abonnement en cours).
  const { plan, usage } = await getPlanUsage(shop_id);
  if (plan.monthlyOrders !== null && usage.ordersThisMonth >= plan.monthlyOrders) {
    throw new Error(plan.paid
      ? `Limite mensuelle atteinte : votre formule ${plan.name} est limitée à ${plan.monthlyOrders} commandes par mois. Passez au forfait Pro pour générer des liens de paiement en illimité !`
      : `Vous avez utilisé vos ${plan.monthlyOrders} commandes gratuites de ce mois. ${UPGRADE_HINT} Le compteur repart le 1er du mois.`);
  }

  // Handle Customer
  let customerId = null;
  const { data: customer } = await supabaseServer.from('customers').select('*').eq('shop_id', shop_id).eq('phone', data.customerPhone).single();
  if (!customer) {
    const { data: newCustomer, error: custErr } = await supabaseServer.from('customers').insert([{
      shop_id,
      phone: data.customerPhone,
      full_name: data.customerName,
    }]).select().single();
    if (custErr) throw custErr;
    customerId = newCustomer.id;
  } else {
    customerId = customer.id;
  }
  
  // Get products to calculate subtotal
  const { data: products } = await supabaseServer.from('products').select('*').in('id', data.items.map(i => i.productId));
  
  let subtotal = 0;
  const orderItems = [];
  for (const item of data.items) {
    const product = products?.find(p => p.id === item.productId);
    if (product) {
      const lineTotal = product.price_xof * item.quantity;
      subtotal += lineTotal;
      orderItems.push({
        product_id: product.id,
        product_name: product.name,
        unit_price_xof: product.price_xof,
        quantity: item.quantity,
        line_total_xof: lineTotal
      });
    }
  }
  
  // Réserver le stock avant de créer la commande (atomique côté base).
  const reserved: { productId: string, quantity: number }[] = [];
  for (const item of orderItems) {
    const { data: ok, error: stockErr } = await supabaseServer.rpc('decrement_product_stock', {
      p_product_id: item.product_id,
      p_quantity: item.quantity,
    });
    if (stockErr || !ok) {
      await restoreStock(supabaseServer, reserved);
      if (stockErr) throw stockErr;
      const product = products?.find(p => p.id === item.product_id);
      const left = product?.stock_quantity ?? 0;
      throw new Error(left > 0
        ? `Stock insuffisant pour « ${item.product_name} » : il n'en reste que ${left}.`
        : `« ${item.product_name} » est épuisé.`);
    }
    reserved.push({ productId: item.product_id, quantity: item.quantity });
  }

  const total = subtotal + data.deliveryFee;
  const { count } = await supabaseServer.from('orders').select('*', { count: 'exact', head: true }).eq('shop_id', shop_id);
  const orderCount = count || 0;
  
  const order = {
    shop_id,
    reference: `CMD-${(orderCount + 1).toString().padStart(5, '0')}`,
    created_by,
    customer_id: customerId,
    snapshot: { name: data.customerName, phone: data.customerPhone },
    subtotal_xof: subtotal,
    delivery_fee_xof: data.deliveryFee,
    discount_xof: 0,
    total_xof: total,
    status: 'pending',
    token_hash: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
    expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
  };
  
  // Insert Order
  const { data: newOrder, error: orderErr } = await supabaseServer.from('orders').insert([order]).select().single();
  if (orderErr) {
    await restoreStock(supabaseServer, reserved);
    throw orderErr;
  }
  
  // Insert Items
  const itemsToInsert = orderItems.map(i => ({ ...i, order_id: newOrder.id }));
  const { error: itemsErr } = await supabaseServer.from('order_items').insert(itemsToInsert);
  if (itemsErr) {
    await supabaseServer.from('orders').delete().eq('id', newOrder.id);
    await restoreStock(supabaseServer, reserved);
    throw itemsErr;
  }
  
  return newOrder;
}

async function restoreStock(supabaseServer: Awaited<ReturnType<typeof createClient>>, items: { productId: string, quantity: number }[]) {
  for (const item of items) {
    const { error } = await supabaseServer.rpc('increment_product_stock', {
      p_product_id: item.productId,
      p_quantity: item.quantity,
    });
    if (error) console.error('restoreStock error:', error);
  }
}

// Annule une commande non payée et remet ses articles en stock.
export async function cancelOrder(id: string) {
  const supabaseServer = await createClient();

  // Le filtre sur le statut garantit qu'une commande n'est remise en stock qu'une seule fois.
  const { data: cancelled, error } = await supabaseServer
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .in('status', ['pending', 'verifying'])
    .select('id, order_items(product_id, quantity)')
    .maybeSingle();
  if (error) throw error;
  if (!cancelled) throw new Error('Seules les commandes non payées peuvent être annulées.');

  await restoreStock(
    supabaseServer,
    (cancelled.order_items || [])
      .filter((i: any) => i.product_id)
      .map((i: any) => ({ productId: i.product_id, quantity: i.quantity }))
  );
  return cancelled;
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  const updates: any = { status };
  if (status === 'paid') {
    updates.paid_at = new Date().toISOString();
  }
  
  const { data, error } = await (await createClient()).from('orders').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteOrder(id: string) {
  const { error } = await (await createClient()).from('orders').delete().eq('id', id);
  if (error) throw error;
  return true;
}

// --- LIEN BOUTIQUE (page publique, sans utilisateur connecté) ---
export const SHOP_ORDER_MAX_ITEMS = 10;
export const SHOP_ORDER_MAX_QUANTITY = 20;

export async function getPublicShop(slug: string) {
  const { createAdminClient } = await import('@/utils/supabase/admin');
  const adminClient = createAdminClient();

  // '*' puis tri des champs : la page reste debout même si boutique_style.sql
  // n'a pas encore été exécuté, sans envoyer les champs privés au navigateur.
  const { data: row, error } = await adminClient
    .from('shops')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  if (!row) return null;

  const shop = {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    logo_path: (row.logo_path ?? null) as string | null,
    brand_color: (row.brand_color ?? null) as string | null,
    welcome_message: (row.welcome_message ?? null) as string | null,
    whatsapp_number: (row.whatsapp_number ?? null) as string | null,
    cover_path: (row.cover_path ?? null) as string | null,
    shop_tagline: (row.shop_tagline ?? null) as string | null,
    shop_style: (row.shop_style ?? null) as string | null,
  };

  const { data: products, error: productsErr } = await adminClient
    .from('products')
    .select('id, name, description, price_xof, image_path, stock_quantity')
    .eq('shop_id', shop.id)
    .is('archived_at', null)
    .order('created_at', { ascending: false });
  if (productsErr) throw productsErr;

  return { shop, products: products || [] };
}

// Commande passée par le client lui-même depuis le lien boutique.
export async function createShopOrder(data: { slug: string, customerName: string, customerPhone: string, items: { productId: string, quantity: number }[] }) {
  const { createAdminClient } = await import('@/utils/supabase/admin');
  const adminClient = createAdminClient();

  const { data: shop } = await adminClient
    .from('shops')
    .select(`id, ${PLAN_FIELDS}`)
    .eq('slug', data.slug)
    .maybeSingle();
  if (!shop) throw new Error('Boutique introuvable.');

  // Formule gratuite : les commandes des clients passent encore au-delà des 50 commandes
  // (jusqu'au plafond du lien boutique) pour que le vendeur ne perde pas de vente.
  const limit = getShopPlan(shop).shopLinkMonthlyOrders;
  if (limit !== null) {
    const { count: monthlyOrdersCount } = await adminClient
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('shop_id', shop.id)
      .gte('created_at', startOfMonthIso());
    if ((monthlyOrdersCount || 0) >= limit) {
      throw new Error("Cette boutique ne prend plus de commandes en ligne ce mois-ci. Contactez-la directement sur WhatsApp.");
    }
  }

  const { data: products } = await adminClient
    .from('products')
    .select('*')
    .eq('shop_id', shop.id)
    .is('archived_at', null)
    .in('id', data.items.map(i => i.productId));

  let subtotal = 0;
  const orderItems = [];
  for (const item of data.items) {
    const product = products?.find(p => p.id === item.productId);
    if (!product) throw new Error("Un des produits n'est plus disponible.");
    const lineTotal = product.price_xof * item.quantity;
    subtotal += lineTotal;
    orderItems.push({
      product_id: product.id,
      product_name: product.name,
      unit_price_xof: product.price_xof,
      quantity: item.quantity,
      line_total_xof: lineTotal
    });
  }

  const reserved: { productId: string, quantity: number }[] = [];
  const releaseAll = async () => {
    for (const r of reserved) {
      const { error } = await adminClient.rpc('release_shop_stock', { p_shop_id: shop.id, p_product_id: r.productId, p_quantity: r.quantity });
      if (error) console.error('release_shop_stock error:', error);
    }
  };

  for (const item of orderItems) {
    const { data: ok, error: stockErr } = await adminClient.rpc('reserve_shop_stock', {
      p_shop_id: shop.id,
      p_product_id: item.product_id,
      p_quantity: item.quantity,
    });
    if (stockErr || !ok) {
      await releaseAll();
      if (stockErr) throw stockErr;
      const left = products?.find(p => p.id === item.product_id)?.stock_quantity ?? 0;
      throw new Error(left > 0
        ? `Il ne reste que ${left} « ${item.product_name} ».`
        : `« ${item.product_name} » est épuisé.`);
    }
    reserved.push({ productId: item.product_id, quantity: item.quantity });
  }

  try {
    let customerId = null;
    const { data: customer } = await adminClient.from('customers').select('id').eq('shop_id', shop.id).eq('phone', data.customerPhone).maybeSingle();
    if (customer) {
      customerId = customer.id;
    } else {
      const { data: newCustomer, error: custErr } = await adminClient.from('customers').insert([{
        shop_id: shop.id,
        phone: data.customerPhone,
        full_name: data.customerName,
      }]).select('id').single();
      if (custErr) throw custErr;
      customerId = newCustomer.id;
    }

    const { count } = await adminClient.from('orders').select('*', { count: 'exact', head: true }).eq('shop_id', shop.id);
    const order = {
      shop_id: shop.id,
      reference: `CMD-${((count || 0) + 1).toString().padStart(5, '0')}`,
      created_by: null,
      customer_id: customerId,
      snapshot: { name: data.customerName, phone: data.customerPhone, source: 'boutique' },
      subtotal_xof: subtotal,
      delivery_fee_xof: 0,
      discount_xof: 0,
      total_xof: subtotal,
      status: 'pending',
      token_hash: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
    };

    const { data: newOrder, error: orderErr } = await adminClient.from('orders').insert([order]).select().single();
    if (orderErr) throw orderErr;

    const { error: itemsErr } = await adminClient.from('order_items').insert(orderItems.map(i => ({ ...i, order_id: newOrder.id })));
    if (itemsErr) {
      await adminClient.from('orders').delete().eq('id', newOrder.id);
      throw itemsErr;
    }

    return newOrder;
  } catch (error) {
    await releaseAll();
    throw error;
  }
}

// --- DASHBOARD ---
export async function getDashboardKPIs(shopId?: string, fromDate?: Date, toDate?: Date) {
  const sid = shopId || await getCurrentShopId();
  
  const to = toDate || new Date();
  const from = fromDate || new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  // Convert dates to ISO strings for Supabase queries
  const toIso = to.toISOString();
  const fromIso = from.toISOString();

  // Get all orders in date range
  const { data: orders, error } = await (await createClient())
    .from('orders')
    .select('*')
    .eq('shop_id', sid)
    .gte('created_at', fromIso)
    .lte('created_at', toIso);
    
  if (error) throw error;

  const paidOrders = orders.filter(o => o.status === 'paid');
  const revenue = paidOrders.reduce((sum, o) => sum + o.total_xof, 0);
  const sales = paidOrders.length;
  
  const statusStats = {
    paid: sales,
    pending: orders.filter(o => o.status === 'pending').length,
    cancelled: orders.filter(o => o.status === 'cancelled' || o.status === 'expired' || o.status === 'refunded').length,
  };

  // Get previous period
  const diffTime = to.getTime() - from.getTime();
  const prevTo = new Date(from.getTime() - 1);
  const prevFrom = new Date(prevTo.getTime() - diffTime);
  
  const { data: prevOrders } = await (await createClient())
    .from('orders')
    .select('*')
    .eq('shop_id', sid)
    .gte('created_at', prevFrom.toISOString())
    .lte('created_at', prevTo.toISOString())
    .eq('status', 'paid');
    
  const prevRevenue = prevOrders?.reduce((sum, o) => sum + o.total_xof, 0) || 0;
  const prevSales = prevOrders?.length || 0;
  
  const revenueVariation = prevRevenue === 0 ? 100 : Math.round(((revenue - prevRevenue) / prevRevenue) * 100);
  const salesVariation = prevSales === 0 ? 100 : Math.round(((sales - prevSales) / prevSales) * 100);

  // Time series
  const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24));
  const dataMap = new Map<string, number>();

  if (diffDays <= 31) {
    for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
      dataMap.set(dateStr, 0);
    }
    paidOrders.forEach(o => {
      if (o.paid_at) {
        const dateStr = new Date(o.paid_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
        if (dataMap.has(dateStr)) {
          dataMap.set(dateStr, dataMap.get(dateStr)! + o.total_xof);
        }
      }
    });
  } else {
    let d = new Date(from);
    d.setDate(1);
    const end = new Date(to);
    while (d <= end || (d.getMonth() === end.getMonth() && d.getFullYear() === end.getFullYear())) {
      const dateStr = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      dataMap.set(dateStr, 0);
      d.setMonth(d.getMonth() + 1);
    }
    paidOrders.forEach(o => {
      if (o.paid_at) {
        const dateStr = new Date(o.paid_at).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
        if (dataMap.has(dateStr)) {
          dataMap.set(dateStr, dataMap.get(dateStr)! + o.total_xof);
        }
      }
    });
  }

  const chartData = Array.from(dataMap.entries()).map(([date, revenue]) => ({ date, revenue }));

  return {
    revenue,
    revenueVariation,
    sales,
    salesVariation,
    statusStats,
    chartData
  };
}

// --- CHIFFRE D'AFFAIRES PAR PRODUIT ---
export interface ProductSales {
  productId: string | null;
  name: string;
  quantity: number;
  revenue: number;
  share: number;
}

interface PaidOrderItemsRow {
  order_items: {
    product_id: string | null;
    product_name: string;
    quantity: number;
    line_total_xof: number;
  }[] | null;
}

/** CA et quantités vendues par produit, sur les commandes payées de la période (même filtre que getDashboardKPIs). */
export async function getProductSales(shopId?: string, fromDate?: Date, toDate?: Date): Promise<ProductSales[]> {
  const sid = shopId || await getCurrentShopId();
  const to = toDate || new Date();
  const from = fromDate || new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);

  const { data, error } = await (await createClient())
    .from('orders')
    .select('order_items(product_id, product_name, quantity, line_total_xof)')
    .eq('shop_id', sid)
    .eq('status', 'paid')
    .gte('created_at', from.toISOString())
    .lte('created_at', to.toISOString());

  if (error) throw error;

  const byProduct = new Map<string, ProductSales>();
  let total = 0;
  for (const order of (data ?? []) as PaidOrderItemsRow[]) {
    for (const item of order.order_items ?? []) {
      const key = item.product_id ?? `nom:${item.product_name}`;
      const entry = byProduct.get(key) ?? { productId: item.product_id, name: item.product_name, quantity: 0, revenue: 0, share: 0 };
      entry.quantity += item.quantity;
      entry.revenue += item.line_total_xof;
      byProduct.set(key, entry);
      total += item.line_total_xof;
    }
  }

  return Array.from(byProduct.values())
    .map(p => ({ ...p, share: total > 0 ? Math.round((p.revenue / total) * 1000) / 10 : 0 }))
    .sort((a, b) => b.revenue - a.revenue);
}
