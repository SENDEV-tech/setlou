import { NextResponse } from "next/server";
import { handleShopWebhook } from "@/server/data/shop-wave";

export const dynamic = "force-dynamic";

// Webhook Wave d'une boutique. Le vendeur déclare cette adresse dans son portail
// Wave Business (Développeurs → Webhooks) avec l'événement checkout.session.completed,
// puis colle le « Signing secret » dans Setlou (Paramètres → Paiements).
export async function POST(req: Request, props: { params: Promise<{ hook: string }> }) {
  const { hook } = await props.params;
  // Corps brut obligatoire : la signature porte sur les octets reçus.
  const rawBody = await req.text();
  const result = await handleShopWebhook(hook, rawBody, req.headers.get("wave-signature"));
  if (result === "unknown") return new Response("Unknown webhook", { status: 404 });
  if (result === "invalid") return new Response("Invalid signature", { status: 401 });
  return NextResponse.json({ received: true });
}
