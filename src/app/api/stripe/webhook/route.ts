import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_fallback", {
  apiVersion: "2025-03-31.basil" as any,
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

export async function POST(req: Request) {
  const payload = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event: Stripe.Event;

  try {
    if (!sig || !endpointSecret) return new Response("Webhook secret missing", { status: 400 });
    event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
  } catch (err: any) {
    console.error("Webhook Error:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const shopId = session.client_reference_id || session.metadata?.shopId;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (shopId) {
          // Mettre à jour la base de données de la boutique
          const { error } = await supabaseAdmin
            .from("shops")
            .update({
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              subscription_status: "active", // Ou 'trialing' selon l'API
            })
            .eq("id", shopId);

          if (error) console.error("Error updating shop after checkout:", error);
        }
        break;
      }
      
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as any;
        const status = subscription.status;
        const customerId = subscription.customer as string;
        const priceId = subscription.items?.data?.[0]?.price?.id || null;
        const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();

        // Mettre à jour la boutique correspondante
        const { error } = await supabaseAdmin
          .from("shops")
          .update({
            subscription_status: status,
            stripe_price_id: priceId,
            stripe_current_period_end: currentPeriodEnd,
          })
          .eq("stripe_customer_id", customerId);

        if (error) console.error("Error updating subscription status:", error);
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response("Webhook handler failed", { status: 500 });
  }

  return NextResponse.json({ received: true });
}
