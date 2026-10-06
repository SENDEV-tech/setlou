import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getCurrentShopId, getShop } from "@/server/data/supabase-store";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_fallback", {
  apiVersion: "2025-03-31.basil" as any,
});

async function handleCheckout(plan: string, origin: string) {
  try {
    const shopId = await getCurrentShopId();
    const shop = await getShop(shopId);

    if (!shop) {
      return NextResponse.json({ error: "Boutique non trouvée" }, { status: 404 });
    }

    let priceId = "";
    if (plan === "pro") {
      priceId = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID!;
    } else if (plan === "entreprise") {
      priceId = process.env.NEXT_PUBLIC_STRIPE_ENTREPRISE_PRICE_ID!;
    } else {
      return NextResponse.json({ error: "Plan invalide" }, { status: 400 });
    }

    // Prepare checkout session parameters
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/api/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/abonnement`,
      client_reference_id: shopId,
      metadata: {
        shopId: shopId,
      }
    };
    
    // Disable Managed Payments since the product lacks a tax code
    (sessionParams as any).managed_payments = { enabled: false };

    // If the shop already has a stripe customer ID, use it
    if (shop.stripe_customer_id) {
      sessionParams.customer = shop.stripe_customer_id;
    } else {
      sessionParams.customer_email = shop.email; // assuming shop has an email or we can use metadata
    }

    // Add 14 days trial if requested
    sessionParams.subscription_data = {
      trial_period_days: 14,
      metadata: {
        shopId: shopId,
      }
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.redirect(session.url as string, 303);
  } catch (error: any) {
    console.error("Stripe Checkout Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la session de paiement." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const formData = await req.formData();
  const plan = formData.get("plan") as string;
  const url = new URL(req.url);
  const origin = `${url.protocol}//${url.host}`;
  return handleCheckout(plan, origin);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const plan = searchParams.get("plan");
  const url = new URL(req.url);
  const origin = `${url.protocol}//${url.host}`;
  
  if (!plan) {
    return NextResponse.redirect(`${origin}/abonnement`);
  }
  
  return handleCheckout(plan, origin);
}
