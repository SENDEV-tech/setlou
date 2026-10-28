import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

const IGNORED_PREFIXES = ["/admin", "/api", "/_next"];
const BOT_PATTERN = /bot|crawler|spider|crawling|preview|facebookexternalhit|whatsapp/i;

// Identifiant anonyme : change chaque jour, ne permet pas de retrouver l'IP.
function visitorHash(ip: string, userAgent: string): string {
  const day = new Date().toISOString().slice(0, 10);
  const salt = process.env.APP_ENCRYPTION_KEY || "setlou";
  return createHash("sha256").update(`${salt}|${day}|${ip}|${userAgent}`).digest("hex").slice(0, 32);
}

export async function POST(req: Request) {
  const userAgent = req.headers.get("user-agent") || "";
  if (BOT_PATTERN.test(userAgent)) return new NextResponse(null, { status: 204 });

  let path = "";
  let referrer: string | null = null;
  try {
    const body = (await req.json()) as { path?: unknown; referrer?: unknown };
    path = typeof body.path === "string" ? body.path.slice(0, 300) : "";
    referrer = typeof body.referrer === "string" && body.referrer ? body.referrer.slice(0, 300) : null;
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  if (!path.startsWith("/") || IGNORED_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    return new NextResponse(null, { status: 204 });
  }

  // Les liens de paiement contiennent un jeton : on ne garde que le préfixe.
  if (path.startsWith("/pay/")) path = "/pay/[token]";

  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || req.headers.get("x-real-ip") || "";

  const { error } = await createAdminClient()
    .from("page_views")
    .insert({ path, referrer, visitor_hash: visitorHash(ip, userAgent) });

  if (error) console.error("Error tracking page view:", error.message);

  return new NextResponse(null, { status: 204 });
}
