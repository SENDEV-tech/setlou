import { NextResponse } from "next/server";
import { applyWaveCheckout, verifyWaveWebhook, type WaveEvent } from "@/server/data/wave";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Une URL par boutique : chaque vendeur l'enregistre dans son portail Wave Business
// avec les événements checkout.session.completed et checkout.session.payment_failed.
export async function POST(req: Request, ctx: { params: Promise<{ shopId: string }> }) {
  const { shopId } = await ctx.params;
  if (!UUID_RE.test(shopId)) return new Response("Not found", { status: 404 });

  // Corps brut obligatoire : la signature porte sur les octets reçus.
  const rawBody = await req.text();
  const valid = await verifyWaveWebhook(shopId, rawBody, req.headers.get("wave-signature"));
  if (!valid) return new Response("Invalid signature", { status: 401 });

  let event: WaveEvent;
  try {
    event = JSON.parse(rawBody) as WaveEvent;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    await applyWaveCheckout(shopId, event.data);
  } else if (event.type === "checkout.session.payment_failed") {
    // La commande reste en attente : le client peut réessayer depuis son lien.
    console.log("Wave payment failed", event.data.id, event.data.client_reference);
  }

  return NextResponse.json({ received: true });
}
