import "server-only";

import { createAdminClient } from "@/utils/supabase/admin";

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_PHONE = 3;
const MAX_PER_IP = 10;

/**
 * Note une demande de code SMS et dit si elle dépasse la limite
 * (3 par numéro, 10 par IP, sur une heure). Chaque SMS est payé par Setlou.
 * Si la table n'existe pas encore (supabase/sms_limit.sql pas lancé), on laisse
 * passer : les limites propres à Supabase Auth s'appliquent quand même.
 */
export async function checkSmsLimit(phone: string, ip: string): Promise<{ allowed: boolean }> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - WINDOW_MS).toISOString();

  const [byPhone, byIp] = await Promise.all([
    admin
      .from("sms_code_requests")
      .select("id", { count: "exact", head: true })
      .eq("phone", phone)
      .gte("created_at", since),
    ip
      ? admin
          .from("sms_code_requests")
          .select("id", { count: "exact", head: true })
          .eq("ip", ip)
          .gte("created_at", since)
      : Promise.resolve({ count: 0, error: null }),
  ]);

  if (byPhone.error || byIp.error) {
    console.error("checkSmsLimit:", byPhone.error ?? byIp.error);
    return { allowed: true };
  }

  if ((byPhone.count ?? 0) >= MAX_PER_PHONE || (byIp.count ?? 0) >= MAX_PER_IP) {
    return { allowed: false };
  }

  const { error } = await admin.from("sms_code_requests").insert({ phone, ip });
  if (error) console.error("checkSmsLimit insert:", error);
  return { allowed: true };
}
