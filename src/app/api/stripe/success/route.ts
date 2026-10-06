import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder_key"
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
  apiVersion: "2025-03-31.basil" as any,
});

export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const session_id = searchParams.get("session_id");

  if (!session_id) {
    return NextResponse.redirect(`${origin}/abonnement`);
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === "paid" || session.status === "complete") {
      const shopId = session.client_reference_id || session.metadata?.shopId;
      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;

      if (shopId) {
        await supabaseAdmin
          .from("shops")
          .update({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            subscription_status: "active",
          })
          .eq("id", shopId);
      }

      // Vider le cache de Next.js
      revalidatePath("/", "layout");
      revalidatePath("/tableau-de-bord");

      return NextResponse.redirect(`${origin}/tableau-de-bord`, 303);
    } else {
      return NextResponse.redirect(`${origin}/abonnement`, 303);
    }
  } catch (error) {
    console.error("Error verifying checkout session in API:", error);
    return NextResponse.redirect(`${origin}/abonnement`, 303);
  }
}
