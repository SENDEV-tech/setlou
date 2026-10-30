import { NextResponse } from "next/server";
import { applySubscriptionPayment, verifyWaveWebhook, type WaveEvent } from "@/server/data/wave";

export const dynamic = "force-dynamic";

// A déclarer dans le portail Wave Business (Développeurs → Webhooks, « Signing secret »)
// avec les événements checkout.session.completed et checkout.session.payment_failed.
export async function POST(req: Request) {
  // Corps brut obligatoire : la signature porte sur les octets reçus.
  const rawBody = await req.text();
  if (!verifyWaveWebhook(rawBody, req.headers.get("wave-signature"))) {
    return new Response("Invalid signature", { status: 401 });
  }

  let event: WaveEvent;
  try {
    event = JSON.parse(rawBody) as WaveEvent;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    await applySubscriptionPayment(event.data);
  } else if (event.type === "checkout.session.payment_failed") {
    console.log("Wave payment failed", event.data.id, event.data.client_reference);
  }

  return NextResponse.json({ received: true });
}
