import 'server-only';
import { supabase } from '@/lib/supabase';

// Types (re-exported or redefined)
export type Role = 'owner' | 'assistant';
export type OrderStatus = 'pending' | 'paid' | 'cancelled' | 'expired' | 'refunded';

// In a real application, we'd use actual logged-in user data.
import { createClient } from "@/utils/supabase/server";

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
  let query = supabase.from('shops').select('*');
  
  if (slugOrId) {
    // try to match UUID format roughly, otherwise assume slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
    if (isUUID) {
      query = query.eq('id', slugOrId);
    } else {
      query = query.eq('slug', slugOrId);
    }
  } else {
    query = query.limit(1);
  }
  
  const { data, error } = await query.single();
  if (error && error.code !== 'PGRST116') console.error('Error getShop:', error);
  return data;
}

export async function updateShopSettings(settings: any) {
  const shopId = await getCurrentShopId();
  const { data, error } = await supabase
    .from('shops')
    .update(settings)
    .eq('id', shopId)
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

// --- PRODUCTS ---
export async function getProducts(shopId?: string) {
  const sid = shopId || await getCurrentShopId();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('shop_id', sid)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data || [];
}

export async function getProduct(id: string) {
  const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function createProduct(data: { name: string, description?: string, price: number, image_path?: string }) {
  const shop_id = await getCurrentShopId();
  const created_by = await getCurrentUserId();
  
  const product = {
    shop_id,
    created_by,
    name: data.name,
    description: data.description,
    price_xof: data.price,
    image_path: data.image_path
  };
  
  const { data: newProduct, error } = await supabase.from('products').insert([product]).select().single();
  if (error) throw error;
  return newProduct;
}

export async function updateProduct(id: string, data: { name: string, description?: string, price: number, image_path?: string }) {
  const updates: any = {
    name: data.name,
    description: data.description,
    price_xof: data.price,
  };
  if (data.image_path !== undefined) {
    updates.image_path = data.image_path;
  }
  
  const { data: updated, error } = await supabase.from('products').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return updated;
}

export async function deleteProduct(id: string) {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
  return true;
}

// --- PROFILES ---
export async function getShopProfiles() {
  const sid = await getCurrentShopId();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('shop_id', sid)
    .order('created_at', { ascending: true });
    
  if (error) throw error;
  
  // Also get stats for each profile
  const { data: orders } = await supabase.from('orders').select('created_by, status').eq('shop_id', sid);
  
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
  
  const { data: newProfile, error } = await supabase.from('profiles').insert([profile]).select().single();
  if (error) {
    // Attempt rollback
    await adminClient.auth.admin.deleteUser(authData.user.id);
    throw error;
  }
  return newProfile;
}

export async function updateProfile(id: string, data: { full_name: string, role: Role, whatsapp_number: string }) {
  const { data: updated, error } = await supabase.from('profiles').update(data).eq('id', id).select().single();
  if (error) throw error;
  return updated;
}

export async function deleteProfile(id: string) {
  const { error } = await supabase.from('profiles').delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function getProfileStats(profileId: string) {
  const { data: orders, error } = await supabase
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
  let query = supabase
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
  const { data, error } = await supabase
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
  const { data, error } = await supabase
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

export async function createOrder(data: { customerName: string, customerPhone: string, items: { productId: string, quantity: number }[], deliveryFee: number }) {
  const shop_id = await getCurrentShopId();
  const created_by = await getCurrentUserId();
  
  // Handle Customer
  let customerId = null;
  const { data: customer } = await supabase.from('customers').select('*').eq('shop_id', shop_id).eq('phone', data.customerPhone).single();
  if (!customer) {
    const { data: newCustomer, error: custErr } = await supabase.from('customers').insert([{
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
  const { data: products } = await supabase.from('products').select('*').in('id', data.items.map(i => i.productId));
  
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
  
  const total = subtotal + data.deliveryFee;
  const { count } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('shop_id', shop_id);
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
  const { data: newOrder, error: orderErr } = await supabase.from('orders').insert([order]).select().single();
  if (orderErr) throw orderErr;
  
  // Insert Items
  const itemsToInsert = orderItems.map(i => ({ ...i, order_id: newOrder.id }));
  const { error: itemsErr } = await supabase.from('order_items').insert(itemsToInsert);
  if (itemsErr) throw itemsErr;
  
  return newOrder;
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  const updates: any = { status };
  if (status === 'paid') {
    updates.paid_at = new Date().toISOString();
  }
  
  const { data, error } = await supabase.from('orders').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteOrder(id: string) {
  const { error } = await supabase.from('orders').delete().eq('id', id);
  if (error) throw error;
  return true;
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
  const { data: orders, error } = await supabase
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
  
  const { data: prevOrders } = await supabase
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
